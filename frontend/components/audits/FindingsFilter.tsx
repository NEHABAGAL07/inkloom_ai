"use client";

import React from "react";
import { FindingCategory, FindingSeverity } from "@/types";

interface FindingsFilterProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  selectedSeverity: string;
  onSelectSeverity: (severity: string) => void;
  totalFindings: number;
}

const CATEGORIES: { label: string; value: string }[] = [
  { label: "All Categories", value: "all" },
  { label: "Tone & Voice", value: "tone_voice" },
  { label: "Brand Terminology", value: "terminology" },
  { label: "Claim Verification", value: "claim_verification" },
  { label: "Visual Brand", value: "visual_brand" },
  { label: "Accessibility", value: "accessibility" },
];

const SEVERITIES: { label: string; value: string }[] = [
  { label: "All Severities", value: "all" },
  { label: "Critical", value: "critical" },
  { label: "High", value: "high" },
  { label: "Medium", value: "medium" },
  { label: "Low", value: "low" },
];

export function FindingsFilter({
  selectedCategory,
  onSelectCategory,
  selectedSeverity,
  onSelectSeverity,
  totalFindings,
}: FindingsFilterProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-surface p-3 rounded-2xl border border-border shadow-subtle">
      {/* Category Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => onSelectCategory(cat.value)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === cat.value
                ? "bg-navy text-white shadow-subtle"
                : "text-ink-secondary hover:text-navy hover:bg-workspace"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Severity Selector */}
      <div className="flex items-center gap-2 self-end sm:self-auto">
        <span className="text-xs text-ink-muted font-medium">Severity:</span>
        <select
          value={selectedSeverity}
          onChange={(e) => onSelectSeverity(e.target.value)}
          className="bg-workspace border border-border rounded-xl px-2.5 py-1 text-xs text-navy focus:outline-none focus:border-teal"
        >
          {SEVERITIES.map((sev) => (
            <option key={sev.value} value={sev.value}>
              {sev.label}
            </option>
          ))}
        </select>
        <span className="text-xs text-navy bg-workspace border border-border px-2.5 py-1 rounded-xl font-mono font-bold">
          {totalFindings} issues
        </span>
      </div>
    </div>
  );
}
