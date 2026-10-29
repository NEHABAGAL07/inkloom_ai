"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/services/api";
import { AuditResult, ContentSubmission } from "@/types";
import { AuditSummaryCard } from "@/components/audits/AuditSummaryCard";
import { FindingsFilter } from "@/components/audits/FindingsFilter";
import { FindingCard } from "@/components/audits/FindingCard";
import { DesignerFeedbackComments } from "@/components/reviews/DesignerFeedbackComments";
import { DesignAssetViewerModal } from "@/components/reviews/DesignAssetViewerModal";
import { ShieldCheck, ArrowRight, FileText, Eye } from "lucide-react";

function AuditsContent() {
  const searchParams = useSearchParams();
  const queryId = searchParams?.get("id") || searchParams?.get("content_id");

  const [submissions, setSubmissions] = useState<ContentSubmission[]>([]);
  const [selectedContentId, setSelectedContentId] = useState<string>(queryId || "");
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSeverity, setSelectedSeverity] = useState("all");
  const [loading, setLoading] = useState(true);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  const [error, setError] = useState<string | null>(null);

  // Load submissions list
  useEffect(() => {
    async function loadSubmissions() {
      try {
        const subs = await api.getSubmissions();
        setSubmissions(subs);
        if (!selectedContentId && subs.length > 0) {
          setSelectedContentId(subs[0].id);
        }
      } catch (err: any) {
        console.error("Failed to load submissions", err);
      }
    }
    loadSubmissions();
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
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api.getAudit(targetId);
      setAuditResult(res);
    } catch (err: any) {
      console.error("Failed to load audit result", err);
      setError(err?.message || "Failed to load audit report for this content asset.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAudit();
  }, [selectedContentId, submissions]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] text-ink-muted text-sm space-y-3">
        <div className="w-8 h-8 rounded-full border-2 border-teal border-t-transparent animate-spin"></div>
        <p className="font-semibold text-navy">Loading governance audit results...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
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
    );
  }

  if (!auditResult) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <div className="bg-surface border border-border rounded-2xl p-8 shadow-card text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal">
            <ShieldCheck className="w-6 h-6 text-teal" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-navy">No Audit Results Found</h2>
            <p className="text-xs text-ink-secondary mt-1 max-w-sm mx-auto">
              No content piece has been submitted or selected for auditing. Submit draft copy or marketing media to initiate automated verification.
            </p>
          </div>
          <div className="pt-2">
            <a
              href="/"
              className="px-4 py-2.5 bg-teal hover:bg-teal-hover text-white text-xs font-semibold rounded-lg transition inline-flex items-center gap-2 shadow-sm"
            >
              <span>Back to Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Filter findings
  const filteredFindings = auditResult.findings.filter((f) => {
    const matchesCat = selectedCategory === "all" || f.category === selectedCategory;
    const matchesSev = selectedSeverity === "all" || f.severity === selectedSeverity;
    return matchesCat && matchesSev;
  });

  const activeSub = submissions.find((s) => s.id === selectedContentId);

  return (
    <div className="max-w-6xl mx-auto space-y-6 relative selection:bg-[#10A995]/20 dark:selection:bg-[#FF7A36]/30 selection:text-[#18352F] dark:selection:text-white">
      {/* Header & Content Piece Switcher */}
      <div className="bg-white dark:bg-[#1C1C1C] rounded-2xl p-6 border border-[#DDEBE5] dark:border-[#383838] shadow-subtle dark:shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#087F70] via-[#10A995] to-[#43D6B3] dark:from-[#FFD84D] dark:via-[#FF7A36] dark:to-[#F45B91]" />
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#E8F7F1] border border-[#C8E2D8] text-[#087F70] dark:bg-[#272727] dark:border-[#383838] dark:text-[#FFAA35] text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Audit Findings &amp; Remediation</span>
          </div>
          <h1 className="text-2xl font-heading font-extrabold text-[#18352F] dark:text-[#F7F3ED] tracking-tight">Audit Findings &amp; Remediation</h1>
          <p className="text-xs text-[#58716A] dark:text-[#85817D]">
            Inspecting <strong className="text-[#18352F] dark:text-[#F7F3ED]">{activeSub?.title || auditResult.content_id}</strong> against active enterprise guidelines.
          </p>
        </div>

        {/* Content Piece Switcher Dropdown */}
        <div className="flex flex-wrap items-center gap-3">
          {submissions.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#58716A] dark:text-[#85817D] font-semibold hidden md:inline">Inspect Asset:</span>
              <select
                value={selectedContentId}
                onChange={(e) => setSelectedContentId(e.target.value)}
                className="bg-[#F7FBF9] dark:bg-[#141414] border border-[#DDEBE5] dark:border-[#383838] text-xs text-[#18352F] dark:text-[#F7F3ED] rounded-xl px-3 py-2 max-w-[240px] truncate focus:outline-none focus:border-[#10A995] dark:focus:border-[#FFAA35]"
              >
                {submissions.map((s) => (
                  <option key={s.id} value={s.id} className="bg-white dark:bg-[#1C1C1C] text-[#18352F] dark:text-[#F7F3ED]">
                    [{s.content_type.toUpperCase()}] {s.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {activeSub && (
            <button
              onClick={() => setIsViewerOpen(true)}
              className="btn-dark-secondary font-bold text-xs px-3.5 py-2 rounded-xl transition flex items-center gap-1.5"
            >
              <Eye className="w-3.5 h-3.5 text-[#087F70] dark:text-[#FFAA35]" />
              <span>Open &amp; View Asset ↗</span>
            </button>
          )}

          <a
            href="/reviews"
            className="btn-gradient-warm text-white dark:text-[#111111] text-xs font-bold px-4 py-2 rounded-xl shadow-warmGlow transition whitespace-nowrap flex items-center gap-1.5"
          >
            <span>Reviewer Queue</span>
            <ArrowRight className="w-3.5 h-3.5 text-white dark:text-[#111111]" />
          </a>
        </div>
      </div>

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

      {/* Reviewer Department Feedback & Designer Change Request Box with Resolution Tracking */}
      {selectedContentId && (
        <DesignerFeedbackComments
          submissionId={selectedContentId}
          submissionTitle={activeSub?.title}
          contentType={activeSub?.content_type}
          description={activeSub?.description}
          rawText={activeSub?.raw_text}
          fileName={activeSub?.file_name}
          mediaUrl={activeSub?.media_url}
          submission={activeSub}
        />
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
    <Suspense fallback={<div className="text-ink-muted p-8 text-xs">Loading audit dashboard...</div>}>
      <AuditsContent />
    </Suspense>
  );
}
