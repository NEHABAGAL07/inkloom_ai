"use client";

import React, { useEffect, useState, Suspense } from "react";
import { api } from "@/services/api";
import {
  DesignerFeedbackSummaryData,
  DesignerFeedbackGroupItem,
  ReviewCycleRecord,
  ContentSubmission,
  DepartmentReviewRecord,
  DepartmentFeedbackItem,
} from "@/types";
import { BackgroundAtmosphere } from "@/components/layout/BackgroundAtmosphere";
import { DesignAssetViewerModal } from "@/components/reviews/DesignAssetViewerModal";
import { useAuth } from "@/services/auth-context";
import { useRealtimeReviewEvents, broadcastLocalReviewEvent } from "@/services/realtime";
import {
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  Clock,
  Building2,
  Megaphone,
  Scale,
  Eye,
  History,
  UploadCloud,
  Check,
  X,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  FileCheck,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";

function FeedbackDashboardContent() {
  const { user, activeRole } = useAuth();
  const [summaryData, setSummaryData] = useState<DesignerFeedbackSummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Asset viewer modal state
  const [viewingSub, setViewingSub] = useState<ContentSubmission | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  // Revision upload modal state
  const [revisionGroup, setRevisionGroup] = useState<DesignerFeedbackGroupItem | null>(null);
  const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false);
  const [revisionFileName, setRevisionFileName] = useState("");
  const [revisionNotes, setRevisionNotes] = useState("");
  const [isUploadingRevision, setIsUploadingRevision] = useState(false);
  const [revisionError, setRevisionError] = useState<string | null>(null);

  // Version history modal state
  const [historyGroup, setHistoryGroup] = useState<DesignerFeedbackGroupItem | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  // Filter state (all, changes_requested, approved)
  const [statusFilter, setStatusFilter] = useState<"all" | "changes_requested" | "in_progress" | "approved">("all");

  const loadFeedbackSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getDesignerFeedbackSummary();
      setSummaryData(data);
    } catch (err: any) {
      console.error("Failed to load designer feedback summary:", err);
      setError(err?.message || "Failed to load designer feedback.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeedbackSummary();
  }, []);

  // Listen to real-time events to auto-refresh feedback dashboard
  useRealtimeReviewEvents((event) => {
    if (
      event.event_type === "department_review_submitted" ||
      event.event_type === "cycle_completed" ||
      event.event_type === "final_approval_granted" ||
      event.event_type === "revision_created" ||
      event.event_type === "review_cycle_started"
    ) {
      loadFeedbackSummary();
    }
  });

  // Handle opening asset viewer
  const handleOpenAsset = (group: DesignerFeedbackGroupItem) => {
    const mockSub: ContentSubmission = {
      id: group.submission_id,
      organization_id: "org_default_inkloom",
      creator_id: user?.id || "usr_designer",
      creator_name: user?.full_name || "Leo Vance (Designer)",
      title: group.title,
      description: group.description,
      content_type: group.content_type as any,
      status: group.workflow_status as any,
      file_name: group.file_name,
      current_revision_id: `rev_00${group.current_version}`,
      created_at: group.created_at,
      updated_at: new Date().toISOString(),
      media_url: group.thumbnail_url,
    };
    setViewingSub(mockSub);
    setIsViewerOpen(true);
  };

  // Open revision modal
  const handleOpenRevisionModal = (group: DesignerFeedbackGroupItem) => {
    setRevisionGroup(group);
    const nextVer = (group.current_version || 1) + 1;
    const baseName = group.file_name ? group.file_name.replace(/\.[^/.]+$/, "") : "Design_Asset";
    const ext = group.file_name && group.file_name.includes(".") ? group.file_name.split(".").pop() : "png";
    setRevisionFileName(`${baseName}_v${nextVer}.${ext}`);
    setRevisionNotes("");
    setRevisionError(null);
    setIsRevisionModalOpen(true);
  };

  // Submit revised version
  const handleSubmitRevision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revisionGroup) return;

    setIsUploadingRevision(true);
    setRevisionError(null);
    try {
      await api.createRevision(revisionGroup.submission_id, {
        file_name: revisionFileName,
        raw_text: revisionNotes || `Revised version uploaded by designer in response to departmental feedback.`,
      });

      broadcastLocalReviewEvent({
        event_type: "revision_created",
        submission_id: revisionGroup.submission_id,
        reviewer_name: user?.full_name || "Leo Vance (Designer)",
        timestamp: new Date().toISOString(),
      });

      setIsRevisionModalOpen(false);
      await loadFeedbackSummary();
    } catch (err: any) {
      console.error("Failed to upload revision:", err);
      setRevisionError(err?.message || "Failed to upload revision.");
    } finally {
      setIsUploadingRevision(false);
    }
  };

  // Filter groups
  const filteredGroups = summaryData?.design_groups.filter((group) => {
    if (statusFilter === "changes_requested") return group.has_changes_requested;
    if (statusFilter === "approved") return group.workflow_status === "approved";
    if (statusFilter === "in_progress") return group.workflow_status === "in_progress" || group.workflow_status === "review_complete";
    return true;
  }) || [];

  return (
    <div className="max-w-7xl mx-auto space-y-6 relative selection:bg-[#10A995]/20 dark:selection:bg-[#FF7A36]/30 selection:text-[#18352F] dark:selection:text-white">
      <BackgroundAtmosphere variant="hero" />

      {/* Header Banner */}
      <div className="bg-white dark:bg-[#1C1C1C] rounded-2xl p-6 sm:p-8 border border-[#DDEBE5] dark:border-[#383838] shadow-subtle dark:shadow-card space-y-2 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#087F70] via-[#10A995] to-[#43D6B3] dark:from-[#FFD84D] dark:via-[#FF7A36] dark:to-[#F45B91]" />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#E8F7F1] border border-[#C8E2D8] text-[#087F70] dark:bg-[#272727] dark:border-[#383838] dark:text-[#FFAA35] text-xs font-semibold">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Centralized Review &amp; Real-Time Feedback Inbox</span>
          </div>

          <div className="text-xs text-[#58716A] dark:text-[#85817D]">
            Designer: <strong className="text-[#18352F] dark:text-[#F7F3ED]">{user?.full_name || "Leo Vance"}</strong>
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-[#18352F] dark:text-[#F7F3ED] tracking-tight">
          Designer Feedback &amp; Review Cycles
        </h1>
        <p className="text-xs sm:text-sm text-[#58716A] dark:text-[#B8B2AC] max-w-3xl leading-relaxed">
          Track real-time departmental decisions across Brand Management, Marketing, and Legal &amp; Regulatory. Review actionable corrections, inspect asset evidence, and upload revised versions (v2, v3) to initiate new review cycles.
        </p>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Feedback Items */}
        <div className="bg-white dark:bg-[#1C1C1C] rounded-2xl p-5 border border-[#DDEBE5] dark:border-[#383838] shadow-subtle dark:shadow-card space-y-1">
          <div className="flex items-center justify-between text-xs text-[#58716A] dark:text-[#85817D]">
            <span>Total Feedback</span>
            <MessageSquare className="w-4 h-4 text-[#087F70] dark:text-[#FFAA35]" />
          </div>
          <div className="text-2xl sm:text-3xl font-heading font-extrabold text-[#18352F] dark:text-[#F7F3ED]">
            {loading ? "..." : summaryData?.total_feedback_items || 0}
          </div>
          <p className="text-[11px] text-[#82948E] dark:text-[#85817D]">Across all review tracks</p>
        </div>

        {/* Metric 2: Changes Requested */}
        <div className="bg-white dark:bg-[#1C1C1C] rounded-2xl p-5 border border-[#DDEBE5] dark:border-[#383838] shadow-subtle dark:shadow-card space-y-1">
          <div className="flex items-center justify-between text-xs text-amber-700 dark:text-amber-400">
            <span>Changes Requested</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-heading font-extrabold text-amber-600 dark:text-amber-400">
            {loading ? "..." : summaryData?.changes_requested_count || 0}
          </div>
          <p className="text-[11px] text-[#82948E] dark:text-[#85817D]">Action required from designer</p>
        </div>

        {/* Metric 3: Reviews Completed */}
        <div className="bg-white dark:bg-[#1C1C1C] rounded-2xl p-5 border border-[#DDEBE5] dark:border-[#383838] shadow-subtle dark:shadow-card space-y-1">
          <div className="flex items-center justify-between text-xs text-emerald-700 dark:text-emerald-400">
            <span>Reviews Completed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-heading font-extrabold text-emerald-600 dark:text-emerald-400">
            {loading ? "..." : summaryData?.reviews_completed_count || 0}
          </div>
          <p className="text-[11px] text-[#82948E] dark:text-[#85817D]">Department sign-offs logged</p>
        </div>

        {/* Metric 4: Awaiting Review */}
        <div className="bg-white dark:bg-[#1C1C1C] rounded-2xl p-5 border border-[#DDEBE5] dark:border-[#383838] shadow-subtle dark:shadow-card space-y-1">
          <div className="flex items-center justify-between text-xs text-sky-700 dark:text-sky-400">
            <span>Awaiting Review</span>
            <Clock className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-heading font-extrabold text-sky-600 dark:text-sky-400">
            {loading ? "..." : summaryData?.designs_awaiting_review_count || 0}
          </div>
          <p className="text-[11px] text-[#82948E] dark:text-[#85817D]">Department reviews pending</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 bg-[#F0F5F3] dark:bg-[#252525] p-1 rounded-xl text-xs">
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-1.5 rounded-lg font-bold transition ${
              statusFilter === "all"
                ? "bg-white dark:bg-[#383838] text-[#087F70] dark:text-[#FFAA35] shadow-xs"
                : "text-[#58716A] dark:text-[#888888] hover:text-[#18352F] dark:hover:text-[#F7F3ED]"
            }`}
          >
            All Submissions
          </button>
          <button
            onClick={() => setStatusFilter("changes_requested")}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
              statusFilter === "changes_requested"
                ? "bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-300 shadow-xs"
                : "text-[#58716A] dark:text-[#888888] hover:text-[#18352F] dark:hover:text-[#F7F3ED]"
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            <span>Changes Requested</span>
          </button>
          <button
            onClick={() => setStatusFilter("in_progress")}
            className={`px-3 py-1.5 rounded-lg font-bold transition ${
              statusFilter === "in_progress"
                ? "bg-white dark:bg-[#383838] text-[#087F70] dark:text-[#FFAA35] shadow-xs"
                : "text-[#58716A] dark:text-[#888888] hover:text-[#18352F] dark:hover:text-[#F7F3ED]"
            }`}
          >
            In Review
          </button>
          <button
            onClick={() => setStatusFilter("approved")}
            className={`px-3 py-1.5 rounded-lg font-bold transition ${
              statusFilter === "approved"
                ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-900 dark:text-emerald-300 shadow-xs"
                : "text-[#58716A] dark:text-[#888888] hover:text-[#18352F] dark:hover:text-[#F7F3ED]"
            }`}
          >
            Approved
          </button>
        </div>

        <button
          onClick={loadFeedbackSummary}
          className="text-xs text-[#087F70] dark:text-[#FFAA35] hover:underline font-semibold flex items-center gap-1"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Refresh Real-Time Status</span>
        </button>
      </div>

      {/* Main Groups List */}
      {loading ? (
        <div className="bg-white dark:bg-[#1C1C1C] rounded-2xl p-16 text-center border border-[#DDEBE5] dark:border-[#383838] shadow-subtle dark:shadow-card space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-[#10A995] dark:border-[#FFAA35] border-t-transparent animate-spin mx-auto" />
          <p className="font-semibold text-sm text-[#18352F] dark:text-[#F7F3ED]">
            Loading designer review cycles &amp; feedback...
          </p>
        </div>
      ) : error ? (
        <div className="bg-white dark:bg-[#1C1C1C] border border-[#FF6B78]/40 rounded-2xl p-8 text-center space-y-3">
          <p className="text-sm font-bold text-[#FF6B78]">Failed to load feedback</p>
          <p className="text-xs text-[#58716A] dark:text-[#B8B2AC]">{error}</p>
          <button
            onClick={loadFeedbackSummary}
            className="px-4 py-2 btn-gradient-warm text-white dark:text-[#111111] text-xs font-bold rounded-xl"
          >
            Retry
          </button>
        </div>
      ) : filteredGroups.length === 0 ? (
        <div className="bg-white dark:bg-[#1C1C1C] rounded-2xl p-12 text-center border border-[#DDEBE5] dark:border-[#383838] shadow-subtle dark:shadow-card space-y-2">
          <CheckCircle2 className="w-8 h-8 text-[#087F70] dark:text-[#72D6A1] mx-auto opacity-80" />
          <p className="font-heading font-bold text-[#18352F] dark:text-[#F7F3ED] text-base">
            No submissions matching filter
          </p>
          <p className="text-xs text-[#82948E] dark:text-[#85817D]">
            Switch filter tabs above to view other designs.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredGroups.map((group) => {
            const activeCycle = group.active_cycle;
            const mgrRev = activeCycle?.departmental_reviews.find((d) => d.department === "manager");
            const mktRev = activeCycle?.departmental_reviews.find((d) => d.department === "marketing");
            const legRev = activeCycle?.departmental_reviews.find((d) => d.department === "legal");

            return (
              <div
                key={group.submission_id}
                className="bg-white dark:bg-[#1C1C1C] rounded-2xl border border-[#DDEBE5] dark:border-[#383838] shadow-subtle dark:shadow-card overflow-hidden space-y-0"
              >
                {/* Submission & Version Header */}
                <div className="p-5 sm:p-6 border-b border-[#DDEBE5] dark:border-[#383838] bg-[#FAFDFB] dark:bg-[#202020] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-[#E8F7F1] dark:bg-[#2C2C2C] text-[#087F70] dark:text-[#FFAA35] font-bold border border-[#C8E2D8] dark:border-[#444444]">
                        Version {group.current_version}
                      </span>
                      {activeCycle && (
                        <span className="text-xs font-mono text-[#58716A] dark:text-[#85817D]">
                          Review Cycle #{activeCycle.cycle_number}
                        </span>
                      )}
                      <span className="text-xs text-[#82948E] dark:text-[#85817D]">
                        Submitted {new Date(group.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <h2 className="text-lg sm:text-xl font-bold font-heading text-[#18352F] dark:text-[#F7F3ED]">
                      {group.title}
                    </h2>
                    <p className="text-xs text-[#58716A] dark:text-[#85817D] mt-0.5">
                      File: {group.file_name || "Design_Asset.png"} • Type: {group.content_type.toUpperCase()}
                    </p>
                  </div>

                  {/* Status Badge & Actions */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wide border ${
                        group.workflow_status === "approved"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30"
                          : group.workflow_status === "review_complete"
                          ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/15 dark:text-blue-400 dark:border-blue-500/30"
                          : group.has_changes_requested
                          ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/30"
                          : "bg-[#E8F7F1] text-[#087F70] border-[#C8E2D8] dark:bg-[#333333] dark:text-[#FFAA35] dark:border-[#444444]"
                      }`}
                    >
                      {group.workflow_status.replace("_", " ")}
                    </span>

                    <button
                      onClick={() => handleOpenAsset(group)}
                      className="btn-dark-secondary text-xs px-3 py-1.5 font-bold rounded-xl flex items-center gap-1.5 transition"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#087F70] dark:text-[#FFAA35]" />
                      <span>Open Design</span>
                    </button>

                    <button
                      onClick={() => {
                        setHistoryGroup(group);
                        setIsHistoryModalOpen(true);
                      }}
                      className="btn-dark-secondary text-xs px-3 py-1.5 font-bold rounded-xl flex items-center gap-1.5 transition"
                    >
                      <History className="w-3.5 h-3.5 text-[#58716A] dark:text-[#85817D]" />
                      <span>Version History</span>
                    </button>

                    <button
                      onClick={() => handleOpenRevisionModal(group)}
                      className={`text-xs px-3.5 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 shadow-subtle ${
                        group.has_changes_requested
                          ? "btn-gradient-warm text-white dark:text-[#111111] shadow-warmGlow ring-2 ring-amber-400/50"
                          : "btn-dark-secondary"
                      }`}
                    >
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>Upload Revised Version</span>
                    </button>
                  </div>
                </div>

                {/* 3 Department Cards Grid */}
                <div className="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  
                  {/* Department Card 1: Brand Manager */}
                  <DepartmentCard
                    departmentName="Brand Manager"
                    icon={<Building2 className="w-4 h-4 text-[#087F70] dark:text-[#FFAA35]" />}
                    defaultReviewer="Alex Mercer (Brand Admin)"
                    reviewRecord={mgrRev}
                  />

                  {/* Department Card 2: Marketing Lead */}
                  <DepartmentCard
                    departmentName="Marketing Lead"
                    icon={<Megaphone className="w-4 h-4 text-purple-600 dark:text-purple-400" />}
                    defaultReviewer="Maya Lin (Marketing Lead)"
                    reviewRecord={mktRev}
                  />

                  {/* Department Card 3: Legal & Regulatory */}
                  <DepartmentCard
                    departmentName="Legal & Regulatory"
                    icon={<Scale className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                    defaultReviewer="Elena Rostova (Legal Counsel)"
                    reviewRecord={legRev}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Asset Viewer Modal */}
      {isViewerOpen && viewingSub && (
        <DesignAssetViewerModal
          isOpen={isViewerOpen}
          submission={viewingSub}
          onClose={() => setIsViewerOpen(false)}
        />
      )}

      {/* Upload Revised Version (v2/v3) Modal */}
      {isRevisionModalOpen && revisionGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#1C1C1C] border border-[#DDEBE5] dark:border-[#383838] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#DDEBE5] dark:border-[#383838]">
              <div className="flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-[#087F70] dark:text-[#FFAA35]" />
                <h3 className="text-base font-bold text-[#18352F] dark:text-[#F7F3ED]">
                  Upload Revised Version (v{(revisionGroup.current_version || 1) + 1})
                </h3>
              </div>
              <button
                onClick={() => setIsRevisionModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#58716A] dark:text-[#B8B2AC] leading-relaxed">
              Uploading a new revision for <strong>{revisionGroup.title}</strong> will preserve all past versions, execute the Media Audit Engine, and initialize a new Review Cycle across Manager, Marketing, and Legal.
            </p>

            {revisionError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 rounded-xl">
                {revisionError}
              </div>
            )}

            <form onSubmit={handleSubmitRevision} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#18352F] dark:text-[#F7F3ED] mb-1">
                  Revised File Name
                </label>
                <input
                  type="text"
                  required
                  value={revisionFileName}
                  onChange={(e) => setRevisionFileName(e.target.value)}
                  className="w-full bg-[#F8FAF9] dark:bg-[#252525] border border-[#DDEBE5] dark:border-[#383838] rounded-xl px-3 py-2 text-xs text-[#18352F] dark:text-[#F7F3ED] focus:outline-none focus:ring-1 focus:ring-[#10A995] dark:focus:ring-[#FFAA35]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#18352F] dark:text-[#F7F3ED] mb-1">
                  Revision Change Notes / Addressed Feedback
                </label>
                <textarea
                  rows={4}
                  required
                  value={revisionNotes}
                  onChange={(e) => setRevisionNotes(e.target.value)}
                  placeholder="Detail how you addressed feedback (e.g., adjusted font hierarchy, updated color contrast ratio to 5.2:1, added statutory disclaimer footnote)..."
                  className="w-full bg-[#F8FAF9] dark:bg-[#252525] border border-[#DDEBE5] dark:border-[#383838] rounded-xl p-3 text-xs text-[#18352F] dark:text-[#F7F3ED] focus:outline-none focus:ring-1 focus:ring-[#10A995] dark:focus:ring-[#FFAA35]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRevisionModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-[#58716A] dark:text-[#85817D] hover:bg-gray-100 dark:hover:bg-[#252525] rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploadingRevision}
                  className="btn-gradient-warm text-white dark:text-[#111111] text-xs font-bold px-5 py-2.5 rounded-xl shadow-warmGlow flex items-center gap-2"
                >
                  {isUploadingRevision ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      <span>Auditing &amp; Starting Cycle...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>Submit Revision &amp; Start Review Cycle</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Version History Modal */}
      {isHistoryModalOpen && historyGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#1C1C1C] border border-[#DDEBE5] dark:border-[#383838] rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#DDEBE5] dark:border-[#383838]">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-[#087F70] dark:text-[#FFAA35]" />
                <h3 className="text-base font-bold text-[#18352F] dark:text-[#F7F3ED]">
                  Version History &amp; Review Cycles
                </h3>
              </div>
              <button
                onClick={() => setIsHistoryModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#58716A] dark:text-[#85817D]">
              Complete chronological audit trail for <strong>{historyGroup.title}</strong> across revisions.
            </p>

            <div className="space-y-4 pt-2">
              {historyGroup.cycles.length > 0 ? (
                historyGroup.cycles.map((c) => (
                  <div
                    key={c.id}
                    className="p-4 rounded-xl border border-[#DDEBE5] dark:border-[#383838] bg-[#F8FAF9] dark:bg-[#252525] space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold font-mono text-[#087F70] dark:text-[#FFAA35]">
                        Cycle #{c.cycle_number}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          c.status === "approved"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
                            : c.status === "changes_requested"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                            : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                        }`}
                      >
                        {c.status.replace("_", " ")}
                      </span>
                    </div>

                    <div className="text-xs text-[#58716A] dark:text-[#85817D]">
                      Started: {new Date(c.started_at).toLocaleString()}
                      {c.completed_at && ` • Completed: ${new Date(c.completed_at).toLocaleString()}`}
                    </div>

                    <div className="space-y-1.5 pt-1 border-t border-[#DDEBE5] dark:border-[#383838]">
                      {c.departmental_reviews.map((dr) => (
                        <div key={dr.id} className="text-xs flex items-center justify-between">
                          <span className="capitalize text-[#18352F] dark:text-[#F7F3ED] font-medium">
                            {dr.department}: {dr.reviewer_name || "Pending"}
                          </span>
                          <span
                            className={`font-semibold text-[11px] ${
                              dr.review_status === "completed"
                                ? dr.outcome === "changes_requested"
                                  ? "text-amber-600 dark:text-amber-400"
                                  : "text-emerald-600 dark:text-emerald-400"
                                : "text-gray-400"
                            }`}
                          >
                            {dr.review_status === "completed" ? (dr.outcome === "changes_requested" ? "Changes Requested" : "Approved") : "Pending"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-xs text-[#82948E] dark:text-[#85817D]">
                  No past review cycles recorded for this submission.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Subcomponent: Individual Department Feedback Card
interface DepartmentCardProps {
  departmentName: string;
  icon: React.ReactNode;
  defaultReviewer: string;
  reviewRecord?: DepartmentReviewRecord;
}

function DepartmentCard({
  departmentName,
  icon,
  defaultReviewer,
  reviewRecord,
}: DepartmentCardProps) {
  const isCompleted = reviewRecord?.review_status === "completed";
  const outcome = reviewRecord?.outcome;
  const isChangesRequested = outcome === "changes_requested";
  const feedbackItem = reviewRecord?.feedback_items?.[0];

  return (
    <div
      className={`rounded-xl p-4 border transition flex flex-col justify-between space-y-3 ${
        !isCompleted
          ? "bg-[#FAFAFA] dark:bg-[#222222] border-[#E5E5E5] dark:border-[#333333] opacity-80"
          : isChangesRequested
          ? "bg-amber-50/60 dark:bg-amber-950/20 border-amber-300 dark:border-amber-700/60"
          : "bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-700/60"
      }`}
    >
      <div className="space-y-2">
        {/* Card Header: Icon, Department Name, Status Badge */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-white dark:bg-[#2C2C2C] shadow-xs">
              {icon}
            </div>
            <div>
              <h3 className="text-xs font-bold text-[#18352F] dark:text-[#F7F3ED]">
                {departmentName}
              </h3>
              <p className="text-[10px] text-[#58716A] dark:text-[#85817D]">
                {reviewRecord?.reviewer_name || defaultReviewer}
              </p>
            </div>
          </div>

          <span
            className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase shrink-0 ${
              !isCompleted
                ? "bg-gray-100 text-gray-600 dark:bg-[#333333] dark:text-[#888888]"
                : isChangesRequested
                ? "bg-amber-200 text-amber-900 dark:bg-amber-900/50 dark:text-amber-200"
                : "bg-emerald-200 text-emerald-900 dark:bg-emerald-900/50 dark:text-emerald-200"
            }`}
          >
            {!isCompleted ? "Pending Review" : isChangesRequested ? "Changes Requested" : "Approved"}
          </span>
        </div>

        {/* Feedback Body */}
        {isCompleted ? (
          <div className="space-y-2 pt-1 text-xs">
            {feedbackItem?.feedback_category && (
              <div className="inline-block px-2 py-0.5 rounded bg-white/80 dark:bg-[#2C2C2C] text-[10px] font-mono font-bold text-[#58716A] dark:text-[#FFAA35] border border-black/5 dark:border-white/5">
                Category: {feedbackItem.feedback_category}
              </div>
            )}

            {reviewRecord.comments && (
              <p className="text-xs text-[#18352F] dark:text-[#F7F3ED] leading-relaxed italic">
                &ldquo;{reviewRecord.comments}&rdquo;
              </p>
            )}

            {feedbackItem?.requested_correction && (
              <div className="p-2.5 rounded-lg bg-amber-100/70 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-[11px] text-amber-900 dark:text-amber-200 space-y-0.5">
                <span className="font-bold block">Actionable Correction:</span>
                <span>{feedbackItem.requested_correction}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="py-4 text-center text-xs text-[#82948E] dark:text-[#85817D] space-y-1">
            <Clock className="w-5 h-5 mx-auto opacity-40" />
            <p className="text-[11px]">Awaiting departmental review</p>
          </div>
        )}
      </div>

      {/* Timestamp Footer */}
      <div className="pt-2 border-t border-black/5 dark:border-white/5 text-[10px] text-[#82948E] dark:text-[#85817D] flex items-center justify-between">
        <span>Submitted:</span>
        <span className="font-mono">
          {reviewRecord?.submitted_at
            ? new Date(reviewRecord.submitted_at).toLocaleDateString()
            : "Pending"}
        </span>
      </div>
    </div>
  );
}

export default function DesignerFeedbackPage() {
  return (
    <Suspense fallback={<div className="p-8 text-xs text-[#58716A] dark:text-[#85817D]">Loading Designer Feedback...</div>}>
      <FeedbackDashboardContent />
    </Suspense>
  );
}

