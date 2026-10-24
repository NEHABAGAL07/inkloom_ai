"use client";

import React, { useState } from "react";
import {
  X,
  Scale,
  CheckCircle,
  AlertTriangle,
  XCircle,
  ShieldCheck,
  Clock,
  User,
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
    if (!rationale.trim()) {
      setError("Please provide clear statutory justification or required revisions.");
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
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface border border-border rounded-2xl w-full max-w-2xl p-6 shadow-xl relative text-ink-primary max-h-[90vh] flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-ink-muted hover:text-navy transition p-1"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-teal text-xs font-bold uppercase tracking-wider mb-1">
          <Scale className="w-4 h-4" />
          <span>Legal &amp; Compliance Authority</span>
        </div>
        <h2 className="text-xl font-extrabold text-navy tracking-tight">
          Guideline Proposal Review &amp; Statutory Authorization
        </h2>
        <p className="text-xs text-ink-secondary mt-1 leading-relaxed">
          Review the submitted brand guidelines proposal against applicable statutory requirements, advertising standards, and internal risk policies.
        </p>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-status-error text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="mt-4 flex-1 overflow-y-auto space-y-4 pr-1">
          {/* Submission Info Banner */}
          <div className="p-4 rounded-xl bg-workspace border border-border space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-ink-secondary">Submitted by:</span>
              <span className="text-navy font-bold flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-teal" />
                {guideline.submitted_by || "Brand Manager"}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-ink-secondary">Submitted at:</span>
              <span className="text-ink-muted flex items-center gap-1 font-mono text-[11px]">
                <Clock className="w-3.5 h-3.5" />
                {guideline.submitted_at
                  ? new Date(guideline.submitted_at).toLocaleString()
                  : "Recently"}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-ink-secondary">Scope:</span>
              <span className="text-navy font-mono text-[11px] font-bold">
                {guideline.jurisdiction} · {guideline.industry}
              </span>
            </div>

            {guideline.submission_notes && (
              <div className="pt-2 border-t border-border text-xs">
                <span className="font-bold text-[11px] uppercase tracking-wider text-ink-muted block mb-1">
                  Manager Rationale
                </span>
                <p className="text-navy leading-relaxed bg-surface p-2.5 rounded-lg border border-border">
                  {guideline.submission_notes}
                </p>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-navy uppercase tracking-wider mb-2">
                Legal Decision *
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setDecision("approved")}
                  className={`p-3 rounded-xl border text-left transition flex flex-col items-start gap-1.5 ${
                    decision === "approved"
                      ? "bg-emerald-50 border-status-success text-status-success shadow-subtle"
                      : "bg-surface border-border text-ink-secondary hover:bg-workspace"
                  }`}
                >
                  <CheckCircle className="w-4 h-4 text-status-success" />
                  <span className="font-bold text-xs text-navy">Approve</span>
                  <span className="text-[10px] leading-tight text-ink-muted">
                    Authorize publication under compliance policy
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setDecision("changes_requested")}
                  className={`p-3 rounded-xl border text-left transition flex flex-col items-start gap-1.5 ${
                    decision === "changes_requested"
                      ? "bg-amber-50 border-status-warning text-status-warning shadow-subtle"
                      : "bg-surface border-border text-ink-secondary hover:bg-workspace"
                  }`}
                >
                  <AlertTriangle className="w-4 h-4 text-status-warning" />
                  <span className="font-bold text-xs text-navy">Changes</span>
                  <span className="text-[10px] leading-tight text-ink-muted">
                    Return to manager with required revisions
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setDecision("rejected")}
                  className={`p-3 rounded-xl border text-left transition flex flex-col items-start gap-1.5 ${
                    decision === "rejected"
                      ? "bg-red-50 border-status-error text-status-error shadow-subtle"
                      : "bg-surface border-border text-ink-secondary hover:bg-workspace"
                  }`}
                >
                  <XCircle className="w-4 h-4 text-status-error" />
                  <span className="font-bold text-xs text-navy">Reject</span>
                  <span className="text-[10px] leading-tight text-ink-muted">
                    Decline proposal due to compliance risks
                  </span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-navy uppercase tracking-wider mb-1.5">
                Legal &amp; Regulatory Rationale <span className="text-status-error">*</span>
              </label>
              <textarea
                required
                rows={4}
                value={rationale}
                onChange={(e) => setRationale(e.target.value)}
                placeholder="State statutory citations, risk considerations, or specific required revisions..."
                className="w-full bg-workspace border border-border rounded-xl p-3 text-xs text-navy placeholder:text-ink-muted focus:outline-none focus:border-teal leading-relaxed"
              />
            </div>

            <div className="p-3 bg-workspace border border-border rounded-xl text-[11px] text-ink-secondary leading-relaxed">
              <strong className="text-navy block mb-0.5 font-bold">Statutory Governance Notice:</strong>
              Inkloom AI supports compliance workflows. Guidelines and automated audit results do not constitute formal legal counsel or guarantee dispute immunity. Review decisions are recorded permanently in the immutable audit trail.
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
                className={`px-5 py-2 text-white text-xs font-bold rounded-xl transition shadow-subtle flex items-center gap-2 ${
                  decision === "approved"
                    ? "bg-status-success hover:bg-emerald-800"
                    : decision === "changes_requested"
                    ? "bg-status-warning hover:bg-amber-800"
                    : "bg-status-error hover:bg-red-800"
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
