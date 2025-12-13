import { useContext, useEffect, useState } from "react";
import { DataContext } from "../../context/DataContext";

// NEW imports (replace html2canvas)
import { toPng } from "html-to-image";
import jsPDF from "jspdf";

export default function AnalyzeReport() {
  const { reportJobId, reportCharts } = useContext(DataContext);
  const BASE_URL = "http://localhost:3000";

  const [isReady, setIsReady] = useState(false);

  // Wait for context to fully load
  useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), 200);
    return () => clearTimeout(timer);
  }, []);

  if (!isReady) {
    return (
      <div className="flex items-center justify-center h-screen text-lg font-semibold dark:text-white">
        Loading report...
      </div>
    );
  }

  // Check if data exists
  if (!reportJobId || !reportCharts) {
    return (
      <div className="flex flex-col items-center justify-center h-screen px-4 text-center">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-200">
          ⚠ No Report Available
        </h2>
        <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
          Please process a video first!
        </p>
      </div>
    );
  }

  // Human-readable labels
  const nameMap = {
    total_chart: "Total Vehicles",
    flow_chart: "Incoming vs Outgoing",
    class_pie: "Vehicle Class Distribution",
    peak_chart: "Congestion Time",
  };

  // ----------------------------------------------------------------
  // 📄 Download PDF Using html-to-image + jsPDF (100% working)
  // ----------------------------------------------------------------
  const downloadPDF = async () => {
    const element = document.getElementById("report-container");

    try {
      const imgData = await toPng(element, { cacheBust: true });

      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();

      // Maintain aspect ratio
      const imgProps = pdf.getImageProperties(imgData);
      const pdfHeight = (imgProps.height * pageWidth) / imgProps.width;

      pdf.addImage(imgData, "PNG", 0, 0, pageWidth, pdfHeight);
      pdf.save("traffic_report.pdf");

    } catch (err) {
      console.error("PDF Error:", err);
      alert("Failed to generate PDF.");
    }
  };

  // ----------------------------------------------------------------

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">

      {/* HEADER BUTTON ROW */}
      <div className="flex justify-end mb-6">
        <button
          onClick={downloadPDF}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow-md"
        >
          Download PDF
        </button>
      </div>

      {/* MAIN REPORT CONTENT */}
      <div id="report-container" className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
        
        <h2 className="text-4xl font-extrabold text-center text-blue-600 dark:text-yellow-400 mb-10">
          Traffic Analytics Report 📊
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {Object.keys(reportCharts).map((key) => (
            <div
              key={key}
              className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border dark:border-gray-700"
            >
              <h3 className="font-semibold text-xl mb-4 text-gray-800 dark:text-gray-200">
                {nameMap[key] ?? key}
              </h3>

              <img
                crossOrigin="anonymous"
                src={`${BASE_URL}/report/file/${reportJobId}/${reportCharts[key]}`}
                alt={key}
                className="rounded-lg w-full max-h-[380px] object-contain border dark:border-gray-700"
                onError={(e) => {
                  e.target.src = "";
                  e.target.alt = "⚠ Could not load chart";
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
