# main.py
import os
import uuid
import shutil
import threading
import json
from collections import defaultdict
from datetime import datetime

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse, FileResponse, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# internal modules
from settings import settings
from db import init_db, get_db

# ------------------ AUTH ROUTER IMPORT ------------------
from auth.routes import auth_router


from exp3 import VehicleCounterAPI
from analyze_report import ReportAnalyser
app = FastAPI(title="DeepTraaff Backend with MongoDB Auth + Video Processing")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],      # For production: restrict this
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register authentication router
app.include_router(auth_router)


# ================================================================
# 🎥 VIDEO PROCESSING SETUP
# ================================================================
UPLOAD_DIR = "uploads"
OUTPUT_DIR = "outputs"
BASE_JOB_DIR = "jobs"

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(BASE_JOB_DIR, exist_ok=True)

# Serve processed video if needed
app.mount("/output", StaticFiles(directory=OUTPUT_DIR), name="output")

# Active in-memory jobs
JOBS = {}

# Shared analyzer instance
report_analyzer = ReportAnalyser(jobs_dir=BASE_JOB_DIR)


# ================================================================
# 🔧 BACKGROUND PROCESS THREAD
# ================================================================
def _run_process(job_id: str):
    job = JOBS.get(job_id)
    if not job:
        return
    try:
        job.process()

        if getattr(job, "status", "") == "done":
            job.status = "completed"
    except Exception as e:
        job.status = "error"
        job.error_msg = str(e)


# ================================================================
# STARTUP / SHUTDOWN EVENTS
# ================================================================
@app.on_event("startup")
async def on_startup():
    # Initialize MongoDB connection using settings.mongodb_uri
    init_db()
    # any other startup tasks can go here


@app.on_event("shutdown")
async def on_shutdown():
    # Optionally close DB client - Motor client will close on process exit,
    # but you can implement explicit shutdown handling if needed.
    pass


# ================================================================
# 📤 START VIDEO PROCESSING
# ================================================================
@app.post("/process-video")
async def process_video(file: UploadFile = File(...)):
    _, ext = os.path.splitext(file.filename or "")
    ext = ext if ext else ".mp4"

    job_id = str(uuid.uuid4())
    input_path = os.path.join(UPLOAD_DIR, f"{job_id}{ext}")

    # Save uploaded file
    with open(input_path, "wb") as out_f:
        shutil.copyfileobj(file.file, out_f)

    # Initialize processing job
    counter = VehicleCounterAPI(input_video=input_path)
    counter.set_job_id(job_id)

    JOBS[job_id] = counter
    threading.Thread(target=_run_process, args=(job_id,), daemon=True).start()

    return {"job_id": job_id, "status": "processing_started"}


# ================================================================
# 📊 CHECK PROCESSING PROGRESS
# ================================================================
@app.get("/progress/{job_id}")
async def get_progress(job_id: str):
    job = JOBS.get(job_id)
    if not job:
        return JSONResponse({"status": "not_found"}, status_code=404)

    raw = job.get_progress() or {}
    p = float(raw.get("progress", 0)) / 100.0

    status = getattr(job, "status", "processing")
    if status == "done":
        status = "completed"

    return {
        "progress": round(p, 4),
        "status": status,
        "error": raw.get("error") or getattr(job, "error_msg", None),
    }


# ================================================================
# 📥 DOWNLOAD PROCESSED VIDEO
# ================================================================
@app.get("/download-video/{job_id}")
async def download_video(job_id: str):
    path = os.path.join(OUTPUT_DIR, f"{job_id}.mp4")

    if not os.path.exists(path):
        return JSONResponse({"error": "not_ready"}, status_code=404)

    return FileResponse(
        path,
        media_type="video/mp4",
        filename=f"{job_id}.mp4"
    )


# ================================================================
# 🧾 DOWNLOAD RESULT JSON
# ================================================================
@app.get("/download-json/{job_id}")
async def download_stats(job_id: str):
    path = os.path.join(OUTPUT_DIR, f"{job_id}.json")

    if not os.path.exists(path):
        return JSONResponse({"error": "not_ready"}, status_code=404)

    return FileResponse(
        path,
        media_type="application/json",
        filename=f"{job_id}.json"
    )


# ================================================================
# 📑 ANALYZE REPORT JSON → GENERATE CHARTS
# ================================================================
@app.post("/analyze-report-file")
async def analyze_report_file(file: UploadFile = File(...)):
    try:
        job_id = str(uuid.uuid4())
        job_folder = os.path.join(BASE_JOB_DIR, job_id)
        os.makedirs(job_folder, exist_ok=True)

        result_path = os.path.join(job_folder, "result.json")

        data_bytes = await file.read()

        # Validate JSON
        try:
            json.loads(data_bytes.decode())
        except Exception:
            raise HTTPException(status_code=400, detail="Uploaded file is not valid JSON")

        # Save JSON
        with open(result_path, "wb") as f:
            f.write(data_bytes)

        print("Saved report JSON:", result_path)

        # Generate charts
        chart_files = report_analyzer.generate_charts(job_id)

        print("Charts generated:", chart_files)

        return {
            "status": "success",
            "job_id": job_id,
            "charts": chart_files,
        }

    except Exception as e:
        print("ERROR in /analyze-report-file:", e)
        raise HTTPException(status_code=500, detail=str(e))


# ================================================================
# 🖼 SERVE GENERATED CHART IMAGES (CORS READY → REQUIRED FOR PDF)
# ================================================================
@app.get("/report/file/{job_id}/{chart_name}")
async def get_report_file(job_id: str, chart_name: str):
    chart_path = os.path.join(BASE_JOB_DIR, job_id, "charts", chart_name)

    print("Fetch chart:", chart_path)

    if not os.path.exists(chart_path):
        raise HTTPException(status_code=404, detail="Chart not found")

    with open(chart_path, "rb") as f:
        data = f.read()

    return Response(
        content=data,
        media_type="image/png",
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "*",
            "Cross-Origin-Resource-Policy": "cross-origin",
        }
    )
