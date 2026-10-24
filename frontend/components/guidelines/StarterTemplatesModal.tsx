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
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0B0F19] border border-slate-800 rounded-2xl w-full max-w-3xl p-6 shadow-2xl relative text-slate-200 max-h-[90vh] flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
          <BookOpen className="w-4 h-4" />
          <span>Statutory Template Library</span>
        </div>
        <h2 className="text-xl font-black text-white tracking-tight">
          Verified Legal &amp; Compliance Starter Rules
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Pre-configured compliance rules grounded in real statutory requirements (FTC, Lanham Act, GDPR, WCAG 2.1). Unverified suggestions are clearly distinguished from certified statutory rules.
        </p>

        {/* Filter controls */}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-semibold">Jurisdiction:</span>
            <select
              value={jurisdiction}
              onChange={(e) => setJurisdiction(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Jurisdictions</option>
              <option value="Global">Global</option>
              <option value="US">United States (FTC / Lanham)</option>
              <option value="EU">European Union (GDPR)</option>
              <option value="UK">United Kingdom</option>
            </select>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-semibold">Industry:</span>
            <select
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
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
          <div className="mt-3 p-3 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Template List */}
        <div className="mt-4 flex-1 overflow-y-auto space-y-3 pr-1">
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-500">Loading statutory rule templates...</div>
          ) : templates.length === 0 ? (
            <div className="p-8 text-center bg-slate-900/50 rounded-xl border border-slate-800 text-xs text-slate-400">
              No matching template rules found for the selected scope.
            </div>
          ) : (
            templates.map((t, idx) => {
              const isImported = importedIds.includes(t.rule_name);
              return (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-white">{t.rule_name}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-950 border border-indigo-800 text-indigo-300">
                          {t.jurisdiction}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            t.priority_level === 1
                              ? "bg-rose-950/80 border border-rose-800 text-rose-300"
                              : "bg-amber-950/80 border border-amber-800 text-amber-300"
                          }`}
                        >
                          {t.priority_level === 1 ? "Mandatory Legal" : "Policy Standard"}
                        </span>
                      </div>

                      {t.authoritative_source && (
                        <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-400">
                          <Scale className="w-3 h-3 text-indigo-400 shrink-0" />
                          <span>{t.authoritative_source}</span>
                          {t.source_url && (
                            <a
                              href={t.source_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-0.5"
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
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 shrink-0 ${
                        isImported
                          ? "bg-emerald-950/60 border border-emerald-800 text-emerald-300"
                          : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20"
                      }`}
                    >
                      {isImported ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
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

                  <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/50 p-2.5 rounded-lg border border-slate-800/60">
                    {t.description}
                  </p>

                  {t.required_disclosure && (
                    <div className="text-[11px] text-slate-400 bg-indigo-950/20 border border-indigo-900/40 p-2 rounded-lg">
                      <strong className="text-indigo-300 block mb-0.5">Required Statutory Disclosure:</strong>
                      <span className="italic text-slate-300">"{t.required_disclosure}"</span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="pt-4 border-t border-slate-800 mt-4 flex items-center justify-between">
          <p className="text-[11px] text-slate-500 max-w-md">
            Templates provide reference baselines and do not constitute formal legal counsel.
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
