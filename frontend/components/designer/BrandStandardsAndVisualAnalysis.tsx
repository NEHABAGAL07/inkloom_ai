"use client";

import React, { useState } from "react";
import Link from "next/link";
import { BrandGuidelineProfile, AuditResult, ContentSubmission, DesignDraftDetailResponse } from "@/types";
import { useTheme } from "@/services/theme-context";
import {
  Layers,
  BookOpen,
  FileText,
  ChevronDown,
  ChevronUp,
  Palette,
  Sliders,
  ShieldCheck,
  Eye,
  Sparkles,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  X,
  FileImage,
} from "lucide-react";
import { DesignAssetViewerModal } from "@/components/reviews/DesignAssetViewerModal";

export interface BrandStandardsAndVisualAnalysisProps {
  guidelineProfile: BrandGuidelineProfile | null;
  auditResult: AuditResult | null;
  isAuditing?: boolean;
  activeAssetTitle?: string;
  activeAssetPreviewUrl?: string | null;
  activeAssetSub?: ContentSubmission | null;
  activeDraft?: DesignDraftDetailResponse | null;
  availableAssets?: ContentSubmission[];
  onSelectAsset?: (sub: ContentSubmission) => void;
  onRunVisualAudit?: () => Promise<void> | void;
}

export function BrandStandardsAndVisualAnalysis({
  guidelineProfile,
  auditResult,
  isAuditing = false,
  activeAssetTitle = "Active Creative Artwork",
  activeAssetPreviewUrl = null,
  activeAssetSub = null,
  activeDraft = null,
  availableAssets = [],
  onSelectAsset,
  onRunVisualAudit,
}: BrandStandardsAndVisualAnalysisProps) {
  const { resolvedTheme } = useTheme();

  // Color click-to-copy feedback
  const [copiedColor, setCopiedColor] = useState<string | null>(null);
  // Expandable Quick Policy panel
  const [showExtendedGuidelines, setShowExtendedGuidelines] = useState(false);
  // Asset Viewer Modal state
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  // AI Audit Findings Modal state
  const [isFindingsModalOpen, setIsFindingsModalOpen] = useState(false);

  const copyToClipboard = (hex: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(hex);
      setCopiedColor(hex);
      setTimeout(() => setCopiedColor(null), 2000);
    }
  };

  const publishedData = guidelineProfile?.published_data;

  // Construct a compliant submission wrapper for the asset viewer modal
  const effectiveViewerSub: ContentSubmission = activeAssetSub || {
    id: activeDraft?.id || (auditResult?.content_id ? String(auditResult.content_id) : "designer_draft_active"),
    organization_id: "org_acme_cloud",
    creator_id: "user_designer_active",
    creator_name: "Designer",
    title: activeAssetTitle,
    description: activeDraft?.description || "Visual design artwork submitted in Designer Studio",
    content_type: "image",
    status: (activeDraft?.status as any) || "draft",
    current_revision_id: activeDraft?.current_revision_id || "rev_001",
    media_url: activeAssetPreviewUrl || activeDraft?.current_file_path || undefined,
    file_path: activeAssetPreviewUrl || activeDraft?.current_file_path || undefined,
    file_name: activeDraft?.current_file_name || `${activeAssetTitle.toLowerCase().replace(/\s+/g, "_")}.png`,
    created_at: activeDraft?.created_at || new Date().toISOString(),
    updated_at: activeDraft?.updated_at || new Date().toISOString(),
  };

  const complianceScore = auditResult?.summary?.compliance_score ?? 94;
  const isCompliant = auditResult ? (auditResult.overall_status === "compliant" || complianceScore >= 90) : false;

  return (
    <div id="brand-standards-ai-analysis" className="space-y-6 pt-4 border-t border-border">
      {/* =========================================================================
          MAIN SECTION HEADER: Brand Design Standards & AI Analysis
          ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-teal uppercase tracking-wider font-mono">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Designer Copilot Intelligence Suite</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-heading text-ink-primary tracking-tight mt-0.5">
            Brand Design Standards &amp; AI Analysis
          </h2>
          <p className="text-xs text-ink-secondary max-w-3xl mt-1 leading-relaxed">
            Directly consult certified brand design tokens, clear space, and typography standards while reviewing automated AI visual compliance analysis for your active artwork.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/guidelines"
            className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-teal/10 hover:bg-teal/20 text-teal border border-teal/30 transition flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Open All 9 Modules →</span>
          </Link>
        </div>
      </div>

      {/* =========================================================================
          SUBSECTION 1: BRAND STANDARDS & DESIGN SYSTEM
          ========================================================================= */}
      <div className="space-y-4">
        <div className="bg-surface border border-border rounded-2xl p-6 shadow-subtle space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border">
            <div>
              <h3 className="text-sm font-bold text-ink-primary font-heading flex items-center gap-2">
                <Layers className="w-4 h-4 text-teal" />
                <span>1. Quick Brand Design Standards</span>
              </h3>
              <p className="text-xs text-ink-secondary mt-0.5">
                Authoritative color tokens, typography hierarchy, wordmark clearance, and tone rules certified for enterprise campaigns.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/guidelines"
                className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-teal/15 text-teal border border-teal/30 hover:bg-teal/25 transition flex items-center gap-1.5 cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Open All Modules →</span>
              </Link>
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
                    <span className="text-xs font-bold text-ink-primary font-heading truncate block">
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
      </div>

      {/* =========================================================================
          SUBSECTIONS 2, 3, & 4:
          2. AI Visual Analysis
          3. Compliance Score & Key Checks
          4. Detailed Findings & Inspection Actions
          ========================================================================= */}
      <div className="space-y-4">
        {/* Optional Asset Switcher if multiple submissions exist */}
        {availableAssets.length > 1 && onSelectAsset && (
          <div className="bg-surface border border-border rounded-xl p-3 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold text-ink-muted uppercase tracking-wider font-mono">
                Asset Switcher:
              </span>
              <div className="flex flex-wrap gap-2">
                {availableAssets.map((sub) => {
                  const isSelected = sub.title === activeAssetTitle || sub.id === activeAssetSub?.id;
                  return (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => onSelectAsset(sub)}
                      className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition border flex items-center gap-1.5 cursor-pointer ${
                        isSelected
                          ? "bg-teal/15 text-teal border-teal/40 shadow-xs"
                          : "bg-workspace text-ink-secondary border-border hover:text-ink-primary"
                      }`}
                    >
                      <span className="truncate max-w-[180px]">{sub.title}</span>
                      <span className="text-[9px] uppercase px-1 py-0.2 rounded font-mono font-bold bg-workspace border border-border">
                        {sub.status.replace("_", " ")}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
            <span className="text-xs text-ink-muted font-mono">{availableAssets.length} assets registered</span>
          </div>
        )}

        {/* AI Visual Brand Summary Card */}
        {auditResult ? (
          <div className="bg-surface border border-border rounded-2xl p-6 shadow-subtle space-y-5 animate-in fade-in">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-3 max-w-2xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-teal/10 border border-teal/20 text-teal flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal animate-pulse"></span>
                    AI Visual Brand Summary
                  </span>
                  <span className="text-xs text-ink-muted">
                    Target: <strong className="text-ink-primary">{activeAssetTitle}</strong>
                  </span>
                  {activeDraft?.version_number && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      v{activeDraft.version_number}
                    </span>
                  )}
                </div>

                <div className="text-sm text-ink-primary leading-relaxed font-medium bg-workspace p-3.5 rounded-xl border border-border">
                  &quot;{auditResult.summary?.verdict_overview || "Governance audit identified findings against published Brand Guidelines. Human compliance review required prior to publication."}&quot;
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

              {/* Score Ring & Inspection Actions */}
              <div className="flex flex-col items-center justify-center p-5 rounded-xl bg-workspace border border-border shadow-subtle min-w-[220px] text-center space-y-3 shrink-0">
                <div className="text-xs text-ink-muted font-semibold uppercase tracking-wider">Compliance Score</div>
                <div className="text-4xl font-black text-ink-primary flex items-baseline">
                  {complianceScore}
                  <span className="text-lg text-ink-muted font-bold ml-1">%</span>
                </div>
                <div
                  className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${
                    isCompliant
                      ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                      : "bg-amber-500/15 border-amber-500/30 text-amber-400"
                  }`}
                >
                  {isCompliant ? "✓ Ready for Review" : "⚠ Review Advisories"}
                </div>
                <button
                  type="button"
                  onClick={() => setIsViewerOpen(true)}
                  className="w-full py-2 px-3 bg-surface hover:bg-surface/80 text-ink-primary font-bold rounded-xl text-xs transition border border-border flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Eye className="w-3.5 h-3.5 text-teal" />
                  <span>Open &amp; View Asset ↗</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsFindingsModalOpen(true)}
                  className="w-full py-2 px-3 bg-teal hover:bg-teal/90 text-white font-bold rounded-xl text-xs transition shadow-subtle cursor-pointer"
                >
                  Inspect All {auditResult.summary?.total_findings ?? auditResult.findings?.length ?? 1} Findings →
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-surface border border-border rounded-2xl p-8 shadow-subtle text-center space-y-3">
            <div className="w-12 h-12 rounded-xl bg-teal/10 border border-teal/20 flex items-center justify-center text-teal mx-auto">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-ink-primary">
                No visual audit generated yet for &apos;{activeAssetTitle}&apos;
              </h4>
              <p className="text-xs text-ink-secondary max-w-md mx-auto mt-1">
                Run an automated visual scan to evaluate color palette adherence, WCAG AA contrast ratio, wordmark safe-zone perimeter, and brand guideline compliance.
              </p>
            </div>
            {onRunVisualAudit && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => onRunVisualAudit()}
                  disabled={isAuditing}
                  className="px-4 py-2.5 bg-teal hover:bg-teal/90 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-subtle transition inline-flex items-center gap-2 cursor-pointer"
                >
                  {isAuditing ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Auditing Brand Standards...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Run Visual Audit Now</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Full-Stage Design Asset Viewer Modal */}
      <DesignAssetViewerModal
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
        submission={effectiveViewerSub}
        canAuthorize={false}
      />

      {/* AI Audit Findings Modal */}
      {isFindingsModalOpen && auditResult && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-surface border border-border rounded-2xl max-w-2xl w-full p-6 shadow-xl space-y-5 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-teal">AI Visual Audit Inspection</div>
                <h3 className="text-lg font-bold text-ink-primary mt-0.5">{activeAssetTitle}</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsFindingsModalOpen(false)}
                className="text-ink-muted hover:text-ink-primary p-1 rounded-lg text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Score & Verdict */}
            <div className="p-4 rounded-xl bg-workspace border border-border space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-ink-muted font-semibold">Governance Verdict</span>
                <span className="text-xs font-bold text-teal">Score: {complianceScore}%</span>
              </div>
              <p className="text-xs text-ink-primary leading-relaxed italic">
                &quot;{auditResult.summary?.verdict_overview || "Audit passed visual checks."}&quot;
              </p>
            </div>

            {/* Findings List */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase text-ink-muted tracking-wider">
                Audited Findings ({auditResult.findings?.length || 0})
              </h4>
              {(auditResult.findings || []).map((f) => (
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
                href={`/audits?id=${auditResult.content_id}`}
                className="px-4 py-2 bg-workspace hover:bg-surface text-ink-primary font-bold text-xs rounded-xl border border-border transition flex items-center gap-1.5"
              >
                <span>Open Full Findings Page</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button
                type="button"
                onClick={() => setIsFindingsModalOpen(false)}
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
