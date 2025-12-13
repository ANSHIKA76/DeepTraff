// src/context/DataContext.js
import { createContext, useState, useEffect } from "react";

export const DataContext = createContext();

export function DataProvider({ children }) {
  // Load from sessionStorage
  const load = (key, defaultValue = null) => {
    const saved = sessionStorage.getItem(key);
    if (!saved) return defaultValue;
    try {
      return JSON.parse(saved);
    } catch {
      return saved;
    }
  };

  // Save into sessionStorage
  const save = (key, value) => {
    sessionStorage.setItem(
      key,
      typeof value === "object" && value !== null ? JSON.stringify(value) : String(value)
    );
  };

  // ---------------------------------------
  // VIDEO PROCESSING STATE (session-based)
  // ---------------------------------------
  const [videoFile, setVideoFile] = useState(load("videoFile"));
  const [videoURL, setVideoURL] = useState(load("videoURL"));

  const [jobId, setJobId] = useState(load("jobId"));
  const [progress, setProgress] = useState(load("progress"));
  const [status, setStatus] = useState(load("status", "idle"));
  const [downloadUrl, setDownloadUrl] = useState(load("downloadUrl"));
  const [successMsg, setSuccessMsg] = useState("");

  // ---------------------------------------
  // REPORT DATA (session-based)
  // ---------------------------------------
  const [reportJobId, setReportJobId] = useState(load("reportJobId"));
  const [reportCharts, setReportCharts] = useState(load("reportCharts"));

  // Persist changes to sessionStorage
  useEffect(() => save("videoFile", videoFile), [videoFile]);
  useEffect(() => save("videoURL", videoURL), [videoURL]);

  useEffect(() => save("jobId", jobId), [jobId]);
  useEffect(() => save("progress", progress), [progress]);
  useEffect(() => save("status", status), [status]);
  useEffect(() => save("downloadUrl", downloadUrl), [downloadUrl]);

  useEffect(() => save("reportJobId", reportJobId), [reportJobId]);
  useEffect(() => save("reportCharts", reportCharts), [reportCharts]);

  // Optional helper to clear whole session state maintained by context
  const clearSessionState = () => {
    const keys = [
      "videoFile",
      "videoURL",
      "jobId",
      "progress",
      "status",
      "downloadUrl",
      "reportJobId",
      "reportCharts",
    ];
    keys.forEach((k) => sessionStorage.removeItem(k));

    // reset local state
    setVideoFile(undefined);
    setVideoURL(undefined);
    setJobId(undefined);
    setProgress(undefined);
    setStatus("idle");
    setDownloadUrl(undefined);
    setReportJobId(undefined);
    setReportCharts(undefined);
    setSuccessMsg("");
  };

  return (
    <DataContext.Provider
      value={{
        // VIDEO PROCESSING
        videoFile,
        setVideoFile,
        videoURL,
        setVideoURL,

        jobId,
        setJobId,
        progress,
        setProgress,
        status,
        setStatus,
        downloadUrl,
        setDownloadUrl,
        successMsg,
        setSuccessMsg,

        // REPORT
        reportJobId,
        setReportJobId,
        reportCharts,
        setReportCharts,

        // Utility
        clearSessionState,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}
