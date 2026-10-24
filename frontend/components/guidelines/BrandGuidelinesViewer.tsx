"use client";

import React, { useState } from "react";
import { BrandGuidelineProfile, BrandGuidelineData } from "@/types";
import {
  BookOpen,
  Palette,
  Type,
  ImageIcon,
  ShieldCheck,
  AlertTriangle,
  UploadCloud,
  Copy,
  Check,
  Search,
  CheckCircle,
  Clock,
  Sparkles,
  FileText,
  Share2,
  ExternalLink,
  Lock,
  MessageSquare,
  Globe,
  Building,
} from "lucide-react";
import { ReportUnclearModal } from "./ReportUnclearModal";

interface BrandGuidelinesViewerProps {
  profile: BrandGuidelineProfile;
}

export function BrandGuidelinesViewer({ profile }: BrandGuidelinesViewerProps) {
  const published = profile.published_data;
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  if (!published) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-indigo-950/60 border border-indigo-800/50 flex items-center justify-center mx-auto text-indigo-400">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-white tracking-tight">
          Brand Guidelines Awaiting Publication
        </h2>
        <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
          The brand governance management team has not yet published an authoritative guideline version for this organization.
          Please check back shortly or contact your workspace brand administrator.
        </p>
      </div>
    );
  }

  const tabs = [
    { id: "overview", label: "Identity & Mission", icon: BookOpen },
    { id: "voice", label: "Voice, Tone & Copy", icon: FileText },
    { id: "colors", label: "Colour Palette & Swatches", icon: Palette },
    { id: "typography", label: "Typography Standards", icon: Type },
    { id: "logos", label: "Logo & Clear Space", icon: ImageIcon },
    { id: "dodonts", label: "Brand Do's & Don'ts", icon: ShieldCheck },
    { id: "compliance", label: "Mandatory Disclaimers", icon: AlertTriangle },
    { id: "media", label: "Media Specifications", icon: Share2 },
    { id: "assets", label: "Approved Asset Library", icon: UploadCloud },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 bg-[#0B0F19]/90 shadow-xl relative">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-950/80 border border-emerald-800/60 text-emerald-400 flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5" />
                Official Published Standard
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-indigo-950 text-indigo-300 border border-indigo-800">
                v{profile.version}
              </span>
              {profile.jurisdiction && (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-900 border border-slate-700 text-slate-300 flex items-center gap-1">
                  <Globe className="w-3 h-3 text-cyan-400" />
                  {profile.jurisdiction}
                </span>
              )}
              {profile.industry && (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-900 border border-slate-700 text-slate-300 flex items-center gap-1">
                  <Building className="w-3 h-3 text-amber-400" />
                  {profile.industry}
                </span>
              )}
              {profile.review_date && (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-900 border border-slate-700 text-slate-300 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-purple-400" />
                  Review Due: {new Date(profile.review_date).toLocaleDateString()}
                </span>
              )}
            </div>
            <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight">
              {published.identity?.brand_name || profile.name}
            </h1>
            <p className="text-xs lg:text-sm text-slate-400 mt-1 max-w-2xl">
              {published.identity?.tagline || profile.description}
            </p>
          </div>

          <div className="flex flex-col items-start md:items-end justify-between gap-3 shrink-0">
            <div className="text-left md:text-right text-xs text-slate-400">
              <div>
                Published:{" "}
                <strong className="text-slate-200">
                  {profile.published_at
                    ? new Date(profile.published_at).toLocaleDateString()
                    : "Active"}
                </strong>
              </div>
              {profile.published_by && (
                <div className="mt-0.5">
                  By: <strong className="text-slate-200">{profile.published_by}</strong>
                </div>
              )}
              <span className="mt-1 inline-block px-2.5 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                Read-Only Viewer
              </span>
            </div>

            <button
              onClick={() => setShowReportModal(true)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition shadow-sm"
              title="Report an ambiguity or question to the legal & brand governance team"
            >
              <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
              <span>Report Question / Ambiguity</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-1.5 pt-4">
          {tabs.map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-2 ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB CONTENT */}

      {/* 1. Identity & Mission */}
      {activeTab === "overview" && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 bg-[#0B0F19]/90 space-y-6">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-400" />
              Corporate Identity &amp; Strategic Purpose
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-300">
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-white text-sm">About {published.identity?.brand_name}</h3>
                <p className="mt-1 text-slate-400 leading-relaxed">
                  {published.identity?.description}
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-200 text-xs uppercase tracking-wider">Mission</h4>
                <p className="mt-1 text-slate-400 leading-relaxed">{published.identity?.mission}</p>
              </div>

              <div>
                <h4 className="font-bold text-slate-200 text-xs uppercase tracking-wider">Vision</h4>
                <p className="mt-1 text-slate-400 leading-relaxed">{published.identity?.vision}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-bold text-slate-200 text-xs uppercase tracking-wider">
                  Core Brand Values
                </h4>
                <div className="flex flex-wrap gap-2 mt-2">
                  {published.identity?.values?.map((val, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-indigo-950/70 border border-indigo-800/60 text-indigo-300 font-semibold rounded-lg"
                    >
                      {val}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-200 text-xs uppercase tracking-wider">
                  Market Positioning
                </h4>
                <p className="mt-1 text-slate-400 leading-relaxed">
                  {published.identity?.positioning}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">
                    Primary Audience
                  </span>
                  <p className="font-semibold text-slate-200 mt-0.5">
                    {published.identity?.primary_audience}
                  </p>
                </div>
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">
                    Website
                  </span>
                  <a
                    href={published.identity?.website_url}
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-indigo-400 hover:text-indigo-300 mt-0.5 flex items-center gap-1"
                  >
                    <span>Visit Site</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Voice & Tone */}
      {activeTab === "voice" && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 bg-[#0B0F19]/90 space-y-6">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-400" />
              Brand Voice, Tone &amp; Messaging Standards
            </h2>
          </div>

          <div className="space-y-6">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Approved Brand Tones
              </span>
              <div className="flex flex-wrap gap-2">
                {published.voice?.brand_tone?.map((tone, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-950/80 border border-indigo-800 text-indigo-300"
                  >
                    {tone}
                  </span>
                ))}
                <span className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 border border-slate-800 text-slate-400 capitalize">
                  Formality: {published.voice?.formality_level}
                </span>
              </div>
            </div>

            {/* Forbidden Terms Alert */}
            <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-800/60 space-y-2">
              <span className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                Words &amp; Phrases to Avoid
              </span>
              <p className="text-[11px] text-slate-400">
                Do not use these terms in customer-facing copy. The AI engine automatically flags them during audit passes.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                {published.voice?.words_to_avoid?.map((word, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 bg-rose-950 border border-rose-800 text-rose-300 text-xs font-mono rounded-lg"
                  >
                    {word}
                  </span>
                ))}
              </div>
            </div>

            {/* Approved Copy Examples with 1-click Copy */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Approved Messaging Copy Examples
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {published.voice?.approved_copy_examples?.map((ex, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 relative group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                        {ex.context}
                      </span>
                      <button
                        onClick={() => copyToClipboard(ex.text, `copy_${idx}`)}
                        className="text-slate-400 hover:text-white transition flex items-center gap-1 text-[11px]"
                      >
                        {copiedKey === `copy_${idx}` ? (
                          <span className="text-emerald-400 font-semibold flex items-center gap-1">
                            <Check className="w-3 h-3" /> Copied!
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <Copy className="w-3 h-3" /> Copy
                          </span>
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-slate-200 leading-relaxed italic">&ldquo;{ex.text}&rdquo;</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Color Palette */}
      {activeTab === "colors" && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 bg-[#0B0F19]/90 space-y-6">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Palette className="w-4 h-4 text-indigo-400" />
              Approved Brand Colour System
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Click any color swatch or HEX code to instantly copy it to your clipboard.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {published.colors?.palette?.map((c) => (
              <div
                key={c.id}
                className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 cursor-pointer hover:border-slate-700 transition"
                onClick={() => copyToClipboard(c.hex, c.id)}
              >
                <div
                  className="w-full h-20 rounded-lg border border-white/10 shadow-inner relative flex items-end p-2.5"
                  style={{ backgroundColor: c.hex }}
                >
                  <span
                    className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-black/60 text-white backdrop-blur-sm"
                  >
                    {c.hex}
                  </span>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-white">{c.name}</h4>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                      {c.role}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">{c.usage_intent}</p>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="capitalize">{c.status}</span>
                  <span className="text-indigo-400 font-semibold flex items-center gap-1">
                    {copiedKey === c.id ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy HEX</span>
                      </>
                    )}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Typography Standards */}
      {activeTab === "typography" && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 bg-[#0B0F19]/90 space-y-6">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Type className="w-4 h-4 text-indigo-400" />
              Approved Typography Hierarchy &amp; Specimen
            </h2>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Primary Font</span>
              <p className="text-sm font-bold text-white mt-1">{published.typography?.primary_font}</p>
            </div>
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Secondary Font</span>
              <p className="text-sm font-bold text-white mt-1">{published.typography?.secondary_font}</p>
            </div>
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Display Font</span>
              <p className="text-sm font-bold text-white mt-1">{published.typography?.display_font || "None"}</p>
            </div>
          </div>

          {/* Presets Table */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              Type Presets
            </span>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-slate-300">
                <thead className="bg-slate-900 text-slate-400 uppercase text-[10px]">
                  <tr>
                    <th className="p-2.5 rounded-l-lg">Role</th>
                    <th className="p-2.5">Font</th>
                    <th className="p-2.5">Size</th>
                    <th className="p-2.5">Line Height</th>
                    <th className="p-2.5">Weight</th>
                    <th className="p-2.5 rounded-r-lg">Usage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {published.typography?.presets?.map((p, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/40">
                      <td className="p-2.5 font-bold text-white">{p.name}</td>
                      <td className="p-2.5 font-mono text-[11px]">{p.font_family}</td>
                      <td className="p-2.5 font-mono text-[11px]">{p.font_size}</td>
                      <td className="p-2.5 font-mono text-[11px]">{p.line_height}</td>
                      <td className="p-2.5 font-mono text-[11px]">{p.font_weight}</td>
                      <td className="p-2.5 text-slate-400 text-[11px]">{p.intended_usage}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 5. Logo & Clear Space */}
      {activeTab === "logos" && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 bg-[#0B0F19]/90 space-y-6">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-indigo-400" />
              Approved Logo Variants &amp; Placement Rules
            </h2>
          </div>

          <div className="space-y-4">
            {published.logos?.variants?.map((l) => (
              <div
                key={l.id}
                className="p-5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
              >
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{l.name}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-950 px-2 py-0.5 rounded border border-indigo-800/60">
                      {l.type}
                    </span>
                  </div>
                  <p className="text-slate-400">
                    <strong>Clear Space Rule:</strong> {l.clear_space_formula}
                  </p>
                  <p className="text-slate-400">
                    <strong>Minimum Dimensions:</strong> {l.min_width_px}px &times; {l.min_height_px}px
                  </p>
                  <p className="text-slate-400">
                    <strong>Prohibited Modifications:</strong> {l.prohibited_modifications}
                  </p>
                </div>

                <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl text-center shrink-0">
                  <div className="w-36 h-12 flex items-center justify-center font-bold tracking-tight text-white border border-dashed border-slate-700 rounded bg-slate-950 text-sm">
                    {l.type === "icon" ? "SOVEREIGN ICON" : "PRIMARY WORDMARK"}
                  </div>
                  <span className="text-[10px] text-emerald-400 mt-1 block font-semibold">
                    Verified Vector Asset
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. Brand Do's & Don'ts */}
      {activeTab === "dodonts" && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 bg-[#0B0F19]/90 space-y-6">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Brand Governance Do&apos;s and Don&apos;ts
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {published.dos_and_donts?.map((r) => (
              <div
                key={r.id}
                className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">{r.title}</span>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                      r.priority === "critical"
                        ? "bg-rose-950 text-rose-300 border-rose-800"
                        : r.priority === "high"
                        ? "bg-amber-950 text-amber-300 border-amber-800"
                        : "bg-slate-800 text-slate-300 border-slate-700"
                    }`}
                  >
                    {r.priority}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{r.description}</p>
                <span className="text-[10px] font-semibold text-slate-500 uppercase block">
                  Category: {r.type.replace("_", " ")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. Mandatory Disclaimers */}
      {activeTab === "compliance" && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 bg-[#0B0F19]/90 space-y-6">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Mandatory Legal Disclaimers &amp; Disclosures
            </h2>
          </div>

          <div className="space-y-4">
            {published.compliance?.map((comp) => (
              <div
                key={comp.id}
                className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 relative group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{comp.title}</span>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-950 border border-amber-800 text-amber-400">
                      {comp.requirement_level}
                    </span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(comp.rule_text, comp.id)}
                    className="text-slate-400 hover:text-white transition flex items-center gap-1 text-[11px]"
                  >
                    {copiedKey === comp.id ? (
                      <span className="text-emerald-400 font-semibold flex items-center gap-1">
                        <Check className="w-3 h-3" /> Copied!
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <Copy className="w-3 h-3" /> Copy Statement
                      </span>
                    )}
                  </button>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-mono bg-slate-900 p-2.5 rounded border border-slate-800/80">
                  {comp.rule_text}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 8. Media Specifications */}
      {activeTab === "media" && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 bg-[#0B0F19]/90 space-y-6">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Share2 className="w-4 h-4 text-indigo-400" />
              Media &amp; Platform Placement Specifications
            </h2>
          </div>

          <div className="space-y-4">
            {published.media_guidelines?.social_media?.platforms?.map((p, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{p.platform}</span>
                    <span className="text-[10px] text-slate-400 font-semibold px-2 py-0.5 rounded bg-slate-900">
                      {p.placement}
                    </span>
                  </div>
                  <span className="text-xs font-mono text-indigo-400 font-bold">
                    {p.dimensions} ({p.aspect_ratio})
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
                  <div>
                    <strong>Safe Margins:</strong> {p.safe_areas}
                  </div>
                  <div>
                    <strong>Text Density:</strong> {p.text_density_limit}
                  </div>
                  <div>
                    <strong>Headline Type:</strong> {p.headline_size}
                  </div>
                  <div>
                    <strong>Export Format:</strong> {p.export_format}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 9. Asset Library */}
      {activeTab === "assets" && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 bg-[#0B0F19]/90 space-y-6">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <UploadCloud className="w-4 h-4 text-indigo-400" />
              Approved Brand Assets &amp; Downloads
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {published.assets_library?.map((asset) => (
              <div
                key={asset.id}
                className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-950 px-2 py-0.5 rounded">
                      {asset.type}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Certified
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-white mt-2">{asset.name}</h4>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{asset.description}</p>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 font-mono">{asset.campaign}</span>
                  <a
                    href={asset.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
                  >
                    <span>Download</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Compliance & Legal Disclaimer Banner */}
      <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-800/40 text-amber-200/90 text-xs flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-amber-300">
            Advisory Notice &amp; Compliance Workflow Role
          </p>
          <p className="text-[11px] text-amber-200/70 leading-relaxed">
            Inkloom AI supports brand governance, factual verification, and internal compliance review workflows. Following approved guidelines establishes organizational conformity but <strong>does not constitute binding legal counsel</strong>, guarantee absolute legal immunity, or eliminate the risk of regulatory enforcement or disputes. Final campaign clearance remains the responsibility of authorized legal counsel and organizational officers.
          </p>
        </div>
      </div>

      {/* Employee Ambiguity Reporting Modal */}
      {showReportModal && (
        <ReportUnclearModal
          onClose={() => setShowReportModal(false)}
        />
      )}
    </div>
  );
}
