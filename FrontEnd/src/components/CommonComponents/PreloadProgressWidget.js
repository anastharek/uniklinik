import React, { useEffect, useState } from "react";
import preloadStore from "../../services/preloadStore";
import { toast } from "react-toastify";

/**
 * Floating progress widget - shows all active/queued preload jobs.
 * Mounted once in App.js so it survives page navigation.
 * Shows percentage per study + overall queue position.
 */
const PreloadProgressWidget = () => {
  const [jobs, setJobs] = useState({});

  useEffect(() => {
    const unsub = preloadStore.subscribe(setJobs);
    return unsub;
  }, []);

  const activeJobs = Object.values(jobs);
  if (!activeJobs.length) return null;

  const pct = (job) =>
    job.totalSeries > 0
      ? Math.min(100, Math.round((job.doneSeries / job.totalSeries) * 100))
      : 0;

  const short = (id) => (id ? id.slice(0, 8) : "?");

  return (
    <div
      style={{
        position: "fixed",
        bottom: 16,
        right: 16,
        zIndex: 9999,
        minWidth: 260,
        maxWidth: 340,
        background: "#fff",
        border: "1px solid #d0d5dd",
        borderRadius: 8,
        boxShadow: "0 6px 20px rgba(0,0,0,0.15)",
        padding: "12px 14px",
        fontFamily: "inherit",
        fontSize: 13,
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span>📥 Preloading ({activeJobs.length})</span>
        <span style={{ fontSize: 11, color: "#667085" }}>queued: {activeJobs.filter((j) => j.status === "queued").length}</span>
      </div>
      {activeJobs.map((job) => (
        <div key={job.studyId} style={{ marginBottom: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
            <span style={{ fontFamily: "monospace" }}>{short(job.studyId)}</span>
            <span style={{ color: "#475467" }}>
              {job.status === "queued"
                ? `queued #${job.queuePosition || "-"}`
                : `${job.doneSeries}/${job.totalSeries} · ${pct(job)}%`}
            </span>
          </div>
          {job.status === "running" && (
            <div style={{ height: 6, background: "#eaecf0", borderRadius: 3, marginTop: 4, overflow: "hidden" }}>
              <div
                style={{
                  height: "100%",
                  width: `${pct(job)}%`,
                  background: "#12b76a",
                  transition: "width 0.6s ease",
                }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default PreloadProgressWidget;
