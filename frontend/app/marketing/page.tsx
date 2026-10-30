"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/services/api";
import { useAuth } from "@/services/auth-context";
import {
  CampaignBriefRequest,
  MarketingAlternative,
  MarketingContentType,
  MarketingChannel,
  DesiredLength,
  MarketingGenerationResponse,
  DraftDetailResponse,
  AuditResult,
  Finding,
} from "@/types";
import {
  Sparkles,
  Send,
  Save,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  Copy,
  Check,
  RotateCcw,
  FileText,
  Clock,
  Layers,
  Edit3,
  ExternalLink,
  ChevronRight,
  Info,
  Wand2,
  Filter,
  RefreshCw,
  Plus,
  BookOpen,
  ArrowRight,
  Sliders,
  AlertCircle,
  HelpCircle,
  Tag,
} from "lucide-react";

export default function MarketingCopilotPage() {
  const { activeRole, activeOrgName } = useAuth();

  // Active top-level mode: "generator" | "editor" | "drafts"
  const [activeView, setActiveView] = useState<"generator" | "editor" | "drafts">("generator");

  // ==========================================
  // Campaign Brief State
  // ==========================================
  const [product, setProduct] = useState("");
  const [objective, setObjective] = useState("");
  const [audience, setAudience] = useState("");
  const [channel, setChannel] = useState<MarketingChannel>("linkedin");
  const [preferredTone, setPreferredTone] = useState("Authoritative & Trustworthy");
  const [desiredLength, setDesiredLength] = useState<DesiredLength>("medium");
  const [callToAction, setCallToAction] = useState("");
  const [contextConstraints, setContextConstraints] = useState("");
  const [supportingReferences, setSupportingReferences] = useState("");
  const [contentType, setContentType] = useState<MarketingContentType>("short_copy");
  const [existingContent, setExistingContent] = useState("");
  const [numAlternatives, setNumAlternatives] = useState<number>(3);

  // Generation Results
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationResponse, setGenerationResponse] = useState<MarketingGenerationResponse | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // ==========================================
  // Active Draft & Editor State
  // ==========================================
  const [activeDraft, setActiveDraft] = useState<DraftDetailResponse | null>(null);
  const [editorTitle, setEditorTitle] = useState("");
  const [editorText, setEditorText] = useState("");
  const [changeSummary, setChangeSummary] = useState("");
  const [isSavingRevision, setIsSavingRevision] = useState(false);
  const [isSubmittingApproval, setIsSubmittingApproval] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  // ==========================================
  // AI Audit Engine State
  // ==========================================
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
  const [auditError, setAuditError] = useState<string | null>(null);

  // ==========================================
  // Saved Drafts List
  // ==========================================
  const [savedDrafts, setSavedDrafts] = useState<DraftDetailResponse[]>([]);
  const [loadingDrafts, setLoadingDrafts] = useState(false);

  // Copy Feedback State
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Load drafts on mount
  useEffect(() => {
    loadDrafts();
  }, []);

  const loadDrafts = async () => {
    setLoadingDrafts(true);
    try {
      const data = await api.getMarketingDrafts(50, 0);
      setSavedDrafts(data);
    } catch (err: any) {
      console.warn("Unable to load drafts:", err);
    } finally {
      setLoadingDrafts(false);
    }
  };

  // Quick Pre-fill Templates
  const applyTemplate = (templateName: string) => {
    if (templateName === "b2b_launch") {
      setProduct("Inkloom AI Brand Governance Hub");
      setObjective("Announce enterprise general availability to compliance & marketing leaders");
      setAudience("Chief Marketing Officers, General Counsels, and VP Brand Operations");
      setChannel("linkedin");
      setPreferredTone("Authoritative & Visionary");
      setDesiredLength("medium");
      setCallToAction("Schedule a private platform briefing");
      setContentType("short_copy");
      setContextConstraints("Strictly avoid claims of '100% guarantee' or unverified cost savings numbers.");
      setSupportingReferences("Multi-tenant isolation verified, AES-256 encryption at rest, SOC-2 compliant.");
    } else if (templateName === "instagram_campaign") {
      setProduct("Inkloom Creative Studio");
      setObjective("Drive creative designer engagement with automated styleguard rules");
      setAudience("Brand Designers, Creative Directors, and Agency Leads");
      setChannel("instagram");
      setPreferredTone("Bold & Conversational");
      setDesiredLength("short");
      setCallToAction("Swipe up to test your color palette");
      setContentType("caption");
      setContextConstraints("Include required agency disclosure hashtags.");
      setSupportingReferences("Official 2026 digital visual guidelines approved.");
    } else if (templateName === "headline_punchline") {
      setProduct("Inkloom Enterprise AI Suite");
      setObjective("Reflect brand integrity and elimination of legal review delays");
      setAudience("Enterprise Content Strategy Teams");
      setChannel("ad");
      setPreferredTone("Crisp & High-Impact");
      setDesiredLength("short");
      setCallToAction("Explore verified brand intelligence");
      setContentType("headline");
      setContextConstraints("No aggressive competitor attacks or superlative 'cheapest' claims.");
      setSupportingReferences("Evidence grounded in approved brand taxonomy.");
    } else if (templateName === "rewrite_polish") {
      setProduct("Enterprise Cloud Architecture");
      setObjective("Polish marketing copy to eliminate non-compliant sales guarantees");
      setAudience("Enterprise DevOps Engineers");
      setChannel("website");
      setPreferredTone("Technical & Trustworthy");
      setDesiredLength("medium");
      setContentType("rewrite");
      setExistingContent(
        "Our cheap software will crush your competitors before it is too late with a 100% guaranteed zero downtime promise!"
      );
      setContextConstraints("Remove hype, replace 'cheap', remove uncertified '100% guarantee'.");
    }
  };

  // Handle Generate Submission
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setGenerationError(null);

    const brief: CampaignBriefRequest = {
      product: product || undefined,
      campaign_objective: objective || undefined,
      target_audience: audience || undefined,
      channel,
      preferred_tone: preferredTone || undefined,
      desired_length: desiredLength,
      call_to_action: callToAction || undefined,
      context_constraints: contextConstraints || undefined,
      supporting_references: supportingReferences || undefined,
      content_type: contentType,
      existing_content: existingContent || undefined,
      num_alternatives: numAlternatives,
    };

    try {
      const response = await api.generateMarketingCopy(brief);
      setGenerationResponse(response);
    } catch (err: any) {
      setGenerationError(err?.message || "Generation request failed. Verify brand intelligence connectivity.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Copy to clipboard
  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Select alternative to save as draft
  const handleSaveAlternativeAsDraft = async (alt: MarketingAlternative) => {
    try {
      const draftTitle = `${alt.content_type.toUpperCase()}: ${product || "Campaign Asset"} (${channel})`;
      const saved = await api.saveMarketingDraft({
        title: draftTitle,
        text: alt.text,
        content_type: alt.content_type,
        channel,
        target_audience: alt.target_audience,
        campaign_objective: objective,
        generation_id: generationResponse?.generation_id,
        alternative_id: alt.id,
      });
      setActiveDraft(saved);
      setEditorTitle(saved.title);
      setEditorText(saved.current_text || alt.text);
      setChangeSummary("");
      setAuditResult(null);
      await loadDrafts();
      setSaveSuccessMessage("Alternative saved successfully as an organizational draft!");
      setTimeout(() => setSaveSuccessMessage(null), 3000);
    } catch (err: any) {
      alert(`Failed to save draft: ${err?.message || err}`);
    }
  };

  // Open alternative in Editor Workspace
  const handleOpenInEditor = (alt: MarketingAlternative) => {
    const draftTitle = `${alt.content_type.toUpperCase()}: ${product || "Campaign Asset"}`;
    setEditorTitle(draftTitle);
    setEditorText(alt.text);
    setChangeSummary("");
    setAuditResult(null);
    setActiveView("editor");
  };

  // Save revision for active draft
  const handleSaveRevision = async () => {
    if (!editorText.trim()) return;
    setIsSavingRevision(true);
    setSaveSuccessMessage(null);

    try {
      if (activeDraft) {
        const updated = await api.updateMarketingDraftRevision(activeDraft.id, {
          text: editorText,
          change_summary: changeSummary || "Revised copy in Marketing Gemini AI workspace",
        });
        setActiveDraft(updated);
        setSaveSuccessMessage(`Saved Revision v${updated.version_number} successfully.`);
      } else {
        const saved = await api.saveMarketingDraft({
          title: editorTitle || "Custom Marketing Draft",
          text: editorText,
          content_type: contentType,
          channel,
          target_audience: audience,
          campaign_objective: objective,
        });
        setActiveDraft(saved);
        setSaveSuccessMessage("New draft initialized and saved.");
      }
      await loadDrafts();
      setTimeout(() => setSaveSuccessMessage(null), 3500);
    } catch (err: any) {
      alert(`Failed to save revision: ${err?.message || err}`);
    } finally {
      setIsSavingRevision(false);
    }
  };

  // Trigger Phase 2 AI Audit
  const handleRunAudit = async () => {
    if (!editorText.trim()) return;
    setIsAuditing(true);
    setAuditError(null);

    try {
      let draftToAudit = activeDraft;
      if (!draftToAudit) {
        draftToAudit = await api.saveMarketingDraft({
          title: editorTitle || "Marketing Copy Draft for Audit",
          text: editorText,
          content_type: contentType,
          channel,
        });
        setActiveDraft(draftToAudit);
        await loadDrafts();
      } else if (editorText !== draftToAudit.current_text) {
        draftToAudit = await api.updateMarketingDraftRevision(draftToAudit.id, {
          text: editorText,
          change_summary: "Pre-audit edits",
        });
        setActiveDraft(draftToAudit);
        await loadDrafts();
      }

      const res = await api.auditMarketingDraft(draftToAudit.id, draftToAudit.current_revision_id);
      setAuditResult(res);
    } catch (err: any) {
      setAuditError(err?.message || "Audit engine execution failed.");
    } finally {
      setIsAuditing(false);
    }
  };

  // Apply suggested correction directly into editor
  const handleApplyCorrection = (finding: Finding) => {
    if (!finding.suggested_correction?.replacement_text) return;
    const replacement = finding.suggested_correction.replacement_text;
    const original = finding.evidence || finding.original_text;

    if (original && editorText.includes(original)) {
      setEditorText(editorText.replace(original, replacement));
    } else {
      setEditorText((prev) => `${prev}\n\n[Applied Suggestion: ${replacement}]`);
    }

    setChangeSummary(`Applied AI correction for '${finding.title}'`);
    setSaveSuccessMessage(`Applied correction: "${replacement}"`);
    setTimeout(() => setSaveSuccessMessage(null), 3000);
  };

  // Submit draft to Human Approval Review Queue
  const handleSubmitForApproval = async () => {
    if (!activeDraft) return;
    setIsSubmittingApproval(true);
    try {
      const submitted = await api.submitMarketingDraft(activeDraft.id);
      setActiveDraft(submitted);
      await loadDrafts();
      setSaveSuccessMessage("Draft successfully queued for authorized human review!");
      setTimeout(() => setSaveSuccessMessage(null), 4000);
    } catch (err: any) {
      alert(`Failed to submit draft: ${err?.message || err}`);
    } finally {
      setIsSubmittingApproval(false);
    }
  };

  // Select a draft from the saved drafts list
  const handleSelectDraft = (d: DraftDetailResponse) => {
    setActiveDraft(d);
    setEditorTitle(d.title);
    setEditorText(d.current_text || "");
    setChangeSummary("");
    setAuditResult(null);
    setActiveView("editor");
  };

  return (
    <div className="flex flex-col h-full bg-workspace text-ink-primary overflow-hidden">
      {/* Top Banner Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 bg-surface border-b border-border shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-navy-900 flex items-center justify-center text-white shadow-md">
            <Sparkles className="w-5 h-5 text-teal-200" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-ink-primary tracking-tight">Marketing Gemini AI</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/10 text-teal border border-teal-500/20">
                Phase 3 Enterprise
              </span>
            </div>
            <p className="text-xs text-ink-secondary">
              Brand-aware creative generation grounded in shared intelligence and Phase 2 AI audit verification.
            </p>
          </div>
        </div>

        {/* View Switcher Pills */}
        <div className="flex items-center p-1 rounded-xl bg-workspace border border-border shadow-inner">
          <button
            onClick={() => setActiveView("generator")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeView === "generator"
                ? "bg-teal text-white shadow"
                : "text-ink-secondary hover:text-ink-primary hover:bg-surface"
            }`}
          >
            <Wand2 className="w-3.5 h-3.5" />
            Creative Generator
          </button>
          <button
            onClick={() => setActiveView("editor")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeView === "editor"
                ? "bg-teal text-white shadow"
                : "text-ink-secondary hover:text-ink-primary hover:bg-surface"
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            Draft Workspace & Audit
            {activeDraft && (
              <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-white text-teal font-bold">
                v{activeDraft.version_number}
              </span>
            )}
          </button>
          <button
            onClick={() => {
              setActiveView("drafts");
              loadDrafts();
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeView === "drafts"
                ? "bg-teal text-white shadow"
                : "text-ink-secondary hover:text-ink-primary hover:bg-surface"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Saved Drafts
            <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-surface-accent text-ink-secondary font-bold border border-border">
              {savedDrafts.length}
            </span>
          </button>
        </div>
      </div>

      {/* Global Success / Alert Toast */}
      {saveSuccessMessage && (
        <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-6 py-2.5 flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400 font-medium">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>{saveSuccessMessage}</span>
          </div>
        </div>
      )}

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* ========================================================= */}
        {/* VIEW 1: CREATIVE GENERATOR                                 */}
        {/* ========================================================= */}
        {activeView === "generator" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl mx-auto">
            {/* Left 5 Cols: Campaign Brief Builder */}
            <div className="lg:col-span-5 bg-surface border border-border rounded-2xl p-5 shadow-sm flex flex-col gap-4">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-teal" />
                  <h2 className="text-sm font-bold text-ink-primary">Campaign Brief</h2>
                </div>
                <div className="text-[11px] text-ink-muted">Partial input supported</div>
              </div>

              {/* Quick Template Starters */}
              <div>
                <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider block mb-1.5">
                  Quick Starters
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => applyTemplate("b2b_launch")}
                    className="text-[11px] px-2.5 py-1 rounded-md bg-surface-accent hover:bg-surface-elevated text-ink-secondary border border-border transition"
                  >
                    🚀 B2B Launch
                  </button>
                  <button
                    type="button"
                    onClick={() => applyTemplate("instagram_campaign")}
                    className="text-[11px] px-2.5 py-1 rounded-md bg-surface-accent hover:bg-surface-elevated text-ink-secondary border border-border transition"
                  >
                    📸 Instagram Reel
                  </button>
                  <button
                    type="button"
                    onClick={() => applyTemplate("headline_punchline")}
                    className="text-[11px] px-2.5 py-1 rounded-md bg-surface-accent hover:bg-surface-elevated text-ink-secondary border border-border transition"
                  >
                    ⚡ Ad Headline
                  </button>
                  <button
                    type="button"
                    onClick={() => applyTemplate("rewrite_polish")}
                    className="text-[11px] px-2.5 py-1 rounded-md bg-surface-accent hover:bg-surface-elevated text-ink-secondary border border-border transition"
                  >
                    🛡️ Compliance Rewrite
                  </button>
                </div>
              </div>

              <form onSubmit={handleGenerate} className="flex flex-col gap-3.5 text-xs">
                {/* Product / Service */}
                <div>
                  <label className="font-semibold text-ink-primary block mb-1">Product or Service</label>
                  <input
                    type="text"
                    value={product}
                    onChange={(e) => setProduct(e.target.value)}
                    placeholder="e.g. Inkloom AI Governance Hub"
                    className="w-full px-3 py-2 rounded-lg bg-workspace border border-border focus:outline-none focus:ring-1 focus:ring-teal text-ink-primary"
                  />
                </div>

                {/* Content Type & Channel Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-ink-primary block mb-1">Content Format</label>
                    <select
                      value={contentType}
                      onChange={(e) => setContentType(e.target.value as MarketingContentType)}
                      className="w-full px-2.5 py-2 rounded-lg bg-workspace border border-border focus:outline-none focus:ring-1 focus:ring-teal text-ink-primary"
                    >
                      <option value="short_copy">Short Copy</option>
                      <option value="headline">Headline</option>
                      <option value="punchline">Punchline & Slogan</option>
                      <option value="caption">Social Caption</option>
                      <option value="cta">Call to Action (CTA)</option>
                      <option value="product_description">Product Description</option>
                      <option value="campaign_concept">Campaign Concept</option>
                      <option value="long_copy">Long Copy</option>
                      <option value="rewrite">Rewrite Existing Copy</option>
                      <option value="copy_improvement">Improve Copy</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-ink-primary block mb-1">Channel</label>
                    <select
                      value={channel}
                      onChange={(e) => setChannel(e.target.value as MarketingChannel)}
                      className="w-full px-2.5 py-2 rounded-lg bg-workspace border border-border focus:outline-none focus:ring-1 focus:ring-teal text-ink-primary"
                    >
                      <option value="linkedin">LinkedIn</option>
                      <option value="instagram">Instagram</option>
                      <option value="website">Website / Landing Page</option>
                      <option value="email">Email Campaign</option>
                      <option value="ad">Digital Ad</option>
                      <option value="print">Print & Collateral</option>
                      <option value="general">Multi-Channel General</option>
                    </select>
                  </div>
                </div>

                {/* Campaign Objective */}
                <div>
                  <label className="font-semibold text-ink-primary block mb-1">Campaign Objective</label>
                  <input
                    type="text"
                    value={objective}
                    onChange={(e) => setObjective(e.target.value)}
                    placeholder="e.g. Accelerate enterprise adoption; drive demo sign-ups"
                    className="w-full px-3 py-2 rounded-lg bg-workspace border border-border focus:outline-none focus:ring-1 focus:ring-teal text-ink-primary"
                  />
                </div>

                {/* Target Audience */}
                <div>
                  <label className="font-semibold text-ink-primary block mb-1">Target Audience</label>
                  <input
                    type="text"
                    value={audience}
                    onChange={(e) => setAudience(e.target.value)}
                    placeholder="e.g. Compliance Officers, IT Architects, Marketing Leads"
                    className="w-full px-3 py-2 rounded-lg bg-workspace border border-border focus:outline-none focus:ring-1 focus:ring-teal text-ink-primary"
                  />
                </div>

                {/* Tone & Length */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-ink-primary block mb-1">Preferred Brand Tone</label>
                    <select
                      value={preferredTone}
                      onChange={(e) => setPreferredTone(e.target.value)}
                      className="w-full px-2.5 py-2 rounded-lg bg-workspace border border-border focus:outline-none focus:ring-1 focus:ring-teal text-ink-primary"
                    >
                      <option value="Authoritative & Trustworthy">Authoritative & Trustworthy</option>
                      <option value="Bold & Visionary">Bold & Visionary</option>
                      <option value="Warm & Conversational">Warm & Conversational</option>
                      <option value="Technical & Precise">Technical & Precise</option>
                      <option value="Crisp & Minimal">Crisp & Minimal</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-ink-primary block mb-1">Desired Length</label>
                    <div className="flex rounded-lg bg-workspace border border-border p-0.5">
                      {(["short", "medium", "long"] as DesiredLength[]).map((len) => (
                        <button
                          key={len}
                          type="button"
                          onClick={() => setDesiredLength(len)}
                          className={`flex-1 py-1 rounded text-center text-[11px] font-semibold capitalize transition ${
                            desiredLength === len ? "bg-teal text-white shadow-sm" : "text-ink-secondary hover:text-ink-primary"
                          }`}
                        >
                          {len}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Call to Action */}
                <div>
                  <label className="font-semibold text-ink-primary block mb-1">Call to Action (CTA)</label>
                  <input
                    type="text"
                    value={callToAction}
                    onChange={(e) => setCallToAction(e.target.value)}
                    placeholder="e.g. Schedule a platform demo"
                    className="w-full px-3 py-2 rounded-lg bg-workspace border border-border focus:outline-none focus:ring-1 focus:ring-teal text-ink-primary"
                  />
                </div>

                {/* Existing Copy (For Rewrites / Improvements) */}
                {(contentType === "rewrite" || contentType === "copy_improvement") && (
                  <div>
                    <label className="font-semibold text-ink-primary block mb-1">
                      Existing Draft to Polish / Rewrite
                    </label>
                    <textarea
                      rows={3}
                      value={existingContent}
                      onChange={(e) => setExistingContent(e.target.value)}
                      placeholder="Paste your draft here to align with approved voice and remove prohibited phrases..."
                      className="w-full px-3 py-2 rounded-lg bg-workspace border border-border focus:outline-none focus:ring-1 focus:ring-teal text-ink-primary font-mono text-[11px]"
                    />
                  </div>
                )}

                {/* Campaign Constraints & Verified Facts */}
                <div className="grid grid-cols-1 gap-2.5">
                  <div>
                    <label className="font-semibold text-ink-primary block mb-1">
                      Constraints & Guidelines
                    </label>
                    <textarea
                      rows={2}
                      value={contextConstraints}
                      onChange={(e) => setContextConstraints(e.target.value)}
                      placeholder="e.g. Avoid unverified price commitments; adhere to ISO-27001 naming."
                      className="w-full px-3 py-2 rounded-lg bg-workspace border border-border focus:outline-none focus:ring-1 focus:ring-teal text-ink-primary text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-ink-primary block mb-1">
                      Supporting Facts or Notes
                    </label>
                    <input
                      type="text"
                      value={supportingReferences}
                      onChange={(e) => setSupportingReferences(e.target.value)}
                      placeholder="e.g. Multi-tenant certified, 24/7 audit ledger."
                      className="w-full px-3 py-2 rounded-lg bg-workspace border border-border focus:outline-none focus:ring-1 focus:ring-teal text-ink-primary text-xs"
                    />
                  </div>
                </div>

                {/* Submit Action */}
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-teal text-white font-semibold text-xs shadow-md hover:bg-teal-600 active:scale-[0.99] transition disabled:opacity-50"
                >
                  {isGenerating ? (
                    <>
                      <RotateCcw className="w-4 h-4 animate-spin" />
                      Retrieving Brand Rules & Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-teal-200" />
                      Generate Brand-Aware Copy
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Right 7 Cols: Generated Alternatives & Brand Context */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              {/* Brand Context Indicator */}
              {generationResponse?.brand_context && (
                <div className="p-4 rounded-xl bg-surface border border-border shadow-sm text-xs flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold flex items-center gap-1.5 text-teal">
                      <ShieldCheck className="w-4 h-4" />
                      Brand Intelligence Context Verified
                    </span>
                    <span className="text-[10px] text-ink-muted uppercase tracking-wider font-semibold">
                      Tenant: {activeOrgName || "Primary Org"}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {generationResponse.brand_context.applicable_rule_names.slice(0, 4).map((rule, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-teal-500/10 text-teal border border-teal-500/20"
                      >
                        ✓ {rule}
                      </span>
                    ))}
                    {generationResponse.brand_context.verified_claim_keys.slice(0, 3).map((claim, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                      >
                        Verified: {claim}
                      </span>
                    ))}
                  </div>

                  {generationResponse.brand_context.unverified_requested_claims.length > 0 && (
                    <div className="flex items-center gap-1.5 text-[11px] text-amber-600 dark:text-amber-400 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20 mt-1">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                      <span>
                        Conservative alternatives generated: Unverified claims flagged:{" "}
                        <strong>{generationResponse.brand_context.unverified_requested_claims.join(", ")}</strong>.
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Error Message */}
              {generationError && (
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span>{generationError}</span>
                </div>
              )}

              {/* Empty State before Generation */}
              {!generationResponse && !isGenerating && (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center rounded-2xl bg-surface border border-dashed border-border text-ink-muted">
                  <div className="w-14 h-14 rounded-2xl bg-surface-accent flex items-center justify-center mb-3 text-teal">
                    <Sparkles className="w-7 h-7" />
                  </div>
                  <h3 className="text-sm font-bold text-ink-primary mb-1">Your Creative Workspace is Ready</h3>
                  <p className="text-xs text-ink-secondary max-w-sm mb-4">
                    Configure your campaign brief on the left or select a quick starter to generate brand-grounded
                    headlines, captions, and copy variations.
                  </p>
                  <button
                    onClick={() => applyTemplate("b2b_launch")}
                    className="px-4 py-2 rounded-lg bg-teal text-white text-xs font-semibold shadow hover:bg-teal-600 transition"
                  >
                    Load Sample B2B Campaign
                  </button>
                </div>
              )}

              {/* Loading Skeleton */}
              {isGenerating && (
                <div className="flex flex-col gap-4">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="p-5 rounded-2xl bg-surface border border-border animate-pulse flex flex-col gap-3">
                      <div className="h-4 w-1/3 bg-surface-accent rounded" />
                      <div className="h-14 w-full bg-surface-accent rounded-lg" />
                      <div className="h-4 w-2/3 bg-surface-accent rounded" />
                    </div>
                  ))}
                </div>
              )}

              {/* Generated Alternatives Cards */}
              {generationResponse && !isGenerating && (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between text-xs text-ink-secondary px-1">
                    <span>
                      Generated <strong>{generationResponse.alternatives.length}</strong> creative alternatives
                    </span>
                    <span className="text-[11px] font-mono text-ink-muted">
                      Prompt v{generationResponse.prompt_version}
                    </span>
                  </div>

                  {generationResponse.alternatives.map((alt, idx) => (
                    <div
                      key={alt.id}
                      className="bg-surface border border-border hover:border-teal/50 rounded-2xl p-5 shadow-sm transition flex flex-col gap-3.5 relative group"
                    >
                      {/* Alternative Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-teal text-white text-[11px] font-bold flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <span className="text-xs font-bold text-ink-primary uppercase tracking-wider">
                            Option {idx + 1} • {alt.target_channel}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-surface-accent text-ink-secondary border border-border">
                            {alt.content_type}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                            Un-audited Draft
                          </span>
                        </div>
                      </div>

                      {/* Copy Content */}
                      <div className="p-4 rounded-xl bg-workspace border border-border/80 text-ink-primary text-sm font-medium leading-relaxed whitespace-pre-wrap select-text">
                        {alt.text}
                      </div>

                      {/* Creative Rationale & Brand Alignment */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                        <div className="p-2.5 rounded-lg bg-surface-accent text-ink-secondary flex flex-col gap-0.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-teal">
                            Creative Angle
                          </span>
                          <span>{alt.creative_rationale}</span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-surface-accent text-ink-secondary flex flex-col gap-0.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-teal">
                            Tone & Persona
                          </span>
                          <span>{alt.brand_tone_alignment}</span>
                        </div>
                      </div>

                      {/* Assumptions or Compliance Warnings */}
                      {(alt.assumptions.length > 0 || alt.compliance_warnings.length > 0) && (
                        <div className="flex flex-col gap-1 text-[11px] text-ink-secondary bg-surface-accent/50 p-2.5 rounded-lg border border-border/50">
                          {alt.assumptions.map((assump, i) => (
                            <div key={i} className="flex items-center gap-1.5 text-ink-muted">
                              <Info className="w-3.5 h-3.5 text-teal flex-shrink-0" />
                              <span>{assump}</span>
                            </div>
                          ))}
                          {alt.compliance_warnings.map((warn, i) => (
                            <div key={i} className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                              <span>{warn}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Action Bar */}
                      <div className="flex items-center justify-between pt-2 border-t border-border mt-1">
                        <div className="text-[10px] text-ink-muted">
                          Expected impact: Qualitative hypothesis based on verified pillars
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleCopyText(alt.text, alt.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-accent hover:bg-surface-elevated text-ink-primary text-xs font-semibold border border-border transition"
                          >
                            {copiedId === alt.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                                Copied!
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                Copy
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenInEditor(alt)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-accent hover:bg-surface-elevated text-teal text-xs font-semibold border border-teal-500/30 transition"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            Edit in Workspace
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSaveAlternativeAsDraft(alt)}
                            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-teal text-white text-xs font-semibold shadow hover:bg-teal-600 transition"
                          >
                            <Save className="w-3.5 h-3.5" />
                            Save as Draft
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 2: DRAFT WORKSPACE & REAL AI AUDIT ENGINE             */}
        {/* ========================================================= */}
        {activeView === "editor" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl mx-auto">
            {/* Left 7 Cols: Draft Editor & Revision History */}
            <div className="lg:col-span-7 bg-surface border border-border rounded-2xl p-5 shadow-sm flex flex-col gap-4">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-teal" />
                  <h2 className="text-sm font-bold text-ink-primary">Draft Editor & Revision Control</h2>
                </div>
                {activeDraft && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-500/10 text-teal border border-teal-500/20">
                    Draft v{activeDraft.version_number} • Status: {activeDraft.status}
                  </span>
                )}
              </div>

              {/* Title & Metadata */}
              <div>
                <label className="text-xs font-semibold text-ink-primary block mb-1">Draft Title</label>
                <input
                  type="text"
                  value={editorTitle}
                  onChange={(e) => setEditorTitle(e.target.value)}
                  placeholder="Draft Title..."
                  className="w-full px-3 py-2 rounded-lg bg-workspace border border-border focus:outline-none focus:ring-1 focus:ring-teal text-ink-primary text-xs font-semibold"
                />
              </div>

              {/* Copy Editor */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs text-ink-secondary">
                  <label className="font-semibold text-ink-primary">Marketing Copy</label>
                  <span>
                    {editorText.length} characters • {editorText.trim().split(/\s+/).filter(Boolean).length} words
                  </span>
                </div>
                <textarea
                  rows={8}
                  value={editorText}
                  onChange={(e) => setEditorText(e.target.value)}
                  placeholder="Enter or refine your marketing copy here..."
                  className="w-full p-4 rounded-xl bg-workspace border border-border focus:outline-none focus:ring-1 focus:ring-teal text-ink-primary text-sm font-medium leading-relaxed"
                />
              </div>

              {/* Revision Change Summary */}
              <div>
                <label className="text-xs font-semibold text-ink-primary block mb-1">
                  Revision Change Summary (Audit Trail)
                </label>
                <input
                  type="text"
                  value={changeSummary}
                  onChange={(e) => setChangeSummary(e.target.value)}
                  placeholder="e.g. Applied recommended compliance rewrite; adjusted headline tone"
                  className="w-full px-3 py-2 rounded-lg bg-workspace border border-border focus:outline-none focus:ring-1 focus:ring-teal text-ink-primary text-xs"
                />
              </div>

              {/* Action Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border mt-1">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSaveRevision}
                    disabled={isSavingRevision || !editorText.trim()}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-accent hover:bg-surface-elevated text-ink-primary text-xs font-semibold border border-border shadow-sm transition disabled:opacity-50"
                  >
                    {isSavingRevision ? (
                      <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Save className="w-3.5 h-3.5 text-teal" />
                    )}
                    Save Revision
                  </button>

                  <button
                    type="button"
                    onClick={handleRunAudit}
                    disabled={isAuditing || !editorText.trim()}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal text-white text-xs font-semibold shadow hover:bg-teal-600 transition disabled:opacity-50"
                  >
                    {isAuditing ? (
                      <>
                        <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                        Running AI Audit Engine...
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Run AI Brand Audit
                      </>
                    )}
                  </button>
                </div>

                {activeDraft && activeDraft.status !== "approved" && (
                  <button
                    type="button"
                    onClick={handleSubmitForApproval}
                    disabled={isSubmittingApproval}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-navy-900 text-white text-xs font-semibold shadow hover:bg-navy-800 transition disabled:opacity-50"
                  >
                    {isSubmittingApproval ? (
                      <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5 text-teal-300" />
                    )}
                    Submit for Human Review
                  </button>
                )}
              </div>

              {/* Version History List */}
              {activeDraft && activeDraft.revisions.length > 1 && (
                <div className="mt-4 pt-3 border-t border-border">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-ink-muted block mb-2">
                    Revision History ({activeDraft.revisions.length} versions)
                  </span>
                  <div className="flex flex-col gap-2 max-h-40 overflow-y-auto">
                    {activeDraft.revisions.map((rev) => (
                      <div
                        key={rev.id}
                        className={`flex items-center justify-between p-2.5 rounded-lg border text-xs transition ${
                          rev.id === activeDraft.current_revision_id
                            ? "bg-teal-500/10 border-teal-500/30 text-teal"
                            : "bg-surface-accent border-border text-ink-secondary hover:bg-surface-elevated"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-bold">v{rev.version_number}</span>
                          <span className="text-[11px] text-ink-muted">
                            {rev.created_at ? new Date(rev.created_at).toLocaleTimeString() : ""}
                          </span>
                          {rev.media_metadata?.change_summary && (
                            <span className="text-[11px] italic text-ink-secondary">
                              — {rev.media_metadata.change_summary}
                            </span>
                          )}
                        </div>
                        {rev.id !== activeDraft.current_revision_id && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditorText(rev.raw_text || "");
                              setChangeSummary(`Restored from v${rev.version_number}`);
                            }}
                            className="text-[11px] font-semibold text-teal hover:underline"
                          >
                            Load Copy
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right 5 Cols: Real AI Audit Findings */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              <div className="bg-surface border border-border rounded-2xl p-5 shadow-sm flex flex-col gap-4">
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-teal" />
                    <h2 className="text-sm font-bold text-ink-primary">Phase 2 AI Audit Findings</h2>
                  </div>
                  {auditResult && (
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold capitalize ${
                        auditResult.overall_status === "compliant"
                          ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                          : auditResult.overall_status === "needs_review"
                          ? "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                          : "bg-rose-500/10 text-rose-600 border border-rose-500/20"
                      }`}
                    >
                      {auditResult.overall_status.replace("_", " ")}
                    </span>
                  )}
                </div>

                {auditError && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{auditError}</span>
                  </div>
                )}

                {/* Empty State before Running Audit */}
                {!auditResult && !isAuditing && (
                  <div className="p-8 text-center rounded-xl bg-workspace border border-dashed border-border text-ink-muted text-xs flex flex-col items-center">
                    <ShieldAlert className="w-10 h-10 text-teal mb-2" />
                    <h3 className="font-bold text-ink-primary mb-1">No Active Audit Performed</h3>
                    <p className="max-w-xs text-ink-secondary mb-4">
                      Click <strong>"Run AI Brand Audit"</strong> to evaluate the exact draft copy against active brand
                      rules, terminology standards, and required disclosures.
                    </p>
                    <button
                      type="button"
                      onClick={handleRunAudit}
                      disabled={!editorText.trim()}
                      className="px-4 py-2 rounded-lg bg-teal text-white font-semibold text-xs shadow hover:bg-teal-600 transition disabled:opacity-50"
                    >
                      Run AI Brand Audit
                    </button>
                  </div>
                )}

                {/* Loading State during Audit */}
                {isAuditing && (
                  <div className="p-8 text-center rounded-xl bg-workspace border border-border flex flex-col items-center gap-3">
                    <RotateCcw className="w-8 h-8 text-teal animate-spin" />
                    <div className="text-xs font-bold text-ink-primary">Evaluating against Brand Governance Guidelines...</div>
                    <div className="text-[11px] text-ink-muted">
                      Checking tone, terminology, claim verification, and regulatory rules.
                    </div>
                  </div>
                )}

                {/* Audit Result Overview & Findings Cards */}
                {auditResult && !isAuditing && (
                  <div className="flex flex-col gap-3.5">
                    {/* Score Bar */}
                    <div className="p-3.5 rounded-xl bg-surface-accent border border-border flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-ink-muted block">Compliance Score</span>
                        <span className="text-base font-extrabold text-ink-primary">
                          {auditResult.summary.compliance_score.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-right">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-ink-muted block">Findings</span>
                          <span className="font-bold text-ink-primary">{auditResult.findings.length} detected</span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-ink-muted block">Sign-off</span>
                          <span className="font-bold text-amber-600 dark:text-amber-400">Human Required</span>
                        </div>
                      </div>
                    </div>

                    {/* Summary Verdict */}
                    <p className="text-xs text-ink-secondary leading-relaxed bg-workspace p-3 rounded-lg border border-border">
                      {auditResult.summary.verdict_overview}
                    </p>

                    {/* Findings List */}
                    <div className="flex flex-col gap-3 max-h-[500px] overflow-y-auto pr-1">
                      {auditResult.findings.length === 0 ? (
                        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                          <span>No guideline violations detected in this revision.</span>
                        </div>
                      ) : (
                        auditResult.findings.map((f) => (
                          <div
                            key={f.id}
                            className={`p-3.5 rounded-xl border text-xs flex flex-col gap-2 ${
                              f.severity === "critical"
                                ? "bg-rose-500/5 border-rose-500/30"
                                : f.severity === "high"
                                ? "bg-amber-500/5 border-amber-500/30"
                                : "bg-surface-accent border-border"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-ink-primary">{f.title}</span>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                  f.severity === "critical"
                                    ? "bg-rose-500/20 text-rose-600"
                                    : f.severity === "high"
                                    ? "bg-amber-500/20 text-amber-600"
                                    : "bg-surface-elevated text-ink-secondary"
                                }`}
                              >
                                {f.severity}
                              </span>
                            </div>

                            <p className="text-ink-secondary leading-relaxed">{f.message}</p>

                            {f.evidence && (
                              <div className="p-2 rounded bg-workspace border border-border font-mono text-[11px] text-ink-primary">
                                Flagged: "{f.evidence}"
                              </div>
                            )}

                            {f.source_reference && (
                              <div className="flex items-center gap-1.5 text-[11px] text-ink-muted">
                                <BookOpen className="w-3.5 h-3.5 text-teal" />
                                <span>Rule: {f.source_reference.rule_name}</span>
                              </div>
                            )}

                            {/* Suggested Correction */}
                            {f.suggested_correction?.replacement_text && (
                              <div className="mt-1 p-2.5 rounded-lg bg-teal-500/10 border border-teal-500/20 flex flex-col gap-1.5">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-teal">
                                    Suggested Correction
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleApplyCorrection(f)}
                                    className="px-2.5 py-1 rounded bg-teal text-white text-[11px] font-semibold hover:bg-teal-600 transition"
                                  >
                                    Apply Correction
                                  </button>
                                </div>
                                <div className="font-medium text-ink-primary">
                                  "{f.suggested_correction.replacement_text}"
                                </div>
                                <div className="text-[11px] text-ink-secondary italic">
                                  Rationale: {f.suggested_correction.rationale}
                                </div>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 3: SAVED DRAFTS DIRECTORY                             */}
        {/* ========================================================= */}
        {activeView === "drafts" && (
          <div className="max-w-6xl mx-auto flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-ink-primary">Saved Marketing Drafts</h2>
                <p className="text-xs text-ink-secondary">
                  Persistent drafts for {activeOrgName || "Your Organization"}. Click any draft to inspect or re-audit.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveDraft(null);
                  setEditorTitle("New Campaign Draft");
                  setEditorText("");
                  setChangeSummary("");
                  setActiveView("editor");
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal text-white text-xs font-semibold shadow hover:bg-teal-600 transition"
              >
                <Plus className="w-4 h-4" />
                Create New Draft
              </button>
            </div>

            {loadingDrafts ? (
              <div className="p-12 text-center text-xs text-ink-muted">Loading drafts...</div>
            ) : savedDrafts.length === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-surface border border-dashed border-border text-ink-muted text-xs">
                No drafts found. Use the <strong>Creative Generator</strong> to create and save marketing assets.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {savedDrafts.map((d) => (
                  <div
                    key={d.id}
                    onClick={() => handleSelectDraft(d)}
                    className="p-4 rounded-xl bg-surface border border-border hover:border-teal/50 shadow-sm hover:shadow transition cursor-pointer flex flex-col justify-between gap-3 group"
                  >
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-surface-accent text-ink-secondary border border-border">
                          {d.content_type}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                            d.status === "approved"
                              ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                              : d.status === "submitted"
                              ? "bg-navy-900/10 text-navy-900 dark:text-teal border border-navy-900/20"
                              : "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                          }`}
                        >
                          {d.status}
                        </span>
                      </div>
                      <h3 className="text-xs font-bold text-ink-primary group-hover:text-teal transition line-clamp-1">
                        {d.title}
                      </h3>
                      <p className="text-xs text-ink-secondary line-clamp-3 leading-relaxed">
                        {d.current_text || "No text content recorded."}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-border text-[11px] text-ink-muted">
                      <span>v{d.version_number} • {d.revisions.length} revisions</span>
                      <span className="flex items-center gap-1 text-teal font-semibold group-hover:translate-x-0.5 transition">
                        Open <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
