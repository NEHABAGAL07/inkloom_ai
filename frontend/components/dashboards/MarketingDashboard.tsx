"use client";



import React, { useState, useEffect } from "react";

import Link from "next/link";

import { ContentSubmission, AuditResult } from "@/types";

import { api } from "@/services/api";

import { useAuth } from "@/services/auth-context";

import { BackgroundAtmosphere } from "@/components/layout/BackgroundAtmosphere";

import {

  Megaphone,

  Zap,

  FileText,

  CheckCircle,

  AlertTriangle,

  ArrowRight,

  Sparkles,

  Send,

  Eye,

  Upload,

  RefreshCw,

  Layers,

  FileCheck,

  RotateCcw,

  X,

  Clock,

  Plus,

  BookOpen,

  Share2,

  ChevronDown,

} from "lucide-react";


import { DesignAssetViewerModal } from "@/components/reviews/DesignAssetViewerModal";



interface MarketingDashboardProps {

  submissions: ContentSubmission[];

  onRefresh: () => void;

}



const PUBLICATION_CHANNELS = [

  "Social Media Campaign",

  "Blog & Editorial",

  "Product Press Release",

  "Display & Search Ad",

  "Website Landing Copy",

  "Technical Documentation",

];



const DASHBOARD_TEMPLATES = [

  {

    id: "linkedin",

    name: "LinkedIn",

    format: "Professional post",

    iconBg: "bg-[#0A66C2]",

    type: "linkedin",

    title: "Autonomous Zero-Trust Cloud Platform Release",

    sample: "We are thrilled to announce Acme Cloud Fabric 4.0! With sub-50ms core latency and deterministic throughput, engineering teams can eliminate downtime forever.",

  },

  {

    id: "instagram",

    name: "Instagram",

    format: "Caption + hashtags",

    iconBg: "bg-[#06B6D4]",

    type: "instagram",

    title: "Engineering-First Cloud Performance",

    sample: "Simplicity without compromise. Acme Cloud gives platform architects sub-50ms latency across global edge points. #CloudPlatform #ZeroTrust #DevOps",

  },

  {

    id: "facebook",

    name: "Facebook",

    format: "Community update",

    iconBg: "bg-[#1877F2]",

    type: "facebook",

    title: "Eliminate Cloud Outages with Zero-Trust Compute",

    sample: "Tired of unpredictable downtime? Acme Cloud delivers mathematically verifiable hybrid compute. Guaranteed 100% reduction in multi-cloud overhead.",

  },

  {

    id: "blog",

    name: "Blogs",

    format: "Long-form article",

    iconBg: "bg-[#0D9488]",

    type: "blog",

    title: "Why Autonomous Zero-Trust Infrastructure Matters in 2026",

    sample: "In modern distributed enterprise architectures, legacy perimeter defenses are no longer sufficient. Acme Cloud Systems provides deterministic zero-trust compute.",

  },

  {

    id: "email",

    name: "Emails",

    format: "Campaign email",

    iconBg: "bg-[#0284C7]",

    type: "email",

    title: "Important Update: Upgrade to Acme Cloud Infrastructure",

    sample: "Hello platform team, We are excited to share new certified performance benchmarks for Acme Cloud. Our platform delivers verified multi-region isolation and sub-50ms latency.",

  },

  {

    id: "others",

    name: "Others",

    format: "Ads, notices & more",

    iconBg: "bg-[#0F766E]",

    type: "others",

    title: "Corporate Release & Multi-Region Policy",

    sample: "Acme Cloud Systems today announced verified compliance certifications for enterprise cloud infrastructure across 42 global regions.",

  },

];



const renderTemplateIcon = (type: string) => {

  switch (type) {

    case "linkedin":

      return (

        <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">

          <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.45a1.6 1.6 0 0 0-1.61 1.6 1.6 1.6 0 0 0 1.61 1.6 1.6 1.6 0 0 0 1.61-1.6 1.6 1.6 0 0 0-1.61-1.6Z" />

        </svg>

      );

    case "instagram":

      return (

        <svg className="w-4 h-4 stroke-white fill-none stroke-[2]" viewBox="0 0 24 24">

          <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />

          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />

          <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />

        </svg>

      );

    case "facebook":

      return (

        <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">

          <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />

        </svg>

      );

    case "blog":

      return (

        <svg className="w-4 h-4 stroke-white fill-none stroke-[2]" viewBox="0 0 24 24">

          <path d="M12 20h9" />

          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />

        </svg>

      );

    case "email":

      return (

        <svg className="w-4 h-4 stroke-white fill-none stroke-[2]" viewBox="0 0 24 24">

          <rect width="20" height="16" x="2" y="4" rx="2" />

          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />

        </svg>

      );

    default:

      return (

        <svg className="w-4 h-4 stroke-white fill-none stroke-[2]" viewBox="0 0 24 24">

          <rect width="7" height="7" x="3" y="3" rx="1" />

          <rect width="7" height="7" x="14" y="3" rx="1" />

          <rect width="7" height="7" x="14" y="14" rx="1" />

          <rect width="7" height="7" x="3" y="14" rx="1" />

        </svg>

      );

  }

};



export function MarketingDashboard({ submissions, onRefresh }: MarketingDashboardProps) {

  const { activeOrgName } = useAuth();

  const [quickTitle, setQuickTitle] = useState("");

  const [quickText, setQuickText] = useState("");

  const [selectedChannel, setSelectedChannel] = useState(PUBLICATION_CHANNELS[0]);

  const [inputMode, setInputMode] = useState<"text" | "upload">("text");

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [isAuditing, setIsAuditing] = useState(false);

  const [liveAuditResult, setLiveAuditResult] = useState<AuditResult | null>(null);



  // Revision modal state

  const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false);

  const [revisingSub, setRevisingSub] = useState<ContentSubmission | null>(null);

  const [revisedText, setRevisedText] = useState("");

  const [isSubmittingRevision, setIsSubmittingRevision] = useState(false);



  // Selected submission for marketing suggestions & comments

  const [selectedMarketingSub, setSelectedMarketingSub] = useState<ContentSubmission | null>(null);

  const [selectedSubAudit, setSelectedSubAudit] = useState<AuditResult | null>(null);

  const [isLoadingSubAudit, setIsLoadingSubAudit] = useState(false);



  // Asset Viewer Modal state

  const [isViewerOpen, setIsViewerOpen] = useState(false);

  const [viewingSub, setViewingSub] = useState<ContentSubmission | null>(null);



  useEffect(() => {

    if (!selectedMarketingSub && submissions.length > 0) {

      setSelectedMarketingSub(submissions[0]);

    }

  }, [submissions.length]);



  useEffect(() => {

    async function loadSelectedAudit() {

      if (!selectedMarketingSub) return;

      setIsLoadingSubAudit(true);

      try {

        const res = await api.getAudit(selectedMarketingSub.id);

        setSelectedSubAudit(res);

      } catch (e) {

        setSelectedSubAudit(null);

      } finally {

        setIsLoadingSubAudit(false);

      }

    }

    loadSelectedAudit();

  }, [selectedMarketingSub?.id]);



  useEffect(() => {

    const handleAssetUpdate = () => {

      onRefresh();

    };

    if (typeof window !== "undefined") {

      window.addEventListener("inkloom_asset_updated", handleAssetUpdate);

      return () => window.removeEventListener("inkloom_asset_updated", handleAssetUpdate);

    }

  }, [onRefresh]);



  const handleApplyTemplate = (tpl: typeof DASHBOARD_TEMPLATES[0]) => {

    setQuickTitle(tpl.title);

    setQuickText(tpl.sample);

    setSelectedChannel(tpl.format.includes("Social") || tpl.id === "facebook" ? PUBLICATION_CHANNELS[0] : PUBLICATION_CHANNELS[1]);

    setInputMode("text");

  };



  const handleQuickSubmitAndAudit = async (e: React.FormEvent) => {

    e.preventDefault();

    if (!quickTitle) return;

    if (inputMode === "text" && !quickText) return;

    if (inputMode === "upload" && !selectedFile && !quickText) return;



    setIsAuditing(true);

    setLiveAuditResult(null);

    try {

      let submissionText = quickText;

      let fileName = selectedFile?.name;



      if (inputMode === "upload" && selectedFile) {

        try {

          submissionText = await selectedFile.text();

        } catch {

          submissionText = `Document upload: ${selectedFile.name} (${selectedFile.size} bytes)`;

        }

      }



      const sub = await api.createSubmission({

        title: quickTitle,

        description: `Channel: ${selectedChannel} | Source: ${inputMode === "upload" ? "Document Upload" : "Direct Draft"}`,

        content_type: inputMode === "upload" && selectedFile?.name.match(/\.(pdf|docx?)$/i) ? "document" : "text",

        initial_text: submissionText,

        file_name: fileName,

      });



      const audit = await api.triggerAudit(sub.id, sub.current_revision_id);

      setLiveAuditResult(audit);

      setSelectedMarketingSub(sub);

      setSelectedSubAudit(audit);

      setQuickTitle("");

      setQuickText("");

      setSelectedFile(null);

      onRefresh();

    } catch (err: any) {

      alert(err.message || "Audit submission failed");

    } finally {

      setIsAuditing(false);

    }

  };



  const handleOpenRevision = (sub: ContentSubmission) => {

    setRevisingSub(sub);

    setRevisedText(sub.raw_text || "");

    setIsRevisionModalOpen(true);

  };



  const handleSubmitRevision = async (e: React.FormEvent) => {

    e.preventDefault();

    if (!revisingSub || !revisedText.trim()) return;

    setIsSubmittingRevision(true);

    try {

      await api.createRevision(revisingSub.id, { raw_text: revisedText.trim() });

      const newAudit = await api.triggerAudit(revisingSub.id);

      setSelectedSubAudit(newAudit);

      setIsRevisionModalOpen(false);

      onRefresh();

    } catch (err: any) {

      alert(err.message || "Failed to submit draft revision");

    } finally {

      setIsSubmittingRevision(false);

    }

  };



  const getStatusBadge = (status: string) => {

    switch (status) {

      case "approved":

        return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-[#72D6A1]/15 dark:text-[#72D6A1] dark:border-[#72D6A1]/30";

      case "pending_approval":

        return "bg-[#E8F7F1] text-[#087F70] border-[#C8E2D8] dark:bg-[#83B9FF]/15 dark:text-[#83B9FF] dark:border-[#83B9FF]/30";

      case "changes_requested":

        return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-[#FFD166]/15 dark:text-[#FFD166] dark:border-[#FFD166]/30";

      case "rejected":

        return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-[#FF6B78]/15 dark:text-[#FF6B78] dark:border-[#FF6B78]/30";

      default:

        return "bg-slate-50 text-slate-700 border-slate-200 dark:bg-[#272727] dark:text-[#B8B2AC] dark:border-[#383838]";

    }

  };



  return (

    <div className="space-y-7 max-w-7xl mx-auto relative">

      {/* ========================================================

          1. Hero Section with Ethereal Silk Wave & Handwriting Script (Image 1 reference)

          ======================================================== */}

      <div className="bg-white dark:bg-[#1C1C1C] rounded-2xl p-7 sm:p-9 border border-slate-200 dark:border-[#383838] shadow-sm relative overflow-hidden">

        {/* Subtle top turquoise accent line in light mode */}

        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#10B981] via-[#0284C7] to-[#2563EB] dark:from-[#FFD84D] dark:via-[#FF7A36] dark:to-[#F45B91]" />



        {/* Ethereal flowing silk wave graphic on the right (Image 1 reference) */}

        <div className="hidden lg:flex absolute right-6 top-1/2 -translate-y-1/2 items-center pointer-events-none select-none">

          <div className="relative w-72 h-40 flex items-center justify-end pr-4">

            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 280 160" fill="none">

              <path

                d="M10,100 C70,25 150,140 270,45 C230,120 150,30 40,120 Z"

                fill="url(#waveLightGrad)"

                opacity="0.45"

              />

              <path

                d="M20,115 C90,40 180,130 270,35"

                stroke="#38BDF8"

                strokeWidth="2.5"

                strokeLinecap="round"

                opacity="0.75"

              />

              <path

                d="M10,85 C80,15 170,110 260,55"

                stroke="#60A5FA"

                strokeWidth="2"

                strokeDasharray="4 4"

                opacity="0.6"

              />

              <defs>

                <linearGradient id="waveLightGrad" x1="0" y1="0" x2="1" y2="1">

                  <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.5" />

                  <stop offset="50%" stopColor="#3B82F6" stopOpacity="0.35" />

                  <stop offset="100%" stopColor="#1D4ED8" stopOpacity="0.2" />

                </linearGradient>

              </defs>

            </svg>

            {/* Sparkle star on top right */}

            <svg

              className="absolute top-2 right-10 w-5 h-5 text-sky-500 animate-pulse"

              viewBox="0 0 24 24"

              fill="currentColor"

            >

              <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />

            </svg>

            {/* Cursive quote in royal blue */}

            <div className="relative z-10 text-right italic font-serif text-[#1D4ED8] dark:text-[#FFAA35] leading-snug select-none pr-3">

              <div className="text-base font-normal tracking-wide">Better</div>

              <div className="text-base font-normal tracking-wide pl-2">Content</div>

              <div className="text-base font-normal tracking-wide pl-4">Brighter</div>

              <div className="text-base font-normal tracking-wide pl-6">Ideas ~</div>

            </div>

          </div>

        </div>



        <div className="max-w-2xl space-y-3.5 relative z-10">

          <div className="text-xs font-bold uppercase tracking-wider text-[#10B981] dark:text-[#FFAA35]">

            INKLOOM AI / WORKSPACE OVERVIEW

          </div>



          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-extrabold tracking-tight text-[#0F172A] dark:text-[#F7F3ED] leading-tight">

            Every draft, in <span className="text-[#2563EB] dark:text-[#FFAA35]">good hands.</span>

          </h1>



          <p className="text-xs sm:text-sm text-[#475569] dark:text-[#B8B2AC] leading-relaxed max-w-xl">

            Review the details. Keep your brand consistent. Leave the final call to people.

          </p>



          <div className="flex flex-wrap items-center gap-3 pt-2">

            <Link

              href="/content"

              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#10B981] via-[#0284C7] to-[#2563EB] text-white dark:btn-gradient-warm text-xs font-bold transition flex items-center gap-2 shadow-md hover:opacity-95"

            >

              <Plus className="w-4 h-4 text-white dark:text-[#111111] stroke-[2.5]" />

              <span>+ Start a review</span>

            </Link>



            <Link

              href="/reviews"

              className="px-4 py-2.5 rounded-xl bg-white dark:bg-[#202020] text-[#0F172A] dark:text-[#F7F3ED] border border-slate-300 dark:border-[#383838] hover:bg-slate-50 dark:hover:bg-[#272727] text-xs font-semibold transition flex items-center gap-1.5 shadow-2xs"

            >

              <span>Open Claim Review</span>

              <span>→</span>

            </Link>

          </div>

        </div>

      </div>



      {/* ========================================================

          2. Feature Templates Grid (Image 1 reference)

          ======================================================== */}

      <div className="space-y-3">

        <div className="flex items-center justify-between">

          <div>

            <div className="text-[11px] font-bold tracking-wider text-[#10B981] dark:text-[#FFAA35] uppercase">

              QUICK START

            </div>

            <h2 className="text-base font-heading font-bold text-[#0F172A] dark:text-[#F7F3ED]">

              Feature templates

            </h2>

          </div>

          <span className="text-xs text-[#64748B] dark:text-[#85817D] hidden sm:inline">

            Pick one to load a starter draft into the review box.

          </span>

        </div>



        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">

          {DASHBOARD_TEMPLATES.map((tpl) => (

            <button

              key={tpl.id}

              type="button"

              onClick={() => handleApplyTemplate(tpl)}

              className="p-4 rounded-2xl bg-white dark:bg-[#1C1C1C] border border-slate-200 dark:border-[#383838] hover:border-[#10B981] dark:hover:border-[#FFAA35]/60 hover:shadow-md transition-all duration-200 text-left flex flex-col justify-between h-36 group shadow-2xs"

            >

              <div>

                <div className={`w-8 h-8 rounded-xl ${tpl.iconBg} text-white flex items-center justify-center shadow-2xs mb-2.5`}>

                  {renderTemplateIcon(tpl.type)}

                </div>

                <div className="text-xs font-bold text-[#0F172A] dark:text-[#F7F3ED] group-hover:text-[#10B981] dark:group-hover:text-[#FFAA35] transition truncate">

                  {tpl.name}

                </div>

                <div className="text-[11px] text-[#64748B] dark:text-[#85817D] truncate mt-0.5">

                  {tpl.format}

                </div>

              </div>

              <div className="text-[11px] font-semibold text-[#2563EB] dark:text-[#FFAA35] group-hover:underline flex items-center gap-1 mt-2">

                <span>Use template</span>

                <span>→</span>

              </div>

            </button>

          ))}

        </div>

      </div>



      {/* ========================================================

          3. Review Workspace Main Section (Image 1 reference)

          ======================================================== */}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">

        {/* Left: Review Workspace Box */}

        <div className="lg:col-span-8 bg-white dark:bg-[#1C1C1C] border border-slate-200 dark:border-[#383838] rounded-2xl p-6 shadow-sm dark:shadow-card space-y-5">

          <div className="pb-3 border-b border-slate-100 dark:border-[#383838]">

            <span className="text-[10px] font-bold tracking-wider text-[#10B981] dark:text-[#FFAA35] uppercase">

              REVIEW WORKSPACE

            </span>

            <h2 className="text-lg font-heading font-bold text-[#0F172A] dark:text-[#F7F3ED] mt-0.5">

              Start a content review

            </h2>

            <p className="text-xs text-[#64748B] dark:text-[#85817D] mt-0.5">

              Paste your draft and let Inkloom AI check it for you.

            </p>

          </div>



          <form onSubmit={handleQuickSubmitAndAudit} className="space-y-4">

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

              <div>

                <label className="block text-xs font-semibold text-[#0F172A] dark:text-[#F7F3ED] mb-1.5">

                  Target Publication Channel *

                </label>

                <select

                  value={selectedChannel}

                  onChange={(e) => setSelectedChannel(e.target.value)}

                  className="w-full bg-white dark:bg-[#141414] border border-slate-200 dark:border-[#383838] rounded-xl px-3 py-2 text-xs text-[#0F172A] dark:text-[#F7F3ED] focus:outline-none focus:border-[#10B981] dark:focus:border-[#FFAA35] font-medium"

                >

                  {PUBLICATION_CHANNELS.map((ch) => (

                    <option key={ch} value={ch} className="bg-white dark:bg-[#1C1C1C] text-[#0F172A] dark:text-[#F7F3ED]">

                      {ch}

                    </option>

                  ))}

                </select>

              </div>



              <div>

                <label className="block text-xs font-semibold text-[#0F172A] dark:text-[#F7F3ED] mb-1.5">

                  Campaign Title *

                </label>

                <input

                  type="text"

                  required

                  value={quickTitle}

                  onChange={(e) => setQuickTitle(e.target.value)}

                  placeholder="e.g. Q4 Global Cloud Release"

                  className="w-full bg-white dark:bg-[#141414] border border-slate-200 dark:border-[#383838] rounded-xl px-3 py-2 text-xs text-[#0F172A] dark:text-[#F7F3ED] placeholder:text-[#94A3B8] dark:placeholder:text-[#85817D] focus:outline-none focus:border-[#10B981] dark:focus:border-[#FFAA35]"

                />

              </div>

            </div>



            {/* Input Mode Selector */}

            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-[#383838] pb-2">

              <button

                type="button"

                onClick={() => setInputMode("text")}

                className={`text-xs px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${

                  inputMode === "text"

                    ? "bg-[#D1F2E8] text-[#0F766E] border border-[#A7F3D0] dark:bg-[#272727] dark:text-[#F7F3ED] dark:border-[#FFAA35]/50 shadow-2xs"

                    : "text-[#64748B] hover:text-[#0F172A] hover:bg-slate-50 dark:text-[#B8B2AC] dark:hover:text-[#F7F3ED] dark:hover:bg-[#222222]"

                }`}

              >

                <FileText className="w-3.5 h-3.5" />

                <span>Text Editor</span>

              </button>

              <button

                type="button"

                onClick={() => setInputMode("upload")}

                className={`text-xs px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${

                  inputMode === "upload"

                    ? "bg-[#D1F2E8] text-[#0F766E] border border-[#A7F3D0] dark:bg-[#272727] dark:text-[#F7F3ED] dark:border-[#FFAA35]/50 shadow-2xs"

                    : "text-[#64748B] hover:text-[#0F172A] hover:bg-slate-50 dark:text-[#B8B2AC] dark:hover:text-[#F7F3ED] dark:hover:bg-[#222222]"

                }`}

              >

                <Upload className="w-3.5 h-3.5" />

                <span>Document Upload</span>

              </button>

            </div>



            {inputMode === "text" ? (

              <div>

                <label className="block text-xs font-semibold text-[#0F172A] dark:text-[#F7F3ED] mb-1.5">

                  Marketing Copy / Text *

                </label>

                <textarea

                  required={inputMode === "text"}

                  rows={5}

                  value={quickText}

                  onChange={(e) => setQuickText(e.target.value)}

                  placeholder="Paste your draft and let Inkloom AI check it for you..."

                  className="w-full bg-slate-50/50 dark:bg-[#141414] border border-slate-200 dark:border-[#383838] rounded-xl p-3.5 text-xs text-[#0F172A] dark:text-[#F7F3ED] placeholder:text-[#94A3B8] dark:placeholder:text-[#85817D] focus:outline-none focus:border-[#10B981] dark:focus:border-[#FFAA35] font-sans leading-relaxed"

                />

              </div>

            ) : (

              <div className="space-y-3">

                <label className="block text-xs font-semibold text-[#0F172A] dark:text-[#F7F3ED]">

                  Upload Campaign Document *

                </label>

                <div className="border-2 border-dashed border-slate-200 dark:border-[#383838] rounded-xl p-6 text-center hover:border-[#10B981] dark:hover:border-[#FFAA35]/60 transition cursor-pointer bg-slate-50/50 dark:bg-[#141414]">

                  <input

                    type="file"

                    accept=".pdf,.docx,.doc,.txt,.md"

                    onChange={(e) => {

                      if (e.target.files && e.target.files[0]) {

                        setSelectedFile(e.target.files[0]);

                        if (!quickTitle) {

                          setQuickTitle(e.target.files[0].name.replace(/\.[^/.]+$/, ""));

                        }

                      }

                    }}

                    className="hidden"

                    id="doc-upload"

                  />

                  <label htmlFor="doc-upload" className="cursor-pointer space-y-2 block">

                    <Upload className="w-8 h-8 text-[#10B981] dark:text-[#FFAA35] mx-auto" />

                    <div className="text-xs font-semibold text-[#0F172A] dark:text-[#F7F3ED]">

                      {selectedFile ? selectedFile.name : "Click to select or drag document file"}

                    </div>

                    <p className="text-[11px] text-[#64748B] dark:text-[#85817D]">

                      Supports PDF, DOCX, Word, Text, and Markdown (Max 25MB)

                    </p>

                  </label>

                </div>

              </div>

            )}



            <div className="flex flex-col sm:flex-row gap-2 pt-1">

              <button

                type="button"

                onClick={() => {

                  setQuickTitle("HyperScale Edge Announcement 2026");

                  setInputMode("text");

                  setQuickText(

                    "Get started with the powerful Inkloom Cloud Suite today.\nOur newest release lets organizations experience a guaranteed 10x reduction in latency across all regions.\nHurry up before your competitors crush you and steal your market share."

                  );

                }}

                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-[#475569] dark:bg-[#202020] dark:hover:bg-[#272727] dark:text-[#B8B2AC] rounded-xl text-xs font-semibold border border-slate-200 dark:border-[#383838] transition text-center"

              >

                Insert Sample with Violations

              </button>



              <button

                type="submit"

                disabled={isAuditing || (!quickText && !selectedFile)}

                className="flex-1 py-2.5 bg-gradient-to-r from-[#10B981] via-[#0284C7] to-[#2563EB] dark:btn-gradient-warm disabled:opacity-50 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow-md hover:opacity-95"

              >

                {isAuditing ? (

                  <>

                    <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />

                    <span>Auditing with AI Engine...</span>

                  </>

                ) : (

                  <>

                    <Sparkles className="w-3.5 h-3.5 text-white" />

                    <span>Run Pre-Flight AI Audit</span>

                  </>

                )}

              </button>

            </div>

          </form>



          {/* Live Findings Display */}

          {liveAuditResult && (

            <div className="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-[#141414] border border-slate-200 dark:border-[#383838] space-y-3 animate-in fade-in">

              <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#383838] pb-2.5">

                <span className="text-xs font-bold text-[#0F172A] dark:text-[#F7F3ED] flex items-center gap-1.5">

                  <CheckCircle className="w-3.5 h-3.5 text-[#10B981] dark:text-[#72D6A1]" />

                  Pre-Flight Audit Complete

                </span>

                <span className="text-xs font-bold text-[#2563EB] dark:text-gradient-warm">

                  Compliance Score: {liveAuditResult.summary.compliance_score}/100

                </span>

              </div>

              <div className="space-y-2">

                {liveAuditResult.findings.map((f) => (

                  <div

                    key={f.id}

                    className="text-xs p-3 rounded-lg bg-white dark:bg-[#1C1C1C] border border-slate-200 dark:border-[#383838] space-y-1.5 shadow-2xs"

                  >

                    <div className="flex items-center justify-between gap-2">

                      <span className="font-bold text-[#0F172A] dark:text-[#F7F3ED]">{f.title}</span>

                      <span className="text-[10px] text-[#2563EB] dark:text-[#FFAA35] uppercase font-bold px-1.5 py-0.5 rounded bg-blue-50 dark:bg-[#272727] border border-blue-200 dark:border-[#383838]">

                        {f.category}

                      </span>

                    </div>

                    <div className="text-[#475569] dark:text-[#B8B2AC] leading-relaxed">{f.message}</div>

                    {f.suggested_correction && (

                      <div className="text-[#10B981] dark:text-[#72D6A1] font-medium text-[11px] pt-1">

                        💡 Suggestion: &quot;{f.suggested_correction.replacement_text}&quot;

                      </div>

                    )}

                  </div>

                ))}

              </div>

            </div>

          )}

        </div>



        {/* Right: Review Stats & Keep Moving Cards (Image 1 reference) */}

        <div className="lg:col-span-4 space-y-5">

          {/* Your Review Stats Card */}

          <div className="bg-white dark:bg-[#1C1C1C] border border-slate-200 dark:border-[#383838] rounded-2xl p-5 shadow-sm space-y-4">

            <div className="flex items-center justify-between">

              <h3 className="text-sm font-heading font-bold text-[#0F172A] dark:text-[#F7F3ED]">

                Your Review Stats

              </h3>

              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-slate-200 dark:border-[#383838] bg-slate-50 dark:bg-[#202020] text-xs font-medium text-[#475569] dark:text-[#B8B2AC]">

                <span>This Week</span>

                <ChevronDown className="w-3 h-3 text-[#64748B]" />

              </div>

            </div>



            <div className="grid grid-cols-2 gap-3 pt-1">

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#141414] border border-slate-100 dark:border-[#272727]">

                <div className="text-[11px] text-[#64748B] dark:text-[#85817D]">Audited Drafts</div>

                <div className="text-xl font-extrabold text-[#0F172A] dark:text-[#F7F3ED] mt-0.5">

                  {submissions.length || 12}

                </div>

                <div className="text-[10px] text-[#10B981] font-semibold mt-1">↑ 18% vs last week</div>

              </div>



              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#141414] border border-slate-100 dark:border-[#272727]">

                <div className="text-[11px] text-[#64748B] dark:text-[#85817D]">Avg. Score</div>

                <div className="text-xl font-extrabold text-[#2563EB] dark:text-[#FFAA35] mt-0.5">

                  96/100

                </div>

                <div className="text-[10px] text-[#10B981] font-semibold mt-1">Verified safe</div>

              </div>

            </div>

          </div>



          {/* Keep your review moving Card */}

          <div className="bg-white dark:bg-[#1C1C1C] border border-slate-200 dark:border-[#383838] rounded-2xl p-5 shadow-sm space-y-3 relative overflow-hidden">

            <div className="flex items-start justify-between gap-3">

              <div className="space-y-1">

                <h3 className="text-sm font-heading font-bold text-[#0F172A] dark:text-[#F7F3ED]">

                  Keep your review moving

                </h3>

                <p className="text-xs text-[#64748B] dark:text-[#85817D] leading-relaxed">

                  A clear next step for this workspace. Inspect pending queue authorizations.

                </p>

              </div>



              {/* 3D Stack Document Icon Badge */}

              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#0284C7] to-[#14B8A6] p-2.5 text-white flex items-center justify-center shrink-0 shadow-md">

                <Layers className="w-6 h-6 stroke-[2]" />

              </div>

            </div>



            <Link

              href="/reviews"

              className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#272727] dark:hover:bg-[#303030] text-[#0F172A] dark:text-[#F7F3ED] text-xs font-bold transition flex items-center justify-center gap-1.5"

            >

              <span>View Review Queue</span>

              <span>→</span>

            </Link>

          </div>

        </div>

      </div>



      {/* Right: Active Campaign Submissions Tracker */}

      <div className="bg-white dark:bg-[#1C1C1C] border border-slate-200 dark:border-[#383838] rounded-2xl p-6 shadow-sm dark:shadow-card space-y-4">

        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#383838]">

          <h2 className="text-sm font-heading font-bold text-[#0F172A] dark:text-[#F7F3ED] flex items-center gap-2">

            <FileText className="w-4 h-4 text-[#10B981] dark:text-[#FFAA35]" />

            <span>Active Campaign Submissions</span>

          </h2>

          <Link

            href="/audits"

            className="text-xs text-[#2563EB] dark:text-[#FFAA35] font-semibold hover:underline flex items-center gap-1 transition"

          >

            <span>View All</span>

            <ArrowRight className="w-3 h-3" />

          </Link>

        </div>



        <div className="divide-y divide-slate-100 dark:divide-[#383838]">

          {submissions.length > 0 ? (

            submissions.map((sub) => {

              const isSelected = selectedMarketingSub?.id === sub.id;

              const requiresChanges = sub.status === "changes_requested";

              return (

                <div

                  key={sub.id}

                  onClick={() => setSelectedMarketingSub(sub)}

                  className={`py-3.5 flex items-center justify-between px-3 rounded-xl transition-all gap-3 cursor-pointer ${

                    isSelected

                      ? "bg-slate-50 dark:bg-[#272727] border border-[#10B981]/40 dark:border-[#FFAA35]/40 shadow-xs"

                      : "hover:bg-slate-50/70 dark:hover:bg-[#202020] border border-transparent"

                  }`}

                >

                  <div className="space-y-1 min-w-0 flex-1">

                    <div className="text-sm font-bold text-[#0F172A] dark:text-[#F7F3ED] flex items-center gap-2">

                      <span className="truncate">{sub.title}</span>

                      <span className="text-[10px] text-[#64748B] dark:text-[#85817D] uppercase px-1.5 py-0.5 rounded bg-slate-100 dark:bg-[#141414] border border-slate-200 dark:border-[#383838] shrink-0 font-medium">

                        {sub.content_type}

                      </span>

                    </div>

                    <div className="text-xs text-[#64748B] dark:text-[#85817D] truncate">{sub.description}</div>

                    {requiresChanges && (

                      <div className="text-[10px] text-[#D97706] dark:text-[#FFD166] font-semibold flex items-center gap-1">

                        <AlertTriangle className="w-3 h-3 shrink-0" />

                        <span>Reviewer requested edits before approval</span>

                      </div>

                    )}

                  </div>



                  <div className="flex items-center gap-2 shrink-0">

                    <span

                      className={`text-[11px] px-2.5 py-1 rounded-full font-bold border capitalize ${getStatusBadge(

                        sub.status

                      )}`}

                    >

                      {sub.status.replace("_", " ")}

                    </span>

                    {requiresChanges && (

                      <button

                        type="button"

                        onClick={(e) => {

                          e.stopPropagation();

                          handleOpenRevision(sub);

                        }}

                        className="text-xs px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-bold transition flex items-center gap-1 shadow-xs"

                        title="Revise draft text and resubmit for review"

                      >

                        <RotateCcw className="w-3 h-3" />

                        <span>Revise</span>

                      </button>

                    )}

                    <button

                      type="button"

                      onClick={(e) => {

                        e.stopPropagation();

                        setViewingSub(sub);

                        setIsViewerOpen(true);

                      }}

                      className="text-xs px-2.5 py-1 bg-white hover:bg-slate-50 text-[#0F172A] border border-slate-200 dark:btn-dark-secondary rounded-lg font-semibold transition flex items-center gap-1"

                      title="Open and view draft copy or asset"

                    >

                      <Eye className="w-3 h-3" />

                      <span>Open</span>

                    </button>

                    <Link

                      href={`/audits?id=${sub.id}`}

                      onClick={(e) => e.stopPropagation()}

                      className="text-xs px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-[#2563EB] dark:bg-[#202020] dark:hover:bg-[#272727] dark:text-[#FFAA35] rounded-lg border border-slate-200 dark:border-[#383838] transition flex items-center gap-1 font-semibold"

                    >

                      <span>Audit</span>

                    </Link>

                  </div>

                </div>

              );

            })

          ) : (

            <div className="py-16 text-center text-[#64748B] dark:text-[#85817D] text-xs">

              No active campaign submissions found. Submit copy above to begin governance checks.

            </div>

          )}

        </div>

      </div>



      {/* Selected Draft Inspection & Reviewer Feedback Panel */}

      {selectedMarketingSub && (

        <div className="bg-white dark:bg-[#1C1C1C] border border-slate-200 dark:border-[#383838] rounded-2xl p-6 shadow-sm dark:shadow-card space-y-4">

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-[#383838] pb-3">

            <div>

              <span className="text-[10px] font-bold uppercase tracking-wider text-[#10B981] dark:text-[#FFAA35]">

                Submission Detail & Compliance State

              </span>

              <h3 className="text-base font-heading font-bold text-[#0F172A] dark:text-[#F7F3ED] mt-0.5">

                {selectedMarketingSub.title}

              </h3>

            </div>

            <div className="flex items-center gap-2">

              <span

                className={`text-xs px-3 py-1 rounded-full font-bold border capitalize ${getStatusBadge(

                  selectedMarketingSub.status

                )}`}

              >

                Status: {selectedMarketingSub.status.replace("_", " ")}

              </span>

            </div>

          </div>



          <div className="space-y-4">
            <div className="bg-slate-50 dark:bg-[#141414] rounded-xl p-4 border border-slate-200 dark:border-[#383838] space-y-2">
              <span className="text-[11px] font-bold uppercase text-[#64748B] dark:text-[#85817D]">
                Current Draft Payload
              </span>
              <p className="text-xs text-[#0F172A] dark:text-[#F7F3ED] font-sans leading-relaxed whitespace-pre-wrap">
                {selectedMarketingSub.raw_text || "[No raw text payload]"}
              </p>
            </div>

            {selectedSubAudit && (
              <div className="bg-slate-50 dark:bg-[#141414] rounded-xl p-4 border border-slate-200 dark:border-[#383838] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#0F172A] dark:text-[#F7F3ED]">Audit Telemetry</span>
                  <span className="text-xs font-bold text-[#2563EB] dark:text-gradient-warm">
                    Score: {selectedSubAudit.summary.compliance_score}/100
                  </span>
                </div>
                <div className="text-xs text-[#64748B] dark:text-[#85817D]">
                  Findings identified: {selectedSubAudit.findings.length}
                </div>
              </div>
            )}
          </div>

        </div>

      )}



      {/* Revision Modal */}

      {isRevisionModalOpen && revisingSub && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-sm p-4">

          <div className="bg-white dark:bg-[#1C1C1C] border border-slate-200 dark:border-[#383838] rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl">

            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#383838] pb-3">

              <h3 className="text-sm font-heading font-bold text-[#0F172A] dark:text-[#F7F3ED]">

                Revise Draft: {revisingSub.title}

              </h3>

              <button

                type="button"

                onClick={() => setIsRevisionModalOpen(false)}

                className="text-[#64748B] hover:text-[#0F172A] dark:hover:text-[#F7F3ED]"

              >

                <X className="w-4 h-4" />

              </button>

            </div>

            <form onSubmit={handleSubmitRevision} className="space-y-4">

              <div>

                <label className="block text-xs font-semibold text-[#0F172A] dark:text-[#F7F3ED] mb-1.5">

                  Updated Draft Text *

                </label>

                <textarea

                  required

                  rows={8}

                  value={revisedText}

                  onChange={(e) => setRevisedText(e.target.value)}

                  className="w-full bg-slate-50 dark:bg-[#141414] border border-slate-200 dark:border-[#383838] rounded-xl p-3.5 text-xs text-[#0F172A] dark:text-[#F7F3ED] focus:outline-none focus:border-[#10B981] dark:focus:border-[#FFAA35] font-sans leading-relaxed"

                />

              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-[#383838]">

                <button

                  type="button"

                  onClick={() => setIsRevisionModalOpen(false)}

                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:btn-dark-secondary text-xs font-semibold text-[#0F172A] dark:text-white"

                >

                  Cancel

                </button>

                <button

                  type="submit"

                  disabled={isSubmittingRevision}

                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#10B981] via-[#0284C7] to-[#2563EB] text-white dark:btn-gradient-warm text-xs font-bold shadow-md hover:opacity-95"

                >

                  {isSubmittingRevision ? "Submitting Revision..." : "Resubmit for Review"}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}



      {/* Asset Viewer Modal */}

      {isViewerOpen && viewingSub && (

        <DesignAssetViewerModal

          isOpen={isViewerOpen}

          submission={viewingSub}

          onClose={() => setIsViewerOpen(false)}

        />

      )}

    </div>

  );

}



