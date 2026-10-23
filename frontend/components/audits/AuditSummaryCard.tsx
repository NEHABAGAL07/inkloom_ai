"use client";

import React from "react";
import { AuditSummary, OverallAuditStatus } from "@/types";

interface AuditSummaryCardProps {
  summary: AuditSummary;
  overallStatus: OverallAuditStatus;
  auditId: string;
}

export function AuditSummaryCard({ summary, overallStatus, auditId }: AuditSummaryCardProps) {
  const getStatusBadge = (status: OverallAuditStatus) => {
    switch (status) {
      case "compliant":
        return {
          bg: "bg-emerald-950/70 border-emerald-800/80 text-emerald-300",
          text: "COMPLIANT",
          dot: "bg-emerald-400",
        };
      case "needs_review":
        return {
          bg: "bg-amber-950/70 border-amber-800/80 text-amber-300",
          text: "NEEDS REVIEW",
          dot: "bg-amber-400",
        };
      case "non_compliant":
        return {
          bg: "bg-rose-950/70 border-rose-800/80 text-rose-300",
          text: "NON-COMPLIANT",
          dot: "bg-rose-400",
        };
      default:
        return {
          bg: "bg-slate-800 border-slate-700 text-slate-300",
          text: "ERROR",
          dot: "bg-slate-400",
        };
    }
  };

  const statusConfig = getStatusBadge(overallStatus);

  return (
    <div className="glass-panel rounded-2xl p-6 shadow-xl space-y-6">
      {/* Top Header Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-white tracking-tight">Audit Governance Synthesis</h2>
            <div
              className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border ${statusConfig.bg}`}
            >
              <span className={`w-2 h-2 rounded-full ${statusConfig.dot}`}></span>
              {statusConfig.text}
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-mono">Run ID: {auditId}</p>
        </div>

        {summary.human_review_required && (
          <div className="flex items-center gap-2 bg-indigo-950/60 border border-indigo-700/50 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-indigo-300">
            <span className="text-sm">⚖️</span>
            <span>Human Review Required Before Release</span>
          </div>
        )}
      </div>

      {/* Score & Metric Breakdown Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Compliance Score Tile */}
        <div className="col-span-2 sm:col-span-3 lg:col-span-2 bg-slate-900/90 rounded-xl p-4 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs uppercase font-semibold text-slate-400 tracking-wider">Compliance Score</span>
            <div className="text-3xl font-extrabold text-white mt-1">
              {summary.compliance_score}
              <span className="text-slate-500 text-lg font-normal">/100</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {summary.compliance_score >= 80 ? "Passes Baseline Threshold" : "Remediation Recommended"}
            </div>
          </div>
          <div className="w-16 h-16 rounded-full border-4 border-indigo-500/40 border-t-indigo-500 flex items-center justify-center font-bold text-sm text-indigo-300">
            {Math.round(summary.compliance_score)}%
          </div>
        </div>

        {/* Severity Count Tiles */}
        <div className="bg-slate-900/60 rounded-xl p-4 border border-rose-900/30">
          <span className="text-[11px] uppercase font-bold text-rose-400">Critical</span>
          <div className="text-2xl font-black text-rose-400 mt-1">{summary.critical_count}</div>
          <div className="text-[10px] text-slate-400">Must fix</div>
        </div>

        <div className="bg-slate-900/60 rounded-xl p-4 border border-amber-900/30">
          <span className="text-[11px] uppercase font-bold text-amber-400">High</span>
          <div className="text-2xl font-black text-amber-400 mt-1">{summary.high_count}</div>
          <div className="text-[10px] text-slate-400">Brand risk</div>
        </div>

        <div className="bg-slate-900/60 rounded-xl p-4 border border-sky-900/30">
          <span className="text-[11px] uppercase font-bold text-sky-400">Medium</span>
          <div className="text-2xl font-black text-sky-400 mt-1">{summary.medium_count}</div>
          <div className="text-[10px] text-slate-400">Tone/Style</div>
        </div>

        <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-800">
          <span className="text-[11px] uppercase font-bold text-slate-400">Low</span>
          <div className="text-2xl font-black text-slate-300 mt-1">{summary.low_count}</div>
          <div className="text-[10px] text-slate-400">Minor polish</div>
        </div>
      </div>

      {/* Verdict Overview */}
      {summary.verdict_overview && (
        <div className="bg-slate-900/70 p-4 rounded-xl border border-slate-800 text-xs text-slate-300 leading-relaxed">
          <span className="font-semibold text-white block mb-1">Executive Summary:</span>
          {summary.verdict_overview}
        </div>
      )}
    </div>
  );
}
