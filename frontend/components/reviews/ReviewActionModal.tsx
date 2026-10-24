"use client";

import React, { useState } from "react";
import { ReviewAction } from "@/types";
import { Scale, Check, AlertTriangle, X } from "lucide-react";

interface ReviewActionModalProps {
  isOpen: boolean;
  submissionTitle: string;
  submissionId: string;
  onClose: () => void;
  onSubmitDecision: (action: "approve" | "reject" | "request_changes", comments: string) => Promise<void>;
}

export function ReviewActionModal({
  isOpen,
  submissionTitle,
  submissionId,
  onClose,
  onSubmitDecision,
}: ReviewActionModalProps) {
  const [selectedAction, setSelectedAction] = useState<"approve" | "reject" | "request_changes">("approve");
  const [comments, setComments] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Action Choice Pills */}
          <div>
            <label className="block text-xs font-semibold text-navy mb-2">Review Decision *</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSelectedAction("approve")}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1.5 ${
                  selectedAction === "approve"
                    ? "bg-status-success text-white border-status-success shadow-subtle"
                    : "bg-surface border-border text-ink-secondary hover:bg-workspace"
                }`}
              >
                <Check className="w-3.5 h-3.5" />
                <span>Approve</span>
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
            <label className="block text-xs font-semibold text-navy mb-1.5">
              Reviewer Justification / Creator Guidance *
            </label>
            <textarea
              required
              rows={4}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="State clear reasons or required rule modifications for the submitter..."
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
