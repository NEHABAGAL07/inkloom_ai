"use client";

import React from "react";
import { SuggestedCorrection } from "@/types";

interface DiffViewerProps {
  originalText?: string | null;
  correction?: SuggestedCorrection | null;
}

export function DiffViewer({ originalText, correction }: DiffViewerProps) {
  if (!correction && !originalText) return null;

  return (
    <div className="mt-3 rounded-lg overflow-hidden border border-slate-700/60 bg-slate-950/70 text-xs">
      <div className="bg-slate-900/90 px-3 py-1.5 border-b border-slate-800 flex items-center justify-between">
        <span className="font-semibold text-slate-300">Proposed Intent-Preserving Correction</span>
        {correction?.preserves_intent && (
          <span className="bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 px-2 py-0.5 rounded text-[10px] font-bold">
            ✓ Preserves Intent
          </span>
        )}
      </div>

      <div className="p-3 space-y-2">
        {originalText && (
          <div className="flex items-start gap-2">
            <span className="px-1.5 py-0.5 rounded bg-rose-950/80 text-rose-400 font-mono font-bold text-[10px] shrink-0 border border-rose-800/50">
              ORIGINAL
            </span>
            <div className="text-rose-300/90 line-through bg-rose-950/20 px-2 py-1 rounded w-full border border-rose-900/30">
              {originalText}
            </div>
          </div>
        )}

        {correction && (
          <div className="flex items-start gap-2">
            <span className="px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-400 font-mono font-bold text-[10px] shrink-0 border border-emerald-800/50">
              SUGGESTED
            </span>
            <div className="text-emerald-300 font-medium bg-emerald-950/20 px-2 py-1 rounded w-full border border-emerald-900/30">
              {correction.replacement_text}
            </div>
          </div>
        )}

        {correction?.rationale && (
          <div className="mt-2 text-[11px] text-slate-400 bg-slate-900/50 p-2 rounded border border-slate-800/60 flex items-start gap-1.5">
            <span className="text-indigo-400 font-bold shrink-0">Rationale:</span>
            <span>{correction.rationale}</span>
          </div>
        )}
      </div>
    </div>
  );
}
