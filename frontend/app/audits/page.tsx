"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/services/api";
import { AuditResult, ContentSubmission, ContentComment } from "@/types";
import { AuditSummaryCard } from "@/components/audits/AuditSummaryCard";
import { FindingsFilter } from "@/components/audits/FindingsFilter";
import { FindingCard } from "@/components/audits/FindingCard";
import { DesignAssetViewerModal } from "@/components/reviews/DesignAssetViewerModal";
import { ReviewHistoryList } from "@/components/reviews/ReviewHistoryList";
import {
  Folder,
  ShieldCheck,
  ArrowRight,
  FileText,
  Eye,
  Layers,
  MessageSquare,
  RefreshCw,
} from "lucide-react";

function AuditsContent() {
  const searchParams = useSearchParams();
  const queryId = searchParams?.get("id") || searchParams?.get("content_id");
  const tabParam = searchParams?.get("tab");

  const [activeTab, setActiveTab] = useState<"visual_cards" | "ai_findings">(
    tabParam === "ai" ? "ai_findings" : "visual_cards"
  );

  const [submissions, setSubmissions] = useState<ContentSubmission[]>([]);
  const [comments, setComments] = useState<ContentComment[]>([]);
  const [selectedContentId, setSelectedContentId] = useState<string>(queryId || "");
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSeverity, setSelectedSeverity] = useState("all");
  const [loading, setLoading] = useState(true);
  const [auditLoading, setAuditLoading] = useState(false);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load submissions and all comments
  const loadData = async () => {
    setLoading(true);
    try {
      const [subs, allComments] = await Promise.all([
        api.getSubmissions(),
        api.getAllComments().catch((err) => {
          console.warn("Failed to load all comments:", err);
          return [] as ContentComment[];
        }),
      ]);
      setSubmissions(subs);
      setComments(allComments);
      if (!selectedContentId && subs.length > 0) {
        setSelectedContentId(subs[0].id);
      }
    } catch (err: any) {
      console.error("Failed to load initial review history data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Update selectedContentId if queryId changes
  useEffect(() => {
    if (queryId) {
      setSelectedContentId(queryId);
    }
  }, [queryId]);

  // Load audit result for selected content ID
  const loadAudit = async () => {
    const targetId = selectedContentId || (submissions.length > 0 ? submissions[0].id : null);
    if (!targetId) {
      return;
    }
    setAuditLoading(true);
    setError(null);
    try {
      const res = await api.getAudit(targetId);
      setAuditResult(res);
    } catch (err: any) {
      console.error("Failed to load audit result", err);
      setError(err?.message || "Failed to load audit report for this content asset.");
    } finally {
      setAuditLoading(false);
    }
  };

  useEffect(() => {
    if (selectedContentId) {
      loadAudit();
    }
  }, [selectedContentId]);

  // Handle toggling resolution of a feedback item
  const handleToggleResolve = async (commentId: string, currentStatus: boolean, note?: string) => {
    const targetComment = comments.find((c) => c.id === commentId);
    const subId = targetComment?.submission_id || selectedContentId;
    if (!subId) return;

    try {
      const targetState = !currentStatus;
      const updated = await api.toggleCommentResolution(subId, commentId, targetState, note);
      setComments((prev) =>
        prev.map((c) => (c.id === commentId ? { ...c, ...updated } : c))
      );
    } catch (err: any) {
      console.error("Failed to toggle resolution:", err);
    }
  };

  const activeSub = submissions.find((s) => s.id === selectedContentId);

  // Filter findings for the AI Findings tab
  const filteredFindings = auditResult
    ? auditResult.findings.filter((f) => {
        const matchesCat = selectedCategory === "all" || f.category === selectedCategory;
        const matchesSev = selectedSeverity === "all" || f.severity === selectedSeverity;
        return matchesCat && matchesSev;
      })
    : [];

  return (
    <div className="max-w-7xl mx-auto space-y-6 relative pb-12 selection:bg-[#10A995]/20 dark:selection:bg-[#FF7A36]/30 selection:text-[#18352F] dark:selection:text-white">
      {/* Page Header */}
      <div className="bg-surface rounded-2xl p-6 sm:p-7 border border-border shadow-subtle relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#087F70] via-[#10A995] to-[#43D6B3] dark:from-[#FFD84D] dark:via-[#FF7A36] dark:to-[#F45B91]" />
        
        <div className="space-y-2 max-w-3xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal/10 border border-teal/20 text-teal text-xs font-bold font-mono">
            <Folder className="w-3.5 h-3.5" />
            <span>Review History • Acme Cloud Systems</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink-primary font-heading tracking-tight">
            Review History &amp; Visual Feedback
          </h1>
          <p className="text-xs sm:text-sm text-ink-secondary leading-relaxed max-w-2xl">
            Inspect feedback, visual suggestions, and requested improvements from Manager, Marketing, and Legal &amp; Compliance on your submitted designs.
          </p>
        </div>

        {/* Global Action Controls */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {submissions.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-ink-muted font-semibold hidden md:inline">Inspect Asset:</span>
              <select
                value={selectedContentId}
                onChange={(e) => setSelectedContentId(e.target.value)}
                className="bg-workspace border border-border text-xs text-ink-primary rounded-xl px-3 py-2 max-w-[220px] truncate focus:outline-none focus:border-teal"
              >
                {submissions.map((s) => (
                  <option key={s.id} value={s.id} className="bg-surface text-ink-primary">
                    [{s.content_type.toUpperCase()}] {s.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {activeSub && (
            <button
              onClick={() => setIsViewerOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-workspace hover:bg-surface border border-border text-xs font-bold text-ink-primary transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 text-teal dark:text-[#FFAA35]" />
              <span>Open &amp; View Asset ↗</span>
            </button>
          )}

          <button
            onClick={loadData}
            className="p-2.5 rounded-xl bg-workspace hover:bg-surface border border-border text-ink-secondary hover:text-ink-primary transition shadow-xs cursor-pointer"
            title="Refresh review data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main View Tab Switcher */}
      <div className="flex items-center justify-between flex-wrap gap-3 border-b border-border/80 pb-2">
        <div className="flex items-center gap-2 p-1 bg-surface border border-border rounded-xl shadow-xs">
          <button
            type="button"
            onClick={() => setActiveTab("visual_cards")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === "visual_cards"
                ? "bg-teal text-white shadow-subtle dark:bg-[#FFAA35] dark:text-[#111111]"
                : "text-ink-secondary hover:text-ink-primary"
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Visual Feedback Cards</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeTab === "visual_cards"
                  ? "bg-white/20 text-white dark:bg-black/20 dark:text-[#111111]"
                  : "bg-workspace text-ink-muted"
              }`}
            >
              {comments.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("ai_findings")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === "ai_findings"
                ? "bg-teal text-white shadow-subtle dark:bg-[#FFAA35] dark:text-[#111111]"
                : "text-ink-secondary hover:text-ink-primary"
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Automated AI Audit Findings</span>
            {auditResult && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  activeTab === "ai_findings"
                    ? "bg-white/20 text-white dark:bg-black/20 dark:text-[#111111]"
                    : "bg-workspace text-ink-muted"
                }`}
              >
                {auditResult.findings.length}
              </span>
            )}
          </button>
        </div>

        <span className="text-xs text-ink-muted hidden sm:inline">
          {activeTab === "visual_cards"
            ? "Review cards show actual design thumbnail & team feedback"
            : "Automated brand rule compliance & violation checks"}
        </span>
      </div>

      {/* View Content */}
      {activeTab === "visual_cards" ? (
        <ReviewHistoryList
          comments={comments}
          submissions={submissions}
          onToggleResolve={handleToggleResolve}
          onRefresh={loadData}
          isLoading={loading}
        />
      ) : (
        /* Automated AI Findings View (Preserves existing AI audit feature) */
        <div className="space-y-6">
          {auditLoading ? (
            <div className="flex flex-col items-center justify-center min-h-[30vh] text-ink-muted text-sm space-y-3">
              <div className="w-8 h-8 rounded-full border-2 border-teal border-t-transparent animate-spin"></div>
              <p className="font-semibold text-navy">Loading governance audit results...</p>
            </div>
          ) : error ? (
            <div className="max-w-xl mx-auto py-12 text-center space-y-4">
              <div className="bg-surface border border-rose-200 dark:border-rose-900/50 rounded-2xl p-8 shadow-card text-center space-y-4">
                <div className="w-12 h-12 mx-auto rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-center justify-center text-rose-600">
                  <FileText className="w-6 h-6 text-rose-600 dark:text-rose-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-navy">Audit Result Unavailable</h2>
                  <p className="text-xs text-ink-secondary mt-1">{error}</p>
                </div>
                <button
                  onClick={loadAudit}
                  className="px-4 py-2 bg-teal hover:bg-teal-hover text-white text-xs font-semibold rounded-lg transition inline-flex items-center gap-1.5 shadow-sm"
                >
                  <span>Retry Audit Lookup</span>
                </button>
              </div>
            </div>
          ) : auditResult ? (
            <>
              {/* Audit Summary Card */}
              <AuditSummaryCard
                summary={auditResult.summary}
                overallStatus={auditResult.overall_status}
                auditId={auditResult.audit_id}
              />

              {/* Filter Bar */}
              <FindingsFilter
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
                selectedSeverity={selectedSeverity}
                onSelectSeverity={setSelectedSeverity}
                totalFindings={filteredFindings.length}
              />

              {/* Findings List */}
              <div className="space-y-4">
                {filteredFindings.length === 0 ? (
                  <div className="text-center py-16 bg-surface rounded-2xl border border-border text-ink-muted text-sm shadow-subtle">
                    No findings match the selected filter criteria.
                  </div>
                ) : (
                  filteredFindings.map((finding) => (
                    <FindingCard key={finding.id} finding={finding} />
                  ))
                )}
              </div>
</>
          ) : (
            <div className="max-w-xl mx-auto py-12 text-center space-y-4">
              <div className="bg-surface border border-border rounded-2xl p-8 shadow-card text-center space-y-4">
                <div className="w-12 h-12 mx-auto rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal">
                  <ShieldCheck className="w-6 h-6 text-teal" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-navy">No Audit Results Found</h2>
                  <p className="text-xs text-ink-secondary mt-1 max-w-sm mx-auto">
                    Select a submission to inspect automated rule checks.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Design Asset Viewer Modal */}
      <DesignAssetViewerModal
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
        submission={activeSub || null}
        canAuthorize={true}
      />
    </div>
  );
}

export default function AuditsPage() {
  return (
    <Suspense fallback={<div className="text-ink-muted p-8 text-xs">Loading review history...</div>}>
      <AuditsContent />
    </Suspense>
  );
}
