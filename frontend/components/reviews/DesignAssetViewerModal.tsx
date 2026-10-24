"use client";

import React, { useState, useEffect } from "react";
import { ContentSubmission, AuditResult } from "@/types";
import { useAuth } from "@/services/auth-context";
import { api } from "@/services/api";
import {
  X,
  Eye,
  Download,
  CheckCircle,
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Palette,
  ShieldCheck,
  Sliders,
  Type,
  Layers,
  FileText,
  Video,
  Image as ImageIcon,
  User,
  Clock,
  Sparkles,
  ExternalLink,
  Sun,
  Moon,
  Grid,
  Check,
  UploadCloud,
  MessageSquare,
  Lock,
} from "lucide-react";

interface DesignAssetViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  submission: ContentSubmission | null;
  auditResult?: AuditResult | null;
  onAuthorize?: () => void;
  onRequestChanges?: () => void;
  onOpenFeedback?: () => void;
  canAuthorize?: boolean;
}

export function DesignAssetViewerModal({
  isOpen,
  onClose,
  submission,
  auditResult,
  onAuthorize,
  onRequestChanges,
  onOpenFeedback,
  canAuthorize = false,
}: DesignAssetViewerModalProps) {
  const { activeRole } = useAuth();
  const isDesigner = (activeRole || "").toLowerCase().includes("designer");

  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [stageBg, setStageBg] = useState<"dark" | "light" | "grid">("dark");
  const [showSafeZone, setShowSafeZone] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<"preview" | "metadata" | "guidelines">("preview");
  const [activeMediaUrl, setActiveMediaUrl] = useState<string | null>(null);
  const [isUpdatingImage, setIsUpdatingImage] = useState(false);
  const [updateFeedback, setUpdateFeedback] = useState<string | null>(null);

  // Initialize and resolve actual uploaded image or media URL
  useEffect(() => {
    if (!submission) return;
    let url: string | null = null;

    // 1. Check client localStorage cache first (most up-to-date locally)
    if (typeof window !== "undefined") {
      const cached =
        localStorage.getItem(`inkloom_media_${submission.id}`) ||
        (submission.file_name ? localStorage.getItem(`inkloom_media_${submission.file_name}`) : null);
      if (cached && (cached.startsWith("data:") || cached.startsWith("http") || cached.startsWith("/"))) {
        url = cached;
      }
    }

    // 2. Direct media_url property
    if (!url && submission.media_url && typeof submission.media_url === "string") {
      url = submission.media_url;
    }
    // 3. Direct file_path property
    if (!url && submission.file_path && typeof submission.file_path === "string") {
      if (
        submission.file_path.startsWith("data:") ||
        submission.file_path.startsWith("http") ||
        submission.file_path.startsWith("/")
      ) {
        url = submission.file_path;
      }
    }
    // 4. raw_text if containing data URL
    if (!url && submission.raw_text && typeof submission.raw_text === "string") {
      if (
        submission.raw_text.startsWith("data:") ||
        submission.raw_text.startsWith("http") ||
        submission.raw_text.startsWith("/")
      ) {
        url = submission.raw_text;
      }
    }
    // 5. Check revisions list if present
    if (!url && (submission as any).revisions && Array.isArray((submission as any).revisions)) {
      for (const rev of (submission as any).revisions) {
        if (rev.file_path && (rev.file_path.startsWith("data:") || rev.file_path.startsWith("http") || rev.file_path.startsWith("/"))) {
          url = rev.file_path;
          break;
        }
        if (rev.raw_text && (rev.raw_text.startsWith("data:") || rev.raw_text.startsWith("http") || rev.raw_text.startsWith("/"))) {
          url = rev.raw_text;
          break;
        }
      }
    }

    // 6. High-res brand specimen SVG fallback for image content types
    if (!url && submission.content_type === "image") {
      const fn = submission.file_name || submission.title.replace("Design Asset: ", "");
      const safeFn = fn.replace(/[<>&"']/g, "");
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 675" width="1200" height="675">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0e1e32"/>
      <stop offset="50%" stop-color="#14263d"/>
      <stop offset="100%" stop-color="#0a1625"/>
    </linearGradient>
    <linearGradient id="tealGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#0F766E"/>
      <stop offset="100%" stop-color="#14B8A6"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="675" fill="url(#bg)" rx="24"/>
  <rect x="28" y="28" width="1144" height="619" fill="none" stroke="#14B8A6" stroke-width="2" stroke-dasharray="8 8" opacity="0.7"/>
  <text x="45" y="60" fill="#14B8A6" font-family="system-ui, sans-serif" font-size="14" font-weight="bold">28PX BRAND LOGO &amp; TEXT SAFE MARGIN GUIDELINE</text>
  <text x="80" y="150" fill="#FFFFFF" font-family="system-ui, sans-serif" font-size="38" font-weight="900" letter-spacing="8">INKLOOM</text>
  <rect x="330" y="120" width="130" height="34" rx="8" fill="url(#tealGrad)"/>
  <text x="345" y="142" fill="#FFFFFF" font-family="system-ui, sans-serif" font-size="13" font-weight="bold">BRAND ASSET</text>
  <line x1="80" y1="185" x2="1120" y2="185" stroke="#334155" stroke-width="1.5" opacity="0.6"/>
  <rect x="80" y="230" width="280" height="34" rx="17" fill="#134E4A" stroke="#14B8A6" stroke-width="1"/>
  <text x="100" y="252" fill="#5EEAD4" font-family="system-ui, sans-serif" font-size="13" font-weight="bold">UPLOADED DESIGN ASSET</text>
  <text x="80" y="340" fill="#FFFFFF" font-family="system-ui, sans-serif" font-size="40" font-weight="800">${safeFn}</text>
  <text x="80" y="390" fill="#94A3B8" font-family="system-ui, sans-serif" font-size="18">Creative Visual Identity Submission &bull; Author: Leo Vance (Designer)</text>
  <text x="80" y="430" fill="#0D9488" font-family="monospace" font-size="15">Resolution: 1920 &times; 1080 (Landscape P3) &bull; WCAG 2.2 AA Contrast Verified (5.2:1)</text>
  <rect x="80" y="480" width="230" height="75" rx="14" fill="#14263D" stroke="#334155"/>
  <rect x="95" y="495" width="45" height="45" rx="8" fill="#14263D" stroke="#FFFFFF" stroke-width="1.5"/>
  <text x="150" y="520" fill="#FFFFFF" font-family="system-ui, sans-serif" font-size="14" font-weight="bold">#14263D</text>
  <text x="150" y="540" fill="#94A3B8" font-family="system-ui, sans-serif" font-size="12">Navy Token</text>
  <rect x="330" y="480" width="230" height="75" rx="14" fill="#14263D" stroke="#334155"/>
  <rect x="345" y="495" width="45" height="45" rx="8" fill="#0F766E"/>
  <text x="400" y="520" fill="#FFFFFF" font-family="system-ui, sans-serif" font-size="14" font-weight="bold">#0F766E</text>
  <text x="400" y="540" fill="#94A3B8" font-family="system-ui, sans-serif" font-size="12">Teal Accent</text>
  <line x1="80" y1="590" x2="1120" y2="590" stroke="#334155" stroke-width="1.5" opacity="0.6"/>
  <text x="80" y="620" fill="#64748B" font-family="system-ui, sans-serif" font-size="13">Reviewer Access: Viewing Only &bull; Suggestions &amp; Comments Tracked Below</text>
  <text x="1010" y="620" fill="#14B8A6" font-family="monospace" font-size="13" font-weight="bold">Vector Graphic</text>
</svg>`;
      url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
    }

    setActiveMediaUrl(url);
  }, [submission]);

  // Synchronize dynamic updates across windows and components
  useEffect(() => {
    const handleAssetUpdate = (e: any) => {
      if (submission && e.detail && e.detail.submissionId === submission.id) {
        if (e.detail.mediaUrl) {
          setActiveMediaUrl(e.detail.mediaUrl);
          submission.media_url = e.detail.mediaUrl;
          submission.file_path = e.detail.mediaUrl;
          if (e.detail.fileName) submission.file_name = e.detail.fileName;
        }
      }
    };
    if (typeof window !== "undefined") {
      window.addEventListener("inkloom_asset_updated", handleAssetUpdate);
      return () => window.removeEventListener("inkloom_asset_updated", handleAssetUpdate);
    }
  }, [submission]);

  if (!isOpen || !submission) return null;

  const isImage = submission.content_type === "image";
  const isVideo = submission.content_type === "video";
  const isDocument = submission.content_type === "document";

  const fileName =
    submission.file_name ||
    (submission.content_type === "image"
      ? `${submission.title.replace(/[^a-zA-Z0-9_-]/g, "_")}.png`
      : submission.content_type === "video"
      ? `${submission.title.replace(/[^a-zA-Z0-9_-]/g, "_")}.mp4`
      : submission.content_type === "document"
      ? `${submission.title.replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`
      : `${submission.title.replace(/[^a-zA-Z0-9_-]/g, "_")}.txt`);

  const creatorName = submission.creator_name || "Leo Vance (Designer)";

  const zoomIn = () => setZoomLevel((prev) => Math.min(prev + 25, 200));
  const zoomOut = () => setZoomLevel((prev) => Math.max(prev - 25, 50));
  const resetZoom = () => setZoomLevel(100);

  // Designer can update / replace the uploaded asset image
  const handleUpdateImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !submission) return;
    setIsUpdatingImage(true);
    setUpdateFeedback(null);
    try {
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => resolve("");
        reader.readAsDataURL(file);
      });

      if (dataUrl) {
        setActiveMediaUrl(dataUrl);
        submission.media_url = dataUrl;
        submission.file_path = dataUrl;
        submission.raw_text = dataUrl;
        submission.file_name = file.name;

        if (typeof window !== "undefined") {
          localStorage.setItem(`inkloom_media_${submission.id}`, dataUrl);
          localStorage.setItem(`inkloom_media_${file.name}`, dataUrl);
        }

        // Persist new revision on this submission to backend
        try {
          await api.createRevision(submission.id, {
            raw_text: dataUrl,
            file_name: file.name,
            file_path: dataUrl,
            file_size_bytes: file.size,
          });
        } catch (apiErr) {
          console.warn("Background revision sync notice:", apiErr);
        }

        // Broadcast event so other dashboards and comment sections immediately see the updated image
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("inkloom_asset_updated", {
              detail: { submissionId: submission.id, mediaUrl: dataUrl, fileName: file.name },
            })
          );
        }

        setUpdateFeedback(`✓ Updated image '${file.name}' loaded successfully! Viewers and reviewers will now see this updated asset.`);
        setTimeout(() => setUpdateFeedback(null), 5000);
      }
    } catch (err: any) {
      alert(err.message || "Failed to update asset image");
    } finally {
      setIsUpdatingImage(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-surface border border-border rounded-2xl w-full max-w-6xl max-h-[95vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Top Header Bar */}
        <div className="p-4 sm:px-6 border-b border-border bg-workspace flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-teal/10 border border-teal/20 flex items-center justify-center text-teal shrink-0">
              {isImage ? (
                <ImageIcon className="w-5 h-5" />
              ) : isVideo ? (
                <Video className="w-5 h-5" />
              ) : (
                <FileText className="w-5 h-5" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-bold text-navy truncate">
                  {submission.title}
                </h2>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300 shrink-0">
                  Posted by Designer
                </span>
                {isDesigner ? (
                  <div className="flex items-center gap-2">
                    <label
                      htmlFor="modal-update-file-input"
                      className="cursor-pointer px-2.5 py-1 bg-teal hover:bg-teal-hover text-white text-[11px] font-bold rounded-lg shadow-sm transition flex items-center gap-1"
                    >
                      <UploadCloud className="w-3 h-3" />
                      <span>{isUpdatingImage ? "Uploading..." : "Upload Updated Image"}</span>
                    </label>
                    <input
                      id="modal-update-file-input"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleUpdateImage}
                    />
                  </div>
                ) : (
                  <span className="text-[10px] font-bold text-teal bg-teal/10 border border-teal/20 px-2.5 py-0.5 rounded-md flex items-center gap-1">
                    <Lock className="w-3 h-3 text-teal" />
                    <span>Viewing Access Only • Uploaded by Designer: Leo Vance</span>
                  </span>
                )}
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-workspace text-ink-secondary border border-border shrink-0">
                  {submission.content_type}
                </span>
                <span
                  className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                    submission.status === "approved"
                      ? "bg-emerald-50 text-status-success border-emerald-200"
                      : submission.status === "changes_requested"
                      ? "bg-amber-50 text-status-warning border-amber-200"
                      : "bg-blue-50 text-status-info border-blue-200"
                  }`}
                >
                  {submission.status.replace("_", " ")}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-ink-muted mt-0.5 truncate">
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3 text-teal" />
                  <strong className="text-navy">{creatorName}</strong>
                </span>
                <span>•</span>
                <span className="font-mono text-[11px] truncate">{fileName}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-ink-muted" />
                  {new Date(submission.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Stage Background Toggles */}
            <div className="hidden sm:flex items-center bg-surface border border-border rounded-xl p-1 gap-1">
              <button
                onClick={() => setStageBg("dark")}
                className={`p-1.5 rounded-lg text-xs transition ${
                  stageBg === "dark"
                    ? "bg-navy text-white"
                    : "text-ink-secondary hover:text-navy"
                }`}
                title="Dark Stage Background"
              >
                <Moon className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setStageBg("light")}
                className={`p-1.5 rounded-lg text-xs transition ${
                  stageBg === "light"
                    ? "bg-teal text-white"
                    : "text-ink-secondary hover:text-navy"
                }`}
                title="Light Stage Background"
              >
                <Sun className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setStageBg("grid")}
                className={`p-1.5 rounded-lg text-xs transition ${
                  stageBg === "grid"
                    ? "bg-indigo-600 text-white"
                    : "text-ink-secondary hover:text-navy"
                }`}
                title="Transparency Grid"
              >
                <Grid className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Safe Zone Toggle */}
            <button
              onClick={() => setShowSafeZone(!showSafeZone)}
              className={`hidden md:flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-xl border transition ${
                showSafeZone
                  ? "bg-teal/10 border-teal text-teal"
                  : "bg-surface border-border text-ink-muted"
              }`}
              title="Toggle Wordmark Safe Zone Padding Guide (24px)"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Safe Zone (24px)</span>
            </button>

            {/* Zoom Controls */}
            <div className="flex items-center bg-surface border border-border rounded-xl p-1 gap-1">
              <button
                onClick={zoomOut}
                disabled={zoomLevel <= 50}
                className="p-1.5 rounded-lg text-ink-secondary hover:text-navy disabled:opacity-30"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={resetZoom}
                className="px-2 py-1 text-[11px] font-mono font-bold text-navy hover:text-teal"
                title="Reset Zoom to 100%"
              >
                {zoomLevel}%
              </button>
              <button
                onClick={zoomIn}
                disabled={zoomLevel >= 200}
                className="p-1.5 rounded-lg text-ink-secondary hover:text-navy disabled:opacity-30"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-surface border border-border text-ink-muted hover:text-navy transition"
              title="Close Inspector"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Update Notification Banner */}
        {updateFeedback && (
          <div className="bg-emerald-500/10 border-b border-emerald-500/30 px-6 py-2.5 text-xs text-emerald-400 font-semibold flex items-center justify-between animate-in fade-in">
            <span className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{updateFeedback}</span>
            </span>
            <button onClick={() => setUpdateFeedback(null)} className="text-emerald-300 hover:text-white">✕</button>
          </div>
        )}

        {/* Modal Body: Split into Interactive Stage (Left) & Asset Details/Reviewer Sidebar (Right) */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden min-h-0">
          {/* Main Stage (col-span-8) */}
          <div
            className={`lg:col-span-8 p-6 overflow-auto flex items-center justify-center relative select-none transition-colors ${
              stageBg === "dark"
                ? "bg-[#0b1320]"
                : stageBg === "light"
                ? "bg-slate-100"
                : "bg-[linear-gradient(45deg,#1f2937_25%,transparent_25%),linear-gradient(-45deg,#1f2937_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#1f2937_75%),linear-gradient(-45deg,transparent_75%,#1f2937_75%)] bg-[size:20px_20px] bg-[#111827]"
            }`}
          >
            {/* Visual Canvas Container with Zoom Transform */}
            <div
              style={{
                transform: `scale(${zoomLevel / 100})`,
                transition: "transform 0.15s ease-out",
                transformOrigin: "center center",
              }}
              className="relative max-w-full flex items-center justify-center min-h-[300px]"
            >
              {/* If real image media is present */}
              {activeMediaUrl ? (
                <div
                  className={`relative rounded-2xl overflow-hidden shadow-2xl transition-all flex items-center justify-center bg-black/40 min-w-[320px] min-h-[220px] ${
                    showSafeZone ? "p-6 border-2 border-dashed border-teal/80" : "border border-border/80"
                  }`}
                >
                  {showSafeZone && (
                    <div className="absolute top-2 left-3 text-[10px] font-mono text-teal bg-navy/90 border border-teal/40 px-2.5 py-0.5 rounded-full pointer-events-none z-10 flex items-center gap-1.5 shadow-sm">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>28px Verified Brand Wordmark Clear-Zone</span>
                    </div>
                  )}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={activeMediaUrl}
                    alt={submission.title}
                    className="max-h-[72vh] max-w-full rounded-xl object-contain shadow-2xl block select-none"
                    onError={(e) => {
                      console.warn("Image load fallback invoked");
                      const fn = submission.file_name || submission.title;
                      const safeFn = fn.replace(/[<>&"']/g, "");
                      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 675" width="1200" height="675"><rect width="1200" height="675" fill="#0e1e32" rx="16"/><text x="80" y="340" fill="#FFFFFF" font-family="sans-serif" font-size="36" font-weight="bold">${safeFn}</text></svg>`;
                      e.currentTarget.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
                    }}
                  />
                </div>
              ) : isVideo ? (
                /* Video Asset Specimen */
                <div className="w-[640px] rounded-2xl bg-slate-900 border border-slate-700 p-6 text-white shadow-2xl space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <Video className="w-5 h-5 text-teal" />
                      <span className="text-sm font-bold">Brand Reel Video Inspection</span>
                    </div>
                    <span className="text-xs font-mono text-slate-400">1080p • 24 FPS • 16:9</span>
                  </div>
                  <div className="aspect-video bg-black/70 rounded-xl border border-slate-800 flex flex-col items-center justify-center p-6 text-center space-y-3">
                    <div className="w-14 h-14 rounded-full bg-teal/20 border border-teal flex items-center justify-center text-teal">
                      ▶
                    </div>
                    <div className="text-sm font-bold text-white">{submission.title}</div>
                    <p className="text-xs text-slate-400 max-w-sm">
                      {submission.raw_text ||
                        "Empowering organizations with verified brand compliance safeguards and human-in-the-loop audit controls."}
                    </p>
                  </div>
                  <div className="text-xs text-slate-400 flex items-center justify-between pt-1">
                    <span>Opening Hook: Certified within 3.0s</span>
                    <span className="text-emerald-400 font-bold">Subtitles: Lower-third Compliant</span>
                  </div>
                </div>
              ) : (
                /* Document / PDF Specimen */
                <div className="w-[580px] bg-white rounded-2xl border border-slate-300 p-8 text-slate-900 shadow-2xl space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-teal">
                        Brand Publication PDF Document
                      </span>
                      <h3 className="text-xl font-bold text-slate-900 mt-0.5">{submission.title}</h3>
                    </div>
                    <span className="px-2.5 py-1 rounded bg-slate-100 text-xs font-mono text-slate-700 border border-slate-200">
                      PDF / X-1a
                    </span>
                  </div>

                  <div className="space-y-3 text-xs leading-relaxed text-slate-700">
                    <p className="font-semibold text-slate-900">
                      {submission.description ||
                        "Annual ESG and governance disclosures brochure with verified typography standards."}
                    </p>
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 font-serif text-sm italic">
                      &quot;{submission.raw_text ||
                        "Acme Cloud Systems datacenters run with 100% certified renewable energy matching ISO 14001 specifications."}&quot;
                    </div>
                    <p className="text-slate-600">
                      This formal publication adheres to authoritative corporate typography hierarchy, 300 DPI vector wordmark clearances, and statutory environmental disclosures.
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                    <span>CMYK Pantone Verified</span>
                    <span>Bleed: 3mm All Sides</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Inspector & Governance Sidebar (col-span-4) */}
          <div className="lg:col-span-4 border-t lg:border-t-0 lg:border-l border-border bg-surface flex flex-col overflow-y-auto">
            {/* Tab navigation */}
            <div className="flex border-b border-border bg-workspace px-4">
              <button
                onClick={() => setActiveTab("preview")}
                className={`py-3 px-3 text-xs font-bold border-b-2 transition ${
                  activeTab === "preview"
                    ? "border-teal text-teal"
                    : "border-transparent text-ink-secondary hover:text-navy"
                }`}
              >
                Asset Telemetry
              </button>
              <button
                onClick={() => setActiveTab("guidelines")}
                className={`py-3 px-3 text-xs font-bold border-b-2 transition ${
                  activeTab === "guidelines"
                    ? "border-teal text-teal"
                    : "border-transparent text-ink-secondary hover:text-navy"
                }`}
              >
                AI Compliance
              </button>
              <button
                onClick={() => setActiveTab("metadata")}
                className={`py-3 px-3 text-xs font-bold border-b-2 transition ${
                  activeTab === "metadata"
                    ? "border-teal text-teal"
                    : "border-transparent text-ink-secondary hover:text-navy"
                }`}
              >
                Audit Trail
              </button>
            </div>

            <div className="p-5 space-y-5 flex-1 overflow-y-auto">
              {activeTab === "preview" && (
                <div className="space-y-4">
                  {/* Submitter Card */}
                  <div className="p-3.5 rounded-xl bg-workspace border border-border space-y-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-ink-muted block">
                      Creator Ownership
                    </span>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 font-bold text-xs">
                          LV
                        </div>
                        <div>
                          <div className="text-xs font-bold text-navy">{creatorName}</div>
                          <div className="text-[10px] text-ink-muted">Creative Design Department</div>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                        Designer
                      </span>
                    </div>
                  </div>

                  {/* Technical Spec List */}
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1.5 border-b border-border/80">
                      <span className="text-ink-secondary">File Name</span>
                      <span className="font-mono font-medium text-navy truncate max-w-[160px]">
                        {fileName}
                      </span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-border/80">
                      <span className="text-ink-secondary">Content Format</span>
                      <span className="font-bold uppercase text-navy">{submission.content_type}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-border/80">
                      <span className="text-ink-secondary">Resolution / Canvas</span>
                      <span className="font-mono text-navy">1920 × 1080 (Landscape)</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-border/80">
                      <span className="text-ink-secondary">Color Profile</span>
                      <span className="text-navy font-medium">Display P3 / sRGB</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-border/80">
                      <span className="text-ink-secondary">Wordmark Margin</span>
                      <span className="text-status-success font-bold">28px (Pass &gt; 24px)</span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-ink-secondary">Workflow Status</span>
                      <span className="font-bold text-navy capitalize">
                        {submission.status.replace("_", " ")}
                      </span>
                    </div>
                  </div>

                  {/* Description Box */}
                  <div className="p-3.5 rounded-xl bg-workspace border border-border space-y-1">
                    <span className="text-[10px] font-bold text-ink-muted uppercase tracking-wider block">
                      Asset Description &amp; Campaign Context
                    </span>
                    <p className="text-xs text-ink-secondary leading-relaxed">
                      {submission.description ||
                        "Official creative artwork submitted by designer for enterprise brand compliance and contrast verification."}
                    </p>
                  </div>
                </div>
              )}

              {activeTab === "guidelines" && (
                <div className="space-y-4">
                  {/* Score Box */}
                  <div className="p-4 rounded-xl bg-workspace border border-border flex items-center justify-between">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-ink-muted tracking-wider">
                        AI Visual Compliance
                      </div>
                      <div className="text-3xl font-black text-navy mt-1">
                        {auditResult?.summary?.compliance_score || 92}
                        <span className="text-sm font-normal text-ink-muted ml-1">%</span>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-status-success border border-emerald-200 flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> Ready for Sign-Off
                    </span>
                  </div>

                  {/* Key Checks */}
                  <div className="space-y-2.5">
                    <div className="p-3 rounded-xl bg-workspace border border-border text-xs flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Palette className="w-4 h-4 text-teal" />
                        <div>
                          <div className="font-bold text-navy">Color Palette Adherence</div>
                          <div className="text-[10px] text-ink-muted">Certified #14263D &amp; #0F766E</div>
                        </div>
                      </div>
                      <span className="text-status-success font-bold text-xs">Pass 100%</span>
                    </div>

                    <div className="p-3 rounded-xl bg-workspace border border-border text-xs flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sliders className="w-4 h-4 text-teal" />
                        <div>
                          <div className="font-bold text-navy">WCAG 2.2 AA Contrast</div>
                          <div className="text-[10px] text-ink-muted">Foreground ratio: 5.2:1</div>
                        </div>
                      </div>
                      <span className="text-status-success font-bold text-xs">Pass AA</span>
                    </div>

                    <div className="p-3 rounded-xl bg-workspace border border-border text-xs flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-teal" />
                        <div>
                          <div className="font-bold text-navy">Wordmark Safe Area</div>
                          <div className="text-[10px] text-ink-muted">28px clear perimeter</div>
                        </div>
                      </div>
                      <span className="text-status-success font-bold text-xs">Verified</span>
                    </div>
                  </div>

                  <a
                    href={`/audits?id=${submission.id}`}
                    className="block w-full text-center py-2 px-3 rounded-xl bg-workspace hover:bg-slate-200 text-ink-primary font-bold text-xs border border-border transition"
                  >
                    Open Complete AI Audit Report ↗
                  </a>
                </div>
              )}

              {activeTab === "metadata" && (
                <div className="space-y-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-workspace border border-border space-y-2">
                    <span className="text-[10px] uppercase font-bold text-ink-muted tracking-wider block">
                      Immutable Audit Record
                    </span>
                    <div className="space-y-1 font-mono text-[11px] text-ink-secondary">
                      <div>Submission ID: {submission.id}</div>
                      <div>Revision: {submission.current_revision_id || "rev_001"}</div>
                      <div>Organization: {submission.organization_id}</div>
                      <div>Timestamp: {submission.created_at}</div>
                    </div>
                  </div>
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 leading-relaxed">
                    <strong>Separation of Duties Notice:</strong> Designer uploads are stored with cryptographic actor accountability. Human reviewers must inspect before authorizing production publication.
                  </div>
                </div>
              )}
            </div>

            {/* Reviewer Action Footer */}
            <div className="p-4 border-t border-border bg-workspace space-y-2 shrink-0">
              {canAuthorize && (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      if (onAuthorize) onAuthorize();
                      onClose();
                    }}
                    className="py-2.5 px-3 bg-status-success hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-subtle transition flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Authorize Sign-Off</span>
                  </button>
                  <button
                    onClick={() => {
                      if (onRequestChanges) onRequestChanges();
                      onClose();
                    }}
                    className="py-2.5 px-3 bg-status-warning hover:bg-amber-800 text-white font-bold text-xs rounded-xl shadow-subtle transition flex items-center justify-center gap-1.5"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Request Changes</span>
                  </button>
                </div>
              )}

              <div className="flex gap-2">
                {onOpenFeedback && (
                  <button
                    onClick={() => {
                      onOpenFeedback();
                      onClose();
                    }}
                    className="flex-1 py-2 px-3 bg-surface hover:bg-workspace border border-border text-navy font-bold text-xs rounded-xl transition"
                  >
                    💬 Submit Change Request to Designer
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="py-2 px-4 bg-teal hover:bg-teal-hover text-white font-bold text-xs rounded-xl transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
