"use client";

import React from "react";
import { BrandGuidelineData } from "@/types";
import { Type } from "lucide-react";

interface TypographySectionProps {
  data: BrandGuidelineData;
  setData: React.Dispatch<React.SetStateAction<BrandGuidelineData>>;
}

export function TypographySection({ data, setData }: TypographySectionProps) {
  return (
    <div className="bg-surface p-6 rounded-xl border border-border shadow-subtle space-y-6">
      <div className="border-b border-border pb-4">
        <h2 className="text-lg font-bold text-navy flex items-center gap-2">
          <Type className="w-4 h-4 text-teal" />
          A4. Typography System &amp; Presets
        </h2>
        <p className="text-xs text-ink-secondary mt-1">
          Define brand typefaces, weights, line-height hierarchies, and interactive live preview specimens.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-semibold text-ink-secondary mb-1.5">
            Primary Font Family
          </label>
          <input
            type="text"
            value={data.typography?.primary_font || ""}
            onChange={(e) =>
              setData({
                ...data,
                typography: { ...data.typography, primary_font: e.target.value },
              })
            }
            placeholder="e.g. Inter"
            className="w-full px-3.5 py-2.5 bg-workspace border border-border rounded-lg text-xs text-ink-primary focus:outline-none focus:border-teal"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-ink-secondary mb-1.5">
            Secondary Font Family
          </label>
          <input
            type="text"
            value={data.typography?.secondary_font || ""}
            onChange={(e) =>
              setData({
                ...data,
                typography: { ...data.typography, secondary_font: e.target.value },
              })
            }
            placeholder="e.g. Roboto"
            className="w-full px-3.5 py-2.5 bg-workspace border border-border rounded-lg text-xs text-ink-primary focus:outline-none focus:border-teal"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-ink-secondary mb-1.5">
            Display / Headline Font
          </label>
          <input
            type="text"
            value={data.typography?.display_font || ""}
            onChange={(e) =>
              setData({
                ...data,
                typography: { ...data.typography, display_font: e.target.value },
              })
            }
            placeholder="e.g. Outfit"
            className="w-full px-3.5 py-2.5 bg-workspace border border-border rounded-lg text-xs text-ink-primary focus:outline-none focus:border-teal"
          />
        </div>
      </div>

      {/* Live Typography Preview Specimen */}
      <div className="p-5 rounded-xl bg-workspace border border-border space-y-4">
        <div className="text-[11px] font-bold text-ink-muted uppercase tracking-wider">
          Live Typography Specimen
        </div>
        <div className="space-y-3">
          <div
            style={{
              fontFamily: data.typography?.display_font || "sans-serif",
            }}
            className="text-2xl lg:text-3xl font-extrabold text-ink-primary tracking-tight"
          >
            H1 Headline Specimen: Autonomous Cloud Fabric
          </div>
          <div
            style={{
              fontFamily: data.typography?.primary_font || "sans-serif",
            }}
            className="text-sm text-ink-secondary leading-relaxed max-w-2xl"
          >
            Body text specimen rendering: Enterprise microservices achieve verified 99.999% SLA throughput using deterministic packet queues across sovereign cloud data centers.
          </div>
        </div>
      </div>

      {/* Hierarchy Presets Table */}
      <div className="space-y-2">
        <div className="text-xs font-bold text-ink-secondary uppercase tracking-wider">
          Configured Presets (H1, H2, Body, CTA)
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-ink-secondary">
            <thead className="bg-workspace text-ink-muted uppercase text-[10px]">
              <tr>
                <th className="p-2.5 rounded-l-lg">Preset</th>
                <th className="p-2.5">Font Family</th>
                <th className="p-2.5">Size</th>
                <th className="p-2.5">Line Height</th>
                <th className="p-2.5">Weight</th>
                <th className="p-2.5 rounded-r-lg">Usage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {data.typography?.presets?.map((p, idx) => (
                <tr key={idx} className="hover:bg-workspace/40">
                  <td className="p-2.5 font-bold text-white">{p.name}</td>
                  <td className="p-2.5 font-mono text-[11px]">{p.font_family}</td>
                  <td className="p-2.5 font-mono text-[11px]">{p.font_size}</td>
                  <td className="p-2.5 font-mono text-[11px]">{p.line_height}</td>
                  <td className="p-2.5 font-mono text-[11px]">{p.font_weight}</td>
                  <td className="p-2.5 text-ink-muted text-[11px]">{p.intended_usage}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

