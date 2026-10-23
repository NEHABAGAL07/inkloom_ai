"use client";

import React, { useState } from "react";
import { ReviewAction } from "@/types";

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
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">Record Human Governance Review</h3>
            <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{submissionTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-300 text-lg leading-none p-1"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Action Choice Pills */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">Review Decision *</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSelectedAction("approve")}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                  selectedAction === "approve"
                    ? "bg-emerald-950/80 border-emerald-500 text-emerald-300 shadow-sm shadow-emerald-500/20"
                    : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                ✓ Approve
              </button>
              <button
                type="button"
                onClick={() => setSelectedAction("request_changes")}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                  selectedAction === "request_changes"
                    ? "bg-amber-950/80 border-amber-500 text-amber-300 shadow-sm shadow-amber-500/20"
                    : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                ✏️ Request Changes
              </button>
              <button
                type="button"
                onClick={() => setSelectedAction("reject")}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                  selectedAction === "reject"
                    ? "bg-rose-950/80 border-rose-500 text-rose-300 shadow-sm shadow-rose-500/20"
                    : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                ✕ Reject
              </button>
            </div>
          </div>

          {/* Reviewer Comments */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Reviewer Justification / Creator Guidance
            </label>
            <textarea
              rows={4}
              required={selectedAction !== "approve"}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              placeholder={
                selectedAction === "approve"
                  ? "Optional sign-off notes (e.g. 'Approved with terminology adjustments')..."
                  : "Detail required revisions before resubmission..."
              }
            />
          </div>

          {/* Compliance Assurance Notice */}
          <div className="bg-indigo-950/40 border border-indigo-900/50 p-3 rounded-xl text-[11px] text-indigo-300 leading-relaxed">
            <span className="font-bold">Human Accountability Principle:</span> By recording this decision, you take responsibility for this release step under brand governance policies.
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md transition disabled:opacity-50"
            >
              {isSubmitting ? "Submitting Decision..." : "Confirm Decision"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
