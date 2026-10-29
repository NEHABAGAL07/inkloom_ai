"use client";

import React, { useState } from "react";
import { ContentComment, ContentSubmission } from "@/types";
import {
  Maximize2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RotateCcw,
  Scale,
  Sparkles,
  Briefcase,
  FileText,
  Palette,
  Eye,
  ChevronDown,
  ChevronUp,
  Tag,
  Check,
  History,
  ShieldAlert,
} from "lucide-react";

interface VisualFeedbackCardProps {
  comment: ContentComment;
  submission?: ContentSubmission | null;
  onOpenViewer: (submission: ContentSubmission) => void;
  onToggleResolve?: (commentId: string, currentStatus: boolean, note?: string) => Promise<void>;
  isDesigner?: boolean;
}

export function VisualFeedbackCard({
  comment,
  submission,
  onOpenViewer,
  onToggleResolve,
  isDesigner = true,
}: VisualFeedbackCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [showResolutionInput, setShowResolutionInput] = useState(false);
  const [resolutionNote, setResolutionNote] = useState("");

  // Reviewer role styling and label mapping
  const getReviewerRoleMeta = (roleStr: string) => {
    const r = (roleStr || "").toLowerCase();
    if (r.includes("admin") || r.includes("manager")) {
      return {
        roleLabel: "Manager",
        headerTitle: "Feedback from Manager",
        badgeStyle: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
        icon: Briefcase,
        dotColor: "bg-indigo-500",
      };
    }
    if (r.includes("compliance") || r.includes("legal")) {
      return {
        roleLabel: "Legal & Compliance",
        headerTitle: "Feedback from Legal & Compliance",
        badgeStyle: "bg-teal/10 text-teal dark:text-[#FFAA35] border-teal/20 dark:border-[#FFAA35]/30",
        icon: Scale,
        dotColor: "bg-teal dark:bg-[#FFAA35]",
      };
    }
    if (r.includes("marketing")) {
      return {
        roleLabel: "Marketing",
        headerTitle: "Feedback from Marketing",
        badgeStyle: "bg-amber-500/10 text-amber-500 dark:text-amber-400 border-amber-500/20",
        icon: Sparkles,
        dotColor: "bg-amber-500",
      };
    }
    return {
      roleLabel: "Reviewer",
      headerTitle: "Feedback from Reviewer",
      badgeStyle: "bg-slate-500/10 text-slate-400 border-slate-500/20",
      icon: FileText,
      dotColor: "bg-slate-400",
    };
  };

  const roleMeta = getReviewerRoleMeta(comment.author_role);
  const RoleIcon = roleMeta.icon;

  // Clean author name display (fallback to Role if author name missing)
  const reviewerDisplayName = comment.author_name || roleMeta.roleLabel;

  // Format date or relative time
  const formatTime = (isoString?: string) => {
    if (!isoString) return "";
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return "";
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffHours / 24);

      if (diffHours < 1) {
        const diffMins = Math.max(1, Math.floor(diffMs / (1000 * 60)));
        return `${diffMins}m ago`;
      }
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;

      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "";
    }
  };

  const formattedDate = formatTime(comment.created_at);

  // Category badge mapping
  const renderCategoryBadge = (cat: string) => {
    switch (cat) {
      case "visual_design":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800/60 px-2 py-0.5 rounded">
            <span>🎨</span>
            <span>Visual Design</span>
          </span>
        );
      case "legal_compliance":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-800/60 px-2 py-0.5 rounded">
            <span>⚖️</span>
            <span>Legal &amp; Compliance</span>
          </span>
        );
      case "copy_tone":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/60 px-2 py-0.5 rounded">
            <span>📢</span>
            <span>Tone &amp; Messaging</span>
          </span>
        );
      case "brand_rules":
      case "terminology":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded">
            <span>🏛️</span>
            <span>Brand Standards</span>
          </span>
        );
      case "accessibility":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 px-2 py-0.5 rounded">
            <span>♿</span>
            <span>Accessibility</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-ink-muted bg-surface border border-border px-2 py-0.5 rounded">
            <span>📝</span>
            <span className="capitalize">{cat.replace(/_/g, " ")}</span>
          </span>
        );
    }
  };

  // Status mapping
  const getStatusBadge = () => {
    if (comment.is_resolved) {
      return {
        label: "Completed",
        className: "bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border-emerald-500/20",
        icon: CheckCircle2,
      };
    }
    // If not resolved, check if an in-progress note is attached
    if (comment.resolution_note && !comment.is_resolved) {
      return {
        label: "In progress",
        className: "bg-blue-500/10 text-blue-500 dark:text-blue-400 border-blue-500/20",
        icon: Clock,
      };
    }
    return {
      label: "Needs changes",
      className: "bg-amber-500/10 text-amber-500 dark:text-amber-400 border-amber-500/20",
      icon: AlertTriangle,
    };
  };

  const statusMeta = getStatusBadge();
  const StatusIcon = statusMeta.icon;

  // Resolve thumbnail media URL safely (Never display raw base64 data URLs as text)
  const effectiveMediaUrl =
    submission?.media_url ||
    (submission?.file_path &&
    (submission.file_path.startsWith("data:") ||
      submission.file_path.startsWith("http") ||
      submission.file_path.startsWith("/"))
      ? submission.file_path
      : null) ||
    (submission?.raw_text &&
    (submission.raw_text.startsWith("data:") ||
      submission.raw_text.startsWith("http") ||
      submission.raw_text.startsWith("/"))
      ? submission.raw_text
      : null) ||
    (typeof window !== "undefined" && submission?.id
      ? localStorage.getItem(`inkloom_media_${submission.id}`)
      : null);

  const designTitle = submission?.title || "Creative Design Asset";
  const rawFileName = submission?.file_name || "creative_asset.png";
  // Clean filename: Ensure base64 string is never rendered as filename
  const cleanFileName = rawFileName.startsWith("data:")
    ? `${designTitle.replace(/[^a-zA-Z0-9_-]/g, "_")}.png`
    : rawFileName;

  const contentType = submission?.content_type || "image";
  const revisionCount = submission?.revisions?.length || 1;

  // Handle Mark as Completed / In Progress
  const handleToggle = async (targetResolved: boolean) => {
    if (!onToggleResolve || isResolving) return;
    setIsResolving(true);
    try {
      await onToggleResolve(comment.id, comment.is_resolved, resolutionNote.trim() || undefined);
      setShowResolutionInput(false);
      setResolutionNote("");
    } finally {
      setIsResolving(false);
    }
  };

  const isLongText = comment.comment_text.length > 200;

  return (
    <div className="bg-surface border border-border rounded-2xl p-5 shadow-card hover:border-teal/40 dark:hover:border-[#FFAA35]/40 transition-all duration-200 group/card animate-fade-in relative overflow-hidden">
      {/* Top Header: Reviewer Identity & Review Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-4 border-b border-border/80">
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Small recognizable role badge */}
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${roleMeta.badgeStyle}`}
          >
            <RoleIcon className="w-3.5 h-3.5" />
            <span>{roleMeta.roleLabel}</span>
          </span>

          {/* Heading with reviewer name and date */}
          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold text-ink-primary font-heading tracking-tight">
              {roleMeta.headerTitle}
            </span>
            <span className="text-ink-muted">&bull;</span>
            <span className="text-ink-secondary font-medium">{reviewerDisplayName}</span>
            {formattedDate && (
              <>
                <span className="text-ink-muted">&bull;</span>
                <span className="text-ink-muted flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{formattedDate}</span>
                </span>
              </>
            )}
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border font-mono tracking-tight ${statusMeta.className}`}
          >
            <StatusIcon className="w-3.5 h-3.5" />
            <span>{statusMeta.label}</span>
          </span>
        </div>
      </div>

      {/* Card Body: 2-Column Desktop Layout (Thumbnail Left, Feedback Right), Stacks gracefully on Mobile */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 pt-4 items-start">
        {/* Left Column: Design Thumbnail & Identity */}
        <div className="md:col-span-5 lg:col-span-4 flex flex-col space-y-2.5">
          <div
            role="button"
            tabIndex={0}
            onClick={() => submission && onOpenViewer(submission)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                submission && onOpenViewer(submission);
              }
            }}
            title="Click to view full-size design"
            aria-label={`View full design for ${designTitle}`}
            className="w-full h-44 sm:h-48 rounded-xl overflow-hidden bg-slate-950/40 dark:bg-black/60 border border-border hover:border-teal dark:hover:border-[#FFAA35] transition-all duration-200 cursor-pointer relative group/thumb flex items-center justify-center p-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal select-none"
          >
            {effectiveMediaUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={effectiveMediaUrl}
                alt={designTitle}
                className="max-h-full max-w-full object-contain rounded transition-transform duration-200 group-hover/thumb:scale-[1.03]"
                onError={(e) => {
                  const safeFn = (cleanFileName || designTitle).replace(/[<>&"']/g, "");
                  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200" width="320" height="200"><rect width="320" height="200" fill="#0f172a"/><text x="50%" y="50%" text-anchor="middle" fill="#94a3b8" font-family="sans-serif" font-size="13" font-weight="600">${safeFn}</text></svg>`;
                  e.currentTarget.src =
                    "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
                }}
              />
            ) : (
              <div className="text-center p-4 space-y-2">
                <div className="w-10 h-10 rounded-xl bg-teal/10 border border-teal/20 flex items-center justify-center mx-auto text-teal">
                  <Palette className="w-5 h-5" />
                </div>
                <p className="text-xs font-semibold text-ink-primary">Design Asset</p>
                <span className="text-[10px] text-ink-muted uppercase font-mono tracking-wider">
                  {contentType}
                </span>
              </div>
            )}

            {/* Hover Expansion Overlay */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-bold backdrop-blur-[2px]">
              <Maximize2 className="w-4 h-4 stroke-[2.5]" />
              <span>View full-size design</span>
            </div>
          </div>

          {/* Design Details below thumbnail */}
          <div className="space-y-1">
            <h4
              className="text-xs sm:text-sm font-bold text-ink-primary truncate tracking-tight"
              title={designTitle}
            >
              {designTitle}
            </h4>
            <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-ink-muted">
              <span className="font-mono text-ink-secondary truncate max-w-[180px]">
                {cleanFileName}
              </span>
              <span>&bull;</span>
              <span className="uppercase text-[9.5px] font-mono px-1.5 py-0.2 rounded bg-workspace border border-border">
                {contentType}
              </span>
              {revisionCount > 1 && (
                <>
                  <span>&bull;</span>
                  <span className="text-[10px] text-indigo-400 font-mono font-bold">
                    v{revisionCount}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Feedback Details, What Needs Improvement, Actions */}
        <div className="md:col-span-7 lg:col-span-8 flex flex-col justify-between space-y-4">
          <div className="space-y-2.5">
            {/* Category Badge & Section Title */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-ink-muted font-mono">
                  What needs improvement?
                </span>
              </div>
              <div>{renderCategoryBadge(comment.category)}</div>
            </div>

            {/* Reviewer's Original Feedback Text */}
            <div className="text-xs sm:text-sm text-ink-primary leading-relaxed bg-workspace/50 p-3.5 rounded-xl border border-border/60">
              <p className={!isExpanded && isLongText ? "line-clamp-3" : ""}>
                {comment.comment_text}
              </p>

              {isLongText && (
                <button
                  type="button"
                  onClick={() => setIsExpanded((prev) => !prev)}
                  className="mt-2 text-xs font-bold text-teal dark:text-[#FFAA35] hover:underline inline-flex items-center gap-1 transition"
                >
                  {isExpanded ? (
                    <>
                      <span>Show less</span>
                      <ChevronUp className="w-3.5 h-3.5" />
                    </>
                  ) : (
                    <>
                      <span>View full feedback</span>
                      <ChevronDown className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Resolution Note / Completed Details if already resolved */}
            {comment.is_resolved && (
              <div className="text-xs p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Resolved {comment.resolved_by ? `by ${comment.resolved_by}` : ""}</span>
                  {comment.resolved_at && (
                    <span className="text-[11px] font-normal text-emerald-600 dark:text-emerald-400">
                      &bull; {formatTime(comment.resolved_at)}
                    </span>
                  )}
                </div>
                {comment.resolution_note && (
                  <p className="text-[11px] text-emerald-900 dark:text-emerald-200 pl-5 leading-normal">
                    &ldquo;{comment.resolution_note}&rdquo;
                  </p>
                )}
              </div>
            )}

            {/* Optional Resolution Note Input when designer marks as done */}
            {showResolutionInput && (
              <div className="p-3 bg-workspace rounded-xl border border-teal/40 dark:border-[#FFAA35]/40 space-y-2 animate-fade-in">
                <label className="text-xs font-bold text-ink-primary block">
                  Add resolution note for reviewers (optional):
                </label>
                <input
                  type="text"
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  placeholder="e.g. Updated logo clear-space to 34px and corrected contrast ratio to 4.8:1"
                  className="w-full px-3 py-1.5 text-xs rounded-lg bg-surface border border-border text-ink-primary focus:outline-none focus:border-teal"
                />
                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowResolutionInput(false)}
                    className="px-2.5 py-1 text-xs text-ink-muted hover:text-ink-primary transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isResolving}
                    onClick={() => handleToggle(true)}
                    className="px-3 py-1 rounded-lg bg-teal hover:bg-teal/90 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                  >
                    {isResolving ? (
                      <RotateCcw className="w-3 h-3 animate-spin" />
                    ) : (
                      <Check className="w-3 h-3" />
                    )}
                    <span>Confirm Completed</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Action Footer */}
          <div className="pt-3 border-t border-border/80 flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex flex-wrap items-center gap-2">
              {/* Action 1: View Design in Full-Size Viewer */}
              {submission && (
                <button
                  type="button"
                  onClick={() => onOpenViewer(submission)}
                  className="px-3.5 py-1.5 rounded-lg bg-workspace hover:bg-surface border border-border text-ink-primary text-xs font-semibold hover:border-teal/40 transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 text-teal dark:text-[#FFAA35]" />
                  <span>View design</span>
                </button>
              )}

              {/* Action 2: View Updated Version if revisions exist */}
              {submission && revisionCount > 1 && (
                <button
                  type="button"
                  onClick={() => onOpenViewer(submission)}
                  className="px-3 py-1.5 rounded-lg bg-workspace hover:bg-surface border border-border text-ink-secondary hover:text-ink-primary text-xs font-medium transition flex items-center gap-1.5 cursor-pointer"
                >
                  <History className="w-3.5 h-3.5 text-indigo-400" />
                  <span>View updated version (v{revisionCount})</span>
                </button>
              )}
            </div>

            {/* Action 3: Designer Resolution Action */}
            {onToggleResolve && (
              <div className="flex items-center gap-2">
                {comment.is_resolved ? (
                  <button
                    type="button"
                    disabled={isResolving}
                    onClick={() => handleToggle(false)}
                    className="px-3 py-1.5 rounded-lg bg-workspace hover:bg-surface border border-border text-ink-muted hover:text-amber-500 text-xs font-medium transition flex items-center gap-1.5 cursor-pointer"
                    title="Reopen feedback item"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reopen feedback</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowResolutionInput((prev) => !prev)}
                    className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-[#10B981] to-[#0284C7] dark:btn-gradient-warm text-white dark:text-[#111111] text-xs font-bold hover:opacity-95 transition flex items-center gap-1.5 shadow-subtle cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Mark as completed</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
