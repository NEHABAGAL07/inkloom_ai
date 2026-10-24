"use client";

import React, { useState } from "react";
import { X, Send, ShieldAlert, CheckCircle2, Globe, Building } from "lucide-react";
import { api } from "@/services/api";

interface SubmitReviewModalProps {
  currentJurisdiction: string;
  currentIndustry: string;
  onClose: () => void;
  onSubmitSuccess: () => Promise<void>;
}

export function SubmitReviewModal({
  currentJurisdiction,
  currentIndustry,
  onClose,
  onSubmitSuccess,
}: SubmitReviewModalProps) {
  const [notes, setNotes] = useState("");
  const [jurisdiction, setJurisdiction] = useState(currentJurisdiction || "Global");
  const [industry, setIndustry] = useState(currentIndustry || "General");
  const [requiresLegalApproval, setRequiresLegalApproval] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notes.trim()) {
      setError("Please describe the proposed changes and rationale for legal review.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await api.submitGuidelineForReview(notes, requiresLegalApproval, jurisdiction, industry);
      await onSubmitSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to submit draft for legal review.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0B0F19] border border-slate-800 rounded-2xl w-full max-w-xl p-6 shadow-2xl relative text-slate-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
          <Send className="w-4 h-4" />
          <span>Governance Review Pipeline</span>
        </div>
        <h2 className="text-xl font-black text-white tracking-tight">
          Submit Guidelines for Legal &amp; Compliance Review
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Submits your working draft to authorized Legal &amp; Compliance Officers for formal verification and authorization prior to publication.
        </p>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Globe className="w-3 h-3 text-indigo-400" />
                Target Jurisdiction
              </label>
              <select
                value={jurisdiction}
                onChange={(e) => setJurisdiction(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="Global">Global Standards</option>
                <option value="US">United States (FTC / Lanham)</option>
                <option value="EU">European Union (GDPR / UCPD)</option>
                <option value="UK">United Kingdom (ASA / CMA)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Building className="w-3 h-3 text-indigo-400" />
                Industry Scope
              </label>
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="General">General Commercial</option>
                <option value="SaaS">Enterprise SaaS &amp; Cloud</option>
                <option value="Fintech">Financial Services / Fintech</option>
                <option value="Healthcare">Healthcare &amp; Life Sciences</option>
                <option value="E-Commerce">Consumer E-Commerce</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Summary of Proposed Changes &amp; Legal Context <span className="text-rose-400">*</span>
            </label>
            <textarea
              required
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Detail what was modified (e.g. added performance claim evidence, updated mandatory disclaimers, or revised prohibited terminology) to assist legal review..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="p-3 bg-indigo-950/30 border border-indigo-900/50 rounded-xl flex items-start gap-2.5">
            <input
              type="checkbox"
              id="require_legal"
              checked={requiresLegalApproval}
              onChange={(e) => setRequiresLegalApproval(e.target.checked)}
              className="mt-0.5 rounded border-slate-700 text-indigo-600 focus:ring-0"
            />
            <label htmlFor="require_legal" className="text-xs text-slate-300 leading-relaxed cursor-pointer">
              <strong className="text-white block font-semibold">Enforce Mandatory Legal Clearance</strong>
              Guidelines containing claim benchmarks or regulatory disclaimers cannot be published until approved by a qualified Legal &amp; Compliance Officer.
            </label>
          </div>

          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-indigo-600/30 flex items-center gap-2"
            >
              {isSubmitting ? (
                <>Submitting...</>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit for Review</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
