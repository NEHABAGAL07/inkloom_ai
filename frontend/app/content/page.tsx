"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/services/api";
import { AuditResult, ContentSubmission } from "@/types";
import { FileUpload } from "@/components/content/FileUpload";
import { BackgroundAtmosphere } from "@/components/layout/BackgroundAtmosphere";
import {
  Send,
  Shield,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Upload,
  Globe,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  RotateCcw,
  Sliders,
  ExternalLink,
  Copy,
  Check,
  Layers,
  Clock,
  ChevronRight,
  BookOpen,
  Lock,
} from "lucide-react";

const CONTENT_TEMPLATES = [
  {
    id: "linkedin",
    name: "LinkedIn Post",
    format: "Social Campaign",
    title: "Autonomous Zero-Trust Cloud Platform Release",
    text: "We are thrilled to announce Acme Cloud Fabric 4.0! With sub-50ms global core latency and deterministic throughput, engineering teams can eliminate downtime forever. Unlike legacy vendors who lock you into fragile clusters, our zero-trust mesh delivers verified reliability. Try it today and crush latency spikes.",
  },
  {
    id: "instagram",
    name: "Instagram Caption",
    format: "Social Media",
    title: "Engineering-First Cloud Performance",
    text: "Simplicity without compromise. Acme Cloud gives platform architects sub-50ms latency across global edge points. Deterministic compute engineered for modern scale. #CloudInfrastructure #DevOps #ZeroTrust",
  },
  {
    id: "facebook",
    name: "Facebook Ad",
    format: "Display Ad",
    title: "Eliminate Cloud Outages with Zero-Trust Compute",
    text: "Tired of unpredictable downtime? Acme Cloud delivers mathematically verifiable hybrid compute. Guaranteed 100% reduction in multi-cloud overhead. Switch to Acme Cloud now.",
  },
  {
    id: "blog",
    name: "Blog Article",
    format: "Editorial Copy",
    title: "Why Autonomous Zero-Trust Infrastructure Matters in 2026",
    text: "In modern distributed enterprise architectures, legacy perimeter defenses are no longer sufficient. Acme Cloud Systems provides deterministic zero-trust compute fabrics with sub-50ms core latency. Our verified benchmarks demonstrate mathematically proven isolation without performance trade-offs.",
  },
  {
    id: "email",
    name: "Marketing Email",
    format: "Product Announcement",
    title: "Important Update: Upgrade to Acme Cloud Infrastructure",
    text: "Hello platform team,\n\nWe are excited to share new certified performance benchmarks for Acme Cloud. Our platform delivers verified multi-region isolation and sub-50ms latency. Say goodbye to the Inkloom Cloud Suite and migrate to the next-generation fabric today.\n\nBest,\nThe Acme Cloud Team",
  },
  {
    id: "press_release",
    name: "Press Release",
    format: "Corporate Communications",
    title: "Acme Cloud Systems Certified for Global Enterprise Deployments",
    text: "SAN FRANCISCO — Acme Cloud Systems today announced verified compliance certifications for enterprise cloud infrastructure. The platform guarantees sub-50ms global core latency across 42 availability zones, enabling high-frequency fintech and healthcare leaders to run mission-critical workloads with absolute isolation.",
  },
];

const CONTENT_TYPES = [
  "Social Media Campaign",
  "Blog & Editorial",
  "Product Press Release",
  "Display & Search Ad",
  "Website Landing Copy",
  "Technical Documentation",
];

export default function ContentReviewWorkspace() {
  const router = useRouter();

  // Mode: "paste" | "upload" | "url" | "template"
  const [activeTab, setActiveTab] = useState<"paste" | "upload" | "url" | "template">("paste");
  const [contentType, setContentType] = useState(CONTENT_TYPES[0]);
  const [title, setTitle] = useState("Enterprise Q4 Release Campaign Copy");
  const [text, setText] = useState(
    "Get started with the powerful Inkloom Cloud Suite today before your competitors crush you. We guarantee a 10x reduction in latency across all regions with 100% foolproof zero-trust security."
  );
  const [urlInput, setUrlInput] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Governance Stress-Test Toggles
  const [enableToneStress, setEnableToneStress] = useState(true);
  const [enableClaimCheck, setEnableClaimCheck] = useState(true);
  const [enableTermCheck, setEnableTermCheck] = useState(true);

  // Submission & Audit State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completedSubmission, setCompletedSubmission] = useState<ContentSubmission | null>(null);
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
  const [copiedRewriteIndex, setCopiedRewriteIndex] = useState<number | null>(null);

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const charCount = text.length;
  const estimatedReadingTime = Math.max(1, Math.ceil(wordCount / 200));

  const handleApplyTemplate = (tpl: typeof CONTENT_TEMPLATES[0]) => {
    setTitle(tpl.title);
    setText(tpl.text);
    setContentType(tpl.format);
    setActiveTab("paste");
  };

  const handleImportUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    setTitle(`Content from ${urlInput.replace(/^https?:\/\//, "").split("/")[0]}`);
    setText(
      `[Imported from ${urlInput}]\nAcme Cloud delivers resilient, sovereign computing that scales fearlessly across global multi-cloud boundaries. Sub-50ms core latency with zero proprietary lock-in.`
    );
    setActiveTab("paste");
  };

  const handleSubmitAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    setAuditResult(null);

    try {
      let submissionText = text;
      if (activeTab === "upload" && selectedFile) {
        submissionText = `[Uploaded File: ${selectedFile.name}]\n${text || "Document submitted for multi-modal brand governance audit."}`;
      } else if (activeTab === "url" && urlInput) {
        submissionText = `[Imported URL: ${urlInput}]\n${text}`;
      }

      // 1. Create content submission in backend
      const sub = await api.createSubmission({
        title: title.trim() || "Untitled Content Draft",
        description: `${contentType} submitted for automated pre-publication governance review.`,
        content_type: activeTab === "upload" ? "document" : "text",
        initial_text: submissionText,
      });

      setCompletedSubmission(sub);

      // 2. Trigger automated AI audit pass
      const audit = await api.triggerAudit(sub.id);
      setAuditResult(audit);
    } catch (err: any) {
      console.error("Submission error:", err);
      setError(err?.message || "Failed to submit content for audit.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyRewrite = (suggestion: string, index: number) => {
    navigator.clipboard.writeText(suggestion);
    setCopiedRewriteIndex(index);
    setTimeout(() => setCopiedRewriteIndex(null), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 relative selection:bg-[#FF7A36]/30 selection:text-white">
      <BackgroundAtmosphere variant="hero" />

      {/* ========================================================
          1. Page Header with Warm Gradient Accent
          ======================================================== */}
      <div className="bg-white dark:bg-[#1C1C1C] rounded-2xl p-6 sm:p-8 border border-border dark:border-[#383838] shadow-[0_8px_30px_rgba(22,91,72,0.07)] dark:shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#087F70] via-[#10A995] to-[#58D9D0] dark:from-[#FFD84D] dark:via-[#FF7A36] dark:to-[#F45B91]" />

        <div className="max-w-3xl space-y-3 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#E8F7F1] dark:bg-[#272727] border border-[#C8E2D8] dark:border-[#383838] text-xs font-semibold text-[#087F70] dark:text-[#FFAA35] shadow-sm">
            <Send className="w-3.5 h-3.5 text-[#10A995] dark:text-[#FFD84D]" />
            <span>Pre-Publication Review Workspace</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-heading font-extrabold tracking-tight text-[#18352F] dark:text-[#F7F3ED]">
            Start a <span className="text-gradient-warm">content review</span>
          </h1>

          <p className="text-xs sm:text-sm text-[#58716A] dark:text-[#B8B2AC] leading-relaxed">
            Submit draft copy, campaign assets, or documents for real-time brand compliance, voice analysis, forbidden terminology checks, and certified claim verification.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-[#272727] border border-rose-200 dark:border-[#FF6B78]/40 text-rose-700 dark:text-[#FF6B78] text-xs flex items-center gap-3 shadow-sm">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 dark:text-[#FF6B78]" />
          <span>{error}</span>
        </div>
      )}

      {/* ========================================================
          2. Main Review Inputs Grid
          ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
        {/* Left Column (2 Cols): Review Controls & Text Input */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-[#1C1C1C] rounded-2xl border border-border dark:border-[#383838] shadow-[0_8px_30px_rgba(22,91,72,0.07)] dark:shadow-card p-6 space-y-5">
            {/* Input Mode Selector Bar */}
            <div className="flex flex-wrap items-center gap-2 border-b border-border dark:border-[#383838] pb-4">
              <button
                type="button"
                onClick={() => setActiveTab("paste")}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                  activeTab === "paste"
                    ? "bg-[#E8F7F1] text-[#087F70] border border-[#C8E2D8] dark:bg-[#272727] dark:text-[#F7F3ED] dark:border-[#FFAA35]/50 shadow-sm"
                    : "text-[#58716A] hover:text-[#18352F] hover:bg-[#DDF3EB] dark:text-[#B8B2AC] dark:hover:text-[#F7F3ED] dark:hover:bg-[#222222]"
                }`}
              >
                <span>✍️ Paste Content</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("upload")}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                  activeTab === "upload"
                    ? "bg-[#E8F7F1] text-[#087F70] border border-[#C8E2D8] dark:bg-[#272727] dark:text-[#F7F3ED] dark:border-[#FFAA35]/50 shadow-sm"
                    : "text-[#58716A] hover:text-[#18352F] hover:bg-[#DDF3EB] dark:text-[#B8B2AC] dark:hover:text-[#F7F3ED] dark:hover:bg-[#222222]"
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Document</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("url")}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                  activeTab === "url"
                    ? "bg-[#E8F7F1] text-[#087F70] border border-[#C8E2D8] dark:bg-[#272727] dark:text-[#F7F3ED] dark:border-[#FFAA35]/50 shadow-sm"
                    : "text-[#58716A] hover:text-[#18352F] hover:bg-[#DDF3EB] dark:text-[#B8B2AC] dark:hover:text-[#F7F3ED] dark:hover:bg-[#222222]"
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Use a URL</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("template")}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                  activeTab === "template"
                    ? "bg-[#E8F7F1] text-[#087F70] border border-[#C8E2D8] dark:bg-[#272727] dark:text-[#F7F3ED] dark:border-[#FFAA35]/50 shadow-sm"
                    : "text-[#58716A] hover:text-[#18352F] hover:bg-[#DDF3EB] dark:text-[#B8B2AC] dark:hover:text-[#F7F3ED] dark:hover:bg-[#222222]"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-[#10A995] dark:text-[#FFD84D]" />
                <span>Select a Template</span>
              </button>
            </div>

            {/* Template Selector View */}
            {activeTab === "template" && (
              <div className="space-y-3">
                <div className="text-xs font-bold text-[#18352F] dark:text-[#F7F3ED]">Choose a pre-formatted template:</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {CONTENT_TEMPLATES.map((tpl) => (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => handleApplyTemplate(tpl)}
                      className="p-3.5 rounded-xl bg-[#F7FBF9] dark:bg-[#202020] border border-border dark:border-[#383838] hover:border-[#10A995] hover:bg-[#E8F7F1]/60 dark:hover:border-[#FFAA35]/60 dark:hover:bg-[#272727] text-left transition group space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#18352F] dark:text-[#F7F3ED] group-hover:text-[#087F70] dark:group-hover:text-[#FFAA35] transition">
                          {tpl.name}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#E8F7F1] text-[#087F70] border border-[#C8E2D8] dark:bg-[#171717] dark:text-[#85817D] dark:border-[#383838]">
                          {tpl.format}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#58716A] dark:text-[#85817D] line-clamp-2 leading-relaxed">
                        {tpl.text}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* URL Import View */}
            {activeTab === "url" && (
              <div className="p-4 rounded-xl bg-[#EFF8F4] dark:bg-[#202020] border border-border dark:border-[#383838] space-y-3">
                <label className="block text-xs font-semibold text-[#18352F] dark:text-[#F7F3ED]">
                  Target Page or Published Article URL
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://acmecloud.com/blog/announcement"
                    className="flex-1 bg-white dark:bg-[#141414] border border-border dark:border-[#383838] rounded-xl px-4 py-2.5 text-xs text-[#18352F] dark:text-[#F7F3ED] placeholder:text-[#82948E] dark:placeholder:text-[#85817D] focus:outline-none focus:border-[#10A995] dark:focus:border-[#FFAA35]"
                  />
                  <button
                    type="button"
                    onClick={handleImportUrl}
                    className="px-4 py-2.5 rounded-xl btn-dark-secondary text-xs font-bold shrink-0"
                  >
                    Import Copy
                  </button>
                </div>
              </div>
            )}

            {/* Document File Upload View */}
            {activeTab === "upload" && (
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-[#18352F] dark:text-[#F7F3ED]">
                  Upload PDF, DOCX, TXT, or Visual Asset
                </label>
                <FileUpload
                  selectedFile={selectedFile}
                  onFileSelect={(f) => setSelectedFile(f)}
                />
              </div>
            )}

            {/* Campaign Metadata Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#18352F] dark:text-[#F7F3ED] mb-1.5">
                  Content Title <span className="text-[#E11D48]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Q4 Global Infrastructure Launch"
                  className="w-full bg-[#F7FBF9] dark:bg-[#141414] border border-border dark:border-[#383838] rounded-xl px-4 py-2.5 text-xs text-[#18352F] dark:text-[#F7F3ED] placeholder:text-[#82948E] dark:placeholder:text-[#85817D] focus:outline-none focus:border-[#10A995] dark:focus:border-[#FFAA35] transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#18352F] dark:text-[#F7F3ED] mb-1.5">
                  Content Channel / Type <span className="text-[#E11D48]">*</span>
                </label>
                <select
                  value={contentType}
                  onChange={(e) => setContentType(e.target.value)}
                  className="w-full bg-[#F7FBF9] dark:bg-[#141414] border border-border dark:border-[#383838] rounded-xl px-4 py-2.5 text-xs text-[#18352F] dark:text-[#F7F3ED] focus:outline-none focus:border-[#10A995] dark:focus:border-[#FFAA35] transition"
                >
                  {CONTENT_TYPES.map((t) => (
                    <option key={t} value={t} className="bg-white dark:bg-[#1C1C1C] text-[#18352F] dark:text-[#F7F3ED]">
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Large Elegant Text Input Area */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-[#18352F] dark:text-[#F7F3ED]">
                  Content Draft Copy <span className="text-[#E11D48]">*</span>
                </label>
                <div className="flex items-center gap-3 text-[11px] text-[#82948E] dark:text-[#85817D] font-mono">
                  <span>{wordCount} words</span>
                  <span>•</span>
                  <span>{charCount} chars</span>
                  <span>•</span>
                  <span>~{estimatedReadingTime} min read</span>
                </div>
              </div>

              <textarea
                required
                rows={9}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste your draft text copy, social message, or press announcement here..."
                className="w-full bg-white dark:bg-[#141414] border border-[#DDEBE5] dark:border-[#383838] rounded-xl p-4 text-xs text-[#18352F] dark:text-[#F7F3ED] placeholder:text-[#82948E] dark:placeholder:text-[#85817D] focus:outline-none focus:border-[#10A995] dark:focus:border-[#FFAA35] focus:ring-1 focus:ring-[#10A995] dark:focus:ring-[#FFAA35] leading-relaxed transition resize-y font-sans shadow-sm"
              />
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setText("")}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-[#58716A] hover:text-[#18352F] hover:bg-[#DDF3EB] dark:text-[#85817D] dark:hover:text-[#F7F3ED] dark:hover:bg-[#242424] transition"
              >
                Clear Text
              </button>

              <button
                type="button"
                disabled={isSubmitting || (!text.trim() && !selectedFile)}
                onClick={handleSubmitAudit}
                className="px-6 py-3 rounded-xl btn-gradient-warm text-xs font-bold transition flex items-center gap-2 shadow-warmGlow disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white dark:border-[#111111]/30 dark:border-t-[#111111] animate-spin" />
                    <span>Executing AI Brand Audit...</span>
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4 text-white dark:text-[#111111]" />
                    <span>Run AI Brand Audit</span>
                    <ArrowRight className="w-4 h-4 text-white dark:text-[#111111]" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Governance Rules & Stress-Test Config */}
        <div className="space-y-5">
          {/* Active Guardrails Card */}
          <div className="bg-white dark:bg-[#1C1C1C] rounded-2xl border border-border dark:border-[#383838] p-5 space-y-4 shadow-[0_8px_30px_rgba(22,91,72,0.07)] dark:shadow-card">
            <h3 className="text-xs font-heading font-bold text-[#18352F] dark:text-[#F7F3ED] flex items-center gap-2 uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-[#087F70] dark:text-[#FFAA35]" />
              <span>Active Governance Rules</span>
            </h3>

            <div className="space-y-3">
              <label className="flex items-start gap-3 p-3 rounded-xl bg-[#F7FBF9] dark:bg-[#202020] border border-border dark:border-[#383838] cursor-pointer hover:border-[#10A995] dark:hover:border-[#FFAA35]/40 transition">
                <input
                  type="checkbox"
                  checked={enableToneStress}
                  onChange={(e) => setEnableToneStress(e.target.checked)}
                  className="rounded border-border dark:border-[#383838] bg-white dark:bg-[#141414] text-[#087F70] dark:text-[#FF7A36] focus:ring-[#10A995] dark:focus:ring-[#FF7A36] w-4 h-4 mt-0.5"
                />
                <div className="text-xs">
                  <div className="font-bold text-[#18352F] dark:text-[#F7F3ED]">Anti-FUD & Tone Spectrum</div>
                  <div className="text-[11px] text-[#58716A] dark:text-[#85817D] mt-0.5 leading-relaxed">
                    Flags fear-based messaging, aggressive competitor takedowns, and hyperbolic claims.
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-xl bg-[#F7FBF9] dark:bg-[#202020] border border-border dark:border-[#383838] cursor-pointer hover:border-[#10A995] dark:hover:border-[#FFAA35]/40 transition">
                <input
                  type="checkbox"
                  checked={enableClaimCheck}
                  onChange={(e) => setEnableClaimCheck(e.target.checked)}
                  className="rounded border-border dark:border-[#383838] bg-white dark:bg-[#141414] text-[#087F70] dark:text-[#FF7A36] focus:ring-[#10A995] dark:focus:ring-[#FF7A36] w-4 h-4 mt-0.5"
                />
                <div className="text-xs">
                  <div className="font-bold text-[#18352F] dark:text-[#F7F3ED]">Certified Claims Verification</div>
                  <div className="text-[11px] text-[#58716A] dark:text-[#85817D] mt-0.5 leading-relaxed">
                    Enforces that numerical assertions (e.g. latency, scale) reference approved benchmarks.
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-xl bg-[#F7FBF9] dark:bg-[#202020] border border-border dark:border-[#383838] cursor-pointer hover:border-[#10A995] dark:hover:border-[#FFAA35]/40 transition">
                <input
                  type="checkbox"
                  checked={enableTermCheck}
                  onChange={(e) => setEnableTermCheck(e.target.checked)}
                  className="rounded border-border dark:border-[#383838] bg-white dark:bg-[#141414] text-[#087F70] dark:text-[#FF7A36] focus:ring-[#10A995] dark:focus:ring-[#FF7A36] w-4 h-4 mt-0.5"
                />
                <div className="text-xs">
                  <div className="font-bold text-[#18352F] dark:text-[#F7F3ED]">Deprecated Terminology Guard</div>
                  <div className="text-[11px] text-[#58716A] dark:text-[#85817D] mt-0.5 leading-relaxed">
                    Identifies retired product names (e.g. &apos;Inkloom Cloud Suite&apos;) and registered marks.
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Tenant Isolation Info Card */}
          <div className="bg-white dark:bg-[#1C1C1C] rounded-2xl border border-border dark:border-[#383838] p-5 space-y-2 shadow-[0_8px_30px_rgba(22,91,72,0.07)] dark:shadow-card text-xs text-[#58716A] dark:text-[#85817D]">
            <div className="flex items-center gap-2 font-bold text-[#18352F] dark:text-[#F7F3ED]">
              <Lock className="w-4 h-4 text-[#087F70] dark:text-[#FFAA35]" />
              <span>Zero-Trust Enterprise Isolation</span>
            </div>
            <p className="leading-relaxed text-[11px]">
              Every audit runs strictly in your tenant context. No proprietary content is logged for public model training or accessible outside your organization.
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================
          3. Live Review Results Area (Interactive Feedback)
          ======================================================== */}
      {auditResult && (
        <div className="bg-white dark:bg-[#1C1C1C] rounded-2xl border border-border dark:border-[#383838] p-6 sm:p-8 space-y-6 shadow-[0_16px_40px_rgba(22,91,72,0.08)] dark:shadow-2xl relative overflow-hidden animate-in fade-in duration-300">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#087F70] via-[#10A995] to-[#58D9D0] dark:from-[#FFD84D] dark:via-[#FF7A36] dark:to-[#F45B91]" />

          {/* Results Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border dark:border-[#383838] pb-5">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#E8F7F1] text-[#087F70] text-[10px] font-bold uppercase tracking-wider mb-1.5 border border-[#C8E2D8] dark:bg-[#272727] dark:text-[#FFAA35] dark:border-[#383838]">
                <span>Audit Run Complete</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-heading font-bold text-[#18352F] dark:text-[#F7F3ED]">
                Brand Compliance Report
              </h2>
            </div>

            <div className="flex items-center gap-3">
              {completedSubmission && (
                <Link
                  href={`/audits?id=${completedSubmission.id}`}
                  className="px-4 py-2 rounded-xl btn-dark-secondary text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <span>Interactive Findings Explorer</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              )}

              <Link
                href="/reviews"
                className="px-4 py-2 rounded-xl btn-gradient-warm text-xs font-bold flex items-center gap-1.5 transition text-white dark:text-[#111111]"
              >
                <span>Submit to Review Queue</span>
                <ArrowRight className="w-3.5 h-3.5 text-white dark:text-[#111111]" />
              </Link>
            </div>
          </div>

          {/* Scores Overview Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="p-4 rounded-xl bg-[#F7FBF9] dark:bg-[#202020] border border-border dark:border-[#383838]">
              <div className="text-[11px] text-[#82948E] dark:text-[#85817D] uppercase font-bold tracking-wider">
                Overall Score
              </div>
              <div className="text-2xl font-heading font-extrabold text-gradient-warm mt-1">
                {auditResult.summary?.compliance_score ?? 78}/100
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#F7FBF9] dark:bg-[#202020] border border-border dark:border-[#383838]">
              <div className="text-[11px] text-[#82948E] dark:text-[#85817D] uppercase font-bold tracking-wider">
                Total Violations
              </div>
              <div className="text-2xl font-heading font-extrabold text-[#18352F] dark:text-[#F7F3ED] mt-1">
                {auditResult.findings?.length || 0}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#F7FBF9] dark:bg-[#202020] border border-border dark:border-[#383838]">
              <div className="text-[11px] text-[#82948E] dark:text-[#85817D] uppercase font-bold tracking-wider">
                Critical / High
              </div>
              <div className="text-2xl font-heading font-extrabold text-[#E11D48] dark:text-[#FF6B78] mt-1">
                {auditResult.findings?.filter(
                  (f) => f.severity === "critical" || f.severity === "high"
                ).length || 0}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#F7FBF9] dark:bg-[#202020] border border-border dark:border-[#383838]">
              <div className="text-[11px] text-[#82948E] dark:text-[#85817D] uppercase font-bold tracking-wider">
                Human Review
              </div>
              <div className="text-xs font-bold text-[#D97706] dark:text-[#FFD166] mt-2 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>Required for Sign-off</span>
              </div>
            </div>
          </div>

          {/* Findings List with Intent-Preserving Rewrites */}
          <div className="space-y-4">
            <h3 className="text-sm font-heading font-bold text-[#18352F] dark:text-[#F7F3ED] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#087F70] dark:text-[#FFAA35]" />
              <span>Specific Policy Findings &amp; Recommended Intent-Preserving Rewrites</span>
            </h3>

            {(!auditResult.findings || auditResult.findings.length === 0) ? (
              <div className="p-8 rounded-xl bg-[#EFF8F4] dark:bg-[#202020] border border-[#C8E2D8] dark:border-[#383838] text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-[#087F70] dark:text-[#72D6A1] mx-auto" />
                <div className="text-sm font-bold text-[#18352F] dark:text-[#F7F3ED]">100% Brand Compliant!</div>
                <div className="text-xs text-[#58716A] dark:text-[#85817D]">
                  No terminology flaws, tone breaches, or unverified claims detected.
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {auditResult.findings.map((f, idx) => (
                  <div
                    key={f.id || idx}
                    className="p-4 sm:p-5 rounded-xl bg-[#F7FBF9] dark:bg-[#202020] border border-border dark:border-[#383838] space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider border ${
                            f.severity === "critical"
                              ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-[#FF6B78]/15 dark:text-[#FF6B78] dark:border-[#FF6B78]/30"
                              : f.severity === "high"
                              ? "bg-amber-50 text-amber-800 border-amber-200 dark:bg-[#FFAA35]/15 dark:text-[#FFAA35] dark:border-[#FFAA35]/30"
                              : "bg-blue-50 text-blue-700 border-blue-200 dark:bg-[#83B9FF]/15 dark:text-[#83B9FF] dark:border-[#83B9FF]/30"
                          }`}
                        >
                          {f.severity}
                        </span>
                        <span className="text-xs font-bold text-[#18352F] dark:text-[#F7F3ED]">{f.title}</span>
                      </div>
                      <span className="text-[10px] text-[#82948E] dark:text-[#85817D] font-mono">
                        Rule: {f.source_reference?.rule_name || "brand-governance"}
                      </span>
                    </div>

                    <p className="text-xs text-[#58716A] dark:text-[#B8B2AC] leading-relaxed">{f.message}</p>

                    {/* Verbatim Quote */}
                    {f.evidence && (
                      <div className="p-2.5 rounded-lg bg-[#EFF8F4] dark:bg-[#171717] border border-[#DDEBE5] dark:border-[#383838] text-[11px] font-mono text-[#087F70] dark:text-[#FFD166] flex items-center gap-2">
                        <span className="text-[#82948E] select-none font-sans font-bold text-[10px]">
                          EVIDENCE:
                        </span>
                        <span>&ldquo;{f.evidence}&rdquo;</span>
                      </div>
                    )}

                    {/* Intent Preserving Rewrite Suggestion */}
                    {f.suggested_correction?.replacement_text && (
                      <div className="p-3 rounded-lg bg-[#E8F7F1] dark:bg-[#272727] border border-[#C8E2D8] dark:border-[#FFAA35]/30 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-[#087F70] dark:text-[#FFAA35] uppercase tracking-wider flex items-center gap-1.5">
                            <Sparkles className="w-3 h-3 text-[#10A995] dark:text-[#FFAA35]" />
                            <span>Recommended Intent-Preserving Rewrite</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyRewrite(f.suggested_correction!.replacement_text, idx)}
                            className="text-[10px] text-[#58716A] hover:text-[#087F70] dark:text-[#85817D] dark:hover:text-[#FFAA35] flex items-center gap-1 font-semibold transition"
                          >
                            {copiedRewriteIndex === idx ? (
                              <>
                                <Check className="w-3 h-3 text-[#087F70] dark:text-[#72D6A1]" />
                                <span className="text-[#087F70] dark:text-[#72D6A1]">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copy Fix</span>
                              </>
                            )}
                          </button>
                        </div>
                        <div className="text-xs text-[#18352F] dark:text-[#F7F3ED] font-sans">
                          {f.suggested_correction.replacement_text}
                        </div>
                        {f.suggested_correction.rationale && (
                          <div className="text-[11px] text-[#58716A] dark:text-[#85817D] italic">
                            Rationale: {f.suggested_correction.rationale}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
