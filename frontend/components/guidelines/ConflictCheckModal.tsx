"use client";

import React, { useEffect, useState } from "react";
import {
  X,
  AlertTriangle,
  CheckCircle,
  ShieldAlert,
  Layers,
  ArrowRight,
  Info,
} from "lucide-react";
import { ConflictCheckResult } from "@/types";
import { api } from "@/services/api";

interface ConflictCheckModalProps {
  onClose: () => void;
}

export function ConflictCheckModal({ onClose }: ConflictCheckModalProps) {
  const [result, setResult] = useState<ConflictCheckResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function runCheck() {
      try {
        const data = await api.checkGuidelineConflicts();
        setResult(data);
      } catch (err: any) {
        setError(err?.message || "Failed to execute rule conflict analysis.");
      } finally {
        setLoading(false);
      }
    }
    runCheck();
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0B0F19] border border-slate-800 rounded-2xl w-full max-w-3xl p-6 shadow-2xl relative text-slate-200 max-h-[90vh] flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
          <Layers className="w-4 h-4" />
          <span>Governance Priority Hierarchy</span>
        </div>
        <h2 className="text-xl font-black text-white tracking-tight">
          Rule Conflict &amp; Priority Evaluation
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Evaluates guideline definitions against the documented 5-tier legal hierarchy. A lower-priority brand preference cannot override an applicable mandatory legal requirement.
        </p>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <div className="mt-5 flex-1 overflow-y-auto space-y-5 pr-1">
          {/* Priority Hierarchy Breakdown */}
          <div>
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-indigo-400" />
              Organizational Priority Levels
            </h3>
            <div className="space-y-1.5">
              {[
                { level: 1, name: "Mandatory Legal Requirements", desc: "Statutory laws (FTC Act §5, Lanham Act, GDPR, WCAG 2.1 AA). Cannot be overridden.", tag: "Highest Priority" },
                { level: 2, name: "Organization Legal & Compliance Policies", desc: "Internal risk policies, mandatory disclaimers, and certified benchmarks.", tag: "Policy Tier" },
                { level: 3, name: "Official Brand Standards", desc: "Approved tone, voice, colors, typography, logos, and layout principles.", tag: "Brand Standard" },
                { level: 4, name: "Channel & Campaign Rules", desc: "Media-specific overrides and short-term promotional rules.", tag: "Channel Spec" },
                { level: 5, name: "Advisory Recommendations", desc: "AI-generated editorial suggestions and stylistic best practices.", tag: "Lowest Priority" },
              ].map((lvl) => (
                <div
                  key={lvl.level}
                  className="flex items-start justify-between gap-3 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs"
                >
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-md bg-indigo-950 border border-indigo-800 font-mono font-bold text-[11px] text-indigo-300 flex items-center justify-center shrink-0">
                      {lvl.level}
                    </span>
                    <div>
                      <strong className="text-white block font-semibold">{lvl.name}</strong>
                      <span className="text-[11px] text-slate-400 leading-tight">{lvl.desc}</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 shrink-0">
                    {lvl.tag}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Detected Conflicts */}
          <div>
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Detected Rule Conflicts &amp; Escalations</span>
              {result && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    result.total_conflicts === 0
                      ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                      : "bg-amber-950 text-amber-400 border border-amber-800"
                  }`}
                >
                  {result.total_conflicts === 0 ? "No Conflicts Detected" : `${result.total_conflicts} Conflict(s) Identified`}
                </span>
              )}
            </h3>

            {loading ? (
              <div className="p-8 text-center text-xs text-slate-500">
                Running conflict evaluation against statutory rules...
              </div>
            ) : !result || result.conflicts.length === 0 ? (
              <div className="p-6 text-center bg-slate-900/40 rounded-xl border border-slate-800 space-y-2">
                <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto" />
                <p className="text-xs font-bold text-white">Full Governance Alignment</p>
                <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                  No contradictions found between brand preferences and mandatory legal or accessibility standards.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {result.conflicts.map((c, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-amber-950/20 border border-amber-800/40 space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                          <strong className="text-xs text-amber-200 font-bold">{c.rule_name}</strong>
                          <ArrowRight className="w-3 h-3 text-slate-500" />
                          <span className="text-xs text-slate-300 font-medium">{c.conflicting_with}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1.5 text-[10px]">
                          <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-800 text-emerald-400 font-bold">
                            Governing: {c.priority_high}
                          </span>
                          <span className="text-slate-500">supersedes</span>
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                            {c.priority_low}
                          </span>
                        </div>
                      </div>

                      {c.escalate_to_legal && (
                        <span className="px-2 py-1 rounded text-[10px] font-bold bg-rose-950/80 border border-rose-800 text-rose-300 uppercase shrink-0">
                          Legal Escalation Required
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                      {c.explanation}
                    </p>

                    <div className="text-[11px] text-emerald-400 flex items-start gap-1.5 pt-1">
                      <strong className="text-slate-400 font-semibold shrink-0">Suggested Remediation:</strong>
                      <span>{c.remediation_suggestion}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Legal Compliance Disclaimer */}
          <div className="p-3 bg-slate-900/50 border border-slate-800 rounded-xl text-[11px] text-slate-400 leading-relaxed">
            <strong className="text-slate-300 block mb-0.5">Decision-Support Notice:</strong>
            {result?.compliance_disclaimer ||
              "Inkloom AI conflict detection assists organizational decision-making by applying documented governance priority hierarchies. It does not replace qualified legal review."}
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800 mt-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
