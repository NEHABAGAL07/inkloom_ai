"use client";

import React, { useState, useEffect } from "react";
import {
  BrandGuidelineProfile,
  BrandGuidelineData,
  BrandColor,
  TypographyPreset,
  LogoVariant,
  BrandDoDont,
  BrandComplianceRule,
  BrandAssetItem,
  PlatformPlacementSpec,
} from "@/types";
import { api } from "@/services/api";
import { PublishConfirmModal } from "./PublishConfirmModal";
import { VersionHistoryModal } from "./VersionHistoryModal";
import { EffectivePreviewModal } from "./EffectivePreviewModal";
import {
  Save,
  UploadCloud,
  Eye,
  History,
  RotateCcw,
  Sparkles,
  BookOpen,
  Palette,
  Type,
  Image as ImageIcon,
  Layers,
  FileText,
  Sliders,
  CheckCircle,
  AlertTriangle,
  Plus,
  Trash2,
  ShieldCheck,
  Globe,
  Share2,
  Video,
  Camera,
  Printer,
  ChevronRight,
  Clock,
  ExternalLink,
} from "lucide-react";

interface BrandGuidelinesManagerProps {
  initialProfile: BrandGuidelineProfile;
  onRefresh: () => Promise<void>;
}

export function BrandGuidelinesManager({
  initialProfile,
  onRefresh,
}: BrandGuidelinesManagerProps) {
  // Working draft state
  const draftSource = initialProfile.draft_data || initialProfile.published_data;
  const [data, setData] = useState<BrandGuidelineData>(
    JSON.parse(JSON.stringify(draftSource))
  );
  const [originalData, setOriginalData] = useState<BrandGuidelineData>(
    JSON.parse(JSON.stringify(draftSource))
  );

  const [activeSection, setActiveSection] = useState<string>("identity");
  const [isSaving, setIsSaving] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);

  // Modals state
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Tag inputs helper state
  const [newTagInput, setNewTagInput] = useState<{ [key: string]: string }>({});

  const hasUnsavedChanges = JSON.stringify(data) !== JSON.stringify(originalData);

  // Save partial draft
  const handleSaveDraft = async () => {
    setIsSaving(true);
    setSaveFeedback(null);
    try {
      await api.saveDraftGuideline(
        data,
        data.identity?.brand_name,
        data.identity?.description
      );
      setOriginalData(JSON.parse(JSON.stringify(data)));
      setSaveFeedback("Draft saved persistently to governance registry.");
      setTimeout(() => setSaveFeedback(null), 4000);
      await onRefresh();
    } catch (err: any) {
      alert("Error saving draft: " + (err?.message || err));
    } finally {
      setIsSaving(false);
    }
  };

  // Revert unsaved edits
  const handleRevert = () => {
    if (confirm("Discard all unsaved changes and reload last saved draft?")) {
      setData(JSON.parse(JSON.stringify(originalData)));
    }
  };

  // Publish guidelines
  const handlePublish = async (version: string, changelog: string) => {
    await api.publishGuideline(version, changelog);
    setOriginalData(JSON.parse(JSON.stringify(data)));
    setSaveFeedback(`Version ${version} published successfully!`);
    setTimeout(() => setSaveFeedback(null), 5000);
    await onRefresh();
  };

  // Version restore callback
  const handleRestoreVersion = async (versionId: string) => {
    const res = await api.restoreGuidelineVersion(versionId);
    if (res.draft_data) {
      setData(JSON.parse(JSON.stringify(res.draft_data)));
      setOriginalData(JSON.parse(JSON.stringify(res.draft_data)));
      setSaveFeedback("Previous version restored into working draft.");
      setTimeout(() => setSaveFeedback(null), 4000);
      await onRefresh();
    }
  };

  // Navigation sections structure
  const navSections = [
    {
      group: "General Brand Guidelines",
      items: [
        { id: "identity", label: "A1. Brand Identity & Purpose", icon: BookOpen },
        { id: "voice", label: "A2. Voice & Communication", icon: FileText },
        { id: "colors", label: "A3. Brand Colour System", icon: Palette },
        { id: "typography", label: "A4. Typography Hierarchy", icon: Type },
        { id: "logos", label: "A5. Logo Standards & Clear-Space", icon: ImageIcon },
        { id: "visual", label: "A6. General Visual Identity", icon: Sparkles },
        { id: "layout", label: "A7. Layout & Spacing Rules", icon: Layers },
        { id: "dodonts", label: "A8. Brand Do's & Don'ts", icon: ShieldCheck },
        { id: "compliance", label: "A9. Compliance & Disclaimers", icon: AlertTriangle },
        { id: "assets", label: "A10. Brand Asset Library", icon: UploadCloud },
      ],
    },
    {
      group: "Media-Specific Guidelines",
      items: [
        { id: "media_social", label: "B1. Social Media Graphics & Posters", icon: Share2 },
        { id: "media_photo", label: "B2. Photography & Commercial", icon: Camera },
        { id: "media_video", label: "B3. Video & Motion Graphics", icon: Video },
        { id: "media_print", label: "B4. Print Media Specifications", icon: Printer },
        { id: "media_web", label: "B5. Website & Digital Advertisements", icon: Globe },
        { id: "media_custom", label: "B6. Custom Media Categories", icon: Sliders },
      ],
    },
  ];

  // Helper to add a tag to an array field
  const addTag = (path: string[], tag: string) => {
    if (!tag.trim()) return;
    setData((prev: any) => {
      const copy = JSON.parse(JSON.stringify(prev));
      let current = copy;
      for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i]];
      }
      const arr = current[path[path.length - 1]] || [];
      if (!arr.includes(tag.trim())) {
        arr.push(tag.trim());
      }
      current[path[path.length - 1]] = arr;
      return copy;
    });
  };

  const removeTag = (path: string[], index: number) => {
    setData((prev: any) => {
      const copy = JSON.parse(JSON.stringify(prev));
      let current = copy;
      for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i]];
      }
      current[path[path.length - 1]].splice(index, 1);
      return copy;
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      {/* Top Header & Publication Control Panel */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 bg-[#0B0F19]/90 shadow-xl relative">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Manager Workspace
              </span>

              {initialProfile.status === "published" && !hasUnsavedChanges ? (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-950/80 border border-emerald-800/60 text-emerald-400 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Published
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-950/80 border border-amber-800/60 text-amber-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {hasUnsavedChanges ? "Changes Pending" : "Draft Mode"}
                </span>
              )}

              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
                v{initialProfile.version}
              </span>
            </div>

            <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight">
              Brand Guidelines Governance System
            </h1>
            <p className="text-xs lg:text-sm text-slate-400 mt-1 max-w-2xl">
              Define the authoritative brand standards that govern all creative assets, platform placements, and automated AI compliance audits.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setShowPreviewModal(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center gap-1.5 shadow-sm"
              title="Preview inherited defaults and overrides"
            >
              <Eye className="w-3.5 h-3.5 text-sky-400" />
              <span>Preview Rules</span>
            </button>

            <button
              onClick={() => setShowVersionModal(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center gap-1.5 shadow-sm"
              title="Inspect history of published versions"
            >
              <History className="w-3.5 h-3.5 text-indigo-400" />
              <span>History</span>
            </button>

            {hasUnsavedChanges && (
              <button
                onClick={handleRevert}
                className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition flex items-center gap-1"
                title="Discard working changes"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Revert</span>
              </button>
            )}

            <button
              onClick={handleSaveDraft}
              disabled={isSaving}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md ${
                hasUnsavedChanges
                  ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30"
                  : "bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
              }`}
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? "Saving..." : hasUnsavedChanges ? "Save Draft *" : "Draft Saved"}</span>
            </button>

            <button
              onClick={() => setShowPublishModal(true)}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white transition flex items-center gap-1.5 shadow-lg shadow-emerald-600/25"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Publish Guidelines</span>
            </button>
          </div>
        </div>

        {/* Status & Feedback Toast */}
        <div className="pt-3 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
          <div className="flex items-center gap-4">
            <span>
              Last Published:{" "}
              <strong className="text-slate-200 font-medium">
                {initialProfile.published_at
                  ? new Date(initialProfile.published_at).toLocaleString()
                  : "Not yet published"}
              </strong>
            </span>
            {initialProfile.published_by && (
              <span>
                By: <strong className="text-slate-200 font-medium">{initialProfile.published_by}</strong>
              </span>
            )}
          </div>
          {saveFeedback && (
            <span className="text-emerald-400 font-semibold flex items-center gap-1.5 animate-pulse">
              <CheckCircle className="w-3.5 h-3.5" />
              {saveFeedback}
            </span>
          )}
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Sidebar Category Navigation */}
        <div className="lg:col-span-1 space-y-4">
          <div className="glass-panel p-3 rounded-2xl border border-slate-800 bg-[#0B0F19]/90 sticky top-4 space-y-4">
            {navSections.map((grp, gIdx) => (
              <div key={gIdx} className="space-y-1">
                <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">
                  {grp.group}
                </div>
                {grp.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeSection === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveSection(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-left transition ${
                        isActive
                          ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                          : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-white" : "text-indigo-400"}`} />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {isActive && <ChevronRight className="w-3.5 h-3.5 shrink-0 text-white" />}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Right Content Editor Area */}
        <div className="lg:col-span-3 space-y-6">
          {/* SECTION A1: Brand Identity */}
          {activeSection === "identity" && (
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 bg-[#0B0F19]/90 space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-indigo-400" />
                  A1. Brand Identity &amp; Corporate Purpose
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Core enterprise positioning, mission statement, target market, and audience personas.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Official Brand Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={data.identity?.brand_name || ""}
                    onChange={(e) =>
                      setData({
                        ...data,
                        identity: { ...data.identity, brand_name: e.target.value },
                      })
                    }
                    placeholder="e.g. Acme Cloud Systems"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Industry &amp; Business Sector
                  </label>
                  <input
                    type="text"
                    value={data.identity?.industry || ""}
                    onChange={(e) =>
                      setData({
                        ...data,
                        identity: { ...data.identity, industry: e.target.value },
                      })
                    }
                    placeholder="e.g. Enterprise Cloud & Infrastructure"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Brand Tagline / Slogan
                  </label>
                  <input
                    type="text"
                    value={data.identity?.tagline || ""}
                    onChange={(e) =>
                      setData({
                        ...data,
                        identity: { ...data.identity, tagline: e.target.value },
                      })
                    }
                    placeholder="e.g. Autonomous Zero-Trust Infrastructure for the AI-Native Enterprise"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Company Overview &amp; Description
                  </label>
                  <textarea
                    rows={3}
                    value={data.identity?.description || ""}
                    onChange={(e) =>
                      setData({
                        ...data,
                        identity: { ...data.identity, description: e.target.value },
                      })
                    }
                    placeholder="Describe your organization's core operations, products, and market value..."
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Brand Mission Statement
                  </label>
                  <textarea
                    rows={2}
                    value={data.identity?.mission || ""}
                    onChange={(e) =>
                      setData({
                        ...data,
                        identity: { ...data.identity, mission: e.target.value },
                      })
                    }
                    placeholder="What immediate value does your organization champion?"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Brand Vision Statement
                  </label>
                  <textarea
                    rows={2}
                    value={data.identity?.vision || ""}
                    onChange={(e) =>
                      setData({
                        ...data,
                        identity: { ...data.identity, vision: e.target.value },
                      })
                    }
                    placeholder="Where is your brand heading over the next decade?"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Market Positioning
                  </label>
                  <input
                    type="text"
                    value={data.identity?.positioning || ""}
                    onChange={(e) =>
                      setData({
                        ...data,
                        identity: { ...data.identity, positioning: e.target.value },
                      })
                    }
                    placeholder="e.g. The premier enterprise cloud infrastructure platform combining silicon-grade isolation..."
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Primary Audience
                  </label>
                  <input
                    type="text"
                    value={data.identity?.primary_audience || ""}
                    onChange={(e) =>
                      setData({
                        ...data,
                        identity: { ...data.identity, primary_audience: e.target.value },
                      })
                    }
                    placeholder="e.g. Chief Technology Officers, Principal Platform Architects"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Secondary Audience
                  </label>
                  <input
                    type="text"
                    value={data.identity?.secondary_audience || ""}
                    onChange={(e) =>
                      setData({
                        ...data,
                        identity: { ...data.identity, secondary_audience: e.target.value },
                      })
                    }
                    placeholder="e.g. Site Reliability Engineers, DevSecOps Leads"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Values Pill Tags */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Core Brand Values
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {data.identity?.values?.map((val, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 bg-indigo-950/70 border border-indigo-800/60 text-indigo-300 text-xs rounded-lg flex items-center gap-1.5"
                      >
                        {val}
                        <button
                          type="button"
                          onClick={() => removeTag(["identity", "values"], idx)}
                          className="hover:text-rose-400"
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add value (e.g. Transparent Reliability)"
                      value={newTagInput["val"] || ""}
                      onChange={(e) =>
                        setNewTagInput({ ...newTagInput, val: e.target.value })
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addTag(["identity", "values"], newTagInput["val"]);
                          setNewTagInput({ ...newTagInput, val: "" });
                        }
                      }}
                      className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        addTag(["identity", "values"], newTagInput["val"]);
                        setNewTagInput({ ...newTagInput, val: "" });
                      }}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-xl text-slate-200"
                    >
                      + Add
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Website URL
                  </label>
                  <input
                    type="url"
                    value={data.identity?.website_url || ""}
                    onChange={(e) =>
                      setData({
                        ...data,
                        identity: { ...data.identity, website_url: e.target.value },
                      })
                    }
                    placeholder="https://acmecloud.com"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Brand Governance Contact Email
                  </label>
                  <input
                    type="email"
                    value={data.identity?.contact_email || ""}
                    onChange={(e) =>
                      setData({
                        ...data,
                        identity: { ...data.identity, contact_email: e.target.value },
                      })
                    }
                    placeholder="brand@acmecloud.com"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* SECTION A2: Voice & Communication */}
          {activeSection === "voice" && (
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 bg-[#0B0F19]/90 space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-400" />
                  A2. Brand Voice, Tone &amp; Communication Standards
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Configure tonal parameters, formality levels, forbidden vocabulary, and approved messaging copy.
                </p>
              </div>

              <div className="space-y-4">
                {/* Brand Tone Selectable Badges */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    Primary Brand Tones (Select all that apply)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      "Authoritative",
                      "Consultative",
                      "Engineering-Grade",
                      "Empowering",
                      "Empathetic",
                      "Direct",
                      "Sophisticated",
                      "Conversational",
                      "Friendly",
                      "Academic",
                    ].map((tone) => {
                      const isSelected = data.voice?.brand_tone?.includes(tone);
                      return (
                        <button
                          key={tone}
                          type="button"
                          onClick={() => {
                            const current = data.voice?.brand_tone || [];
                            const updated = isSelected
                              ? current.filter((t) => t !== tone)
                              : [...current, tone];
                            setData({
                              ...data,
                              voice: { ...data.voice, brand_tone: updated },
                            });
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${
                            isSelected
                              ? "bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30"
                              : "bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700"
                          }`}
                        >
                          {tone}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Formality Level
                    </label>
                    <select
                      value={data.voice?.formality_level || "professional"}
                      onChange={(e) =>
                        setData({
                          ...data,
                          voice: { ...data.voice, formality_level: e.target.value },
                        })
                      }
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="casual">Casual (Friendly, colloquial)</option>
                      <option value="conversational">Conversational (Accessible, direct)</option>
                      <option value="professional">Professional (Enterprise-grade, balanced)</option>
                      <option value="formal">Formal (Executive, institutional)</option>
                      <option value="academic">Academic (Rigorous, scientific)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Sentence Length Preference
                    </label>
                    <select
                      value={data.voice?.sentence_length_preference || "concise"}
                      onChange={(e) =>
                        setData({
                          ...data,
                          voice: {
                            ...data.voice,
                            sentence_length_preference: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="concise">Concise (Under 18 words per sentence)</option>
                      <option value="balanced">Balanced (15-25 words)</option>
                      <option value="detailed">Detailed (Long-form technical prose)</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Communication Style &amp; Guidelines
                    </label>
                    <textarea
                      rows={2}
                      value={data.voice?.communication_style || ""}
                      onChange={(e) =>
                        setData({
                          ...data,
                          voice: { ...data.voice, communication_style: e.target.value },
                        })
                      }
                      placeholder="e.g. Clear, technical precision backed by empirical benchmarks rather than marketing hype..."
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Words to Avoid (Crucial for AI Engine Terminology checker) */}
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Words &amp; Phrases to Avoid (Enforced by AI Engine)</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        The AI audit engine flags any creative asset containing these terms as non-compliant.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {data.voice?.words_to_avoid?.map((word, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 bg-rose-950/60 border border-rose-800/60 text-rose-300 text-xs rounded-lg flex items-center gap-1.5 font-mono"
                      >
                        {word}
                        <button
                          type="button"
                          onClick={() => removeTag(["voice", "words_to_avoid"], idx)}
                          className="hover:text-white"
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add forbidden term (e.g. miracle, magic, foolproof, OldProduct)"
                      value={newTagInput["avoid"] || ""}
                      onChange={(e) =>
                        setNewTagInput({ ...newTagInput, avoid: e.target.value })
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addTag(["voice", "words_to_avoid"], newTagInput["avoid"]);
                          setNewTagInput({ ...newTagInput, avoid: "" });
                        }
                      }}
                      className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500 flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        addTag(["voice", "words_to_avoid"], newTagInput["avoid"]);
                        setNewTagInput({ ...newTagInput, avoid: "" });
                      }}
                      className="px-3 py-1.5 bg-rose-900/60 hover:bg-rose-800 text-rose-200 text-xs font-semibold rounded-xl border border-rose-800"
                    >
                      + Add Forbidden Term
                    </button>
                  </div>
                </div>

                {/* Approved Copy Examples */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-300">
                    Approved Brand Messaging Examples
                  </label>
                  {data.voice?.approved_copy_examples?.map((ex, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-950 border border-slate-800/80 rounded-xl flex items-start justify-between gap-3"
                    >
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                          {ex.context}
                        </span>
                        <p className="text-xs text-slate-200 mt-1 italic">&ldquo;{ex.text}&rdquo;</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = [...(data.voice?.approved_copy_examples || [])];
                          updated.splice(idx, 1);
                          setData({
                            ...data,
                            voice: { ...data.voice, approved_copy_examples: updated },
                          });
                        }}
                        className="text-slate-500 hover:text-rose-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SECTION A3: Brand Colour System */}
          {activeSection === "colors" && (
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 bg-[#0B0F19]/90 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Palette className="w-4 h-4 text-indigo-400" />
                    A3. Brand Colour System &amp; Palette Manager
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Manage mandatory, secondary, accent, and semantic color definitions with live WCAG AA/AAA contrast checks.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const newColor: BrandColor = {
                      id: `col_${Date.now()}`,
                      name: "New Brand Color",
                      hex: "#6366F1",
                      rgb: "rgb(99, 102, 241)",
                      role: "accent",
                      usage_intent: "Interactive accents and buttons",
                      status: "preferred",
                    };
                    setData({
                      ...data,
                      colors: {
                        ...data.colors,
                        palette: [...(data.colors?.palette || []), newColor],
                      },
                    });
                  }}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-md shadow-indigo-600/30"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add Color</span>
                </button>
              </div>

              {/* Color Palette Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.colors?.palette?.map((c, idx) => (
                  <div
                    key={c.id || idx}
                    className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-3 relative group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <input
                            type="color"
                            value={c.hex}
                            onChange={(e) => {
                              const updated = [...(data.colors?.palette || [])];
                              updated[idx].hex = e.target.value;
                              setData({
                                ...data,
                                colors: { ...data.colors, palette: updated },
                              });
                            }}
                            className="w-12 h-12 rounded-xl cursor-pointer border border-white/20 bg-transparent p-0"
                          />
                        </div>
                        <div>
                          <input
                            type="text"
                            value={c.name}
                            onChange={(e) => {
                              const updated = [...(data.colors?.palette || [])];
                              updated[idx].name = e.target.value;
                              setData({
                                ...data,
                                colors: { ...data.colors, palette: updated },
                              });
                            }}
                            className="text-xs font-bold text-white bg-transparent border-b border-transparent hover:border-slate-700 focus:border-indigo-500 focus:outline-none"
                          />
                          <div className="flex items-center gap-2 mt-1">
                            <span className="font-mono text-[11px] text-slate-300 font-semibold uppercase">
                              {c.hex}
                            </span>
                            <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                              {c.role}
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const updated = [...(data.colors?.palette || [])];
                          updated.splice(idx, 1);
                          setData({
                            ...data,
                            colors: { ...data.colors, palette: updated },
                          });
                        }}
                        className="text-slate-500 hover:text-rose-400 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-0.5">Role</label>
                        <select
                          value={c.role}
                          onChange={(e) => {
                            const updated = [...(data.colors?.palette || [])];
                            updated[idx].role = e.target.value as any;
                            setData({
                              ...data,
                              colors: { ...data.colors, palette: updated },
                            });
                          }}
                          className="w-full px-2 py-1 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-300"
                        >
                          <option value="primary">Primary</option>
                          <option value="secondary">Secondary</option>
                          <option value="accent">Accent</option>
                          <option value="background">Background</option>
                          <option value="text">Text</option>
                          <option value="neutral">Neutral</option>
                          <option value="semantic">Semantic Status</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-400 block mb-0.5">Status</label>
                        <select
                          value={c.status}
                          onChange={(e) => {
                            const updated = [...(data.colors?.palette || [])];
                            updated[idx].status = e.target.value as any;
                            setData({
                              ...data,
                              colors: { ...data.colors, palette: updated },
                            });
                          }}
                          className="w-full px-2 py-1 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-300"
                        >
                          <option value="mandatory">Mandatory</option>
                          <option value="preferred">Preferred</option>
                          <option value="restricted">Restricted</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <input
                        type="text"
                        value={c.usage_intent || ""}
                        onChange={(e) => {
                          const updated = [...(data.colors?.palette || [])];
                          updated[idx].usage_intent = e.target.value;
                          setData({
                            ...data,
                            colors: { ...data.colors, palette: updated },
                          });
                        }}
                        placeholder="Usage rules / Intent..."
                        className="w-full px-2.5 py-1.5 bg-slate-900/60 border border-slate-800/80 rounded-lg text-[11px] text-slate-300 placeholder-slate-600 focus:outline-none"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION A4: Typography Guidelines */}
          {activeSection === "typography" && (
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 bg-[#0B0F19]/90 space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Type className="w-4 h-4 text-indigo-400" />
                  A4. Typography System &amp; Presets
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Define brand typefaces, weights, line-height hierarchies, and interactive live preview specimens.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Primary Font Family
                  </label>
                  <input
                    type="text"
                    value={data.typography?.primary_font || ""}
                    onChange={(e) =>
                      setData({
                        ...data,
                        typography: { ...data.typography, primary_font: e.target.value },
                      })
                    }
                    placeholder="e.g. Inter"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Secondary Font Family
                  </label>
                  <input
                    type="text"
                    value={data.typography?.secondary_font || ""}
                    onChange={(e) =>
                      setData({
                        ...data,
                        typography: { ...data.typography, secondary_font: e.target.value },
                      })
                    }
                    placeholder="e.g. Roboto"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Display / Headline Font
                  </label>
                  <input
                    type="text"
                    value={data.typography?.display_font || ""}
                    onChange={(e) =>
                      setData({
                        ...data,
                        typography: { ...data.typography, display_font: e.target.value },
                      })
                    }
                    placeholder="e.g. Outfit"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Live Typography Preview Specimen */}
              <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Live Typography Specimen
                </div>
                <div className="space-y-3">
                  <div
                    style={{
                      fontFamily: data.typography?.display_font || "sans-serif",
                    }}
                    className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight"
                  >
                    H1 Headline Specimen: Autonomous Cloud Fabric
                  </div>
                  <div
                    style={{
                      fontFamily: data.typography?.primary_font || "sans-serif",
                    }}
                    className="text-sm text-slate-300 leading-relaxed max-w-2xl"
                  >
                    Body text specimen rendering: Enterprise microservices achieve verified 99.999% SLA throughput using deterministic packet queues across sovereign cloud data centers.
                  </div>
                </div>
              </div>

              {/* Hierarchy Presets Table */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Configured Presets (H1, H2, Body, CTA)
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left text-slate-300">
                    <thead className="bg-slate-900 text-slate-400 uppercase text-[10px]">
                      <tr>
                        <th className="p-2.5 rounded-l-lg">Preset</th>
                        <th className="p-2.5">Font Family</th>
                        <th className="p-2.5">Size</th>
                        <th className="p-2.5">Line Height</th>
                        <th className="p-2.5">Weight</th>
                        <th className="p-2.5 rounded-r-lg">Usage</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {data.typography?.presets?.map((p, idx) => (
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

          {/* SECTION A5: Logo Guidelines */}
          {activeSection === "logos" && (
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 bg-[#0B0F19]/90 space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-indigo-400" />
                  A5. Logo Guidelines &amp; Clear Space Standards
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Manage primary wordmarks, monograms, clear-space minimums, and prohibited modifications.
                </p>
              </div>

              <div className="space-y-4">
                {data.logos?.variants?.map((logo, idx) => (
                  <div
                    key={logo.id || idx}
                    className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">{logo.name}</span>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-950 text-indigo-400 border border-indigo-800/60">
                          {logo.type}
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-slate-400 space-y-0.5">
                        <p>
                          <strong>Clear Space:</strong> {logo.clear_space_formula}
                        </p>
                        <p>
                          <strong>Minimum Size:</strong> {logo.min_width_px}px &times; {logo.min_height_px}px
                        </p>
                        <p>
                          <strong>Preferred Placement:</strong> {logo.preferred_placement}
                        </p>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-center">
                      <div className="w-28 h-10 flex items-center justify-center font-bold tracking-tight text-white border border-dashed border-slate-700 rounded bg-slate-950">
                        {logo.type === "icon" ? "ICON" : "WORDMARK"}
                      </div>
                      <span className="text-[10px] text-slate-500 mt-1 block">Approved Asset</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION A8: Do's and Don'ts */}
          {activeSection === "dodonts" && (
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 bg-[#0B0F19]/90 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    A8. Brand Do&apos;s and Don&apos;ts (AI Rule Engine)
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Structured rules evaluated during automated creative audits with Critical, High, Medium, and Low severity weighting.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const newRule: BrandDoDont = {
                      id: `rule_${Date.now()}`,
                      title: "New Governance Policy Rule",
                      description: "Specify the exact requirement or prohibited practice here...",
                      type: "mandatory",
                      priority: "high",
                    };
                    setData({
                      ...data,
                      dos_and_donts: [...(data.dos_and_donts || []), newRule],
                    });
                  }}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-md shadow-indigo-600/30"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add Policy Rule</span>
                </button>
              </div>

              <div className="space-y-3">
                {data.dos_and_donts?.map((rule, idx) => (
                  <div
                    key={rule.id || idx}
                    className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 relative"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
                        <div className="md:col-span-2">
                          <input
                            type="text"
                            value={rule.title}
                            onChange={(e) => {
                              const updated = [...(data.dos_and_donts || [])];
                              updated[idx].title = e.target.value;
                              setData({ ...data, dos_and_donts: updated });
                            }}
                            className="w-full text-xs font-bold text-white bg-transparent border-b border-slate-800 focus:border-indigo-500 focus:outline-none"
                            placeholder="Rule Title"
                          />
                        </div>
                        <div className="flex gap-2">
                          <select
                            value={rule.priority}
                            onChange={(e) => {
                              const updated = [...(data.dos_and_donts || [])];
                              updated[idx].priority = e.target.value as any;
                              setData({ ...data, dos_and_donts: updated });
                            }}
                            className="px-2 py-1 bg-slate-900 border border-slate-800 rounded-lg text-xs font-bold capitalize text-slate-300"
                          >
                            <option value="critical">Critical</option>
                            <option value="high">High</option>
                            <option value="medium">Medium</option>
                            <option value="low">Low</option>
                          </select>

                          <select
                            value={rule.type}
                            onChange={(e) => {
                              const updated = [...(data.dos_and_donts || [])];
                              updated[idx].type = e.target.value as any;
                              setData({ ...data, dos_and_donts: updated });
                            }}
                            className="px-2 py-1 bg-slate-900 border border-slate-800 rounded-lg text-xs capitalize text-slate-300"
                          >
                            <option value="mandatory">Mandatory</option>
                            <option value="recommended">Recommended</option>
                            <option value="prohibited">Prohibited</option>
                            <option value="common_mistake">Common Mistake</option>
                            <option value="special_exception">Special Exception</option>
                          </select>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const updated = [...(data.dos_and_donts || [])];
                          updated.splice(idx, 1);
                          setData({ ...data, dos_and_donts: updated });
                        }}
                        className="text-slate-500 hover:text-rose-400 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <textarea
                      rows={2}
                      value={rule.description}
                      onChange={(e) => {
                        const updated = [...(data.dos_and_donts || [])];
                        updated[idx].description = e.target.value;
                        setData({ ...data, dos_and_donts: updated });
                      }}
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800/80 rounded-lg text-xs text-slate-300 placeholder-slate-600 focus:outline-none"
                      placeholder="Detailed rule explanation for designers and AI engine..."
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION A9: Compliance & Disclaimers */}
          {activeSection === "compliance" && (
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 bg-[#0B0F19]/90 space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  A9. Mandatory Compliance, Disclaimers &amp; Legal Notices
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Mandatory regulatory disclaimers, trademark usage notices, and quantitative benchmark citations.
                </p>
              </div>

              <div className="space-y-3">
                {data.compliance?.map((comp, idx) => (
                  <div
                    key={comp.id || idx}
                    className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 relative"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{comp.title}</span>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-950 border border-amber-800 text-amber-400">
                          {comp.requirement_level}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 uppercase font-mono">{comp.category}</span>
                    </div>
                    <textarea
                      rows={2}
                      value={comp.rule_text}
                      onChange={(e) => {
                        const updated = [...(data.compliance || [])];
                        updated[idx].rule_text = e.target.value;
                        setData({ ...data, compliance: updated });
                      }}
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION A10: Asset Library */}
          {activeSection === "assets" && (
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 bg-[#0B0F19]/90 space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <UploadCloud className="w-4 h-4 text-indigo-400" />
                  A10. Brand Asset Library &amp; Certifications
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Repository of approved SVG wordmarks, reference architectures, design templates, and brand books.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {data.assets_library?.map((asset, idx) => (
                  <div
                    key={asset.id || idx}
                    className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-950 px-2 py-0.5 rounded">
                          {asset.type}
                        </span>
                        <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Approved
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
                        <span>View</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION B1: Social Media Graphics & Posters */}
          {activeSection === "media_social" && (
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 bg-[#0B0F19]/90 space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Share2 className="w-4 h-4 text-indigo-400" />
                    B1. Social Media Graphics &amp; Posters
                  </h2>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">Inherit Brand Defaults:</span>
                    <input
                      type="checkbox"
                      checked={data.media_guidelines?.social_media?.inherit_brand_defaults ?? true}
                      onChange={(e) => {
                        const copy = { ...data };
                        copy.media_guidelines.social_media.inherit_brand_defaults = e.target.checked;
                        setData(copy);
                      }}
                      className="rounded accent-indigo-600"
                    />
                  </div>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Specific dimension presets, safe margins, and text density rules for social campaign collaterals.
                </p>
              </div>

              <div className="space-y-4">
                {data.media_guidelines?.social_media?.platforms?.map((p, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{p.platform}</span>
                        <span className="text-[10px] text-slate-400 font-semibold px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                          {p.placement}
                        </span>
                      </div>
                      <span className="text-xs font-mono text-indigo-400 font-bold">{p.dimensions} ({p.aspect_ratio})</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
                      <div>
                        <strong>Safe Margin:</strong> {p.safe_areas}
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

          {/* Fallback for other Sections (Visual, Layout, Photo, Video, Print, Web) */}
          {[
            "visual",
            "layout",
            "media_photo",
            "media_video",
            "media_print",
            "media_web",
            "media_custom",
          ].includes(activeSection) && (
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 bg-[#0B0F19]/90 space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <h2 className="text-lg font-bold text-white capitalize">
                  {activeSection.replace("media_", "Media Specification: ").replace("_", " ")}
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Configured rules inherit from the general brand standards unless an explicit override is supplied.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-semibold">Section Status:</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                    Active &amp; Enforced
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Settings in this category are fully structured and linked to the automated AI governance engine. Use &ldquo;Preview Rules&rdquo; in the top bar to inspect inherited values and verify conflict checks.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showPublishModal && (
        <PublishConfirmModal
          currentVersion={initialProfile.version}
          draftData={data}
          onClose={() => setShowPublishModal(false)}
          onPublish={handlePublish}
        />
      )}

      {showVersionModal && (
        <VersionHistoryModal
          currentVersion={initialProfile.version}
          onClose={() => setShowVersionModal(false)}
          onRestore={handleRestoreVersion}
        />
      )}

      {showPreviewModal && (
        <EffectivePreviewModal onClose={() => setShowPreviewModal(false)} />
      )}
    </div>
  );
}
