"use client";

import React from "react";
import { Check, X, AlertTriangle, Shield, FileText } from "lucide-react";

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
        return { icon: Check, bg: "bg-emerald-50 text-status-success border-emerald-200" };
      case "rejected":
        return { icon: X, bg: "bg-red-50 text-status-error border-red-200" };
      case "changes_requested":
        return { icon: AlertTriangle, bg: "bg-amber-50 text-status-warning border-amber-200" };
      case "audited":
        return { icon: Shield, bg: "bg-teal/10 text-teal border-teal/20" };
      default:
        return { icon: FileText, bg: "bg-slate-100 text-ink-muted border-border" };
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-navy">Governance & Decision Audit Trail</h3>

      <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
        {events.map((evt) => {
          const badge = getBadge(evt.type);
          const Icon = badge.icon;
          return (
            <div key={evt.id} className="relative group">
              <div
                className={`absolute -left-6 top-1 w-5 h-5 rounded-full ${badge.bg} border flex items-center justify-center`}
              >
                <Icon className="w-3 h-3 shrink-0" />
              </div>
              <div className="bg-workspace border border-border p-3.5 rounded-xl hover:border-slate-300 transition shadow-subtle">
                <div className="flex items-center justify-between text-xs gap-2">
                  <span className="font-bold text-navy">{evt.title}</span>
                  <span className="text-ink-muted font-mono text-[10px] shrink-0">{evt.timestamp}</span>
                </div>
                <div className="text-[11px] text-teal font-semibold mt-0.5">By: {evt.actor}</div>
                {evt.details && (
                  <p className="text-xs text-ink-secondary mt-2 bg-surface p-2 rounded-lg border border-border leading-relaxed">
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
