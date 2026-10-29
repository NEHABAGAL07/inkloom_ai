"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { api } from "@/services/api";
import { ContentSubmission, CampaignAdaptation, PlatformType } from "@/types";
import {
  Sparkles,
  Instagram,
  Linkedin,
  Youtube,
  Globe,
  Copy,
  Check,
  RefreshCw,
  Send,
  AlertTriangle,
  CheckCircle2,
  X,
  Info,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface CampaignAdaptationModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceSubmission: ContentSubmission | null;
  onSubmissionCreated?: (newSubmissionId: string) => void;
}

const PLATFORM_SPECS: Record<
  PlatformType,
  {
    name: string;
    icon: React.ComponentType<{ className?: string }>;
    maxChars: number;
    description: string;
  }
> = {
  instagram: {
    name: "Instagram",
    icon: Instagram,
    maxChars: 2200,
    description: "Visual hook, concise paragraphs, call to action, and hashtags.",
  },
  linkedin: {
    name: "LinkedIn",
    icon: Linkedin,
    maxChars: 3000,
    description: "Thought-leadership opening, bulleted takeaways, discussion prompt.",
  },
  youtube: {
    name: "YouTube",
    icon: Youtube,
    maxChars: 5000,
    description: "Search-optimized title, chapters/links description, and tags.",
  },
  website: {
    name: "Website",
    icon: Globe,
    maxChars: 2000,
    description: "H1 benefit headline, SEO meta description, scannable body copy.",
  },
};

export function CampaignAdaptationModal({
  isOpen,
  onClose,
  sourceSubmission,
  onSubmissionCreated,
}: CampaignAdaptationModalProps) {
  const [selectedPlatforms, setSelectedPlatforms] = useState<PlatformType[]>([
    "instagram",
    "linkedin",
    "youtube",
    "website",
  ]);
  const [adaptations, setAdaptations] = useState<CampaignAdaptation[]>([]);
  const [activePlatform, setActivePlatform] = useState<PlatformType>("instagram");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showFactDetails, setShowFactDetails] = useState(false);

  // Debounce ref for auto-saving on blur
  const saveDebounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Load existing adaptations on mount or when source changes
  useEffect(() => {
    if (isOpen && sourceSubmission?.id) {
      setError(null);
      setSuccessMessage(null);
      api
        .getCampaignAdaptations(sourceSubmission.id)
        .then((items) => {
          if (items && items.length > 0) {
            setAdaptations(items);
            setActivePlatform(items[0].platform);
          }
        })
        .catch(() => {});
    }
  }, [isOpen, sourceSubmission?.id]);

  // Clean up debounce timer on unmount
  useEffect(() => {
    return () => {
      if (saveDebounceTimer.current) {
        clearTimeout(saveDebounceTimer.current);
      }
    };
  }, []);

  if (!isOpen || !sourceSubmission) return null;

  const currentAdaptation = adaptations.find((a) => a.platform === activePlatform);

  const togglePlatform = (p: PlatformType) => {
    setSelectedPlatforms((prev) =>
      prev.includes(p) ? prev.filter((item) => item !== p) : [...prev, p]
    );
  };

  const handleAdapt = async () => {
    if (selectedPlatforms.length === 0) {
      setError("Please select at least one platform to adapt.");
      return;
    }
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const results = await api.adaptCampaign(sourceSubmission.id, selectedPlatforms);
      setAdaptations(results);
      if (results.length > 0) {
        setActivePlatform(results[0].platform);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to generate campaign adaptations.");
    } finally {
      setLoading(false);
    }
  };

  const handleContentChange = (field: string, value: any) => {
    if (!currentAdaptation) return;
    const updatedContent = { ...currentAdaptation.content, [field]: value };
    setAdaptations((prev) =>
      prev.map((a) => (a.id === currentAdaptation.id ? { ...a, content: updatedContent } : a))
    );
  };

  // Debounced save-on-blur implementation (400ms debounce window)
  const debouncedSaveEdit = useCallback(() => {
    if (saveDebounceTimer.current) {
      clearTimeout(saveDebounceTimer.current);
    }
    saveDebounceTimer.current = setTimeout(async () => {
      if (!currentAdaptation) return;
      setSaving(true);
      setError(null);
      try {
        const updated = await api.editAdaptation(currentAdaptation.id, currentAdaptation.content);
        setAdaptations((prev) =>
          prev.map((a) => (a.id === updated.id ? updated : a))
        );
      } catch (err: any) {
        setError(err?.message || "Failed to save edits.");
      } finally {
        setSaving(false);
      }
    }, 400);
  }, [currentAdaptation]);

  const handleRegenerate = async () => {
    if (!currentAdaptation) return;
    setRegenerating(true);
    setError(null);
    try {
      const regenerated = await api.regenerateAdaptation(currentAdaptation.id);
      setAdaptations((prev) =>
        prev.map((a) => (a.id === regenerated.id ? regenerated : a))
      );
    } catch (err: any) {
      setError(err?.message || "Failed to regenerate variant.");
    } finally {
      setRegenerating(false);
    }
  };

  const handleCopy = () => {
    if (!currentAdaptation) return;
    let textToCopy = "";
    if (currentAdaptation.platform === "instagram") {
      const tags = Array.isArray(currentAdaptation.content.hashtags)
        ? currentAdaptation.content.hashtags.join(" ")
        : currentAdaptation.content.hashtags || "";
      textToCopy = `${currentAdaptation.content.caption || ""}\n\n${tags}`;
    } else if (currentAdaptation.platform === "linkedin") {
      textToCopy = currentAdaptation.content.post || "";
    } else if (currentAdaptation.platform === "youtube") {
      const tags = Array.isArray(currentAdaptation.content.tags)
        ? currentAdaptation.content.tags.join(", ")
        : currentAdaptation.content.tags || "";
      textToCopy = `Title: ${currentAdaptation.content.title || ""}\n\nDescription:\n${
        currentAdaptation.content.description || ""
      }\n\nTags: ${tags}`;
    } else if (currentAdaptation.platform === "website") {
      textToCopy = `# ${currentAdaptation.content.headline || ""}\n\nMeta: ${
        currentAdaptation.content.meta_description || ""
      }\n\n${currentAdaptation.content.body || ""}`;
    }

    navigator.clipboard.writeText(textToCopy.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmitForReview = async () => {
    if (!currentAdaptation) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await api.submitAdaptationForReview(currentAdaptation.id);
      setAdaptations((prev) =>
        prev.map((a) => (a.id === currentAdaptation.id ? { ...a, status: "submitted" } : a))
      );
      setSuccessMessage(
        `Variant submitted for review as draft submission: "${res.submission_id}"`
      );
      if (onSubmissionCreated) {
        onSubmissionCreated(res.submission_id);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to submit variant for review.");
    } finally {
      setSubmitting(false);
    }
  };

  // Compute live character count
  const getLiveCharCount = (): { current: number; max: number } => {
    if (!currentAdaptation) return { current: 0, max: 2000 };
    const p = currentAdaptation.platform;
    const c = currentAdaptation.content;
    if (p === "instagram") {
      return { current: (c.caption || "").length, max: 2200 };
    }
    if (p === "linkedin") {
      return { current: (c.post || "").length, max: 3000 };
    }
    if (p === "youtube") {
      return { current: (c.description || "").length, max: 5000 };
    }
    if (p === "website") {
      return { current: (c.body || "").length, max: 2000 };
    }
    return { current: 0, max: 2000 };
  };

  const charCount = getLiveCharCount();
  const isNearLimit = charCount.current > charCount.max * 0.9;
  const isOverLimit = charCount.current > charCount.max;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="One-Click Campaign Adaptation"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-black/60 backdrop-blur-sm"
    >
      <div className="relative w-full max-w-4xl bg-surface border border-border rounded-2xl shadow-card overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-border bg-[var(--bg-elevated)] shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-teal/10 text-teal border border-teal/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-navy flex items-center gap-2">
                One-Click Campaign Adaptation
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-status-success border border-emerald-200 uppercase tracking-wider">
                  Approved Source
                </span>
              </h2>
              <p className="text-xs text-ink-secondary line-clamp-1 mt-0.5">
                Source: <span className="font-semibold text-navy">{sourceSubmission.title}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close adaptation modal"
            className="p-2 rounded-xl text-ink-muted hover:text-navy hover:bg-[var(--bg-hover)] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Error / Success Feedback */}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {successMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-50 text-status-success dark:bg-emerald-950/40 border border-emerald-200 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Platform Selector Checklist */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-ink-secondary">
                Select Target Channels
              </label>
              <span className="text-[11px] text-ink-muted">
                {selectedPlatforms.length} of 4 channels chosen
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {(["instagram", "linkedin", "youtube", "website"] as PlatformType[]).map((p) => {
                const spec = PLATFORM_SPECS[p];
                const Icon = spec.icon;
                const isSelected = selectedPlatforms.includes(p);
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => togglePlatform(p)}
                    aria-pressed={isSelected}
                    aria-label={`Toggle ${spec.name}`}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs font-bold transition text-left ${
                      isSelected
                        ? "bg-teal/10 border-teal text-navy shadow-subtle"
                        : "bg-workspace border-border text-ink-secondary hover:border-slate-300 dark:hover:border-slate-600"
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isSelected ? "text-teal" : ""}`} />
                    <span className="truncate">{spec.name}</span>
                  </button>
                );
              })}
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-[11px] text-ink-muted">
                Brand locked: all metrics, numbers, and terminology are verified before saving.
              </p>
              <button
                type="button"
                onClick={handleAdapt}
                disabled={loading || selectedPlatforms.length === 0}
                aria-label="Adapt campaign across selected platforms"
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-teal hover:bg-teal-hover disabled:opacity-50 transition shadow-subtle flex items-center justify-center gap-2 shrink-0"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Adapting Content...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generate Adaptations</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Skeletons when loading */}
          {loading && (
            <div className="space-y-4 p-6 rounded-2xl bg-workspace border border-border">
              <div className="h-6 bg-[var(--bg-hover)] rounded-md w-1/4 animate-pulse"></div>
              <div className="h-24 bg-[var(--bg-hover)] rounded-xl animate-pulse"></div>
              <div className="h-10 bg-[var(--bg-hover)] rounded-xl w-1/3 animate-pulse"></div>
            </div>
          )}

          {/* Adaptation Results */}
          {!loading && adaptations.length > 0 && currentAdaptation && (
            <div className="space-y-4 pt-2">
              {/* Channel Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-border">
                {adaptations.map((a) => {
                  const spec = PLATFORM_SPECS[a.platform];
                  const Icon = spec.icon;
                  const isActive = a.platform === activePlatform;
                  const isFlagged = a.brand_check === "flagged";
                  return (
                    <button
                      key={a.id}
                      onClick={() => setActivePlatform(a.platform)}
                      aria-label={`View ${spec.name} adaptation`}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
                        isActive
                          ? "bg-teal text-white shadow-subtle"
                          : "text-ink-secondary hover:bg-[var(--bg-hover)]"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{spec.name}</span>
                      {isFlagged ? (
                        <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Status Header: Badges & Limits */}
              <div className="p-4 rounded-xl bg-workspace border border-border flex flex-wrap items-center justify-between gap-3 shadow-subtle">
                <div className="flex flex-wrap items-center gap-2">
                  {/* Mode Badge */}
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-full bg-blue-50 text-status-info border border-blue-200">
                    <Info className="w-3 h-3" />
                    {currentAdaptation.mode === "llm" ? "AI Generated (LLM)" : "Rule-Based Deterministic"}
                  </span>

                  {/* Brand Check Badge */}
                  <button
                    type="button"
                    onClick={() => setShowFactDetails((prev) => !prev)}
                    aria-label="Toggle brand check fact details"
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold rounded-full border transition ${
                      currentAdaptation.brand_check === "passed"
                        ? "bg-emerald-50 text-status-success border-emerald-200"
                        : "bg-amber-50 text-status-warning border-amber-200"
                    }`}
                  >
                    {currentAdaptation.brand_check === "passed" ? (
                      <>
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Brand Check Passed</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-3 h-3" />
                        <span>Brand Check Flagged</span>
                      </>
                    )}
                    {showFactDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>

                  {/* Status Badge */}
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-md bg-surface text-ink-muted border border-border uppercase">
                    Status: {currentAdaptation.status}
                  </span>

                  {saving && (
                    <span className="text-[11px] text-ink-muted animate-pulse">
                      Saving changes...
                    </span>
                  )}
                </div>

                {/* Character Counter */}
                <div className="text-right">
                  <span
                    className={`text-xs font-bold ${
                      isOverLimit
                        ? "text-rose-500 font-extrabold"
                        : isNearLimit
                        ? "text-amber-500"
                        : "text-ink-muted"
                    }`}
                  >
                    {charCount.current} / {charCount.max} characters
                  </span>
                  {isOverLimit && <p className="text-[10px] text-rose-500">Exceeds recommended limit</p>}
                </div>
              </div>

              {/* Brand Check Details Accordion */}
              {showFactDetails && (
                <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-border text-xs space-y-2 shadow-subtle">
                  <h4 className="font-bold text-navy flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-teal" />
                    Fact Preservation & Brand Audit Details
                  </h4>
                  <p className="text-ink-secondary leading-relaxed">
                    {currentAdaptation.brand_check_details?.details || "All source metrics and facts preserved."}
                  </p>
                  {currentAdaptation.brand_check_details?.missing_facts &&
                    currentAdaptation.brand_check_details.missing_facts.length > 0 && (
                      <div className="text-amber-600 dark:text-amber-400 text-[11px]">
                        <strong>Missing Source Facts:</strong>{" "}
                        {currentAdaptation.brand_check_details.missing_facts.join(", ")}
                      </div>
                    )}
                  {currentAdaptation.brand_check_details?.added_facts &&
                    currentAdaptation.brand_check_details.added_facts.length > 0 && (
                      <div className="text-rose-600 dark:text-rose-400 text-[11px]">
                        <strong>New Unverified Facts:</strong>{" "}
                        {currentAdaptation.brand_check_details.added_facts.join(", ")}
                      </div>
                    )}
                </div>
              )}

              {/* Editable Fields Per Platform (Auto-saved on blur with debounce) */}
              <div className="space-y-4">
                {currentAdaptation.platform === "instagram" && (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-navy">
                        Caption Copy
                      </label>
                      <textarea
                        rows={6}
                        value={currentAdaptation.content.caption || ""}
                        onChange={(e) => handleContentChange("caption", e.target.value)}
                        onBlur={debouncedSaveEdit}
                        aria-label="Instagram caption"
                        className="w-full p-3.5 text-xs rounded-xl border border-border bg-workspace text-navy placeholder:text-ink-muted focus:outline-none focus:border-teal font-mono leading-relaxed"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-navy">
                        Hashtags
                      </label>
                      <input
                        type="text"
                        value={
                          Array.isArray(currentAdaptation.content.hashtags)
                            ? currentAdaptation.content.hashtags.join(" ")
                            : currentAdaptation.content.hashtags || ""
                        }
                        onChange={(e) => handleContentChange("hashtags", e.target.value.split(" "))}
                        onBlur={debouncedSaveEdit}
                        aria-label="Instagram hashtags"
                        className="w-full p-3 text-xs rounded-xl border border-border bg-workspace text-navy placeholder:text-ink-muted focus:outline-none focus:border-teal"
                      />
                    </div>
                  </>
                )}

                {currentAdaptation.platform === "linkedin" && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-navy">
                      LinkedIn Post Content
                    </label>
                    <textarea
                      rows={8}
                      value={currentAdaptation.content.post || ""}
                      onChange={(e) => handleContentChange("post", e.target.value)}
                      onBlur={debouncedSaveEdit}
                      aria-label="LinkedIn post copy"
                      className="w-full p-3.5 text-xs rounded-xl border border-border bg-workspace text-navy placeholder:text-ink-muted focus:outline-none focus:border-teal font-mono leading-relaxed"
                    />
                  </div>
                )}

                {currentAdaptation.platform === "youtube" && (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-navy">
                        Video Title (Max 100 chars)
                      </label>
                      <input
                        type="text"
                        maxLength={100}
                        value={currentAdaptation.content.title || ""}
                        onChange={(e) => handleContentChange("title", e.target.value)}
                        onBlur={debouncedSaveEdit}
                        aria-label="YouTube video title"
                        className="w-full p-3 text-xs rounded-xl border border-border bg-workspace text-navy placeholder:text-ink-muted focus:outline-none focus:border-teal"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-navy">
                        Description & Timestamps
                      </label>
                      <textarea
                        rows={6}
                        value={currentAdaptation.content.description || ""}
                        onChange={(e) => handleContentChange("description", e.target.value)}
                        onBlur={debouncedSaveEdit}
                        aria-label="YouTube description"
                        className="w-full p-3.5 text-xs rounded-xl border border-border bg-workspace text-navy placeholder:text-ink-muted focus:outline-none focus:border-teal font-mono leading-relaxed"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-navy">
                        Search Tags (comma-separated)
                      </label>
                      <input
                        type="text"
                        value={
                          Array.isArray(currentAdaptation.content.tags)
                            ? currentAdaptation.content.tags.join(", ")
                            : currentAdaptation.content.tags || ""
                        }
                        onChange={(e) =>
                          handleContentChange(
                            "tags",
                            e.target.value.split(",").map((t) => t.trim())
                          )
                        }
                        onBlur={debouncedSaveEdit}
                        aria-label="YouTube tags"
                        className="w-full p-3 text-xs rounded-xl border border-border bg-workspace text-navy placeholder:text-ink-muted focus:outline-none focus:border-teal"
                      />
                    </div>
                  </>
                )}

                {currentAdaptation.platform === "website" && (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-navy">
                        H1 Value Headline
                      </label>
                      <input
                        type="text"
                        value={currentAdaptation.content.headline || ""}
                        onChange={(e) => handleContentChange("headline", e.target.value)}
                        onBlur={debouncedSaveEdit}
                        aria-label="Website headline"
                        className="w-full p-3 text-xs rounded-xl border border-border bg-workspace text-navy placeholder:text-ink-muted focus:outline-none focus:border-teal"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-navy">
                        SEO Meta Description (Under 160 chars)
                      </label>
                      <input
                        type="text"
                        maxLength={160}
                        value={currentAdaptation.content.meta_description || ""}
                        onChange={(e) => handleContentChange("meta_description", e.target.value)}
                        onBlur={debouncedSaveEdit}
                        aria-label="Website meta description"
                        className="w-full p-3 text-xs rounded-xl border border-border bg-workspace text-navy placeholder:text-ink-muted focus:outline-none focus:border-teal"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-navy">
                        Web Copy Body
                      </label>
                      <textarea
                        rows={6}
                        value={currentAdaptation.content.body || ""}
                        onChange={(e) => handleContentChange("body", e.target.value)}
                        onBlur={debouncedSaveEdit}
                        aria-label="Website body text"
                        className="w-full p-3.5 text-xs rounded-xl border border-border bg-workspace text-navy placeholder:text-ink-muted focus:outline-none focus:border-teal font-mono leading-relaxed"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Toolbar */}
        {adaptations.length > 0 && currentAdaptation && (
          <div className="p-4 sm:p-5 border-t border-border bg-[var(--bg-elevated)] flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopy}
                aria-label="Copy adapted text to clipboard"
                className="px-3.5 py-2 rounded-xl text-xs font-bold border border-border bg-surface text-navy hover:bg-[var(--bg-hover)] transition flex items-center gap-1.5 shadow-subtle"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-status-success" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Copied!" : "Copy"}</span>
              </button>

              <button
                type="button"
                onClick={handleRegenerate}
                disabled={regenerating}
                aria-label="Regenerate this platform variant"
                className="px-3.5 py-2 rounded-xl text-xs font-bold border border-border bg-surface text-navy hover:bg-[var(--bg-hover)] disabled:opacity-50 transition flex items-center gap-1.5 shadow-subtle"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${regenerating ? "animate-spin" : ""}`} />
                <span>{regenerating ? "Regenerating..." : "Regenerate"}</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSubmitForReview}
                disabled={submitting || currentAdaptation.status === "submitted"}
                aria-label="Submit variant for formal review"
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-teal hover:bg-teal-hover disabled:opacity-50 transition shadow-subtle flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>
                      {currentAdaptation.status === "submitted" ? "Submitted for Review" : "Submit for Review"}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
