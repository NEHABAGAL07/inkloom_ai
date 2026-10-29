"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ContentSubmission } from "@/types";
import { useAuth } from "@/services/auth-context";
import {
  Palette,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { DesignerFeedbackComments } from "@/components/reviews/DesignerFeedbackComments";

interface DesignerDashboardProps {
  submissions: ContentSubmission[];
  onRefresh: () => void;
}

export function DesignerDashboard({ submissions, onRefresh }: DesignerDashboardProps) {
  const { activeOrgName } = useAuth();
  const [selectedSubId, setSelectedSubId] = useState<string | null>(null);

  const designerSubmissions = submissions.filter(
    (s) => s.content_type === "image" || s.content_type === "video" || s.content_type === "document"
  );

  // Synchronize dynamic asset updates
  useEffect(() => {
    const handleAssetUpdate = () => {
      onRefresh();
    };
    if (typeof window !== "undefined") {
      window.addEventListener("inkloom_asset_updated", handleAssetUpdate);
      return () => window.removeEventListener("inkloom_asset_updated", handleAssetUpdate);
    }
  }, [onRefresh]);

  const activeSubmission =
    designerSubmissions.find((s) => s.id === selectedSubId) ||
    designerSubmissions[0] ||
    null;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Designer Workspace Header */}
      <div className="bg-surface rounded-2xl p-6 sm:p-7 border border-border shadow-subtle relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal/10 border border-teal/20 text-teal text-xs font-bold font-mono">
            <Palette className="w-3.5 h-3.5" />
            <span>Designer Workspace • {activeOrgName || "Acme Cloud Systems"}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink-primary font-heading tracking-tight">
            Creative Review &amp; Feedback Hub
          </h1>
          <p className="text-xs sm:text-sm text-ink-secondary leading-relaxed max-w-2xl">
            Review stakeholder suggestions, address change requests, and verify artwork before final campaign launch. For automated visual compliance, color tokens, and font specs, visit the dedicated Media Audit section.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Link
            href="/media-audit"
            className="px-4 py-2.5 rounded-xl bg-teal hover:bg-teal/90 text-white text-xs font-bold transition flex items-center gap-2 shadow-subtle cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Open Media Audit &amp; Guidelines ↗</span>
          </Link>
          <button
            onClick={onRefresh}
            className="p-2.5 rounded-xl bg-workspace hover:bg-surface border border-border text-ink-secondary hover:text-ink-primary transition shadow-xs cursor-pointer"
            title="Refresh submissions"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Design Submission Switcher (when multiple designs exist) */}
      {designerSubmissions.length > 1 && (
        <div className="bg-surface border border-border rounded-xl p-3 shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold text-ink-muted uppercase tracking-wider font-mono">
              Active Design:
            </span>
            <div className="flex flex-wrap gap-2">
              {designerSubmissions.map((sub) => {
                const isSelected = sub.id === (activeSubmission?.id);
                return (
                  <button
                    key={sub.id}
                    onClick={() => setSelectedSubId(sub.id)}
                    className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition border flex items-center gap-2 cursor-pointer ${
                      isSelected
                        ? "bg-teal/15 text-teal border-teal/40 shadow-xs"
                        : "bg-workspace text-ink-secondary border-border hover:text-ink-primary hover:border-border/80"
                    }`}
                  >
                    <span className="truncate max-w-[220px]">{sub.title}</span>
                    <span
                      className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-mono font-bold ${
                        sub.status === "approved"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : sub.status === "submitted"
                          ? "bg-blue-500/20 text-blue-400"
                          : "bg-amber-500/20 text-amber-400"
                      }`}
                    >
                      {sub.status.replace("_", " ")}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
          <span className="text-xs text-ink-muted">
            {designerSubmissions.length} design submissions
          </span>
        </div>
      )}

      {/* Active Design Studio (Suggestions for Designer block removed; kept exclusively in Review History) */}
      {activeSubmission ? (
        <DesignerFeedbackComments
          key={activeSubmission.id}
          submissionId={activeSubmission.id}
          submissionTitle={activeSubmission.title}
          contentType={activeSubmission.content_type}
          description={activeSubmission.description}
          rawText={activeSubmission.raw_text}
          fileName={activeSubmission.file_name}
          mediaUrl={activeSubmission.media_url}
          submission={activeSubmission}
          hideSuggestions={true}
        />
      ) : (
        <div className="p-12 text-center bg-surface border border-border rounded-2xl space-y-3">
          <Palette className="w-10 h-10 text-teal/40 mx-auto" />
          <h3 className="text-base font-bold text-ink-primary">No active design submissions found</h3>
          <p className="text-xs text-ink-secondary max-w-md mx-auto">
            Upload graphics, banners, or video assets in the Media Audit section to begin automated visual scanning and receive team feedback.
          </p>
          <div className="pt-2">
            <Link
              href="/media-audit"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal text-white text-xs font-bold hover:bg-teal/90 transition shadow-subtle"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Go to Media Audit</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
