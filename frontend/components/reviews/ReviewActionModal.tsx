"use client";

import React, { useState } from "react";
import { ReviewAction } from "@/types";
import { Scale, Check, AlertTriangle, X, Lock } from "lucide-react";

interface ReviewActionModalProps {
  isOpen: boolean;
  submissionTitle: string;
  submissionId: string;
  isAuthor?: boolean;
  onClose: () => void;
  onSubmitDecision: (action: "approve" | "reject" | "request_changes", comments: string) => Promise<void>;
}

export function ReviewActionModal({
  isOpen,
  submissionTitle,
  submissionId,
  isAuthor = false,
  onClose,
  onSubmitDecision,
}: ReviewActionModalProps) {
  const [selectedAction, setSelectedAction] = useState<"approve" | "reject" | "request_changes">(
    isAuthor ? "request_changes" : "approve"
  );
  const [comments, setComments] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedAction === "approve" && isAuthor) {
      alert("Separation of duties violation: Creators cannot authorize their own submissions.");
      return;
    }
    if ((selectedAction === "reject" || selectedAction === "request_changes") && !comments.trim()) {
      alert("Mandatory justification: Please specify the policy violation or required revision.");
      return;
    }
    setIsSubmitting(true);
    try {
      await onSubmitDecision(selectedAction, comments);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface border border-border rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-start justify-between border-b border-border pb-3">
          <div>
            <h3 className="text-base font-bold text-navy tracking-tight flex items-center gap-2">
              <Scale className="w-4 h-4 text-teal" />
              <span>Record Compliance Decision</span>
            </h3>
            <p className="text-xs text-ink-muted mt-0.5 line-clamp-1">{submissionTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="text-ink-muted hover:text-navy text-sm p-1 leading-none"
          >
            ✕
          </button>
        </div>

        {isAuthor && (
          <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-amber-900 dark:text-amber-300">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Separation of Duties Notice</span>
            </div>
            <p className="text-amber-800 dark:text-amber-200/80 leading-relaxed">
              You are the author of this submission. Self-authorization is disabled to satisfy enterprise compliance policies.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Action Choice Pills */}
          <div>
            <label className="block text-xs font-semibold text-navy mb-2">Review Decision *</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                disabled={isAuthor}
                onClick={() => setSelectedAction("approve")}
                title={isAuthor ? "Self-approval is disabled under separation of duties" : ""}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1.5 ${
                  isAuthor
                    ? "bg-slate-200 dark:bg-slate-800 text-slate-400 border-slate-300 cursor-not-allowed"
                    : selectedAction === "approve"
                    ? "bg-status-success text-white border-status-success shadow-subtle"
                    : "bg-surface border-border text-ink-secondary hover:bg-workspace"
                }`}
              >
                {isAuthor ? <Lock className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
                <span>{isAuthor ? "Self Locked" : "Approve"}</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedAction("request_changes")}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1.5 ${
                  selectedAction === "request_changes"
                    ? "bg-status-warning text-white border-status-warning shadow-subtle"
                    : "bg-surface border-border text-ink-secondary hover:bg-workspace"
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Changes</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedAction("reject")}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1.5 ${
                  selectedAction === "reject"
                    ? "bg-status-error text-white border-status-error shadow-subtle"
                    : "bg-surface border-border text-ink-secondary hover:bg-workspace"
                }`}
              >
                <X className="w-3.5 h-3.5" />
                <span>Reject</span>
              </button>
            </div>
          </div>

          {/* Reviewer Comments */}
          <div>
            <label className="block text-xs font-semibold text-navy mb-1.5 flex items-center justify-between">
              <span>
                Reviewer Justification / Creator Guidance{" "}
                {selectedAction !== "approve" ? "(Mandatory) *" : "*"}
              </span>
              {selectedAction !== "approve" && (
                <span className="text-[10px] text-amber-600 font-medium">Policy citation required</span>
              )}
            </label>
            <textarea
              required
              rows={4}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder={
                selectedAction === "approve"
                  ? "State statutory sign-off notes or compliance approval reference..."
                  : "State specific policy, trademark, or regulatory violations and required revisions..."
              }
              className="w-full bg-workspace border border-border rounded-xl p-3 text-xs text-navy focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal leading-relaxed"
            />
          </div>

          <div className="flex gap-2 pt-2 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-workspace hover:bg-slate-200 text-ink-secondary rounded-xl text-xs font-bold transition border border-border"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 bg-teal hover:bg-teal-hover text-white font-bold text-xs rounded-xl shadow-subtle transition disabled:opacity-50"
            >
              {isSubmitting ? "Recording..." : "Record Official Decision"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
