"use client";

import React from "react";
import { BrandGuidelineData } from "@/types";
import { AlertTriangle } from "lucide-react";

interface ComplianceSectionProps {
  data: BrandGuidelineData;
  setData: React.Dispatch<React.SetStateAction<BrandGuidelineData>>;
}

export function ComplianceSection({ data, setData }: ComplianceSectionProps) {
  return (
    <div className="bg-surface p-6 rounded-xl border border-border shadow-subtle space-y-6">
      <div className="border-b border-border pb-4">
        <h2 className="text-lg font-bold text-navy flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          A9. Mandatory Compliance, Disclaimers &amp; Legal Notices
        </h2>
        <p className="text-xs text-ink-secondary mt-1">
          Mandatory regulatory disclaimers, trademark usage notices, and quantitative benchmark citations.
        </p>
      </div>

      <div className="space-y-3">
        {data.compliance?.map((comp, idx) => (
          <div
            key={comp.id || idx}
            className="p-4 rounded-xl bg-workspace border border-border space-y-2 relative"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">{comp.title}</span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-950 border border-amber-800 text-amber-400">
                  {comp.requirement_level}
                </span>
              </div>
              <span className="text-[10px] text-ink-muted uppercase font-mono">{comp.category}</span>
            </div>
            <textarea
              rows={2}
              value={comp.rule_text}
              onChange={(e) => {
                const updated = [...(data.compliance || [])];
                updated[idx].rule_text = e.target.value;
                setData({ ...data, compliance: updated });
              }}
              className="w-full px-2.5 py-1.5 bg-workspace border border-border rounded-lg text-xs text-ink-primary"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

