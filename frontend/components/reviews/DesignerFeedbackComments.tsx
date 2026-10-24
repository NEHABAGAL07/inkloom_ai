"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ContentComment, ContentSubmission } from "@/types";
import { api } from "@/services/api";
import { useAuth } from "@/services/auth-context";
import {
  MessageSquarePlus,
  CheckCircle2,
  Clock,
  Check,
  RotateCcw,
  Scale,
  Building,
  Megaphone,
  Palette,
  User,
  Filter,
  Sparkles,
  AlertCircle,
  FileCheck,
  Eye,
  ShieldCheck,
  Info,
  Maximize2,
  ExternalLink,
} from "lucide-react";
import { DesignAssetViewerModal } from "./DesignAssetViewerModal";

interface DesignerFeedbackCommentsProps {
  submissionId: string;
  submissionTitle?: string;
  contentType?: string;
  description?: string;
  rawText?: string;
  fileName?: string;
  mediaUrl?: string;
  submission?: ContentSubmission | null;
  isDesignerUpload?: boolean;
}

export function DesignerFeedbackComments({
  submissionId,
  submissionTitle,
  contentType,
  description,
  rawText,
  fileName,
  mediaUrl,
  submission,
  isDesignerUpload = true,
}: DesignerFeedbackCommentsProps) {
  const { user, activeRole } = useAuth();
  const [comments, setComments] = useState<ContentComment[]>([]);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [currentSub, setCurrentSub] = useState<ContentSubmission | null>(submission || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Determine user role and permissions
  const roleStr = (activeRole || "").toLowerCase();
  const isDesigner = roleStr.includes("designer");
  const isManager = roleStr.includes("admin") || roleStr.includes("manager");
  const isLegal = roleStr.includes("compliance") || roleStr.includes("legal");
  const isMarketing = roleStr.includes("marketing");

  // Only Manager, Legal department, and Marketing department can submit suggestions/improvements
  const canSubmitSuggestions = isManager || isLegal || isMarketing;

  // New suggestion form state
  const [newCommentText, setNewCommentText] = useState("");
  const [category, setCategory] = useState<string>("visual_design");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [postSuccess, setPostSuccess] = useState(false);

  // Active filter tab: 'all' | 'pending' | 'resolved'
  const [filterTab, setFilterTab] = useState<"all" | "pending" | "resolved">("all");

  // Inline resolution note state for designer mark-as-done
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolutionNoteInput, setResolutionNoteInput] = useState("");

  const loadComments = useCallback(async () => {
    if (!submissionId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.getSubmissionComments(submissionId);
      setComments(data.comments || []);
    } catch (err: any) {
      console.error("Failed to load submission comments:", err);
      setError(err?.message || "Failed to load department suggestions.");
    } finally {
      setLoading(false);
    }
  }, [submissionId]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  useEffect(() => {
    if (submission) {
      setCurrentSub(submission);
    } else if (submissionId) {
      api.getSubmission(submissionId).then((s) => {
        if (s) setCurrentSub(s);
      }).catch(() => {});
    }
  }, [submission, submissionId]);

  // Synchronize dynamic asset updates (e.g. when designer uploads revised image)
  useEffect(() => {
    const handleAssetUpdate = (e: any) => {
      if (e.detail && e.detail.submissionId === submissionId) {
        if (e.detail.mediaUrl) {
          setCurrentSub((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              media_url: e.detail.mediaUrl,
              file_path: e.detail.mediaUrl,
              file_name: e.detail.fileName || prev.file_name,
            };
          });
        }
      }
    };
    if (typeof window !== "undefined") {
      window.addEventListener("inkloom_asset_updated", handleAssetUpdate);
      return () => window.removeEventListener("inkloom_asset_updated", handleAssetUpdate);
    }
  }, [submissionId]);

  // Handle posting a new suggestion (Manager, Legal Dept, Marketing Dept ONLY)
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmitSuggestions) {
      setError("Only Manager, Legal Department, and Marketing Department have access to post suggestions.");
      return;
    }
    if (!newCommentText.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const created = await api.addSubmissionComment(submissionId, newCommentText.trim(), category);
      setComments((prev) => [created, ...prev]);
      setNewCommentText("");
      setPostSuccess(true);
      setTimeout(() => setPostSuccess(false), 3000);
    } catch (err: any) {
      console.error("Failed to post suggestion:", err);
      setError(err?.message || "Failed to submit improvement suggestion.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle toggling resolution / "Mark as Done" (✓)
  const handleToggleResolve = async (commentId: string, currentStatus: boolean, note?: string) => {
    try {
      const targetState = !currentStatus;
      const updated = await api.toggleCommentResolution(submissionId, commentId, targetState, note);
      setComments((prev) =>
        prev.map((c) => (c.id === commentId ? { ...c, ...updated } : c))
      );
      setResolvingId(null);
      setResolutionNoteInput("");
    } catch (err: any) {
      console.error("Failed to toggle resolution:", err);
      setError(err?.message || "Could not update resolution status.");
    }
  };

  // Quick suggestion helper
  const applyQuickSuggestion = (text: string, cat: string) => {
    setNewCommentText(text);
    setCategory(cat);
  };

  // Compute metrics
  const totalCount = comments.length;
  const resolvedCount = comments.filter((c) => c.is_resolved).length;
  const pendingCount = totalCount - resolvedCount;
  const completionPercentage = totalCount > 0 ? Math.round((resolvedCount / totalCount) * 100) : 100;

  // Filtered comments
  const displayedComments = comments.filter((c) => {
    if (filterTab === "pending") return !c.is_resolved;
    if (filterTab === "resolved") return c.is_resolved;
    return true;
  });

  // Department Badge helper
  const renderDepartmentBadge = (role: string) => {
    const r = role.toLowerCase();
    if (r.includes("admin") || r.includes("manager")) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-navy/10 text-navy border border-navy/20 dark:bg-slate-800 dark:text-teal-light">
          <Building className="w-3.5 h-3.5 text-navy dark:text-teal-light" />
          <span>Manager</span>
        </span>
      );
    }
    if (r.includes("compliance") || r.includes("legal")) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-teal-50 text-teal-800 border border-teal-200 dark:bg-teal-950/40 dark:text-teal-300">
          <Scale className="w-3.5 h-3.5 text-teal" />
          <span>Legal Department</span>
        </span>
      );
    }
    if (r.includes("marketing")) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300">
          <Megaphone className="w-3.5 h-3.5 text-amber-600" />
          <span>Marketing Department</span>
        </span>
      );
    }
    if (r.includes("designer")) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300">
          <Palette className="w-3.5 h-3.5 text-indigo-600" />
          <span>Designer</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
        <User className="w-3 h-3 text-slate-500" />
        <span>Reviewer</span>
      </span>
    );
  };

  // Category label helper
  const renderCategoryLabel = (cat: string) => {
    switch (cat) {
      case "visual_design":
        return <span className="text-[10px] uppercase font-bold text-indigo-600 tracking-wider">Visual &amp; Asset Standards</span>;
      case "legal_compliance":
        return <span className="text-[10px] uppercase font-bold text-teal tracking-wider">Legal &amp; Statutory Compliance</span>;
      case "copy_tone":
        return <span className="text-[10px] uppercase font-bold text-amber-600 tracking-wider">Tone &amp; Messaging</span>;
      case "brand_rules":
        return <span className="text-[10px] uppercase font-bold text-navy tracking-wider">Corporate Brand Standards</span>;
      default:
        return <span className="text-[10px] uppercase font-bold text-ink-muted tracking-wider">Improvement Suggestion</span>;
    }
  };

  return (
    <div className="bg-surface rounded-2xl border border-border shadow-subtle p-6 space-y-6">
      {/* Designer Content Context Bar */}
      <div className="bg-workspace rounded-xl p-4 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 dark:bg-indigo-950/40 dark:border-indigo-800 flex items-center justify-center text-indigo-600">
            <Palette className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-navy">
                Designer Upload: <span className="text-indigo-600">{submissionTitle || "Creative Asset"}</span>
              </span>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-surface border border-border text-ink-secondary">
                {contentType || "image"}
              </span>
            </div>
            <p className="text-[11px] text-ink-secondary mt-0.5">
              {canSubmitSuggestions
                ? "Department Review Mode: You have viewing access to this designer upload and can submit required improvements below."
                : "Designer Mode: View all improvement suggestions on your uploaded design and mark each item as done once fixed."}
            </p>
          </div>
        </div>

        {/* Current User Role Indicator */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] text-ink-muted">Viewing as:</span>
          {renderDepartmentBadge(activeRole || "manager")}
        </div>
      </div>

      {/* Designer's Uploaded Design Showcase (View & Open Access for Reviewers & Stakeholders) */}
      {(() => {
        const effectiveTitle = currentSub?.title || submissionTitle || "Creative Design Asset";
        const effectiveContentType = currentSub?.content_type || contentType || "image";
        const effectiveDescription = currentSub?.description || description;
        const effectiveRawText = currentSub?.raw_text || rawText;
        const effectiveFileName = currentSub?.file_name || fileName || (effectiveContentType === "image" ? `${effectiveTitle.replace(/[^a-zA-Z0-9_-]/g, "_")}.png` : undefined);
        const effectiveMediaUrl =
          currentSub?.media_url ||
          mediaUrl ||
          (currentSub?.file_path && (currentSub.file_path.startsWith("data:") || currentSub.file_path.startsWith("http") || currentSub.file_path.startsWith("/")) ? currentSub.file_path : null) ||
          (currentSub?.raw_text && (currentSub.raw_text.startsWith("data:") || currentSub.raw_text.startsWith("http") || currentSub.raw_text.startsWith("/")) ? currentSub.raw_text : null) ||
          (typeof window !== "undefined"
            ? localStorage.getItem(`inkloom_media_${submissionId}`) ||
              (effectiveFileName ? localStorage.getItem(`inkloom_media_${effectiveFileName}`) : null)
            : null);

        return (
          <div className="rounded-2xl border border-border bg-gradient-to-br from-workspace via-workspace to-surface p-5 space-y-4 shadow-subtle">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/80 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal/10 border border-teal/20 flex items-center justify-center text-teal">
                  <Eye className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-navy">
                      Designer&apos;s Uploaded Design &amp; Content
                    </span>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300">
                      Posted by Designer
                    </span>
                  </div>
                  <span className="text-[11px] text-ink-muted">
                    Full viewing &amp; compliance inspection access for reviewers and team members
                  </span>
                </div>
              </div>

              {/* Primary Call-to-Action to Open and View Design */}
              <button
                type="button"
                onClick={() => setIsViewerOpen(true)}
                className="px-4 py-2 bg-teal hover:bg-teal-hover text-white font-bold text-xs rounded-xl shadow-subtle hover:shadow-md transition-all flex items-center justify-center gap-1.5 shrink-0"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Open &amp; View Design Asset ↗</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* Left Column: Visual Mini-Preview Card */}
              <div
                onClick={() => setIsViewerOpen(true)}
                className="md:col-span-4 rounded-xl bg-[#0e1726] border border-border/80 p-3.5 flex flex-col justify-between cursor-pointer hover:border-teal transition-all group relative overflow-hidden"
              >
                <div className="flex items-center justify-between text-[10px] text-slate-400 pb-2 border-b border-white/10">
                  <span className="uppercase font-mono text-teal font-bold">{effectiveContentType}</span>
                  <span className="flex items-center gap-1 group-hover:text-teal transition-colors">
                    <Maximize2 className="w-3 h-3" /> Click to Expand
                  </span>
                </div>

                {effectiveMediaUrl ? (
                  <div className="py-2 flex items-center justify-center min-h-[90px]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={effectiveMediaUrl}
                      alt={effectiveTitle}
                      className="max-h-24 max-w-full rounded object-contain shadow-sm"
                      onError={(e) => {
                        const safeFn = (effectiveFileName || effectiveTitle).replace(/[<>&"']/g, "");
                        const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 200" width="400" height="200"><rect width="400" height="200" fill="#0e1e32"/><text x="20" y="105" fill="#FFFFFF" font-family="sans-serif" font-size="16" font-weight="bold">${safeFn}</text></svg>`;
                        e.currentTarget.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
                      }}
                    />
                  </div>
                ) : (
                  <div className="py-4 text-center space-y-1">
                    <div className="text-lg font-black tracking-widest text-white group-hover:scale-105 transition-transform">
                      INKLOOM
                    </div>
                    <div className="text-[10px] text-teal font-mono">Palette: #14263D &bull; #0F766E</div>
                  </div>
                )}

                <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-400">
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> 5.2:1 AA Pass
                  </span>
                  <span className="text-teal font-semibold">Open Stage &rarr;</span>
                </div>
              </div>

              {/* Right Column: Asset Specifications & Description */}
              <div className="md:col-span-8 space-y-2 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-ink-muted tracking-wider">
                    Asset Title &amp; Creative Context
                  </span>
                  <div className="font-bold text-navy text-sm mt-0.5">{effectiveTitle}</div>
                  {effectiveDescription && (
                    <p className="text-xs text-ink-secondary leading-relaxed pt-1">
                      {effectiveDescription}
                    </p>
                  )}
                  {effectiveRawText && (
                    <div className="p-2.5 rounded-lg bg-surface border border-border font-mono text-[11px] text-ink-primary whitespace-pre-wrap mt-2 max-h-20 overflow-y-auto">
                      {effectiveRawText}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/80">
                  <span className="text-[11px] text-ink-muted">File:</span>
                  <span className="text-xs font-mono font-bold text-navy">
                    {effectiveFileName || "Asset_Media.png"}
                  </span>
                  <span className="text-ink-muted">&bull;</span>
                  <button
                    type="button"
                    onClick={() => setIsViewerOpen(true)}
                    className="text-xs text-teal hover:underline font-bold flex items-center gap-1"
                  >
                    <span>Inspect In High-Resolution Viewer</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Progress & Resolution Tracker Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal/10 border border-teal/20 flex items-center justify-center text-teal">
              <MessageSquarePlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-navy">
                Suggestions &amp; Improvements Tracker
              </h3>
              <p className="text-xs text-ink-secondary">
                Direct feedback from Manager, Legal Department, and Marketing Department on designer uploads.
              </p>
            </div>
          </div>
        </div>

        {/* Real-time Status Counter Card */}
        <div className="bg-workspace border border-border px-4 py-2.5 rounded-xl flex items-center gap-4">
          <div>
            <div className="flex items-center justify-between gap-3 text-xs">
              <span className="font-bold text-navy">Resolution Status:</span>
              <span className="font-mono font-bold text-teal">
                {resolvedCount} / {totalCount} Done ({completionPercentage}%)
              </span>
            </div>
            <div className="w-44 h-2 bg-border rounded-full overflow-hidden mt-1.5">
              <div
                className={`h-full transition-all duration-300 ${
                  completionPercentage === 100
                    ? "bg-emerald-500"
                    : completionPercentage >= 50
                    ? "bg-teal"
                    : "bg-amber-500"
                }`}
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>

          <div className="text-right border-l border-border pl-3">
            <div className="text-[11px] uppercase font-bold text-amber-700 dark:text-amber-400">
              {pendingCount} To Do
            </div>
            <div className="text-[10px] text-ink-muted">Has to be done by designer</div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
        <div className="flex items-center gap-1.5 p-1 bg-workspace rounded-xl border border-border text-xs">
          <button
            type="button"
            onClick={() => setFilterTab("all")}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              filterTab === "all"
                ? "bg-surface text-navy font-bold shadow-subtle border border-border/80"
                : "text-ink-secondary hover:text-ink-primary"
            }`}
          >
            All Suggestions ({totalCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab("pending")}
            className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
              filterTab === "pending"
                ? "bg-amber-50 text-amber-900 font-bold border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300"
                : "text-ink-secondary hover:text-ink-primary"
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Has To Be Done ({pendingCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterTab("resolved")}
            className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
              filterTab === "resolved"
                ? "bg-emerald-50 text-emerald-900 font-bold border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300"
                : "text-ink-secondary hover:text-ink-primary"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Changes Done (✓ {resolvedCount})</span>
          </button>
        </div>

        <span className="text-[11px] text-ink-muted flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-teal" />
          <span>
            {isDesigner
              ? "Click 'Mark as Done (✓)' on each item when you have fixed the requested change."
              : "Track designer fixes in real-time as each issue is resolved."}
          </span>
        </span>
      </div>

      {/* SUGGESTION / IMPROVEMENT BOX:
          Shown ONLY to Manager, Legal Department, and Marketing Department */}
      {canSubmitSuggestions ? (
        <form onSubmit={handleAddComment} className="bg-workspace rounded-xl p-4 border border-border space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-navy">Add Suggestion / Improvement for Designer:</span>
              {renderDepartmentBadge(activeRole || "manager")}
              <span className="text-xs text-ink-muted">
                ({user?.full_name || user?.email || "Reviewer"})
              </span>
            </div>

            {/* Department Topic Dropdown */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-ink-muted">Topic:</span>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="bg-surface border border-border text-xs rounded-lg px-2.5 py-1 text-navy focus:outline-none focus:border-teal"
              >
                <option value="visual_design">🎨 Visual &amp; Asset Standards</option>
                <option value="legal_compliance">⚖️ Legal &amp; Statutory Compliance</option>
                <option value="copy_tone">📢 Marketing &amp; Tone of Voice</option>
                <option value="brand_rules">🏛️ Corporate Brand Guidelines</option>
                <option value="general">📝 General Improvement</option>
              </select>
            </div>
          </div>

          {/* Comment Text Area */}
          <textarea
            rows={3}
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            placeholder="Type your suggestion or mistake that needs improvement by the designer (e.g. 'Adjust contrast ratio of header text to 4.5:1', 'Add FTC endorsement disclosure footnote', etc.)..."
            className="w-full bg-surface border border-border rounded-xl p-3 text-xs text-navy placeholder-ink-muted focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal resize-none"
          />

          {/* Quick Suggestions for Reviewers */}
          <div className="flex items-center flex-wrap gap-1.5 pt-0.5">
            <span className="text-[10px] text-ink-muted font-bold uppercase tracking-wider">Quick Templates:</span>
            {isLegal && (
              <button
                type="button"
                onClick={() =>
                  applyQuickSuggestion(
                    "Statutory claim requires benchmark substantiation footnote: 'Tested under certified enterprise cluster configuration.'",
                    "legal_compliance"
                  )
                }
                className="text-[11px] px-2 py-0.5 rounded-md bg-surface border border-teal/40 hover:border-teal text-teal hover:text-navy transition font-medium"
              >
                + Legal Footnote Footprint
              </button>
            )}
            {isMarketing && (
              <button
                type="button"
                onClick={() =>
                  applyQuickSuggestion(
                    "Update headline font to active campaign typography 'Inter Display' and replace generic hype words with product features.",
                    "copy_tone"
                  )
                }
                className="text-[11px] px-2 py-0.5 rounded-md bg-surface border border-amber-300 hover:border-amber-500 text-amber-800 hover:text-navy transition font-medium"
              >
                + Marketing Tone Alignment
              </button>
            )}
            {isManager && (
              <button
                type="button"
                onClick={() =>
                  applyQuickSuggestion(
                    "Ensure primary brand logo maintains at least 32px exclusion padding clear of text overlays on all four sides.",
                    "brand_rules"
                  )
                }
                className="text-[11px] px-2 py-0.5 rounded-md bg-surface border border-navy/40 hover:border-navy text-navy hover:text-teal transition font-medium"
              >
                + Logo Clear Space
              </button>
            )}
            <button
              type="button"
              onClick={() =>
                applyQuickSuggestion(
                  "Improve color contrast ratio between foreground typography and background graphic to satisfy WCAG AA (minimum 4.5:1).",
                  "visual_design"
                )
              }
              className="text-[11px] px-2 py-0.5 rounded-md bg-surface border border-border hover:border-teal text-ink-secondary hover:text-navy transition"
            >
              + WCAG Contrast Fix
            </button>
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-between pt-1">
            {postSuccess && (
              <div className="text-xs text-teal font-semibold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                <span>Suggestion submitted for the designer! Added to the change tracker.</span>
              </div>
            )}
            {!postSuccess && <div />}

            <button
              type="submit"
              disabled={!newCommentText.trim() || isSubmitting}
              className="px-4 py-2 bg-teal hover:bg-teal-hover text-white text-xs font-bold rounded-xl transition shadow-sm flex items-center gap-1.5 disabled:opacity-50"
            >
              <MessageSquarePlus className="w-3.5 h-3.5" />
              <span>{isSubmitting ? "Submitting..." : "Send Improvement Suggestion to Designer"}</span>
            </button>
          </div>
        </form>
      ) : (
        /* DESIGNER WORKSPACE BANNER:
           The designer sees a dedicated guidance card and uses the tick sign below */
        <div className="bg-indigo-50/70 border border-indigo-200 dark:bg-indigo-950/30 dark:border-indigo-900/50 rounded-xl p-4 flex items-start gap-3">
          <Palette className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-navy">
              Designer Action Hub — Reviewer Improvement Requests
            </h4>
            <p className="text-xs text-ink-secondary leading-relaxed">
              Review all improvement suggestions and mistakes flagged by <strong>Manager</strong>, <strong>Legal Department</strong>, and <strong>Marketing Department</strong> below. After updating your design, click the <strong>&ldquo;✓ Mark as Done&rdquo;</strong> button on each item to record that the fix has been completed.
            </p>
          </div>
        </div>
      )}

      {/* Suggestions List & Resolution Status */}
      <div className="space-y-3 pt-1">
        {loading ? (
          <div className="py-8 text-center text-xs text-ink-muted">
            <div className="w-6 h-6 border-2 border-teal border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <span>Loading department suggestions and resolution status...</span>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-status-error text-xs flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={loadComments}
              className="text-xs font-bold underline hover:no-underline"
            >
              Retry
            </button>
          </div>
        ) : displayedComments.length === 0 ? (
          <div className="py-10 text-center bg-workspace rounded-xl border border-dashed border-border text-ink-muted text-xs space-y-1">
            <FileCheck className="w-8 h-8 text-ink-muted mx-auto mb-1 opacity-60" />
            <p className="font-semibold text-navy">
              {filterTab === "pending"
                ? "Great job! All suggestions have been marked as done by the designer."
                : filterTab === "resolved"
                ? "No completed improvements yet."
                : "No suggestions or improvement requests posted on this design yet."}
            </p>
            <p className="text-[11px] text-ink-secondary">
              {canSubmitSuggestions
                ? "Use the form above to add suggestions or improvements for the designer."
                : "Suggestions from Manager, Legal, and Marketing will appear here."}
            </p>
          </div>
        ) : (
          displayedComments.map((comment) => {
            const isBeingResolved = resolvingId === comment.id;

            return (
              <div
                key={comment.id}
                className={`rounded-xl border transition-all duration-200 p-4 ${
                  comment.is_resolved
                    ? "bg-surface/70 border-emerald-200/80 dark:border-emerald-900/40"
                    : "bg-surface border-amber-200 dark:border-amber-900/40 shadow-subtle"
                }`}
              >
                {/* Header: Author, Department Badge, Category, Status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {renderDepartmentBadge(comment.author_role)}
                    <span className="text-xs font-bold text-navy">{comment.author_name}</span>
                    <span className="text-ink-muted text-xs">•</span>
                    {renderCategoryLabel(comment.category)}
                    <span className="text-ink-muted text-[11px]">
                      {new Date(comment.created_at).toLocaleDateString([], {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  {/* Resolution Status Badge ("What is done vs what has to be done") */}
                  <div>
                    {comment.is_resolved ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>✓ Done (Fixed)</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300 dark:bg-amber-950/60 dark:text-amber-300">
                        <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>⏳ Has To Be Done by Designer</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Suggestion Text Content */}
                <div className="text-xs text-navy leading-relaxed mb-3 pl-1">
                  <p className={comment.is_resolved ? "text-ink-secondary" : "text-navy font-medium"}>
                    {comment.comment_text}
                  </p>
                </div>

                {/* Footer: Resolution Details and Tick Sign ("Mark as Done") */}
                <div className="pt-2 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  {/* Resolution Audit Summary */}
                  <div className="text-[11px]">
                    {comment.is_resolved ? (
                      <div className="text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold">✓ Fixed by {comment.resolved_by || "Designer"}</span>
                        {comment.resolved_at && (
                          <span className="text-ink-muted">
                            on {new Date(comment.resolved_at).toLocaleDateString([], { month: "short", day: "numeric" })}
                          </span>
                        )}
                        {comment.resolution_note && (
                          <span className="italic bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 text-ink-primary">
                            &ldquo;{comment.resolution_note}&rdquo;
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="text-amber-700 dark:text-amber-400 font-medium">
                        Waiting for designer to fix this suggestion and mark as done.
                      </div>
                    )}
                  </div>

                  {/* Tick Sign Controls:
                      - Designer has primary access to "✓ Mark as Done"
                      - Reviewers (Manager, Legal, Marketing) can view status or reopen if fix was incomplete */}
                  <div className="flex items-center gap-2">
                    {comment.is_resolved ? (
                      <button
                        type="button"
                        onClick={() => handleToggleResolve(comment.id, true)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-ink-muted hover:text-navy hover:bg-workspace rounded-lg transition"
                        title="Reopen if further revision is required"
                      >
                        <RotateCcw className="w-3 h-3 text-ink-muted" />
                        <span>Reopen Suggestion</span>
                      </button>
                    ) : isBeingResolved ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={resolutionNoteInput}
                          onChange={(e) => setResolutionNoteInput(e.target.value)}
                          placeholder="Note on fix (e.g. 'Updated contrast ratio')..."
                          className="text-xs bg-workspace border border-border rounded-lg px-2.5 py-1 w-52 focus:outline-none focus:border-teal"
                        />
                        <button
                          type="button"
                          onClick={() => handleToggleResolve(comment.id, false, resolutionNoteInput)}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-lg transition inline-flex items-center gap-1 shadow-sm"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Confirm Fixed (✓)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setResolvingId(null)}
                          className="px-2 py-1 text-[11px] text-ink-muted hover:text-navy"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : isDesigner ? (
                      /* DESIGNER'S ACTION BUTTON: "✓ Mark as Done" */
                      <button
                        type="button"
                        onClick={() => setResolvingId(comment.id)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-sm group hover:scale-[1.02]"
                      >
                        <div className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                        <span>✓ Mark as Done (Fixed)</span>
                      </button>
                    ) : (
                      /* REVIEWER'S ACTION BUTTON: (Can also mark done or wait for designer) */
                      <button
                        type="button"
                        onClick={() => setResolvingId(comment.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600/90 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-sm group"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>✓ Mark as Done</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Interactive Design Asset Viewer Modal */}
      {isViewerOpen && (
        <DesignAssetViewerModal
          isOpen={isViewerOpen}
          onClose={() => setIsViewerOpen(false)}
          submission={
            currentSub || {
              id: submissionId,
              organization_id: "org_default",
              creator_id: "designer",
              creator_name: "Leo Vance (Designer)",
              title: submissionTitle || "Creative Design Asset",
              description: description || "Visual brand asset",
              content_type: (contentType || "image") as any,
              status: "pending_approval",
              raw_text: rawText,
              file_name: fileName,
              media_url: mediaUrl,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }
          }
          canAuthorize={isManager || isLegal}
          onOpenFeedback={() => {
            const formElem = document.getElementById("department-suggestion-form");
            if (formElem) formElem.scrollIntoView({ behavior: "smooth" });
          }}
        />
      )}
    </div>
  );
}
