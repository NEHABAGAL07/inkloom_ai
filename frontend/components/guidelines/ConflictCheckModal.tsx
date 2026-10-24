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
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface border border-border rounded-2xl w-full max-w-3xl p-6 shadow-xl relative text-ink-primary max-h-[90vh] flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-ink-muted hover:text-navy transition p-1"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-teal text-xs font-bold uppercase tracking-wider mb-1">
          <Layers className="w-4 h-4" />
          <span>Governance Priority Hierarchy</span>
        </div>
        <h2 className="text-xl font-extrabold text-navy tracking-tight">
          Rule Conflict &amp; Priority Evaluation
        </h2>
        <p className="text-xs text-ink-secondary mt-1 leading-relaxed">
          Evaluates guideline definitions against the documented 5-tier legal hierarchy. A lower-priority brand preference cannot override an applicable mandatory legal requirement.
        </p>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-status-error text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="mt-5 flex-1 overflow-y-auto space-y-5 pr-1">
          {/* Priority Hierarchy Breakdown */}
          <div>
            <h3 className="text-xs font-bold text-navy uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-teal" />
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
                  className="flex items-start justify-between gap-3 p-3 rounded-xl bg-workspace border border-border text-xs"
                >
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-md bg-teal/10 border border-teal/20 font-mono font-bold text-[11px] text-teal flex items-center justify-center shrink-0">
                      {lvl.level}
                    </span>
                    <div>
                      <strong className="text-navy block font-semibold">{lvl.name}</strong>
                      <span className="text-[11px] text-ink-muted leading-tight">{lvl.desc}</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-surface border border-border text-navy shrink-0">
                    {lvl.tag}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Detected Conflicts */}
          <div>
            <h3 className="text-xs font-bold text-navy uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Detected Rule Conflicts &amp; Escalations</span>
              {result && (
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                    result.total_conflicts === 0
                      ? "bg-emerald-50 text-status-success border-emerald-200"
                      : "bg-amber-50 text-status-warning border-amber-200"
                  }`}
                >
                  {result.total_conflicts === 0 ? "No Conflicts Detected" : `${result.total_conflicts} Conflict(s) Identified`}
                </span>
              )}
            </h3>

            {loading ? (
              <div className="p-8 text-center text-xs text-ink-muted">
                Running conflict evaluation against statutory rules...
              </div>
            ) : !result || result.conflicts.length === 0 ? (
              <div className="p-6 text-center bg-workspace rounded-xl border border-border space-y-2">
                <CheckCircle className="w-8 h-8 text-status-success mx-auto" />
                <p className="text-xs font-bold text-navy">Full Governance Alignment</p>
                <p className="text-[11px] text-ink-secondary max-w-sm mx-auto">
                  No contradictions found between brand preferences and mandatory legal or accessibility standards.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {result.conflicts.map((c, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-amber-50/50 border border-amber-200 space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-status-warning shrink-0" />
                          <strong className="text-xs text-navy font-bold">{c.rule_name}</strong>
                          <ArrowRight className="w-3 h-3 text-ink-muted" />
                          <span className="text-xs text-ink-secondary font-medium">{c.conflicting_with}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1.5 text-[10px]">
                          <span className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-status-success font-bold">
                            Governing: {c.priority_high}
                          </span>
                          <span className="text-ink-muted">supersedes</span>
                          <span className="px-2 py-0.5 rounded bg-surface border border-border text-ink-muted">
                            {c.priority_low}
                          </span>
                        </div>
                      </div>

                      {c.escalate_to_legal && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-50 border border-red-200 text-status-error uppercase shrink-0">
                          Legal Escalation
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-ink-secondary leading-relaxed bg-surface p-2.5 rounded-lg border border-border">
                      {c.explanation}
                    </p>

                    <div className="text-[11px] text-status-success flex items-start gap-1.5 pt-1">
                      <strong className="text-navy font-semibold shrink-0">Suggested Remediation:</strong>
                      <span>{c.remediation_suggestion}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Legal Compliance Disclaimer */}
          <div className="p-3.5 bg-workspace border border-border rounded-xl text-[11px] text-ink-secondary leading-relaxed">
            <strong className="text-navy block mb-0.5">Decision-Support Notice:</strong>
            {result?.compliance_disclaimer ||
              "Inkloom AI conflict detection assists organizational decision-making by applying documented governance priority hierarchies. It does not replace qualified legal review."}
          </div>
        </div>

        <div className="pt-4 border-t border-border mt-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-workspace hover:bg-slate-200 text-ink-secondary text-xs font-semibold rounded-xl border border-border transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
