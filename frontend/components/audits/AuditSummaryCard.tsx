"use client";

import React from "react";
import { AuditSummary, OverallAuditStatus } from "@/types";
import { ShieldCheck, AlertTriangle, XCircle, CheckCircle, Scale } from "lucide-react";

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
          bg: "bg-emerald-50 border-emerald-200 text-status-success",
          text: "COMPLIANT",
          dot: "bg-status-success",
          icon: CheckCircle,
        };
      case "needs_review":
        return {
          bg: "bg-amber-50 border-amber-200 text-status-warning",
          text: "NEEDS REVIEW",
          dot: "bg-status-warning",
          icon: AlertTriangle,
        };
      case "non_compliant":
        return {
          bg: "bg-red-50 border-red-200 text-status-error",
          text: "NON-COMPLIANT",
          dot: "bg-status-error",
          icon: XCircle,
        };
      default:
        return {
          bg: "bg-slate-100 border-border text-ink-secondary",
          text: "UNKNOWN",
          dot: "bg-slate-400",
          icon: AlertTriangle,
        };
    }
  };

  const statusConfig = getStatusBadge(overallStatus);
  const StatusIcon = statusConfig.icon;

  return (
    <div className="bg-surface rounded-2xl p-6 border border-border shadow-subtle space-y-6">
      {/* Top Header Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-navy tracking-tight">Audit Governance Synthesis</h2>
            <div
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${statusConfig.bg}`}
            >
              <StatusIcon className="w-3.5 h-3.5 shrink-0" />
              <span>{statusConfig.text}</span>
            </div>
          </div>
          <p className="text-xs text-ink-muted mt-1 font-mono">Run ID: {auditId}</p>
        </div>

        {summary.human_review_required && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-status-warning">
            <Scale className="w-4 h-4 shrink-0" />
            <span>Human Review Required Before Release</span>
          </div>
        )}
      </div>

      {/* Score & Metric Breakdown Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Compliance Score Tile */}
        <div className="col-span-2 sm:col-span-3 lg:col-span-2 bg-workspace rounded-xl p-4 border border-border flex items-center justify-between">
          <div>
            <span className="text-[11px] uppercase font-bold text-ink-muted tracking-wider">Compliance Score</span>
            <div className="text-3xl font-black text-navy mt-1">
              {summary.compliance_score}
              <span className="text-ink-muted text-lg font-normal">/100</span>
            </div>
            <div className="text-[11px] text-ink-secondary mt-1">
              {summary.compliance_score >= 80 ? "Passes Baseline Threshold" : "Remediation Recommended"}
            </div>
          </div>
          <div className="w-14 h-14 rounded-full border-4 border-teal/20 border-t-teal flex items-center justify-center font-extrabold text-sm text-teal bg-surface shadow-subtle">
            {Math.round(summary.compliance_score)}%
          </div>
        </div>

        {/* Severity Count Tiles */}
        <div className="bg-surface rounded-xl p-4 border border-red-200 shadow-subtle">
          <span className="text-[11px] uppercase font-bold text-status-error">Critical</span>
          <div className="text-2xl font-black text-status-error mt-1">{summary.critical_count}</div>
          <div className="text-[10px] text-ink-muted">Must fix</div>
        </div>

        <div className="bg-surface rounded-xl p-4 border border-amber-200 shadow-subtle">
          <span className="text-[11px] uppercase font-bold text-status-warning">High</span>
          <div className="text-2xl font-black text-status-warning mt-1">{summary.high_count}</div>
          <div className="text-[10px] text-ink-muted">Brand risk</div>
        </div>

        <div className="bg-surface rounded-xl p-4 border border-blue-200 shadow-subtle">
          <span className="text-[11px] uppercase font-bold text-status-info">Medium</span>
          <div className="text-2xl font-black text-status-info mt-1">{summary.medium_count}</div>
          <div className="text-[10px] text-ink-muted">Tone/Style</div>
        </div>

        <div className="bg-surface rounded-xl p-4 border border-border shadow-subtle">
          <span className="text-[11px] uppercase font-bold text-ink-secondary">Low</span>
          <div className="text-2xl font-black text-navy mt-1">{summary.low_count}</div>
          <div className="text-[10px] text-ink-muted">Minor polish</div>
        </div>
      </div>

      {/* Verdict Overview */}
      {summary.verdict_overview && (
        <div className="bg-workspace p-4 rounded-xl border border-border text-xs text-navy leading-relaxed">
          <span className="font-bold text-navy block mb-1">Executive Summary:</span>
          {summary.verdict_overview}
        </div>
      )}
    </div>
  );
}
