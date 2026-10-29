"use client";

import React, { useState, useEffect } from "react";
import { ContentSubmission, AuditResult } from "@/types";
import { api } from "@/services/api";
import { useAuth } from "@/services/auth-context";
import {
  Scale,
  FileText,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  ArrowRight,
  Shield,
  Check,
  X,
  MessageSquare,
  Eye,
  Lock,
} from "lucide-react";
import { DesignerFeedbackComments } from "@/components/reviews/DesignerFeedbackComments";
import { DesignAssetViewerModal } from "@/components/reviews/DesignAssetViewerModal";

interface LegalDashboardProps {
  submissions: ContentSubmission[];
  onRefresh: () => void;
}

export function LegalDashboard({ submissions, onRefresh }: LegalDashboardProps) {
  const { activeOrgName, user } = useAuth();
  const [selectedSubmission, setSelectedSubmission] = useState<ContentSubmission | null>(null);
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
  const [isLoadingAudit, setIsLoadingAudit] = useState(false);
  const [isAssetViewerOpen, setIsAssetViewerOpen] = useState(false);

  // Decision Modal
  const [isDecisionModalOpen, setIsDecisionModalOpen] = useState(false);
  const [decisionAction, setDecisionAction] = useState<"approve" | "reject" | "request_changes">("approve");
  const [comments, setComments] = useState("");
  const [isSubmittingDecision, setIsSubmittingDecision] = useState(false);
  const [decisionFeedback, setDecisionFeedback] = useState<string | null>(null);

  // Queue Filter: pending, visual, all, approved
  const [queueFilter, setQueueFilter] = useState<"pending" | "visual" | "all" | "approved">("pending");

  // Filter queue for submissions requiring human approval
  const filteredQueue = submissions.filter((s) => {
    if (queueFilter === "pending")
      return s.status === "pending_approval" || s.status === "changes_requested" || s.status === "submitted";
    if (queueFilter === "visual")
      return s.content_type === "image" || s.content_type === "video";
    if (queueFilter === "approved")
      return s.status === "approved";
    return true;
  });

  const pendingCount = submissions.filter(
    (s) => s.status === "pending_approval" || s.status === "changes_requested" || s.status === "submitted"
  ).length;
  const visualCount = submissions.filter(
    (s) => s.content_type === "image" || s.content_type === "video"
  ).length;
  const approvedCount = submissions.filter((s) => s.status === "approved").length;

  // Auto-select first pending submission for review if none selected
  useEffect(() => {
    if (!selectedSubmission && filteredQueue.length > 0) {
      handleInspectSubmission(filteredQueue[0]);
    }
  }, [filteredQueue.length]);

  useEffect(() => {
    const handleAssetUpdate = () => {
      onRefresh();
    };
    if (typeof window !== "undefined") {
      window.addEventListener("inkloom_asset_updated", handleAssetUpdate);
      return () => window.removeEventListener("inkloom_asset_updated", handleAssetUpdate);
    }
  }, [onRefresh]);

  const handleInspectSubmission = async (sub: ContentSubmission) => {
    setSelectedSubmission(sub);
    setIsLoadingAudit(true);
    setDecisionFeedback(null);
    try {
      const audit = await api.triggerAudit(sub.id, sub.current_revision_id);
      setAuditResult(audit);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoadingAudit(false);
    }
  };

  // Separation of duties: Creator cannot authorize their own submission
  const isAuthor = Boolean(
    selectedSubmission &&
      user &&
      ((selectedSubmission.creator_id && selectedSubmission.creator_id === user.id) ||
        (selectedSubmission.author_id && selectedSubmission.author_id === user.id) ||
        (selectedSubmission.author_email &&
          user.email &&
          selectedSubmission.author_email.toLowerCase() === user.email.toLowerCase()) ||
        (selectedSubmission.created_by && selectedSubmission.created_by === user.id))
  );

  const handleSubmitDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubmission) return;

    if (decisionAction === "approve" && isAuthor) {
      alert("Separation of Duties violation: Content creators cannot authorize their own submissions. Please have an independent compliance officer review this submission.");
      return;
    }

    if ((decisionAction === "reject" || decisionAction === "request_changes") && !comments.trim()) {
      alert("Mandatory justification: Please specify the statutory, trademark, or regulatory rule requiring revision.");
      return;
    }

    setIsSubmittingDecision(true);
    try {
      await api.submitReviewDecision({
        submission_id: selectedSubmission.id,
        revision_id: selectedSubmission.current_revision_id,
        action: decisionAction,
        comments,
      });
      setDecisionFeedback(`Review recorded successfully: Content marked as ${decisionAction.replace("_", " ")}.`);
      setIsDecisionModalOpen(false);
      setComments("");
      onRefresh();
    } catch (err: any) {
      alert(err.message || "Review decision failed. Enforce separation of duties.");
    } finally {
      setIsSubmittingDecision(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Enterprise Page Header */}
      <div className="bg-white dark:bg-[#1C1C1C] rounded-2xl p-6 sm:p-8 border border-[#DDEBE5] dark:border-[#383838] shadow-subtle dark:shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#087F70] via-[#10A995] to-[#43D6B3] dark:from-[#FFD84D] dark:via-[#FF7A36] dark:to-[#F45B91]" />
        <div className="absolute top-0 right-0 w-80 h-32 bg-gradient-to-l from-[#10A995]/10 dark:from-[#FF7A36]/10 to-transparent pointer-events-none blur-2xl" />
        <div className="space-y-2 max-w-3xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E8F7F1] border border-[#C8E2D8] text-[#087F70] dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-[#FFAA35] text-xs font-bold font-mono">
            <Scale className="w-3.5 h-3.5" />
            <span>Legal &amp; Regulatory Compliance Station</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#18352F] dark:text-[#F7F3ED] font-heading tracking-tight">
            {activeOrgName || "Enterprise"} Compliance Review Queue
          </h1>
          <p className="text-[#58716A] dark:text-[#85817D] text-sm leading-relaxed">
            Human-in-the-loop review station for brand governance. Inspect factual accuracy, statutory disclosures, and guideline alignment before authorizing public release.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
          <div className="bg-[#EFF8F4] dark:bg-[#141414] border border-[#DDEBE5] dark:border-[#383838] rounded-xl px-5 py-3 text-center">
            <span className="block text-[11px] font-bold uppercase tracking-wider text-[#58716A] dark:text-[#85817D] font-mono">Awaiting Action</span>
            <span className="text-2xl font-black text-gradient-warm font-heading">{pendingCount}</span>
          </div>
        </div>
      </div>

      {decisionFeedback && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-sm rounded-xl flex items-center justify-between shadow-subtle dark:shadow-xl">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{decisionFeedback}</span>
          </div>
          <button
            onClick={() => setDecisionFeedback(null)}
            className="text-emerald-600 dark:text-emerald-400 hover:opacity-80 font-bold p-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Review Section: Queue on Left, Findings Inspection on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Pending Review Queue */}
        <div className="lg:col-span-5 bg-white dark:bg-[#1C1C1C] border border-[#DDEBE5] dark:border-[#383838] rounded-2xl p-5 shadow-subtle dark:shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#DDEBE5] dark:border-[#383838]">
            <h2 className="text-sm font-bold text-[#18352F] dark:text-[#F7F3ED] font-heading flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#087F70] dark:text-[#FFAA35]" />
              <span>Review Queue ({filteredQueue.length})</span>
            </h2>
            <span className="text-[10px] font-bold text-[#087F70] bg-[#E8F7F1] border border-[#C8E2D8] dark:text-[#FFAA35] dark:bg-amber-500/10 dark:border-amber-500/20 px-2.5 py-0.5 rounded-full font-mono">
              Separation of Duties
            </span>
          </div>

          {/* Queue Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 pb-2">
            <button
              onClick={() => setQueueFilter("pending")}
              className={`text-xs px-2.5 py-1 rounded-lg font-bold transition ${
                queueFilter === "pending"
                  ? "bg-[#E8F7F1] text-[#087F70] border border-[#C8E2D8] dark:bg-gradient-to-r dark:from-[#FFAA35] dark:to-[#FF7A36] dark:text-ink-950 shadow-sm"
                  : "bg-[#F7FBF9] hover:bg-[#EFF8F4] text-[#58716A] border border-[#DDEBE5] dark:bg-[#202020] dark:hover:bg-[#272727] dark:text-[#B8B2AC] dark:border-[#383838]"
              }`}
            >
              Awaiting ({pendingCount})
            </button>
            <button
              onClick={() => setQueueFilter("visual")}
              className={`text-xs px-2.5 py-1 rounded-lg font-bold transition ${
                queueFilter === "visual"
                  ? "bg-[#E8F7F1] text-[#087F70] border border-[#C8E2D8] dark:bg-gradient-to-r dark:from-[#FFAA35] dark:to-[#FF7A36] dark:text-ink-950 shadow-sm"
                  : "bg-[#F7FBF9] hover:bg-[#EFF8F4] text-[#58716A] border border-[#DDEBE5] dark:bg-[#202020] dark:hover:bg-[#272727] dark:text-[#B8B2AC] dark:border-[#383838]"
              }`}
            >
              Visual Media ({visualCount})
            </button>
            <button
              onClick={() => setQueueFilter("all")}
              className={`text-xs px-2.5 py-1 rounded-lg font-bold transition ${
                queueFilter === "all"
                  ? "bg-[#E8F7F1] text-[#087F70] border border-[#C8E2D8] dark:bg-gradient-to-r dark:from-[#FFAA35] dark:to-[#FF7A36] dark:text-ink-950 shadow-sm"
                  : "bg-[#F7FBF9] hover:bg-[#EFF8F4] text-[#58716A] border border-[#DDEBE5] dark:bg-[#202020] dark:hover:bg-[#272727] dark:text-[#B8B2AC] dark:border-[#383838]"
              }`}
            >
              All ({submissions.length})
            </button>
            <button
              onClick={() => setQueueFilter("approved")}
              className={`text-xs px-2.5 py-1 rounded-lg font-bold transition ${
                queueFilter === "approved"
                  ? "bg-[#E8F7F1] text-[#087F70] border border-[#C8E2D8] dark:bg-gradient-to-r dark:from-[#FFAA35] dark:to-[#FF7A36] dark:text-ink-950 shadow-sm"
                  : "bg-[#F7FBF9] hover:bg-[#EFF8F4] text-[#58716A] border border-[#DDEBE5] dark:bg-[#202020] dark:hover:bg-[#272727] dark:text-[#B8B2AC] dark:border-[#383838]"
              }`}
            >
              Approved ({approvedCount})
            </button>
          </div>

          <div className="divide-y divide-[#DDEBE5] dark:divide-[#383838] space-y-2">
            {filteredQueue.length > 0 ? (
              filteredQueue.map((sub) => {
                const isSelected = selectedSubmission?.id === sub.id;
                return (
                  <div
                    key={sub.id}
                    onClick={() => handleInspectSubmission(sub)}
                    className={`p-4 rounded-xl cursor-pointer transition-all border ${
                      isSelected
                        ? "bg-[#E8F7F1] border-[#10A995] shadow-sm dark:bg-[#272727] dark:border-amber-500/50 dark:shadow-md dark:ring-1 dark:ring-amber-500/30"
                        : "bg-white border-[#DDEBE5] hover:border-[#10A995]/50 hover:bg-[#F7FBF9] dark:bg-[#202020] dark:border-[#383838] dark:hover:border-amber-500/30 dark:hover:bg-[#272727]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-bold text-[#18352F] dark:text-[#F7F3ED] truncate font-heading">{sub.title}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize shrink-0 font-mono ${
                          sub.status === "pending_approval"
                            ? "bg-[#E8F7F1] text-[#087F70] border-[#C8E2D8] dark:bg-amber-500/10 dark:text-[#FFAA35] dark:border-amber-500/20"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20"
                        }`}
                      >
                        {sub.status.replace("_", " ")}
                      </span>
                    </div>
                    <div className="text-xs text-[#58716A] dark:text-ink-secondary mt-1.5 line-clamp-2 leading-relaxed">
                      {sub.description}
                    </div>
                    <div className="mt-3 flex items-center justify-between text-[11px] text-[#82948E] dark:text-ink-muted border-t border-[#DDEBE5] dark:border-border/80 pt-2">
                      <span className="uppercase font-semibold tracking-wider">{sub.content_type}</span>
                      <span className="text-[#087F70] dark:text-teal font-bold flex items-center gap-1">
                        Inspect Evidence <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-16 text-center text-[#82948E] dark:text-ink-muted text-xs space-y-2">
                <CheckCircle className="w-8 h-8 text-status-success mx-auto opacity-70" />
                <div className="font-semibold text-[#18352F] dark:text-navy">Review queue is clear</div>
                <p className="text-[11px] text-[#82948E] dark:text-ink-muted max-w-xs mx-auto">
                  All submitted content pieces have received authorized decisions.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Detailed Finding Inspection & Decision Hub */}
        <div className="lg:col-span-7 bg-surface border border-border rounded-2xl p-6 shadow-subtle space-y-6">
          {selectedSubmission ? (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-border pb-5">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">
                    Inspecting Submission
                  </div>
                  <h3 className="text-lg font-bold text-navy mt-0.5">{selectedSubmission.title}</h3>
                  <div className="text-xs text-ink-secondary mt-1">{selectedSubmission.description}</div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setIsAssetViewerOpen(true)}
                    className="px-3.5 py-2 btn-dark-secondary text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-sm"
                    title="Open visual design canvas, inspect WCAG contrast, and view high-resolution media"
                  >
                    <Eye className="w-3.5 h-3.5 text-[#087F70] dark:text-[#FFAA35]" />
                    <span>Open Design Asset ↗</span>
                  </button>
                  <button
                    disabled={isAuthor}
                    onClick={() => {
                      if (isAuthor) return;
                      setDecisionAction("approve");
                      setIsDecisionModalOpen(true);
                    }}
                    title={
                      isAuthor
                        ? "Separation of Duties: Creators cannot authorize their own submissions."
                        : "Authorize content for production release"
                    }
                    className={`px-4 py-2 text-xs font-bold rounded-xl shadow-lg transition flex items-center gap-1.5 ${
                      isAuthor
                        ? "bg-[#272727] text-[#85817D] cursor-not-allowed border border-[#383838]"
                        : "btn-gradient-warm text-white dark:text-ink-950 shadow-warmGlow"
                    }`}
                  >
                    {isAuthor ? <Lock className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5 text-white dark:text-ink-950" />}
                    <span>{isAuthor ? "Authorize (Self Locked)" : "Authorize"}</span>
                  </button>
                  <button
                    onClick={() => {
                      setDecisionAction("request_changes");
                      setIsDecisionModalOpen(true);
                    }}
                    className="px-3.5 py-2 bg-[#E8F7F1] hover:bg-[#DDF3EB] text-[#087F70] border border-[#C8E2D8] dark:bg-amber-500/15 dark:hover:bg-amber-500/25 dark:text-[#FFAA35] dark:border-amber-500/30 text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1.5"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Request Changes</span>
                  </button>
                </div>
              </div>

              {/* Separation of Duties Warning if Author */}
              {isAuthor && (
                <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-xs space-y-1">
                  <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-300">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Separation of Duties Enforced (Self-Approval Prohibited)</span>
                  </div>
                  <p className="text-amber-800 dark:text-amber-200/80 leading-relaxed pl-6">
                    You are recorded as the creator or submitter of this asset. In accordance with enterprise governance and statutory compliance rules, creators cannot authorize their own content. An independent compliance officer must conduct the final authorization.
                  </p>
                </div>
              )}

              {/* Audit Findings List */}
              <div className="space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-ink-secondary flex items-center justify-between">
                  <span>AI Audit Evidence & Findings</span>
                  {auditResult && (
                    <span className="text-navy font-semibold">
                      Compliance Score: <strong className="text-teal">{auditResult.summary.compliance_score}/100</strong>
                    </span>
                  )}
                </div>

                {isLoadingAudit ? (
                  <div className="py-16 text-center text-xs text-ink-muted space-y-2">
                    <div className="inline-block w-6 h-6 border-2 border-teal border-t-transparent rounded-full animate-spin" />
                    <div>Retrieving AI audit findings and benchmark citations...</div>
                  </div>
                ) : auditResult && auditResult.findings.length > 0 ? (
                  <div className="space-y-3">
                    {auditResult.findings.map((f) => (
                      <div
                        key={f.id}
                        className="p-4 rounded-xl bg-workspace border border-border space-y-2.5 transition hover:border-slate-300"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded border ${
                                f.severity === "critical"
                                  ? "bg-red-50 text-status-error border-red-200"
                                  : f.severity === "high"
                                  ? "bg-amber-50 text-status-warning border-amber-200"
                                  : "bg-blue-50 text-status-info border-blue-200"
                              }`}
                            >
                              {f.severity}
                            </span>
                            <span className="text-xs font-bold text-navy">{f.title}</span>
                          </div>
                          <span className="text-[10px] text-ink-muted font-mono font-medium">
                            Confidence: {Math.round(f.confidence * 100)}%
                          </span>
                        </div>

                        <div className="text-xs text-ink-secondary leading-relaxed">{f.message}</div>

                        {f.evidence && (
                          <div className="p-2.5 rounded-lg bg-surface border border-border text-xs font-mono text-status-warning">
                            &ldquo;{f.evidence}&rdquo;
                          </div>
                        )}

                        {f.suggested_correction && (
                          <div className="text-xs text-status-success font-medium pt-0.5 flex items-start gap-1.5">
                            <span className="font-bold shrink-0">Compliant Phrasing:</span>
                            <span>&quot;{f.suggested_correction.replacement_text}&quot;</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 rounded-xl bg-workspace border border-border text-center text-xs text-ink-muted">
                    No critical violations detected by automated rule checks. Reviewer judgment required for release.
                  </div>
                )}
                {/* Department Suggestions & Improvement Box under Designer's Content */}
                <DesignerFeedbackComments
                  submissionId={selectedSubmission.id}
                  submissionTitle={selectedSubmission.title}
                  contentType={selectedSubmission.content_type}
                  description={selectedSubmission.description}
                  rawText={selectedSubmission.raw_text}
                  fileName={selectedSubmission.file_name}
                  mediaUrl={selectedSubmission.media_url}
                  submission={selectedSubmission}
                />
              </div>
            </div>
          ) : (
            <div className="py-24 text-center text-ink-muted space-y-3">
              <Scale className="w-12 h-12 text-ink-muted/50 mx-auto" />
              <div className="text-sm font-semibold text-navy">Select a submission from the review queue</div>
              <div className="text-xs max-w-sm mx-auto text-ink-secondary leading-relaxed">
                Inspect AI findings, verify benchmark citations, and record authorized approval decisions with complete audit trail accountability.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Review Decision Modal */}
      {isDecisionModalOpen && selectedSubmission && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-5 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-navy flex items-center gap-2">
                <Shield className="w-4 h-4 text-teal" />
                <span>Record Compliance Decision</span>
              </h3>
              <button
                onClick={() => setIsDecisionModalOpen(false)}
                className="text-ink-muted hover:text-navy p-1 text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitDecision} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-navy mb-2">Target Action</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    disabled={isAuthor}
                    onClick={() => setDecisionAction("approve")}
                    title={isAuthor ? "Self-approval is prohibited under separation of duties" : ""}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all flex items-center justify-center gap-1.5 ${
                      isAuthor
                        ? "bg-slate-200 dark:bg-slate-800 text-slate-400 border-slate-300 cursor-not-allowed"
                        : decisionAction === "approve"
                        ? "bg-status-success text-white border-status-success shadow-subtle"
                        : "bg-surface text-ink-secondary border-border hover:bg-workspace"
                    }`}
                  >
                    {isAuthor ? <Lock className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
                    <span>{isAuthor ? "Locked (Author)" : "Approve"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDecisionAction("request_changes")}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all flex items-center justify-center gap-1.5 ${
                      decisionAction === "request_changes"
                        ? "bg-status-warning text-white border-status-warning shadow-subtle"
                        : "bg-surface text-ink-secondary border-border hover:bg-workspace"
                    }`}
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Changes</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDecisionAction("reject")}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all flex items-center justify-center gap-1.5 ${
                      decisionAction === "reject"
                        ? "bg-status-error text-white border-status-error shadow-subtle"
                        : "bg-surface text-ink-secondary border-border hover:bg-workspace"
                    }`}
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-navy mb-1.5 flex items-center justify-between">
                  <span>
                    Compliance Officer Notes &amp; Required Corrections{" "}
                    {decisionAction !== "approve" ? "(Mandatory Justification) *" : "*"}
                  </span>
                  {decisionAction !== "approve" && (
                    <span className="text-[10px] text-amber-600 font-medium">Policy citation required</span>
                  )}
                </label>
                <textarea
                  required
                  rows={3}
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder={
                    decisionAction === "approve"
                      ? "State statutory sign-off notes or compliance approval reference..."
                      : "Mandatory: State specific policy, trademark, or regulatory violations and required revisions..."
                  }
                  className="w-full bg-workspace border border-border rounded-xl p-3 text-xs text-navy focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal"
                />
              </div>

              <div className="p-3 bg-workspace border border-border rounded-xl text-[11px] text-ink-secondary leading-relaxed">
                <span className="font-bold text-navy">Separation of Duties Notice:</span> Your reviewer identity (
                {user?.full_name || user?.email}) and exact timestamp will be permanently logged in the immutable audit event trail.
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsDecisionModalOpen(false)}
                  className="flex-1 py-2.5 bg-workspace hover:bg-slate-200 text-ink-secondary rounded-xl text-xs font-bold transition border border-border"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingDecision}
                  className="flex-1 py-2.5 bg-teal hover:bg-teal-hover text-white rounded-xl text-xs font-bold shadow-subtle transition disabled:opacity-50"
                >
                  {isSubmittingDecision ? "Recording Decision..." : "Submit Official Decision"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Interactive Design Asset Viewer Modal for Legal Reviewer */}
      {isAssetViewerOpen && selectedSubmission && (
        <DesignAssetViewerModal
          isOpen={isAssetViewerOpen}
          onClose={() => setIsAssetViewerOpen(false)}
          submission={selectedSubmission}
          auditResult={auditResult}
          canAuthorize={!isAuthor}
          onAuthorize={() => {
            if (isAuthor) return;
            setDecisionAction("approve");
            setIsDecisionModalOpen(true);
          }}
          onRequestChanges={() => {
            setDecisionAction("request_changes");
            setIsDecisionModalOpen(true);
          }}
          onOpenFeedback={() => {
            const el = document.getElementById("department-suggestion-form");
            if (el) el.scrollIntoView({ behavior: "smooth" });
          }}
        />
      )}
    </div>
  );
}
