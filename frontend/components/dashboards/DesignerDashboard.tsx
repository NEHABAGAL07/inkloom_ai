"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ContentSubmission } from "@/types";
import { useAuth } from "@/services/auth-context";
import {
  SOCIAL_PLATFORMS,
  DESIGN_STARTER_TEMPLATES,
  PlatformPreset,
  CanvasFormatPreset,
  DesignContentTemplate,
} from "@/components/designer/socialPresets";
import {
  Palette,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  Maximize2,
  Sliders,
  Layers,
  Search,
  ExternalLink,
  Clock,
  ArrowRight,
  FileImage,
  CheckCircle,
  AlertTriangle,
  FileText,
  Plus,
} from "lucide-react";

interface DesignerDashboardProps {
  submissions: ContentSubmission[];
  onRefresh: () => void;
}

export function DesignerDashboard({ submissions, onRefresh }: DesignerDashboardProps) {
  const { activeOrgName } = useAuth();
  const router = useRouter();

  // Active selected platform (defaults to Instagram as the primary social platform)
  const [selectedPlatformId, setSelectedPlatformId] = useState<string>("instagram");
  const [searchQuery, setSearchQuery] = useState("");

  // Custom canvas dimensions state
  const [customWidth, setCustomWidth] = useState<number>(1080);
  const [customHeight, setCustomHeight] = useState<number>(1080);
  const [customName, setCustomName] = useState<string>("Custom Artwork");

  // Real saved design submissions from backend
  const designerSubmissions = useMemo(() => {
    return (submissions || []).filter(
      (s) =>
        s.content_type === "image" ||
        s.content_type === "video" ||
        s.content_type === "document" ||
        s.title?.toLowerCase().includes("design") ||
        s.title?.toLowerCase().includes("banner") ||
        s.title?.toLowerCase().includes("wallpaper")
    );
  }, [submissions]);

  // Selected platform object
  const activePlatform: PlatformPreset = useMemo(() => {
    return (
      SOCIAL_PLATFORMS.find((p) => p.id === selectedPlatformId) ||
      SOCIAL_PLATFORMS[0]
    );
  }, [selectedPlatformId]);

  // Filter formats based on search query
  const filteredFormats = useMemo(() => {
    if (!searchQuery.trim()) return activePlatform.formats;
    const q = searchQuery.toLowerCase().trim();
    return activePlatform.formats.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        f.intendedUse.toLowerCase().includes(q) ||
        f.aspectRatio.includes(q) ||
        `${f.width}x${f.height}`.includes(q) ||
        `${f.width} × ${f.height}`.includes(q)
    );
  }, [activePlatform, searchQuery]);

  // Handle launch design studio with preset
  const handleSelectFormat = (format: CanvasFormatPreset) => {
    const params = new URLSearchParams({
      action: "new_design",
      tab: "canvas_audit",
      platform: activePlatform.id,
      format: format.id,
      w: String(format.width),
      h: String(format.height),
      ratio: format.aspectRatio,
      title: `${activePlatform.name} ${format.name}`,
    });
    router.push(`/designer?${params.toString()}`);
  };

  // Handle launch design studio with custom dimensions
  const handleLaunchCustomCanvas = (e: React.FormEvent) => {
    e.preventDefault();
    const w = Math.max(100, Math.min(8000, Number(customWidth) || 1080));
    const h = Math.max(100, Math.min(8000, Number(customHeight) || 1080));
    const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
    const divisor = gcd(w, h);
    const simplifiedRatio = `${w / divisor}:${h / divisor}`;

    const params = new URLSearchParams({
      action: "new_design",
      tab: "canvas_audit",
      platform: "custom",
      format: "custom_canvas",
      w: String(w),
      h: String(h),
      ratio: simplifiedRatio,
      title: customName || `Custom ${w}×${h} Artwork`,
    });
    router.push(`/designer?${params.toString()}`);
  };

  // Handle launch design studio from template
  const handleSelectTemplate = (tpl: DesignContentTemplate) => {
    const params = new URLSearchParams({
      action: "new_design",
      tab: "canvas_audit",
      template: tpl.id,
      platform: tpl.platform,
      w: String(tpl.defaultWidth),
      h: String(tpl.defaultHeight),
      ratio: tpl.defaultRatio,
      title: `${tpl.name} — ${tpl.format}`,
    });
    router.push(`/designer?${params.toString()}`);
  };

  // Platform icon helper
  const renderPlatformIcon = (type: string, className = "w-4 h-4") => {
    switch (type) {
      case "instagram":
        return (
          <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <rect width="20" height="20" x="2" y="2" rx="5" ry="5" strokeWidth="2" />
            <path strokeWidth="2" d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
            <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        );
      case "linkedin":
        return (
          <svg className={className} fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.45a1.6 1.6 0 0 0-1.61 1.6 1.6 1.6 0 0 0 1.61 1.6 1.6 1.6 0 0 0 1.61-1.6 1.6 1.6 0 0 0-1.61-1.6Z" />
          </svg>
        );
      case "facebook":
        return (
          <svg className={className} fill="currentColor" viewBox="0 0 24 24">
            <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
          </svg>
        );
      case "youtube":
        return (
          <svg className={className} fill="currentColor" viewBox="0 0 24 24">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.5 12 3.5 12 3.5s-7.505 0-9.377.55a3.016 3.016 0 0 0-2.122 2.136C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.55 9.376.55 9.376.55s7.505 0 9.377-.55a3.016 3.016 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
          </svg>
        );
      case "twitter":
        return (
          <svg className={className} fill="currentColor" viewBox="0 0 24 24">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        );
      case "pinterest":
        return (
          <svg className={className} fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0a12 12 0 0 0-4.37 23.18c-.07-.98-.13-2.49.03-3.56l1.09-4.63s-.28-.56-.28-1.39c0-1.3.75-2.28 1.7-2.28.8 0 1.19.6 1.19 1.33 0 .81-.51 2.02-.78 3.14-.23.95.48 1.72 1.41 1.72 1.7 0 3-1.8 3-4.38 0-2.29-1.64-3.89-4-3.89-2.73 0-4.33 2.05-4.33 4.16 0 .82.32 1.71.71 2.19.08.1.09.18.07.28l-.27 1.09c-.04.18-.15.22-.34.13-1.28-.6-2.08-2.47-2.08-3.98 0-3.23 2.35-6.2 6.78-6.2 3.56 0 6.32 2.54 6.32 5.93 0 3.54-2.23 6.39-5.32 6.39-1.04 0-2.02-.54-2.35-1.18l-.64 2.45c-.23.9-.86 2.02-1.28 2.71A12 12 0 1 0 12 0z" />
          </svg>
        );
      case "tiktok":
        return (
          <svg className={className} fill="currentColor" viewBox="0 0 24 24">
            <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
          </svg>
        );
      case "blog":
        return (
          <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
          </svg>
        );
      case "email":
        return (
          <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <rect width="20" height="16" x="2" y="4" rx="2" strokeWidth="2" />
            <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
          </svg>
        );
      default:
        return <Sliders className={className} />;
    }
  };

  // Helper for status badge in Recent Designs
  const getSubmissionBadge = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "pending_approval":
      case "submitted":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "changes_requested":
        return "bg-rose-500/10 text-rose-400 border-rose-500/20";
      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* =========================================================================
          1. Workspace Header
          ========================================================================= */}
      <div className="bg-surface rounded-2xl p-6 sm:p-8 border border-border shadow-subtle relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-teal/10 border border-teal/20 text-teal text-xs font-bold font-mono">
            <Palette className="w-3.5 h-3.5 text-teal" />
            <span>Designer Workspace • {activeOrgName || "Acme Cloud Systems"}</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-ink-primary font-heading tracking-tight">
            Designer Workspace
          </h1>
          <p className="text-xs sm:text-sm text-ink-secondary leading-relaxed">
            Create stunning, brand-consistent content for every platform. Select a channel to start with pixel-perfect official canvas dimensions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Link
            href="/designer"
            className="px-5 py-2.5 rounded-xl bg-teal hover:bg-teal/90 text-white text-xs font-bold transition flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <Palette className="w-4 h-4" />
            <span>Open Studio &amp; Copilot ↗</span>
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
            title="Refresh designs"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* =========================================================================
          2. Hero Creative Prompt: What would you like to design today?
          ========================================================================= */}
      <div className="bg-surface rounded-2xl p-6 sm:p-7 border border-border shadow-subtle space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold tracking-wider uppercase text-teal">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Canvas Preset Selector</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-ink-primary font-heading">
              What would you like to design today?
            </h2>
            <p className="text-xs sm:text-sm text-ink-secondary">
              Choose a platform and format to start with the right canvas size.
            </p>
          </div>

          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter format or size (e.g. 1080, story)..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-workspace border border-border text-xs text-ink-primary placeholder:text-ink-muted focus:outline-none focus:border-teal transition"
            />
          </div>
        </div>

        {/* =======================================================================
            3. Social Media Platform Selector (10 Platforms)
            ======================================================================= */}
        <div className="pt-2">
          <div className="text-[11px] font-bold uppercase tracking-wider text-ink-muted mb-3">
            Choose Your Platform ({SOCIAL_PLATFORMS.length})
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-5 gap-3">
            {SOCIAL_PLATFORMS.map((platform) => {
              const isSelected = platform.id === selectedPlatformId;
              return (
                <button
                  key={platform.id}
                  type="button"
                  onClick={() => setSelectedPlatformId(platform.id)}
                  className={`p-3.5 rounded-xl border text-left transition-all duration-150 flex flex-col justify-between h-28 relative group cursor-pointer ${
                    isSelected
                      ? "bg-teal/5 dark:bg-teal/10 border-teal shadow-xs ring-1 ring-teal"
                      : "bg-workspace hover:bg-surface border-border hover:border-border-hover hover:shadow-2xs"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0 shadow-2xs"
                      style={{ backgroundColor: platform.brandColor }}
                    >
                      {renderPlatformIcon(platform.iconType, "w-4 h-4")}
                    </div>
                    {isSelected && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-teal text-white">
                        Active
                      </span>
                    )}
                  </div>

                  <div>
                    <div className="text-xs font-bold text-ink-primary group-hover:text-teal transition truncate">
                      {platform.name}
                    </div>
                    <div className="text-[10px] text-ink-muted truncate">
                      {platform.formats.length} canvas presets
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* =========================================================================
          4. Design Format & Canvas Presets
          ========================================================================= */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-teal">
              {activePlatform.name} Presets
            </div>
            <h3 className="text-lg sm:text-xl font-heading font-extrabold text-ink-primary">
              Available Canvas Sizes for {activePlatform.name}
            </h3>
          </div>
          <span className="text-xs text-ink-muted hidden sm:inline">
            {activePlatform.description}
          </span>
        </div>

        {/* Format Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredFormats.map((format) => (
            <div
              key={format.id}
              className="bg-surface rounded-2xl p-5 border border-border hover:border-teal/50 hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-3">
                {/* Header: Name and Badge */}
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-sm font-bold text-ink-primary group-hover:text-teal transition">
                    {format.name}
                  </h4>
                  {format.badge && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-teal/10 text-teal border border-teal/20 shrink-0">
                      {format.badge}
                    </span>
                  )}
                </div>

                {/* Miniature Canvas Preview (Visual Ratio Box) */}
                <div className="w-full h-36 bg-workspace rounded-xl border border-border p-3 flex items-center justify-center relative overflow-hidden group-hover:border-teal/30 transition">
                  {/* Aspect Ratio Box with Safe-Zone Guidelines */}
                  <div
                    style={{ aspectRatio: format.previewRatio }}
                    className="max-h-28 max-w-[85%] rounded border-2 border-dashed border-teal/40 bg-teal/5 flex flex-col items-center justify-center p-2 text-center transition-transform duration-200 group-hover:scale-105 relative"
                  >
                    <span className="text-[10px] font-mono font-bold text-teal">
                      {format.aspectRatio}
                    </span>
                    <span className="text-[9px] font-mono text-ink-muted mt-0.5">
                      {format.width}×{format.height}
                    </span>
                    {/* Safe Area Watermark */}
                    <div className="absolute inset-1.5 border border-teal/20 rounded pointer-events-none" />
                  </div>
                </div>

                {/* Dimension Chips */}
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-workspace border border-border text-ink-primary">
                    {format.width} × {format.height} px
                  </span>
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-workspace border border-border text-ink-secondary">
                    {format.aspectRatio}
                  </span>
                  {format.recommendedFormat && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200 dark:bg-[#2A2A2A] text-ink-muted ml-auto">
                      {format.recommendedFormat}
                    </span>
                  )}
                </div>

                {/* Intended Use & Safe Area Guide */}
                <p className="text-xs text-ink-secondary leading-relaxed line-clamp-2">
                  {format.intendedUse}
                </p>

                {format.safeArea && (
                  <div className="text-[10px] text-ink-muted font-mono leading-tight bg-workspace/60 p-2 rounded-lg border border-border">
                    <strong className="text-ink-secondary">Safe Zone:</strong> {format.safeArea}
                  </div>
                )}
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={() => handleSelectFormat(format)}
                className="w-full py-2.5 px-3 rounded-xl bg-teal hover:bg-teal/90 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <span>Select Format &amp; Start Design</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        {/* Custom Dimension Creator if "custom" platform is active or designer needs arbitrary canvas */}
        {activePlatform.id === "custom" && (
          <form
            onSubmit={handleLaunchCustomCanvas}
            className="p-5 sm:p-6 bg-surface rounded-2xl border border-teal/30 shadow-subtle space-y-4"
          >
            <div className="flex items-center gap-2">
              <Maximize2 className="w-4 h-4 text-teal" />
              <h4 className="text-sm font-bold text-ink-primary">
                Custom Canvas Dimension Generator
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-ink-muted block">
                  Project / Canvas Name
                </label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="e.g. Billboard Hero 4K"
                  className="w-full px-3 py-2 rounded-xl bg-workspace border border-border text-xs text-ink-primary focus:outline-none focus:border-teal"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-ink-muted block">
                  Width (px)
                </label>
                <input
                  type="number"
                  min="100"
                  max="8000"
                  value={customWidth}
                  onChange={(e) => setCustomWidth(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-workspace border border-border text-xs text-ink-primary focus:outline-none focus:border-teal font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-ink-muted block">
                  Height (px)
                </label>
                <input
                  type="number"
                  min="100"
                  max="8000"
                  value={customHeight}
                  onChange={(e) => setCustomHeight(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-workspace border border-border text-xs text-ink-primary focus:outline-none focus:border-teal font-mono"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-xl bg-teal hover:bg-teal/90 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Launch Custom Canvas</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>

      {/* =========================================================================
          5. Feature Templates Gallery (LinkedIn, Instagram, Facebook, Blogs, Emails, Others)
          ========================================================================= */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold tracking-wider text-teal uppercase">
              STARTER CONTENT &amp; LAYOUTS
            </div>
            <h3 className="text-lg sm:text-xl font-heading font-extrabold text-ink-primary">
              Feature Templates
            </h3>
          </div>
          <span className="text-xs text-ink-muted hidden sm:inline">
            Pick a starter layout to preload verified headline copy and structure into Designer Studio.
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {DESIGN_STARTER_TEMPLATES.map((tpl) => (
            <button
              key={tpl.id}
              type="button"
              onClick={() => handleSelectTemplate(tpl)}
              className="p-4 rounded-2xl bg-surface border border-border hover:border-teal hover:shadow-md transition-all duration-200 text-left flex flex-col justify-between h-40 group shadow-xs cursor-pointer"
            >
              <div>
                <div
                  className={`w-8 h-8 rounded-xl ${tpl.iconBg} text-white flex items-center justify-center shadow-xs mb-2.5`}
                >
                  {renderPlatformIcon(tpl.platform, "w-4 h-4")}
                </div>
                <div className="text-xs font-bold text-ink-primary group-hover:text-teal transition truncate">
                  {tpl.name}
                </div>
                <div className="text-[11px] text-ink-muted truncate mt-0.5">
                  {tpl.format}
                </div>
                <div className="text-[10px] text-ink-secondary line-clamp-2 mt-1 leading-snug">
                  {tpl.description}
                </div>
              </div>

              <div className="text-[11px] font-semibold text-teal group-hover:underline flex items-center gap-1 mt-2">
                <span>Use template</span>
                <span>→</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* =========================================================================
          6. Recent Designs Section (Real backend submission records)
          ========================================================================= */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold tracking-wider text-teal uppercase">
              CREATIVE PORTFOLIO
            </div>
            <h3 className="text-lg sm:text-xl font-heading font-extrabold text-ink-primary">
              Recent Designs
            </h3>
          </div>
          <span className="text-xs text-ink-muted">
            {designerSubmissions.length} saved design asset{designerSubmissions.length === 1 ? "" : "s"}
          </span>
        </div>

        {designerSubmissions.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {designerSubmissions.slice(0, 8).map((sub) => {
              const previewSrc =
                sub.media_url ||
                sub.file_path ||
                (sub.raw_text?.startsWith("data:") ? sub.raw_text : null);

              return (
                <div
                  key={sub.id}
                  className="bg-surface rounded-2xl border border-border p-4 hover:border-teal/40 hover:shadow-md transition-all duration-200 space-y-3 flex flex-col justify-between group"
                >
                  <div className="space-y-2.5">
                    {/* Thumbnail box */}
                    <div className="w-full h-32 rounded-xl bg-workspace border border-border overflow-hidden relative flex items-center justify-center">
                      {previewSrc ? (
                        <img
                          src={previewSrc}
                          alt={sub.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-ink-muted space-y-1">
                          <FileImage className="w-8 h-8 text-teal/40" />
                          <span className="text-[10px] font-mono">Design Specimen</span>
                        </div>
                      )}

                      <span
                        className={`absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full border backdrop-blur-md capitalize ${getSubmissionBadge(
                          sub.status
                        )}`}
                      >
                        {sub.status.replace("_", " ")}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-ink-primary group-hover:text-teal transition truncate">
                        {sub.title}
                      </h4>
                      <div className="flex items-center gap-2 text-[10px] text-ink-muted mt-1">
                        <span className="uppercase px-1.5 py-0.2 rounded bg-workspace border border-border font-mono">
                          {sub.content_type}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(sub.created_at).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Link
                    href={`/designer?submission_id=${sub.id}&action=edit&tab=canvas_audit`}
                    className="w-full py-2 px-3 rounded-xl bg-workspace hover:bg-surface border border-border hover:border-teal text-ink-primary text-xs font-bold transition flex items-center justify-center gap-1.5"
                  >
                    <span>Open in Studio</span>
                    <ExternalLink className="w-3.5 h-3.5 text-teal" />
                  </Link>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-surface rounded-2xl border border-dashed border-border p-10 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-teal/10 text-teal flex items-center justify-center mx-auto">
              <Palette className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-ink-primary">No designs created yet</h4>
            <p className="text-xs text-ink-secondary max-w-md mx-auto">
              Select one of the social media platforms and presets above to initialize your first canvas in Designer Studio.
            </p>
            <button
              type="button"
              onClick={() => setSelectedPlatformId("instagram")}
              className="px-4 py-2 rounded-xl bg-teal hover:bg-teal/90 text-white text-xs font-bold transition inline-flex items-center gap-2"
            >
              <span>Explore Instagram Presets</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
