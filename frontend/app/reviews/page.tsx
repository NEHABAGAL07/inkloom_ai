"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/services/api";
import { ContentSubmission } from "@/types";
import { ReviewActionModal } from "@/components/reviews/ReviewActionModal";
import { AuditTrailTimeline } from "@/components/reviews/AuditTrailTimeline";

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
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">Human Review & Approval Queue</h1>
        <p className="text-sm text-slate-400 mt-1">
          Final publication sign-off by designated brand compliance officers. AI audit assists; human reviewer decides.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Queue List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white">Pending Submissions ({pendingSubmissions.length})</h2>
            <span className="text-xs text-slate-400">Sorted by submission date</span>
          </div>

          {pendingSubmissions.length === 0 ? (
            <div className="glass-panel rounded-2xl p-8 text-center text-slate-400 text-sm border border-slate-800">
              🎉 All submissions reviewed! The queue is currently empty.
            </div>
          ) : (
            pendingSubmissions.map((sub) => (
              <div
                key={sub.id}
                className="glass-panel rounded-2xl p-5 border border-slate-800 hover:border-slate-700 transition space-y-3"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-base font-bold text-white tracking-tight">{sub.title}</h3>
                    <p className="text-xs text-slate-300 mt-1">{sub.description}</p>
                    <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-400 font-mono">
                      <span>ID: {sub.id}</span>
                      <span>•</span>
                      <span className="capitalize">{sub.content_type}</span>
                    </div>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wide border shrink-0 ${
                      sub.status === "pending_approval"
                        ? "bg-indigo-950/80 text-indigo-300 border-indigo-800/80"
                        : "bg-amber-950/80 text-amber-300 border-amber-800/80"
                    }`}
                  >
                    {sub.status.replace("_", " ")}
                  </span>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <a
                    href={`/audits?id=${sub.id}`}
                    className="text-xs text-indigo-400 hover:underline font-semibold"
                  >
                    Inspect AI Findings →
                  </a>

                  <button
                    onClick={() => handleOpenReview(sub)}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-md transition"
                  >
                    Take Review Decision
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Sidebar Audit Trail */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800 h-fit">
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
