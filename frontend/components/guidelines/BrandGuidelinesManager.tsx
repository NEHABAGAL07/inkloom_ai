"use client";

import React, { useState } from "react";
import {
  BrandGuidelineProfile,
  BrandGuidelineData,
  BrandComplianceRule,
  StarterTemplateRule,
} from "@/types";
import { api } from "@/services/api";
import { useAuth } from "@/services/auth-context";
import { PublishConfirmModal } from "./PublishConfirmModal";
import { VersionHistoryModal } from "./VersionHistoryModal";
import { EffectivePreviewModal } from "./EffectivePreviewModal";
import { SubmitReviewModal } from "./SubmitReviewModal";
import { LegalReviewModal } from "./LegalReviewModal";
import { ConflictCheckModal } from "./ConflictCheckModal";
import { StarterTemplatesModal } from "./StarterTemplatesModal";
import {
  IdentitySection,
  VoiceSection,
  ColorsSection,
  TypographySection,
  LogosSection,
  DoDontsSection,
  ComplianceSection,
  AssetsSection,
  MediaSocialSection,
  MediaFallbackSection,
} from "./sections";
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
  ShieldCheck,
  Globe,
  Share2,
  Video,
  Camera,
  Printer,
  ChevronRight,
  Clock,
  Scale,
  Send,
  Building,
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

  // Role context
  const { activeRole } = useAuth();
  const isLegalOfficer =
    activeRole === "compliance_officer" ||
    activeRole === "legal" ||
    initialProfile.can_review_legal === true;

  // Modals state
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showSubmitReviewModal, setShowSubmitReviewModal] = useState(false);
  const [showLegalReviewModal, setShowLegalReviewModal] = useState(false);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);

  // Handler for importing starter statutory rules
  const handleImportStarterRule = (rule: StarterTemplateRule) => {
    const validCategory: BrandComplianceRule["category"] =
      rule.category === "trademark" ? "trademark" :
      rule.category === "copyright" ? "copyright" :
      rule.category === "accessibility" ? "accessibility" :
      rule.category === "claim_restriction" ? "claim_restriction" :
      rule.category === "disclaimer" ? "disclaimer" : "regulatory";

    const newComp: BrandComplianceRule = {
      id: `comp_${Date.now()}`,
      category: validCategory,
      title: rule.rule_name,
      rule_text: rule.description,
      requirement_level: rule.priority_level <= 2 ? "mandatory" : "advisory",
    };
    setData((prev) => ({
      ...prev,
      compliance: [...(prev.compliance || []), newComp],
    }));
    setSaveFeedback(`Imported verified statutory template: "${rule.rule_name}"`);
    setTimeout(() => setSaveFeedback(null), 4000);
  };

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
      <div className="bg-surface p-6 rounded-xl border border-border shadow-subtle shadow-xl relative">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-border">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/10 border border-indigo-500/30 text-teal flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Manager Workspace
              </span>

              {initialProfile.status === "published" && !hasUnsavedChanges ? (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-950/80 border border-emerald-800/60 text-emerald-400 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Published Active
                </span>
              ) : initialProfile.status === "submitted" ? (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-950/80 border border-purple-800/60 text-purple-700 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Pending Legal Review
                </span>
              ) : initialProfile.status === "approved" ? (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-cyan-950/80 border border-cyan-800/60 text-teal flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Approved by Legal
                </span>
              ) : initialProfile.status === "changes_requested" ? (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-950/80 border border-rose-800/60 text-rose-300 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Changes Requested
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-950/80 border border-amber-800/60 text-amber-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {hasUnsavedChanges ? "Changes Pending" : "Draft Mode"}
                </span>
              )}

              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-workspace text-ink-secondary border border-border">
                v{initialProfile.version}
              </span>

              {initialProfile.jurisdiction && (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-workspace border border-border text-ink-secondary flex items-center gap-1">
                  <Globe className="w-3 h-3 text-cyan-400" />
                  {initialProfile.jurisdiction}
                </span>
              )}

              {initialProfile.industry && (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-workspace border border-border text-ink-secondary flex items-center gap-1">
                  <Building className="w-3 h-3 text-amber-400" />
                  {initialProfile.industry}
                </span>
              )}
            </div>

            <h1 className="text-2xl lg:text-3xl font-bold text-navy tracking-tight">
              Brand Guidelines Governance System
            </h1>
            <p className="text-xs lg:text-sm text-ink-muted mt-1 max-w-2xl">
              Define the authoritative brand standards that govern all creative assets, platform placements, and automated AI compliance audits.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowTemplatesModal(true)}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition flex items-center gap-1.5 shadow-sm"
              title="Browse and import verified statutory compliance rule templates"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>Statutory Templates</span>
            </button>

            <button
              onClick={() => setShowConflictModal(true)}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-workspace hover:bg-slate-200 text-ink-primary border border-border transition flex items-center gap-1.5 shadow-sm"
              title="Run 5-tier rule hierarchy and conflict detection"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>Conflict Check</span>
            </button>

            <button
              onClick={() => setShowPreviewModal(true)}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-workspace hover:bg-slate-200 text-ink-primary border border-border transition flex items-center gap-1.5 shadow-sm"
              title="Preview inherited defaults and overrides"
            >
              <Eye className="w-3.5 h-3.5 text-sky-400" />
              <span>Preview</span>
            </button>

            <button
              onClick={() => setShowVersionModal(true)}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-workspace hover:bg-slate-200 text-ink-primary border border-border transition flex items-center gap-1.5 shadow-sm"
              title="Inspect history of published versions"
            >
              <History className="w-3.5 h-3.5 text-teal" />
              <span>History</span>
            </button>

            {hasUnsavedChanges && (
              <button
                onClick={handleRevert}
                className="px-3 py-2 rounded-xl text-xs font-semibold bg-workspace hover:bg-slate-200 text-ink-secondary hover:text-ink-primary border border-border transition flex items-center gap-1"
                title="Discard working changes"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Revert</span>
              </button>
            )}

            <button
              onClick={handleSaveDraft}
              disabled={isSaving}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md ${
                hasUnsavedChanges
                  ? "bg-teal hover:bg-teal-hover text-white shadow-sm"
                  : "bg-workspace hover:bg-slate-200 text-ink-primary border border-border"
              }`}
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? "Saving..." : hasUnsavedChanges ? "Save Draft *" : "Draft Saved"}</span>
            </button>

            {initialProfile.status !== "submitted" && (
              <button
                onClick={() => setShowSubmitReviewModal(true)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 transition flex items-center gap-1.5 shadow-md"
                title="Submit proposed changes to Legal & Compliance Officer"
              >
                <Send className="w-3.5 h-3.5 text-purple-700" />
                <span>Submit Review</span>
              </button>
            )}

            {(isLegalOfficer || initialProfile.status === "submitted") && (
              <button
                onClick={() => setShowLegalReviewModal(true)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-teal/10 hover:bg-teal/20 text-teal border border-teal/30 transition flex items-center gap-1.5 shadow-md"
                title="Review proposed rules, verify evidence citations, and decide"
              >
                <Scale className="w-3.5 h-3.5 text-teal" />
                <span>Legal Review</span>
              </button>
            )}

            <button
              onClick={() => setShowPublishModal(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-teal hover:bg-teal-hover text-white transition flex items-center gap-1.5 shadow-sm"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Publish</span>
            </button>
          </div>
        </div>

        {/* Governance Lifecycle Banners */}
        {initialProfile.status === "changes_requested" && (
          <div className="mt-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-bold text-rose-900 flex items-center gap-2">
                <span>Legal Review Decision: Changes Requested</span>
                {initialProfile.reviewed_by && (
                  <span className="text-[10px] font-normal text-rose-400">
                    by {initialProfile.reviewed_by} {initialProfile.reviewed_at ? `on ${new Date(initialProfile.reviewed_at).toLocaleDateString()}` : ""}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-rose-800 leading-relaxed font-mono">
                &ldquo;{initialProfile.review_rationale || "Please revise the compliance claims and resubmit for legal verification."}&rdquo;
              </p>
            </div>
          </div>
        )}

        {initialProfile.status === "approved" && (
          <div className="mt-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-3">
            <CheckCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-bold text-teal flex items-center gap-2">
                <span>Legal Review Cleared: Approved for Release</span>
                {initialProfile.reviewed_by && (
                  <span className="text-[10px] font-normal text-cyan-400">
                    by {initialProfile.reviewed_by} {initialProfile.reviewed_at ? `on ${new Date(initialProfile.reviewed_at).toLocaleDateString()}` : ""}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-emerald-800 leading-relaxed">
                {initialProfile.review_rationale || "All statutory and claim-verification rules cleared."} Authorized brand managers may now publish this version.
              </p>
            </div>
          </div>
        )}

        {initialProfile.status === "submitted" && (
          <div className="mt-4 p-3.5 rounded-xl bg-purple-50 border border-purple-200 text-xs text-purple-800 flex items-start gap-3">
            <Clock className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-bold text-purple-700 flex items-center gap-2">
                <span>Awaiting Legal &amp; Compliance Officer Verification</span>
                {initialProfile.submitted_by && (
                  <span className="text-[10px] font-normal text-purple-400">
                    submitted by {initialProfile.submitted_by} {initialProfile.submitted_at ? `on ${new Date(initialProfile.submitted_at).toLocaleDateString()}` : ""}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-purple-800 leading-relaxed">
                {initialProfile.submission_notes ? `Scope: "${initialProfile.submission_notes}"` : "This draft is locked awaiting formal compliance officer review."}
              </p>
            </div>
          </div>
        )}

        {/* Status & Feedback Toast */}
        <div className="pt-3 flex flex-wrap items-center justify-between text-xs text-ink-secondary gap-2">
          <div className="flex items-center gap-4">
            <span>
              Last Published:{" "}
              <strong className="text-ink-primary font-medium">
                {initialProfile.published_at
                  ? new Date(initialProfile.published_at).toLocaleString()
                  : "Not yet published"}
              </strong>
            </span>
            {initialProfile.published_by && (
              <span>
                By: <strong className="text-ink-primary font-medium">{initialProfile.published_by}</strong>
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
          <div className="bg-surface p-3 rounded-xl border border-border shadow-subtle sticky top-4 space-y-4">
            {navSections.map((grp, gIdx) => (
              <div key={gIdx} className="space-y-1">
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-ink-muted font-mono">
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
                          ? "bg-teal text-white shadow-sm"
                          : "text-ink-secondary hover:bg-workspace hover:text-ink-primary"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-white" : "text-teal"}`} />
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
            <IdentitySection
              data={data}
              setData={setData}
              addTag={addTag}
              removeTag={removeTag}
            />
          )}

          {/* SECTION A2: Voice & Communication */}
          {activeSection === "voice" && (
            <VoiceSection
              data={data}
              setData={setData}
              addTag={addTag}
              removeTag={removeTag}
            />
          )}

          {/* SECTION A3: Brand Colour System */}
          {activeSection === "colors" && (
            <ColorsSection data={data} setData={setData} />
          )}

          {/* SECTION A4: Typography Guidelines */}
          {activeSection === "typography" && (
            <TypographySection data={data} setData={setData} />
          )}

          {/* SECTION A5: Logo Guidelines */}
          {activeSection === "logos" && <LogosSection data={data} />}

          {/* SECTION A8: Do's and Don'ts */}
          {activeSection === "dodonts" && (
            <DoDontsSection data={data} setData={setData} />
          )}

          {/* SECTION A9: Compliance & Disclaimers */}
          {activeSection === "compliance" && (
            <ComplianceSection data={data} setData={setData} />
          )}

          {/* SECTION A10: Asset Library */}
          {activeSection === "assets" && <AssetsSection data={data} />}

          {/* SECTION B1: Social Media Graphics & Posters */}
          {activeSection === "media_social" && (
            <MediaSocialSection data={data} setData={setData} />
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
            <MediaFallbackSection activeSection={activeSection} />
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

      {/* Governance Lifecycle & Legal Review Modals */}
      {showSubmitReviewModal && (
        <SubmitReviewModal
          currentJurisdiction={initialProfile.jurisdiction || "Global"}
          currentIndustry={initialProfile.industry || "General"}
          onClose={() => setShowSubmitReviewModal(false)}
          onSubmitSuccess={async () => {
            await onRefresh();
          }}
        />
      )}

      {showLegalReviewModal && (
        <LegalReviewModal
          guideline={initialProfile}
          onClose={() => setShowLegalReviewModal(false)}
          onReviewSuccess={async () => {
            await onRefresh();
          }}
        />
      )}

      {showConflictModal && (
        <ConflictCheckModal onClose={() => setShowConflictModal(false)} />
      )}

      {showTemplatesModal && (
        <StarterTemplatesModal
          onClose={() => setShowTemplatesModal(false)}
          onImportRule={handleImportStarterRule}
        />
      )}
    </div>
  );
}
