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
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface border border-border rounded-2xl w-full max-w-xl p-6 shadow-xl relative text-ink-primary">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-ink-muted hover:text-navy transition p-1"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-teal text-xs font-bold uppercase tracking-wider mb-1">
          <Send className="w-4 h-4" />
          <span>Governance Review Pipeline</span>
        </div>
        <h2 className="text-xl font-extrabold text-navy tracking-tight">
          Submit Guidelines for Legal &amp; Compliance Review
        </h2>
        <p className="text-xs text-ink-secondary mt-1 leading-relaxed">
          Submits your working draft to authorized Legal &amp; Compliance Officers for formal verification and authorization prior to publication.
        </p>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-status-error text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-navy uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Globe className="w-3 h-3 text-teal" />
                Target Jurisdiction
              </label>
              <select
                value={jurisdiction}
                onChange={(e) => setJurisdiction(e.target.value)}
                className="w-full bg-workspace border border-border rounded-xl px-3 py-2 text-xs text-navy focus:outline-none focus:border-teal"
              >
                <option value="Global">Global Standards</option>
                <option value="US">United States (FTC / Lanham)</option>
                <option value="EU">European Union (GDPR / UCPD)</option>
                <option value="UK">United Kingdom (ASA / CMA)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-navy uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Building className="w-3 h-3 text-teal" />
                Industry Scope
              </label>
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full bg-workspace border border-border rounded-xl px-3 py-2 text-xs text-navy focus:outline-none focus:border-teal"
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
            <label className="block text-[11px] font-bold text-navy uppercase tracking-wider mb-1.5">
              Summary of Proposed Changes &amp; Legal Context <span className="text-status-error">*</span>
            </label>
            <textarea
              required
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Detail what was modified (e.g. added performance claim evidence, updated mandatory disclaimers, or revised prohibited terminology) to assist legal review..."
              className="w-full bg-workspace border border-border rounded-xl p-3 text-xs text-navy placeholder:text-ink-muted focus:outline-none focus:border-teal leading-relaxed"
            />
          </div>

          <div className="p-3 bg-workspace border border-border rounded-xl flex items-start gap-2.5">
            <input
              type="checkbox"
              id="require_legal"
              checked={requiresLegalApproval}
              onChange={(e) => setRequiresLegalApproval(e.target.checked)}
              className="mt-0.5 rounded border-border text-teal focus:ring-0"
            />
            <label htmlFor="require_legal" className="text-xs text-ink-secondary leading-relaxed cursor-pointer">
              <strong className="text-navy block font-semibold">Enforce Mandatory Legal Clearance</strong>
              Guidelines containing claim benchmarks or regulatory disclaimers cannot be published until approved by a qualified Legal &amp; Compliance Officer.
            </label>
          </div>

          <div className="pt-3 border-t border-border flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 bg-workspace hover:bg-slate-200 text-ink-secondary text-xs font-semibold rounded-xl border border-border transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-teal hover:bg-teal-hover text-white text-xs font-bold rounded-xl transition shadow-subtle flex items-center gap-2"
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
