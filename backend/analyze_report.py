import json
import os
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
from collections import defaultdict


class ReportAnalyser:
    def __init__(self, jobs_dir="jobs"):
        self.jobs_dir = jobs_dir

    # --------------------------------------------------------
    # Load JSON file safely
    # --------------------------------------------------------
    def _load_json(self, job_id):
        json_path = os.path.join(self.jobs_dir, job_id, "result.json")
        if not os.path.exists(json_path):
            raise FileNotFoundError("result.json not found")

        with open(json_path, "r") as f:
            return json.load(f)

    # --------------------------------------------------------
    # Generate all charts
    # --------------------------------------------------------
    def generate_charts(self, job_id):
        data = self._load_json(job_id)

        out_dir = os.path.join(self.jobs_dir, job_id, "charts")
        os.makedirs(out_dir, exist_ok=True)

        results = {}

        # ==================================================
        # 1. TOTAL VEHICLE COUNT (total_chart.png)
        # ==================================================
        incoming = data.get("incoming_counts", {})
        outgoing = data.get("outgoing_counts", {})

        total_data = {
            "Two Wheeler": incoming.get("two_wheeler", 0) + outgoing.get("two_wheeler", 0),
            "Three Wheeler": incoming.get("three_wheeler", 0) + outgoing.get("three_wheeler", 0),
            "Four Wheeler": incoming.get("four_wheeler", 0) + outgoing.get("four_wheeler", 0),
        }

        plt.figure(figsize=(6, 4))
        plt.bar(total_data.keys(), total_data.values())
        plt.title("Total Vehicles Counted")
        plt.ylabel("Count")
        plt.tight_layout()

        filename = "total_chart.png"
        plt.savefig(os.path.join(out_dir, filename))
        plt.close()
        results["total_chart"] = filename

        # ==================================================
        # 2. INCOMING vs OUTGOING (flow_chart.png)
        # ==================================================
        categories = list(total_data.keys())
        incoming_vals = [
            incoming.get("two_wheeler", 0),
            incoming.get("three_wheeler", 0),
            incoming.get("four_wheeler", 0)
        ]
        outgoing_vals = [
            outgoing.get("two_wheeler", 0),
            outgoing.get("three_wheeler", 0),
            outgoing.get("four_wheeler", 0)
        ]

        x = np.arange(len(categories))  # positions
        width = 0.35  # width of each bar

        plt.figure(figsize=(6, 4))
        plt.bar(x - width/2, incoming_vals, width=width, label="Incoming")
        plt.bar(x + width/2, outgoing_vals, width=width, label="Outgoing")

        plt.xticks(x, categories)
        plt.title("Incoming vs Outgoing Vehicles")
        plt.ylabel("Count")
        plt.legend()
        plt.tight_layout()

        filename = "flow_chart.png"
        plt.savefig(os.path.join(out_dir, filename))
        plt.close()
        results["flow_chart"] = filename

        # ==================================================
        # 3. PIE CHART (class_pie.png)
        # ==================================================
        plt.figure(figsize=(6, 6))
        plt.pie(total_data.values(), labels=total_data.keys(), autopct="%1.1f%%")
        plt.title("Vehicle Class Distribution")
        plt.tight_layout()

        filename = "class_pie.png"
        plt.savefig(os.path.join(out_dir, filename))
        plt.close()
        results["class_pie"] = filename

        # ==================================================
        # 4. PEAK TRAFFIC TIMELINE (peak_chart.png)
        # ==================================================
        timeline_raw = data.get("vehicle_log", [])
        timeline = defaultdict(int)

        for log in timeline_raw:
            t = float(log.get("video_sec", 0))
            timeline[t] += 1

        times_secs = sorted(timeline.keys())
        counts = [timeline[t] for t in times_secs]

        # Convert timeline if above 3 minutes (180 sec)
        if times_secs and max(times_secs) > 180:
            times_display = [round(t / 60, 2) for t in times_secs]
            xlabel = "Time (minutes)"
        else:
            times_display = times_secs
            xlabel = "Time (seconds)"

        plt.figure(figsize=(7, 4))
        plt.plot(times_display, counts, marker="o")
        plt.title("Congestion Time")
        plt.xlabel(xlabel)
        plt.ylabel("Vehicles Count")
        plt.grid(True)
        plt.tight_layout()

        filename = "peak_chart.png"
        plt.savefig(os.path.join(out_dir, filename))
        plt.close()
        results["peak_chart"] = filename

        return results
