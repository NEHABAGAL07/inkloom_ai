"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/services/api";
import {
  ContentSubmission,
  Campaign,
  AuditResult,
  ReviewCycleRecord,
  DepartmentReviewRecord,
} from "@/types";
import { FindingCard } from "@/components/audits/FindingCard";
import { DesignAssetViewerModal } from "@/components/reviews/DesignAssetViewerModal";
import { AuditTrailTimeline } from "@/components/reviews/AuditTrailTimeline";
import { BackgroundAtmosphere } from "@/components/layout/BackgroundAtmosphere";
import { useAuth } from "@/services/auth-context";
import { useRealtimeReviewEvents, broadcastLocalReviewEvent } from "@/services/realtime";
import {
  Scale,
  FileText,
  CheckCircle,
  Clock,
  AlertTriangle,
  ArrowRight,
  Eye,
  ShieldCheck,
  Check,
  Send,
  Lock,
  Layers,
  Sparkles,
  UserCheck,
  Building2,
  Megaphone,
} from "lucide-react";

type DepartmentKey = "manager" | "marketing" | "legal";

const DEPARTMENT_CATEGORIES: Record<DepartmentKey, string[]> = {
  manager: [
    "Brand Compliance",
    "Art Direction",
    "Visual Balance",
    "Safe Area Margin",
    "Typography Standards",
    "Palette Adherence",
  ],
  marketing: [
    "Copywriting & Tone",
    "Marketing Claims",
    "Audience Engagement",
    "Visual Hierarchy",
    "CTA Placement",
    "Campaign Alignment",
  ],
  legal: [
    "Legal Disclaimer",
    "Statutory Citations",
    "Regulatory Compliance",
    "Trademark Notice",
    "Substantiation Evidence",
    "Industry Mandatory Disclosures",
  ],
};

function ReviewsContent() {
  const { user, activeRole } = useAuth();
  const searchParams = useSearchParams();
  const queryId = searchParams?.get("id");

  const [submissions, setPendingSubmissions] = useState<ContentSubmission[]>([]);
  const [reviewCycles, setReviewCycles] = useState<ReviewCycleRecord[]>([]);
  const [selectedSub, setSelectedSub] = useState<ContentSubmission | null>(null);
  const [selectedCycle, setSelectedCycle] = useState<ReviewCycleRecord | null>(null);

  // Department review form state
  const [activeDepartment, setActiveDepartment] = useState<DepartmentKey>("manager");
  const [outcome, setOutcome] = useState<"no_changes_required" | "changes_requested">("no_changes_required");
  const [selectedCategory, setSelectedCategory] = useState<string>("Brand Compliance");
  const [comments, setComments] = useState<string>("");
  const [requestedCorrection, setRequestedCorrection] = useState<string>("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  // Final approval state
  const [isApprovingFinal, setIsApprovingFinal] = useState(false);
  const [finalApprovalSuccess, setFinalApprovalSuccess] = useState(false);

  // Asset viewer modal
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [viewingSub, setViewingSub] = useState<ContentSubmission | null>(null);

  // Audit findings for selected submission
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Determine user department based on role
  useEffect(() => {
    if (activeRole === "marketing") {
      setActiveDepartment("marketing");
      setSelectedCategory(DEPARTMENT_CATEGORIES.marketing[0]);
    } else if (activeRole === "legal") {
      setActiveDepartment("legal");
      setSelectedCategory(DEPARTMENT_CATEGORIES.legal[0]);
    } else {
      setActiveDepartment("manager");
      setSelectedCategory(DEPARTMENT_CATEGORIES.manager[0]);
    }
  }, [activeRole]);

  // Load reviews and cycles
  const loadReviewsAndCycles = async () => {
    setLoading(true);
    setError(null);
    try {
      const [subs, cycles] = await Promise.all([
        api.getSubmissions(),
        api.getReviewCycles(),
      ]);

      const validSubs = subs || [];
      const validCycles = cycles || [];
      setPendingSubmissions(validSubs);
      setReviewCycles(validCycles);

      // Select queryId match or first submission
      let targetSub = validSubs[0] || null;
      if (queryId) {
        const match = validSubs.find((s) => s.id === queryId);
        if (match) targetSub = match;
      }
      setSelectedSub(targetSub);

      if (targetSub) {
        const subCycles = validCycles.filter((c) => c.submission_id === targetSub.id);
        const activeC = subCycles.sort((a, b) => b.cycle_number - a.cycle_number)[0] || null;
        setSelectedCycle(activeC);
      }
    } catch (e: any) {
      console.error("Failed to load review queue:", e);
      setError(e?.message || "Failed to load review cycles.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviewsAndCycles();
  }, [queryId]);

  // Subscribe to real-time events to auto-update review status without manual refresh
  useRealtimeReviewEvents((event) => {
    if (
      event.event_type === "department_review_submitted" ||
      event.event_type === "cycle_completed" ||
      event.event_type === "final_approval_granted" ||
      event.event_type === "review_cycle_started"
    ) {
      loadReviewsAndCycles();
    }
  });

  // When selected submission changes, load its active cycle and audit findings
  useEffect(() => {
    if (!selectedSub) {
      setSelectedCycle(null);
      setAuditResult(null);
      return;
    }

    const subCycles = reviewCycles.filter((c) => c.submission_id === selectedSub.id);
    const activeC = subCycles.sort((a, b) => b.cycle_number - a.cycle_number)[0] || null;
    setSelectedCycle(activeC);

    let isCurrent = true;
    setLoadingAudit(true);
    api
      .getAudit(selectedSub.id)
      .then((res) => {
        if (isCurrent && res) setAuditResult(res);
      })
      .catch(() => {
        api
          .triggerAudit(selectedSub.id, selectedSub.current_revision_id)
          .then((res) => {
            if (isCurrent && res) setAuditResult(res);
          })
          .catch(() => {
            if (isCurrent) setAuditResult(null);
          });
      })
      .finally(() => {
        if (isCurrent) setLoadingAudit(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [selectedSub?.id, reviewCycles]);

  // Handle department review submission
  const handleSubmitDepartmentReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCycle) return;

    setIsSubmittingReview(true);
    setSubmitSuccess(null);
    try {
      const feedbackItems =
        outcome === "changes_requested"
          ? [
              {
                category: selectedCategory,
                description: comments || "Revision required for brand compliance.",
                requested_correction: requestedCorrection,
              },
            ]
          : comments
          ? [
              {
                category: selectedCategory,
                description: comments,
              },
            ]
          : [];

      await api.submitDepartmentReview(selectedCycle.id, {
        department: activeDepartment,
        outcome,
        comments,
        feedback_items: feedbackItems,
      });

      broadcastLocalReviewEvent({
        event_type: "department_review_submitted",
        cycle_id: selectedCycle.id,
        submission_id: selectedCycle.submission_id,
        department: activeDepartment,
        outcome,
        reviewer_name: user?.full_name || "Department Reviewer",
        timestamp: new Date().toISOString(),
      });

      setSubmitSuccess(`Your ${activeDepartment.toUpperCase()} review was submitted successfully!`);
      setComments("");
      setRequestedCorrection("");
      await loadReviewsAndCycles();
    } catch (err: any) {
      console.error("Failed to submit department review:", err);
      alert(err?.message || "Failed to submit review.");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Handle Manager final approval
  const handleGrantFinalApproval = async () => {
    if (!selectedCycle) return;
    setIsApprovingFinal(true);
    try {
      await api.grantFinalApproval(
        selectedCycle.id,
        "All departmental reviews completed and approved for public release."
      );

      broadcastLocalReviewEvent({
        event_type: "final_approval_granted",
        cycle_id: selectedCycle.id,
        submission_id: selectedCycle.submission_id,
        reviewer_name: user?.full_name || "Brand Admin",
        timestamp: new Date().toISOString(),
      });

      setFinalApprovalSuccess(true);
      await loadReviewsAndCycles();
    } catch (err: any) {
      console.error("Failed to grant final approval:", err);
      alert(err?.message || "Failed to grant final approval.");
    } finally {
      setIsApprovingFinal(false);
    }
  };

  // Helper to render department review badges
  const getDepartmentReview = (cycle: ReviewCycleRecord | null, dept: DepartmentKey): DepartmentReviewRecord | undefined => {
    return cycle?.departmental_reviews.find((d) => d.department === dept);
  };

  const isUserAdminOrManager = activeRole === "admin" || activeRole === "brand_manager";

  return (
    <div className="max-w-7xl mx-auto space-y-6 relative selection:bg-[#10A995]/20 dark:selection:bg-[#FF7A36]/30 selection:text-[#18352F] dark:selection:text-white">
      <BackgroundAtmosphere variant="hero" />

      {/* Page Header */}
      <div className="bg-white dark:bg-[#1C1C1C] rounded-2xl p-6 sm:p-8 border border-[#DDEBE5] dark:border-[#383838] shadow-subtle dark:shadow-card space-y-2 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#087F70] via-[#10A995] to-[#43D6B3] dark:from-[#FFD84D] dark:via-[#FF7A36] dark:to-[#F45B91]" />
        
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#E8F7F1] border border-[#C8E2D8] text-[#087F70] dark:bg-[#272727] dark:border-[#383838] dark:text-[#FFAA35] text-xs font-semibold">
            <Scale className="w-3.5 h-3.5" />
            <span>Centralized Claim Review &amp; Departmental Governance</span>
          </div>

          {/* Active Reviewer Context Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-[#F0FDF4] dark:bg-[#222222] border border-[#C8E2D8] dark:border-[#444444] text-xs">
            <span className="text-[#58716A] dark:text-[#85817D]">Reviewing as:</span>
            <strong className="text-[#087F70] dark:text-[#FFAA35] capitalize">
              {user?.full_name || "Elena Rostova"} ({activeDepartment} Track)
            </strong>
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-[#18352F] dark:text-[#F7F3ED] tracking-tight">
          Claim Review &amp; Multi-Departmental Governance
        </h1>
        <p className="text-xs sm:text-sm text-[#58716A] dark:text-[#B8B2AC] max-w-3xl leading-relaxed">
          Centralized review system for Brand Managers, Marketing Leads, and Legal Counsel. All 3 departments review independently. Review completes when all three submit; if changes are requested, the designer is notified to submit a new revision.
        </p>
      </div>

      {/* Main Grid: Queue on Left, Active Review Details on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
        
        {/* Left Column (5 cols): Design Submissions Queue */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#18352F] dark:text-[#F7F3ED] flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#087F70] dark:text-[#FFAA35]" />
              <span>Designs Awaiting Review ({submissions.length})</span>
            </h2>
            <span className="text-xs text-[#82948E] dark:text-[#85817D]">Multi-Track Cycles</span>
          </div>

          {loading ? (
            <div className="bg-white dark:bg-[#1C1C1C] rounded-2xl p-12 text-center text-[#58716A] dark:text-[#85817D] text-sm border border-[#DDEBE5] dark:border-[#383838] shadow-subtle dark:shadow-card space-y-3">
              <div className="w-8 h-8 rounded-full border-2 border-[#10A995] dark:border-[#FFAA35] border-t-transparent animate-spin mx-auto" />
              <p className="font-semibold text-[#18352F] dark:text-[#F7F3ED]">Loading submissions...</p>
            </div>
          ) : submissions.length === 0 ? (
            <div className="bg-white dark:bg-[#1C1C1C] rounded-2xl p-10 text-center border border-[#DDEBE5] dark:border-[#383838] shadow-subtle dark:shadow-card space-y-2">
              <CheckCircle className="w-8 h-8 text-[#087F70] dark:text-[#72D6A1] mx-auto opacity-80" />
              <p className="font-heading font-bold text-[#18352F] dark:text-[#F7F3ED] text-sm">No submissions in queue</p>
              <p className="text-xs text-[#82948E] dark:text-[#85817D]">All uploaded assets have completed review cycles.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {submissions.map((sub) => {
                const isSelected = selectedSub?.id === sub.id;
                const subCycles = reviewCycles.filter((c) => c.submission_id === sub.id);
                const activeC = subCycles.sort((a, b) => b.cycle_number - a.cycle_number)[0] || null;

                const mgrRev = getDepartmentReview(activeC, "manager");
                const mktRev = getDepartmentReview(activeC, "marketing");
                const legRev = getDepartmentReview(activeC, "legal");

                return (
                  <div
                    key={sub.id}
                    onClick={() => setSelectedSub(sub)}
                    className={`bg-white dark:bg-[#1C1C1C] rounded-2xl p-4 sm:p-5 border transition shadow-subtle dark:shadow-card space-y-3 cursor-pointer ${
                      isSelected
                        ? "border-[#10A995] dark:border-[#FFAA35] ring-1 ring-[#10A995]/40 dark:ring-[#FFAA35]/40"
                        : "border-[#DDEBE5] dark:border-[#383838] hover:border-[#10A995]/60 dark:hover:border-[#555555]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#E8F7F1] dark:bg-[#2A2A2A] text-[#087F70] dark:text-[#FFAA35] font-bold">
                            v{sub.current_revision_id === "rev_002" ? 2 : 1}
                          </span>
                          <span className="text-[11px] text-[#58716A] dark:text-[#85817D] truncate">
                            {sub.creator_name || "Leo Vance (Designer)"}
                          </span>
                        </div>
                        <h3 className="text-sm sm:text-base font-bold text-[#18352F] dark:text-[#F7F3ED] truncate">
                          {sub.title}
                        </h3>
                        <p className="text-xs text-[#82948E] dark:text-[#85817D] font-mono mt-0.5 truncate">
                          {sub.file_name || "Design_Asset.png"} • {new Date(sub.created_at).toLocaleDateString()}
                        </p>
                      </div>

                      {/* Overall Cycle Status */}
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide border shrink-0 ${
                          activeC?.status === "approved"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30"
                            : activeC?.status === "review_complete"
                            ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/15 dark:text-blue-400 dark:border-blue-500/30"
                            : activeC?.status === "changes_requested"
                            ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/30"
                            : "bg-[#E8F7F1] text-[#087F70] border-[#C8E2D8] dark:bg-[#333333] dark:text-[#FFAA35] dark:border-[#444444]"
                        }`}
                      >
                        {activeC?.status ? activeC.status.replace("_", " ") : "In Progress"}
                      </span>
                    </div>

                    {/* 3-Department Status Indicators */}
                    <div className="pt-2.5 border-t border-[#DDEBE5] dark:border-[#383838] flex items-center justify-between text-xs">
                      <span className="text-[11px] text-[#82948E] dark:text-[#85817D] font-semibold">
                        Tracks:
                      </span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* Manager Badge */}
                        <span
                          title={`Brand Manager: ${mgrRev?.review_status || "pending"}`}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 ${
                            mgrRev?.review_status === "completed"
                              ? mgrRev.outcome === "changes_requested"
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                                : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
                              : "bg-gray-100 text-gray-600 dark:bg-[#2A2A2A] dark:text-[#888888]"
                          }`}
                        >
                          <Building2 className="w-2.5 h-2.5" />
                          <span>Mgr: {mgrRev?.review_status === "completed" ? (mgrRev.outcome === "changes_requested" ? "Changes" : "Approved") : "Pending"}</span>
                        </span>

                        {/* Marketing Badge */}
                        <span
                          title={`Marketing: ${mktRev?.review_status || "pending"}`}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 ${
                            mktRev?.review_status === "completed"
                              ? mktRev.outcome === "changes_requested"
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                                : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
                              : "bg-gray-100 text-gray-600 dark:bg-[#2A2A2A] dark:text-[#888888]"
                          }`}
                        >
                          <Megaphone className="w-2.5 h-2.5" />
                          <span>Mkt: {mktRev?.review_status === "completed" ? (mktRev.outcome === "changes_requested" ? "Changes" : "Approved") : "Pending"}</span>
                        </span>

                        {/* Legal Badge */}
                        <span
                          title={`Legal: ${legRev?.review_status || "pending"}`}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 ${
                            legRev?.review_status === "completed"
                              ? legRev.outcome === "changes_requested"
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                                : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
                              : "bg-gray-100 text-gray-600 dark:bg-[#2A2A2A] dark:text-[#888888]"
                          }`}
                        >
                          <Scale className="w-2.5 h-2.5" />
                          <span>Legal: {legRev?.review_status === "completed" ? (legRev.outcome === "changes_requested" ? "Changes" : "Approved") : "Pending"}</span>
                        </span>
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="pt-2 flex items-center justify-between gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setViewingSub(sub);
                          setIsViewerOpen(true);
                        }}
                        className="text-xs text-[#087F70] dark:text-[#FFAA35] hover:underline font-semibold flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect Asset</span>
                      </button>

                      <button
                        onClick={() => setSelectedSub(sub)}
                        className={`text-xs px-3 py-1 font-bold rounded-lg transition ${
                          isSelected
                            ? "bg-[#10A995] text-white dark:bg-[#FFAA35] dark:text-[#111111]"
                            : "btn-dark-secondary"
                        }`}
                      >
                        {isSelected ? "Active Form" : "Select Review"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column (7 cols): Active Submission Detail & Claim Review Form */}
        <div className="lg:col-span-7 space-y-6">
          {selectedSub && selectedCycle ? (
            <div className="space-y-6">
              
              {/* Selected Design Summary Header Card */}
              <div className="bg-white dark:bg-[#1C1C1C] rounded-2xl p-5 sm:p-6 border border-[#DDEBE5] dark:border-[#383838] shadow-subtle dark:shadow-card space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#E8F7F1] dark:bg-[#272727] text-[#087F70] dark:text-[#FFAA35] font-bold">
                        Cycle #{selectedCycle.cycle_number}
                      </span>
                      <span className="text-xs text-[#58716A] dark:text-[#85817D]">
                        Designer: <strong className="text-[#18352F] dark:text-[#F7F3ED]">{selectedSub.creator_name || "Leo Vance"}</strong>
                      </span>
                    </div>
                    <h2 className="text-lg sm:text-xl font-bold font-heading text-[#18352F] dark:text-[#F7F3ED]">
                      {selectedSub.title}
                    </h2>
                    <p className="text-xs text-[#82948E] dark:text-[#85817D] mt-0.5">
                      File: {selectedSub.file_name} • Submitted {new Date(selectedSub.created_at).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        setViewingSub(selectedSub);
                        setIsViewerOpen(true);
                      }}
                      className="btn-dark-secondary text-xs px-3 py-1.5 font-bold rounded-xl flex items-center gap-1.5 transition"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#087F70] dark:text-[#FFAA35]" />
                      <span>View Full-Size</span>
                    </button>

                    {auditResult && (
                      <div className="px-3 py-1 rounded-xl bg-[#E8F7F1] dark:bg-amber-500/10 border border-[#C8E2D8] dark:border-amber-500/20 text-xs font-mono font-bold text-[#087F70] dark:text-[#FFAA35]">
                        Score: {auditResult.summary.compliance_score}/100
                      </div>
                    )}
                  </div>
                </div>

                {/* 3 Department Review Completion Progress Bar */}
                <div className="bg-[#F8FAF9] dark:bg-[#252525] rounded-xl p-3.5 border border-[#DDEBE5] dark:border-[#383838] space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#18352F] dark:text-[#F7F3ED] flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-[#087F70] dark:text-[#FFAA35]" />
                      <span>Review Cycle Completion Status</span>
                    </span>
                    <span className="text-[11px] font-mono text-[#58716A] dark:text-[#85817D]">
                      {selectedCycle.departmental_reviews.filter((d) => d.review_status === "completed").length} of 3 Departments Completed
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {(["manager", "marketing", "legal"] as DepartmentKey[]).map((dept) => {
                      const depRev = getDepartmentReview(selectedCycle, dept);
                      const isDone = depRev?.review_status === "completed";
                      const isChg = depRev?.outcome === "changes_requested";

                      return (
                        <div
                          key={dept}
                          className={`p-2 rounded-lg border text-center transition ${
                            isDone
                              ? isChg
                                ? "bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-900/20 dark:border-amber-800/40 dark:text-amber-300"
                                : "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-900/20 dark:border-emerald-800/40 dark:text-emerald-300"
                              : "bg-white dark:bg-[#1C1C1C] border-[#DDEBE5] dark:border-[#383838] text-gray-500 dark:text-[#888888]"
                          }`}
                        >
                          <div className="text-[10px] uppercase font-bold tracking-wider">{dept}</div>
                          <div className="text-xs font-semibold mt-0.5">
                            {isDone ? (isChg ? "Changes Req." : "Approved") : "Awaiting"}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Department Review Form */}
              <div className="bg-white dark:bg-[#1C1C1C] rounded-2xl p-5 sm:p-6 border border-[#DDEBE5] dark:border-[#383838] shadow-subtle dark:shadow-card space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#DDEBE5] dark:border-[#383838]">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-[#087F70] dark:text-[#FFAA35]" />
                    <h3 className="text-base font-bold text-[#18352F] dark:text-[#F7F3ED]">
                      Department Review Form
                    </h3>
                  </div>

                  {/* Switch department tabs if Admin */}
                  {isUserAdminOrManager && (
                    <div className="flex items-center gap-1 bg-[#F0F5F3] dark:bg-[#252525] p-1 rounded-xl text-xs">
                      {(["manager", "marketing", "legal"] as DepartmentKey[]).map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => {
                            setActiveDepartment(d);
                            setSelectedCategory(DEPARTMENT_CATEGORIES[d][0]);
                          }}
                          className={`px-2.5 py-1 rounded-lg capitalize font-bold transition ${
                            activeDepartment === d
                              ? "bg-white dark:bg-[#383838] text-[#087F70] dark:text-[#FFAA35] shadow-xs"
                              : "text-[#58716A] dark:text-[#888888] hover:text-[#18352F] dark:hover:text-[#F7F3ED]"
                          }`}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {submitSuccess && (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 shrink-0" />
                    <span>{submitSuccess}</span>
                  </div>
                )}

                <form onSubmit={handleSubmitDepartmentReview} className="space-y-4">
                  {/* Outcome Selector */}
                  <div>
                    <label className="block text-xs font-bold text-[#18352F] dark:text-[#F7F3ED] mb-1.5">
                      Review Outcome for {activeDepartment.toUpperCase()} Track
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div
                        onClick={() => setOutcome("no_changes_required")}
                        className={`p-3.5 rounded-xl border cursor-pointer flex items-center gap-3 transition ${
                          outcome === "no_changes_required"
                            ? "bg-emerald-50/80 border-emerald-500 text-emerald-900 dark:bg-emerald-950/30 dark:border-emerald-500/60 dark:text-emerald-200 ring-1 ring-emerald-500/40"
                            : "bg-white dark:bg-[#252525] border-[#DDEBE5] dark:border-[#383838] text-[#58716A] dark:text-[#85817D]"
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                            outcome === "no_changes_required"
                              ? "bg-emerald-500 text-white border-emerald-600"
                              : "border-gray-300 dark:border-gray-600"
                          }`}
                        >
                          {outcome === "no_changes_required" && <Check className="w-3 h-3" />}
                        </div>
                        <div>
                          <div className="text-xs font-bold">No Changes Required</div>
                          <div className="text-[11px] opacity-80">Design is compliant; approve this track.</div>
                        </div>
                      </div>

                      <div
                        onClick={() => setOutcome("changes_requested")}
                        className={`p-3.5 rounded-xl border cursor-pointer flex items-center gap-3 transition ${
                          outcome === "changes_requested"
                            ? "bg-amber-50/80 border-amber-500 text-amber-900 dark:bg-amber-950/30 dark:border-amber-500/60 dark:text-amber-200 ring-1 ring-amber-500/40"
                            : "bg-white dark:bg-[#252525] border-[#DDEBE5] dark:border-[#383838] text-[#58716A] dark:text-[#85817D]"
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                            outcome === "changes_requested"
                              ? "bg-amber-500 text-white border-amber-600"
                              : "border-gray-300 dark:border-gray-600"
                          }`}
                        >
                          {outcome === "changes_requested" && <AlertTriangle className="w-3 h-3" />}
                        </div>
                        <div>
                          <div className="text-xs font-bold">Changes Requested</div>
                          <div className="text-[11px] opacity-80">Designer must submit a revised version (v2).</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Feedback Category Selector */}
                  <div>
                    <label className="block text-xs font-bold text-[#18352F] dark:text-[#F7F3ED] mb-1.5">
                      Feedback Category
                    </label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full bg-white dark:bg-[#252525] border border-[#DDEBE5] dark:border-[#383838] rounded-xl px-3 py-2 text-xs text-[#18352F] dark:text-[#F7F3ED] focus:outline-none focus:ring-1 focus:ring-[#10A995] dark:focus:ring-[#FFAA35]"
                    >
                      {DEPARTMENT_CATEGORIES[activeDepartment].map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Comments */}
                  <div>
                    <label className="block text-xs font-bold text-[#18352F] dark:text-[#F7F3ED] mb-1.5">
                      Reviewer Assessment &amp; Notes
                    </label>
                    <textarea
                      rows={3}
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                      placeholder={`Enter specific ${activeDepartment} feedback and rationale for the designer...`}
                      className="w-full bg-white dark:bg-[#252525] border border-[#DDEBE5] dark:border-[#383838] rounded-xl p-3 text-xs text-[#18352F] dark:text-[#F7F3ED] placeholder:text-[#82948E] focus:outline-none focus:ring-1 focus:ring-[#10A995] dark:focus:ring-[#FFAA35]"
                    />
                  </div>

                  {/* Requested Correction (Required if Changes Requested) */}
                  {outcome === "changes_requested" && (
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-amber-700 dark:text-amber-400">
                        Actionable Correction for Designer *
                      </label>
                      <input
                        type="text"
                        required
                        value={requestedCorrection}
                        onChange={(e) => setRequestedCorrection(e.target.value)}
                        placeholder="E.g., Update body font weight to regular 400 and add certified ISO footnote..."
                        className="w-full bg-white dark:bg-[#252525] border border-amber-300 dark:border-amber-700/60 rounded-xl px-3 py-2 text-xs text-[#18352F] dark:text-[#F7F3ED] placeholder:text-amber-600/50 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                  )}

                  {/* Submit Review Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmittingReview}
                      className="btn-gradient-warm text-white dark:text-[#111111] text-xs font-bold px-5 py-2.5 rounded-xl shadow-warmGlow transition flex items-center justify-center gap-2 w-full sm:w-auto"
                    >
                      {isSubmittingReview ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          <span>Submitting {activeDepartment.toUpperCase()} Review...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Submit {activeDepartment.toUpperCase()} Review</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* Manager Final Approval Section */}
              {isUserAdminOrManager && (
                <div
                  className={`rounded-2xl p-5 sm:p-6 border transition space-y-3 ${
                    selectedCycle.status === "review_complete"
                      ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/60"
                      : selectedCycle.status === "approved"
                      ? "bg-[#F8FAF9] dark:bg-[#252525] border-emerald-500/40 text-emerald-800 dark:text-emerald-300"
                      : "bg-[#F8FAF9] dark:bg-[#252525] border-[#DDEBE5] dark:border-[#383838]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#087F70] dark:text-[#FFAA35]">
                        <UserCheck className="w-4 h-4" />
                        <span>Brand Manager Final Release Authorization</span>
                      </div>
                      <h3 className="text-base font-bold text-[#18352F] dark:text-[#F7F3ED]">
                        {selectedCycle.status === "approved"
                          ? "Design Approved & Released"
                          : selectedCycle.status === "review_complete"
                          ? "All 3 Departments Approved — Ready for Final Sign-Off"
                          : "Final Authorization Locked"}
                      </h3>
                      <p className="text-xs text-[#58716A] dark:text-[#B8B2AC] leading-relaxed">
                        {selectedCycle.status === "approved"
                          ? `Final approval was granted by Alex Mercer on ${selectedCycle.final_approved_at ? new Date(selectedCycle.final_approved_at).toLocaleString() : "today"}.`
                          : selectedCycle.status === "review_complete"
                          ? "Brand Manager, Marketing Lead, and Legal Counsel all completed their reviews with No Changes Required. You may now grant final approval to release this asset."
                          : selectedCycle.status === "changes_requested"
                          ? "One or more departments requested changes. Final approval is blocked until the designer uploads a revised version and all 3 departments approve."
                          : "Final sign-off is only permitted when all 3 departments (Manager, Marketing, and Legal) have submitted reviews without requested changes."}
                      </p>
                    </div>

                    {selectedCycle.status === "review_complete" && (
                      <button
                        onClick={handleGrantFinalApproval}
                        disabled={isApprovingFinal}
                        className="btn-gradient-warm text-white dark:text-[#111111] text-xs font-bold px-4 py-2.5 rounded-xl shadow-warmGlow transition flex items-center gap-2 shrink-0"
                      >
                        {isApprovingFinal ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            <span>Approving...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            <span>Grant Final Approval</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Claim Review Findings & Evidence (Preserved Claim Review Component) */}
              <div id="claim-review-section" className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#DDEBE5] dark:border-[#383838]">
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#087F70] dark:text-[#FFAA35] uppercase tracking-wider font-mono">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Claim Review &amp; Detected Issues</span>
                  </div>
                  {auditResult && (
                    <span className="text-xs text-[#58716A] dark:text-[#85817D]">
                      {auditResult.findings.length} findings analyzed
                    </span>
                  )}
                </div>

                {loadingAudit ? (
                  <div className="bg-white dark:bg-[#1C1C1C] rounded-2xl p-8 border border-[#DDEBE5] dark:border-[#383838] text-center space-y-3 shadow-subtle dark:shadow-card">
                    <div className="w-6 h-6 border-2 border-[#10A995] dark:border-[#FFAA35] border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-xs text-[#58716A] dark:text-[#85817D] font-medium">
                      Verifying statutory citations, regulatory benchmarks, and claim evidence...
                    </p>
                  </div>
                ) : auditResult && auditResult.findings.length > 0 ? (
                  <div className="space-y-3">
                    {auditResult.findings.map((finding) => (
                      <FindingCard
                        key={finding.id}
                        finding={finding}
                        onStatusChange={(findingId, newStatus) => {
                          setAuditResult((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  findings: prev.findings.map((f) =>
                                    f.id === findingId ? { ...f, status: newStatus as any } : f
                                  ),
                                }
                              : null
                          );
                        }}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="bg-white dark:bg-[#1C1C1C] rounded-2xl p-8 border border-[#DDEBE5] dark:border-[#383838] text-center text-xs text-[#58716A] dark:text-[#85817D] space-y-1 shadow-subtle dark:shadow-card">
                    <CheckCircle className="w-6 h-6 text-[#087F70] dark:text-[#72D6A1] mx-auto opacity-80 mb-2" />
                    <p className="font-bold text-[#18352F] dark:text-[#F7F3ED]">No claim violations detected</p>
                    <p>All claims and statements in this submission comply with documented brand standards.</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-[#1C1C1C] rounded-2xl p-12 border border-[#DDEBE5] dark:border-[#383838] text-center text-[#58716A] dark:text-[#85817D] space-y-2">
              <FileText className="w-8 h-8 text-[#087F70] dark:text-[#FFAA35] mx-auto opacity-80" />
              <p className="font-bold text-[#18352F] dark:text-[#F7F3ED]">Select a submission to review</p>
              <p className="text-xs">Choose a design from the left queue to open its multi-department review form.</p>
            </div>
          )}
        </div>
      </div>

      {/* Design Asset Viewer Modal */}
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

export default function ReviewsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-xs text-[#58716A] dark:text-[#85817D]">Loading Claim Review...</div>}>
      <ReviewsContent />
    </Suspense>
  );
}
