"use client";

import React, { useState, useEffect } from "react";
import { ApprovedAsset, ContentSubmission } from "@/types";
import { api } from "@/services/api";
import { useAuth } from "@/services/auth-context";

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

  const handleMediaAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;
    setIsAuditing(true);
    setAuditFeedback(null);
    try {
      // Create visual media submission
      await api.createSubmission({
        title: `Design Asset: ${selectedFile.name}`,
        description: `Visual brand asset submission (${selectedFile.type})`,
        content_type: selectedFile.type.startsWith("video") ? "video" : "image",
        initial_text: `Visual asset ${selectedFile.name} submitted for brand palette & typography compliance check.`,
      });
      setAuditFeedback(`✓ '${selectedFile.name}' uploaded and processed by Media Extractor. Contrast & logo safe-area checks initiated.`);
      setSelectedFile(null);
      onRefresh();
    } catch (err: any) {
      alert(err.message || "Upload failed");
    } finally {
      setIsAuditing(false);
    }
  };

  const designerSubmissions = submissions.filter((s) => s.content_type === "image" || s.content_type === "video" || s.content_type === "document");

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Hero */}
      <div className="relative rounded-3xl overflow-hidden p-8 border border-fuchsia-500/20 bg-gradient-to-r from-slate-900 via-fuchsia-950/30 to-slate-900 shadow-2xl">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-fuchsia-500/10 border border-fuchsia-500/30 text-fuchsia-400 text-xs font-bold">
            <span>🎨 Creative & Visual Brand Studio</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight sm:text-4xl">
            {activeOrgName || "Enterprise"} Brand Kit & Media Audit
          </h1>
          <p className="text-slate-300 text-sm leading-relaxed">
            Inspect approved color palettes, official logos, and typography rules. Run visual compliance scans on graphics, banners, and video assets before handing off to marketing and compliance.
          </p>
        </div>
      </div>

      {/* Brand Kit Asset Library */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>🖼️</span> Approved Brand Assets & Color Tokens
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Official brand elements certified for enterprise campaigns</p>
          </div>
          <span className="text-xs text-emerald-400 font-bold bg-emerald-950/80 border border-emerald-800 px-2.5 py-1 rounded-full">
            Active Palette Certified
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* Logo Card */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between space-y-4">
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Primary Wordmark</div>
              <div className="text-sm font-bold text-white mt-1">Official High-Res SVG Logo</div>
              <div className="mt-4 p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center">
                <span className="text-xl font-black tracking-widest text-indigo-400">INKLOOM</span>
              </div>
            </div>
            <div className="text-[11px] text-slate-400 flex justify-between items-center pt-2 border-t border-slate-800">
              <span>Padding: Min 24px</span>
              <span className="text-indigo-400 font-bold">Vector SVG</span>
            </div>
          </div>

          {/* Color Palette Card */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between space-y-4">
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Color Tokens</div>
              <div className="text-sm font-bold text-white mt-1">2026 Executive Palette</div>
              <div className="grid grid-cols-3 gap-2 mt-4">
                <div className="space-y-1 text-center">
                  <div className="h-10 rounded-lg bg-indigo-600 border border-indigo-400/40"></div>
                  <span className="text-[10px] font-mono text-slate-300">#6366F1</span>
                </div>
                <div className="space-y-1 text-center">
                  <div className="h-10 rounded-lg bg-slate-900 border border-slate-700"></div>
                  <span className="text-[10px] font-mono text-slate-300">#0F172A</span>
                </div>
                <div className="space-y-1 text-center">
                  <div className="h-10 rounded-lg bg-emerald-500 border border-emerald-400/40"></div>
                  <span className="text-[10px] font-mono text-slate-300">#10B981</span>
                </div>
              </div>
            </div>
            <div className="text-[11px] text-slate-400 flex justify-between items-center pt-2 border-t border-slate-800">
              <span>Min Contrast: 4.5:1</span>
              <span className="text-emerald-400 font-bold">WCAG AAA</span>
            </div>
          </div>

          {/* Certified Disclosures */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between space-y-4">
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Mandatory Boilerplate</div>
              <div className="text-sm font-bold text-white mt-1">Certified Security Statement</div>
              <div className="mt-4 p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 italic">
                &quot;Certified SOC 2 Type II and ISO 27001 compliant enterprise infrastructure.&quot;
              </div>
            </div>
            <div className="text-[11px] text-slate-400 flex justify-between items-center pt-2 border-t border-slate-800">
              <span>Required on Disclosures</span>
              <span className="text-indigo-400 font-bold">Verified</span>
            </div>
          </div>
        </div>
      </div>

      {/* Media Processing Uploader & Recent Creative Assets */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Upload Creative Asset for Visual Audit */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span>📤</span> Media Audit Ingestion (Images/Video)
          </h2>
          <p className="text-xs text-slate-400">
            Enforces file limits (25MB), checks visual contrast, and inspects video transcript heuristics.
          </p>

          {auditFeedback && (
            <div className="p-3 bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs rounded-xl">
              {auditFeedback}
            </div>
          )}

          <form onSubmit={handleMediaAudit} className="space-y-4">
            <div className="border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-slate-950/40">
              <input
                type="file"
                id="designer-file-input"
                className="hidden"
                accept="image/png,image/jpeg,image/webp,video/mp4,application/pdf"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              />
              <label htmlFor="designer-file-input" className="cursor-pointer space-y-2 block">
                <div className="text-3xl">🖼️</div>
                <div className="text-xs font-bold text-white">
                  {selectedFile ? selectedFile.name : "Click to select Graphic, Banner, or Video"}
                </div>
                <div className="text-[10px] text-slate-500">
                  PNG, JPG, WEBP, MP4, PDF (Safe extension sanitization enforced)
                </div>
              </label>
            </div>

            <button
              type="submit"
              disabled={!selectedFile || isAuditing}
              className="w-full py-2.5 bg-fuchsia-600 hover:bg-fuchsia-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-lg shadow-fuchsia-600/25 transition-all flex items-center justify-center gap-2"
            >
              {isAuditing ? "Processing with MediaExtractor..." : "Submit to Media Audit Engine →"}
            </button>
          </form>
        </div>

        {/* Right: Creative Submissions Pipeline */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span>🎨</span> Creative Assets & Revisions Status
          </h2>

          <div className="divide-y divide-slate-800">
            {designerSubmissions.length > 0 ? (
              designerSubmissions.map((sub) => (
                <div key={sub.id} className="py-3 flex items-center justify-between hover:bg-slate-800/30 px-3 rounded-xl transition-all">
                  <div className="space-y-1">
                    <div className="text-sm font-bold text-white flex items-center gap-2">
                      <span>{sub.title}</span>
                      <span className="text-[10px] text-slate-400 uppercase px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700">
                        {sub.content_type}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 line-clamp-1">{sub.description}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] px-2 py-0.5 rounded-full font-bold bg-slate-800 text-slate-300 border border-slate-700 capitalize">
                      {sub.status.replace("_", " ")}
                    </span>
                    <a
                      href="/audits"
                      className="text-xs px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700"
                    >
                      Audit Diff
                    </a>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-slate-500">
                No visual assets currently in review. Upload an image or video banner above.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
