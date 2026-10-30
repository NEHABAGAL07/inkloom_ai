"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { ContentComment, ContentSubmission } from "@/types";
import { api } from "@/services/api";
import { useAuth } from "@/services/auth-context";
import {
  Maximize2,
  ChevronDown,
  Clock,
  CheckCircle2,
  Check,
  RotateCcw,
  Sparkles,
  FileCheck,
  Send,
  Palette,
  Eye,
  X,
  Upload,
  Image as ImageIcon,
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
  hideSuggestions?: boolean;
}

const CATEGORY_OPTIONS = [
  { value: "visual_design", label: "Visual & design standards", icon: "🎨" },
  { value: "legal_compliance", label: "Legal & compliance", icon: "⚖️" },
  { value: "copy_tone", label: "Tone & messaging", icon: "📢" },
  { value: "brand_rules", label: "Brand guidelines", icon: "🏛️" },
  { value: "general", label: "General", icon: "📝" },
];

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
  hideSuggestions = false,
}: DesignerFeedbackCommentsProps) {
  const { user, activeRole } = useAuth();
  const [comments, setComments] = useState<ContentComment[]>([]);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [currentSub, setCurrentSub] = useState<ContentSubmission | null>(submission || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Technical details disclosure in Card A
  const [showTechDetails, setShowTechDetails] = useState(false);

  // Determine user role and permissions
  const roleStr = (activeRole || "").toLowerCase();
  const isDesigner = roleStr.includes("designer");
  const isManager = roleStr.includes("admin") || roleStr.includes("manager");
  const isLegal = roleStr.includes("compliance") || roleStr.includes("legal");
  const isMarketing = roleStr.includes("marketing");

  // Only Manager, Legal department, and Marketing department can submit feedback
  const canSubmitSuggestions = isManager || isLegal || isMarketing;

  // New suggestion form state
  const [newCommentText, setNewCommentText] = useState("");
  const [category, setCategory] = useState<string>("visual_design");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [postSuccess, setPostSuccess] = useState(false);

  // Active filter tab: 'all' | 'pending' | 'resolved'
  const [filterTab, setFilterTab] = useState<"all" | "pending" | "resolved">("all");

  // Inline resolution note state for mark-as-done
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolutionNoteInput, setResolutionNoteInput] = useState("");

  // Cut and Upload Replacement Image state
  const [isCutMode, setIsCutMode] = useState(false);
  const [uploadFeedback, setUploadFeedback] = useState<string | null>(null);
  const replaceFileInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleCutImage = () => {
    setIsCutMode(true);
    setUploadFeedback("Existing image removed. Select or drop a new design image to upload.");
  };

  const handleCancelCut = () => {
    setIsCutMode(false);
    setUploadFeedback(null);
  };

  const handleProcessImageFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file (PNG, JPG, WebP, SVG).");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(`inkloom_media_${submissionId}`, dataUrl);
          if (file.name) {
            localStorage.setItem(`inkloom_media_${file.name}`, dataUrl);
          }
        } catch (err) {
          console.warn("Could not save to localStorage:", err);
        }
      }

      setCurrentSub((prev) => {
        if (!prev) {
          return {
            id: submissionId,
            title: effectiveTitle,
            content_type: "image",
            media_url: dataUrl,
            file_path: dataUrl,
            file_name: file.name,
            created_at: new Date().toISOString(),
          } as ContentSubmission;
        }
        return {
          ...prev,
          media_url: dataUrl,
          file_path: dataUrl,
          file_name: file.name,
        };
      });

      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("inkloom_asset_updated", {
            detail: {
              submissionId,
              mediaUrl: dataUrl,
              fileName: file.name,
            },
          })
        );
      }

      setIsCutMode(false);
      setUploadFeedback(`Uploaded "${file.name}" successfully!`);
      setTimeout(() => setUploadFeedback(null), 4000);
    };
    reader.readAsDataURL(file);
  };

  const handleReplacementFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleProcessImageFile(file);
    if (e.target) e.target.value = "";
  };

  const loadComments = useCallback(async () => {
    if (!submissionId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.getSubmissionComments(submissionId);
      setComments(data.comments || []);
    } catch (err: any) {
      console.error("Failed to load submission comments:", err);
      setError(err?.message || "Failed to load suggestions.");
    } finally {
      setLoading(false);
    }
  }, [submissionId]);

  useEffect(() => {
    if (!hideSuggestions) {
      loadComments();
    }
  }, [loadComments, hideSuggestions]);

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

  // Handle posting a new suggestion
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmitSuggestions) {
      setError("Only Managers, Legal, and Marketing have access to post feedback.");
      return;
    }
    if (!newCommentText.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const created = await api.addSubmissionComment(submissionId, newCommentText.trim(), category);
      setComments((prev) => [created, ...prev]);
      setNewCommentText("");
      setPostSuccess(true);
      setTimeout(() => setPostSuccess(false), 3000);
    } catch (err: any) {
      console.error("Failed to post suggestion:", err);
      setError(err?.message || "Failed to submit feedback.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle toggling resolution / "Mark as done"
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
      setError(err?.message || "Could not update feedback status.");
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
  const displayedComments = useMemo(() => {
    return comments.filter((c) => {
      if (filterTab === "pending") return !c.is_resolved;
      if (filterTab === "resolved") return c.is_resolved;
      return true;
    });
  }, [comments, filterTab]);

  // Derived asset metadata
  const effectiveTitle = currentSub?.title || submissionTitle || "Creative Design Asset";
  const effectiveContentType = currentSub?.content_type || contentType || "image";
  const effectiveDescription = currentSub?.description || description;
  const effectiveRawText = currentSub?.raw_text || rawText;
  const effectiveFileName =
    currentSub?.file_name ||
    fileName ||
    (effectiveContentType === "image" ? `${effectiveTitle.replace(/[^a-zA-Z0-9_-]/g, "_")}.png` : undefined);

  const effectiveMediaUrl =
    currentSub?.media_url ||
    mediaUrl ||
    (currentSub?.file_path && (currentSub.file_path.startsWith("data:") || currentSub.file_path.startsWith("http") || currentSub.file_path.startsWith("/")) ? currentSub.file_path : null) ||
    (currentSub?.raw_text && (currentSub.raw_text.startsWith("data:") || currentSub.raw_text.startsWith("http") || currentSub.raw_text.startsWith("/")) ? currentSub.raw_text : null) ||
    (typeof window !== "undefined"
      ? localStorage.getItem(`inkloom_media_${submissionId}`) ||
        (effectiveFileName ? localStorage.getItem(`inkloom_media_${effectiveFileName}`) : null)
      : null);

  const isDataUrl = effectiveRawText?.startsWith("data:");

  // Review status badge helper
  const getReviewStatus = (status?: string) => {
    switch (status) {
      case "approved":
        return {
          label: "Approved",
          badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
          dot: "bg-emerald-500",
        };
      case "changes_requested":
        return {
          label: "Needs changes",
          badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
          dot: "bg-amber-500",
        };
      case "rejected":
        return {
          label: "Rejected",
          badge: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
          dot: "bg-rose-500",
        };
      default:
        return {
          label: "In review",
          badge: "bg-teal-500/10 text-teal-600 dark:text-[#FFAA35] border-teal-500/20 dark:border-[#FFAA35]/30",
          dot: "bg-teal-500 dark:bg-[#FFAA35]",
        };
    }
  };

  const reviewStatus = getReviewStatus(currentSub?.status);

  const getRoleLabel = (role?: string | null) => {
    const r = (role || "").toLowerCase();
    if (r.includes("admin") || r.includes("manager")) return "Manager";
    if (r.includes("compliance") || r.includes("legal")) return "Legal & Compliance";
    if (r.includes("marketing")) return "Marketing Lead";
    if (r.includes("designer")) return "Brand Designer";
    return role || "Reviewer";
  };

  const renderCategoryBadge = (cat: string) => {
    switch (cat) {
      case "visual_design":
        return (
          <span className="text-[10.5px] font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800/60 px-2 py-0.5 rounded">
            Visual standards
          </span>
        );
      case "legal_compliance":
        return (
          <span className="text-[10.5px] font-semibold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-800/60 px-2 py-0.5 rounded">
            Legal &amp; compliance
          </span>
        );
      case "copy_tone":
        return (
          <span className="text-[10.5px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/60 px-2 py-0.5 rounded">
            Tone &amp; messaging
          </span>
        );
      case "brand_rules":
        return (
          <span className="text-[10.5px] font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded">
            Brand guidelines
          </span>
        );
      default:
        return (
          <span className="text-[10.5px] font-semibold text-ink-muted bg-surface border border-border px-2 py-0.5 rounded">
            General
          </span>
        );
    }
  };

  // Quick suggestion templates tailored to active role
  const quickSuggestions = [
    ...(isLegal
      ? [
          {
            label: "+ Legal footnote",
            text: "Statutory claim requires benchmark substantiation footnote: 'Tested under certified enterprise cluster configuration.'",
            category: "legal_compliance",
          },
        ]
      : []),
    ...(isMarketing
      ? [
          {
            label: "+ Brand voice & tone",
            text: "Update headline font to active campaign typography and replace generic claims with verified feature benchmarks.",
            category: "copy_tone",
          },
        ]
      : []),
    ...(isManager
      ? [
          {
            label: "+ Logo clear space",
            text: "Ensure primary brand logo maintains at least 32px exclusion padding clear of text overlays on all four sides.",
            category: "brand_rules",
          },
        ]
      : []),
    {
      label: "+ Contrast ratio (WCAG)",
      text: "Improve color contrast ratio between foreground typography and background graphics to satisfy WCAG AA (minimum 4.5:1).",
      category: "visual_design",
    },
  ];

  return (
    <div className="space-y-6">
      {/* ========================================================
          Card A: Designer upload
          ======================================================== */}
      <section
        aria-labelledby="designer-upload-heading"
        className="bg-surface rounded-2xl border border-border shadow-subtle p-5 sm:p-6 space-y-5 transition-colors"
      >
        {/* Card A Header: Heading, concise submission label & review status */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border/80">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2
              id="designer-upload-heading"
              className="text-base sm:text-lg font-bold font-heading text-slate-900 dark:text-[#F7F3ED] tracking-tight"
            >
              Designer upload
            </h2>
            <span className="text-[11px] font-medium text-ink-muted px-2.5 py-0.5 rounded-full bg-workspace border border-border/80">
              Submitted by Designer
            </span>
          </div>

          {/* Compact Review Status */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-ink-muted hidden xs:inline">Status:</span>
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${reviewStatus.badge}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${reviewStatus.dot}`} />
              <span>{reviewStatus.label}</span>
            </span>
          </div>
        </div>

        {/* Upload feedback banner */}
        {uploadFeedback && (
          <div className="mb-4 px-3.5 py-2.5 rounded-xl bg-teal/15 border border-teal/30 text-teal dark:text-[#FFAA35] text-xs font-semibold flex items-center justify-between gap-2 shadow-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{uploadFeedback}</span>
            </div>
            {isCutMode && effectiveMediaUrl && (
              <button
                type="button"
                onClick={handleCancelCut}
                className="text-xs underline hover:opacity-80 transition cursor-pointer font-bold"
              >
                Restore Previous
              </button>
            )}
          </div>
        )}

        {/* Card A Content: Enlarged Preview & Specifications */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* Left Column: Enlarged Asset Preview Thumbnail or Replacement Upload Dropzone */}
          <div className="md:col-span-6 lg:col-span-6">
            {!isCutMode && effectiveMediaUrl ? (
              <div
                role="button"
                tabIndex={0}
                onClick={() => setIsViewerOpen(true)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setIsViewerOpen(true);
                  }
                }}
                title="Click to view full-size design"
                aria-label="View full-size design"
                className="group relative rounded-xl border border-border/90 bg-slate-950/40 dark:bg-black/50 hover:border-teal/60 dark:hover:border-[#FFAA35]/60 transition-all duration-200 cursor-pointer overflow-hidden p-3 flex flex-col items-center justify-center min-h-[340px] sm:min-h-[400px] lg:min-h-[440px] max-h-[540px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal select-none"
              >
                {/* Top-Right "Cut" Cross Button with High Visibility Font */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCutImage();
                  }}
                  className="absolute top-3 right-3 z-30 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/85 hover:bg-rose-600 active:bg-rose-700 text-white border border-white/25 shadow-lg backdrop-blur-md transition-all cursor-pointer group/cut focus:outline-none focus:ring-2 focus:ring-rose-400"
                  title="Cut existing image to upload a new one"
                  aria-label="Cut existing image to upload a new one"
                >
                  <X className="w-4 h-4 text-white stroke-[2.5] group-hover/cut:rotate-90 transition-transform duration-200" />
                  <span className="text-xs font-bold font-mono tracking-tight text-white select-none">
                    Cut
                  </span>
                </button>

                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={effectiveMediaUrl}
                  alt={effectiveTitle}
                  className="max-h-[460px] w-full object-contain rounded transition-transform duration-200 group-hover:scale-[1.01]"
                  onError={(e) => {
                    const safeFn = (effectiveFileName || effectiveTitle).replace(/[<>&"']/g, "");
                    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240" width="400" height="240"><rect width="400" height="240" fill="#0f172a"/><text x="50%" y="50%" text-anchor="middle" fill="#94a3b8" font-family="sans-serif" font-size="14" font-weight="600">${safeFn}</text></svg>`;
                    e.currentTarget.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
                  }}
                />

                {/* Hover Overlay Hint */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-semibold backdrop-blur-[2px]">
                  <Maximize2 className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Click to expand design</span>
                </div>
              </div>
            ) : (
              /* In-Place Upload Dropzone when image is cut or missing */
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files?.[0];
                  if (file) handleProcessImageFile(file);
                }}
                className="relative rounded-xl border-2 border-dashed border-teal/50 hover:border-teal dark:border-[#FFAA35]/50 dark:hover:border-[#FFAA35] bg-teal/5 dark:bg-black/60 transition-all duration-200 p-6 flex flex-col items-center justify-center min-h-[340px] sm:min-h-[400px] lg:min-h-[440px] max-h-[540px] text-center w-full"
              >
                <input
                  type="file"
                  ref={replaceFileInputRef}
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  onChange={handleReplacementFileSelected}
                  className="hidden"
                  id="replace_design_image_input"
                />

                <div className="w-14 h-14 rounded-2xl bg-teal/15 dark:bg-[#FFAA35]/15 border border-teal/30 dark:border-[#FFAA35]/30 flex items-center justify-center text-teal dark:text-[#FFAA35] mb-3 shadow-inner">
                  <Upload className="w-7 h-7" />
                </div>

                <h4 className="text-sm font-bold text-slate-900 dark:text-[#F7F3ED] mb-1">
                  Upload New Design Artwork
                </h4>
                <p className="text-xs text-ink-muted max-w-xs mb-4">
                  Drag &amp; drop your new image file here, or click below to browse from your computer.
                </p>

                <div className="flex flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => replaceFileInputRef.current?.click()}
                    className="px-4 py-2 rounded-xl bg-teal hover:bg-teal/90 text-white text-xs font-bold shadow-md transition flex items-center gap-2 cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Select New Image</span>
                  </button>

                  {effectiveMediaUrl && (
                    <button
                      type="button"
                      onClick={handleCancelCut}
                      className="px-3.5 py-2 rounded-xl bg-surface hover:bg-workspace border border-border text-ink-muted hover:text-ink-primary text-xs font-medium transition cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}
                </div>

                <span className="text-[11px] text-ink-muted font-mono mt-3">
                  Supports PNG, JPEG, WebP, SVG (Max 25MB)
                </span>
              </div>
            )}
          </div>

          {/* Right Column: Asset Specifications & Actions */}
          <div className="md:col-span-6 lg:col-span-6 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <h3 className="text-base sm:text-lg font-bold font-heading text-slate-900 dark:text-[#F7F3ED] tracking-tight leading-snug break-words">
                {effectiveTitle}
              </h3>

              {/* Clean Filename and Format Metadata */}
              <div className="flex flex-wrap items-center gap-2 text-xs text-ink-muted">
                <span className="font-mono font-medium text-slate-700 dark:text-[#B8B2AC] break-all">
                  {effectiveFileName || "asset_media.png"}
                </span>
                <span>&bull;</span>
                <span className="uppercase text-[10.5px] font-semibold px-2 py-0.5 rounded bg-workspace border border-border text-ink-muted">
                  {effectiveContentType}
                </span>
              </div>

              {/* Asset Description (if provided) */}
              {effectiveDescription && (
                <p className="text-xs text-ink-secondary leading-relaxed pt-1">
                  {effectiveDescription}
                </p>
              )}
            </div>

            {/* Prominent Action Button & Collapsible Toggle */}
            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-border/80">
              <button
                type="button"
                onClick={() => setIsViewerOpen(true)}
                className="px-4 py-2.5 bg-gradient-to-r from-[#10B981] via-[#0284C7] to-[#2563EB] text-white dark:btn-gradient-warm font-bold text-xs rounded-xl shadow-xs hover:opacity-95 transition-all flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal w-full sm:w-auto shrink-0 select-none"
              >
                <Maximize2 className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>View full-size design</span>
              </button>

              {/* Technical Details Disclosure Button */}
              <button
                type="button"
                onClick={() => setShowTechDetails((prev) => !prev)}
                aria-expanded={showTechDetails}
                className="text-xs text-ink-muted hover:text-ink-primary font-medium transition inline-flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal rounded self-start sm:self-auto py-1"
              >
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    showTechDetails ? "rotate-180" : ""
                  }`}
                />
                <span>{showTechDetails ? "Hide technical details" : "View technical details"}</span>
              </button>
            </div>

            {/* Collapsible Technical Details Area */}
            {showTechDetails && (
              <div className="p-3.5 rounded-xl bg-workspace border border-border text-xs space-y-2 animate-in fade-in duration-150">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11.5px]">
                  <div>
                    <span className="text-ink-muted">Submission ID:</span>{" "}
                    <span className="font-mono text-ink-primary select-all">{submissionId}</span>
                  </div>
                  <div>
                    <span className="text-ink-muted">Format:</span>{" "}
                    <span className="font-mono text-ink-primary uppercase">{effectiveContentType}</span>
                  </div>
                  <div>
                    <span className="text-ink-muted">Submitted date:</span>{" "}
                    <span className="text-ink-primary">
                      {new Date(currentSub?.created_at || Date.now()).toLocaleDateString([], {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <div>
                    <span className="text-ink-muted">Payload:</span>{" "}
                    <span className="font-mono text-ink-primary">
                      {isDataUrl
                        ? `Base64 image data (${(effectiveRawText!.length / 1024).toFixed(1)} KB)`
                        : effectiveRawText
                        ? `Text payload (${effectiveRawText.length} characters)`
                        : "Binary media file"}
                    </span>
                  </div>
                </div>

                {/* If there is non-base64 textual content, display it cleanly in a scrollable block */}
                {effectiveRawText && !isDataUrl && (
                  <div className="pt-2 border-t border-border/80">
                    <span className="text-[10.5px] uppercase font-bold text-ink-muted tracking-wider">
                      Extracted Text Content
                    </span>
                    <pre className="mt-1 p-2.5 rounded-lg bg-surface border border-border text-[11px] font-mono text-ink-primary whitespace-pre-wrap max-h-28 overflow-y-auto">
                      {effectiveRawText}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ========================================================
          Card B: Suggestions for the designer
          ======================================================== */}
      {!hideSuggestions && (
      <section
        aria-labelledby="suggestions-heading"
        className="bg-surface rounded-2xl border border-border shadow-subtle p-5 sm:p-6 space-y-5 transition-colors"
      >
        {/* Card B Header: Heading, short explanation, and single reviewer identity */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-border/80">
          <div>
            <h2
              id="suggestions-heading"
              className="text-base sm:text-lg font-bold font-heading text-slate-900 dark:text-[#F7F3ED] tracking-tight"
            >
              Suggestions for the designer
            </h2>
            <p className="text-xs text-ink-secondary mt-0.5">
              Tell the designer what needs to change.
            </p>
          </div>

          {/* Compact Reviewer Identity (Single unobtrusive metadata line) */}
          <div className="text-xs text-ink-muted flex items-center gap-1.5 flex-wrap">
            <span>Reviewing as</span>
            <span className="font-semibold text-slate-900 dark:text-[#F7F3ED]">
              {user?.full_name || user?.email || "Reviewer"}
            </span>
            <span>&bull;</span>
            <span className="capitalize text-teal dark:text-[#FFAA35] font-medium">
              {getRoleLabel(activeRole)}
            </span>
          </div>
        </div>

        {/* Compact Feedback Progress Status Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-workspace border border-border text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-900 dark:text-[#F7F3ED]">Feedback progress:</span>
            <span className="font-mono text-teal dark:text-[#FFAA35] font-bold">
              {resolvedCount} of {totalCount} completed ({completionPercentage}%)
            </span>
            <div className="w-20 sm:w-28 h-1.5 bg-border rounded-full overflow-hidden shrink-0 ml-1">
              <div
                className={`h-full transition-all duration-300 ${
                  completionPercentage === 100
                    ? "bg-emerald-500"
                    : completionPercentage >= 50
                    ? "bg-teal dark:bg-[#FFAA35]"
                    : "bg-amber-500"
                }`}
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                pendingCount > 0
                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                  : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
              }`}
            >
              {pendingCount} needs changes
            </span>
            <span className="text-[11px] text-ink-muted">
              {resolvedCount} completed
            </span>
          </div>
        </div>

        {/* Feedback Form (when user has reviewer role) */}
        {canSubmitSuggestions ? (
          <form onSubmit={handleAddComment} className="space-y-3.5 pt-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label
                htmlFor="feedback-details-input"
                className="text-xs font-bold text-slate-900 dark:text-[#F7F3ED]"
              >
                Feedback details
              </label>

              {/* Category Selector with plain-language labels */}
              <div className="flex items-center gap-2">
                <label htmlFor="category-select" className="text-[11px] text-ink-muted shrink-0">
                  Category:
                </label>
                <select
                  id="category-select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="bg-workspace border border-border text-xs rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-[#F7F3ED] focus:outline-none focus:border-teal dark:focus:border-[#FFAA35]"
                >
                  {CATEGORY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.icon} {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Multiline Feedback Text Field */}
            <textarea
              id="feedback-details-input"
              rows={3}
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              placeholder="Describe what needs to be changed before this design can be approved (e.g., 'Increase contrast on headline typography' or 'Add required compliance footnote')..."
              className="w-full bg-workspace border border-border rounded-xl p-3 text-xs text-slate-900 dark:text-[#F7F3ED] placeholder-ink-muted focus:outline-none focus:border-teal dark:focus:border-[#FFAA35] focus:ring-1 focus:ring-teal dark:focus:ring-[#FFAA35] resize-none"
            />

            {/* Quick Suggestions Chips */}
            <div className="flex items-center flex-wrap gap-1.5">
              <span className="text-[10px] text-ink-muted font-bold uppercase tracking-wider mr-1">
                Quick suggestions:
              </span>
              {quickSuggestions.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => applyQuickSuggestion(item.text, item.category)}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-workspace border border-border/80 hover:border-teal/60 dark:hover:border-[#FFAA35]/60 text-ink-secondary hover:text-ink-primary transition"
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Submit Actions */}
            <div className="flex items-center justify-between pt-1">
              {postSuccess ? (
                <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5 animate-in fade-in">
                  <Check className="w-3.5 h-3.5" />
                  <span>Feedback sent to designer!</span>
                </div>
              ) : error ? (
                <div className="text-xs text-rose-500 font-medium">{error}</div>
              ) : (
                <div />
              )}

              <button
                type="submit"
                disabled={!newCommentText.trim() || isSubmitting}
                className="px-4 py-2 bg-gradient-to-r from-[#10B981] via-[#0284C7] to-[#2563EB] text-white dark:btn-gradient-warm text-xs font-bold rounded-xl transition shadow-xs flex items-center gap-1.5 disabled:opacity-50 hover:opacity-95 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal select-none"
              >
                <Send className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>{isSubmitting ? "Sending..." : "Send feedback"}</span>
              </button>
            </div>
          </form>
        ) : (
          /* Supportive guidance banner for designer */
          <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-200 dark:bg-indigo-950/30 dark:border-indigo-900/50 flex items-start gap-3">
            <Palette className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <h4 className="text-xs font-bold text-slate-900 dark:text-[#F7F3ED]">
                Designer feedback view
              </h4>
              <p className="text-xs text-ink-secondary leading-relaxed">
                Review suggestions below and mark each item as completed once updated in your design.
              </p>
            </div>
          </div>
        )}

        {/* Filter Tabs: All, Needs changes, Completed */}
        <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-border/80">
          <div className="flex items-center gap-1.5 p-1 bg-workspace rounded-xl border border-border text-xs">
            <button
              type="button"
              onClick={() => setFilterTab("all")}
              className={`px-3 py-1 rounded-lg font-medium transition ${
                filterTab === "all"
                  ? "bg-surface text-ink-primary font-bold shadow-2xs border border-border"
                  : "text-ink-secondary hover:text-ink-primary"
              }`}
            >
              All ({totalCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterTab("pending")}
              className={`px-3 py-1 rounded-lg font-medium transition flex items-center gap-1.5 ${
                filterTab === "pending"
                  ? "bg-amber-50 text-amber-900 font-bold border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300"
                  : "text-ink-secondary hover:text-ink-primary"
              }`}
            >
              <Clock className="w-3 h-3 text-amber-600" />
              <span>Needs changes ({pendingCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterTab("resolved")}
              className={`px-3 py-1 rounded-lg font-medium transition flex items-center gap-1.5 ${
                filterTab === "resolved"
                  ? "bg-emerald-50 text-emerald-900 font-bold border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300"
                  : "text-ink-secondary hover:text-ink-primary"
              }`}
            >
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>Completed ({resolvedCount})</span>
            </button>
          </div>

          <span className="text-[11px] text-ink-muted flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-teal dark:text-[#FFAA35]" />
            <span>
              {isDesigner
                ? "Mark each suggestion as done when the fix is completed."
                : "Suggestions and resolution updates appear in real-time."}
            </span>
          </span>
        </div>

        {/* Suggestions List */}
        <div className="space-y-3 pt-1">
          {loading ? (
            <div className="py-8 text-center text-xs text-ink-muted">
              <div className="w-6 h-6 border-2 border-teal dark:border-[#FFAA35] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <span>Loading suggestions...</span>
            </div>
          ) : error && comments.length === 0 ? (
            <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl text-rose-600 dark:text-rose-400 text-xs flex items-center justify-between">
              <span>{error}</span>
              <button
                type="button"
                onClick={loadComments}
                className="text-xs font-bold underline hover:no-underline"
              >
                Retry
              </button>
            </div>
          ) : displayedComments.length === 0 ? (
            <div className="py-8 text-center bg-workspace rounded-xl border border-dashed border-border text-ink-muted text-xs space-y-1">
              <FileCheck className="w-7 h-7 text-ink-muted mx-auto mb-1 opacity-60" />
              <p className="font-semibold text-slate-900 dark:text-[#F7F3ED]">
                {filterTab === "pending"
                  ? "All suggestions have been completed!"
                  : filterTab === "resolved"
                  ? "No completed improvements yet."
                  : "No suggestions have been posted yet."}
              </p>
              <p className="text-[11px] text-ink-secondary">
                {canSubmitSuggestions
                  ? "Use the form above to send clear feedback to the designer."
                  : "Feedback from team reviewers will appear here."}
              </p>
            </div>
          ) : (
            displayedComments.map((comment) => {
              const isBeingResolved = resolvingId === comment.id;

              return (
                <div
                  key={comment.id}
                  className={`rounded-xl border transition-all duration-150 p-4 ${
                    comment.is_resolved
                      ? "bg-surface/80 border-border/80"
                      : "bg-surface border-amber-500/30 dark:border-amber-500/20 shadow-xs"
                  }`}
                >
                  {/* Item Metadata Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 flex-wrap text-xs">
                      <span className="font-bold text-slate-900 dark:text-[#F7F3ED]">
                        {comment.author_name}
                      </span>
                      <span className="text-[11px] text-ink-muted">
                        ({getRoleLabel(comment.author_role)})
                      </span>
                      <span className="text-ink-muted">&bull;</span>
                      {renderCategoryBadge(comment.category)}
                      <span className="text-ink-muted text-[11px]">
                        {new Date(comment.created_at).toLocaleDateString([], {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    {/* Accurate Status Indicator */}
                    <div>
                      {comment.is_resolved ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          <span>Completed</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                          <span>Needs changes</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Suggestion Text Content */}
                  <p
                    className={`text-xs leading-relaxed mb-3 ${
                      comment.is_resolved
                        ? "text-ink-secondary"
                        : "text-slate-900 dark:text-[#F7F3ED] font-medium"
                    }`}
                  >
                    {comment.comment_text}
                  </p>

                  {/* Resolution Footer & Action */}
                  <div className="pt-2 border-t border-border/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div className="text-[11px]">
                      {comment.is_resolved ? (
                        <div className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold">
                            ✓ Fixed by {comment.resolved_by || "Designer"}
                          </span>
                          {comment.resolved_at && (
                            <span className="text-ink-muted">
                              on{" "}
                              {new Date(comment.resolved_at).toLocaleDateString([], {
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                          )}
                          {comment.resolution_note && (
                            <span className="italic bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 text-ink-primary">
                              &ldquo;{comment.resolution_note}&rdquo;
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="text-ink-muted text-[11.5px]">
                          Waiting for designer to update and mark as done.
                        </div>
                      )}
                    </div>

                    {/* Resolution Controls */}
                    <div className="flex items-center gap-2">
                      {comment.is_resolved ? (
                        <button
                          type="button"
                          onClick={() => handleToggleResolve(comment.id, true)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-ink-muted hover:text-ink-primary hover:bg-workspace rounded-lg transition"
                          title="Reopen if further revision is required"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Reopen</span>
                        </button>
                      ) : isBeingResolved ? (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <input
                            type="text"
                            value={resolutionNoteInput}
                            onChange={(e) => setResolutionNoteInput(e.target.value)}
                            placeholder="Resolution note (e.g., 'Contrast ratio updated')..."
                            className="text-xs bg-workspace border border-border rounded-lg px-2.5 py-1 w-48 sm:w-56 focus:outline-none focus:border-teal dark:focus:border-[#FFAA35]"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              handleToggleResolve(comment.id, false, resolutionNoteInput)
                            }
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-lg transition inline-flex items-center gap-1 shadow-xs"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Confirm</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setResolvingId(null)}
                            className="px-2 py-1 text-[11px] text-ink-muted hover:text-ink-primary"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setResolvingId(comment.id)}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition shadow-2xs"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Mark as done</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
      )}

      {/* Interactive Full-Size Design Asset Viewer Modal */}
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
            const formElem = document.getElementById("feedback-details-input");
            if (formElem) formElem.focus();
          }}
        />
      )}
    </div>
  );
}
