"use client";

import React from "react";

interface MediaFallbackSectionProps {
  activeSection: string;
}

export function MediaFallbackSection({
  activeSection,
}: MediaFallbackSectionProps) {
  return (
    <div className="bg-surface p-6 rounded-xl border border-border shadow-subtle space-y-6">
      <div className="border-b border-border pb-4">
        <h2 className="text-lg font-bold text-white capitalize">
          {activeSection.replace("media_", "Media Specification: ").replace("_", " ")}
        </h2>
        <p className="text-xs text-ink-secondary mt-1">
          Configured rules inherit from the general brand standards unless an explicit override is supplied.
        </p>
      </div>

      <div className="p-4 rounded-xl bg-workspace border border-border space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-ink-secondary font-semibold">Section Status:</span>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
            Active &amp; Enforced
          </span>
        </div>
        <p className="text-xs text-ink-secondary leading-relaxed">
          Settings in this category are fully structured and linked to the automated AI governance engine. Use &ldquo;Preview Rules&rdquo; in the top bar to inspect inherited values and verify conflict checks.
        </p>
      </div>
    </div>
  );
}

