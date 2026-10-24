"use client";

import React, { useState } from "react";
import {
  X,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  User,
  FileText,
  Scale,
} from "lucide-react";
import { BrandGuidelineProfile } from "@/types";
import { api } from "@/services/api";

interface LegalReviewModalProps {
  guideline: BrandGuidelineProfile;
  onClose: () => void;
  onReviewSuccess: () => Promise<void>;
}

export function LegalReviewModal({
  guideline,
  onClose,
  onReviewSuccess,
}: LegalReviewModalProps) {
  const [decision, setDecision] = useState<"approved" | "changes_requested" | "rejected">("approved");
  const [rationale, setRationale] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rationale.trim() || rationale.length < 5) {
      setError("Please document a formal legal/compliance rationale of at least 5 characters.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await api.recordGuidelineReviewDecision(decision, rationale);
      await onReviewSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to record legal review decision.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0B0F19] border border-slate-800 rounded-2xl w-full max-w-2xl p-6 shadow-2xl relative text-slate-200 max-h-[90vh] flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
          <Scale className="w-4 h-4" />
          <span>Legal &amp; Compliance Authority</span>
        </div>
        <h2 className="text-xl font-black text-white tracking-tight">
          Guideline Proposal Review &amp; Statutory Authorization
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Review the submitted brand guidelines proposal against applicable statutory requirements, advertising standards, and internal risk policies.
        </p>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <div className="mt-4 flex-1 overflow-y-auto space-y-4 pr-1">
          {/* Submission Info Banner */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300">Submitted by:</span>
              <span className="text-indigo-400 font-medium flex items-center gap-1">
                <User className="w-3.5 h-3.5" />
                {guideline.submitted_by || "Brand Manager"}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300">Submitted at:</span>
              <span className="text-slate-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {guideline.submitted_at
                  ? new Date(guideline.submitted_at).toLocaleString()
                  : "Recently"}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300">Scope:</span>
              <span className="text-slate-300 font-mono text-[11px]">
                {guideline.jurisdiction} · {guideline.industry}
              </span>
            </div>

            {guideline.submission_notes && (
              <div className="pt-2 border-t border-slate-800 text-xs">
                <span className="font-bold text-[11px] uppercase tracking-wider text-slate-400 block mb-1">
                  Manager Rationale
                </span>
                <p className="text-slate-300 leading-relaxed bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                  {guideline.submission_notes}
                </p>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Legal Decision
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setDecision("approved")}
                  className={`p-3 rounded-xl border text-left transition flex flex-col items-start gap-1.5 ${
                    decision === "approved"
                      ? "bg-emerald-950/40 border-emerald-500 text-emerald-300 shadow-md shadow-emerald-900/20"
                      : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold text-xs text-white">Approve</span>
                  <span className="text-[10px] leading-tight text-slate-400">
                    Authorize publication under compliance policy
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setDecision("changes_requested")}
                  className={`p-3 rounded-xl border text-left transition flex flex-col items-start gap-1.5 ${
                    decision === "changes_requested"
                      ? "bg-amber-950/40 border-amber-500 text-amber-300 shadow-md shadow-amber-900/20"
                      : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span className="font-bold text-xs text-white">Request Changes</span>
                  <span className="text-[10px] leading-tight text-slate-400">
                    Return to manager with required revisions
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setDecision("rejected")}
                  className={`p-3 rounded-xl border text-left transition flex flex-col items-start gap-1.5 ${
                    decision === "rejected"
                      ? "bg-rose-950/40 border-rose-500 text-rose-300 shadow-md shadow-rose-900/20"
                      : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <XCircle className="w-4 h-4 text-rose-400" />
                  <span className="font-bold text-xs text-white">Reject</span>
                  <span className="text-[10px] leading-tight text-slate-400">
                    Decline proposal due to compliance risks
                  </span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Legal &amp; Regulatory Rationale <span className="text-rose-400">*</span>
              </label>
              <textarea
                required
                rows={4}
                value={rationale}
                onChange={(e) => setRationale(e.target.value)}
                placeholder="State statutory citations, risk considerations, or specific required revisions..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="p-3 bg-slate-900/50 border border-slate-800 rounded-xl text-[11px] text-slate-400 leading-relaxed">
              <strong className="text-slate-300 block mb-0.5">Statutory Governance Notice:</strong>
              Inkloom AI supports compliance workflows. Guidelines and automated audit results do not constitute formal legal counsel or guarantee dispute immunity. Review decisions are recorded permanently in the immutable audit trail.
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
                className={`px-5 py-2 text-white text-xs font-bold rounded-xl transition shadow-lg flex items-center gap-2 ${
                  decision === "approved"
                    ? "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30"
                    : decision === "changes_requested"
                    ? "bg-amber-600 hover:bg-amber-500 shadow-amber-600/30"
                    : "bg-rose-600 hover:bg-rose-500 shadow-rose-600/30"
                }`}
              >
                {isSubmitting ? (
                  <>Processing...</>
                ) : (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Submit Decision ({decision.replace("_", " ")})</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
