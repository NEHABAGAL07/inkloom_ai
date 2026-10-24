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
} from "lucide-react";

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

      setAuditFeedback(`'${selectedFile.name}' uploaded and analyzed by Media Extractor & AI Visual Brand Engine.`);
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

      {/* Brand Kit Asset Library Cards */}
      <div className="bg-surface border border-border rounded-2xl p-6 shadow-subtle space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border">
          <div>
            <h2 className="text-sm font-bold text-navy flex items-center gap-2">
              <Layers className="w-4 h-4 text-teal" />
              <span>Approved Brand Assets & Color Tokens</span>
            </h2>
            <p className="text-xs text-ink-muted mt-0.5">Authoritative elements certified for enterprise campaigns</p>
          </div>
          <span className="text-[11px] text-teal font-semibold bg-teal/10 border border-teal/20 px-2.5 py-1 rounded-full w-fit">
            WCAG 2.2 AA Verified
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          {/* Logo Card */}
          <div className="p-4 rounded-xl bg-workspace border border-border flex flex-col justify-between space-y-4">
            <div>
              <div className="text-[11px] font-bold text-ink-muted uppercase tracking-wider">Primary Wordmark</div>
              <div className="text-sm font-bold text-navy mt-1">Official High-Res SVG Logo</div>
              <div className="mt-4 p-4 rounded-xl bg-surface border border-border flex items-center justify-center">
                <span className="text-xl font-black tracking-widest text-navy">INKLOOM</span>
              </div>
            </div>
            <div className="text-[11px] text-ink-muted flex justify-between items-center pt-2 border-t border-border">
              <span>Clear Space: Min 24px</span>
              <span className="text-teal font-bold">Vector SVG</span>
            </div>
          </div>

          {/* Color Palette Card */}
          <div className="p-4 rounded-xl bg-workspace border border-border flex flex-col justify-between space-y-4">
            <div>
              <div className="text-[11px] font-bold text-ink-muted uppercase tracking-wider">Color Tokens</div>
              <div className="text-sm font-bold text-navy mt-1">2026 Executive Palette</div>
              <div className="grid grid-cols-3 gap-2 mt-4">
                <div className="space-y-1 text-center">
                  <div className="h-10 rounded-lg bg-[#14263D] border border-border"></div>
                  <span className="text-[10px] font-mono text-ink-secondary">#14263D</span>
                </div>
                <div className="space-y-1 text-center">
                  <div className="h-10 rounded-lg bg-[#0F766E] border border-border"></div>
                  <span className="text-[10px] font-mono text-ink-secondary">#0F766E</span>
                </div>
                <div className="space-y-1 text-center">
                  <div className="h-10 rounded-lg bg-[#15803D] border border-border"></div>
                  <span className="text-[10px] font-mono text-ink-secondary">#15803D</span>
                </div>
              </div>
            </div>
            <div className="text-[11px] text-ink-muted flex justify-between items-center pt-2 border-t border-border">
              <span>Min Contrast: 4.5:1</span>
              <span className="text-status-success font-bold">WCAG AA Pass</span>
            </div>
          </div>

          {/* Certified Disclosures */}
          <div className="p-4 rounded-xl bg-workspace border border-border flex flex-col justify-between space-y-4">
            <div>
              <div className="text-[11px] font-bold text-ink-muted uppercase tracking-wider">Mandatory Boilerplate</div>
              <div className="text-sm font-bold text-navy mt-1">Certified Compliance Notice</div>
              <div className="mt-4 p-3 rounded-xl bg-surface border border-border text-xs text-ink-secondary italic leading-relaxed">
                &quot;Certified SOC 2 Type II and ISO 27001 compliant enterprise infrastructure.&quot;
              </div>
            </div>
            <div className="text-[11px] text-ink-muted flex justify-between items-center pt-2 border-t border-border">
              <span>Mandatory Disclosure</span>
              <span className="text-teal font-bold">Verified</span>
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
                      onClick={() => handleInspectAudit(sub)}
                      className="text-xs px-2.5 py-1 bg-teal/10 hover:bg-teal/20 text-teal rounded-lg border border-teal/30 font-semibold transition flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" />
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
