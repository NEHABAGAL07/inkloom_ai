"use client";

import React from "react";
import { BrandGuidelineData } from "@/types";
import { Share2 } from "lucide-react";

interface MediaSocialSectionProps {
  data: BrandGuidelineData;
  setData: React.Dispatch<React.SetStateAction<BrandGuidelineData>>;
}

export function MediaSocialSection({ data, setData }: MediaSocialSectionProps) {
  return (
    <div className="bg-surface p-6 rounded-xl border border-border shadow-subtle space-y-6">
      <div className="border-b border-border pb-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-navy flex items-center gap-2">
            <Share2 className="w-4 h-4 text-teal" />
            B1. Social Media Graphics &amp; Posters
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-xs text-ink-secondary">Inherit Brand Defaults:</span>
            <input
              type="checkbox"
              checked={data.media_guidelines?.social_media?.inherit_brand_defaults ?? true}
              onChange={(e) => {
                const copy = { ...data };
                if (copy.media_guidelines?.social_media) {
                  copy.media_guidelines.social_media.inherit_brand_defaults = e.target.checked;
                }
                setData(copy);
              }}
              className="rounded accent-indigo-600"
            />
          </div>
        </div>
        <p className="text-xs text-ink-secondary mt-1">
          Specific dimension presets, safe margins, and text density rules for social campaign collaterals.
        </p>
      </div>

      <div className="space-y-4">
        {data.media_guidelines?.social_media?.platforms?.map((p, idx) => (
          <div
            key={idx}
            className="p-4 rounded-xl bg-workspace border border-border space-y-2"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">{p.platform}</span>
                <span className="text-[10px] text-ink-muted font-semibold px-2 py-0.5 rounded bg-workspace border border-border">
                  {p.placement}
                </span>
              </div>
              <span className="text-xs font-mono text-teal font-bold">{p.dimensions} ({p.aspect_ratio})</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] text-ink-secondary">
              <div>
                <strong>Safe Margin:</strong> {p.safe_areas}
              </div>
              <div>
                <strong>Text Density:</strong> {p.text_density_limit}
              </div>
              <div>
                <strong>Headline Type:</strong> {p.headline_size}
              </div>
              <div>
                <strong>Export Format:</strong> {p.export_format}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

