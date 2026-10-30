"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ContentSubmission, BrandGuidelineProfile, AuditResult } from "@/types";
import { api } from "@/services/api";
import { useAuth } from "@/services/auth-context";
import {
  Palette,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { BrandStandardsAndVisualAnalysis } from "@/components/designer/BrandStandardsAndVisualAnalysis";

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

<<<<<<< HEAD
  const [guidelineProfile, setGuidelineProfile] = useState<BrandGuidelineProfile | null>(null);
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);

  // Load brand guidelines profile
  useEffect(() => {
    api.getGuidelineProfile().then(setGuidelineProfile).catch((err) => {
      console.warn("Failed to load guideline profile:", err);
    });
  }, []);

  // Synchronize visual audit for the active submission
  useEffect(() => {
    if (activeSubmission?.id) {
      api.getAudit(activeSubmission.id)
        .then(setAuditResult)
        .catch(() => setAuditResult(null));
    } else {
      setAuditResult(null);
    }
  }, [activeSubmission?.id]);

  const handleRunVisualAudit = async () => {
    if (!activeSubmission?.id) return;
    setIsAuditing(true);
    try {
      const res = await api.triggerAudit(activeSubmission.id);
      setAuditResult(res);
    } catch (err: any) {
      console.warn("Visual audit trigger failed:", err);
    } finally {
      setIsAuditing(false);
    }
  };
=======
>>>>>>> 83a65e189b2c5eb7f9f2b7c2702f006bbaa49626

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
            Review stakeholder suggestions, address change requests, and verify artwork before final campaign launch. For brand design standards, live copilot, and automated visual audit, visit Designer Studio &amp; Copilot.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Link
            href="/designer"
            className="px-4 py-2.5 rounded-xl bg-teal hover:bg-teal/90 text-white text-xs font-bold transition flex items-center gap-2 shadow-subtle cursor-pointer"
          >
            <Palette className="w-4 h-4" />
            <span>Open Designer Studio &amp; Copilot ↗</span>
          </Link>
          <Link
            href="/media-audit"
            className="px-4 py-2.5 rounded-xl bg-workspace hover:bg-surface border border-border text-ink-primary text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-teal" />
            <span>Media Audit</span>
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

      {/* Relocated Quick Brand Design Standards & AI Visual Analysis */}
      <BrandStandardsAndVisualAnalysis
        guidelineProfile={guidelineProfile}
        auditResult={auditResult}
        isAuditing={isAuditing}
        activeAssetTitle={activeSubmission?.title || "Enterprise Creative Artwork"}
        activeAssetPreviewUrl={activeSubmission?.media_url || activeSubmission?.file_path || null}
        activeAssetSub={activeSubmission}
        availableAssets={designerSubmissions}
        onSelectAsset={(sub) => setSelectedSubId(sub.id)}
        onRunVisualAudit={handleRunVisualAudit}
      />
    </div>
  );
}
