"use client";

import React from "react";
import { BrandGuidelineData, BrandColor } from "@/types";
import { Palette, Plus, Trash2 } from "lucide-react";

interface ColorsSectionProps {
  data: BrandGuidelineData;
  setData: React.Dispatch<React.SetStateAction<BrandGuidelineData>>;
}

export function ColorsSection({ data, setData }: ColorsSectionProps) {
  return (
    <div className="bg-surface p-6 rounded-xl border border-border shadow-subtle space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h2 className="text-lg font-bold text-navy flex items-center gap-2">
            <Palette className="w-4 h-4 text-teal" />
            A3. Brand Colour System &amp; Palette Manager
          </h2>
          <p className="text-xs text-ink-secondary mt-1">
            Manage mandatory, secondary, accent, and semantic color definitions with live WCAG AA/AAA contrast checks.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            const newColor: BrandColor = {
              id: `col_${Date.now()}`,
              name: "New Brand Color",
              hex: "#6366F1",
              rgb: "rgb(99, 102, 241)",
              role: "accent",
              usage_intent: "Interactive accents and buttons",
              status: "preferred",
            };
            setData({
              ...data,
              colors: {
                ...data.colors,
                palette: [...(data.colors?.palette || []), newColor],
              },
            });
          }}
          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-md shadow-indigo-600/30"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Add Color</span>
        </button>
      </div>

      {/* Color Palette Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.colors?.palette?.map((c, idx) => (
          <div
            key={c.id || idx}
            className="p-4 rounded-xl bg-workspace/80 border border-border space-y-3 relative group"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <input
                    type="color"
                    value={c.hex}
                    onChange={(e) => {
                      const updated = [...(data.colors?.palette || [])];
                      updated[idx].hex = e.target.value;
                      setData({
                        ...data,
                        colors: { ...data.colors, palette: updated },
                      });
                    }}
                    className="w-12 h-12 rounded-xl cursor-pointer border border-white/20 bg-transparent p-0"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    value={c.name}
                    onChange={(e) => {
                      const updated = [...(data.colors?.palette || [])];
                      updated[idx].name = e.target.value;
                      setData({
                        ...data,
                        colors: { ...data.colors, palette: updated },
                      });
                    }}
                    className="text-xs font-bold text-white bg-transparent border-b border-transparent hover:border-border focus:border-indigo-500 focus:outline-none"
                  />
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-mono text-[11px] text-ink-secondary font-semibold uppercase">
                      {c.hex}
                    </span>
                    <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-workspace text-ink-muted">
                      {c.role}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  const updated = [...(data.colors?.palette || [])];
                  updated.splice(idx, 1);
                  setData({
                    ...data,
                    colors: { ...data.colors, palette: updated },
                  });
                }}
                className="text-ink-muted hover:text-rose-400 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="text-[10px] text-ink-muted block mb-0.5">Role</label>
                <select
                  value={c.role}
                  onChange={(e) => {
                    const updated = [...(data.colors?.palette || [])];
                    updated[idx].role = e.target.value as any;
                    setData({
                      ...data,
                      colors: { ...data.colors, palette: updated },
                    });
                  }}
                  className="w-full px-2 py-1 bg-workspace border border-border rounded-lg text-xs text-ink-secondary"
                >
                  <option value="primary">Primary</option>
                  <option value="secondary">Secondary</option>
                  <option value="accent">Accent</option>
                  <option value="background">Background</option>
                  <option value="text">Text</option>
                  <option value="neutral">Neutral</option>
                  <option value="semantic">Semantic Status</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-ink-muted block mb-0.5">Status</label>
                <select
                  value={c.status}
                  onChange={(e) => {
                    const updated = [...(data.colors?.palette || [])];
                    updated[idx].status = e.target.value as any;
                    setData({
                      ...data,
                      colors: { ...data.colors, palette: updated },
                    });
                  }}
                  className="w-full px-2 py-1 bg-workspace border border-border rounded-lg text-xs text-ink-secondary"
                >
                  <option value="mandatory">Mandatory</option>
                  <option value="preferred">Preferred</option>
                  <option value="restricted">Restricted</option>
                </select>
              </div>
            </div>

            <div>
              <input
                type="text"
                value={c.usage_intent || ""}
                onChange={(e) => {
                  const updated = [...(data.colors?.palette || [])];
                  updated[idx].usage_intent = e.target.value;
                  setData({
                    ...data,
                    colors: { ...data.colors, palette: updated },
                  });
                }}
                placeholder="Usage rules / Intent..."
                className="w-full px-2.5 py-1.5 bg-workspace/60 border border-border rounded-lg text-[11px] text-ink-secondary placeholder-slate-600 focus:outline-none"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

