"use client";

import React from "react";
import { BrandGuidelineData, BrandDoDont } from "@/types";
import { ShieldCheck, Plus, Trash2 } from "lucide-react";

interface DoDontsSectionProps {
  data: BrandGuidelineData;
  setData: React.Dispatch<React.SetStateAction<BrandGuidelineData>>;
}

export function DoDontsSection({ data, setData }: DoDontsSectionProps) {
  return (
    <div className="bg-surface p-6 rounded-xl border border-border shadow-subtle space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h2 className="text-lg font-bold text-navy flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            A8. Brand Do&apos;s and Don&apos;ts (AI Rule Engine)
          </h2>
          <p className="text-xs text-ink-secondary mt-1">
            Structured rules evaluated during automated creative audits with Critical, High, Medium, and Low severity weighting.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            const newRule: BrandDoDont = {
              id: `rule_${Date.now()}`,
              title: "New Governance Policy Rule",
              description: "Specify the exact requirement or prohibited practice here...",
              type: "mandatory",
              priority: "high",
            };
            setData({
              ...data,
              dos_and_donts: [...(data.dos_and_donts || []), newRule],
            });
          }}
          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-md shadow-indigo-600/30"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Add Policy Rule</span>
        </button>
      </div>

      <div className="space-y-3">
        {data.dos_and_donts?.map((rule, idx) => (
          <div
            key={rule.id || idx}
            className="p-4 rounded-xl bg-workspace border border-border space-y-2 relative"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
                <div className="md:col-span-2">
                  <input
                    type="text"
                    value={rule.title}
                    onChange={(e) => {
                      const updated = [...(data.dos_and_donts || [])];
                      updated[idx].title = e.target.value;
                      setData({ ...data, dos_and_donts: updated });
                    }}
                    className="w-full text-xs font-bold text-white bg-transparent border-b border-border focus:border-indigo-500 focus:outline-none"
                    placeholder="Rule Title"
                  />
                </div>
                <div className="flex gap-2">
                  <select
                    value={rule.priority}
                    onChange={(e) => {
                      const updated = [...(data.dos_and_donts || [])];
                      updated[idx].priority = e.target.value as any;
                      setData({ ...data, dos_and_donts: updated });
                    }}
                    className="px-2 py-1 bg-workspace border border-border rounded-lg text-xs font-bold capitalize text-ink-secondary"
                  >
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>

                  <select
                    value={rule.type}
                    onChange={(e) => {
                      const updated = [...(data.dos_and_donts || [])];
                      updated[idx].type = e.target.value as any;
                      setData({ ...data, dos_and_donts: updated });
                    }}
                    className="px-2 py-1 bg-workspace border border-border rounded-lg text-xs capitalize text-ink-secondary"
                  >
                    <option value="mandatory">Mandatory</option>
                    <option value="recommended">Recommended</option>
                    <option value="prohibited">Prohibited</option>
                    <option value="common_mistake">Common Mistake</option>
                    <option value="special_exception">Special Exception</option>
                  </select>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  const updated = [...(data.dos_and_donts || [])];
                  updated.splice(idx, 1);
                  setData({ ...data, dos_and_donts: updated });
                }}
                className="text-ink-muted hover:text-rose-400 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            <textarea
              rows={2}
              value={rule.description}
              onChange={(e) => {
                const updated = [...(data.dos_and_donts || [])];
                updated[idx].description = e.target.value;
                setData({ ...data, dos_and_donts: updated });
              }}
              className="w-full px-2.5 py-1.5 bg-workspace border border-border rounded-lg text-xs text-ink-secondary placeholder-slate-600 focus:outline-none"
              placeholder="Detailed rule explanation for designers and AI engine..."
            />
          </div>
        ))}
      </div>
    </div>
  );
}

