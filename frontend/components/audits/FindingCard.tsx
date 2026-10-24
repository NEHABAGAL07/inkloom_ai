"use client";

import React, { useState } from "react";
import { Finding, FindingSeverity } from "@/types";
import { DiffViewer } from "./DiffViewer";
import { AlertTriangle, CheckCircle, XCircle, ExternalLink, Check, X } from "lucide-react";

interface FindingCardProps {
  finding: Finding;
  onStatusChange?: (findingId: string, newStatus: string) => void;
}

export function FindingCard({ finding, onStatusChange }: FindingCardProps) {
  const [currentStatus, setCurrentStatus] = useState(finding.status);

  const getSeverityStyle = (severity: FindingSeverity) => {
    switch (severity) {
      case "critical":
        return "bg-red-50 text-status-error border-red-200";
      case "high":
        return "bg-amber-50 text-status-warning border-amber-200";
      case "medium":
        return "bg-blue-50 text-status-info border-blue-200";
      case "low":
        return "bg-slate-100 text-ink-secondary border-border";
      default:
        return "bg-slate-100 text-ink-muted border-border";
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
          ? "border-emerald-300 bg-emerald-50/40 shadow-subtle"
          : isDismissed
          ? "opacity-60 border-border bg-workspace"
          : "border-border bg-surface shadow-subtle hover:border-slate-300"
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
          <span className="text-xs text-teal font-semibold bg-teal/10 border border-teal/20 px-2 py-0.5 rounded-md">
            {getCategoryLabel(finding.category)}
          </span>

          {/* Human Review Marker */}
          {finding.requires_human_review && (
            <span className="text-[10px] font-bold text-status-warning bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              <span>Mandatory Review</span>
            </span>
          )}
        </div>

        {/* Confidence Meter */}
        <div className="flex items-center gap-2 text-xs text-ink-muted">
          <span>Confidence:</span>
          <div className="w-16 bg-workspace h-2 rounded-full overflow-hidden border border-border">
            <div
              className="bg-teal h-full rounded-full"
              style={{ width: `${Math.round(finding.confidence * 100)}%` }}
            ></div>
          </div>
          <span className="font-mono text-navy font-semibold">
            {Math.round(finding.confidence * 100)}%
          </span>
        </div>
      </div>

      {/* Title & Message */}
      <h3 className="text-base font-bold text-navy tracking-tight">{finding.title}</h3>
      <p className="text-xs text-ink-secondary mt-1.5 leading-relaxed">{finding.message}</p>

      {/* Source Citation & Benchmark Verification Badge */}
      {finding.source_reference && (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-ink-secondary bg-workspace px-3 py-2 rounded-xl border border-border">
          <span className="font-bold text-navy">Rule Reference:</span>
          <span className="text-navy">{finding.source_reference.rule_name}</span>
          {finding.source_reference.section && (
            <span className="text-ink-muted">({finding.source_reference.section})</span>
          )}

          {/* Verification Status Pill */}
          {finding.source_reference.verification_status === "verified" && (
            <span className="ml-auto bg-emerald-50 text-status-success border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">
              <Check className="w-3 h-3" />
              <span>Verified Citation</span>
            </span>
          )}
          {finding.source_reference.verification_status === "unverified" && (
            <span className="ml-auto bg-amber-50 text-status-warning border border-amber-200 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              <span>Unverified Citation</span>
            </span>
          )}
          {finding.source_reference.verification_status === "contradicted" && (
            <span className="ml-auto bg-red-50 text-status-error border border-red-200 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">
              <X className="w-3 h-3" />
              <span>Contradicted by Benchmark</span>
            </span>
          )}

          {finding.source_reference.source_url && (
            <a
              href={finding.source_reference.source_url}
              target="_blank"
              rel="noreferrer"
              className="text-teal hover:underline text-[11px] flex items-center gap-0.5"
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
      <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
        <span className="text-[11px] text-ink-muted font-mono capitalize">Status: {currentStatus}</span>

        <div className="flex items-center gap-2">
          {isAccepted ? (
            <span className="text-xs text-status-success font-semibold flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Correction Accepted</span>
            </span>
          ) : isDismissed ? (
            <span className="text-xs text-ink-muted">Dismissed</span>
          ) : (
            <>
              <button
                onClick={() => handleAction("dismissed")}
                className="px-3 py-1 rounded-lg text-xs font-semibold text-ink-muted hover:text-navy hover:bg-workspace transition border border-transparent hover:border-border"
              >
                Dismiss
              </button>
              <button
                onClick={() => handleAction("accepted")}
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-teal hover:bg-teal-hover text-white shadow-subtle transition flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Accept Correction</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
