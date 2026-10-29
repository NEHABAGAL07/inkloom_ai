"use client";

import React, { useState } from "react";
import { Finding, FindingSeverity } from "@/types";
import { DiffViewer } from "./DiffViewer";
import { AlertTriangle, CheckCircle, XCircle, ExternalLink, Check, X, Sparkles } from "lucide-react";

interface FindingCardProps {
  finding: Finding;
  onStatusChange?: (findingId: string, newStatus: string) => void;
}

export function FindingCard({ finding, onStatusChange }: FindingCardProps) {
  const [currentStatus, setCurrentStatus] = useState(finding.status);

  const getSeverityStyle = (severity: FindingSeverity) => {
    switch (severity) {
      case "critical":
        return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-[#FF6B78]/15 dark:text-[#FF6B78] dark:border-[#FF6B78]/30";
      case "high":
        return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-[#FFAA35]/15 dark:text-[#FFAA35] dark:border-[#FFAA35]/30";
      case "medium":
        return "bg-sky-50 text-sky-700 border-sky-200 dark:bg-[#83B9FF]/15 dark:text-[#83B9FF] dark:border-[#83B9FF]/30";
      case "low":
        return "bg-[#EFF8F4] text-[#58716A] border-[#DDEBE5] dark:bg-[#272727] dark:text-[#B8B2AC] dark:border-[#383838]";
      default:
        return "bg-[#EFF8F4] text-[#82948E] border-[#DDEBE5] dark:bg-[#272727] dark:text-[#85817D] dark:border-[#383838]";
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
      className={`rounded-2xl p-5 border transition-all ${
        isAccepted
          ? "border-emerald-300 bg-emerald-50/50 dark:border-[#72D6A1]/40 dark:bg-[#72D6A1]/5 shadow-xs"
          : isDismissed
          ? "opacity-50 border-[#DDEBE5] dark:border-[#383838] bg-[#F7FBF9] dark:bg-[#141414]"
          : "border-[#DDEBE5] dark:border-[#383838] bg-white dark:bg-[#1C1C1C] shadow-sm dark:shadow-card hover:border-[#C8E2D8] dark:hover:border-[#4A4A4A]"
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
          <span className="text-xs text-[#087F70] dark:text-[#FFAA35] font-semibold bg-[#E8F7F1] dark:bg-[#FFAA35]/10 border border-[#C8E2D8] dark:border-[#FFAA35]/20 px-2 py-0.5 rounded-md">
            {getCategoryLabel(finding.category)}
          </span>

          {/* Human Review Marker */}
          {finding.requires_human_review && (
            <span className="text-[10px] font-bold text-amber-700 dark:text-[#FFD166] bg-amber-50 dark:bg-[#FFD166]/10 border border-amber-200 dark:border-[#FFD166]/20 px-2 py-0.5 rounded-md flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              <span>Mandatory Review</span>
            </span>
          )}
        </div>

        {/* Confidence Meter */}
        <div className="flex items-center gap-2 text-xs text-[#58716A] dark:text-[#85817D]">
          <span>Confidence:</span>
          <div className="w-16 bg-[#EFF8F4] dark:bg-[#141414] h-2 rounded-full overflow-hidden border border-[#DDEBE5] dark:border-[#383838]">
            <div
              className="bg-gradient-to-r from-[#087F70] via-[#10A995] to-[#43D6B3] dark:from-[#FFD84D] dark:to-[#FF7A36] h-full rounded-full"
              style={{ width: `${Math.round(finding.confidence * 100)}%` }}
            />
          </div>
          <span className="font-mono text-[#18352F] dark:text-[#F7F3ED] font-semibold">
            {Math.round(finding.confidence * 100)}%
          </span>
        </div>
      </div>

      {/* Title & Message */}
      <h3 className="text-base font-heading font-bold text-[#18352F] dark:text-[#F7F3ED] tracking-tight">{finding.title}</h3>
      <p className="text-xs text-[#58716A] dark:text-[#B8B2AC] mt-1.5 leading-relaxed">{finding.message}</p>

      {/* Source Citation & Benchmark Verification Badge */}
      {finding.source_reference && (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[#58716A] dark:text-[#B8B2AC] bg-[#F7FBF9] dark:bg-[#141414] px-3 py-2 rounded-xl border border-[#DDEBE5] dark:border-[#383838]">
          <span className="font-bold text-[#18352F] dark:text-[#F7F3ED]">Rule Reference:</span>
          <span className="text-[#087F70] dark:text-[#FFAA35] font-semibold">{finding.source_reference.rule_name}</span>
          {finding.source_reference.section && (
            <span className="text-[#82948E] dark:text-[#85817D]">({finding.source_reference.section})</span>
          )}

          {/* Verification Status Pill */}
          {finding.source_reference.verification_status === "verified" && (
            <span className="ml-auto bg-emerald-50 dark:bg-[#72D6A1]/15 text-emerald-700 dark:text-[#72D6A1] border border-emerald-200 dark:border-[#72D6A1]/30 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">
              <Check className="w-3 h-3" />
              <span>Verified Citation</span>
            </span>
          )}
          {finding.source_reference.verification_status === "unverified" && (
            <span className="ml-auto bg-amber-50 dark:bg-[#FFAA35]/15 text-amber-700 dark:text-[#FFAA35] border border-amber-200 dark:border-[#FFAA35]/30 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              <span>Unverified Citation</span>
            </span>
          )}
          {finding.source_reference.verification_status === "contradicted" && (
            <span className="ml-auto bg-rose-50 dark:bg-[#FF6B78]/15 text-rose-700 dark:text-[#FF6B78] border border-rose-200 dark:border-[#FF6B78]/30 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">
              <X className="w-3 h-3" />
              <span>Contradicted by Benchmark</span>
            </span>
          )}

          {finding.source_reference.source_url && (
            <a
              href={finding.source_reference.source_url}
              target="_blank"
              rel="noreferrer"
              className="text-[#087F70] hover:text-[#10A995] dark:text-[#FFAA35] hover:underline text-[11px] flex items-center gap-0.5 font-medium"
            >
              <span>[View Rule]</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      )}

      {/* Proposed Intent-Preserving Correction */}
      <DiffViewer originalText={finding.evidence} correction={finding.suggested_correction} />

      {/* Review Actions */}
      <div className="mt-4 pt-3 border-t border-[#DDEBE5] dark:border-[#383838] flex items-center justify-between">
        <span className="text-[11px] text-[#82948E] dark:text-[#85817D] font-mono capitalize">
          Status: {currentStatus}
        </span>

        <div className="flex items-center gap-2">
          {isAccepted ? (
            <span className="text-xs text-emerald-600 dark:text-[#72D6A1] font-semibold flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Correction Accepted</span>
            </span>
          ) : isDismissed ? (
            <span className="text-xs text-[#82948E] dark:text-[#85817D]">Dismissed</span>
          ) : (
            <>
              <button
                onClick={() => handleAction("dismissed")}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-[#58716A] hover:text-[#18352F] hover:bg-[#EFF8F4] dark:text-[#85817D] dark:hover:text-[#F7F3ED] dark:hover:bg-[#222222] transition"
              >
                Dismiss
              </button>
              <button
                onClick={() => handleAction("accepted")}
                className="px-4 py-1.5 rounded-xl text-xs font-bold btn-gradient-warm text-white dark:text-ink-950 shadow-warmGlow transition flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5 text-white dark:text-[#111111]" />
                <span>Accept Correction</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
