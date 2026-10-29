"use client";

import React from "react";
import { SuggestedCorrection } from "@/types";
import { Check, Info } from "lucide-react";

interface DiffViewerProps {
  originalText?: string | null;
  correction?: SuggestedCorrection | null;
}

export function DiffViewer({ originalText, correction }: DiffViewerProps) {
  if (!correction && !originalText) return null;

  return (
    <div className="mt-3 rounded-xl overflow-hidden border border-[#DDEBE5] dark:border-border bg-[#F7FBF9] dark:bg-workspace text-xs">
      <div className="bg-white dark:bg-surface px-3.5 py-2 border-b border-[#DDEBE5] dark:border-border flex items-center justify-between">
        <span className="font-bold text-[#18352F] dark:text-navy">Proposed Intent-Preserving Correction</span>
        {correction?.preserves_intent && (
          <span className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-status-success border border-emerald-200 dark:border-emerald-800/40 px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1">
            <Check className="w-3 h-3" />
            <span>Preserves Commercial Intent</span>
          </span>
        )}
      </div>

      <div className="p-3.5 space-y-2.5">
        {originalText && (
          <div className="flex items-start gap-2">
            <span className="px-1.5 py-0.5 rounded bg-rose-50 dark:bg-red-950/40 text-rose-700 dark:text-status-error font-mono font-bold text-[10px] shrink-0 border border-rose-200 dark:border-red-900/40">
              ORIGINAL
            </span>
            <div className="text-rose-700 dark:text-status-error/90 line-through bg-rose-50/50 dark:bg-red-950/20 px-2.5 py-1.5 rounded-lg w-full border border-rose-200 dark:border-red-900/30 leading-relaxed font-mono">
              {originalText}
            </div>
          </div>
        )}

        {correction && (
          <div className="flex items-start gap-2">
            <span className="px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-status-success font-mono font-bold text-[10px] shrink-0 border border-emerald-200 dark:border-emerald-900/40">
              SUGGESTED
            </span>
            <div className="text-emerald-800 dark:text-status-success font-medium bg-emerald-50/50 dark:bg-emerald-950/20 px-2.5 py-1.5 rounded-lg w-full border border-emerald-200 dark:border-emerald-900/30 leading-relaxed font-mono">
              {correction.replacement_text}
            </div>
          </div>
        )}

        {correction?.rationale && (
          <div className="mt-2 text-[11px] text-[#58716A] dark:text-ink-secondary bg-white dark:bg-surface p-2.5 rounded-lg border border-[#DDEBE5] dark:border-border flex items-start gap-2">
            <Info className="w-3.5 h-3.5 text-[#087F70] dark:text-teal shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-bold text-[#18352F] dark:text-navy mr-1">Rationale:</span>
              <span>{correction.rationale}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
