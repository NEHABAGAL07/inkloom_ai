"use client";

import React, { useState, useEffect } from "react";
import { ContentSubmission, AuditResult } from "@/types";
import { api } from "@/services/api";
import { useAuth } from "@/services/auth-context";
import {
  Megaphone,
  Zap,
  FileText,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Send,
  Eye,
} from "lucide-react";
import { DesignerFeedbackComments } from "@/components/reviews/DesignerFeedbackComments";
import { DesignAssetViewerModal } from "@/components/reviews/DesignAssetViewerModal";

interface MarketingDashboardProps {
  submissions: ContentSubmission[];
  onRefresh: () => void;
}

export function MarketingDashboard({ submissions, onRefresh }: MarketingDashboardProps) {
  const { activeOrgName } = useAuth();
  const [quickTitle, setQuickTitle] = useState("");
  const [quickText, setQuickText] = useState("");
  const [isAuditing, setIsAuditing] = useState(false);
  const [liveAuditResult, setLiveAuditResult] = useState<AuditResult | null>(null);

  // Selected submission for marketing suggestions & comments
  const [selectedMarketingSub, setSelectedMarketingSub] = useState<ContentSubmission | null>(null);

  // Asset Viewer Modal state
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [viewingSub, setViewingSub] = useState<ContentSubmission | null>(null);

  useEffect(() => {
    if (!selectedMarketingSub && submissions.length > 0) {
      setSelectedMarketingSub(submissions[0]);
    }
  }, [submissions.length]);

  useEffect(() => {
    const handleAssetUpdate = () => {
      onRefresh();
    };
    if (typeof window !== "undefined") {
      window.addEventListener("inkloom_asset_updated", handleAssetUpdate);
      return () => window.removeEventListener("inkloom_asset_updated", handleAssetUpdate);
    }
  }, [onRefresh]);

  const handleQuickSubmitAndAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle || !quickText) return;
    setIsAuditing(true);
    setLiveAuditResult(null);
    try {
      const sub = await api.createSubmission({
        title: quickTitle,
        description: "Direct Marketing Campaign draft",
        content_type: "text",
        initial_text: quickText,
      });

      const audit = await api.triggerAudit(sub.id, sub.current_revision_id);
      setLiveAuditResult(audit);
      onRefresh();
    } catch (err: any) {
      alert(err.message || "Audit submission failed");
    } finally {
      setIsAuditing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-emerald-50 text-status-success border-emerald-200";
      case "pending_approval":
        return "bg-blue-50 text-status-info border-blue-200";
      case "changes_requested":
        return "bg-amber-50 text-status-warning border-amber-200";
      case "rejected":
        return "bg-red-50 text-status-error border-red-200";
      default:
        return "bg-slate-100 text-ink-secondary border-border";
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Enterprise Page Header */}
      <div className="bg-surface rounded-2xl p-6 sm:p-8 border border-border shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-3xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal/10 border border-teal/20 text-teal text-xs font-semibold">
            <Megaphone className="w-3.5 h-3.5" />
            <span>Marketing Campaign & Copy Governance</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy tracking-tight">
            {activeOrgName || "Enterprise"} Campaign Governance
          </h1>
          <p className="text-ink-secondary text-sm leading-relaxed">
            Create high-converting copy with real-time brand governance audits. Pre-flight check campaign copy against approved terminology, benchmark verification, and tone standards.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <a
            href="/content"
            className="px-4 py-2.5 bg-teal hover:bg-teal-hover text-white text-xs font-bold rounded-xl shadow-subtle transition flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Open Submission Studio</span>
          </a>
          <a
            href="/audits"
            className="px-4 py-2.5 bg-workspace hover:bg-slate-200 text-ink-primary border border-border text-xs font-bold rounded-xl transition"
          >
            Audit Explorer
          </a>
        </div>
      </div>

      {/* Main Grid: Pre-Flight Tester & Active Submissions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Quick Interactive Copy Tester & AI Pre-Flight Audit */}
        <div className="lg:col-span-6 bg-surface border border-border rounded-2xl p-6 shadow-subtle space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <h2 className="text-sm font-bold text-navy flex items-center gap-2">
              <Zap className="w-4 h-4 text-teal" />
              <span>Live Campaign Copy & Pre-Flight Audit</span>
            </h2>
            <span className="text-[11px] text-teal font-semibold bg-teal/10 border border-teal/20 px-2.5 py-0.5 rounded-full">
              Deterministic Rules
            </span>
          </div>

          <form onSubmit={handleQuickSubmitAndAudit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-navy mb-1.5">Campaign Title *</label>
              <input
                type="text"
                required
                value={quickTitle}
                onChange={(e) => setQuickTitle(e.target.value)}
                placeholder="e.g. Q4 Global Product Announcement"
                className="w-full bg-workspace border border-border rounded-xl px-3.5 py-2.5 text-sm text-navy placeholder:text-ink-muted focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-navy mb-1.5">Marketing Copy / Text *</label>
              <textarea
                required
                rows={5}
                value={quickText}
                onChange={(e) => setQuickText(e.target.value)}
                placeholder="Paste marketing copy here (try typing deprecated terms or absolute latency claims)..."
                className="w-full bg-workspace border border-border rounded-xl p-3.5 text-xs text-navy placeholder:text-ink-muted focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal font-mono leading-relaxed"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setQuickTitle("HyperScale Edge Announcement 2026");
                  setQuickText(
                    "Get started with the powerful CloudSpeed Suite today.\nOur newest release lets organizations experience a guaranteed 10x reduction in latency across all regions.\nHurry up before your competitors crush you and steal your market share."
                  );
                }}
                className="px-3 py-2 bg-workspace hover:bg-slate-200 text-ink-secondary rounded-xl text-xs font-semibold border border-border transition text-center"
              >
                Insert Sample with Violations
              </button>

              <button
                type="submit"
                disabled={isAuditing || !quickTitle || !quickText}
                className="flex-1 py-2.5 bg-teal hover:bg-teal-hover disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-subtle transition flex items-center justify-center gap-1.5"
              >
                {isAuditing ? (
                  <>
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin"></span>
                    <span>Auditing with AI Engine...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Run Pre-Flight AI Audit</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Live Findings Display */}
          {liveAuditResult && (
            <div className="mt-4 p-4 rounded-xl bg-workspace border border-border space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-border pb-2.5">
                <span className="text-xs font-bold text-navy flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-status-success" />
                  Pre-Flight Audit Complete
                </span>
                <span className="text-xs font-bold text-teal">
                  Compliance Score: {liveAuditResult.summary.compliance_score}/100
                </span>
              </div>
              <div className="space-y-2">
                {liveAuditResult.findings.map((f) => (
                  <div
                    key={f.id}
                    className="text-xs p-3 rounded-lg bg-surface border border-border space-y-1.5 shadow-subtle"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-navy">{f.title}</span>
                      <span className="text-[10px] text-ink-muted uppercase font-semibold px-1.5 py-0.5 rounded bg-workspace border border-border">
                        {f.category}
                      </span>
                    </div>
                    <div className="text-ink-secondary leading-relaxed">{f.message}</div>
                    {f.suggested_correction && (
                      <div className="text-status-success font-medium text-[11px] pt-1">
                        💡 Suggestion: &quot;{f.suggested_correction.replacement_text}&quot;
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Campaign Submissions Tracker */}
        <div className="lg:col-span-6 bg-surface border border-border rounded-2xl p-6 shadow-subtle space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <h2 className="text-sm font-bold text-navy flex items-center gap-2">
              <FileText className="w-4 h-4 text-teal" />
              <span>Active Campaign Submissions</span>
            </h2>
            <a href="/content" className="text-xs text-teal font-semibold hover:text-teal-hover flex items-center gap-1">
              View All <ArrowRight className="w-3 h-3" />
            </a>
          </div>

          <div className="divide-y divide-border">
            {submissions.length > 0 ? (
              submissions.map((sub) => {
                const isSelected = selectedMarketingSub?.id === sub.id;
                return (
                  <div
                    key={sub.id}
                    onClick={() => setSelectedMarketingSub(sub)}
                    className={`py-3.5 flex items-center justify-between px-3 rounded-xl transition-all gap-3 cursor-pointer ${
                      isSelected
                        ? "bg-teal/5 border border-teal/40 dark:bg-teal-950/20 shadow-sm"
                        : "hover:bg-workspace border border-transparent"
                    }`}
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="text-sm font-bold text-navy flex items-center gap-2">
                        <span className="truncate">{sub.title}</span>
                        <span className="text-[10px] text-ink-muted uppercase px-1.5 py-0.5 rounded bg-workspace border border-border shrink-0 font-medium">
                          {sub.content_type}
                        </span>
                      </div>
                      <div className="text-xs text-ink-secondary truncate">{sub.description}</div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`text-[11px] px-2.5 py-1 rounded-full font-bold border capitalize ${getStatusBadge(
                          sub.status
                        )}`}
                      >
                        {sub.status.replace("_", " ")}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setViewingSub(sub);
                          setIsViewerOpen(true);
                        }}
                        className="text-xs px-2.5 py-1 bg-teal hover:bg-teal-hover text-white rounded-lg font-semibold transition flex items-center gap-1 shadow-subtle"
                        title="Open and view design asset or document"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Open</span>
                      </button>
                      <a
                        href={`/audits?id=${sub.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs px-2.5 py-1 bg-workspace hover:bg-slate-200 text-ink-primary rounded-lg border border-border transition flex items-center gap-1"
                      >
                        <span>Audit</span>
                      </a>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-16 text-center text-ink-muted text-xs">
                No active campaign submissions found. Submit copy above to begin governance checks.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Suggestion / Improvement Box under Designer's Content for Marketing Department */}
      {selectedMarketingSub && (
        <DesignerFeedbackComments
          submissionId={selectedMarketingSub.id}
          submissionTitle={selectedMarketingSub.title}
          contentType={selectedMarketingSub.content_type}
          description={selectedMarketingSub.description}
          rawText={selectedMarketingSub.raw_text}
          fileName={selectedMarketingSub.file_name}
          mediaUrl={selectedMarketingSub.media_url}
          submission={selectedMarketingSub}
        />
      )}

      {/* Design Asset Viewer Modal */}
      <DesignAssetViewerModal
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
        submission={viewingSub}
        canAuthorize={false}
      />
    </div>
  );
}
