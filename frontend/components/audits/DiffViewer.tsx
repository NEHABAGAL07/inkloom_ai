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
    <div className="mt-3 rounded-xl overflow-hidden border border-border bg-workspace text-xs">
      <div className="bg-surface px-3.5 py-2 border-b border-border flex items-center justify-between">
        <span className="font-bold text-navy">Proposed Intent-Preserving Correction</span>
        {correction?.preserves_intent && (
          <span className="bg-emerald-50 text-status-success border border-emerald-200 px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1">
            <Check className="w-3 h-3" />
            <span>Preserves Commercial Intent</span>
          </span>
        )}
      </div>

      <div className="p-3.5 space-y-2.5">
        {originalText && (
          <div className="flex items-start gap-2">
            <span className="px-1.5 py-0.5 rounded bg-red-100 text-status-error font-mono font-bold text-[10px] shrink-0 border border-red-200">
              ORIGINAL
            </span>
            <div className="text-status-error/90 line-through bg-red-50/60 px-2.5 py-1.5 rounded-lg w-full border border-red-200 leading-relaxed font-mono">
              {originalText}
            </div>
          </div>
        )}

        {correction && (
          <div className="flex items-start gap-2">
            <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-status-success font-mono font-bold text-[10px] shrink-0 border border-emerald-200">
              SUGGESTED
            </span>
            <div className="text-status-success font-medium bg-emerald-50/60 px-2.5 py-1.5 rounded-lg w-full border border-emerald-200 leading-relaxed font-mono">
              {correction.replacement_text}
            </div>
          </div>
        )}

        {correction?.rationale && (
          <div className="mt-2 text-[11px] text-ink-secondary bg-surface p-2.5 rounded-lg border border-border flex items-start gap-2">
            <Info className="w-3.5 h-3.5 text-teal shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-bold text-navy mr-1">Rationale:</span>
              <span>{correction.rationale}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
