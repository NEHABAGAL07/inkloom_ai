"use client";

import React from "react";

interface TimelineEvent {
  id: string;
  type: "submitted" | "audited" | "changes_requested" | "approved" | "rejected";
  title: string;
  actor: string;
  timestamp: string;
  details?: string;
}

const SAMPLE_EVENTS: TimelineEvent[] = [
  {
    id: "evt_004",
    type: "changes_requested",
    title: "Reviewer Requested Revision",
    actor: "Jane Reviewer (Compliance Officer)",
    timestamp: "2026-10-22 17:05 UTC",
    details: "Replace deprecated Cloud Suite name and benchmark latency claim.",
  },
  {
    id: "evt_003",
    type: "audited",
    title: "AI Audit Pass Completed (Score: 74.5/100)",
    actor: "AIAuditEngine (v0.1.0-alpha)",
    timestamp: "2026-10-22 17:00 UTC",
    details: "Detected 4 findings: 2 high, 1 medium, 1 low severity.",
  },
  {
    id: "evt_002",
    type: "submitted",
    title: "Content Submission Ingested",
    actor: "Sarah Chen (Marketing)",
    timestamp: "2026-10-22 16:58 UTC",
    details: "Draft copy submitted with 320 words.",
  },
];

export function AuditTrailTimeline({ events = SAMPLE_EVENTS }: { events?: TimelineEvent[] }) {
  const getBadge = (type: TimelineEvent["type"]) => {
    switch (type) {
      case "approved":
        return { icon: "✓", bg: "bg-emerald-500", text: "text-emerald-400" };
      case "rejected":
        return { icon: "✕", bg: "bg-rose-500", text: "text-rose-400" };
      case "changes_requested":
        return { icon: "✏️", bg: "bg-amber-500", text: "text-amber-400" };
      case "audited":
        return { icon: "🛡️", bg: "bg-indigo-500", text: "text-indigo-400" };
      default:
        return { icon: "📄", bg: "bg-slate-500", text: "text-slate-400" };
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-slate-200">Governance & Decision Audit Trail</h3>

      <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
        {events.map((evt) => {
          const badge = getBadge(evt.type);
          return (
            <div key={evt.id} className="relative group">
              <div
                className={`absolute -left-6 top-1 w-5 h-5 rounded-full ${badge.bg}/20 border border-${badge.bg} flex items-center justify-center text-[10px]`}
              >
                {badge.icon}
              </div>
              <div className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-xl hover:border-slate-700 transition">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white">{evt.title}</span>
                  <span className="text-slate-500 font-mono text-[10px]">{evt.timestamp}</span>
                </div>
                <div className="text-[11px] text-indigo-400 font-medium mt-0.5">By: {evt.actor}</div>
                {evt.details && (
                  <p className="text-xs text-slate-400 mt-2 bg-slate-950/60 p-2 rounded border border-slate-800/60">
                    {evt.details}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
