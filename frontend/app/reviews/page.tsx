"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/services/api";
import { ContentSubmission, Campaign } from "@/types";
import { ReviewActionModal } from "@/components/reviews/ReviewActionModal";
import { AuditTrailTimeline } from "@/components/reviews/AuditTrailTimeline";
import { DesignerFeedbackComments } from "@/components/reviews/DesignerFeedbackComments";
import { DesignAssetViewerModal } from "@/components/reviews/DesignAssetViewerModal";
import { BackgroundAtmosphere } from "@/components/layout/BackgroundAtmosphere";
import { useAuth } from "@/services/auth-context";
import { Scale, FileText, CheckCircle, ArrowRight, Eye, Briefcase, ExternalLink, RefreshCw } from "lucide-react";
import Link from "next/link";

export default function ReviewsPage() {
  const { user } = useAuth();
  const [pendingSubmissions, setPendingSubmissions] = useState<ContentSubmission[]>([]);
  const [pendingCampaigns, setPendingCampaigns] = useState<Campaign[]>([]);
  const [selectedSub, setSelectedSub] = useState<ContentSubmission | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [viewingSub, setViewingSub] = useState<ContentSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadReviews = async () => {
    setLoading(true);
    setError(null);
    try {
      const [subs, camps] = await Promise.all([
        api.getPendingReviews(),
        api.getCampaigns("human_review_pending"),
      ]);
      setPendingSubmissions(subs || []);
      setPendingCampaigns(camps || []);
    } catch (e: any) {
      console.error("Failed to load review queue:", e);
      setError(e?.message || "Failed to load pending reviews.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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
    const updated = await api.getPendingReviews();
    setPendingSubmissions(updated);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 relative selection:bg-[#10A995]/20 dark:selection:bg-[#FF7A36]/30 selection:text-[#18352F] dark:selection:text-white">
      <BackgroundAtmosphere variant="hero" />

      {/* Header */}
      <div className="bg-white dark:bg-[#1C1C1C] rounded-2xl p-6 sm:p-8 border border-[#DDEBE5] dark:border-[#383838] shadow-subtle dark:shadow-card space-y-2 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#087F70] via-[#10A995] to-[#43D6B3] dark:from-[#FFD84D] dark:via-[#FF7A36] dark:to-[#F45B91]" />
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#E8F7F1] border border-[#C8E2D8] text-[#087F70] dark:bg-[#272727] dark:border-[#383838] dark:text-[#FFAA35] text-xs font-semibold">
          <Scale className="w-3.5 h-3.5" />
          <span>Human-in-the-Loop Governance</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-[#18352F] dark:text-[#F7F3ED] tracking-tight">
          Human Review &amp; Approval Queue
        </h1>
        <p className="text-xs sm:text-sm text-[#58716A] dark:text-[#B8B2AC] max-w-3xl leading-relaxed">
          Final publication sign-off by designated brand compliance officers. Automated audits propose corrections and check benchmarks; human reviewers authorize public release.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
        {/* Main Queue List */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section 1: Campaign Workflows Awaiting Sign-off */}
          {pendingCampaigns.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-navy flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-teal" />
                  <span>Campaigns Awaiting Sign-Off ({pendingCampaigns.length})</span>
                </h2>
                <span className="text-xs text-teal font-semibold">Multi-track audits completed</span>
              </div>

              <div className="space-y-3">
                {pendingCampaigns.map((camp) => (
                  <div
                    key={camp.id}
                    className="bg-surface rounded-2xl p-5 border border-teal/40 dark:border-teal-800/60 shadow-subtle space-y-3"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold text-teal uppercase tracking-wider">
                            Campaign Workflow
                          </span>
                          <span className="text-[10px] text-ink-muted">
                            v{camp.version} • {camp.priority.toUpperCase()}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-navy tracking-tight">{camp.name}</h3>
                        <p className="text-xs text-ink-secondary mt-1">{camp.description}</p>
                        <div className="flex items-center gap-3 mt-2 text-[11px] text-ink-muted">
                          <span>Channel: <strong className="text-navy capitalize">{camp.target_channel || "General"}</strong></span>
                          <span>•</span>
                          <span>Jurisdiction: <strong className="text-navy">{camp.target_jurisdiction || "Global"}</strong></span>
                          <span>•</span>
                          <span>Assets: <strong className="text-navy">{camp.submissions?.length || 0}</strong></span>
                        </div>
                      </div>

                      <span className="px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wide border shrink-0 bg-purple-50 text-purple-700 border-purple-200">
                        Human Review Pending
                      </span>
                    </div>

                    <div className="pt-3 border-t border-border flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-ink-muted">
                        <span>Review Tracks:</span>
                        {camp.review_tracks?.marketing?.score && (
                          <span className="px-1.5 py-0.5 rounded bg-teal/10 text-teal text-[10px] font-bold">
                            Mkt: {camp.review_tracks.marketing.score}
                          </span>
                        )}
                        {camp.review_tracks?.visual?.score && (
                          <span className="px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 text-[10px] font-bold">
                            Vis: {camp.review_tracks.visual.score}
                          </span>
                        )}
                        {camp.review_tracks?.legal?.score && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 text-[10px] font-bold">
                            Legal: {camp.review_tracks.legal.score}
                          </span>
                        )}
                      </div>

                      <Link
                        href={`/campaigns?id=${camp.id}`}
                        className="bg-teal hover:bg-teal-hover text-white font-bold text-xs px-4 py-2 rounded-xl shadow-subtle transition flex items-center gap-1.5"
                      >
                        <span>Open &amp; Sign Off</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 2: Individual Draft Submissions */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-[#18352F] dark:text-[#F7F3ED] flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#087F70] dark:text-[#FFAA35]" />
                <span>Pending Submissions ({pendingSubmissions.length})</span>
              </h2>
              <span className="text-xs text-[#82948E] dark:text-[#85817D]">Sorted by submission date</span>
            </div>

          {loading ? (
            <div className="bg-white dark:bg-[#1C1C1C] rounded-2xl p-12 text-center text-[#58716A] dark:text-[#85817D] text-sm border border-[#DDEBE5] dark:border-[#383838] shadow-subtle dark:shadow-card space-y-3">
              <div className="w-8 h-8 rounded-full border-2 border-[#10A995] dark:border-[#FFAA35] border-t-transparent animate-spin mx-auto"></div>
              <p className="font-semibold text-[#18352F] dark:text-[#F7F3ED]">Loading pending reviews...</p>
            </div>
          ) : error ? (
            <div className="bg-white dark:bg-[#1C1C1C] border border-[#FF6B78]/40 rounded-2xl p-8 text-center space-y-3 shadow-subtle dark:shadow-card">
              <p className="text-sm font-bold text-[#FF6B78]">Review Queue Error</p>
              <p className="text-xs text-[#58716A] dark:text-[#B8B2AC]">{error}</p>
              <button
                onClick={loadReviews}
                className="px-4 py-2 btn-gradient-warm text-white dark:text-[#111111] text-xs font-bold rounded-xl transition"
              >
                Retry
              </button>
            </div>
          ) : pendingSubmissions.length === 0 ? (
            <div className="bg-white dark:bg-[#1C1C1C] rounded-2xl p-12 text-center text-[#58716A] dark:text-[#85817D] text-sm border border-[#DDEBE5] dark:border-[#383838] shadow-subtle dark:shadow-card space-y-2">
              <CheckCircle className="w-8 h-8 text-[#087F70] dark:text-[#72D6A1] mx-auto opacity-80" />
              <div className="font-heading font-bold text-[#18352F] dark:text-[#F7F3ED] text-base">Review queue is empty</div>
              <p className="text-xs text-[#82948E] dark:text-[#85817D]">
                All submitted content pieces have received authorized review decisions.
              </p>
            </div>
          ) : (
            pendingSubmissions.map((sub) => (
              <div
                key={sub.id}
                className="bg-white dark:bg-[#1C1C1C] rounded-2xl p-5 border border-[#DDEBE5] dark:border-[#383838] hover:border-[#10A995] dark:hover:border-[#4A4A4A] transition shadow-subtle dark:shadow-card space-y-3"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-base font-heading font-bold text-[#18352F] dark:text-[#F7F3ED] tracking-tight">{sub.title}</h3>
                    <p className="text-xs text-[#58716A] dark:text-[#85817D] mt-1 leading-relaxed">{sub.description}</p>
                    <div className="flex items-center gap-2 mt-2 text-[11px] text-[#82948E] dark:text-[#85817D] font-mono">
                      <span>ID: {sub.id.substring(0, 8)}...</span>
                      <span>•</span>
                      <span className="capitalize font-medium text-[#087F70] dark:text-[#FFAA35]">{sub.content_type}</span>
                    </div>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wide border shrink-0 ${
                      sub.status === "pending_approval"
                        ? "bg-[#E8F7F1] text-[#087F70] border-[#C8E2D8] dark:bg-[#83B9FF]/15 dark:text-[#83B9FF] dark:border-[#83B9FF]/30"
                        : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-[#FFAA35]/15 dark:text-[#FFAA35] dark:border-[#FFAA35]/30"
                    }`}
                  >
                    {sub.status.replace("_", " ")}
                  </span>
                </div>

                <div className="pt-3 border-t border-[#DDEBE5] dark:border-[#383838] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        setViewingSub(sub);
                        setIsViewerOpen(true);
                      }}
                      className="text-xs px-3 py-1.5 btn-dark-secondary font-bold rounded-xl transition flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#087F70] dark:text-[#FFAA35]" />
                      <span>Open &amp; View Asset</span>
                    </button>

                    <a
                      href={`/audits?id=${sub.id}`}
                      className="text-xs text-[#58716A] dark:text-[#85817D] hover:text-[#087F70] dark:hover:text-[#FFAA35] font-semibold flex items-center gap-1 transition"
                    >
                      <span>Inspect AI Findings</span>
                      <ArrowRight className="w-3 h-3" />
                    </a>
                  </div>

                  <button
                    onClick={() => handleOpenReview(sub)}
                    className="btn-gradient-warm text-white dark:text-[#111111] text-xs font-bold px-4 py-2 rounded-xl shadow-warmGlow transition"
                  >
                    Take Review Decision
                  </button>
                </div>
              </div>
            ))
          )}
          </div>
        </div>

        {/* Sidebar Audit Trail */}
        <div className="bg-white dark:bg-[#1C1C1C] rounded-2xl p-5 border border-[#DDEBE5] dark:border-[#383838] shadow-subtle dark:shadow-card h-fit">
          <AuditTrailTimeline />
        </div>
      </div>

      {/* Review Decision Modal */}
      {modalOpen && selectedSub && (
        <ReviewActionModal
          isOpen={modalOpen}
          submissionTitle={selectedSub.title}
          submissionId={selectedSub.id}
          onClose={() => setModalOpen(false)}
          onSubmitDecision={handleDecisionSubmit}
        />
      )}

      {/* Asset Viewer Modal */}
      {isViewerOpen && viewingSub && (
        <DesignAssetViewerModal
          isOpen={isViewerOpen}
          submission={viewingSub}
          onClose={() => setIsViewerOpen(false)}
        />
      )}
    </div>
  );
}
