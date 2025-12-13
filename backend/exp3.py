import cv2
import time
import json
import os
import torch
import numpy as np
import cvzone
from collections import defaultdict
from ultralytics import YOLO
from deep_sort_realtime.deepsort_tracker import DeepSort


class VehicleCounterAPI:
    """
    Per-job vehicle counter.
    - call set_job_id(job_id) before process()
    - process() writes outputs/<job_id>.mp4 and outputs/<job_id>.json
    - get_progress() returns {"progress": float, "status": str}
    """

    def __init__(self, input_video, model_path="best6_openvino_model640/", classes_path="classes.txt"):
        self.input_video = input_video
        self.model_path = model_path
        self.classes_path = classes_path

        # Will be set in set_job_id
        self.job_id = None
        self.temp_output = None
        self.final_output = None
        self.stats_file = None

        # ✅ Load YOLO model once
        try:
            self.model = YOLO(self.model_path, task="detect")
        except Exception:
            self.model = YOLO(self.model_path)

        self.tracker = DeepSort(max_age=30, n_init=3)

        # Class names
        if os.path.exists(self.classes_path):
            with open(self.classes_path, "r") as f:
                self.classnames = [l.strip() for l in f.readlines() if l.strip()]
        else:
            self.classnames = ["two_wheeler", "three_wheeler", "four_wheeler"]

        # Colors for classes
        np.random.seed(42)
        self.colors = np.random.randint(0, 255, size=(len(self.classnames), 3), dtype="uint8")

        # Counters
        self.incoming_counts = defaultdict(int)
        self.outgoing_counts = defaultdict(int)
        self.wheel_incoming = {"two_wheeler": 0, "three_wheeler": 0, "four_wheeler": 0}
        self.wheel_outgoing = {"two_wheeler": 0, "three_wheeler": 0, "four_wheeler": 0}

        self.counted_ids = set()
        self.vehicle_log = []  # store {id, type, direction, video_sec, ...}

        # Zones
        self.incoming_zone = np.array(
            [[888, 420], [1920, 420], [1920, 1080], [1600, 1080]], np.int32
        )
        self.outgoing_zone = np.array(
            [[200, 430], [820, 430], [1525, 1080], [0, 1080]], np.int32
        )

        # Progress / status
        self.total_frames = 0
        self.frame_count = 0
        self.progress = 0.0
        self.current_fps = 0.0
        self.status = "initialized"
        self.error_msg = None

        # Real video FPS (set in set_job_id)
        self.video_fps = 25.0

    # ------------------------------------------------------------------
    # JOB SETUP
    # ------------------------------------------------------------------
    def set_job_id(self, job_id):
        """Called by FastAPI for each upload job."""
        self.job_id = job_id
        os.makedirs("outputs", exist_ok=True)

        # ✅ One final output path; /download-video uses <job_id>.mp4
        self.final_output = f"outputs/{job_id}.mp4"
        self.temp_output = self.final_output  # keep attribute if used elsewhere
        self.stats_file = f"outputs/{job_id}.json"

        # Re-open input video
        self.cap = cv2.VideoCapture(self.input_video)
        self.total_frames = int(self.cap.get(cv2.CAP_PROP_FRAME_COUNT)) or 1

        w = int(self.cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        h = int(self.cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        fps = float(self.cap.get(cv2.CAP_PROP_FPS)) or 25.0

        # ✅ Store real video FPS for correct video time
        self.video_fps = fps

        fourcc = cv2.VideoWriter_fourcc(*"mp4v") # type: ignore
        self.out = cv2.VideoWriter(self.final_output, fourcc, fps, (w, h))

        # Reset state
        self.incoming_counts.clear()
        self.outgoing_counts.clear()
        self.wheel_incoming = {"two_wheeler": 0, "three_wheeler": 0, "four_wheeler": 0}
        self.wheel_outgoing = {"two_wheeler": 0, "three_wheeler": 0, "four_wheeler": 0}
        self.counted_ids.clear()
        self.vehicle_log = []

        self.frame_count = 0
        self.progress = 0.0
        self.status = "ready"
        self.error_msg = None

    # ------------------------------------------------------------------
    # PROGRESS
    # ------------------------------------------------------------------
    def get_progress(self):
        """FastAPI polls this."""
        return {
            "progress": round(self.progress, 2),
            "status": self.status,
            "error": self.error_msg,
        }

    # ------------------------------------------------------------------
    # UTILS
    # ------------------------------------------------------------------
    def compute_iou(self, boxA, boxB):
        xA = max(boxA[0], boxB[0])
        yA = max(boxA[1], boxB[1])
        xB = min(boxA[2], boxB[2])
        yB = min(boxA[3], boxB[3])
        inter = max(0, xB - xA) * max(0, yB - yA)
        areaA = max(0, (boxA[2] - boxA[0])) * max(0, (boxA[3] - boxA[1]))
        areaB = max(0, (boxB[2] - boxB[0])) * max(0, (boxB[3] - boxB[1]))
        denom = float(areaA + areaB - inter)
        return inter / denom if denom > 0 else 0.0

    def classify_wheels(self, cls_name):
        s = cls_name.lower()
        if "bike" in s or "motor" in s:
            return "two_wheeler"
        if "auto" in s or "rickshaw" in s:
            return "three_wheeler"
        return "four_wheeler"

    def save_stats(self):
        stats = {
            "incoming_counts": dict(self.incoming_counts),
            "outgoing_counts": dict(self.outgoing_counts),
            "Total_vehicles_counted": len(self.counted_ids),
            "avg_fps": round(self.current_fps, 2),
            "video_fps": round(self.video_fps, 2),
            "vehicle_log": self.vehicle_log,
        }
        with open(self.stats_file, "w") as f:
            json.dump(stats, f, indent=4)
        return stats

    # ------------------------------------------------------------------
    # MAIN PROCESS LOOP
    # ------------------------------------------------------------------
    def process(self):
        """Called in background inside FastAPI."""
        self.status = "running"
        try:
            while True:
                ret, frame = self.cap.read()
                if not ret:
                    break

                start = time.time()
                detections = []
                det_boxes = []

                # -----------------------------
                # Run YOLO on incoming + outgoing zones
                # -----------------------------
                for zone in [self.incoming_zone, self.outgoing_zone]:
                    x, y, w, h = cv2.boundingRect(zone)
                    roi = frame[y : y + h, x : x + w]
                    if roi.size == 0:
                        continue

                    device = "cuda" if torch.cuda.is_available() else "cpu"
                    results = self.model(roi, device=device, verbose=False)[0]

                    for box in results.boxes:
                        x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
                        conf = float(box.conf[0])
                        cls = int(box.cls[0])
                        if conf > 0.5:
                            fx1, fy1, fx2, fy2 = x1 + x, y1 + y, x2 + x, y2 + y
                            bc = ((fx1 + fx2) // 2, fy2)
                            if cv2.pointPolygonTest(zone, bc, False) >= 0:
                                detections.append(
                                    ([fx1, fy1, fx2 - fx1, fy2 - fy1], conf, cls)
                                )
                                det_boxes.append([fx1, fy1, fx2, fy2, cls])

                tracks = self.tracker.update_tracks(detections, frame=frame)

                # -----------------------------
                # Handle tracks
                # -----------------------------
                for tr in tracks:
                    if not tr.is_confirmed():
                        continue
                    x1, y1, x2, y2 = map(int, tr.to_ltrb())
                    cls_idx = tr.det_class
                    cls_name = self.classnames[cls_idx]
                    color = self.colors[cls_idx].tolist()

                    best_iou = 0.0
                    for d in det_boxes:
                        best_iou = max(best_iou, self.compute_iou([x1, y1, x2, y2], d[:4]))

                    if best_iou > 0.5:
                        # Draw bounding box & label
                        cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
                        label = f"ID:{tr.track_id} {cls_name} ({best_iou*100:.1f}%)"
                        cvzone.putTextRect(frame, label, [x1, y1 - 10], scale=1, colorR=color)

                    # ✅ true video time based on frame index and VIDEO fps
                    video_time_sec = round(self.frame_count / max(self.video_fps, 1.0), 2)

                    if tr.track_id not in self.counted_ids:
                        bc = ((x1 + x2) // 2, y2)
                        wheel = self.classify_wheels(cls_name)

                        if cv2.pointPolygonTest(self.incoming_zone, bc, False) >= 0:
                            self.incoming_counts[cls_name] += 1
                            self.wheel_incoming[wheel] += 1
                            self.counted_ids.add(tr.track_id)

                            self.vehicle_log.append(
                                {
                                    "vehicle_id": tr.track_id,
                                    "vehicle_type": cls_name,
                                    "direction": "incoming",
                                    "video_sec": video_time_sec,   # used by analyzer
                                    "timestamp_sec": video_time_sec,  # kept for compat
                                }
                            )

                        elif cv2.pointPolygonTest(self.outgoing_zone, bc, False) >= 0:
                            self.outgoing_counts[cls_name] += 1
                            self.wheel_outgoing[wheel] += 1
                            self.counted_ids.add(tr.track_id)

                            self.vehicle_log.append(
                                {
                                    "vehicle_id": tr.track_id,
                                    "vehicle_type": cls_name,
                                    "direction": "outgoing",
                                    "video_sec": video_time_sec,
                                    "timestamp_sec": video_time_sec,
                                }
                            )

                # -----------------------------
                # Progress & overlays
                # -----------------------------
                self.frame_count += 1
                elapsed = time.time() - start
                self.current_fps = 1 / elapsed if elapsed > 0 else 0
                self.progress = (self.frame_count / self.total_frames) * 100

                # FPS
                cv2.putText(
                    frame,
                    f"FPS: {self.current_fps:.2f}",
                    (20, 40),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.9,
                    (255, 255, 0),
                    2,
                )

                # Zones + labels
                cv2.polylines(frame, [self.incoming_zone], True, (0, 255, 0), 2)
                cv2.putText(
                    frame,
                    "Incoming",
                    (self.incoming_zone[0][0], self.incoming_zone[0][1] - 10),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.8,
                    (0, 255, 0),
                    2,
                )

                cv2.polylines(frame, [self.outgoing_zone], True, (0, 0, 255), 2)
                cv2.putText(
                    frame,
                    "Outgoing",
                    (self.outgoing_zone[0][0], self.outgoing_zone[0][1] - 10),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.8,
                    (0, 0, 255),
                    2,
                )

                # Incoming summary
                y0 = 80
                line_gap = 25
                cv2.putText(
                    frame,
                    "Incoming Vehicles:",
                    (20, y0),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    1,
                    (0, 255, 0),
                    2,
                )
                k = 1
                for cls, cnt in self.incoming_counts.items():
                    cv2.putText(
                        frame,
                        f"- {cls}: {cnt}",
                        (20, y0 + k * line_gap),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        1,
                        (0, 255, 0),
                        2,
                    )
                    k += 1

                # Outgoing summary
                y1 = y0 + (k + 1) * line_gap
                cv2.putText(
                    frame,
                    "Outgoing Vehicles:",
                    (20, y1),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    1,
                    (0, 0, 255),
                    2,
                )
                m = 1
                for cls, cnt in self.outgoing_counts.items():
                    cv2.putText(
                        frame,
                        f"- {cls}: {cnt}",
                        (20, y1 + m * line_gap),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        1,
                        (0, 0, 255),
                        2,
                    )
                    m += 1

                # Wheel counts summary
                y2 = y1 + (m + 2) * line_gap
                cv2.putText(
                    frame,
                    "Total Incoming:",
                    (20, y2),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    1,
                    (0, 255, 255),
                    2,
                )
                cv2.putText(
                    frame,
                    f"{sum(self.wheel_incoming.values())}",
                    (250, y2),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    1,
                    (0, 255, 255),
                    2,
                )

                cv2.putText(
                    frame,
                    "Total Outgoing:",
                    (20, y2 + line_gap),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    1,
                    (0, 255, 255),
                    2,
                )
                cv2.putText(
                    frame,
                    f"{sum(self.wheel_outgoing.values())}",
                    (250, y2 + line_gap),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    1,
                    (0, 255, 255),
                    2,
                )

                # Write frame to output video
                self.out.write(frame)

            # -----------------------------
            # Finish
            # -----------------------------
            self.cap.release()
            self.out.release()
            stats = self.save_stats()

            self.status = "done"
            self.progress = 100
            return {
                "output_video": self.final_output,
                "stats_json": self.stats_file,
                "stats": stats,
            }

        except Exception as e:
            self.status = "error"
            self.error_msg = str(e)
            try:
                self.cap.release()
            except:
                pass
            try:
                self.out.release()
            except:
                pass
            try:
                self.save_stats()
            except:
                pass
            return {"error": str(e)}
