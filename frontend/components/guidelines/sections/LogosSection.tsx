"use client";

import React from "react";
import { BrandGuidelineData } from "@/types";
import { Image as ImageIcon } from "lucide-react";

interface LogosSectionProps {
  data: BrandGuidelineData;
}

export function LogosSection({ data }: LogosSectionProps) {
  return (
    <div className="bg-surface p-6 rounded-xl border border-border shadow-subtle space-y-6">
      <div className="border-b border-border pb-4">
        <h2 className="text-lg font-bold text-navy flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-teal" />
          A5. Logo Guidelines &amp; Clear Space Standards
        </h2>
        <p className="text-xs text-ink-secondary mt-1">
          Manage primary wordmarks, monograms, clear-space minimums, and prohibited modifications.
        </p>
      </div>

      <div className="space-y-4">
        {data.logos?.variants?.map((logo, idx) => (
          <div
            key={logo.id || idx}
            className="p-4 rounded-xl bg-workspace border border-border flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">{logo.name}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-950 text-teal border border-indigo-800/60">
                  {logo.type}
                </span>
              </div>
              <div className="mt-1 text-xs text-ink-secondary space-y-0.5">
                <p>
                  <strong>Clear Space:</strong> {logo.clear_space_formula}
                </p>
                <p>
                  <strong>Minimum Size:</strong> {logo.min_width_px}px &times; {logo.min_height_px}px
                </p>
                <p>
                  <strong>Preferred Placement:</strong> {logo.preferred_placement}
                </p>
              </div>
            </div>

            <div className="p-3 bg-workspace border border-border rounded-xl text-center">
              <div className="w-28 h-10 flex items-center justify-center font-bold tracking-tight text-white border border-dashed border-border rounded bg-workspace">
                {logo.type === "icon" ? "ICON" : "WORDMARK"}
              </div>
              <span className="text-[10px] text-ink-muted mt-1 block">Approved Asset</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

