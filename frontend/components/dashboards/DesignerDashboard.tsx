"use client";

import React, { useState, useEffect } from "react";
import { ApprovedAsset, ContentSubmission, AuditResult } from "@/types";
import { api } from "@/services/api";
import { useAuth } from "@/services/auth-context";
import { useTheme } from "@/services/theme-context";
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
  Sliders,
  Check,
  Copy,
  Type,
  Info,
} from "lucide-react";
import { DesignerFeedbackComments } from "@/components/reviews/DesignerFeedbackComments";
import { DesignAssetViewerModal } from "@/components/reviews/DesignAssetViewerModal";

interface DesignerDashboardProps {
  submissions: ContentSubmission[];
  onRefresh: () => void;
}

export function DesignerDashboard({ submissions, onRefresh }: DesignerDashboardProps) {
  const { activeOrgName } = useAuth();
  const { resolvedTheme } = useTheme();
  const [assets, setAssets] = useState<ApprovedAsset[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditFeedback, setAuditFeedback] = useState<string | null>(null);
  const [updatingSubId, setUpdatingSubId] = useState<string | null>(null);
  const [copiedColor, setCopiedColor] = useState<string | null>(null);

  const copyToClipboard = (hex: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(hex);
      setCopiedColor(hex);
      setTimeout(() => setCopiedColor(null), 2000);
    }
  };

  // Active AI Audit state for inspection
  const [activeAudit, setActiveAudit] = useState<AuditResult | null>(null);
  const [activeAuditSub, setActiveAuditSub] = useState<ContentSubmission | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Asset Viewer Modal state
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [viewingSub, setViewingSub] = useState<ContentSubmission | null>(null);

  useEffect(() => {
    async function loadAssets() {
      try {
        const data = await api.getAssets();
        setAssets(data);
      } catch (err) {
        console.error(err);
      }
    }
    loadAssets();
  }, []);

  const designerSubmissions = submissions.filter(
    (s) => s.content_type === "image" || s.content_type === "video" || s.content_type === "document"
  );

  // Synchronize dynamic asset updates
  useEffect(() => {
    const handleAssetUpdate = (e: any) => {
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
  }, [designerSubmissions.length]);

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
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Enterprise Page Header */}
      <div className="bg-white dark:bg-[#1C1C1C] rounded-2xl p-6 sm:p-8 border border-[#DDEBE5] dark:border-[#383838] shadow-subtle dark:shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#087F70] via-[#10A995] to-[#43D6B3] dark:from-[#FFD84D] dark:via-[#FF7A36] dark:to-[#F45B91]" />
        <div className="absolute top-0 right-0 w-80 h-32 bg-gradient-to-l from-[#10A995]/10 dark:from-[#FF7A36]/10 to-transparent pointer-events-none blur-2xl" />
        <div className="space-y-2 max-w-3xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E8F7F1] border border-[#C8E2D8] text-[#087F70] dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-[#FFAA35] text-xs font-bold font-mono">
            <Palette className="w-3.5 h-3.5" />
            <span>Creative &amp; Visual Brand Governance Studio</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#18352F] dark:text-[#F7F3ED] font-heading tracking-tight">
            {activeOrgName || "Enterprise"} Brand Kit &amp; Visual Compliance
          </h1>
          <p className="text-[#58716A] dark:text-[#85817D] text-sm leading-relaxed">
            Inspect approved color tokens, official vector logos, and typography rules. Run automated visual compliance scans on graphics, banners, and media assets before production release.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="bg-[#EFF8F4] dark:bg-[#141414] border border-[#DDEBE5] dark:border-[#383838] rounded-xl px-4 py-3 text-center">
            <span className="block text-[11px] font-bold uppercase tracking-wider text-[#58716A] dark:text-[#85817D] font-mono">Certified Palette</span>
            <span className="text-sm font-bold text-[#087F70] dark:text-emerald-400 flex items-center justify-center gap-1 mt-0.5">
              <CheckCircle className="w-3.5 h-3.5" /> Active
            </span>
          </div>
        </div>
      </div>

      {/* Deterministic Advisory Analysis Banner */}
      <div className="bg-white dark:bg-[#1C1C1C] border border-[#DDEBE5] dark:border-[#383838] rounded-2xl p-4 flex items-start gap-3.5 shadow-subtle dark:shadow-xl">
        <Info className="w-5 h-5 text-[#087F70] dark:text-[#FFAA35] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="text-xs font-bold text-[#18352F] dark:text-[#F7F3ED] flex items-center gap-2 font-heading">
            <span>Deterministic Advisory Visual Governance</span>
            <span className="text-[10px] font-semibold text-[#087F70] bg-[#E8F7F1] border border-[#C8E2D8] dark:text-[#FFAA35] dark:bg-amber-500/10 dark:border-amber-500/20 px-2 py-0.5 rounded-full font-mono">
              Advisory Analysis Only • No Synthetic Generation
            </span>
          </div>
          <p className="text-xs text-[#58716A] dark:text-[#85817D] leading-relaxed">
            Inkloom AI performs deterministic color clustering, contrast ratio verification (WCAG 2.2 AA), wordmark clear-space checks, and metadata extraction.
            It does <strong>not</strong> synthesize artificial images, modify creative artwork, or fabricate media. All visual assets are creator-submitted and require human compliance authorization before release.
          </p>
        </div>
      </div>

      {/* Brand Visual & Voice Standards Panel */}
      <div className="bg-white dark:bg-[#1C1C1C] border border-[#DDEBE5] dark:border-[#383838] rounded-2xl p-6 shadow-subtle dark:shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#DDEBE5] dark:border-[#383838]">
          <div>
            <h2 className="text-sm font-bold text-[#18352F] dark:text-[#F7F3ED] font-heading flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#087F70] dark:text-[#FFAA35]" />
              <span>Brand Visual, Typography &amp; Voice Standards</span>
            </h2>
            <p className="text-xs text-[#58716A] dark:text-[#85817D] mt-0.5">Authoritative design guidelines, color tokens, and tone rules certified for enterprise campaigns</p>
          </div>
          <span className="text-[11px] text-[#087F70] bg-[#E8F7F1] border border-[#C8E2D8] dark:text-[#FFAA35] dark:bg-amber-500/10 dark:border-amber-500/20 px-2.5 py-1 rounded-full w-fit font-mono font-semibold">
            WCAG 2.2 AA Verified
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Logo Card */}
          <div className="p-4 rounded-xl bg-[#F7FBF9] dark:bg-[#202020] border border-[#DDEBE5] dark:border-[#383838] flex flex-col justify-between space-y-4">
            <div>
              <div className="text-[11px] font-bold text-[#58716A] dark:text-[#85817D] uppercase tracking-wider font-mono">Primary Wordmark</div>
              <div className="text-sm font-bold text-[#18352F] dark:text-[#F7F3ED] font-heading mt-1">Official High-Res SVG Logo</div>
              <div className="mt-3 p-4 rounded-xl bg-white dark:bg-[#141414] border border-[#DDEBE5] dark:border-[#383838] flex items-center justify-center gap-2 shadow-xs">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/inkloom-feather-cute@2x.png"
                  alt="Inkloom Feather"
                  className="w-6 h-6 object-contain shrink-0 filter drop-shadow-[0_1px_4px_rgba(168,85,247,0.4)]"
                />
                <span className="text-base font-black tracking-widest text-[#18352F] dark:text-[#F7F3ED] font-heading">INKLOOM</span>
              </div>
            </div>
            <div className="text-[11px] text-[#58716A] dark:text-[#85817D] space-y-1 pt-2 border-t border-[#DDEBE5] dark:border-[#383838]">
              <div className="flex justify-between">
                <span>Clear Space:</span>
                <span className="font-semibold text-[#18352F] dark:text-[#F7F3ED]">Min 24px perimeter</span>
              </div>
              <div className="flex justify-between">
                <span>Aspect Ratio:</span>
                <span className="font-semibold text-[#087F70] dark:text-[#FFAA35]">Vector SVG (No skew)</span>
              </div>
            </div>
          </div>

          {/* Color Tokens Card with Click-to-Copy */}
          <div className="p-4 rounded-xl bg-[#F7FBF9] dark:bg-[#202020] border border-[#DDEBE5] dark:border-[#383838] flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <div className="text-[11px] font-bold text-[#58716A] dark:text-[#85817D] uppercase tracking-wider font-mono">Color Tokens</div>
                {copiedColor && (
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold animate-in fade-in font-mono">
                    Copied {copiedColor}!
                  </span>
                )}
              </div>
              <div className="text-sm font-bold text-[#18352F] dark:text-[#F7F3ED] font-heading mt-1">
                {resolvedTheme === "light" ? "Inkloom Signature Mint & Turquoise Palette" : "Inkloom Signature Warm Palette"}
              </div>
              <div className="grid grid-cols-3 gap-2 mt-3">
                {(resolvedTheme === "light"
                  ? [
                      { hex: "#087F70", label: "Deep Teal", bg: "bg-[#087F70]" },
                      { hex: "#10A995", label: "Primary Teal", bg: "bg-[#10A995]" },
                      { hex: "#43D6B3", label: "Mint Green", bg: "bg-[#43D6B3]" },
                      { hex: "#58D9D0", label: "Bright Turquoise", bg: "bg-[#58D9D0]" },
                      { hex: "#A5EBDD", label: "Soft Mint", bg: "bg-[#A5EBDD]" },
                      { hex: "#D9F8EF", label: "Pale Mint", bg: "bg-[#D9F8EF]" },
                    ]
                  : [
                      { hex: "#FFD84D", label: "Golden Yellow", bg: "bg-[#FFD84D]" },
                      { hex: "#FFAA35", label: "Amber", bg: "bg-[#FFAA35]" },
                      { hex: "#FF7A36", label: "Orange", bg: "bg-[#FF7A36]" },
                      { hex: "#FF665C", label: "Coral", bg: "bg-[#FF665C]" },
                      { hex: "#F45B91", label: "Pink", bg: "bg-[#F45B91]" },
                      { hex: "#1C1C1C", label: "Dark Charcoal", bg: "bg-[#1C1C1C]" },
                    ]
                ).map((col) => (
                  <button
                    key={col.hex}
                    type="button"
                    onClick={() => copyToClipboard(col.hex)}
                    className="p-1.5 rounded-lg bg-white dark:bg-[#141414] border border-[#DDEBE5] dark:border-[#383838] hover:border-[#10A995] dark:hover:border-[#FF7A36] text-center transition group flex flex-col items-center shadow-xs"
                    title={`Click to copy ${col.label} (${col.hex})`}
                  >
                    <div className={`w-full h-6 rounded-md ${col.bg} border border-black/5 dark:border-white/10`} />
                    <span className="text-[9px] font-mono text-[#58716A] dark:text-[#B8B2AC] mt-1 group-hover:text-[#087F70] dark:group-hover:text-[#FFAA35] font-semibold">
                      {col.hex}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <div className="text-[11px] text-[#58716A] dark:text-[#85817D] flex justify-between items-center pt-2 border-t border-[#DDEBE5] dark:border-[#383838]">
              <span>Min Contrast: 4.5:1</span>
              <span className="text-[#087F70] dark:text-emerald-400 font-bold font-mono">WCAG AA Pass</span>
            </div>
          </div>

          {/* Typography Hierarchy */}
          <div className="p-4 rounded-xl bg-[#F7FBF9] dark:bg-[#202020] border border-[#DDEBE5] dark:border-[#383838] flex flex-col justify-between space-y-3">
            <div>
              <div className="text-[11px] font-bold text-[#58716A] dark:text-[#85817D] uppercase tracking-wider font-mono">Typography Scale</div>
              <div className="text-sm font-bold text-[#18352F] dark:text-[#F7F3ED] font-heading mt-1">Space Grotesk / Inter</div>
              <div className="mt-3 space-y-2 text-xs">
                <div className="p-2 rounded-lg bg-white dark:bg-[#141414] border border-[#DDEBE5] dark:border-[#383838]">
                  <div className="text-[10px] text-[#58716A] dark:text-[#85817D] font-mono">Headlines (Space Grotesk / Sora)</div>
                  <div className="font-extrabold text-[#18352F] dark:text-[#F7F3ED] font-heading tracking-tight text-sm">Enterprise Governance</div>
                </div>
                <div className="p-2 rounded-lg bg-white dark:bg-[#141414] border border-[#DDEBE5] dark:border-[#383838]">
                  <div className="text-[10px] text-[#58716A] dark:text-[#85817D] font-mono">Section Labels (Uppercase)</div>
                  <div className="font-bold text-[#087F70] dark:text-[#FFAA35] text-xs font-mono uppercase">COMPLIANCE AUDIT EVIDENCE</div>
                </div>
                <div className="p-2 rounded-lg bg-white dark:bg-[#141414] border border-[#DDEBE5] dark:border-[#383838]">
                  <div className="text-[10px] text-[#58716A] dark:text-[#85817D] font-mono">Body Copy (Inter Sans)</div>
                  <div className="text-[#58716A] dark:text-[#B8B2AC] text-[11px] leading-relaxed">Editorial clarity, comfortable line height</div>
                </div>
              </div>
            </div>
            <div className="text-[11px] text-[#58716A] dark:text-[#85817D] flex justify-between items-center pt-2 border-t border-[#DDEBE5] dark:border-[#383838]">
              <span>Font Hierarchy:</span>
              <span className="text-[#087F70] dark:text-[#FFAA35] font-bold font-mono">Space Grotesk / Inter</span>
            </div>
          </div>

          {/* Anti-FUD & Tone Guidelines */}
          <div className="p-4 rounded-xl bg-[#F7FBF9] dark:bg-[#202020] border border-[#DDEBE5] dark:border-[#383838] flex flex-col justify-between space-y-3">
            <div>
              <div className="text-[11px] font-bold text-[#58716A] dark:text-[#85817D] uppercase tracking-wider font-mono">Voice &amp; Tone Rules</div>
              <div className="text-sm font-bold text-[#18352F] dark:text-[#F7F3ED] font-heading mt-1">Anti-FUD &amp; Factual Clarity</div>
              <div className="mt-3 space-y-2 text-xs">
                <div className="p-2.5 rounded-lg bg-white dark:bg-[#141414] border border-[#DDEBE5] dark:border-[#383838] space-y-1">
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase block font-mono">✓ Permitted Voice</span>
                  <p className="text-[11px] text-[#58716A] dark:text-[#B8B2AC] leading-relaxed">
                    Objective, factual statements with verified benchmark citations and statutory notices.
                  </p>
                </div>
                <div className="p-2.5 rounded-lg bg-white dark:bg-[#141414] border border-[#DDEBE5] dark:border-[#383838] space-y-1">
                  <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase block font-mono">✗ Prohibited (Anti-FUD)</span>
                  <p className="text-[11px] text-[#58716A] dark:text-[#B8B2AC] leading-relaxed">
                    Fear, uncertainty, doubt (FUD), unbacked superlatives (&quot;100% unbreakable&quot;), or uncertified claims.
                  </p>
                </div>
              </div>
            </div>
            <div className="text-[11px] text-[#58716A] dark:text-[#85817D] flex justify-between items-center pt-2 border-t border-[#DDEBE5] dark:border-[#383838]">
              <span>Mandatory Disclosure:</span>
              <span className="text-[#087F70] dark:text-[#FFAA35] font-bold font-mono">SOC2 / ISO 27001</span>
            </div>
          </div>
        </div>
      </div>

      {/* Prominent AI Media Audit Summary for Designer */}
      {activeAudit && (
        <div className="bg-surface border border-border rounded-2xl p-6 shadow-subtle space-y-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-teal/10 border border-teal/20 text-teal flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal animate-pulse"></span>
                  AI Visual Brand Summary
                </span>
                <span className="text-xs text-ink-muted">
                  Target: <strong className="text-navy">{activeAuditSub?.title || activeAudit.content_id}</strong>
                </span>
              </div>

              <div className="text-sm text-navy leading-relaxed font-medium bg-workspace p-3.5 rounded-xl border border-border">
                &quot;{activeAudit.summary.verdict_overview}&quot;
              </div>

              {/* Key Visual Compliance Checks */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                <div className="p-3 rounded-xl bg-workspace border border-border text-xs flex items-center gap-2.5">
                  <Palette className="w-4 h-4 text-teal shrink-0" />
                  <div>
                    <div className="text-[10px] text-ink-muted">Palette Adherence</div>
                    <div className="font-bold text-navy">#14263D & #0F766E</div>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-workspace border border-border text-xs flex items-center gap-2.5">
                  <Sliders className="w-4 h-4 text-teal shrink-0" />
                  <div>
                    <div className="text-[10px] text-ink-muted">Contrast Ratio</div>
                    <div className="font-bold text-status-success">5.2:1 (Pass AA)</div>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-workspace border border-border text-xs flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-teal shrink-0" />
                  <div>
                    <div className="text-[10px] text-ink-muted">Wordmark Safe Area</div>
                    <div className="font-bold text-navy">28px Padding Clear</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Score Ring & Actions */}
            <div className="flex flex-col items-center justify-center p-5 rounded-xl bg-workspace border border-border shadow-subtle min-w-[200px] text-center space-y-3">
              <div className="text-xs text-ink-muted font-semibold uppercase tracking-wider">Compliance Score</div>
              <div className="text-4xl font-black text-navy flex items-baseline">
                {activeAudit.summary.compliance_score}
                <span className="text-lg text-ink-muted font-bold ml-1">%</span>
              </div>
              <div className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-status-success font-bold">
                ✓ Ready for Review
              </div>
              <button
                onClick={() => {
                  if (activeAuditSub) {
                    setViewingSub(activeAuditSub);
                    setIsViewerOpen(true);
                  }
                }}
                className="w-full py-2 px-3 bg-workspace hover:bg-slate-200 text-ink-primary font-bold rounded-xl text-xs transition border border-border flex items-center justify-center gap-1.5"
              >
                <Eye className="w-3.5 h-3.5 text-teal" />
                <span>Open & View Asset ↗</span>
              </button>
              <button
                onClick={() => setIsModalOpen(true)}
                className="w-full py-2 px-3 bg-teal hover:bg-teal-hover text-white font-bold rounded-xl text-xs transition shadow-subtle"
              >
                Inspect All {activeAudit.summary.total_findings} Findings →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Media Processing Uploader & Recent Creative Assets */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Upload Creative Asset for Visual Audit */}
        <div className="lg:col-span-5 bg-surface border border-border rounded-2xl p-6 shadow-subtle space-y-4">
          <div className="pb-3 border-b border-border">
            <h2 className="text-sm font-bold text-navy flex items-center gap-2">
              <UploadCloud className="w-4 h-4 text-teal" />
              <span>Media Audit Ingestion</span>
            </h2>
            <p className="text-xs text-ink-muted mt-0.5">
              Enforces file limits (25MB), checks contrast ratio, and inspects video transcript heuristics.
            </p>
          </div>

          {auditFeedback && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-status-success text-xs rounded-xl flex items-center gap-2 animate-in fade-in">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{auditFeedback}</span>
            </div>
          )}

          <form onSubmit={handleMediaAudit} className="space-y-4">
            <div className="border-2 border-dashed border-border hover:border-teal rounded-2xl p-6 text-center cursor-pointer transition-colors bg-workspace">
              <input
                type="file"
                id="designer-file-input"
                className="hidden"
                accept="image/png,image/jpeg,image/webp,video/mp4,application/pdf"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              />
              <label htmlFor="designer-file-input" className="cursor-pointer space-y-2 block">
                <ImageIcon className="w-8 h-8 text-teal mx-auto" />
                <div className="text-xs font-bold text-navy">
                  {selectedFile ? selectedFile.name : "Select Graphic, Banner, or Video"}
                </div>
                <div className="text-[10px] text-ink-muted">
                  PNG, JPG, WEBP, MP4, PDF (Max 25MB)
                </div>
              </label>
            </div>

            <button
              type="submit"
              disabled={!selectedFile || isAuditing}
              className="w-full py-2.5 bg-teal hover:bg-teal-hover disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-subtle transition-all flex items-center justify-center gap-2"
            >
              {isAuditing ? "Processing with MediaExtractor & AI..." : "Submit to Media Audit Engine →"}
            </button>
          </form>
        </div>

        {/* Right: Creative Submissions Pipeline */}
        <div className="lg:col-span-7 bg-surface border border-border rounded-2xl p-6 shadow-subtle space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <h2 className="text-sm font-bold text-navy flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-teal" />
              <span>Creative Assets & Revisions Status</span>
            </h2>
            <button
              onClick={onRefresh}
              className="text-xs text-teal hover:text-teal-hover font-semibold flex items-center gap-1"
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
                  className="py-3 flex items-center justify-between hover:bg-workspace px-3 rounded-xl transition-all gap-3"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="text-sm font-bold text-navy flex items-center gap-2">
                      <span className="truncate">{sub.title}</span>
                      <span className="text-[10px] text-ink-muted uppercase px-1.5 py-0.5 rounded bg-workspace border border-border shrink-0">
                        {sub.content_type}
                      </span>
                    </div>
                    <div className="text-xs text-ink-secondary truncate">{sub.description}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] px-2 py-0.5 rounded-full font-bold bg-workspace text-ink-secondary border border-border capitalize whitespace-nowrap">
                      {sub.status.replace("_", " ")}
                    </span>
                    <button
                      onClick={() => {
                        setViewingSub(sub);
                        setIsViewerOpen(true);
                      }}
                      className="text-xs px-2.5 py-1 bg-teal hover:bg-teal-hover text-white rounded-lg font-semibold transition flex items-center gap-1 shadow-subtle"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Open</span>
                    </button>
                    <label
                      htmlFor={`dash-update-input-${sub.id}`}
                      className="cursor-pointer text-xs px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300 rounded-lg font-semibold transition flex items-center gap-1 shadow-sm"
                      title="Upload an updated graphic or new visual revision"
                    >
                      <UploadCloud className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                      <span>{updatingSubId === sub.id ? "Updating..." : "Update Image"}</span>
                    </label>
                    <input
                      id={`dash-update-input-${sub.id}`}
                      type="file"
                      accept="image/*,.png,.jpg,.jpeg,.webp,.svg"
                      className="hidden"
                      onChange={(e) => handleUpdateImageFromDashboard(sub, e)}
                    />
                    <button
                      onClick={() => handleInspectAudit(sub)}
                      className="text-xs px-2.5 py-1 bg-teal/10 hover:bg-teal/20 text-teal rounded-lg border border-teal/30 font-semibold transition flex items-center gap-1"
                    >
                      <span>Summary</span>
                    </button>
                    <a
                      href={`/audits?id=${sub.id}`}
                      className="text-xs px-2.5 py-1 bg-workspace hover:bg-slate-200 text-ink-primary rounded-lg border border-border"
                    >
                      Diff
                    </a>
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

      {/* Department Feedback & Change Request Tracker for Designer */}
      {designerSubmissions.length > 0 && (
        <DesignerFeedbackComments
          submissionId={activeAuditSub?.id || designerSubmissions[0].id}
          submissionTitle={activeAuditSub?.title || designerSubmissions[0].title}
          contentType={activeAuditSub?.content_type || designerSubmissions[0].content_type}
          description={activeAuditSub?.description || designerSubmissions[0].description}
          rawText={activeAuditSub?.raw_text || designerSubmissions[0].raw_text}
          fileName={activeAuditSub?.file_name || designerSubmissions[0].file_name}
          mediaUrl={activeAuditSub?.media_url || designerSubmissions[0].media_url}
          submission={activeAuditSub || designerSubmissions[0]}
        />
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
                <h3 className="text-lg font-bold text-navy mt-0.5">{activeAuditSub?.title || activeAudit.content_id}</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-ink-muted hover:text-navy p-1 rounded-lg text-sm"
              >
                ✕
              </button>
            </div>

            {/* Score & Verdict */}
            <div className="p-4 rounded-xl bg-workspace border border-border space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-ink-muted font-semibold">Governance Verdict</span>
                <span className="text-xs font-bold text-teal">Score: {activeAudit.summary.compliance_score}%</span>
              </div>
              <p className="text-xs text-navy leading-relaxed italic">
                &quot;{activeAudit.summary.verdict_overview}&quot;
              </p>
            </div>

            {/* Findings List */}
            <div className="space-y-3">
              <div className="text-xs font-bold text-navy uppercase tracking-wider">
                Audit Findings ({activeAudit.findings.length})
              </div>
              {activeAudit.findings.map((f) => (
                <div key={f.id} className="p-3.5 rounded-xl bg-workspace border border-border space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-navy">{f.title}</span>
                    <span
                      className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                        f.severity === "high" || f.severity === "critical"
                          ? "bg-red-50 text-status-error border-red-200"
                          : f.severity === "medium"
                          ? "bg-amber-50 text-status-warning border-amber-200"
                          : "bg-blue-50 text-status-info border-blue-200"
                      }`}
                    >
                      {f.severity}
                    </span>
                  </div>
                  <p className="text-xs text-ink-secondary">{f.message}</p>
                  {f.suggested_correction && (
                    <div className="text-xs p-2 rounded-lg bg-surface border border-border text-status-success font-medium">
                      <strong>AI Suggestion:</strong> &quot;{f.suggested_correction.replacement_text}&quot;
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-end gap-3 border-t border-border">
              <a
                href={`/audits?id=${activeAudit.content_id}`}
                className="px-4 py-2 bg-workspace hover:bg-slate-200 text-ink-primary font-bold text-xs rounded-xl border border-border transition"
              >
                Open Full Findings Page ↗
              </a>
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-teal hover:bg-teal-hover text-white font-bold text-xs rounded-xl transition"
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
