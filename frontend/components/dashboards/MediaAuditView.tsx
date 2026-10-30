"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ApprovedAsset, ContentSubmission, AuditResult, BrandGuidelineProfile } from "@/types";
import { api } from "@/services/api";
import { useAuth } from "@/services/auth-context";
import {
  Palette,
  Image as ImageIcon,
  UploadCloud,
  CheckCircle,
  AlertTriangle,
  Layers,
  ShieldCheck,
  Eye,
  RefreshCw,
  Check,
  BookOpen,
  ExternalLink,
  FileText,
} from "lucide-react";
import { DesignAssetViewerModal } from "@/components/reviews/DesignAssetViewerModal";
import { BrandGuidelinesViewer } from "@/components/guidelines/BrandGuidelinesViewer";

interface MediaAuditViewProps {
  submissions: ContentSubmission[];
  onRefresh: () => void;
}

export function MediaAuditView({ submissions, onRefresh }: MediaAuditViewProps) {
  const { activeOrgName } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditFeedback, setAuditFeedback] = useState<string | null>(null);
  const [updatingSubId, setUpdatingSubId] = useState<string | null>(null);

  // Main Section Tab: 'audit' (media auditing & scanner) vs 'guidelines' (full brand guidelines viewer)
  const [activeMainTab, setActiveMainTab] = useState<"audit" | "guidelines">("audit");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("tab") === "guidelines") {
        setActiveMainTab("guidelines");
      }
    }
  }, []);

  // Brand Guidelines Profile
  const [guidelineProfile, setGuidelineProfile] = useState<BrandGuidelineProfile | null>(null);

  // Active AI Audit state for inspection
  const [activeAudit, setActiveAudit] = useState<AuditResult | null>(null);
  const [activeAuditSub, setActiveAuditSub] = useState<ContentSubmission | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Asset Viewer Modal state
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [viewingSub, setViewingSub] = useState<ContentSubmission | null>(null);

  useEffect(() => {
    async function loadBrandGuidelines() {
      try {
        const profile = await api.getGuidelineProfile();
        setGuidelineProfile(profile);
      } catch (err) {
        console.warn("Failed to load guideline profile:", err);
      }
    }
    loadBrandGuidelines();
  }, []);

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

  // Auto-load audit for the most recent visual submission if not yet loaded
  useEffect(() => {
    async function loadInitialAudit() {
      if (!activeAudit && designerSubmissions.length > 0) {
        const first = designerSubmissions[0];
        try {
          const res = await api.getAudit(first.id);
          setActiveAudit(res);
          setActiveAuditSub(first);
        } catch (e) {
          console.warn("Could not load initial visual audit", e);
        }
      }
    }
    loadInitialAudit();
  }, [designerSubmissions.length, activeAudit]);

  const handleMediaAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;
    setIsAuditing(true);
    setAuditFeedback(null);
    try {
      // 1. Upload file via multipart/form-data to persistent backend storage and database
      const media = await api.uploadMedia(selectedFile, {
        title: `Design Asset: ${selectedFile.name}`,
        description: `Visual brand asset submission (${selectedFile.type || "image/png"})`,
      });

      const submissionId = media.submission_id || media.id;

      // 2. Trigger AI media audit immediately on the real database record
      try {
        const auditRes = await api.triggerAudit(submissionId);
        setActiveAudit(auditRes);
      } catch (auditErr) {
        console.warn("Audit triggered with warning:", auditErr);
      }

      setAuditFeedback(
        `✓ '${selectedFile.name}' (${(selectedFile.size / 1024).toFixed(1)} KB) persistently stored in database [ID: ${media.id}]. Visible to Admin dashboard.`
      );
      setSelectedFile(null);
      onRefresh();
    } catch (err: any) {
      alert(err.message || "Upload failed. Please verify connection to backend.");
    } finally {
      setIsAuditing(false);
    }
  };

  const handleLoadSampleMockup = async () => {
    try {
      const response = await fetch("/inkloom-feather-cute@2x.png");
      const blob = await response.blob();
      const sampleFile = new File([blob], "summer-campaign-banner.png", { type: "image/png" });
      setSelectedFile(sampleFile);
      setAuditFeedback("Loaded sample creative asset. Ready to submit to Media Audit Engine.");
    } catch (e: any) {
      console.warn("Could not load sample asset", e);
    }
  };

  const handleUpdateImageFromDashboard = async (sub: ContentSubmission, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUpdatingSubId(sub.id);
    try {
      // Persistently upload updated version to backend storage
      const media = await api.uploadMedia(file, {
        title: file.name,
        description: `Revision update for submission ${sub.title}`,
      });

      await api.createRevision(sub.id, {
        raw_text: `Updated media: ${file.name}`,
        file_name: file.name,
        file_path: media.media_url || media.file_path,
        file_size_bytes: file.size,
      });

      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("inkloom_asset_updated", {
            detail: { submissionId: sub.id, mediaUrl: media.media_url, fileName: file.name },
          })
        );
      }

      setAuditFeedback(`✓ Updated image '${file.name}' persistently saved to database (ID: ${media.id})!`);
      onRefresh();
    } catch (err: any) {
      alert(err?.message || "Failed to update image");
    } finally {
      setUpdatingSubId(null);
    }
  };

  const handleInspectAudit = async (sub: ContentSubmission) => {
    try {
      const res = await api.getAudit(sub.id);
      setActiveAudit(res);
      setActiveAuditSub(sub);
      setIsModalOpen(true);
    } catch (e) {
      console.error("Failed to load audit for submission", e);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* =========================================================================
          PERFECT CLEAR HEADLINE & WORKSPACE INTRO
          ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border">
        <div className="space-y-1.5">
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-teal/15 text-teal border border-teal/20 font-mono">
              Brand Governance, Guidelines &amp; Asset Validation
            </span>
            <span className="text-xs text-ink-muted">•</span>
            <span className="text-xs font-semibold text-ink-secondary">
              {activeOrgName || "Acme Cloud Systems"}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink-primary tracking-tight font-heading">
            Media Audit &amp; Guidelines
          </h1>
          <p className="text-xs sm:text-sm text-ink-secondary max-w-3xl leading-relaxed">
            Unified brand governance suite: inspect official brand identity, typography, and color tokens, while running automated visual compliance audits on marketing banners, graphics, and video media before release.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="bg-surface border border-border rounded-xl px-4 py-2.5 text-center shadow-xs">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-ink-muted font-mono">
              Compliance Standard
            </span>
            <span className="text-xs font-bold text-teal flex items-center justify-center gap-1 mt-0.5 font-mono">
              <ShieldCheck className="w-3.5 h-3.5" /> WCAG 2.2 AA Verified
            </span>
          </div>
          <button
            type="button"
            onClick={() => setActiveMainTab((prev) => (prev === "audit" ? "guidelines" : "audit"))}
            className="px-3.5 py-2.5 text-xs font-bold rounded-xl bg-teal/10 hover:bg-teal/20 text-teal border border-teal/30 transition flex items-center gap-2 shadow-xs cursor-pointer"
          >
            {activeMainTab === "audit" ? (
              <>
                <BookOpen className="w-4 h-4 text-teal" />
                <span>View Full Guidelines (9)</span>
              </>
            ) : (
              <>
                <UploadCloud className="w-4 h-4 text-teal" />
                <span>Back to Media Audit</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* =========================================================================
          SECTION NAVIGATION SWITCHER
          ========================================================================= */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-surface border border-border p-1.5 rounded-2xl shadow-subtle">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveMainTab("audit")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeMainTab === "audit"
                ? "bg-teal text-white shadow-subtle"
                : "bg-workspace text-ink-secondary hover:text-ink-primary hover:bg-surface border border-border"
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            <span>Media Audit &amp; Asset Scanner</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveMainTab("guidelines")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeMainTab === "guidelines"
                ? "bg-teal text-white shadow-subtle"
                : "bg-workspace text-ink-secondary hover:text-ink-primary hover:bg-surface border border-border"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Official Brand Guidelines</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                activeMainTab === "guidelines"
                  ? "bg-white/20 text-white"
                  : "bg-teal/15 text-teal"
              }`}
            >
              9 Modules
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2 pr-2">
          <span className="text-xs text-ink-muted font-mono hidden sm:inline">
            Version {guidelineProfile?.version || "1.0"} • Certified
          </span>
        </div>
      </div>

      {/* =========================================================================
          TAB 1: MEDIA AUDIT & ASSET SCANNER
          ========================================================================= */}
      {activeMainTab === "audit" && (
        <div className="space-y-6 animate-in fade-in">
          {/* =========================================================================
              MEDIA AUDIT INGESTION & CREATIVE ASSETS STATUS PIPELINE
              ========================================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Upload Creative Asset for Visual Audit */}
        <div className="lg:col-span-5 bg-surface border border-border rounded-2xl p-6 shadow-subtle space-y-4">
          <div className="pb-3 border-b border-border">
            <h2 className="text-sm font-bold text-ink-primary flex items-center gap-2">
              <UploadCloud className="w-4 h-4 text-teal" />
              <span>Media Audit Ingestion</span>
            </h2>
            <p className="text-xs text-ink-muted mt-0.5">
              Enforces file limits (25MB), checks contrast ratio, and inspects video transcript heuristics.
            </p>
          </div>

          {auditFeedback && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl flex items-center gap-2 animate-in fade-in">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{auditFeedback}</span>
            </div>
          )}

          <form onSubmit={handleMediaAudit} className="space-y-4">
            <div className="border-2 border-dashed border-border hover:border-teal rounded-2xl p-6 text-center cursor-pointer transition-colors bg-workspace">
              <input
                type="file"
                id="media-audit-file-input"
                className="hidden"
                accept="image/png,image/jpeg,image/webp,video/mp4,application/pdf"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              />
              <label htmlFor="media-audit-file-input" className="cursor-pointer space-y-2 block">
                <ImageIcon className="w-8 h-8 text-amber-500 mx-auto" />
                <div className="text-xs font-bold text-ink-primary">
                  {selectedFile ? selectedFile.name : "Select Graphic, Banner, or Video"}
                </div>
                <div className="text-[10px] text-ink-muted">
                  PNG, JPG, WEBP, MP4, PDF (Max 25MB)
                </div>
              </label>
              <div className="mt-3">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    handleLoadSampleMockup();
                  }}
                  className="text-[11px] font-semibold text-teal hover:underline px-2.5 py-1 rounded bg-teal/10 hover:bg-teal/20 transition cursor-pointer"
                >
                  Or load sample creative asset for testing
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={!selectedFile || isAuditing}
              className="w-full py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-subtle transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isAuditing ? "Processing with MediaExtractor & AI..." : "Submit to Media Audit Engine →"}
            </button>
          </form>
        </div>

        {/* Right: Creative Submissions Pipeline */}
        <div className="lg:col-span-7 bg-surface border border-border rounded-2xl p-6 shadow-subtle space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <h2 className="text-sm font-bold text-ink-primary flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-amber-500" />
              <span>Creative Assets &amp; Revisions Status</span>
            </h2>
            <button
              onClick={onRefresh}
              className="text-xs text-teal hover:text-teal/80 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Refresh</span>
            </button>
          </div>

          <div className="divide-y divide-border">
            {designerSubmissions.length > 0 ? (
              designerSubmissions.map((sub) => (
                <div
                  key={sub.id}
                  className="py-3 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-workspace px-3 rounded-xl transition-all gap-2.5 sm:gap-3"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="text-sm font-bold text-ink-primary flex items-center gap-2">
                      <span className="truncate">{sub.title}</span>
                      <span className="text-[10px] text-ink-muted uppercase px-1.5 py-0.5 rounded bg-workspace border border-border shrink-0 font-mono">
                        {sub.content_type}
                      </span>
                    </div>
                    <div className="text-xs text-ink-secondary truncate">{sub.description}</div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto shrink-0">
                    <span className="text-[11px] px-2 py-0.5 rounded-full font-bold bg-workspace text-ink-secondary border border-border capitalize whitespace-nowrap">
                      {sub.status.replace("_", " ")}
                    </span>
                    <button
                      onClick={() => {
                        setViewingSub(sub);
                        setIsViewerOpen(true);
                      }}
                      className="text-xs px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-semibold transition flex items-center gap-1 shadow-subtle cursor-pointer"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Open</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInspectAudit(sub)}
                      className="text-xs px-2.5 py-1 bg-teal/15 hover:bg-teal/25 text-teal border border-teal/30 rounded-lg font-semibold transition flex items-center gap-1 shadow-xs cursor-pointer"
                      title="Inspect AI visual audit findings"
                    >
                      <ShieldCheck className="w-3 h-3" />
                      <span>Audit</span>
                    </button>
                    <label
                      htmlFor={`media-update-input-${sub.id}`}
                      className="cursor-pointer text-xs px-2.5 py-1 bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-400 border border-indigo-500/30 rounded-lg font-semibold transition flex items-center gap-1 shadow-sm"
                      title="Upload an updated graphic or new visual revision"
                    >
                      <UploadCloud className="w-3 h-3 text-indigo-400" />
                      <span>{updatingSubId === sub.id ? "Updating..." : "Update Image"}</span>
                    </label>
                    <input
                      id={`media-update-input-${sub.id}`}
                      type="file"
                      accept="image/*,.png,.jpg,.jpeg,.webp,.svg"
                      className="hidden"
                      onChange={(e) => handleUpdateImageFromDashboard(sub, e)}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-xs text-ink-muted">
                No visual assets currently in review. Upload an image or video asset above.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )}

      {/* =========================================================================
          TAB 2: OFFICIAL BRAND GUIDELINES (Full 9 Modules Viewer)
          ========================================================================= */}
      {activeMainTab === "guidelines" && (
        <div className="animate-in fade-in space-y-6">
          {guidelineProfile ? (
            <BrandGuidelinesViewer profile={guidelineProfile} />
          ) : (
            <div className="max-w-6xl mx-auto py-24 text-center bg-surface border border-border rounded-2xl">
              <div className="inline-block w-8 h-8 border-2 border-teal border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-xs font-semibold text-ink-muted">
                Loading authoritative brand governance profile...
              </p>
            </div>
          )}
        </div>
      )}

      {/* Full-Stage Design Asset Viewer Modal */}
      <DesignAssetViewerModal
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
        submission={viewingSub}
        canAuthorize={false}
      />

      {/* AI Audit Findings Modal */}
      {isModalOpen && activeAudit && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-surface border border-border rounded-2xl max-w-2xl w-full p-6 shadow-xl space-y-5 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-teal">AI Visual Audit Inspection</div>
                <h3 className="text-lg font-bold text-ink-primary mt-0.5">{activeAuditSub?.title || activeAudit.content_id}</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-ink-muted hover:text-ink-primary p-1 rounded-lg text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Score & Verdict */}
            <div className="p-4 rounded-xl bg-workspace border border-border space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-ink-muted font-semibold">Governance Verdict</span>
                <span className="text-xs font-bold text-teal">Score: {activeAudit.summary?.compliance_score ?? 100}%</span>
              </div>
              <p className="text-xs text-ink-primary leading-relaxed italic">
                &quot;{activeAudit.summary?.verdict_overview || "Audit passed visual checks."}&quot;
              </p>
            </div>

            {/* Findings List */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase text-ink-muted tracking-wider">
                Audited Findings ({activeAudit.findings?.length || 0})
              </h4>
              {(activeAudit.findings || []).map((f) => (
                <div key={f.id} className="p-3 bg-workspace border border-border rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-ink-primary">{f.title}</span>
                    <span
                      className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                        f.severity === "high" || f.severity === "critical"
                          ? "bg-red-500/10 text-red-400 border-red-500/20"
                          : f.severity === "medium"
                          ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                      }`}
                    >
                      {f.severity}
                    </span>
                  </div>
                  <p className="text-xs text-ink-secondary">{f.message}</p>
                  {f.suggested_correction && (
                    <div className="text-xs p-2 rounded-lg bg-surface border border-border text-emerald-400 font-medium">
                      <strong>AI Suggestion:</strong> &quot;{f.suggested_correction.replacement_text}&quot;
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-end gap-3 border-t border-border">
              <a
                href={`/audits?id=${activeAudit.content_id}`}
                className="px-4 py-2 bg-workspace hover:bg-surface text-ink-primary font-bold text-xs rounded-xl border border-border transition"
              >
                Open Full Findings Page ↗
              </a>
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-teal hover:bg-teal/90 text-white font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
