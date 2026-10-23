"use client";

import React, { useState } from "react";
import { Finding, FindingSeverity } from "@/types";
import { DiffViewer } from "./DiffViewer";

interface FindingCardProps {
  finding: Finding;
  onStatusChange?: (findingId: string, newStatus: string) => void;
}

export function FindingCard({ finding, onStatusChange }: FindingCardProps) {
  const [currentStatus, setCurrentStatus] = useState(finding.status);

  const getSeverityStyle = (severity: FindingSeverity) => {
    switch (severity) {
      case "critical":
        return "bg-rose-950/80 text-rose-300 border-rose-800/80";
      case "high":
        return "bg-amber-950/80 text-amber-300 border-amber-800/80";
      case "medium":
        return "bg-sky-950/80 text-sky-300 border-sky-800/80";
      case "low":
        return "bg-slate-800 text-slate-300 border-slate-700";
      default:
        return "bg-slate-800 text-slate-400 border-slate-700";
    }
  };

  const getCategoryLabel = (category: string) => {
    return category
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  };

  const handleAction = (status: string) => {
    setCurrentStatus(status as any);
    if (onStatusChange) onStatusChange(finding.id, status);
  };

  const isAccepted = currentStatus === "accepted";
  const isDismissed = currentStatus === "dismissed";

  return (
    <div
      className={`glass-panel rounded-xl p-5 border transition-all ${
        isAccepted
          ? "border-emerald-600/40 bg-emerald-950/10"
          : isDismissed
          ? "opacity-50 border-slate-800"
          : "border-slate-800 hover:border-slate-700"
      }`}
    >
      {/* Top Meta Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          {/* Severity Badge */}
          <span
            className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wide border ${getSeverityStyle(
              finding.severity
            )}`}
          >
            {finding.severity}
          </span>

          {/* Category Tag */}
          <span className="text-xs text-indigo-400 font-semibold bg-indigo-950/40 border border-indigo-800/40 px-2 py-0.5 rounded">
            {getCategoryLabel(finding.category)}
          </span>

          {/* Human Review Marker */}
          {finding.requires_human_review && (
            <span className="text-[10px] font-bold text-amber-400 bg-amber-950/60 border border-amber-800/50 px-2 py-0.5 rounded flex items-center gap-1">
              <span>⚠️</span> Mandatory Review
            </span>
          )}
        </div>

        {/* Confidence Meter */}
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>Confidence:</span>
          <div className="w-16 bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-indigo-500 h-full rounded-full"
              style={{ width: `${Math.round(finding.confidence * 100)}%` }}
            ></div>
          </div>
          <span className="font-mono text-slate-300 font-semibold">
            {Math.round(finding.confidence * 100)}%
          </span>
        </div>
      </div>

      {/* Title & Message */}
      <h3 className="text-base font-bold text-white tracking-tight">{finding.title}</h3>
      <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">{finding.message}</p>

      {/* Source Citation & Benchmark Verification Badge */}
      {finding.source_reference && (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-400 bg-slate-900/60 px-3 py-2 rounded-lg border border-slate-800">
          <span className="font-semibold text-slate-300">Rule Reference:</span>
          <span className="text-slate-200">{finding.source_reference.rule_name}</span>
          {finding.source_reference.section && (
            <span className="text-slate-400">({finding.source_reference.section})</span>
          )}

          {/* Verification Status Pill */}
          {finding.source_reference.verification_status === "verified" && (
            <span className="ml-auto bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 px-2 py-0.5 rounded text-[10px] font-bold">
              ✓ Verified Citation
            </span>
          )}
          {finding.source_reference.verification_status === "unverified" && (
            <span className="ml-auto bg-amber-950/60 text-amber-400 border border-amber-800/40 px-2 py-0.5 rounded text-[10px] font-bold">
              ⚠️ Unverified in Benchmark Registry
            </span>
          )}
          {finding.source_reference.verification_status === "contradicted" && (
            <span className="ml-auto bg-rose-950/60 text-rose-400 border border-rose-800/40 px-2 py-0.5 rounded text-[10px] font-bold">
              ❌ Contradicted by Benchmark Data
            </span>
          )}

          {finding.source_reference.source_url && (
            <a
              href={finding.source_reference.source_url}
              target="_blank"
              rel="noreferrer"
              className="text-indigo-400 hover:underline text-[11px]"
            >
              [View Guideline]
            </a>
          )}
        </div>
      )}

      {/* Proposed Intent-Preserving Correction */}
      <DiffViewer originalText={finding.evidence} correction={finding.suggested_correction} />

      {/* Review Actions */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
        <span className="text-[11px] text-slate-400 font-mono">Status: {currentStatus}</span>

        <div className="flex items-center gap-2">
          {isAccepted ? (
            <span className="text-xs text-emerald-400 font-semibold">✓ Correction Accepted</span>
          ) : isDismissed ? (
            <span className="text-xs text-slate-400">Dismissed</span>
          ) : (
            <>
              <button
                onClick={() => handleAction("dismissed")}
                className="px-3 py-1 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
              >
                Dismiss
              </button>
              <button
                onClick={() => handleAction("accepted")}
                className="px-3 py-1 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition"
              >
                Accept Correction
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
