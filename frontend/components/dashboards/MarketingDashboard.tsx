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
  Upload,
  RefreshCw,
  Layers,
  FileCheck,
  RotateCcw,
  X,
  Clock,
} from "lucide-react";
import { DesignerFeedbackComments } from "@/components/reviews/DesignerFeedbackComments";
import { DesignAssetViewerModal } from "@/components/reviews/DesignAssetViewerModal";

interface MarketingDashboardProps {
  submissions: ContentSubmission[];
  onRefresh: () => void;
}

const PUBLICATION_CHANNELS = [
  "Social Media Campaign",
  "Blog & Editorial",
  "Product Press Release",
  "Display & Search Ad",
  "Website Landing Copy",
  "Technical Documentation",
];

export function MarketingDashboard({ submissions, onRefresh }: MarketingDashboardProps) {
  const { activeOrgName } = useAuth();
  const [quickTitle, setQuickTitle] = useState("");
  const [quickText, setQuickText] = useState("");
  const [selectedChannel, setSelectedChannel] = useState(PUBLICATION_CHANNELS[0]);
  const [inputMode, setInputMode] = useState<"text" | "upload">("text");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const [liveAuditResult, setLiveAuditResult] = useState<AuditResult | null>(null);

  // Revision modal state
  const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false);
  const [revisingSub, setRevisingSub] = useState<ContentSubmission | null>(null);
  const [revisedText, setRevisedText] = useState("");
  const [isSubmittingRevision, setIsSubmittingRevision] = useState(false);

  // Selected submission for marketing suggestions & comments
  const [selectedMarketingSub, setSelectedMarketingSub] = useState<ContentSubmission | null>(null);
  const [selectedSubAudit, setSelectedSubAudit] = useState<AuditResult | null>(null);
  const [isLoadingSubAudit, setIsLoadingSubAudit] = useState(false);

  // Asset Viewer Modal state
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [viewingSub, setViewingSub] = useState<ContentSubmission | null>(null);

  useEffect(() => {
    if (!selectedMarketingSub && submissions.length > 0) {
      setSelectedMarketingSub(submissions[0]);
    }
  }, [submissions.length]);

  useEffect(() => {
    async function loadSelectedAudit() {
      if (!selectedMarketingSub) return;
      setIsLoadingSubAudit(true);
      try {
        const res = await api.getAudit(selectedMarketingSub.id);
        setSelectedSubAudit(res);
      } catch (e) {
        setSelectedSubAudit(null);
      } finally {
        setIsLoadingSubAudit(false);
      }
    }
    loadSelectedAudit();
  }, [selectedMarketingSub?.id]);

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
    if (!quickTitle) return;
    if (inputMode === "text" && !quickText) return;
    if (inputMode === "upload" && !selectedFile && !quickText) return;

    setIsAuditing(true);
    setLiveAuditResult(null);
    try {
      let submissionText = quickText;
      let fileName = selectedFile?.name;

      if (inputMode === "upload" && selectedFile) {
        try {
          submissionText = await selectedFile.text();
        } catch {
          submissionText = `Document upload: ${selectedFile.name} (${selectedFile.size} bytes)`;
        }
      }

      const sub = await api.createSubmission({
        title: quickTitle,
        description: `Channel: ${selectedChannel} | Source: ${inputMode === "upload" ? "Document Upload" : "Direct Draft"}`,
        content_type: inputMode === "upload" && selectedFile?.name.match(/\.(pdf|docx?)$/i) ? "document" : "text",
        initial_text: submissionText,
        file_name: fileName,
      });

      const audit = await api.triggerAudit(sub.id, sub.current_revision_id);
      setLiveAuditResult(audit);
      setSelectedMarketingSub(sub);
      setSelectedSubAudit(audit);
      setQuickTitle("");
      setQuickText("");
      setSelectedFile(null);
      onRefresh();
    } catch (err: any) {
      alert(err.message || "Audit submission failed");
    } finally {
      setIsAuditing(false);
    }
  };

  const handleOpenRevision = (sub: ContentSubmission) => {
    setRevisingSub(sub);
    setRevisedText(sub.raw_text || "");
    setIsRevisionModalOpen(true);
  };

  const handleSubmitRevision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revisingSub || !revisedText.trim()) return;
    setIsSubmittingRevision(true);
    try {
      await api.createRevision(revisingSub.id, { raw_text: revisedText.trim() });
      const newAudit = await api.triggerAudit(revisingSub.id);
      setSelectedSubAudit(newAudit);
      setIsRevisionModalOpen(false);
      onRefresh();
    } catch (err: any) {
      alert(err.message || "Failed to submit draft revision");
    } finally {
      setIsSubmittingRevision(false);
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
            Create and verify multi-channel campaign drafts against approved brand rules, statutory legal claim citations, and anti-FUD tone standards before publication.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <a
            href="/content"
            className="px-4 py-2.5 bg-teal hover:bg-teal-hover text-white text-xs font-bold rounded-xl shadow-subtle transition flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Full Ingestion Studio</span>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-navy mb-1.5">Target Publication Channel *</label>
                <select
                  value={selectedChannel}
                  onChange={(e) => setSelectedChannel(e.target.value)}
                  className="w-full bg-workspace border border-border rounded-xl px-3 py-2 text-xs text-navy focus:outline-none focus:border-teal font-medium"
                >
                  {PUBLICATION_CHANNELS.map((ch) => (
                    <option key={ch} value={ch}>
                      {ch}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-navy mb-1.5">Campaign Title *</label>
                <input
                  type="text"
                  required
                  value={quickTitle}
                  onChange={(e) => setQuickTitle(e.target.value)}
                  placeholder="e.g. Q4 Global Cloud Release"
                  className="w-full bg-workspace border border-border rounded-xl px-3 py-2 text-xs text-navy placeholder:text-ink-muted focus:outline-none focus:border-teal"
                />
              </div>
            </div>

            {/* Input Mode Selector */}
            <div className="flex items-center gap-2 border-b border-border pb-2">
              <button
                type="button"
                onClick={() => setInputMode("text")}
                className={`text-xs px-3 py-1 rounded-lg font-bold transition flex items-center gap-1.5 ${
                  inputMode === "text"
                    ? "bg-navy text-white shadow-xs"
                    : "bg-workspace hover:bg-slate-200 text-ink-secondary border border-border"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Text Editor</span>
              </button>
              <button
                type="button"
                onClick={() => setInputMode("upload")}
                className={`text-xs px-3 py-1 rounded-lg font-bold transition flex items-center gap-1.5 ${
                  inputMode === "upload"
                    ? "bg-navy text-white shadow-xs"
                    : "bg-workspace hover:bg-slate-200 text-ink-secondary border border-border"
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Document Upload (PDF / DOCX / TXT)</span>
              </button>
            </div>

            {inputMode === "text" ? (
              <div>
                <label className="block text-xs font-semibold text-navy mb-1.5">Marketing Copy / Text *</label>
                <textarea
                  required={inputMode === "text"}
                  rows={5}
                  value={quickText}
                  onChange={(e) => setQuickText(e.target.value)}
                  placeholder="Paste marketing copy here (try typing deprecated terms or absolute latency claims)..."
                  className="w-full bg-workspace border border-border rounded-xl p-3.5 text-xs text-navy placeholder:text-ink-muted focus:outline-none focus:border-teal font-mono leading-relaxed"
                />
              </div>
            ) : (
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-navy">Upload Campaign Document *</label>
                <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-teal transition cursor-pointer bg-workspace/50">
                  <input
                    type="file"
                    accept=".pdf,.docx,.doc,.txt,.md"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setSelectedFile(e.target.files[0]);
                        if (!quickTitle) {
                          setQuickTitle(e.target.files[0].name.replace(/\.[^/.]+$/, ""));
                        }
                      }
                    }}
                    className="hidden"
                    id="doc-upload"
                  />
                  <label htmlFor="doc-upload" className="cursor-pointer space-y-2 block">
                    <Upload className="w-8 h-8 text-teal mx-auto" />
                    <div className="text-xs font-semibold text-navy">
                      {selectedFile ? selectedFile.name : "Click to select or drag document file"}
                    </div>
                    <p className="text-[11px] text-ink-muted">Supports PDF, DOCX, Word, Text, and Markdown (Max 25MB)</p>
                  </label>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setQuickTitle("HyperScale Edge Announcement 2026");
                  setInputMode("text");
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
                disabled={isAuditing || (!quickText && !selectedFile)}
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
                const requiresChanges = sub.status === "changes_requested";
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
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="text-sm font-bold text-navy flex items-center gap-2">
                        <span className="truncate">{sub.title}</span>
                        <span className="text-[10px] text-ink-muted uppercase px-1.5 py-0.5 rounded bg-workspace border border-border shrink-0 font-medium">
                          {sub.content_type}
                        </span>
                      </div>
                      <div className="text-xs text-ink-secondary truncate">{sub.description}</div>
                      {requiresChanges && (
                        <div className="text-[10px] text-status-warning font-semibold flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 shrink-0" />
                          <span>Reviewer requested edits before approval</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`text-[11px] px-2.5 py-1 rounded-full font-bold border capitalize ${getStatusBadge(
                          sub.status
                        )}`}
                      >
                        {sub.status.replace("_", " ")}
                      </span>
                      {requiresChanges && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenRevision(sub);
                          }}
                          className="text-xs px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-bold transition flex items-center gap-1 shadow-subtle"
                          title="Revise draft text and resubmit for review"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Revise</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setViewingSub(sub);
                          setIsViewerOpen(true);
                        }}
                        className="text-xs px-2.5 py-1 bg-teal hover:bg-teal-hover text-white rounded-lg font-semibold transition flex items-center gap-1 shadow-subtle"
                        title="Open and view draft copy or asset"
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

      {/* Selected Draft Inspection & Reviewer Feedback Panel */}
      {selectedMarketingSub && (
        <div className="bg-surface border border-border rounded-2xl p-6 shadow-subtle space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal">
                Submission Detail & Compliance State
              </span>
              <h3 className="text-base font-bold text-navy mt-0.5">{selectedMarketingSub.title}</h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleOpenRevision(selectedMarketingSub)}
                className="px-3 py-1.5 bg-navy hover:bg-navy-dark text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
              >
                <RotateCcw className="w-3.5 h-3.5 text-teal-light" />
                <span>Revise Draft & Resubmit</span>
              </button>
              <a
                href={`/audits?id=${selectedMarketingSub.id}`}
                className="px-3 py-1.5 bg-teal/10 hover:bg-teal/20 text-teal border border-teal/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <span>Full Audit Breakdown ↗</span>
              </a>
            </div>
          </div>

          {/* Audit findings summary if available */}
          {selectedSubAudit && (
            <div className="p-4 rounded-xl bg-workspace border border-border space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-navy">
                  AI Compliance Score: <strong className="text-teal">{selectedSubAudit.summary.compliance_score}/100</strong>
                </span>
                <span className="text-xs text-ink-muted">
                  {selectedSubAudit.findings.length} findings identified
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {selectedSubAudit.findings.slice(0, 4).map((f) => (
                  <div key={f.id} className="p-3 bg-surface rounded-lg border border-border text-xs space-y-1">
                    <div className="font-bold text-navy flex items-center justify-between">
                      <span>{f.title}</span>
                      <span className={`text-[9.5px] px-1.5 py-0.2 rounded font-semibold uppercase ${
                        f.severity === "high" || f.severity === "critical"
                          ? "bg-rose-50 text-rose-700 border border-rose-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}>
                        {f.severity}
                      </span>
                    </div>
                    <p className="text-ink-secondary leading-relaxed">{f.message}</p>
                    {f.suggested_correction && (
                      <div className="text-status-success font-medium text-[10.5px]">
                        Suggested: &quot;{f.suggested_correction.replacement_text}&quot;
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reviewer Comments & Feedback Resolution Component */}
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
        </div>
      )}

      {/* Revise Draft Modal */}
      {isRevisionModalOpen && revisingSub && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl max-w-2xl w-full p-6 shadow-xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="text-base font-bold text-navy flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-teal" />
                  <span>Revise & Resubmit Draft</span>
                </h3>
                <p className="text-xs text-ink-muted mt-0.5">{revisingSub.title}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsRevisionModalOpen(false)}
                className="text-ink-muted hover:text-navy text-sm p-1 leading-none"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitRevision} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-navy mb-1.5">
                  Updated Draft Copy (Make required corrections) *
                </label>
                <textarea
                  required
                  rows={8}
                  value={revisedText}
                  onChange={(e) => setRevisedText(e.target.value)}
                  className="w-full bg-workspace border border-border rounded-xl p-3.5 text-xs text-navy font-mono leading-relaxed focus:outline-none focus:border-teal"
                  placeholder="Update your draft text to resolve compliance comments..."
                />
              </div>

              <div className="p-3 bg-teal/10 border border-teal/20 rounded-xl text-xs text-teal leading-relaxed">
                <span className="font-bold">Automated Re-Audit:</span> Submitting this revision will increment the revision version, immediately trigger a re-audit against brand rules, and notify the reviewer.
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsRevisionModalOpen(false)}
                  className="flex-1 py-2.5 bg-workspace hover:bg-slate-200 text-ink-secondary rounded-xl text-xs font-bold transition border border-border"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingRevision || !revisedText.trim()}
                  className="flex-1 py-2.5 bg-teal hover:bg-teal-hover text-white rounded-xl text-xs font-bold shadow-subtle transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {isSubmittingRevision ? (
                    <span>Submitting Revision...</span>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Submit Revision for Review</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
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
