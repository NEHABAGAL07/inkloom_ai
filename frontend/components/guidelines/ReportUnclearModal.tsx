"use client";

import React, { useState } from "react";
import { X, MessageSquare, AlertCircle, CheckCircle, HelpCircle } from "lucide-react";
import { api } from "@/services/api";

interface ReportUnclearModalProps {
  initialRuleReference?: string;
  onClose: () => void;
}

export function ReportUnclearModal({
  initialRuleReference,
  onClose,
}: ReportUnclearModalProps) {
  const [ruleReference, setRuleReference] = useState(initialRuleReference || "");
  const [reportType, setReportType] = useState<"unclear" | "conflicting" | "missing_exception" | "outdated">("unclear");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleReference.trim() || !description.trim()) {
      setError("Please specify the rule reference and a detailed description.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await api.reportUnclearRule(ruleReference, reportType, description);
      setSuccessMessage("Your clarification report has been recorded and routed to Legal & Compliance.");
      setTimeout(() => {
        onClose();
      }, 2500);
    } catch (err: any) {
      setError(err?.message || "Failed to submit clarification report.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-navy/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface border border-border rounded-xl w-full max-w-lg p-6 shadow-xl relative text-ink-primary">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-ink-muted hover:text-ink-primary transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-teal text-xs font-bold uppercase tracking-wider mb-1">
          <MessageSquare className="w-4 h-4" />
          <span>Compliance Clarification Request</span>
        </div>
        <h2 className="text-xl font-bold text-navy tracking-tight">
          Report Unclear or Conflicting Guidance
        </h2>
        <p className="text-xs text-ink-secondary mt-1">
          Employees and creative creators can request clarification or flag ambiguities for legal review. Official guidelines cannot be modified directly by employees.
        </p>

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {successMessage ? (
          <div className="my-8 p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-center space-y-2">
            <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto" />
            <p className="text-xs font-bold text-emerald-950">Report Submitted Successfully</p>
            <p className="text-[11px] text-ink-secondary">{successMessage}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-ink-secondary uppercase tracking-wider mb-1">
                Rule or Section Reference <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                required
                value={ruleReference}
                onChange={(e) => setRuleReference(e.target.value)}
                placeholder="e.g., Brand Voice Words to Avoid, Social Media Safe Areas, Mandatory Disclaimers"
                className="w-full bg-workspace border border-border rounded-lg px-3 py-2 text-xs text-ink-primary placeholder-ink-muted focus:outline-none focus:border-teal"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-ink-secondary uppercase tracking-wider mb-1">
                Report Type
              </label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value as any)}
                className="w-full bg-workspace border border-border rounded-lg px-3 py-2 text-xs text-ink-primary focus:outline-none focus:border-teal"
              >
                <option value="unclear">Ambiguous or Unclear Phrasing</option>
                <option value="conflicting">Conflicting Rules Between Sections</option>
                <option value="missing_exception">Missing Exception for Technical/Channel Context</option>
                <option value="outdated">Outdated Product/Trademark Specification</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-ink-secondary uppercase tracking-wider mb-1">
                Detailed Question or Clarification Request <span className="text-rose-600">*</span>
              </label>
              <textarea
                required
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explain the specific scenario, content context, or contradiction you encountered..."
                className="w-full bg-workspace border border-border rounded-lg p-3 text-xs text-ink-primary placeholder-ink-muted focus:outline-none focus:border-teal"
              />
            </div>

            <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-lg text-[11px] text-ink-secondary flex items-start gap-2">
              <HelpCircle className="w-4 h-4 text-teal shrink-0 mt-0.5" />
              <span>
                Your question will be reviewed by the Legal &amp; Compliance team. Resolution notes will appear in the governance audit log once addressed.
              </span>
            </div>

            <div className="pt-3 border-t border-border flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 bg-workspace hover:bg-slate-200 text-ink-primary text-xs font-medium rounded-lg border border-border transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 bg-teal hover:bg-teal-hover text-white text-xs font-semibold rounded-lg transition shadow-sm flex items-center gap-2"
              >
                {isSubmitting ? "Submitting..." : "Submit Question"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
