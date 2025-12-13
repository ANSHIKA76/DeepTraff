// src/components/DataInput/DataInput.jsx
import { useContext, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Upload, Video, PlayCircle, Loader2, BarChart3, X } from "lucide-react";
import { DataContext } from "../../context/DataContext";

export default function DataInput() {
  const navigate = useNavigate();

  const {
    // from context (sessionStorage-backed)
    videoFile, setVideoFile,
    videoURL, setVideoURL,
    jobId, setJobId,
    progress, setProgress,
    status, setStatus,
    downloadUrl, setDownloadUrl,
    successMsg, setSuccessMsg,

    // report context
    setReportJobId,
    setReportCharts,
  } = useContext(DataContext);

  const API_BASE = "http://localhost:3000";

  // keep polling handle so we can clear it safely
  const pollRef = useRef(null);

  // cleanup object URL on unmount or when videoFile changes
  useEffect(() => {
    return () => {
      if (videoURL) {
        try {
          URL.revokeObjectURL(videoURL);
        } catch {}
      }
      // clear any running poll
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reset ONLY processing-related data
  const resetData = () => {
    // Keep videoFile/videoURL if we only want to restart processing
    setJobId(null);
    setProgress(null);
    setStatus("idle");
    setDownloadUrl(null);
    setSuccessMsg("");
    // stop any running poll
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  // Select video
  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) {
      return;
    }
    if (!f.type.startsWith("video/")) {
      alert("Invalid video file. Please select a video.");
      return;
    }

    // remove previous object URL if present
    if (videoURL) {
      try {
        URL.revokeObjectURL(videoURL);
      } catch {}
    }

    // set new video and reset processing state
    setVideoFile(f);
    setVideoURL(URL.createObjectURL(f));
    resetData();
    setSuccessMsg("Video selected!");
  };

  // Upload video → process
  const handleUpload = async () => {
    if (!videoFile) {
      return alert("Select a video first.");
    }

    const fd = new FormData();
    fd.append("file", videoFile);

    setStatus("uploading");
    setProgress("Starting...");

    try {
      const res = await fetch(`${API_BASE}/process-video`, {
        method: "POST",
        body: fd,
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Upload failed: ${res.status} ${text}`);
      }

      const data = await res.json();
      const jid = data?.job_id;
      if (!jid) {
        throw new Error("Server returned no job_id");
      }

      setJobId(jid);
      setStatus("processing");
      setProgress("0.0%");

      // start polling
      startPolling(jid);

    } catch (err) {
      console.error("Upload error:", err);
      alert("Upload failed: " + (err.message || err));
      setStatus("idle");
      setProgress(null);
    }
  };

  // Start polling (prevents duplicate polls)
  const startPolling = (jid) => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }

    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/progress/${jid}`);
        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(`Progress fetch failed: ${res.status} ${text}`);
        }
        const data = await res.json();

        if (data.status === "not_found") {
          clearInterval(pollRef.current);
          pollRef.current = null;
          setStatus("error");
          alert("Job not found on server.");
          return;
        }

        // data.progress is 0..1 in your backend; show percent string
        const percent = typeof data.progress === "number" ? (data.progress * 100) : null;
        setProgress(percent !== null ? `${percent.toFixed(1)}%` : data.progress || null);
        setStatus(data.status);

        if (data.status === "completed") {
          clearInterval(pollRef.current);
          pollRef.current = null;

          setDownloadUrl(`${API_BASE}/download-video/${jid}`);
          setSuccessMsg("Processing completed!");

          // Auto-analyze JSON
          autoAnalyze(jid);
        }

        if (data.status === "error") {
          clearInterval(pollRef.current);
          pollRef.current = null;
          alert("Server reported an error during processing.");
          setStatus("error");
        }
      } catch (err) {
        console.error("Polling error:", err);
        clearInterval(pollRef.current);
        pollRef.current = null;
        setStatus("error");
      }
    }, 2000);
  };

  // Cancel current polling / processing client-side
  const handleCancel = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    // client-side only: the server job will still run unless you implement a cancel endpoint
    setStatus("idle");
    setProgress(null);
    setSuccessMsg("Processing cancelled.");
  };

  // Upload JSON → analyzer
  const autoAnalyze = async (jid) => {
    try {
      const jsonRes = await fetch(`${API_BASE}/download-json/${jid}`);
      if (!jsonRes.ok) {
        throw new Error(`Failed to download json: ${jsonRes.status}`);
      }
      const jsonData = await jsonRes.json();

      const blob = new Blob([JSON.stringify(jsonData)], {
        type: "application/json",
      });

      const fd = new FormData();
      fd.append("file", blob, "result.json");

      const analyzeRes = await fetch(`${API_BASE}/analyze-report-file`, {
        method: "POST",
        body: fd,
      });

      if (!analyzeRes.ok) {
        const text = await analyzeRes.text().catch(() => "");
        throw new Error(`Analyzer failed: ${analyzeRes.status} ${text}`);
      }

      const analyzeData = await analyzeRes.json();

      setReportJobId(analyzeData.job_id);
      setReportCharts(analyzeData.charts);

      navigate("/analyzereport");
    } catch (err) {
      console.error("Analyzer error:", err);
      alert("Analysis failed: " + (err.message || err));
    }
  };

  return (
    <motion.div
      className="flex flex-col items-center py-10 px-4 text-center min-h-screen
      bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      <motion.h2
        className="text-4xl font-extrabold mb-4 text-blue-600 dark:text-blue-400"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        Data Input Portal
      </motion.h2>

      <motion.div
        className="mt-10 bg-white/30 dark:bg-gray-800/50 backdrop-blur-xl border 
        border-white/20 p-8 rounded-3xl shadow-2xl w-full max-w-lg
        flex flex-col items-center"
        whileHover={{ scale: 1.02 }}
      >
        <label
          htmlFor="videoUpload"
          className="cursor-pointer w-full border-2 border-dashed border-blue-400 
          dark:border-blue-500 rounded-2xl p-10 flex flex-col items-center"
        >
          <Upload className="w-10 h-10 mb-3" />
          <p>{videoFile ? "Change Video" : "Click to Upload Video"}</p>
          <input
            id="videoUpload"
            type="file"
            accept="video/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>

        {successMsg && (
          <p className="mt-3 text-green-600 font-semibold animate-pulse">
            {successMsg}
          </p>
        )}

        {videoFile && (
          <motion.div className="mt-6 w-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
              <Video className="w-4 h-4" />
              <span className="truncate max-w-xs">{videoFile.name}</span>
            </div>

            <video src={videoURL} controls className="mt-4 w-full rounded-xl shadow-md" />

            {/* Process Video */}
            <div className="flex justify-center mt-6 gap-3">
              <button
                onClick={handleUpload}
                disabled={status === "processing" || status === "uploading"}
                className="bg-blue-600 text-white py-3 px-6 rounded-xl shadow-md flex gap-2 justify-center items-center disabled:opacity-60"
              >
                {status === "processing" || status === "uploading" ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <PlayCircle />
                )}
                {status === "processing" || status === "uploading"
                  ? "Processing..."
                  : "Process Video"}
              </button>

              {/* Cancel polling */}
              <button
                onClick={handleCancel}
                className="bg-gray-200 text-gray-800 py-3 px-4 rounded-xl shadow-sm flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            </div>

            {progress && <p className="mt-3 text-blue-600">Progress: {progress}</p>}

            {downloadUrl && (
              <div className="mt-6 flex flex-col gap-3 items-center">
                <a
                  href={downloadUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-green-600 text-white py-2 px-4 rounded-lg shadow-md"
                >
                  Download Processed Video
                </a>

                <a
                  href={`${API_BASE}/download-json/${jobId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-purple-600 text-white py-2 px-4 rounded-lg shadow-md"
                >
                  Download JSON
                </a>

                <button
                  onClick={() => navigate("/analyzereport")}
                  className="bg-orange-600 text-white py-2 px-4 rounded-lg shadow-md flex gap-2"
                >
                  <BarChart3 /> View Report
                </button>
              </div>
            )}
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}
