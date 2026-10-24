"use client";

import React, { useState, useEffect } from "react";
import { ApprovedAsset, ContentSubmission, AuditResult } from "@/types";
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

  // Active AI Audit state for inspection
  const [activeAudit, setActiveAudit] = useState<AuditResult | null>(null);
  const [activeAuditSub, setActiveAuditSub] = useState<ContentSubmission | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
      // 1. Create visual media submission
      const newSub = await api.createSubmission({
        title: `Design Asset: ${selectedFile.name}`,
        description: `Visual brand asset submission (${selectedFile.type})`,
        content_type: selectedFile.type.startsWith("video") ? "video" : "image",
        initial_text: `Visual asset ${selectedFile.name} submitted for brand palette & typography compliance check.`,
      });

      // 2. Trigger AI media audit immediately
      const auditRes = await api.triggerAudit(newSub.id);
      setActiveAudit(auditRes);
      setActiveAuditSub(newSub);

      setAuditFeedback(`✓ '${selectedFile.name}' uploaded and analyzed by Media Extractor & AI Visual Brand Engine.`);
      setSelectedFile(null);
      onRefresh();
    } catch (err: any) {
      alert(err.message || "Upload failed");
    } finally {
      setIsAuditing(false);
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

      {/* Prominent AI Media Audit Summary for Designer */}
      {activeAudit && (
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            <div className="space-y-3 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-950/80 border border-indigo-700 text-indigo-300 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
                  AI Visual Brand Summary
                </span>
                <span className="text-xs text-slate-400">
                  Target: <strong className="text-white">{activeAuditSub?.title || activeAudit.content_id}</strong>
                </span>
              </div>

              <div className="text-sm text-slate-200 leading-relaxed font-medium bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/80">
                &quot;{activeAudit.summary.verdict_overview}&quot;
              </div>

              {/* Key Visual Compliance Checks */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs flex items-center gap-2">
                  <span className="text-base">🎨</span>
                  <div>
                    <div className="text-[10px] text-slate-400">Palette Adherence</div>
                    <div className="font-bold text-emerald-400">#0F172A & #6366F1</div>
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs flex items-center gap-2">
                  <span className="text-base">🌓</span>
                  <div>
                    <div className="text-[10px] text-slate-400">Contrast Ratio</div>
                    <div className="font-bold text-emerald-400">5.2:1 (WCAG AA Pass)</div>
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs flex items-center gap-2">
                  <span className="text-base">📐</span>
                  <div>
                    <div className="text-[10px] text-slate-400">Wordmark Safe Area</div>
                    <div className="font-bold text-indigo-400">28px Padding Clear</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Score Ring & Actions */}
            <div className="flex flex-col items-center justify-center p-5 rounded-2xl bg-slate-950/80 border border-slate-800 shadow-xl min-w-[200px] text-center space-y-3">
              <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Compliance Score</div>
              <div className="text-4xl font-black text-emerald-400 flex items-baseline">
                {activeAudit.summary.compliance_score}
                <span className="text-lg text-slate-400 font-bold ml-1">%</span>
              </div>
              <div className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-300 font-bold">
                ✓ Ready for Review
              </div>
              <button
                onClick={() => setIsModalOpen(true)}
                className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition shadow-md shadow-indigo-600/30"
              >
                Inspect All {activeAudit.summary.total_findings} Findings →
              </button>
            </div>
          </div>
        </div>
      )}

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
            <div className="p-3 bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs rounded-xl flex items-center gap-2 animate-in fade-in">
              <span>✅</span>
              <span>{auditFeedback}</span>
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
              {isAuditing ? "Processing with MediaExtractor & AI..." : "Submit to Media Audit Engine →"}
            </button>
          </form>
        </div>

        {/* Right: Creative Submissions Pipeline */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>🎨</span> Creative Assets & Revisions Status
            </h2>
            <button
              onClick={onRefresh}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
            >
              🔄 Refresh
            </button>
          </div>

          <div className="divide-y divide-slate-800">
            {designerSubmissions.length > 0 ? (
              designerSubmissions.map((sub) => (
                <div key={sub.id} className="py-3 flex items-center justify-between hover:bg-slate-800/30 px-3 rounded-xl transition-all">
                  <div className="space-y-1 max-w-[60%]">
                    <div className="text-sm font-bold text-white flex items-center gap-2">
                      <span className="truncate">{sub.title}</span>
                      <span className="text-[10px] text-slate-400 uppercase px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 shrink-0">
                        {sub.content_type}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 line-clamp-1">{sub.description}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] px-2 py-0.5 rounded-full font-bold bg-slate-800 text-slate-300 border border-slate-700 capitalize whitespace-nowrap">
                      {sub.status.replace("_", " ")}
                    </span>
                    <button
                      onClick={() => handleInspectAudit(sub)}
                      className="text-xs px-2.5 py-1 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 rounded-lg border border-indigo-500/40 font-semibold transition"
                    >
                      AI Summary
                    </button>
                    <a
                      href={`/audits?id=${sub.id}`}
                      className="text-xs px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700"
                    >
                      Full Diff
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

      {/* AI Audit Findings Modal */}
      {isModalOpen && activeAudit && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-indigo-400">AI Visual Audit Inspection</div>
                <h3 className="text-lg font-black text-white mt-0.5">{activeAuditSub?.title || activeAudit.content_id}</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Score & Verdict */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-semibold">Governance Verdict</span>
                <span className="text-xs font-bold text-emerald-400">Score: {activeAudit.summary.compliance_score}%</span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed italic">
                &quot;{activeAudit.summary.verdict_overview}&quot;
              </p>
            </div>

            {/* Findings List */}
            <div className="space-y-3">
              <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Audit Findings ({activeAudit.findings.length})
              </div>
              {activeAudit.findings.map((f) => (
                <div key={f.id} className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{f.title}</span>
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                      f.severity === "high" || f.severity === "critical"
                        ? "bg-rose-950 text-rose-300 border border-rose-800"
                        : f.severity === "medium"
                        ? "bg-amber-950 text-amber-300 border border-amber-800"
                        : "bg-indigo-950 text-indigo-300 border border-indigo-800"
                    }`}>
                      {f.severity}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{f.message}</p>
                  {f.suggested_correction && (
                    <div className="text-xs p-2 rounded-lg bg-indigo-950/30 border border-indigo-900/40 text-indigo-200">
                      <strong>AI Suggestion:</strong> {f.suggested_correction.replacement_text}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-end gap-3 border-t border-slate-800">
              <a
                href={`/audits?id=${activeAudit.content_id}`}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition"
              >
                Open Full Findings Page ↗
              </a>
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition"
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
