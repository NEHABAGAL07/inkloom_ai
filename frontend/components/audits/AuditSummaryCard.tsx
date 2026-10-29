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
          bg: "bg-[#72D6A1]/15 border-[#72D6A1]/30 text-[#72D6A1]",
          text: "COMPLIANT",
          icon: CheckCircle,
        };
      case "needs_review":
        return {
          bg: "bg-[#FFAA35]/15 border-[#FFAA35]/30 text-[#FFAA35]",
          text: "NEEDS REVIEW",
          icon: AlertTriangle,
        };
      case "non_compliant":
        return {
          bg: "bg-[#FF6B78]/15 border-[#FF6B78]/30 text-[#FF6B78]",
          text: "NON-COMPLIANT",
          icon: XCircle,
        };
      default:
        return {
          bg: "bg-[#272727] border-[#383838] text-[#B8B2AC]",
          text: "UNKNOWN",
          icon: AlertTriangle,
        };
    }
  };

  const statusConfig = getStatusBadge(overallStatus);
  const StatusIcon = statusConfig.icon;

  const s = summary || {
    compliance_score: 100,
    total_findings: 0,
    critical_count: 0,
    high_count: 0,
    medium_count: 0,
    low_count: 0,
    info_count: 0,
    human_review_required: false,
    verdict_overview: "",
  };

  return (
    <div className="bg-white dark:bg-[#1C1C1C] rounded-2xl p-6 border border-slate-200 dark:border-[#383838] shadow-sm dark:shadow-card space-y-6 relative overflow-hidden">
      {/* Top Header Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-[#383838]">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-heading font-bold text-[#0F172A] dark:text-[#F7F3ED] tracking-tight">
              Audit Governance Synthesis
            </h2>
            <div
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${statusConfig.bg}`}
            >
              <StatusIcon className="w-3.5 h-3.5 shrink-0" />
              <span>{statusConfig.text}</span>
            </div>
          </div>
          <p className="text-xs text-[#64748B] dark:text-[#85817D] mt-1 font-mono">Run ID: {auditId}</p>
        </div>

        {s.human_review_required && (
          <div className="flex items-center gap-2 bg-amber-50 dark:bg-[#272727] border border-amber-200 dark:border-[#FFAA35]/40 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-amber-800 dark:text-[#FFAA35]">
            <Scale className="w-4 h-4 shrink-0 text-amber-600 dark:text-[#FFAA35]" />
            <span>Human Review Required Before Release</span>
          </div>
        )}
      </div>

      {/* Score & Metric Breakdown Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Compliance Score Tile */}
        <div className="col-span-2 sm:col-span-3 lg:col-span-2 bg-slate-50 dark:bg-[#141414] rounded-xl p-4 border border-slate-200 dark:border-[#383838] flex items-center justify-between">
          <div>
            <span className="text-[11px] uppercase font-bold text-[#64748B] dark:text-[#85817D] tracking-wider">
              Compliance Score
            </span>
            <div className="text-3xl font-heading font-extrabold text-gradient-warm mt-1">
              {Math.round(s.compliance_score ?? 100)}
              <span className="text-[#64748B] dark:text-[#85817D] text-lg font-normal">/100</span>
            </div>
            <div className="text-[11px] text-[#475569] dark:text-[#B8B2AC] mt-1">
              {(s.compliance_score ?? 100) >= 80 ? "Passes Baseline Threshold" : "Remediation Recommended"}
            </div>
          </div>
          <div className="w-14 h-14 rounded-full border-4 border-[#10B981]/25 border-t-[#10B981] dark:border-[#FFAA35]/20 dark:border-t-[#FFAA35] flex items-center justify-center font-extrabold text-sm text-[#0F766E] dark:text-[#FFAA35] bg-white dark:bg-[#1C1C1C] shadow-xs dark:shadow-subtle">
            {Math.round(s.compliance_score ?? 100)}%
          </div>
        </div>

        {/* Severity Count Tiles */}
        <div className="bg-rose-50/60 dark:bg-[#202020] rounded-xl p-4 border border-rose-200 dark:border-[#FF6B78]/30 shadow-xs dark:shadow-subtle">
          <span className="text-[11px] uppercase font-bold text-rose-600 dark:text-[#FF6B78]">Critical</span>
          <div className="text-2xl font-black text-rose-600 dark:text-[#FF6B78] mt-1">{s.critical_count ?? 0}</div>
          <div className="text-[10px] text-[#64748B] dark:text-[#85817D]">Must fix</div>
        </div>

        <div className="bg-amber-50/60 dark:bg-[#202020] rounded-xl p-4 border border-amber-200 dark:border-[#FFAA35]/30 shadow-xs dark:shadow-subtle">
          <span className="text-[11px] uppercase font-bold text-amber-600 dark:text-[#FFAA35]">High</span>
          <div className="text-2xl font-black text-amber-600 dark:text-[#FFAA35] mt-1">{s.high_count ?? 0}</div>
          <div className="text-[10px] text-[#64748B] dark:text-[#85817D]">Brand risk</div>
        </div>

        <div className="bg-sky-50/60 dark:bg-[#202020] rounded-xl p-4 border border-sky-200 dark:border-[#83B9FF]/30 shadow-xs dark:shadow-subtle">
          <span className="text-[11px] uppercase font-bold text-sky-600 dark:text-[#83B9FF]">Medium</span>
          <div className="text-2xl font-black text-sky-600 dark:text-[#83B9FF] mt-1">{s.medium_count ?? 0}</div>
          <div className="text-[10px] text-[#64748B] dark:text-[#85817D]">Tone/Style</div>
        </div>

        <div className="bg-slate-50 dark:bg-[#202020] rounded-xl p-4 border border-slate-200 dark:border-[#383838] shadow-xs dark:shadow-subtle">
          <span className="text-[11px] uppercase font-bold text-slate-500 dark:text-[#B8B2AC]">Low</span>
          <div className="text-2xl font-black text-[#0F172A] dark:text-[#F7F3ED] mt-1">{s.low_count ?? 0}</div>
          <div className="text-[10px] text-[#64748B] dark:text-[#85817D]">Minor polish</div>
        </div>
      </div>

      {/* Verdict Overview */}
      {s.verdict_overview && (
        <div className="bg-slate-50 dark:bg-[#141414] p-4 rounded-xl border border-slate-200 dark:border-[#383838] text-xs text-[#0F172A] dark:text-[#F7F3ED] leading-relaxed">
          <span className="font-bold text-[#0F766E] dark:text-[#FFAA35] block mb-1">Executive Summary:</span>
          {s.verdict_overview}
        </div>
      )}
    </div>
  );
}
