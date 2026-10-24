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
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0B0F19] border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative text-slate-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
          <MessageSquare className="w-4 h-4" />
          <span>Compliance Clarification Request</span>
        </div>
        <h2 className="text-xl font-black text-white tracking-tight">
          Report Unclear or Conflicting Guidance
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Employees and creative creators can request clarification or flag ambiguities for legal review. Official guidelines cannot be modified directly by employees.
        </p>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {successMessage ? (
          <div className="my-8 p-4 rounded-xl bg-emerald-950/40 border border-emerald-800 text-emerald-300 text-center space-y-2">
            <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto" />
            <p className="text-xs font-bold text-white">Report Submitted Successfully</p>
            <p className="text-[11px] text-slate-300">{successMessage}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Rule or Section Reference <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={ruleReference}
                onChange={(e) => setRuleReference(e.target.value)}
                placeholder="e.g., Brand Voice Words to Avoid, Social Media Safe Areas, Mandatory Disclaimers"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Report Type
              </label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="unclear">Ambiguous or Unclear Phrasing</option>
                <option value="conflicting">Conflicting Rules Between Sections</option>
                <option value="missing_exception">Missing Exception for Technical/Channel Context</option>
                <option value="outdated">Outdated Product/Trademark Specification</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Detailed Question or Clarification Request <span className="text-rose-400">*</span>
              </label>
              <textarea
                required
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explain the specific scenario, content context, or contradiction you encountered..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="p-3 bg-slate-900/50 border border-slate-800 rounded-xl text-[11px] text-slate-400 flex items-start gap-2">
              <HelpCircle className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <span>
                Your question will be reviewed by the Legal &amp; Compliance team. Resolution notes will appear in the governance audit log once addressed.
              </span>
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
                {isSubmitting ? "Submitting..." : "Submit Question"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
