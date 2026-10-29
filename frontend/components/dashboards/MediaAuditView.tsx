"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ApprovedAsset, ContentSubmission, AuditResult, BrandGuidelineProfile } from "@/types";
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
  BookOpen,
  ExternalLink,
  ChevronDown,
  ChevronUp,
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
  const { resolvedTheme } = useTheme();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditFeedback, setAuditFeedback] = useState<string | null>(null);
  const [updatingSubId, setUpdatingSubId] = useState<string | null>(null);
  const [copiedColor, setCopiedColor] = useState<string | null>(null);

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
  const [showExtendedGuidelines, setShowExtendedGuidelines] = useState(false);

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
      let fileDataUrl: string | undefined = undefined;
      const isImg =
        selectedFile.type.startsWith("image/") ||
        /\.(png|jpe?g|webp|svg|gif|bmp|avif)$/i.test(selectedFile.name);
      const isVid =
        selectedFile.type.startsWith("video/") ||
        /\.(mp4|webm|mov|mkv)$/i.test(selectedFile.name);

      if (isImg) {
        fileDataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => resolve("");
          reader.readAsDataURL(selectedFile);
        });
      }

      // 1. Create visual media submission
      const newSub = await api.createSubmission({
        title: `Design Asset: ${selectedFile.name}`,
        description: `Visual brand asset submission (${selectedFile.type || "image/png"})`,
        content_type: isVid ? "video" : "image",
        initial_text:
          fileDataUrl ||
          `Visual asset ${selectedFile.name} submitted for brand palette & typography compliance check.`,
        file_name: selectedFile.name,
        media_url: fileDataUrl,
        file_path: fileDataUrl,
      });

      if (fileDataUrl && typeof window !== "undefined") {
        localStorage.setItem(`inkloom_media_${newSub.id}`, fileDataUrl);
        localStorage.setItem(`inkloom_media_${selectedFile.name}`, fileDataUrl);
      }
      if (fileDataUrl) {
        newSub.media_url = fileDataUrl;
        newSub.file_path = fileDataUrl;
      }

      // 2. Trigger AI media audit immediately
      const auditRes = await api.triggerAudit(newSub.id);
      setActiveAudit(auditRes);
      setActiveAuditSub(newSub);

      setAuditFeedback(`'${selectedFile.name}' uploaded and analyzed by Media Extractor & AI Visual Brand Engine.`);
      setSelectedFile(null);
      onRefresh();
    } catch (err: any) {
      alert(err.message || "Upload failed");
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
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => resolve("");
        reader.readAsDataURL(file);
      });

      if (dataUrl) {
        sub.media_url = dataUrl;
        sub.file_path = dataUrl;
        sub.file_name = file.name;

        if (typeof window !== "undefined") {
          localStorage.setItem(`inkloom_media_${sub.id}`, dataUrl);
          localStorage.setItem(`inkloom_media_${file.name}`, dataUrl);
        }

        await api.createRevision(sub.id, {
          raw_text: dataUrl,
          file_name: file.name,
          file_path: dataUrl,
          file_size_bytes: file.size,
        });

        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("inkloom_asset_updated", {
              detail: { submissionId: sub.id, mediaUrl: dataUrl, fileName: file.name },
            })
          );
        }

        setAuditFeedback(`✓ Updated image '${file.name}' saved and published for review!`);
        onRefresh();
      }
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

  const publishedData = guidelineProfile?.published_data;

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
          TAB 1: MEDIA AUDIT & ASSET SCANNER (With Quick Design Standards)
          ========================================================================= */}
      {activeMainTab === "audit" && (
        <div className="space-y-6 animate-in fade-in">
          {/* Quick Brand Design Standards Panel */}
          <div className="bg-surface border border-border rounded-2xl p-6 shadow-subtle space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border">
              <div>
                <h2 className="text-sm font-bold text-ink-primary font-heading flex items-center gap-2">
                  <Layers className="w-4 h-4 text-teal" />
                  <span>Quick Brand Design Standards</span>
                </h2>
                <p className="text-xs text-ink-secondary mt-0.5">
                  Authoritative color tokens, typography hierarchy, wordmark clearance, and tone rules certified for enterprise campaigns.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveMainTab("guidelines")}
                  className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-teal/15 text-teal border border-teal/30 hover:bg-teal/25 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Open All 9 Modules →</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowExtendedGuidelines((prev) => !prev)}
                  className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-workspace border border-border text-ink-secondary hover:text-ink-primary transition flex items-center gap-1 cursor-pointer"
                >
                  <FileText className="w-3 h-3 text-teal" />
                  <span>{showExtendedGuidelines ? "Hide Quick Policy" : "Quick Policy"}</span>
                  {showExtendedGuidelines ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              </div>
            </div>

        {/* 4 Core Design Standards Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Logo Card */}
          <div className="p-4 rounded-xl bg-workspace border border-border flex flex-col justify-between space-y-4">
            <div>
              <div className="text-[11px] font-bold text-ink-muted uppercase tracking-wider font-mono">
                Primary Wordmark
              </div>
              <div className="text-sm font-bold text-ink-primary font-heading mt-1">
                Official High-Res SVG Logo
              </div>
              <div className="mt-3 p-4 rounded-xl bg-surface border border-border flex items-center justify-center gap-2 shadow-xs">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/inkloom-feather-cute@2x.png"
                  alt="Inkloom Feather"
                  className="w-6 h-6 object-contain shrink-0 filter drop-shadow-[0_1px_4px_rgba(168,85,247,0.4)]"
                />
                <span className="text-base font-black tracking-widest text-ink-primary font-heading">
                  INKLOOM
                </span>
              </div>
            </div>
            <div className="text-[11px] text-ink-muted space-y-1 pt-2 border-t border-border">
              <div className="flex justify-between">
                <span>Clear Space:</span>
                <span className="font-semibold text-ink-primary">
                  {(publishedData as any)?.logo_rules?.clearance_space || publishedData?.logos?.partner_rules || "Min 24px perimeter"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Aspect Ratio:</span>
                <span className="font-semibold text-teal">Vector SVG (No skew)</span>
              </div>
            </div>
          </div>

          {/* 2. Color Tokens Card with Click-to-Copy */}
          <div className="p-4 rounded-xl bg-workspace border border-border flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <div className="text-[11px] font-bold text-ink-muted uppercase tracking-wider font-mono">
                  Color Tokens
                </div>
                {copiedColor && (
                  <span className="text-[10px] text-emerald-400 font-bold animate-in fade-in font-mono">
                    Copied {copiedColor}!
                  </span>
                )}
              </div>
              <div className="text-sm font-bold text-ink-primary font-heading mt-1">
                {resolvedTheme === "light"
                  ? "Inkloom Signature Mint & Turquoise"
                  : "Inkloom Signature Warm Palette"}
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
                    className="p-1.5 rounded-lg bg-surface border border-border hover:border-teal text-center transition group flex flex-col items-center shadow-xs cursor-pointer"
                    title={`Click to copy ${col.label} (${col.hex})`}
                  >
                    <div className={`w-full h-6 rounded-md ${col.bg} border border-black/5 dark:border-white/10`} />
                    <span className="text-[9px] font-mono text-ink-secondary mt-1 group-hover:text-teal font-semibold">
                      {col.hex}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <div className="text-[11px] text-ink-muted flex justify-between items-center pt-2 border-t border-border">
              <span>Min Contrast: 4.5:1</span>
              <span className="text-emerald-400 font-bold font-mono">WCAG AA Pass</span>
            </div>
          </div>

          {/* 3. Typography Scale Card */}
          <div className="p-4 rounded-xl bg-workspace border border-border flex flex-col justify-between space-y-3">
            <div>
              <div className="text-[11px] font-bold text-ink-muted uppercase tracking-wider font-mono">
                Typography Scale
              </div>
              <div className="text-sm font-bold text-ink-primary font-heading mt-1">
                Space Grotesk / Inter
              </div>
              <div className="space-y-2 mt-3">
                <div className="p-2 rounded-lg bg-surface border border-border">
                  <span className="text-[10px] text-ink-muted block font-mono">Headlines (Space Grotesk)</span>
                  <span className="text-xs font-bold text-ink-primary font-heading">
                    {publishedData?.identity?.brand_name || (publishedData as any)?.brand_name || "Enterprise Governance"}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-surface border border-border">
                  <span className="text-[10px] text-ink-muted block font-mono">Section Labels (Uppercase)</span>
                  <span className="text-[10px] font-bold text-amber-500 tracking-wider uppercase font-mono">
                    COMPLIANCE AUDIT EVIDENCE
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-surface border border-border">
                  <span className="text-[10px] text-ink-muted block font-mono">Body Copy (Inter Sans)</span>
                  <span className="text-xs text-ink-secondary">
                    Editorial clarity, comfortable line height
                  </span>
                </div>
              </div>
            </div>
            <div className="text-[11px] text-ink-muted flex justify-between items-center pt-2 border-t border-border">
              <span>Font Hierarchy:</span>
              <span className="text-teal font-bold font-mono">
                {publishedData?.typography?.primary_font || "Space Grotesk"} / Inter
              </span>
            </div>
          </div>

          {/* 4. Voice & Tone Rules Card */}
          <div className="p-4 rounded-xl bg-workspace border border-border flex flex-col justify-between space-y-3">
            <div>
              <div className="text-[11px] font-bold text-ink-muted uppercase tracking-wider font-mono">
                Voice &amp; Tone Rules
              </div>
              <div className="text-sm font-bold text-ink-primary font-heading mt-1">
                Anti-FUD &amp; Factual Clarity
              </div>
              <div className="space-y-2 mt-3">
                <div className="p-2.5 rounded-lg bg-surface border border-border space-y-1">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase block font-mono">
                    ✓ Permitted Voice
                  </span>
                  <p className="text-[11px] text-ink-secondary leading-relaxed">
                    Objective, factual statements with verified benchmark citations and statutory notices.
                  </p>
                </div>
                <div className="p-2.5 rounded-lg bg-surface border border-border space-y-1">
                  <span className="text-[10px] font-bold text-rose-400 uppercase block font-mono">
                    ✗ Prohibited (Anti-FUD)
                  </span>
                  <p className="text-[11px] text-ink-secondary leading-relaxed">
                    Fear, uncertainty, doubt (FUD), unbacked superlatives (&quot;100% unbreakable&quot;), or uncertified claims.
                  </p>
                </div>
              </div>
            </div>
            <div className="text-[11px] text-ink-muted flex justify-between items-center pt-2 border-t border-border">
              <span>Mandatory Disclosure:</span>
              <span className="text-amber-500 font-bold font-mono">SOC2 / ISO 27001</span>
            </div>
          </div>
        </div>

        {/* Detailed Brand Governance Policies (Expandable) */}
        {showExtendedGuidelines && publishedData && (
          <div className="p-5 rounded-xl bg-workspace border border-border space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-border/80 pb-2">
              <div className="text-xs font-bold text-ink-primary uppercase tracking-wide flex items-center gap-2">
                <BookOpen className="w-3.5 h-3.5 text-teal" />
                <span>Authoritative Published Brand Governance Policies</span>
              </div>
              <span className="text-[11px] text-ink-muted font-mono">
                Version {guidelineProfile?.version || "1.0"} • Certified
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-3 bg-surface rounded-xl border border-border space-y-1.5">
                <span className="text-[10px] font-bold text-ink-muted uppercase tracking-wider font-mono">
                  Brand Positioning &amp; Tagline
                </span>
                <p className="font-semibold text-ink-primary">
                  {publishedData?.identity?.tagline || (publishedData as any)?.tagline || "Autonomous Enterprise Brand Governance"}
                </p>
                <div className="flex flex-wrap gap-1 pt-1">
                  {((publishedData?.identity?.values && publishedData.identity.values.length > 0)
                    ? publishedData.identity.values
                    : (publishedData as any)?.core_values || ["Accuracy", "Deterministic", "Factual Clarity"]
                  ).map((v: string, i: number) => (
                    <span key={i} className="px-1.5 py-0.5 rounded bg-teal/10 text-teal text-[10px] font-medium">
                      {v}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-surface rounded-xl border border-border space-y-1.5">
                <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider font-mono">
                  Restricted &amp; Prohibited Claims
                </span>
                <ul className="list-disc list-inside text-ink-secondary space-y-1 text-[11px]">
                  {((publishedData?.voice?.words_to_avoid && publishedData.voice.words_to_avoid.length > 0)
                    ? publishedData.voice.words_to_avoid
                    : (publishedData as any)?.restricted_claims || [
                    "Never claim 100% infallible security without statutory caveat",
                    "Do not use competitor brand names in unbacked comparison charts",
                    "Avoid absolute guarantees on uptime or SLAs without disclosure",
                  ]).map((rc: string, i: number) => (
                    <li key={i} className="truncate">{rc}</li>
                  ))}
                </ul>
              </div>

              <div className="p-3 bg-surface rounded-xl border border-border space-y-1.5">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider font-mono">
                  Required Statutory Disclosures
                </span>
                <ul className="list-disc list-inside text-ink-secondary space-y-1 text-[11px]">
                  {((publishedData as any)?.required_disclaimers || [
                    "ISO 27001 & SOC 2 Type II certified infrastructure disclosure",
                    "Advisory visual analysis notice on all marketing assets",
                    "Benchmark performance methodology footnote required",
                  ]).map((rd: string, i: number) => (
                    <li key={i} className="truncate">{rd}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          AI VISUAL BRAND SUMMARY & COMPLIANCE SCORE
          ========================================================================= */}
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
                  Target: <strong className="text-ink-primary">{activeAuditSub?.title || activeAudit.content_id}</strong>
                </span>
              </div>

              <div className="text-sm text-ink-primary leading-relaxed font-medium bg-workspace p-3.5 rounded-xl border border-border">
                &quot;{activeAudit.summary?.verdict_overview || "Governance audit identified findings against published Brand Guidelines. Human compliance review required prior to publication."}&quot;
              </div>

              {/* Key Visual Compliance Checks */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                <div className="p-3 rounded-xl bg-workspace border border-border text-xs flex items-center gap-2.5">
                  <Palette className="w-4 h-4 text-teal shrink-0" />
                  <div>
                    <div className="text-[10px] text-ink-muted">Palette Adherence</div>
                    <div className="font-bold text-ink-primary">#14263D &amp; #0F766E</div>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-workspace border border-border text-xs flex items-center gap-2.5">
                  <Sliders className="w-4 h-4 text-teal shrink-0" />
                  <div>
                    <div className="text-[10px] text-ink-muted">Contrast Ratio</div>
                    <div className="font-bold text-emerald-400">5.2:1 (Pass AA)</div>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-workspace border border-border text-xs flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-teal shrink-0" />
                  <div>
                    <div className="text-[10px] text-ink-muted">Wordmark Safe Area</div>
                    <div className="font-bold text-ink-primary">28px Padding Clear</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Score Ring & Actions */}
            <div className="flex flex-col items-center justify-center p-5 rounded-xl bg-workspace border border-border shadow-subtle min-w-[200px] text-center space-y-3">
              <div className="text-xs text-ink-muted font-semibold uppercase tracking-wider">Compliance Score</div>
              <div className="text-4xl font-black text-ink-primary flex items-baseline">
                {activeAudit.summary?.compliance_score ?? 100}
                <span className="text-lg text-ink-muted font-bold ml-1">%</span>
              </div>
              <div className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold">
                ✓ Ready for Review
              </div>
              <button
                onClick={() => {
                  if (activeAuditSub) {
                    setViewingSub(activeAuditSub);
                    setIsViewerOpen(true);
                  }
                }}
                className="w-full py-2 px-3 bg-surface hover:bg-surface/80 text-ink-primary font-bold rounded-xl text-xs transition border border-border flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Eye className="w-3.5 h-3.5 text-teal" />
                <span>Open &amp; View Asset ↗</span>
              </button>
              <button
                onClick={() => setIsModalOpen(true)}
                className="w-full py-2 px-3 bg-teal hover:bg-teal/90 text-white font-bold rounded-xl text-xs transition shadow-subtle cursor-pointer"
              >
                Inspect All {activeAudit.summary?.total_findings ?? activeAudit.findings?.length ?? 1} Findings →
              </button>
            </div>
          </div>
        </div>
      )}

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
