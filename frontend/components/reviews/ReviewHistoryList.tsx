"use client";

import React, { useState, useMemo } from "react";
import { ContentComment, ContentSubmission } from "@/types";
import { VisualFeedbackCard } from "./VisualFeedbackCard";
import { DesignAssetViewerModal } from "./DesignAssetViewerModal";
import {
  Folder,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  Search,
  RotateCcw,
  Palette,
  Briefcase,
  Scale,
  Sparkles,
} from "lucide-react";

interface ReviewHistoryListProps {
  comments: ContentComment[];
  submissions: ContentSubmission[];
  onToggleResolve?: (commentId: string, currentStatus: boolean, note?: string) => Promise<void>;
  onRefresh?: () => void;
  isLoading?: boolean;
}

export function ReviewHistoryList({
  comments,
  submissions,
  onToggleResolve,
  onRefresh,
  isLoading = false,
}: ReviewHistoryListProps) {
  // Filter states
  const [statusFilter, setStatusFilter] = useState<"all" | "needs_changes" | "in_progress" | "completed">("all");
  const [selectedSubId, setSelectedSubId] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Asset viewer modal state
  const [viewerSubmission, setViewerSubmission] = useState<ContentSubmission | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  // Map submissions by ID for quick O(1) lookup
  const submissionsMap = useMemo(() => {
    const map = new Map<string, ContentSubmission>();
    for (const sub of submissions) {
      map.set(sub.id, sub);
    }
    return map;
  }, [submissions]);

  // Derive status counts based on actual feedback data
  const counts = useMemo(() => {
    let needsChanges = 0;
    let inProgress = 0;
    let completed = 0;

    for (const c of comments) {
      if (c.is_resolved) {
        completed++;
      } else if (c.resolution_note && !c.is_resolved) {
        inProgress++;
      } else {
        needsChanges++;
      }
    }

    return {
      all: comments.length,
      needs_changes: needsChanges,
      in_progress: inProgress,
      completed: completed,
    };
  }, [comments]);

  // Filtered comments (sorted newest first)
  const filteredComments = useMemo(() => {
    let result = [...comments];

    // Filter by status tab
    if (statusFilter === "completed") {
      result = result.filter((c) => c.is_resolved);
    } else if (statusFilter === "in_progress") {
      result = result.filter((c) => !c.is_resolved && Boolean(c.resolution_note));
    } else if (statusFilter === "needs_changes") {
      result = result.filter((c) => !c.is_resolved && !c.resolution_note);
    }

    // Filter by submission
    if (selectedSubId !== "all") {
      result = result.filter((c) => c.submission_id === selectedSubId);
    }

    // Filter by role
    if (roleFilter !== "all") {
      result = result.filter((c) => {
        const r = (c.author_role || "").toLowerCase();
        if (roleFilter === "manager") return r.includes("admin") || r.includes("manager");
        if (roleFilter === "marketing") return r.includes("marketing");
        if (roleFilter === "legal") return r.includes("compliance") || r.includes("legal");
        return true;
      });
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((c) => {
        const sub = submissionsMap.get(c.submission_id);
        const subTitle = (sub?.title || "").toLowerCase();
        const text = (c.comment_text || "").toLowerCase();
        const author = (c.author_name || "").toLowerCase();
        const cat = (c.category || "").toLowerCase();
        return (
          text.includes(q) ||
          subTitle.includes(q) ||
          author.includes(q) ||
          cat.includes(q)
        );
      });
    }

    // Sort newest first
    return result.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [comments, statusFilter, selectedSubId, roleFilter, searchQuery, submissionsMap]);

  const handleOpenViewer = (sub: ContentSubmission) => {
    setViewerSubmission(sub);
    setIsViewerOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Filter and Control Bar */}
      <div className="bg-surface rounded-2xl p-4 sm:p-5 border border-border shadow-subtle space-y-4">
        {/* Row 1: Status Filter Tabs with Actual Counts */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 pb-3">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => setStatusFilter("all")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                statusFilter === "all"
                  ? "bg-teal text-white shadow-xs"
                  : "bg-workspace text-ink-secondary hover:text-ink-primary border border-border"
              }`}
            >
              <span>All feedback</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  statusFilter === "all" ? "bg-white/20 text-white" : "bg-surface text-ink-muted"
                }`}
              >
                {counts.all}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter("needs_changes")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                statusFilter === "needs_changes"
                  ? "bg-amber-500 text-white shadow-xs"
                  : "bg-workspace text-ink-secondary hover:text-ink-primary border border-border"
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Needs changes</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  statusFilter === "needs_changes"
                    ? "bg-white/20 text-white"
                    : "bg-amber-500/10 text-amber-500"
                }`}
              >
                {counts.needs_changes}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter("in_progress")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                statusFilter === "in_progress"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-workspace text-ink-secondary hover:text-ink-primary border border-border"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>In progress</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  statusFilter === "in_progress"
                    ? "bg-white/20 text-white"
                    : "bg-blue-500/10 text-blue-400"
                }`}
              >
                {counts.in_progress}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter("completed")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                statusFilter === "completed"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-workspace text-ink-secondary hover:text-ink-primary border border-border"
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Completed</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  statusFilter === "completed"
                    ? "bg-white/20 text-white"
                    : "bg-emerald-500/10 text-emerald-500"
                }`}
              >
                {counts.completed}
              </span>
            </button>
          </div>

          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="p-1.5 rounded-lg bg-workspace hover:bg-surface border border-border text-ink-muted hover:text-ink-primary transition text-xs flex items-center gap-1 cursor-pointer"
              title="Refresh review feedback"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          )}
        </div>

        {/* Row 2: Secondary Filters (Design Asset selector, Reviewer Department selector, Search) */}
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Filter by Design Asset */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-ink-muted font-medium hidden sm:inline">
                Design:
              </span>
              <select
                value={selectedSubId}
                onChange={(e) => setSelectedSubId(e.target.value)}
                className="bg-workspace border border-border rounded-xl px-2.5 py-1.5 text-xs text-ink-primary focus:outline-none focus:border-teal max-w-[220px] truncate"
              >
                <option value="all">All Designs ({submissions.length})</option>
                {submissions.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter by Reviewer Role */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-ink-muted font-medium hidden sm:inline">
                Reviewer:
              </span>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="bg-workspace border border-border rounded-xl px-2.5 py-1.5 text-xs text-ink-primary focus:outline-none focus:border-teal"
              >
                <option value="all">All Reviewers</option>
                <option value="manager">Manager</option>
                <option value="marketing">Marketing</option>
                <option value="legal">Legal &amp; Compliance</option>
              </select>
            </div>
          </div>

          {/* Search box */}
          <div className="relative min-w-[220px] flex-1 sm:flex-initial">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search feedback or design..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-workspace border border-border text-ink-primary focus:outline-none focus:border-teal placeholder:text-ink-muted"
            />
          </div>
        </div>
      </div>

      {/* Review Feedback Cards Stream */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-12 text-ink-muted space-y-3 bg-surface rounded-2xl border border-border">
          <div className="w-8 h-8 rounded-full border-2 border-teal border-t-transparent animate-spin" />
          <p className="text-xs font-semibold">Loading review history cards...</p>
        </div>
      ) : filteredComments.length === 0 ? (
        /* Helpful Empty State */
        <div className="p-12 text-center bg-surface border border-border rounded-2xl space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-teal/10 border border-teal/20 flex items-center justify-center text-teal mx-auto shadow-inner">
            <Folder className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-ink-primary font-heading">
            {comments.length === 0
              ? "No feedback yet"
              : "No feedback matching this filter"}
          </h3>
          <p className="text-xs text-ink-secondary max-w-md mx-auto leading-relaxed">
            {comments.length === 0
              ? "Your submitted designs and reviewer feedback from Manager, Marketing, and Legal & Compliance will appear here."
              : "Try switching the status tab or clearing your search term to see other review feedback."}
          </p>
          {(statusFilter !== "all" || selectedSubId !== "all" || roleFilter !== "all" || searchQuery) && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setStatusFilter("all");
                  setSelectedSubId("all");
                  setRoleFilter("all");
                  setSearchQuery("");
                }}
                className="px-3.5 py-1.5 rounded-xl bg-workspace border border-border text-xs text-teal font-semibold hover:border-teal transition cursor-pointer"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredComments.map((comment) => {
            const sub = submissionsMap.get(comment.submission_id);
            return (
              <VisualFeedbackCard
                key={comment.id}
                comment={comment}
                submission={sub}
                onOpenViewer={handleOpenViewer}
                onToggleResolve={onToggleResolve}
              />
            );
          })}
        </div>
      )}

      {/* Design Asset Viewer Modal */}
      <DesignAssetViewerModal
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
        submission={viewerSubmission}
        canAuthorize={false}
      />
    </div>
  );
}
