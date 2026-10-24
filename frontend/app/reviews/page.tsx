"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/services/api";
import { ContentSubmission } from "@/types";
import { ReviewActionModal } from "@/components/reviews/ReviewActionModal";
import { AuditTrailTimeline } from "@/components/reviews/AuditTrailTimeline";
import { Scale, FileText, CheckCircle, ArrowRight } from "lucide-react";

export default function ReviewsPage() {
  const [pendingSubmissions, setPendingSubmissions] = useState<ContentSubmission[]>([]);
  const [selectedSub, setSelectedSub] = useState<ContentSubmission | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReviews() {
      try {
        const subs = await api.getPendingReviews();
        setPendingSubmissions(subs);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadReviews();
  }, []);

  const handleOpenReview = (sub: ContentSubmission) => {
    setSelectedSub(sub);
    setModalOpen(true);
  };

  const handleDecisionSubmit = async (
    action: "approve" | "reject" | "request_changes",
    comments: string
  ) => {
    if (!selectedSub) return;
    await api.submitReviewDecision({
      submission_id: selectedSub.id,
      revision_id: selectedSub.current_revision_id,
      action,
      comments,
    });
    // Refresh queue
    const updated = await api.getPendingReviews();
    setPendingSubmissions(updated);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-surface rounded-2xl p-6 sm:p-8 border border-border shadow-subtle space-y-2">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal/10 border border-teal/20 text-teal text-xs font-semibold">
          <Scale className="w-3.5 h-3.5" />
          <span>Human-in-the-Loop Governance</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-navy tracking-tight">
          Human Review & Approval Queue
        </h1>
        <p className="text-sm text-ink-secondary max-w-3xl leading-relaxed">
          Final publication sign-off by designated brand compliance officers. Automated audits propose corrections and check benchmarks; human reviewers authorize public release.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Queue List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-navy flex items-center gap-2">
              <FileText className="w-4 h-4 text-teal" />
              <span>Pending Submissions ({pendingSubmissions.length})</span>
            </h2>
            <span className="text-xs text-ink-muted">Sorted by submission date</span>
          </div>

          {pendingSubmissions.length === 0 ? (
            <div className="bg-surface rounded-2xl p-12 text-center text-ink-muted text-sm border border-border shadow-subtle space-y-2">
              <CheckCircle className="w-8 h-8 text-status-success mx-auto opacity-70" />
              <div className="font-bold text-navy text-base">Review queue is empty</div>
              <p className="text-xs text-ink-secondary">
                All submitted content pieces have received authorized review decisions.
              </p>
            </div>
          ) : (
            pendingSubmissions.map((sub) => (
              <div
                key={sub.id}
                className="bg-surface rounded-2xl p-5 border border-border hover:border-slate-300 transition shadow-subtle space-y-3"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-base font-bold text-navy tracking-tight">{sub.title}</h3>
                    <p className="text-xs text-ink-secondary mt-1 leading-relaxed">{sub.description}</p>
                    <div className="flex items-center gap-2 mt-2 text-[11px] text-ink-muted font-mono">
                      <span>ID: {sub.id.substring(0, 8)}...</span>
                      <span>•</span>
                      <span className="capitalize font-medium text-navy">{sub.content_type}</span>
                    </div>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wide border shrink-0 ${
                      sub.status === "pending_approval"
                        ? "bg-blue-50 text-status-info border-blue-200"
                        : "bg-amber-50 text-status-warning border-amber-200"
                    }`}
                  >
                    {sub.status.replace("_", " ")}
                  </span>
                </div>

                <div className="pt-3 border-t border-border flex items-center justify-between">
                  <a
                    href={`/audits?id=${sub.id}`}
                    className="text-xs text-teal hover:underline font-semibold flex items-center gap-1"
                  >
                    <span>Inspect AI Findings</span>
                    <ArrowRight className="w-3 h-3" />
                  </a>

                  <button
                    onClick={() => handleOpenReview(sub)}
                    className="bg-teal hover:bg-teal-hover text-white font-bold text-xs px-4 py-2 rounded-xl shadow-subtle transition"
                  >
                    Take Review Decision
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Sidebar Audit Trail */}
        <div className="bg-surface rounded-2xl p-5 border border-border shadow-subtle h-fit">
          <AuditTrailTimeline />
        </div>
      </div>

      {/* Review Action Modal */}
      {selectedSub && (
        <ReviewActionModal
          isOpen={modalOpen}
          submissionTitle={selectedSub.title}
          submissionId={selectedSub.id}
          onClose={() => setModalOpen(false)}
          onSubmitDecision={handleDecisionSubmit}
        />
      )}
    </div>
  );
}
