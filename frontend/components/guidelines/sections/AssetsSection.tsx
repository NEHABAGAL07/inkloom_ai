"use client";

import React from "react";
import { BrandGuidelineData } from "@/types";
import { UploadCloud, CheckCircle, ExternalLink } from "lucide-react";

interface AssetsSectionProps {
  data: BrandGuidelineData;
}

export function AssetsSection({ data }: AssetsSectionProps) {
  return (
    <div className="bg-surface p-6 rounded-xl border border-border shadow-subtle space-y-6">
      <div className="border-b border-border pb-4">
        <h2 className="text-lg font-bold text-navy flex items-center gap-2">
          <UploadCloud className="w-4 h-4 text-teal" />
          A10. Brand Asset Library &amp; Certifications
        </h2>
        <p className="text-xs text-ink-secondary mt-1">
          Repository of approved SVG wordmarks, reference architectures, design templates, and brand books.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {data.assets_library?.map((asset, idx) => (
          <div
            key={asset.id || idx}
            className="p-4 rounded-xl bg-workspace border border-border space-y-3 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal bg-indigo-950 px-2 py-0.5 rounded">
                  {asset.type}
                </span>
                <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Approved
                </span>
              </div>
              <h4 className="text-xs font-bold text-ink-primary mt-2">{asset.name}</h4>
              <p className="text-[11px] text-ink-muted mt-1 line-clamp-2">{asset.description}</p>
            </div>

            <div className="pt-2 border-t border-border flex items-center justify-between text-[11px]">
              <span className="text-ink-muted font-mono">{asset.campaign}</span>
              <a
                href={asset.file_url}
                target="_blank"
                rel="noreferrer"
                className="text-teal hover:text-indigo-300 font-semibold flex items-center gap-1"
              >
                <span>View</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

