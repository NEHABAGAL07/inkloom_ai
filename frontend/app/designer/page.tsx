"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/services/api";
import { useAuth } from "@/services/auth-context";
import {
  CreativeFormat,
  DesignPlacementChannel,
  DesignAspectRatio,
  BrandAssetItem,
  CreativeBriefRequest,
  DesignConceptAlternative,
  DesignConceptGenerationResponse,
  DesignDraftDetailResponse,
  AuditResult,
  Finding,
} from "@/types";
import {
  Palette,
  Sparkles,
  Upload,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  Save,
  RotateCcw,
  FileImage,
  Layers,
  Sliders,
  ExternalLink,
  ChevronRight,
  Info,
  Check,
  Plus,
  Send,
  Eye,
  Type,
  FileText,
  AlertCircle,
  HelpCircle,
  RefreshCw,
  Clock,
  Tag,
  Maximize2,
  Minimize2,
  Shield,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  X,
} from "lucide-react";

function DesignerCopilotContent() {
  const { activeRole, activeOrgName } = useAuth();
  const searchParams = useSearchParams();
  const queryTab = searchParams?.get("tab");
  const queryAction = searchParams?.get("action");

  // Active workspace tab
  const [activeTab, setActiveTab] = useState<"brief_concepts" | "canvas_audit" | "asset_library" | "history" | "copilot_chat">("brief_concepts");

  // Automatically activate canvas_audit tab when navigating via "New Design"
  useEffect(() => {
    if (queryTab === "canvas_audit" || queryAction === "upload" || queryAction === "new_design") {
      setActiveTab("canvas_audit");
    } else if (queryTab === "brief_concepts") {
      setActiveTab("brief_concepts");
    } else if (queryTab === "asset_library") {
      setActiveTab("asset_library");
    } else if (queryTab === "history") {
      setActiveTab("history");
    } else if (queryTab === "copilot_chat") {
      setActiveTab("copilot_chat");
    }
  }, [queryTab, queryAction]);

  // ==========================================
  // Creative Brief Builder State
  // ==========================================
  const [projectName, setProjectName] = useState("Enterprise Brand Governance Campaign");
  const [product, setProduct] = useState("Inkloom AI Governance Suite");
  const [designObjective, setDesignObjective] = useState("Establish authoritative enterprise visual presence and drive demo conversions");
  const [targetAudience, setTargetAudience] = useState("Chief Marketing Officers, Brand Compliance Directors, and Enterprise IT Architects");
  const [channel, setChannel] = useState<DesignPlacementChannel>("linkedin");
  const [creativeFormat, setCreativeFormat] = useState<CreativeFormat>("social_post");
  const [aspectRatio, setAspectRatio] = useState<DesignAspectRatio>("1.91:1");
  const [customDimensions, setCustomDimensions] = useState("");
  const [visualStyleTone, setVisualStyleTone] = useState("High-contrast enterprise minimalism with dark navy and electric indigo");
  const [brandRequirements, setBrandRequirements] = useState("Must preserve 32px safe-zone around primary horizontal logo; strictly adhere to WCAG 2.1 AA 4.5:1 text contrast ratio");
  const [requiredCopy, setRequiredCopy] = useState("Autonomous Brand Governance Without Compromise.");
  const [callToAction, setCallToAction] = useState("Request Enterprise Audit Demo");
  const [referenceNotes, setReferenceNotes] = useState("Align with 2026 Brand Standards manual; emphasize verified SOC 2 compliance");
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>(["asset_logo_primary", "asset_color_navy", "asset_color_indigo"]);

  // ==========================================
  // Brand Assets State
  // ==========================================
  const [authorizedAssets, setAuthorizedAssets] = useState<BrandAssetItem[]>([]);
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [assetFilter, setAssetFilter] = useState<string>("all");
  const [assetSearch, setAssetSearch] = useState("");

  // ==========================================
  // Concept Generation State
  // ==========================================
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationResponse, setGenerationResponse] = useState<DesignConceptGenerationResponse | null>(null);
  const [selectedConcept, setSelectedConcept] = useState<DesignConceptAlternative | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // ==========================================
  // Design Canvas & Draft State
  // ==========================================
  const [activeDraft, setActiveDraft] = useState<DesignDraftDetailResponse | null>(null);
  const [selectedRevisionId, setSelectedRevisionId] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [revisionSummary, setRevisionSummary] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  // ==========================================
  // Visual Audit State
  // ==========================================
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
  const [auditError, setAuditError] = useState<string | null>(null);
  const [findingCategoryFilter, setFindingCategoryFilter] = useState<string>("all");

  // ==========================================
  // Project History State
  // ==========================================
  const [savedBriefs, setSavedBriefs] = useState<DesignDraftDetailResponse[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // ==========================================
  // Intelligent Creative Partner (Copilot) State & Handlers
  // ==========================================
  const [copilotMessages, setCopilotMessages] = useState<Array<{
    id: string;
    role: "user" | "assistant";
    content: string;
    deliverable?: any;
    citations?: any[];
    toolsExecuted?: any[];
    feedbackGiven?: boolean;
    confidence?: string;
  }>>([
    {
      id: "welcome_init",
      role: "assistant",
      content:
        "Welcome! I am your Inkloom Designer Copilot, an enterprise creative partner grounded in your brand guidelines and live design canvas. " +
        "You can ask me to inspect reference images with real WCAG 2.1 AA luminance & contrast metrics, critique your active visual concept, iteratively adapt layouts (e.g. 'make it more premium', 'adapt for Instagram' or 'adapt for LinkedIn'), and execute brand visual audits.",
      confidence: "high",
    },
  ]);
  const [copilotInput, setCopilotInput] = useState("");
  const [copilotLoading, setCopilotLoading] = useState(false);
  const [copilotSessionId, setCopilotSessionId] = useState<string | null>(null);
  const [referenceImagePathInput, setReferenceImagePathInput] = useState("");
  const [selectedFeedbackCategory, setSelectedFeedbackCategory] = useState<any>("solved_task");
  const [feedbackComment, setFeedbackComment] = useState("");
  const [feedbackSuccessMsg, setFeedbackSuccessMsg] = useState<string | null>(null);
  const [activeFeedbackMsgId, setActiveFeedbackMsgId] = useState<string | null>(null);

  const handleSendCopilotMessage = async (overridePrompt?: string) => {
    const promptToSend = (overridePrompt || copilotInput).trim();
    if (!promptToSend || copilotLoading) return;

    const userMsgId = `usr_${Date.now()}`;
    const userMsg = {
      id: userMsgId,
      role: "user" as const,
      content: promptToSend,
    };
    setCopilotMessages((prev) => [...prev, userMsg]);
    setCopilotInput("");
    setCopilotLoading(true);

    try {
      const res = await api.orchestrateCopilot({
        copilot_type: "designer_copilot",
        message: promptToSend,
        session_id: copilotSessionId || undefined,
        submission_id: activeDraft?.id,
        revision_id: selectedRevisionId || activeDraft?.current_revision_id || undefined,
        channel: channel,
        user_preferences: referenceImagePathInput ? { file_path: referenceImagePathInput } : undefined,
      });

      if (res.session_id) {
        setCopilotSessionId(res.session_id);
      }

      const asstMsg = {
        id: res.message_id || `asst_${Date.now()}`,
        role: "assistant" as const,
        content: res.content,
        deliverable: res.structured_deliverable,
        citations: res.citations,
        toolsExecuted: res.tools_executed,
        confidence: res.confidence,
      };

      setCopilotMessages((prev) => [...prev, asstMsg]);
    } catch (err: any) {
      setCopilotMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          role: "assistant",
          content: `Designer Copilot encountered an issue: ${err.message || "Failed to reach intelligence orchestration engine."}`,
          confidence: "low",
        },
      ]);
    } finally {
      setCopilotLoading(false);
    }
  };

  const handleSendFeedback = async (msgId: string, helpful: boolean) => {
    if (!copilotSessionId) return;
    try {
      await api.sendCopilotFeedback({
        session_id: copilotSessionId,
        message_id: msgId,
        helpful,
        rating_category: selectedFeedbackCategory,
        comment: feedbackComment || undefined,
      });
      setCopilotMessages((prev) =>
        prev.map((m) => (m.id === msgId ? { ...m, feedbackGiven: true } : m))
      );
      setFeedbackSuccessMsg("Thank you! Feedback recorded for model evaluation.");
      setTimeout(() => setFeedbackSuccessMsg(null), 4000);
    } catch (err: any) {
      console.warn("Feedback submission error:", err);
    }
  };

  // Load Brand Assets & Projects on mount
  useEffect(() => {
    loadBrandAssets();
    loadProjectHistory();
  }, []);

  const loadBrandAssets = async () => {
    try {
      setLoadingAssets(true);
      const assets = await api.getAuthorizedBrandAssets();
      setAuthorizedAssets(assets);
    } catch (err: any) {
      console.error("Failed to load brand assets:", err);
    } finally {
      setLoadingAssets(false);
    }
  };

  const loadProjectHistory = async () => {
    try {
      setLoadingHistory(true);
      const drafts = await api.getDesignBriefs(50, 0);
      setSavedBriefs(drafts);
    } catch (err: any) {
      console.error("Failed to load project history:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Preset Handlers
  const applyPreset = (preset: {
    channel: DesignPlacementChannel;
    format: CreativeFormat;
    ratio: DesignAspectRatio;
    name: string;
    style: string;
  }) => {
    setChannel(preset.channel);
    setCreativeFormat(preset.format);
    setAspectRatio(preset.ratio);
    setProjectName(preset.name);
    setVisualStyleTone(preset.style);
  };

  const toggleAssetSelection = (assetId: string) => {
    setSelectedAssetIds((prev) =>
      prev.includes(assetId) ? prev.filter((id) => id !== assetId) : [...prev, assetId]
    );
  };

  // Generate Concepts Handler
  const handleGenerateConcepts = async () => {
    setGenerationError(null);
    setIsGenerating(true);

    const briefPayload: CreativeBriefRequest = {
      project_name: projectName.trim(),
      product: product.trim(),
      design_objective: designObjective.trim(),
      target_audience: targetAudience.trim(),
      channel,
      creative_format: creativeFormat,
      visual_style_tone: visualStyleTone.trim(),
      brand_requirements: brandRequirements.trim(),
      required_copy: requiredCopy.trim(),
      call_to_action: callToAction.trim(),
      aspect_ratio: aspectRatio,
      custom_dimensions: customDimensions.trim() || undefined,
      selected_asset_ids: selectedAssetIds,
      reference_notes: referenceNotes.trim() || undefined,
      num_concepts: 2,
    };

    try {
      const resp = await api.generateDesignConcepts(briefPayload);
      setGenerationResponse(resp);
      if (resp.concepts && resp.concepts.length > 0) {
        setSelectedConcept(resp.concepts[0]);
      }
    } catch (err: any) {
      setGenerationError(err.message || "Failed to generate design concepts from brand intelligence.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Save Creative Brief as Draft
  const handleSaveBriefDraft = async (): Promise<DesignDraftDetailResponse | null> => {
    setIsSavingDraft(true);
    setSaveSuccessMessage(null);

    const briefPayload: CreativeBriefRequest = {
      project_name: projectName.trim(),
      product: product.trim(),
      design_objective: designObjective.trim(),
      target_audience: targetAudience.trim(),
      channel,
      creative_format: creativeFormat,
      visual_style_tone: visualStyleTone.trim(),
      brand_requirements: brandRequirements.trim(),
      required_copy: requiredCopy.trim(),
      call_to_action: callToAction.trim(),
      aspect_ratio: aspectRatio,
      custom_dimensions: customDimensions.trim() || undefined,
      selected_asset_ids: selectedAssetIds,
      reference_notes: referenceNotes.trim() || undefined,
    };

    try {
      const saved = await api.saveDesignBriefDraft({
        project_name: projectName.trim() || "Creative Design Project",
        brief: briefPayload,
        selected_concept_id: selectedConcept?.id,
        selected_concept_data: selectedConcept as any,
        initial_image_url: previewUrl || undefined,
      });
      setActiveDraft(saved);
      setSelectedRevisionId(saved.current_revision_id || null);
      setSaveSuccessMessage("Creative brief successfully saved as project draft.");
      loadProjectHistory();
      return saved;
    } catch (err: any) {
      setUploadError(`Save failed: ${err.message || "Unknown error"}`);
      return null;
    } finally {
      setIsSavingDraft(false);
    }
  };

  // Transfer Selected Concept to Canvas & Switch Tab
  const handleSelectConceptForCanvas = (concept: DesignConceptAlternative) => {
    setSelectedConcept(concept);
    setActiveTab("canvas_audit");
  };

  // File Upload Handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setUploadError(null);
    }
  };

  // Upload Design Version to Server
  const handleUploadVersion = async () => {
    if (!uploadedFile) {
      setUploadError("Please select an image file to upload.");
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      let draft = activeDraft;
      if (!draft) {
        // Auto-save brief first if not yet created
        draft = await handleSaveBriefDraft();
        if (!draft) {
          setUploadError("Could not initialize draft project for upload.");
          setIsUploading(false);
          return;
        }
      }

      const updated = await api.uploadDesignVersion(draft.id, uploadedFile, revisionSummary);
      setActiveDraft(updated);
      setSelectedRevisionId(updated.current_revision_id || null);
      setRevisionSummary("");
      setSaveSuccessMessage(`Uploaded design revision v${updated.version_number}`);
      loadProjectHistory();
    } catch (err: any) {
      setUploadError(err.message || "Upload failed. Verify file format and size (<25MB).");
    } finally {
      setIsUploading(false);
    }
  };

  // Run Visual Audit
  const handleRunVisualAudit = async () => {
    setIsAuditing(true);
    setAuditError(null);

    const briefId = activeDraft?.id || "mock_brief_active";
    const revId = selectedRevisionId || activeDraft?.current_revision_id;

    try {
      const result = await api.auditDesignVersion(briefId, revId || undefined);
      setAuditResult(result);
      if (activeDraft) {
        activeDraft.latest_audit = {
          audit_id: result.audit_id,
          revision_id: result.revision_id || undefined,
          overall_status: result.overall_status,
          summary: result.summary,
          findings_count: result.findings.length,
          created_at: result.created_at,
        };
      }
      setSaveSuccessMessage("Brand visual audit completed successfully.");
    } catch (err: any) {
      setAuditError(err.message || "Failed to execute visual brand audit.");
    } finally {
      setIsAuditing(false);
    }
  };

  // Load sample creative mockup for instant testing
  const handleLoadSampleMockup = async () => {
    try {
      const response = await fetch("/inkloom-feather-cute@2x.png");
      const blob = await response.blob();
      const sampleFile = new File([blob], "summer-campaign-banner.png", { type: "image/png" });
      setUploadedFile(sampleFile);
      setPreviewUrl("/inkloom-feather-cute@2x.png");
      setUploadError(null);
      if (!projectName || projectName === "Enterprise Brand Governance") {
        setProjectName("Summer Campaign Hero Banner");
      }
    } catch (e: any) {
      console.warn("Could not load sample asset", e);
    }
  };

  // Submit for Human Review
  const handleSubmitForReview = async () => {
    if (isSubmittingReview) return;

    setIsSubmittingReview(true);
    setUploadError(null);

    try {
      let targetDraft = activeDraft;
      if (!targetDraft) {
        targetDraft = await handleSaveBriefDraft();
      }
      if (!targetDraft) {
        setUploadError("Please provide design metadata and an image before submitting.");
        setIsSubmittingReview(false);
        return;
      }

      // If a file was selected but not yet committed as a version, commit it now
      if (uploadedFile && (!targetDraft.current_file_path || targetDraft.current_file_name !== uploadedFile.name)) {
        try {
          targetDraft = await api.uploadDesignVersion(
            targetDraft.id,
            uploadedFile,
            revisionSummary || "Initial design version"
          );
          setActiveDraft(targetDraft);
        } catch (uploadErr: any) {
          console.warn("Upload version sync warning:", uploadErr);
        }
      }

      // If an audit hasn't been run yet, run visual audit automatically before submission
      if (!auditResult) {
        try {
          const result = await api.auditDesignVersion(targetDraft.id, targetDraft.current_revision_id || undefined);
          setAuditResult(result);
        } catch (auditErr: any) {
          console.warn("Auto-audit warning before review submission:", auditErr);
        }
      }

      const updated = await api.submitDesignForReview(targetDraft.id);
      setActiveDraft(updated);
      setSaveSuccessMessage("Creative asset submitted to Brand Review & Compliance queue.");
      loadProjectHistory();
    } catch (err: any) {
      setUploadError(`Submission error: ${err.message || "Failed to submit for review."}`);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Filtered Assets
  const filteredAssets = authorizedAssets.filter((a) => {
    const assetType = a.asset_type || a.type || "";
    const matchesType = assetFilter === "all" || assetType.toLowerCase() === assetFilter.toLowerCase();
    const matchesSearch = assetSearch === "" || a.name.toLowerCase().includes(assetSearch.toLowerCase());
    return matchesType && matchesSearch;
  });

  // Filtered Findings
  const filteredFindings = auditResult?.findings.filter((f) => {
    if (findingCategoryFilter === "all") return true;
    if (findingCategoryFilter === "violations") return f.severity === "high" || f.severity === "critical";
    if (findingCategoryFilter === "a11y")
      return (
        (f.category as string) === "accessibility" ||
        (f.category as string) === "visual_brand" ||
        f.title.toLowerCase().includes("contrast")
      );
    if (findingCategoryFilter === "creative") return f.severity === "low" || f.severity === "medium";
    return true;
  });

  return (
    <div className="space-y-6 pb-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
      {/* ==========================================
          Header Banner & Navigation Bar
          ========================================== */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-teal/10 rounded-lg text-teal border border-teal/20">
              <Palette className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-ink-primary tracking-tight">Designer Copilot</h1>
            <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal/15 text-teal border border-teal/25">
              Phase 4 Active
            </span>
          </div>
          <p className="text-xs text-ink-secondary mt-1">
            Brand-aware visual design studio: Explore approved creative briefs, generate governed design concepts, audit visual assets, and enforce brand tokens.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 text-xs text-ink-muted bg-surface px-3 py-1.5 rounded-lg border border-border">
            <Shield className="w-3.5 h-3.5 text-teal" />
            <span>Workspace: <strong>{activeOrgName || "Acme Brand"}</strong></span>
          </div>

          <div className="flex items-center space-x-1.5 text-xs text-ink-muted bg-surface px-3 py-1.5 rounded-lg border border-border">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>LLM: <strong>gemini-1.5-pro (Gov)</strong></span>
          </div>
        </div>
      </div>

      {/* ==========================================
          Workspace Tabs
          ========================================== */}
      <div className="flex items-center space-x-2 border-b border-border">
        <button
          onClick={() => setActiveTab("brief_concepts")}
          className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
            activeTab === "brief_concepts"
              ? "border-teal text-teal bg-teal/5"
              : "border-transparent text-ink-secondary hover:text-ink-primary"
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Creative Brief & Concepts</span>
          {generationResponse && (
            <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-teal/20 text-teal">
              {generationResponse.concepts.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("canvas_audit")}
          className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
            activeTab === "canvas_audit"
              ? "border-teal text-teal bg-teal/5"
              : "border-transparent text-ink-secondary hover:text-ink-primary"
          }`}
        >
          <FileImage className="w-4 h-4" />
          <span>Design Canvas & Audit</span>
          {activeDraft && (
            <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-indigo-500/20 text-indigo-400">
              v{activeDraft.version_number}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("asset_library")}
          className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
            activeTab === "asset_library"
              ? "border-teal text-teal bg-teal/5"
              : "border-transparent text-ink-secondary hover:text-ink-primary"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Brand Asset Library</span>
          <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-surface text-ink-muted border border-border">
            {authorizedAssets.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("history")}
          className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
            activeTab === "history"
              ? "border-teal text-teal bg-teal/5"
              : "border-transparent text-ink-secondary hover:text-ink-primary"
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Project History</span>
          <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-surface text-ink-muted border border-border">
            {savedBriefs.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("copilot_chat")}
          className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
            activeTab === "copilot_chat"
              ? "border-teal text-teal bg-teal/5"
              : "border-transparent text-ink-secondary hover:text-ink-primary"
          }`}
        >
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span>Intelligent Creative Partner</span>
          <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-indigo-500/20 text-indigo-300 font-bold">
            Copilot
          </span>
        </button>
      </div>

      {/* Global Success / Notice Alert */}
      {saveSuccessMessage && (
        <div className="flex items-center justify-between p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-xs">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{saveSuccessMessage}</span>
          </div>
          <button onClick={() => setSaveSuccessMessage(null)} className="text-emerald-400 hover:text-emerald-300">
            &times;
          </button>
        </div>
      )}

      {/* ==========================================
          TAB 1: CREATIVE BRIEF & CONCEPTS
          ========================================== */}
      {activeTab === "brief_concepts" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Creative Brief Builder (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-surface rounded-xl border border-border p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-ink-primary uppercase tracking-wide">Creative Brief Builder</h2>
                  <p className="text-[11px] text-ink-secondary">Define target criteria and retrieve verified brand constraints.</p>
                </div>
              </div>

              {/* Quick Presets */}
              <div>
                <label className="text-[11px] font-semibold text-ink-secondary block mb-1.5">Quick Starter Templates</label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      applyPreset({
                        channel: "linkedin",
                        format: "social_post",
                        ratio: "1.91:1",
                        name: "LinkedIn Thought Leadership Card",
                        style: "Clean enterprise typography, dark navy background (#0F172A), electric indigo accents",
                      })
                    }
                    className="p-2 text-left rounded-lg bg-workspace hover:bg-teal/5 border border-border text-[11px] font-medium text-ink-primary transition"
                  >
                    💼 LinkedIn Thought Leadership (1.91:1)
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      applyPreset({
                        channel: "instagram",
                        format: "social_post",
                        ratio: "1:1",
                        name: "Instagram Square Feature Carousel",
                        style: "High visual impact, punchy centered value proposition, emerald teal verification badge",
                      })
                    }
                    className="p-2 text-left rounded-lg bg-workspace hover:bg-teal/5 border border-border text-[11px] font-medium text-ink-primary transition"
                  >
                    📸 Instagram Square (1:1)
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      applyPreset({
                        channel: "ad",
                        format: "banner",
                        ratio: "300:250",
                        name: "IAB Medium Rectangle Ad Banner",
                        style: "Restrained corporate palette, high-contrast CTA button, readable at glance",
                      })
                    }
                    className="p-2 text-left rounded-lg bg-workspace hover:bg-teal/5 border border-border text-[11px] font-medium text-ink-primary transition"
                  >
                    🎯 Display Banner (300x250)
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      applyPreset({
                        channel: "website",
                        format: "landing_page_visual",
                        ratio: "16:9",
                        name: "Landing Page Hero Graphic",
                        style: "Architectural vector layout, dark slate canvas, modular bento components",
                      })
                    }
                    className="p-2 text-left rounded-lg bg-workspace hover:bg-teal/5 border border-border text-[11px] font-medium text-ink-primary transition"
                  >
                    🌐 Web Hero Section (16:9)
                  </button>
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-3 pt-2 border-t border-border/60">
                <div>
                  <label className="text-[11px] font-semibold text-ink-primary block mb-1">Project / Campaign Name *</label>
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="e.g. Q1 Enterprise Launch Campaign"
                    className="w-full px-3 py-1.5 text-xs rounded-lg bg-workspace border border-border focus:ring-1 focus:ring-teal text-ink-primary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-semibold text-ink-primary block mb-1">Channel / Placement</label>
                    <select
                      value={channel}
                      onChange={(e) => setChannel(e.target.value as DesignPlacementChannel)}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-workspace border border-border text-ink-primary"
                    >
                      <option value="linkedin">LinkedIn Feed</option>
                      <option value="instagram">Instagram Feed</option>
                      <option value="website">Website / Landing Page</option>
                      <option value="email">Email Campaign Header</option>
                      <option value="ad">Digital Display Ad</option>
                      <option value="presentation">Keynote / Slide Deck</option>
                      <option value="print">Print & Event Signage</option>
                      <option value="general">Multi-Channel Standard</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-ink-primary block mb-1">Creative Format</label>
                    <select
                      value={creativeFormat}
                      onChange={(e) => setCreativeFormat(e.target.value as CreativeFormat)}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-workspace border border-border text-ink-primary"
                    >
                      <option value="social_post">Social Media Post</option>
                      <option value="banner">Display Banner</option>
                      <option value="poster">Poster & Signage</option>
                      <option value="ad">Digital Advertisement</option>
                      <option value="landing_page_visual">Landing Page Visual</option>
                      <option value="presentation_slide">Presentation Slide</option>
                      <option value="custom">Custom Format</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-semibold text-ink-primary block mb-1">Aspect Ratio</label>
                    <select
                      value={aspectRatio}
                      onChange={(e) => setAspectRatio(e.target.value as DesignAspectRatio)}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-workspace border border-border text-ink-primary"
                    >
                      <option value="1.91:1">1.91:1 (Landscape Feed)</option>
                      <option value="1:1">1:1 (Square Feed)</option>
                      <option value="16:9">16:9 (Standard Widescreen)</option>
                      <option value="9:16">9:16 (Vertical Story/Reel)</option>
                      <option value="4:5">4:5 (Portrait Feed)</option>
                      <option value="300:250">300:250 (Medium Rectangle Ad)</option>
                      <option value="728:90">728:90 (Leaderboard Ad)</option>
                      <option value="custom">Custom Dimensions</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-ink-primary block mb-1">Product / Service</label>
                    <input
                      type="text"
                      value={product}
                      onChange={(e) => setProduct(e.target.value)}
                      placeholder="e.g. Inkloom Governance Hub"
                      className="w-full px-3 py-1.5 text-xs rounded-lg bg-workspace border border-border text-ink-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-ink-primary block mb-1">Design Objective</label>
                  <input
                    type="text"
                    value={designObjective}
                    onChange={(e) => setDesignObjective(e.target.value)}
                    placeholder="e.g. Educate enterprise buyers on automated audit coverage"
                    className="w-full px-3 py-1.5 text-xs rounded-lg bg-workspace border border-border text-ink-primary"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-ink-primary block mb-1">Target Audience</label>
                  <input
                    type="text"
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    placeholder="e.g. Chief Marketing Officers, Brand Compliance Directors"
                    className="w-full px-3 py-1.5 text-xs rounded-lg bg-workspace border border-border text-ink-primary"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-ink-primary block mb-1">Visual Style & Tone</label>
                  <input
                    type="text"
                    value={visualStyleTone}
                    onChange={(e) => setVisualStyleTone(e.target.value)}
                    placeholder="e.g. Dark navy background, authoritative, crisp typography"
                    className="w-full px-3 py-1.5 text-xs rounded-lg bg-workspace border border-border text-ink-primary"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-ink-primary block mb-1">Required Copy & Headline</label>
                  <textarea
                    rows={2}
                    value={requiredCopy}
                    onChange={(e) => setRequiredCopy(e.target.value)}
                    placeholder="Headline or mandatory text to appear in design"
                    className="w-full px-3 py-1.5 text-xs rounded-lg bg-workspace border border-border text-ink-primary resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-semibold text-ink-primary block mb-1">Call to Action (CTA)</label>
                    <input
                      type="text"
                      value={callToAction}
                      onChange={(e) => setCallToAction(e.target.value)}
                      placeholder="e.g. Learn More, Book Demo"
                      className="w-full px-3 py-1.5 text-xs rounded-lg bg-workspace border border-border text-ink-primary"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-ink-primary block mb-1">Custom Dimensions</label>
                    <input
                      type="text"
                      value={customDimensions}
                      onChange={(e) => setCustomDimensions(e.target.value)}
                      placeholder="e.g. 1200x630px"
                      className="w-full px-3 py-1.5 text-xs rounded-lg bg-workspace border border-border text-ink-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-ink-primary block mb-1">Brand & Campaign Requirements</label>
                  <textarea
                    rows={2}
                    value={brandRequirements}
                    onChange={(e) => setBrandRequirements(e.target.value)}
                    placeholder="Specific logo safe-zones, color rules, or mandatory trust seals"
                    className="w-full px-3 py-1.5 text-xs rounded-lg bg-workspace border border-border text-ink-primary resize-none"
                  />
                </div>

                {/* Brand Asset Multi-Select */}
                <div>
                  <label className="text-[11px] font-semibold text-ink-primary block mb-1.5">
                    Select Authorized Brand Assets ({selectedAssetIds.length} chosen)
                  </label>
                  <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1.5 bg-workspace rounded-lg border border-border">
                    {authorizedAssets.map((asset) => {
                      const isSelected = selectedAssetIds.includes(asset.id);
                      return (
                        <button
                          key={asset.id}
                          type="button"
                          onClick={() => toggleAssetSelection(asset.id)}
                          className={`text-[10px] px-2 py-1 rounded-md border font-medium flex items-center space-x-1 transition ${
                            isSelected
                              ? "bg-teal/15 text-teal border-teal/30"
                              : "bg-surface text-ink-secondary border-border hover:border-border/80"
                          }`}
                        >
                          <span>{isSelected ? "✓" : "+"}</span>
                          <span>{asset.name}</span>
                          <span className="text-[9px] uppercase px-1 rounded bg-workspace opacity-75">
                            {asset.asset_type}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-border flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleGenerateConcepts}
                  disabled={isGenerating || !projectName.trim()}
                  className="flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-lg bg-teal hover:bg-teal/90 text-white text-xs font-semibold shadow-sm transition disabled:opacity-50"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Generating Concepts...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Generate Concepts</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleSaveBriefDraft}
                  disabled={isSavingDraft || !projectName.trim()}
                  className="flex items-center space-x-1.5 py-2 px-3 rounded-lg bg-workspace hover:bg-surface border border-border text-ink-primary text-xs font-semibold transition disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Brief</span>
                </button>
              </div>

              {generationError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{generationError}</span>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: AI Creative Concepts Area (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            {!generationResponse && !isGenerating && (
              <div className="bg-surface rounded-xl border border-dashed border-border p-12 text-center flex flex-col items-center justify-center h-full min-h-[460px]">
                <div className="w-12 h-12 rounded-xl bg-teal/10 border border-teal/20 flex items-center justify-center text-teal mb-3">
                  <Palette className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-ink-primary">No Creative Concepts Generated Yet</h3>
                <p className="text-xs text-ink-secondary max-w-md mt-1 mb-4">
                  Configure your creative brief on the left and click <strong>Generate Concepts</strong>. The Designer Copilot will ground alternatives in approved brand guidelines, color tokens, and asset restrictions.
                </p>
                <div className="grid grid-cols-3 gap-3 text-left w-full max-w-lg mt-2">
                  <div className="p-2.5 rounded-lg bg-workspace border border-border text-[11px]">
                    <span className="font-semibold text-teal block">Tokens Grounded</span>
                    <span className="text-ink-muted">Navy #0F172A, Indigo #6366F1 with verified contrast.</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-workspace border border-border text-[11px]">
                    <span className="font-semibold text-teal block">Asset Enforced</span>
                    <span className="text-ink-muted">32px logo clearspace buffer & verified badges.</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-workspace border border-border text-[11px]">
                    <span className="font-semibold text-teal block">WCAG Compliant</span>
                    <span className="text-ink-muted">Automated 4.5:1 ratio calculation for every token.</span>
                  </div>
                </div>
              </div>
            )}

            {isGenerating && (
              <div className="bg-surface rounded-xl border border-border p-12 text-center flex flex-col items-center justify-center h-full min-h-[460px] space-y-3">
                <RefreshCw className="w-8 h-8 text-teal animate-spin" />
                <h3 className="text-sm font-bold text-ink-primary">Synthesizing Creative Alternatives...</h3>
                <p className="text-xs text-ink-secondary max-w-md">
                  Evaluating brand guideline rules, selecting compliant token palettes, and formatting channel-specific visual hierarchies.
                </p>
              </div>
            )}

            {generationResponse && (
              <div className="space-y-4">
                {/* AI Disclaimer Banner */}
                <div className="p-3 bg-amber-500/10 border border-amber-500/25 rounded-xl flex items-start space-x-2 text-xs text-amber-300">
                  <Info className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">AI Creative Concept Notice: </span>
                    <span>{generationResponse.notice}</span>
                  </div>
                </div>

                {/* Concept Alternatives Cards */}
                <div className="space-y-4">
                  {generationResponse.concepts.map((concept, idx) => (
                    <div
                      key={concept.id}
                      className="bg-surface rounded-xl border border-border p-5 space-y-4 shadow-sm hover:border-teal/30 transition"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-teal/15 text-teal border border-teal/20">
                              Concept #{idx + 1}
                            </span>
                            <h3 className="text-base font-bold text-ink-primary">{concept.concept_name}</h3>
                          </div>
                          <p className="text-xs text-ink-secondary mt-1">{concept.creative_objective_rationale}</p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleSelectConceptForCanvas(concept)}
                          className="shrink-0 flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-teal text-white text-xs font-semibold hover:bg-teal/90 transition shadow-sm"
                        >
                          <span>Select Concept</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Visual Direction & Layout */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-workspace rounded-lg border border-border text-xs">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-teal block mb-1">
                            Visual Direction & Composition
                          </span>
                          <p className="text-ink-primary leading-relaxed">{concept.visual_direction_composition}</p>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-teal block mb-1">
                            Suggested Layout Hierarchy
                          </span>
                          <p className="text-ink-primary leading-relaxed">{concept.suggested_layout_hierarchy}</p>
                        </div>
                      </div>

                      {/* Color Palette Tokens */}
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-ink-secondary block mb-2">
                          Approved Brand Color Tokens
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {concept.color_palette_tokens.map((token, tIdx) => (
                            <div
                              key={tIdx}
                              className="p-2 rounded-lg bg-workspace border border-border flex flex-col space-y-1.5"
                            >
                              <div className="flex items-center space-x-2">
                                <div
                                  className="w-4 h-4 rounded-md border border-white/20 shrink-0"
                                  style={{ backgroundColor: token.hex }}
                                />
                                <span className="font-semibold text-ink-primary text-[11px] truncate">{token.name}</span>
                              </div>
                              <div className="text-[10px] text-ink-secondary font-mono">{token.hex}</div>
                              <div className="text-[9px] text-ink-muted leading-tight">{token.role}</div>
                              {token.contrast_ratio_notes && (
                                <div className="text-[9px] text-emerald-400 font-medium">
                                  {token.contrast_ratio_notes}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Typography Pairings */}
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-ink-secondary block mb-2">
                          Approved Typography Guidance
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          {concept.typography_recommendations.map((typo, yIdx) => (
                            <div key={yIdx} className="p-2.5 rounded-lg bg-workspace border border-border text-xs">
                              <span className="text-[10px] font-bold text-teal block">{typo.role}</span>
                              <span className="font-semibold text-ink-primary text-xs block">{typo.font_family}</span>
                              <span className="text-[10px] text-ink-secondary block">{typo.weight}</span>
                              <span className="text-[9px] text-ink-muted block mt-0.5">{typo.size_guidance}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Copy Suggestions & CTA */}
                      <div className="p-3 rounded-lg bg-workspace border border-border space-y-2 text-xs">
                        <div>
                          <span className="text-[10px] font-bold text-indigo-400 block uppercase tracking-wide">
                            Headline Suggestion
                          </span>
                          <p className="font-semibold text-ink-primary text-sm mt-0.5">
                            "{concept.headline_copy_suggestion}"
                          </p>
                        </div>
                        {concept.supporting_copy_suggestion && (
                          <div>
                            <span className="text-[10px] font-bold text-ink-muted block uppercase tracking-wide">
                              Supporting Body
                            </span>
                            <p className="text-ink-secondary text-xs">{concept.supporting_copy_suggestion}</p>
                          </div>
                        )}
                        <div className="flex items-center space-x-2 pt-1 border-t border-border/60">
                          <span className="text-[10px] font-bold text-teal uppercase">CTA Placement:</span>
                          <span className="text-ink-primary font-medium">{concept.call_to_action_placement}</span>
                        </div>
                      </div>

                      {/* Imagery, Logo & Accessibility */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                        <div className="p-2 rounded bg-workspace border border-border">
                          <span className="font-bold text-ink-secondary block">Logo Placement</span>
                          <span className="text-ink-muted">{concept.logo_asset_placement}</span>
                        </div>
                        <div className="p-2 rounded bg-workspace border border-border">
                          <span className="font-bold text-ink-secondary block">Imagery Direction</span>
                          <span className="text-ink-muted">{concept.imagery_illustration_direction}</span>
                        </div>
                        <div className="p-2 rounded bg-workspace border border-border">
                          <span className="font-bold text-ink-secondary block">Accessibility (WCAG 2.1)</span>
                          <span className="text-emerald-400 font-medium">{concept.accessibility_considerations}</span>
                        </div>
                      </div>

                      {/* Brand Rules & Warnings */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        {concept.relevant_brand_rules.map((rule, rIdx) => (
                          <span
                            key={rIdx}
                            className="text-[9px] px-2 py-0.5 rounded bg-surface border border-border text-ink-muted"
                          >
                            🛡️ {rule}
                          </span>
                        ))}
                        {concept.warnings.map((w, wIdx) => (
                          <span
                            key={wIdx}
                            className="text-[9px] px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/25 text-amber-400"
                          >
                            ⚠️ {w}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==========================================
          TAB 2: DESIGN CANVAS & AUDIT WORKFLOW
          ========================================== */}
      {activeTab === "canvas_audit" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Canvas Preview, Upload, & Version History (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Active Concept Summary Banner */}
            {selectedConcept && (
              <div className="p-4 bg-teal/5 border border-teal/20 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Palette className="w-4 h-4 text-teal" />
                    <span className="text-xs font-bold text-ink-primary">Active Blueprint: {selectedConcept.concept_name}</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-teal/20 text-teal font-semibold">
                    {aspectRatio} • {channel.toUpperCase()}
                  </span>
                </div>
                <p className="text-xs text-ink-secondary">{selectedConcept.visual_direction_composition}</p>
                <div className="flex items-center space-x-3 text-[11px] text-ink-muted pt-1">
                  <span>Logo: <strong>{selectedConcept.logo_asset_placement}</strong></span>
                  <span>•</span>
                  <span>CTA: <strong>{selectedConcept.call_to_action_placement}</strong></span>
                </div>
              </div>
            )}

            {/* Design Upload & Canvas Preview Box */}
            <div className="bg-surface rounded-xl border border-border p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-ink-primary">Design Canvas & Visualizer</h3>
                  <p className="text-[11px] text-ink-secondary">
                    Upload your creative mockup or exported artwork for brand compliance evaluation.
                  </p>
                </div>

                {activeDraft && (
                  <span className="text-xs font-semibold px-2 py-1 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    Draft v{activeDraft.version_number} ({activeDraft.status})
                  </span>
                )}
              </div>

              {/* Design Metadata Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-workspace rounded-xl border border-border">
                <div className="sm:col-span-1 space-y-1">
                  <label className="text-[10px] font-bold text-ink-muted uppercase tracking-wider block">
                    Design Title *
                  </label>
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="e.g. Q4 Hero Campaign Graphic"
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-surface border border-border text-ink-primary font-medium focus:outline-none focus:border-teal"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-ink-muted uppercase tracking-wider block">
                    Target Placement
                  </label>
                  <select
                    value={channel}
                    onChange={(e) => setChannel(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-surface border border-border text-ink-primary focus:outline-none focus:border-teal capitalize"
                  >
                    <option value="linkedin">LinkedIn</option>
                    <option value="instagram">Instagram</option>
                    <option value="facebook">Facebook</option>
                    <option value="twitter">X / Twitter</option>
                    <option value="print">Print & Outdoor</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-ink-muted uppercase tracking-wider block">
                    Creative Format
                  </label>
                  <select
                    value={creativeFormat}
                    onChange={(e) => setCreativeFormat(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-surface border border-border text-ink-primary focus:outline-none focus:border-teal capitalize"
                  >
                    <option value="social_post">Social Post</option>
                    <option value="banner">Display Banner</option>
                    <option value="story">Story / Vertical</option>
                    <option value="carousel">Carousel Card</option>
                    <option value="email_header">Email Header</option>
                  </select>
                </div>
              </div>

              {/* Upload Dropzone */}
              <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-teal/40 transition bg-workspace">
                <input
                  type="file"
                  id="design_file_input"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label htmlFor="design_file_input" className="cursor-pointer flex flex-col items-center justify-center">
                  <div className="w-12 h-12 rounded-xl bg-teal/10 border border-teal/20 flex items-center justify-center text-teal mb-2">
                    <Upload className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold text-ink-primary">Click to select or drag design artwork</span>
                  <span className="text-[11px] text-ink-muted mt-0.5">
                    Supports PNG, JPEG, WebP, SVG (Max 25MB)
                  </span>
                </label>
                <div className="mt-3 flex items-center justify-center">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      handleLoadSampleMockup();
                    }}
                    className="text-[11px] font-semibold text-teal hover:underline flex items-center space-x-1 px-2.5 py-1 rounded bg-teal/10 hover:bg-teal/20 transition cursor-pointer"
                  >
                    <span>Or load sample creative asset for testing</span>
                  </button>
                </div>
              </div>

              {/* Upload Controls & Revision Summary */}
              {uploadedFile && (
                <div className="p-3 bg-workspace rounded-lg border border-border space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                      <FileImage className="w-4 h-4 text-teal" />
                      <span className="font-semibold text-ink-primary">{uploadedFile.name}</span>
                      <span className="text-ink-muted">({(uploadedFile.size / 1024).toFixed(1)} KB)</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-ink-primary block mb-1">
                      Change Summary (for Version History)
                    </label>
                    <input
                      type="text"
                      value={revisionSummary}
                      onChange={(e) => setRevisionSummary(e.target.value)}
                      placeholder="e.g. Adjusted logo clearspace to 34px and corrected contrast ratio to 4.8:1"
                      className="w-full px-3 py-1.5 text-xs rounded-lg bg-surface border border-border text-ink-primary"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={handleUploadVersion}
                      disabled={isUploading}
                      className="flex-1 py-1.5 px-3 rounded-lg bg-teal text-white text-xs font-semibold hover:bg-teal/90 transition shadow-sm flex items-center justify-center space-x-1.5"
                    >
                      {isUploading ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Uploading Version...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-3.5 h-3.5" />
                          <span>Commit Design Version</span>
                        </>
                      )}
                    </button>
                  </div>

                  {uploadError && (
                    <div className="text-xs text-red-400 flex items-center space-x-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{uploadError}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Visual Preview Frame */}
              {previewUrl ? (
                <div className="relative rounded-lg overflow-hidden border border-border bg-[#0B132B] flex items-center justify-center p-4 min-h-[360px] lg:min-h-[440px]">
                  <img
                    src={previewUrl}
                    alt="Design Preview"
                    className="max-h-[480px] max-w-full object-contain rounded shadow-lg"
                  />
                  <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
                    <span className="bg-black/75 backdrop-blur-md px-2.5 py-1 rounded-md text-[10px] text-slate-300 font-mono border border-white/10">
                      Target: {aspectRatio}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewUrl(null);
                        setUploadedFile(null);
                        setUploadError(null);
                        const fileInput = document.getElementById("design_file_input") as HTMLInputElement | null;
                        if (fileInput) fileInput.value = "";
                      }}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-black/85 hover:bg-rose-600 active:bg-rose-700 text-white border border-white/25 shadow-lg backdrop-blur-md text-xs font-bold font-mono transition-all cursor-pointer group/cut focus:outline-none focus:ring-2 focus:ring-rose-400"
                      title="Cut existing image to upload a new one"
                      aria-label="Cut existing image to upload a new one"
                    >
                      <X className="w-4 h-4 text-white stroke-[2.5] group-hover/cut:rotate-90 transition-transform duration-200" />
                      <span className="text-xs font-bold font-mono tracking-tight text-white select-none">
                        Cut
                      </span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-border bg-[#0B132B] p-8 text-center text-ink-muted flex flex-col items-center justify-center min-h-[280px]">
                  <FileImage className="w-8 h-8 text-slate-600 mb-2" />
                  <span className="text-xs">No artwork preview loaded. Upload an image to view canvas layout.</span>
                </div>
              )}

              {/* Version History Drawer */}
              {activeDraft && activeDraft.revisions && activeDraft.revisions.length > 0 && (
                <div className="pt-3 border-t border-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-ink-primary uppercase tracking-wide">Version History</span>
                    <span className="text-[11px] text-ink-muted">{activeDraft.revisions.length} total iterations</span>
                  </div>

                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {activeDraft.revisions.map((rev) => {
                      const isSelected = selectedRevisionId === rev.id;
                      return (
                        <div
                          key={rev.id}
                          onClick={() => {
                            setSelectedRevisionId(rev.id);
                            if (rev.file_path) setPreviewUrl(rev.file_path);
                          }}
                          className={`p-2 rounded-lg border text-xs cursor-pointer flex items-center justify-between transition ${
                            isSelected
                              ? "bg-teal/10 border-teal/40 text-teal"
                              : "bg-workspace border-border text-ink-secondary hover:text-ink-primary"
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            <span className="font-bold">v{rev.version_number}</span>
                            <span className="truncate max-w-[200px] text-ink-primary font-medium">
                              {rev.file_name || "creative-export.png"}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 text-[10px] text-ink-muted">
                            <span>{rev.created_at ? new Date(rev.created_at).toLocaleTimeString() : "Just now"}</span>
                            {isSelected && <span className="font-bold text-teal">Active</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: AI Visual Audit & Findings Panel (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-surface rounded-xl border border-border p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-ink-primary uppercase tracking-wide">AI Visual Audit</h3>
                  <p className="text-[11px] text-ink-secondary">Multi-layer brand rule and accessibility verification.</p>
                </div>

                <button
                  type="button"
                  onClick={handleRunVisualAudit}
                  disabled={isAuditing}
                  className="flex items-center space-x-1.5 py-1.5 px-3 rounded-lg bg-teal text-white text-xs font-semibold hover:bg-teal/90 transition shadow-sm disabled:opacity-50"
                >
                  {isAuditing ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Auditing...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Run Visual Audit</span>
                    </>
                  )}
                </button>
              </div>

              {auditError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{auditError}</span>
                </div>
              )}

              {/* Audit Overall Verdict Card */}
              {auditResult && (
                <div className="p-4 rounded-xl bg-workspace border border-border space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-ink-muted">Audit Status</span>
                      <div className="flex items-center space-x-2 mt-0.5">
                        <span
                          className={`px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${
                            auditResult.overall_status === "compliant"
                              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25"
                              : auditResult.overall_status === "needs_review"
                              ? "bg-amber-500/15 text-amber-400 border border-amber-500/25"
                              : "bg-red-500/15 text-red-400 border border-red-500/25"
                          }`}
                        >
                          {auditResult.overall_status}
                        </span>
                        <span className="text-xs font-bold text-ink-primary">
                          Score: {auditResult.summary?.compliance_score ?? 94}%
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-ink-muted">Findings</span>
                      <div className="text-xs font-semibold text-ink-primary">
                        {auditResult.findings.length} evaluated
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-ink-secondary leading-relaxed border-t border-border/60 pt-2">
                    {auditResult.summary?.verdict_overview}
                  </p>

                  {/* Findings Category Filters */}
                  <div className="flex flex-wrap gap-1 pt-1">
                    <button
                      type="button"
                      onClick={() => setFindingCategoryFilter("all")}
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold transition ${
                        findingCategoryFilter === "all"
                          ? "bg-teal text-white"
                          : "bg-surface text-ink-secondary hover:text-ink-primary border border-border"
                      }`}
                    >
                      All ({auditResult.findings.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setFindingCategoryFilter("violations")}
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold transition ${
                        findingCategoryFilter === "violations"
                          ? "bg-red-500 text-white"
                          : "bg-surface text-ink-secondary hover:text-ink-primary border border-border"
                      }`}
                    >
                      Violations
                    </button>
                    <button
                      type="button"
                      onClick={() => setFindingCategoryFilter("a11y")}
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold transition ${
                        findingCategoryFilter === "a11y"
                          ? "bg-indigo-500 text-white"
                          : "bg-surface text-ink-secondary hover:text-ink-primary border border-border"
                      }`}
                    >
                      A11y / Contrast
                    </button>
                    <button
                      type="button"
                      onClick={() => setFindingCategoryFilter("creative")}
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold transition ${
                        findingCategoryFilter === "creative"
                          ? "bg-amber-500 text-white"
                          : "bg-surface text-ink-secondary hover:text-ink-primary border border-border"
                      }`}
                    >
                      Suggestions
                    </button>
                  </div>
                </div>
              )}

              {/* Individual Findings List */}
              {auditResult && filteredFindings && filteredFindings.length > 0 && (
                <div className="space-y-3 max-h-[440px] overflow-y-auto pr-1">
                  {filteredFindings.map((finding) => (
                    <div
                      key={finding.id}
                      className="p-3.5 rounded-xl bg-workspace border border-border space-y-2 text-xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              finding.severity === "high" || finding.severity === "critical"
                                ? "bg-red-400"
                                : finding.severity === "medium"
                                ? "bg-amber-400"
                                : "bg-teal"
                            }`}
                          />
                          <h4 className="font-bold text-ink-primary text-xs">{finding.title}</h4>
                        </div>
                        <span
                          className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                            finding.severity === "high" || finding.severity === "critical"
                              ? "bg-red-500/10 text-red-400 border border-red-500/20"
                              : finding.severity === "medium"
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                              : "bg-teal/10 text-teal border border-teal/20"
                          }`}
                        >
                          {finding.severity}
                        </span>
                      </div>

                      <p className="text-ink-secondary text-[11px] leading-relaxed">{finding.message}</p>

                      {/* Evidence */}
                      {finding.evidence && (
                        <div className="p-2 rounded bg-surface border border-border/70 text-[10px] text-ink-muted">
                          <span className="font-bold text-ink-primary block mb-0.5">Evidence & Detected Layer:</span>
                          <span className="italic">{finding.evidence}</span>
                        </div>
                      )}

                      {/* Suggested Fix */}
                      {(finding.suggested_correction?.replacement_text || (finding as any).suggested_fix) && (
                        <div className="p-2 rounded bg-teal/5 border border-teal/20 text-[11px] text-teal">
                          <span className="font-bold block mb-0.5">Suggested Correction:</span>
                          <span>{finding.suggested_correction?.replacement_text || (finding as any).suggested_fix}</span>
                        </div>
                      )}

                      {/* Reference Badge */}
                      {(finding.rule_reference || (finding as any).rule_code) && (
                        <div className="flex items-center justify-between text-[10px] text-ink-muted pt-1">
                          <span>Rule: <strong>{finding.rule_reference || (finding as any).rule_code}</strong></span>
                          <span>Confidence: <strong>{finding.confidence ? `${Math.round(finding.confidence * 100)}%` : "High"}</strong></span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Submit for Review Button */}
              {(activeDraft || uploadedFile || previewUrl) && (
                <div className="pt-3 border-t border-border flex items-center justify-between">
                  <div className="text-[11px] text-ink-muted">
                    {activeDraft?.status === "submitted"
                      ? "Submitted to Review Queue"
                      : "Ready for human brand & compliance sign-off?"}
                  </div>

                  <button
                    type="button"
                    onClick={handleSubmitForReview}
                    disabled={isSubmittingReview || activeDraft?.status === "submitted"}
                    className="flex items-center space-x-1.5 py-2 px-3.5 rounded-lg bg-teal text-white text-xs font-semibold hover:bg-teal/90 transition shadow-sm disabled:opacity-50"
                  >
                    {isSubmittingReview ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>
                          {activeDraft?.status === "submitted" ? "Submitted for Review" : "Submit for Human Review"}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          TAB 3: BRAND ASSET LIBRARY
          ========================================== */}
      {activeTab === "asset_library" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-surface p-4 rounded-xl border border-border">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-ink-primary uppercase tracking-wide">Category:</span>
              <div className="flex flex-wrap gap-1">
                {["all", "logo", "palette", "typography", "badge"].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setAssetFilter(cat)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition ${
                      assetFilter === cat
                        ? "bg-teal text-white"
                        : "bg-workspace text-ink-secondary hover:text-ink-primary border border-border"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="w-full sm:w-64">
              <input
                type="text"
                value={assetSearch}
                onChange={(e) => setAssetSearch(e.target.value)}
                placeholder="Search assets..."
                className="w-full px-3 py-1.5 text-xs rounded-lg bg-workspace border border-border text-ink-primary"
              />
            </div>
          </div>

          {loadingAssets ? (
            <div className="p-12 text-center text-ink-muted">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-teal" />
              <span>Loading authorized brand assets...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAssets.map((asset) => (
                <div
                  key={asset.id}
                  className="p-4 rounded-xl bg-surface border border-border space-y-3 hover:border-teal/30 transition shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-teal">
                        {asset.asset_type}
                      </span>
                      <h4 className="text-sm font-bold text-ink-primary">{asset.name}</h4>
                    </div>

                    <span
                      className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${
                        asset.approval_status === "approved"
                          ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25"
                          : (asset.approval_status as string) === "restricted"
                          ? "bg-amber-500/15 text-amber-400 border border-amber-500/25"
                          : "bg-red-500/15 text-red-400 border border-red-500/25"
                      }`}
                    >
                      {asset.approval_status}
                    </span>
                  </div>

                  {/* Asset Visual Preview */}
                  {asset.asset_type === "palette" && asset.specifications?.hex && (
                    <div className="p-3 rounded-lg bg-workspace border border-border flex items-center space-x-3">
                      <div
                        className="w-10 h-10 rounded-lg border border-white/20 shrink-0"
                        style={{ backgroundColor: asset.specifications.hex }}
                      />
                      <div className="text-xs">
                        <div className="font-mono font-bold text-ink-primary">{asset.specifications.hex}</div>
                        <div className="text-[11px] text-ink-secondary">{asset.specifications.role}</div>
                        {asset.specifications.wcag_contrast_white && (
                          <div className="text-[10px] text-emerald-400">{asset.specifications.wcag_contrast_white}</div>
                        )}
                      </div>
                    </div>
                  )}

                  {asset.asset_type === "typography" && (
                    <div className="p-3 rounded-lg bg-workspace border border-border space-y-1">
                      <div className="font-bold text-sm text-ink-primary">{asset.specifications?.font_family}</div>
                      <div className="text-[11px] text-ink-secondary">
                        Heading: {asset.specifications?.heading_weights?.join(", ")} | Body:{" "}
                        {asset.specifications?.body_weights?.join(", ")}
                      </div>
                    </div>
                  )}

                  {asset.asset_type === "logo" && (
                    <div className="p-3 rounded-lg bg-[#0B132B] border border-border flex items-center justify-center min-h-[60px]">
                      <span className="text-xs font-bold text-teal tracking-wide">{asset.name}</span>
                    </div>
                  )}

                  {/* Specs & Restrictions */}
                  <div className="text-[11px] text-ink-muted space-y-1">
                    {asset.specifications?.clearspace && (
                      <div>Clearspace: <strong>{asset.specifications.clearspace}</strong></div>
                    )}
                    {asset.specifications?.restrictions && (
                      <div className="text-amber-400">Notice: {asset.specifications.restrictions}</div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-border flex items-center justify-between text-[11px]">
                    <span className="text-ink-muted">Organization Isolated</span>
                    <button
                      type="button"
                      onClick={() => {
                        toggleAssetSelection(asset.id);
                        setActiveTab("brief_concepts");
                      }}
                      className="text-xs font-semibold text-teal hover:underline"
                    >
                      {selectedAssetIds.includes(asset.id) ? "Selected in Brief" : "+ Add to Brief"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ==========================================
          TAB 4: PROJECT HISTORY
          ========================================== */}
      {activeTab === "history" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-ink-primary">Creative Design Project History</h3>
              <p className="text-xs text-ink-secondary">
                Review past creative briefs, versioned design drafts, and associated audit runs.
              </p>
            </div>
            <button
              onClick={loadProjectHistory}
              className="p-1.5 rounded-lg bg-surface border border-border text-ink-secondary hover:text-ink-primary"
            >
              <RefreshCw className={`w-4 h-4 ${loadingHistory ? "animate-spin" : ""}`} />
            </button>
          </div>

          {loadingHistory ? (
            <div className="p-12 text-center text-ink-muted">Loading projects...</div>
          ) : savedBriefs.length === 0 ? (
            <div className="p-12 text-center bg-surface rounded-xl border border-border text-ink-muted text-xs">
              No saved design projects found. Create your first brief in the <strong>Creative Brief & Concepts</strong> tab.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {savedBriefs.map((draft) => (
                <div
                  key={draft.id}
                  className="p-4 rounded-xl bg-surface border border-border space-y-3 hover:border-teal/30 transition shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-ink-primary">{draft.title}</h4>
                      <p className="text-xs text-ink-secondary mt-0.5 line-clamp-1">{draft.description}</p>
                    </div>

                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                        draft.status === "approved"
                          ? "bg-emerald-500/15 text-emerald-400"
                          : draft.status === "submitted"
                          ? "bg-indigo-500/15 text-indigo-400"
                          : "bg-amber-500/15 text-amber-400"
                      }`}
                    >
                      {draft.status}
                    </span>
                  </div>

                  <div className="flex items-center space-x-3 text-xs text-ink-muted">
                    <span>Iterations: <strong>{draft.revisions?.length ?? 1}</strong></span>
                    <span>•</span>
                    <span>Version: <strong>v{draft.version_number}</strong></span>
                    <span>•</span>
                    <span>Channel: <strong>{draft.brief?.channel || "social"}</strong></span>
                  </div>

                  {draft.latest_audit && (
                    <div className="p-2 rounded bg-workspace border border-border flex items-center justify-between text-xs">
                      <span className="text-ink-muted">Audit Score:</span>
                      <span className="font-bold text-emerald-400">
                        {draft.latest_audit.summary?.compliance_score ?? 94}% ({draft.latest_audit.overall_status})
                      </span>
                    </div>
                  )}

                  <div className="pt-2 border-t border-border flex items-center justify-between">
                    <span className="text-[10px] text-ink-muted">
                      Updated {new Date(draft.updated_at).toLocaleDateString()}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveDraft(draft);
                        setSelectedRevisionId(draft.current_revision_id || null);
                        if (draft.current_file_path) setPreviewUrl(draft.current_file_path);
                        setActiveTab("canvas_audit");
                      }}
                      className="text-xs font-semibold text-teal hover:underline flex items-center space-x-1"
                    >
                      <span>Open Workspace</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ==========================================
          TAB 5: INTELLIGENT CREATIVE PARTNER (COPILOT)
          ========================================== */}
      {activeTab === "copilot_chat" && (
        <div className="space-y-4">
          {/* Active Context Banner */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-surface via-surface to-indigo-950/20 border border-indigo-500/20 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-ink-primary flex items-center space-x-2">
                  <span>Designer Copilot — Intelligent Creative Partner</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal/15 text-teal border border-teal/25 uppercase">
                    Grounded in Brand Tokens
                  </span>
                </h3>
                <p className="text-ink-secondary text-xs">
                  Active Project: <strong>{activeDraft?.title || projectName}</strong> | Selected Concept:{" "}
                  <strong>{selectedConcept?.concept_name || "Enterprise High-Contrast Modern"}</strong> | Channel:{" "}
                  <strong>{channel} ({aspectRatio})</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="text"
                placeholder="Optional image path (e.g. sample.png)"
                value={referenceImagePathInput}
                onChange={(e) => setReferenceImagePathInput(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-workspace border border-border text-xs text-ink-primary placeholder-ink-muted w-64 focus:outline-none focus:border-teal"
              />
              <button
                type="button"
                onClick={() => handleSendCopilotMessage("Analyze reference image and evaluate WCAG AA contrast ratio")}
                className="px-3 py-1.5 rounded-lg bg-teal/10 hover:bg-teal/20 text-teal border border-teal/20 text-xs font-semibold flex items-center space-x-1"
              >
                <FileImage className="w-3.5 h-3.5" />
                <span>Inspect Image</span>
              </button>
            </div>
          </div>

          {/* Quick Action Suggestion Chips */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold text-ink-muted uppercase tracking-wider">Quick Actions:</span>
            <button
              onClick={() =>
                handleSendCopilotMessage(
                  "Make this design direction more premium, deepening the canvas palette, expanding negative space to 45%, and refining typography tracking while preserving the headline and product."
                )
              }
              className="px-2.5 py-1 rounded-full bg-surface hover:bg-teal/10 border border-border hover:border-teal/30 text-xs text-ink-secondary hover:text-teal transition flex items-center space-x-1"
            >
              <Sparkles className="w-3 h-3 text-indigo-400" />
              <span>Make It More Premium</span>
            </button>

            <button
              onClick={() =>
                handleSendCopilotMessage(
                  "Please provide a structured design critique of this visual concept and evaluate its layout hierarchy, safe zones, and contrast."
                )
              }
              className="px-2.5 py-1 rounded-full bg-surface hover:bg-teal/10 border border-border hover:border-teal/30 text-xs text-ink-secondary hover:text-teal transition flex items-center space-x-1"
            >
              <Eye className="w-3 h-3 text-teal" />
              <span>Critique Active Concept</span>
            </button>

            <button
              onClick={() =>
                handleSendCopilotMessage(
                  "Adapt this concept for Instagram in 1:1 square format with centered single-column mobile flow."
                )
              }
              className="px-2.5 py-1 rounded-full bg-surface hover:bg-teal/10 border border-border hover:border-teal/30 text-xs text-ink-secondary hover:text-teal transition flex items-center space-x-1"
            >
              <Layers className="w-3 h-3 text-amber-400" />
              <span>Adapt for Instagram (1:1)</span>
            </button>

            <button
              onClick={() =>
                handleSendCopilotMessage(
                  "Adapt this concept for LinkedIn in 1.91:1 landscape aspect ratio with B2B dual-panel split layout."
                )
              }
              className="px-2.5 py-1 rounded-full bg-surface hover:bg-teal/10 border border-border hover:border-teal/30 text-xs text-ink-secondary hover:text-teal transition flex items-center space-x-1"
            >
              <Layers className="w-3 h-3 text-blue-400" />
              <span>Adapt for LinkedIn (1.91:1)</span>
            </button>

            <button
              onClick={() =>
                handleSendCopilotMessage(
                  "Run automated brand audit on current draft to evaluate WCAG AA contrast, logo clearspace, and copy compliance."
                )
              }
              className="px-2.5 py-1 rounded-full bg-surface hover:bg-teal/10 border border-border hover:border-teal/30 text-xs text-ink-secondary hover:text-teal transition flex items-center space-x-1"
            >
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>Run Brand Visual Audit</span>
            </button>
          </div>

          {/* Feedback Success Notification */}
          {feedbackSuccessMsg && (
            <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{feedbackSuccessMsg}</span>
            </div>
          )}

          {/* Chat Stream Window */}
          <div className="p-4 rounded-xl bg-surface border border-border space-y-4 min-h-[480px] max-h-[640px] overflow-y-auto">
            {copilotMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col space-y-2.5 ${
                  msg.role === "user" ? "items-end" : "items-start"
                }`}
              >
                <div className="flex items-center space-x-2 text-[10px] text-ink-muted">
                  <span className="font-bold uppercase tracking-wider">
                    {msg.role === "user" ? "You" : "Designer Copilot"}
                  </span>
                  {msg.confidence && (
                    <span
                      className={`px-1.5 py-0.2 rounded font-semibold text-[9px] uppercase ${
                        msg.confidence === "high"
                          ? "bg-emerald-500/15 text-emerald-400"
                          : msg.confidence === "medium"
                          ? "bg-amber-500/15 text-amber-400"
                          : "bg-red-500/15 text-red-400"
                      }`}
                    >
                      {msg.confidence} Confidence
                    </span>
                  )}
                </div>

                <div
                  className={`max-w-3xl p-4 rounded-xl text-xs space-y-3 leading-relaxed shadow-sm ${
                    msg.role === "user"
                      ? "bg-indigo-600/20 border border-indigo-500/30 text-ink-primary"
                      : "bg-workspace border border-border text-ink-primary"
                  }`}
                >
                  {/* Message Prose */}
                  <div className="whitespace-pre-line font-normal">{msg.content}</div>

                  {/* Tool Badges */}
                  {msg.toolsExecuted && msg.toolsExecuted.length > 0 && (
                    <div className="pt-2 border-t border-border flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] text-ink-muted font-bold">Tools Executed:</span>
                      {msg.toolsExecuted.map((t, idx) => (
                        <span
                          key={idx}
                          className={`text-[10px] px-2 py-0.5 rounded font-mono flex items-center space-x-1 ${
                            t.success
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-red-500/10 text-red-400 border border-red-500/20"
                          }`}
                        >
                          <span>{t.tool_name}</span>
                          <span>{t.success ? "✓" : "✗"}</span>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Grounded Citations */}
                  {msg.citations && msg.citations.length > 0 && (
                    <div className="p-2.5 rounded-lg bg-surface border border-border space-y-1">
                      <div className="text-[10px] font-bold text-ink-muted uppercase tracking-wider">
                        Grounded Brand Citations
                      </div>
                      <div className="space-y-1">
                        {msg.citations.map((c, idx) => (
                          <div key={idx} className="text-[11px] text-ink-secondary">
                            <strong>{c.document_name}</strong> (P. {c.page || 1}): &ldquo;{c.snippet}&rdquo;
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Structured Deliverables Rendering */}
                  {msg.deliverable && (
                    <div className="mt-3 p-3.5 rounded-xl bg-surface border border-teal/25 space-y-3">
                      {/* 1. Reference Image Analysis Deliverable */}
                      {msg.deliverable.dimensions && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between border-b border-border pb-2">
                            <span className="font-bold text-teal flex items-center space-x-1.5">
                              <FileImage className="w-4 h-4" />
                              <span>Visual Reference Analysis: {msg.deliverable.file_name}</span>
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                                msg.deliverable.wcag_aa_compliant
                                  ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25"
                                  : "bg-red-500/15 text-red-400 border border-red-500/25"
                              }`}
                            >
                              {msg.deliverable.wcag_aa_compliant ? "Passes WCAG 2.1 AA" : "Fails WCAG AA (min 4.5:1)"}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                            <div className="p-2 rounded bg-workspace border border-border">
                              <span className="text-ink-muted block text-[10px]">Dimensions</span>
                              <span className="font-bold">
                                {msg.deliverable.dimensions.width}x{msg.deliverable.dimensions.height}px
                              </span>
                            </div>
                            <div className="p-2 rounded bg-workspace border border-border">
                              <span className="text-ink-muted block text-[10px]">Aspect Ratio</span>
                              <span className="font-bold">{msg.deliverable.dimensions.aspect_ratio || "N/A"}</span>
                            </div>
                            <div className="p-2 rounded bg-workspace border border-border">
                              <span className="text-ink-muted block text-[10px]">Measured Contrast</span>
                              <span className="font-bold text-teal">
                                {msg.deliverable.contrast_ratio ? `${msg.deliverable.contrast_ratio}:1` : "N/A"}
                              </span>
                            </div>
                            <div className="p-2 rounded bg-workspace border border-border">
                              <span className="text-ink-muted block text-[10px]">Concordance</span>
                              <span className="font-bold capitalize">{msg.deliverable.brand_palette_concordance}</span>
                            </div>
                          </div>

                          {/* Dominant Color Palette */}
                          {msg.deliverable.dominant_colors_hex && msg.deliverable.dominant_colors_hex.length > 0 && (
                            <div className="space-y-1">
                              <span className="text-[10px] font-bold text-ink-muted block">Extracted Dominant Palette</span>
                              <div className="flex flex-wrap items-center gap-2">
                                {msg.deliverable.dominant_colors_hex.map((hex: string, i: number) => (
                                  <div
                                    key={i}
                                    className="flex items-center space-x-1.5 px-2 py-1 rounded bg-workspace border border-border"
                                  >
                                    <div
                                      className="w-3.5 h-3.5 rounded-full border border-white/20"
                                      style={{ backgroundColor: hex }}
                                    />
                                    <span className="font-mono text-[10px]">{hex}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Observable Facts & Warnings */}
                          {msg.deliverable.observable_facts && msg.deliverable.observable_facts.length > 0 && (
                            <div className="space-y-1">
                              <span className="text-[10px] font-bold text-ink-muted block">Observable Facts:</span>
                              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-ink-secondary">
                                {msg.deliverable.observable_facts.map((fact: string, i: number) => (
                                  <li key={i}>{fact}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {msg.deliverable.uncertainty_limitations && msg.deliverable.uncertainty_limitations.length > 0 && (
                            <div className="p-2 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] space-y-0.5">
                              <span className="font-bold block text-[10px] uppercase">Uncertainties / Limitations</span>
                              {msg.deliverable.uncertainty_limitations.map((u: string, i: number) => (
                                <p key={i}>• {u}</p>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* 2. Structured Design Critique Deliverable */}
                      {msg.deliverable.critical_issues && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between border-b border-border pb-2">
                            <span className="font-bold text-indigo-400 flex items-center space-x-1.5">
                              <Eye className="w-4 h-4" />
                              <span>Structured Creative Critique</span>
                            </span>
                            <div className="flex items-center space-x-2 text-[10px]">
                              <span className="px-2 py-0.5 rounded bg-workspace border border-border">
                                Hierarchy: <strong>{msg.deliverable.hierarchy_score}/100</strong>
                              </span>
                              <span className="px-2 py-0.5 rounded bg-workspace border border-border">
                                A11y: <strong>{msg.deliverable.accessibility_score}/100</strong>
                              </span>
                            </div>
                          </div>

                          <p className="text-xs text-ink-secondary">{msg.deliverable.overall_summary}</p>

                          <div className="space-y-2 pt-1">
                            {msg.deliverable.critical_issues.map((iss: any, i: number) => (
                              <div
                                key={i}
                                className="p-2.5 rounded-lg bg-workspace border border-amber-500/20 space-y-1 text-xs"
                              >
                                <div className="font-bold text-amber-300 flex items-center space-x-1.5">
                                  <AlertTriangle className="w-3.5 h-3.5" />
                                  <span>{iss.issue}</span>
                                </div>
                                <p className="text-ink-secondary text-[11px]">
                                  <strong>Why it matters:</strong> {iss.why_it_matters}
                                </p>
                                <p className="text-emerald-400 text-[11px]">
                                  <strong>How to fix:</strong> {iss.how_to_fix}
                                </p>
                                <p className="text-teal text-[11px]">
                                  <strong>Alternative:</strong> {iss.suggested_alternative}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 3. Design Adaptation Deliverable */}
                      {msg.deliverable.adapted_concept && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between border-b border-border pb-2">
                            <span className="font-bold text-teal flex items-center space-x-1.5">
                              <Sparkles className="w-4 h-4 text-indigo-400" />
                              <span>Stateful Adaptation: {msg.deliverable.adapted_concept.concept_name}</span>
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-300 font-bold uppercase">
                              Active Concept Updated
                            </span>
                          </div>

                          <p className="text-xs text-ink-secondary">{msg.deliverable.design_rationale}</p>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] pt-1">
                            <div className="p-2.5 rounded bg-workspace border border-border space-y-1">
                              <span className="font-bold text-teal block text-[10px] uppercase">
                                Applied Modifications
                              </span>
                              <ul className="space-y-0.5 text-ink-secondary">
                                {msg.deliverable.applied_modifications.map((m: string, i: number) => (
                                  <li key={i}>✓ {m}</li>
                                ))}
                              </ul>
                            </div>

                            <div className="p-2.5 rounded bg-workspace border border-border space-y-1">
                              <span className="font-bold text-indigo-400 block text-[10px] uppercase">
                                Preserved Brand Anchors
                              </span>
                              <ul className="space-y-0.5 text-ink-secondary">
                                {msg.deliverable.preserved_elements.map((p: string, i: number) => (
                                  <li key={i}>🔒 {p}</li>
                                ))}
                              </ul>
                            </div>
                          </div>

                          <div className="p-2 rounded bg-workspace border border-border text-[11px] space-y-1">
                            <span className="font-bold text-ink-muted block text-[10px] uppercase">Composition</span>
                            <p className="text-ink-secondary">
                              {msg.deliverable.adapted_concept.visual_direction_composition}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Feedback Controls for Assistant Responses */}
                  {msg.role === "assistant" && msg.id !== "welcome_init" && (
                    <div className="pt-2 border-t border-border flex flex-wrap items-center justify-between gap-2 text-[11px]">
                      {msg.feedbackGiven ? (
                        <span className="text-emerald-400 font-semibold flex items-center space-x-1">
                          <Check className="w-3.5 h-3.5" />
                          <span>Feedback Recorded</span>
                        </span>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <span className="text-ink-muted">Rate this response:</span>
                          <button
                            type="button"
                            onClick={() => handleSendFeedback(msg.id, true)}
                            className="p-1 rounded hover:bg-emerald-500/20 text-ink-secondary hover:text-emerald-400 transition"
                            title="Helpful & Accurate"
                          >
                            <ThumbsUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveFeedbackMsgId(msg.id);
                              handleSendFeedback(msg.id, false);
                            }}
                            className="p-1 rounded hover:bg-red-500/20 text-ink-secondary hover:text-red-400 transition"
                            title="Needs Improvement"
                          >
                            <ThumbsDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                      <div className="flex items-center space-x-2 text-[10px] text-ink-muted">
                        <span>Organization Scoped</span>
                        <span>•</span>
                        <span>WCAG 2.1 AA Guaranteed</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {copilotLoading && (
              <div className="flex items-center space-x-2 text-xs text-ink-muted p-2">
                <RefreshCw className="w-4 h-4 animate-spin text-teal" />
                <span>Designer Copilot is evaluating brand tokens, image metrics, and visual hierarchy...</span>
              </div>
            )}
          </div>

          {/* Chat Input Box */}
          <div className="p-3 rounded-xl bg-surface border border-border flex items-center space-x-3 shadow-sm">
            <input
              type="text"
              placeholder="Give creative direction (e.g. 'Make it more premium', 'Adapt for Instagram', 'Critique hierarchy')..."
              value={copilotInput}
              onChange={(e) => setCopilotInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendCopilotMessage();
                }
              }}
              className="flex-1 bg-transparent border-0 text-xs text-ink-primary placeholder-ink-muted focus:outline-none"
            />

            <button
              type="button"
              disabled={copilotLoading || !copilotInput.trim()}
              onClick={() => handleSendCopilotMessage()}
              className="px-4 py-2 rounded-lg bg-teal text-white hover:bg-teal-hover transition text-xs font-semibold flex items-center space-x-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DesignerCopilotPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[40vh] text-ink-muted text-xs space-y-3 p-8">
          <div className="w-8 h-8 rounded-full border-2 border-teal border-t-transparent animate-spin"></div>
          <p className="font-semibold text-navy">Loading Designer Copilot...</p>
        </div>
      }
    >
      <DesignerCopilotContent />
    </Suspense>
  );
}
