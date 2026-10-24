"use client";

import React, { useEffect, useState } from "react";
import {
  X,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Plus,
  Scale,
  Sparkles,
} from "lucide-react";
import { StarterTemplateRule } from "@/types";
import { api } from "@/services/api";

interface StarterTemplatesModalProps {
  onClose: () => void;
  onImportRule: (rule: StarterTemplateRule) => void;
}

export function StarterTemplatesModal({
  onClose,
  onImportRule,
}: StarterTemplatesModalProps) {
  const [jurisdiction, setJurisdiction] = useState<string>("all");
  const [industry, setIndustry] = useState<string>("all");
  const [templates, setTemplates] = useState<StarterTemplateRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [importedIds, setImportedIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchTemplates = async (jur: string, ind: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getStarterTemplates(jur, ind);
      setTemplates(res.templates || []);
    } catch (err: any) {
      setError(err?.message || "Failed to load starter templates.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates(jurisdiction, industry);
  }, [jurisdiction, industry]);

  const handleImport = (template: StarterTemplateRule) => {
    onImportRule(template);
    setImportedIds((prev) => [...prev, template.rule_name]);
  };

  return (
    <div className="fixed inset-0 z-50 bg-navy/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface border border-border rounded-xl w-full max-w-3xl p-6 shadow-xl relative text-ink-primary max-h-[90vh] flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-ink-muted hover:text-ink-primary transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-teal text-xs font-bold uppercase tracking-wider mb-1">
          <BookOpen className="w-4 h-4" />
          <span>Statutory Template Library</span>
        </div>
        <h2 className="text-xl font-bold text-navy tracking-tight">
          Verified Legal &amp; Compliance Starter Rules
        </h2>
        <p className="text-xs text-ink-secondary mt-1">
          Pre-configured compliance rules grounded in real statutory requirements (FTC, Lanham Act, GDPR, WCAG 2.1). Unverified suggestions are clearly distinguished from certified statutory rules.
        </p>

        {/* Filter controls */}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-ink-secondary font-medium">Jurisdiction:</span>
            <select
              value={jurisdiction}
              onChange={(e) => setJurisdiction(e.target.value)}
              className="bg-workspace border border-border rounded-lg px-2.5 py-1.5 text-xs text-ink-primary focus:outline-none focus:border-teal"
            >
              <option value="all">All Jurisdictions</option>
              <option value="Global">Global</option>
              <option value="US">United States (FTC / Lanham)</option>
              <option value="EU">European Union (GDPR)</option>
              <option value="UK">United Kingdom</option>
            </select>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-ink-secondary font-medium">Industry:</span>
            <select
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="bg-workspace border border-border rounded-lg px-2.5 py-1.5 text-xs text-ink-primary focus:outline-none focus:border-teal"
            >
              <option value="all">All Industries</option>
              <option value="General">General Commercial</option>
              <option value="SaaS">SaaS &amp; Cloud</option>
              <option value="Fintech">Fintech</option>
              <option value="E-Commerce">E-Commerce</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="mt-3 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Template List */}
        <div className="mt-4 flex-1 overflow-y-auto space-y-3 pr-1">
          {loading ? (
            <div className="p-8 text-center text-xs text-ink-muted">Loading statutory rule templates...</div>
          ) : templates.length === 0 ? (
            <div className="p-8 text-center bg-workspace rounded-xl border border-border text-xs text-ink-muted">
              No matching template rules found for the selected scope.
            </div>
          ) : (
            templates.map((t, idx) => {
              const isImported = importedIds.includes(t.rule_name);
              return (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-workspace border border-border hover:border-teal/40 transition space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-navy">{t.rule_name}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white border border-border text-ink-secondary">
                          {t.jurisdiction}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            t.priority_level === 1
                              ? "bg-rose-50 border border-rose-200 text-rose-800"
                              : "bg-amber-50 border border-amber-200 text-amber-800"
                          }`}
                        >
                          {t.priority_level === 1 ? "Mandatory Legal" : "Policy Standard"}
                        </span>
                      </div>

                      {t.authoritative_source && (
                        <div className="flex items-center gap-1.5 mt-1 text-[11px] text-ink-muted">
                          <Scale className="w-3 h-3 text-teal shrink-0" />
                          <span>{t.authoritative_source}</span>
                          {t.source_url && (
                            <a
                              href={t.source_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-teal hover:text-teal-hover inline-flex items-center gap-0.5 font-medium"
                            >
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => handleImport(t)}
                      disabled={isImported}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition flex items-center gap-1.5 shrink-0 ${
                        isImported
                          ? "bg-emerald-50 border border-emerald-300 text-emerald-800"
                          : "bg-teal hover:bg-teal-hover text-white shadow-sm"
                      }`}
                    >
                      {isImported ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Imported</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          <span>Import to Draft</span>
                        </>
                      )}
                    </button>
                  </div>

                  <p className="text-xs text-ink-secondary leading-relaxed bg-surface p-2.5 rounded-lg border border-border">
                    {t.description}
                  </p>

                  {t.required_disclosure && (
                    <div className="text-[11px] text-ink-secondary bg-blue-50/60 border border-blue-200 p-2.5 rounded-lg">
                      <strong className="text-blue-900 block mb-0.5">Required Statutory Disclosure:</strong>
                      <span className="italic text-ink-primary">"{t.required_disclosure}"</span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="pt-4 border-t border-border mt-4 flex items-center justify-between">
          <p className="text-[11px] text-ink-muted max-w-md">
            Templates provide reference baselines and do not constitute formal legal counsel.
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-workspace hover:bg-slate-200 text-ink-primary text-xs font-medium rounded-lg border border-border transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
