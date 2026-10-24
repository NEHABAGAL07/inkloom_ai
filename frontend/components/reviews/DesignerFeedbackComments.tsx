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
} from "lucide-react";

interface DesignerFeedbackCommentsProps {
  submissionId: string;
  submissionTitle?: string;
  contentType?: string;
  isDesignerUpload?: boolean;
}

export function DesignerFeedbackComments({
  submissionId,
  submissionTitle,
  contentType,
  isDesignerUpload = true,
}: DesignerFeedbackCommentsProps) {
  const { user, activeRole } = useAuth();
  const [comments, setComments] = useState<ContentComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New comment form state
  const [newCommentText, setNewCommentText] = useState("");
  const [category, setCategory] = useState<string>("visual_design");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [postSuccess, setPostSuccess] = useState(false);

  // Active filter tab: 'all' | 'pending' | 'resolved'
  const [filterTab, setFilterTab] = useState<"all" | "pending" | "resolved">("all");

  // Optional resolution note state for inline toggle
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
      setError(err?.message || "Failed to load reviewer feedback.");
    } finally {
      setLoading(false);
    }
  }, [submissionId]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  // Handle posting a new comment (Manager, Legal, Marketing, Designer)
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const created = await api.addSubmissionComment(submissionId, newCommentText.trim(), category);
      setComments((prev) => [created, ...prev]);
      setNewCommentText("");
      setPostSuccess(true);
      setTimeout(() => setPostSuccess(false), 3000);
    } catch (err: any) {
      console.error("Failed to post comment:", err);
      setError(err?.message || "Failed to submit comment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle toggling resolution tick sign (✓)
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
      console.error("Failed to toggle comment resolution:", err);
      setError(err?.message || "Could not update resolution status.");
    }
  };

  // Helper for quick suggestion insertion
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

  // Department / Role badge helper
  const renderDepartmentBadge = (role: string) => {
    const r = role.toLowerCase();
    if (r.includes("admin") || r.includes("manager")) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-navy/10 text-navy border border-navy/20 dark:bg-slate-800 dark:text-teal-light">
          <Building className="w-3 h-3 text-navy dark:text-teal-light" />
          <span>Manager</span>
        </span>
      );
    }
    if (r.includes("compliance") || r.includes("legal")) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-teal-50 text-teal-800 border border-teal-200 dark:bg-teal-950/40 dark:text-teal-300">
          <Scale className="w-3 h-3 text-teal" />
          <span>Legal &amp; Regulatory Dept</span>
        </span>
      );
    }
    if (r.includes("marketing")) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300">
          <Megaphone className="w-3 h-3 text-amber-600" />
          <span>Marketing Dept</span>
        </span>
      );
    }
    if (r.includes("designer")) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300">
          <Palette className="w-3 h-3 text-indigo-600" />
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

  // Category badge helper
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
        return <span className="text-[10px] uppercase font-bold text-ink-muted tracking-wider">Change Request</span>;
    }
  };

  return (
    <div className="bg-surface rounded-2xl border border-border shadow-subtle p-6 space-y-6">
      {/* Header and Progress Tracker */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal/10 border border-teal/20 flex items-center justify-center text-teal">
              <MessageSquarePlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-navy">
                Designer Change Requests &amp; Department Feedback
              </h3>
              <p className="text-xs text-ink-secondary">
                Manager, Legal, and Marketing comments on designer uploads with interactive resolution tracking (✓).
              </p>
            </div>
          </div>
        </div>

        {/* Progress Tracker Summary */}
        <div className="bg-workspace border border-border px-4 py-2.5 rounded-xl flex items-center gap-4">
          <div>
            <div className="flex items-center justify-between gap-3 text-xs">
              <span className="font-bold text-navy">Resolution Progress:</span>
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
              {pendingCount} Pending
            </div>
            <div className="text-[10px] text-ink-muted">To be done by designer</div>
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
            All Requests ({totalCount})
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
            <span>Action Required ({pendingCount})</span>
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
            <span>Resolved (✓ {resolvedCount})</span>
          </button>
        </div>

        <span className="text-[11px] text-ink-muted flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-teal" />
          <span>Click the tick sign (✓) on any request when changes are completed.</span>
        </span>
      </div>

      {/* New Comment / Change Request Box */}
      <form onSubmit={handleAddComment} className="bg-workspace rounded-xl p-4 border border-border space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-navy">Add Department Feedback:</span>
            {renderDepartmentBadge(activeRole || "manager")}
            <span className="text-xs text-ink-muted">
              ({user?.full_name || user?.email || "Reviewer"})
            </span>
          </div>

          {/* Category Dropdown */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-ink-muted">Feedback Topic:</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="bg-surface border border-border text-xs rounded-lg px-2.5 py-1 text-navy focus:outline-none focus:border-teal"
            >
              <option value="visual_design">🎨 Visual &amp; Asset Standards</option>
              <option value="legal_compliance">⚖️ Legal &amp; Statutory Compliance</option>
              <option value="copy_tone">📢 Tone &amp; Messaging</option>
              <option value="brand_rules">🏛️ Corporate Brand Standards</option>
              <option value="general">📝 General Change Request</option>
            </select>
          </div>
        </div>

        {/* Comment Text Area */}
        <textarea
          rows={3}
          value={newCommentText}
          onChange={(e) => setNewCommentText(e.target.value)}
          placeholder="Describe exactly what needs to be changed or fixed by the designer (e.g. 'Increase logo exclusion zone by 16px', 'Add mandatory FTC disclosure footnote', etc.)..."
          className="w-full bg-surface border border-border rounded-xl p-3 text-xs text-navy placeholder-ink-muted focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal resize-none"
        />

        {/* Quick Suggestion Pills */}
        <div className="flex items-center flex-wrap gap-1.5 pt-0.5">
          <span className="text-[10px] text-ink-muted font-bold uppercase tracking-wider">Quick Suggestions:</span>
          <button
            type="button"
            onClick={() =>
              applyQuickSuggestion(
                "Adjust contrast ratio on headline banner text to meet WCAG AA (minimum 4.5:1).",
                "visual_design"
              )
            }
            className="text-[11px] px-2 py-0.5 rounded-md bg-surface border border-border hover:border-teal text-ink-secondary hover:text-navy transition"
          >
            + WCAG Contrast Fix
          </button>
          <button
            type="button"
            onClick={() =>
              applyQuickSuggestion(
                "Add mandatory statutory claim disclaimer footnote: 'Tested under standard enterprise cluster configuration.'",
                "legal_compliance"
              )
            }
            className="text-[11px] px-2 py-0.5 rounded-md bg-surface border border-border hover:border-teal text-ink-secondary hover:text-navy transition"
          >
            + Legal Disclaimer
          </button>
          <button
            type="button"
            onClick={() =>
              applyQuickSuggestion(
                "Ensure primary corporate logo maintains minimum 32px clear exclusion zone on all four sides.",
                "brand_rules"
              )
            }
            className="text-[11px] px-2 py-0.5 rounded-md bg-surface border border-border hover:border-teal text-ink-secondary hover:text-navy transition"
          >
            + Logo Clear Space
          </button>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-between pt-1">
          {postSuccess && (
            <div className="text-xs text-teal font-semibold flex items-center gap-1">
              <Check className="w-3.5 h-3.5" />
              <span>Feedback posted and added to designer's change checklist!</span>
            </div>
          )}
          {!postSuccess && <div />}

          <button
            type="submit"
            disabled={!newCommentText.trim() || isSubmitting}
            className="px-4 py-2 bg-teal hover:bg-teal-hover text-white text-xs font-bold rounded-xl transition shadow-sm flex items-center gap-1.5 disabled:opacity-50"
          >
            <MessageSquarePlus className="w-3.5 h-3.5" />
            <span>{isSubmitting ? "Posting..." : "Post Change Request for Designer"}</span>
          </button>
        </div>
      </form>

      {/* Comments / Change Requests List */}
      <div className="space-y-3 pt-1">
        {loading ? (
          <div className="py-8 text-center text-xs text-ink-muted">
            <div className="w-6 h-6 border-2 border-teal border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <span>Loading reviewer comments and change tracker...</span>
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
                ? "All requested changes have been resolved by the designer!"
                : filterTab === "resolved"
                ? "No resolved comments yet."
                : "No comments posted on this asset yet."}
            </p>
            <p className="text-[11px] text-ink-secondary">
              Managers, Legal, and Marketing can leave feedback above to guide the designer.
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
                {/* Comment Header: Author, Department, Category, Status */}
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

                  {/* Resolution Status Badge */}
                  <div>
                    {comment.is_resolved ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>✓ Resolved</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300 dark:bg-amber-950/60 dark:text-amber-300">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        <span>⏳ Needs Designer Action</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Comment Text Content */}
                <div className="text-xs text-navy leading-relaxed mb-3 pl-1">
                  <p className={comment.is_resolved ? "text-ink-secondary" : "text-navy font-medium"}>
                    {comment.comment_text}
                  </p>
                </div>

                {/* Resolution Details & Tick Sign Controls */}
                <div className="pt-2 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  {/* Resolution Audit Trail */}
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
                        Waiting for designer to apply changes and mark as resolved.
                      </div>
                    )}
                  </div>

                  {/* Interactive Tick Sign Button */}
                  <div className="flex items-center gap-2">
                    {comment.is_resolved ? (
                      <button
                        type="button"
                        onClick={() => handleToggleResolve(comment.id, true)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-ink-muted hover:text-navy hover:bg-workspace rounded-lg transition"
                        title="Reopen if further revision is required"
                      >
                        <RotateCcw className="w-3 h-3 text-ink-muted" />
                        <span>Reopen Request</span>
                      </button>
                    ) : isBeingResolved ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={resolutionNoteInput}
                          onChange={(e) => setResolutionNoteInput(e.target.value)}
                          placeholder="Optional fix note (e.g. 'Updated vector asset')..."
                          className="text-xs bg-workspace border border-border rounded-lg px-2 py-1 w-48 focus:outline-none focus:border-teal"
                        />
                        <button
                          type="button"
                          onClick={() => handleToggleResolve(comment.id, false, resolutionNoteInput)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-lg transition inline-flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Confirm Fixed (✓)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setResolvingId(null)}
                          className="px-1.5 py-1 text-[11px] text-ink-muted hover:text-navy"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setResolvingId(comment.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-sm group"
                      >
                        <div className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                        <span>✓ Mark as Fixed by Designer</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
