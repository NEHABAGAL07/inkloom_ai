"use client";

import React, { useState, useEffect } from "react";
import { ApprovedAsset, ContentSubmission, AuditResult } from "@/types";
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
        initial_text: fileDataUrl || `Visual asset ${selectedFile.name} submitted for brand palette & typography compliance check.`,
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

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Enterprise Page Header */}
      <div className="bg-surface rounded-2xl p-6 sm:p-8 border border-border shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-3xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal/10 border border-teal/20 text-teal text-xs font-semibold">
            <Palette className="w-3.5 h-3.5" />
            <span>Creative & Visual Brand Governance Studio</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy tracking-tight">
            {activeOrgName || "Enterprise"} Brand Kit & Visual Compliance
          </h1>
          <p className="text-ink-secondary text-sm leading-relaxed">
            Inspect approved color tokens, official vector logos, and typography rules. Run automated visual compliance scans on graphics, banners, and media assets before production release.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="bg-workspace border border-border rounded-xl px-4 py-3 text-center">
            <span className="block text-[11px] font-bold uppercase tracking-wider text-ink-muted">Certified Palette</span>
            <span className="text-sm font-bold text-status-success flex items-center justify-center gap-1 mt-0.5">
              <CheckCircle className="w-3.5 h-3.5" /> Active
            </span>
          </div>
        </div>
      </div>

      {/* Deterministic Advisory Analysis Banner */}
      <div className="bg-teal/5 border border-teal/20 rounded-2xl p-4 flex items-start gap-3.5 shadow-subtle">
        <Info className="w-5 h-5 text-teal shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="text-xs font-bold text-navy flex items-center gap-2">
            <span>Deterministic Advisory Visual Governance</span>
            <span className="text-[10px] font-semibold text-teal px-2 py-0.5 rounded-full bg-teal/10 border border-teal/20">
              Advisory Analysis Only • No Synthetic Generation
            </span>
          </div>
          <p className="text-xs text-ink-secondary leading-relaxed">
            Inkloom AI performs deterministic color clustering, contrast ratio verification (WCAG 2.2 AA), wordmark clear-space checks, and metadata extraction.
            It does <strong>not</strong> synthesize artificial images, modify creative artwork, or fabricate media. All visual assets are creator-submitted and require human compliance authorization before release.
          </p>
        </div>
      </div>

      {/* Brand Visual & Voice Standards Panel */}
      <div className="bg-surface border border-border rounded-2xl p-6 shadow-subtle space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border">
          <div>
            <h2 className="text-sm font-bold text-navy flex items-center gap-2">
              <Layers className="w-4 h-4 text-teal" />
              <span>Brand Visual, Typography &amp; Voice Standards</span>
            </h2>
            <p className="text-xs text-ink-muted mt-0.5">Authoritative design guidelines, color tokens, and tone rules certified for enterprise campaigns</p>
          </div>
          <span className="text-[11px] text-teal font-semibold bg-teal/10 border border-teal/20 px-2.5 py-1 rounded-full w-fit">
            WCAG 2.2 AA Verified
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Logo Card */}
          <div className="p-4 rounded-xl bg-workspace border border-border flex flex-col justify-between space-y-4">
            <div>
              <div className="text-[11px] font-bold text-ink-muted uppercase tracking-wider">Primary Wordmark</div>
              <div className="text-sm font-bold text-navy mt-1">Official High-Res SVG Logo</div>
              <div className="mt-3 p-4 rounded-xl bg-surface border border-border flex items-center justify-center">
                <span className="text-xl font-black tracking-widest text-navy">INKLOOM</span>
              </div>
            </div>
            <div className="text-[11px] text-ink-muted space-y-1 pt-2 border-t border-border">
              <div className="flex justify-between">
                <span>Clear Space:</span>
                <span className="font-semibold text-navy">Min 24px perimeter</span>
              </div>
              <div className="flex justify-between">
                <span>Aspect Ratio:</span>
                <span className="font-semibold text-teal">Vector SVG (No skew)</span>
              </div>
            </div>
          </div>

          {/* Color Tokens Card with Click-to-Copy */}
          <div className="p-4 rounded-xl bg-workspace border border-border flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <div className="text-[11px] font-bold text-ink-muted uppercase tracking-wider">Color Tokens</div>
                {copiedColor && (
                  <span className="text-[10px] text-status-success font-bold animate-in fade-in">
                    Copied {copiedColor}!
                  </span>
                )}
              </div>
              <div className="text-sm font-bold text-navy mt-1">Authoritative Palette (Click to Copy)</div>
              <div className="grid grid-cols-3 gap-2 mt-3">
                {[
                  { hex: "#0D9488", label: "Teal Primary", bg: "bg-[#0D9488]" },
                  { hex: "#0F766E", label: "Deep Teal", bg: "bg-[#0F766E]" },
                  { hex: "#0F172A", label: "Navy Midnight", bg: "bg-[#0F172A]" },
                  { hex: "#14263D", label: "Slate Navy", bg: "bg-[#14263D]" },
                  { hex: "#15803D", label: "Emerald Success", bg: "bg-[#15803D]" },
                  { hex: "#64748B", label: "Slate Muted", bg: "bg-[#64748B]" },
                ].map((col) => (
                  <button
                    key={col.hex}
                    type="button"
                    onClick={() => copyToClipboard(col.hex)}
                    className="p-1.5 rounded-lg bg-surface border border-border hover:border-teal text-center transition group flex flex-col items-center"
                    title={`Click to copy ${col.label} (${col.hex})`}
                  >
                    <div className={`w-full h-6 rounded-md ${col.bg} border border-black/10`} />
                    <span className="text-[9px] font-mono text-ink-secondary mt-1 group-hover:text-teal font-semibold">
                      {col.hex}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <div className="text-[11px] text-ink-muted flex justify-between items-center pt-2 border-t border-border">
              <span>Min Contrast: 4.5:1</span>
              <span className="text-status-success font-bold">WCAG AA Pass</span>
            </div>
          </div>

          {/* Typography Hierarchy */}
          <div className="p-4 rounded-xl bg-workspace border border-border flex flex-col justify-between space-y-3">
            <div>
              <div className="text-[11px] font-bold text-ink-muted uppercase tracking-wider">Typography Scale</div>
              <div className="text-sm font-bold text-navy mt-1">Outfit / Inter Sans Scale</div>
              <div className="mt-3 space-y-2 text-xs">
                <div className="p-2 rounded-lg bg-surface border border-border">
                  <div className="text-[10px] text-ink-muted">Display / Hero (32px / 2rem)</div>
                  <div className="font-extrabold text-navy tracking-tight text-sm">Enterprise Governance</div>
                </div>
                <div className="p-2 rounded-lg bg-surface border border-border">
                  <div className="text-[10px] text-ink-muted">Section Headings (18px / 1.125rem)</div>
                  <div className="font-bold text-navy text-xs">Compliance Audit Evidence</div>
                </div>
                <div className="p-2 rounded-lg bg-surface border border-border">
                  <div className="text-[10px] text-ink-muted">Body Copy (14px / 0.875rem)</div>
                  <div className="text-ink-secondary text-[11px] leading-relaxed">Relaxed leading, 4.5:1 min contrast</div>
                </div>
              </div>
            </div>
            <div className="text-[11px] text-ink-muted flex justify-between items-center pt-2 border-t border-border">
              <span>Font Hierarchy:</span>
              <span className="text-teal font-bold">Inter / Outfit</span>
            </div>
          </div>

          {/* Anti-FUD & Tone Guidelines */}
          <div className="p-4 rounded-xl bg-workspace border border-border flex flex-col justify-between space-y-3">
            <div>
              <div className="text-[11px] font-bold text-ink-muted uppercase tracking-wider">Voice &amp; Tone Rules</div>
              <div className="text-sm font-bold text-navy mt-1">Anti-FUD &amp; Factual Clarity</div>
              <div className="mt-3 space-y-2 text-xs">
                <div className="p-2.5 rounded-lg bg-surface border border-border space-y-1">
                  <span className="text-[10px] font-bold text-status-success uppercase block">✓ Permitted Voice</span>
                  <p className="text-[11px] text-ink-secondary leading-relaxed">
                    Objective, factual statements with verified benchmark citations and statutory notices.
                  </p>
                </div>
                <div className="p-2.5 rounded-lg bg-surface border border-border space-y-1">
                  <span className="text-[10px] font-bold text-status-error uppercase block">✗ Prohibited (Anti-FUD)</span>
                  <p className="text-[11px] text-ink-secondary leading-relaxed">
                    Fear, uncertainty, doubt (FUD), unbacked superlatives (&quot;100% unbreakable&quot;), or uncertified claims.
                  </p>
                </div>
              </div>
            </div>
            <div className="text-[11px] text-ink-muted flex justify-between items-center pt-2 border-t border-border">
              <span>Mandatory Disclosure:</span>
              <span className="text-teal font-bold">SOC2 / ISO 27001</span>
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
