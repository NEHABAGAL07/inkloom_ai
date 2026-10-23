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
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
      {/* Category Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => onSelectCategory(cat.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === cat.value
                ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Severity Selector */}
      <div className="flex items-center gap-2 self-end sm:self-auto">
        <span className="text-xs text-slate-400 font-medium">Severity:</span>
        <select
          value={selectedSeverity}
          onChange={(e) => onSelectSeverity(e.target.value)}
          className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
        >
          {SEVERITIES.map((sev) => (
            <option key={sev.value} value={sev.value}>
              {sev.label}
            </option>
          ))}
        </select>
        <span className="text-xs text-slate-400 bg-slate-800 px-2 py-1 rounded font-mono">
          {totalFindings} issues
        </span>
      </div>
    </div>
  );
}
