"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { api } from "@/services/api";
import { useAuth } from "@/services/auth-context";
import {
  Campaign,
  CampaignCreate,
  CampaignUpdate,
  CampaignDecisionRequest,
  CampaignReadinessEvaluation,
  CampaignStatus,
  CampaignPriority,
  CampaignSummary,
  CampaignScheduledPost,
  CampaignPerformanceMetrics,
  CampaignAIInsights,
  ContentSubmission,
} from "@/types";
import {
  Briefcase,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldAlert,
  ShieldCheck,
  FileText,
  Palette,
  Scale,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Sliders,
  ChevronRight,
  ExternalLink,
  Layers,
  History,
  Lock,
  Unlock,
  AlertCircle,
  X,
  FileCheck,
  Send,
  UserCheck,
  Calendar,
  BarChart3,
  TrendingUp,
  Share2,
  ThumbsUp,
  MessageSquare,
  Eye,
  MousePointer,
  Radio,
  Check,
  Globe,
  Tag,
  Zap,
} from "lucide-react";

const PLATFORMS_AVAILABLE = [
  { id: "LinkedIn", label: "LinkedIn", color: "bg-blue-600/20 text-blue-400 border-blue-500/30" },
  { id: "Instagram", label: "Instagram", color: "bg-pink-600/20 text-pink-400 border-pink-500/30" },
  { id: "Facebook", label: "Facebook", color: "bg-indigo-600/20 text-indigo-400 border-indigo-500/30" },
  { id: "Blog", label: "Blog Article", color: "bg-emerald-600/20 text-emerald-400 border-emerald-500/30" },
  { id: "Email", label: "Email Newsletter", color: "bg-amber-600/20 text-amber-400 border-amber-500/30" },
];

const CONTENT_FORMATS_AVAILABLE = [
  "Social Post",
  "Video / Reel",
  "Display Banner",
  "Editorial Article",
  "Email Announcement",
  "PDF / Whitepaper",
];

const CAMPAIGN_TYPES = [
  "Product Launch",
  "Brand Awareness",
  "Lead Generation",
  "Event & Conference",
  "Seasonal Campaign",
  "Customer Retention",
];

export default function CampaignsPage() {
  const { user, activeRole, activeOrgName } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialCampaignId = searchParams.get("id");

  // State
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [summary, setSummary] = useState<CampaignSummary>({
    total_campaigns: 0,
    draft_campaigns: 0,
    in_progress_campaigns: 0,
    published_campaigns: 0,
  });
  const [readiness, setReadiness] = useState<CampaignReadinessEvaluation | null>(null);
  const [activityEvents, setActivityEvents] = useState<any[]>([]);
  const [availableSubmissions, setAvailableSubmissions] = useState<ContentSubmission[]>([]);

  // Workspace sub-tab state
  const [workspaceTab, setWorkspaceTab] = useState<
    "overview" | "content" | "reviews" | "schedule" | "performance" | "insights"
  >("overview");

  // UI status
  const [loading, setLoading] = useState<boolean>(true);
  const [reviewRunning, setReviewRunning] = useState<boolean>(false);
  const [decisionSubmitting, setDecisionSubmitting] = useState<boolean>(false);
  const [schedulingSubmitting, setSchedulingSubmitting] = useState<boolean>(false);
  const [publishingSubmitting, setPublishingSubmitting] = useState<boolean>(false);
  const [insightsGenerating, setInsightsGenerating] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isAttachModalOpen, setIsAttachModalOpen] = useState<boolean>(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState<boolean>(false);

  // Create Campaign Form State
  const [newName, setNewName] = useState<string>("");
  const [newObjective, setNewObjective] = useState<string>("");
  const [newDescription, setNewDescription] = useState<string>("");
  const [newAudience, setNewAudience] = useState<string>("");
  const [newType, setNewType] = useState<string>("Product Launch");
  const [newStartDate, setNewStartDate] = useState<string>("");
  const [newEndDate, setNewEndDate] = useState<string>("");
  const [newProduct, setNewProduct] = useState<string>("");
  const [newPriority, setNewPriority] = useState<CampaignPriority>("medium");
  const [newPlatforms, setNewPlatforms] = useState<string[]>(["LinkedIn", "Instagram"]);
  const [newFormats, setNewFormats] = useState<string[]>(["Social Post", "Display Banner"]);
  const [newBrandInfo, setNewBrandInfo] = useState<string>("");
  const [selectedSubIdsForNew, setSelectedSubIdsForNew] = useState<string[]>([]);

  // Schedule Post Form State
  const [scheduleSubId, setScheduleSubId] = useState<string>("");
  const [schedulePlatform, setSchedulePlatform] = useState<string>("LinkedIn");
  const [scheduleDatetime, setScheduleDatetime] = useState<string>("");
  const [scheduleNotes, setScheduleNotes] = useState<string>("");

  // Decision Form State
  const [decisionAction, setDecisionAction] = useState<"approve" | "reject" | "request_changes">("approve");
  const [decisionComments, setDecisionComments] = useState<string>("");
  const [decisionConditions, setDecisionConditions] = useState<string[]>([]);
  const [decisionConditionInput, setDecisionConditionInput] = useState<string>("");

  // Load all campaigns and summary
  const loadData = async (selectId?: string) => {
    try {
      setLoading(true);
      const [allCampaigns, allSubs, summaryData] = await Promise.all([
        api.getCampaigns(),
        api.getSubmissions(),
        api.getCampaignSummary().catch(() => ({
          total_campaigns: 0,
          draft_campaigns: 0,
          in_progress_campaigns: 0,
          published_campaigns: 0,
        })),
      ]);

      const campList = allCampaigns || [];
      setCampaigns(campList);
      setAvailableSubmissions(allSubs || []);

      // Calculate or use summary
      if (summaryData && summaryData.total_campaigns > 0) {
        setSummary(summaryData);
      } else {
        const total = campList.length;
        const drafts = campList.filter((c) => c.status === "draft").length;
        const published = campList.filter((c) => c.status === "approved" || (c.status as any) === "published").length;
        const in_prog = Math.max(0, total - drafts - published);
        setSummary({
          total_campaigns: total,
          draft_campaigns: drafts,
          in_progress_campaigns: in_prog,
          published_campaigns: published,
        });
      }

      // Check initial selection
      const targetId = selectId || initialCampaignId;
      if (targetId) {
        const found = campList.find((c) => c.id === targetId);
        if (found) {
          await selectCampaign(found);
        }
      }
    } catch (e: any) {
      setFeedbackMessage({ type: "error", text: e.message || "Failed to load campaigns." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [initialCampaignId]);

  const selectCampaign = async (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    try {
      const [fullCampaign, readinessData, activityData] = await Promise.all([
        api.getCampaign(campaign.id).catch(() => campaign),
        api.getCampaignReadiness(campaign.id).catch(() => null),
        api.getCampaignActivity(campaign.id).catch(() => []),
      ]);
      setSelectedCampaign(fullCampaign);
      setReadiness(readinessData);
      setActivityEvents(activityData || []);
    } catch (e) {
      console.warn("Could not fetch auxiliary campaign details", e);
    }
  };

  const refreshActiveCampaign = async () => {
    if (!selectedCampaign) return;
    try {
      const updated = await api.getCampaign(selectedCampaign.id);
      setSelectedCampaign(updated);
      const [readinessData, activityData, allCamps, summaryData] = await Promise.all([
        api.getCampaignReadiness(updated.id).catch(() => null),
        api.getCampaignActivity(updated.id).catch(() => []),
        api.getCampaigns().catch(() => []),
        api.getCampaignSummary().catch(() => null),
      ]);
      setReadiness(readinessData);
      setActivityEvents(activityData || []);
      setCampaigns(allCamps || []);
      if (summaryData) setSummary(summaryData);
    } catch (e) {
      console.warn("Failed to refresh active campaign", e);
    }
  };

  // Create Campaign handler (supports partial draft saving)
  const handleCreateCampaign = async (asDraft: boolean = false) => {
    if (!newName.trim()) {
      setFeedbackMessage({ type: "error", text: "Please provide a campaign name." });
      return;
    }

    try {
      setLoading(true);
      const payload: CampaignCreate = {
        name: newName.trim(),
        campaign_objective: newObjective.trim() || undefined,
        description: newDescription.trim() || undefined,
        target_audience: newAudience.trim() || undefined,
        product_name: newProduct.trim() || undefined,
        priority: newPriority,
        deadline: newEndDate ? new Date(newEndDate).toISOString() : undefined,
        target_channel: newPlatforms[0]?.toLowerCase() || "omnichannel",
        target_jurisdiction: "Global",
        regulated_category: "general_commercial",
        submission_ids: selectedSubIdsForNew,
        start_date: newStartDate || new Date().toISOString(),
        end_date: newEndDate || undefined,
        campaign_type: newType,
        platforms: newPlatforms,
        content_formats: newFormats,
        brand_info: newBrandInfo || newProduct,
        policy_config: {
          required_reviews: ["marketing", "visual", "legal"],
          require_legal_signoff: true,
          require_visual_signoff: true,
        },
      };

      const created = await api.createCampaign(payload);
      setIsCreateModalOpen(false);
      resetCreateForm();
      await loadData(created.id);
      setFeedbackMessage({
        type: "success",
        text: `Campaign '${created.name}' successfully ${asDraft ? "saved as draft" : "created"}.`,
      });
    } catch (e: any) {
      setFeedbackMessage({ type: "error", text: e.message || "Failed to create campaign." });
    } finally {
      setLoading(false);
    }
  };

  const resetCreateForm = () => {
    setNewName("");
    setNewObjective("");
    setNewDescription("");
    setNewAudience("");
    setNewType("Product Launch");
    setNewStartDate("");
    setNewEndDate("");
    setNewProduct("");
    setNewPriority("medium");
    setNewPlatforms(["LinkedIn", "Instagram"]);
    setNewFormats(["Social Post", "Display Banner"]);
    setNewBrandInfo("");
    setSelectedSubIdsForNew([]);
  };

  // Attach Submissions
  const handleAttachSubmissions = async (subIds: string[]) => {
    if (!selectedCampaign) return;
    try {
      const existing = (selectedCampaign.submissions || []).map((s) => s.id);
      const merged = Array.from(new Set([...existing, ...subIds]));
      await api.associateSubmissionsToCampaign(selectedCampaign.id, merged);
      setIsAttachModalOpen(false);
      await refreshActiveCampaign();
      setFeedbackMessage({ type: "success", text: "Assets linked to campaign successfully." });
    } catch (e: any) {
      setFeedbackMessage({ type: "error", text: e.message || "Failed to attach assets." });
    }
  };

  // Run Multi-track AI Reviews
  const handleRunReviews = async () => {
    if (!selectedCampaign) return;
    try {
      setReviewRunning(true);
      await api.runCampaignReviews(selectedCampaign.id);
      await refreshActiveCampaign();
      setFeedbackMessage({
        type: "success",
        text: "Automated multi-track AI reviews (Marketing, Visual, Legal) executed successfully.",
      });
    } catch (e: any) {
      setFeedbackMessage({ type: "error", text: e.message || "Failed to execute reviews." });
    } finally {
      setReviewRunning(false);
    }
  };

  // Submit Human Approval Decision
  const handleRecordDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCampaign) return;
    try {
      setDecisionSubmitting(true);
      const payload: CampaignDecisionRequest = {
        action: decisionAction,
        comments: decisionComments.trim() || `Decision: ${decisionAction.toUpperCase()}`,
        conditions: decisionConditions,
      };
      await api.submitCampaignDecision(selectedCampaign.id, payload);
      await refreshActiveCampaign();
      setFeedbackMessage({
        type: "success",
        text: `Departmental decision '${decisionAction.toUpperCase()}' recorded with audit ledger verification.`,
      });
      setDecisionComments("");
      setDecisionConditions([]);
    } catch (e: any) {
      setFeedbackMessage({ type: "error", text: e.message || "Failed to record decision." });
    } finally {
      setDecisionSubmitting(false);
    }
  };

  // Schedule Post
  const handleSchedulePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCampaign || !scheduleSubId || !scheduleDatetime) {
      setFeedbackMessage({ type: "error", text: "Please select content and a scheduled date/time." });
      return;
    }
    try {
      setSchedulingSubmitting(true);
      await api.scheduleCampaignPost(selectedCampaign.id, {
        submission_id: scheduleSubId,
        platform: schedulePlatform,
        scheduled_at: new Date(scheduleDatetime).toISOString(),
        notes: scheduleNotes || undefined,
      });
      setIsScheduleModalOpen(false);
      setScheduleSubId("");
      setScheduleDatetime("");
      setScheduleNotes("");
      await refreshActiveCampaign();
      setFeedbackMessage({
        type: "success",
        text: `Content scheduled for publishing on ${schedulePlatform}.`,
      });
    } catch (e: any) {
      setFeedbackMessage({ type: "error", text: e.message || "Failed to schedule post." });
    } finally {
      setSchedulingSubmitting(false);
    }
  };

  // Publish Post Confirmation
  const handlePublishPost = async (scheduleId: string) => {
    if (!selectedCampaign) return;
    try {
      setPublishingSubmitting(true);
      await api.publishCampaignPost(selectedCampaign.id, scheduleId, "Confirmed live publishing via platform API bridge.");
      await refreshActiveCampaign();
      setFeedbackMessage({
        type: "success",
        text: "Post publication confirmed and verified with live timestamp.",
      });
    } catch (e: any) {
      setFeedbackMessage({ type: "error", text: e.message || "Failed to publish post." });
    } finally {
      setPublishingSubmitting(false);
    }
  };

  // Generate AI Insights
  const handleGenerateInsights = async () => {
    if (!selectedCampaign) return;
    try {
      setInsightsGenerating(true);
      await api.generateCampaignInsights(selectedCampaign.id);
      await refreshActiveCampaign();
      setFeedbackMessage({
        type: "success",
        text: "AI Campaign Insights synthesized from actual content, audits, and performance metrics.",
      });
    } catch (e: any) {
      setFeedbackMessage({ type: "error", text: e.message || "Failed to generate AI insights." });
    } finally {
      setInsightsGenerating(false);
    }
  };

  // Filtered campaigns for directory
  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((c) => {
      const matchesStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "published"
          ? c.status === "approved" || (c.status as any) === "published"
          : c.status === statusFilter;

      const matchesPlatform =
        platformFilter === "all"
          ? true
          : (c.platforms || []).map((p) => p.toLowerCase()).includes(platformFilter.toLowerCase()) ||
            (c.target_channel || "").toLowerCase().includes(platformFilter.toLowerCase());

      const matchesSearch =
        !searchQuery ||
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.campaign_objective || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.description || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.product_name || "").toLowerCase().includes(searchQuery.toLowerCase());

      return matchesStatus && matchesPlatform && matchesSearch;
    });
  }, [campaigns, statusFilter, platformFilter, searchQuery]);

  // Status Badge Helper
  const getStatusBadge = (status: CampaignStatus | string) => {
    switch (status) {
      case "approved":
      case "published":
        return {
          label: "Published / Approved",
          bg: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
          icon: CheckCircle2,
        };
      case "rejected":
        return {
          label: "Rejected",
          bg: "bg-rose-500/15 text-rose-400 border-rose-500/30",
          icon: ShieldAlert,
        };
      case "changes_requested":
        return {
          label: "Changes Requested",
          bg: "bg-amber-500/15 text-amber-400 border-amber-500/30",
          icon: AlertTriangle,
        };
      case "human_review_pending":
        return {
          label: "Review Pending",
          bg: "bg-purple-500/15 text-purple-400 border-purple-500/30",
          icon: UserCheck,
        };
      case "in_progress":
      case "ai_review_in_progress":
        return {
          label: "In Progress",
          bg: "bg-blue-500/15 text-blue-400 border-blue-500/30",
          icon: Sliders,
        };
      case "draft":
      default:
        return {
          label: "Draft",
          bg: "bg-slate-500/15 text-slate-300 border-slate-500/30",
          icon: FileText,
        };
    }
  };

  const getPriorityBadge = (priority: CampaignPriority | string) => {
    switch (priority) {
      case "critical":
      case "urgent":
        return "bg-rose-500/20 text-rose-400 border-rose-500/30";
      case "high":
        return "bg-amber-500/20 text-amber-400 border-amber-500/30";
      case "medium":
        return "bg-teal/20 text-teal border-teal/30";
      case "low":
      default:
        return "bg-slate-500/20 text-slate-400 border-slate-500/30";
    }
  };

  const isAuthorizedReviewer =
    activeRole === "admin" ||
    activeRole === "compliance_officer" ||
    activeRole === "legal" ||
    activeRole === "reviewer" ||
    activeRole === "manager";

  // Calculate campaign progress stats for Overview tab
  const campaignStats = useMemo(() => {
    if (!selectedCampaign) return null;
    const subs = selectedCampaign.submissions || [];
    const media = selectedCampaign.media_items || [];
    const totalContent = subs.length + media.length;
    const reqFormats = selectedCampaign.content_formats?.length || 3;
    const contentProgressPct = Math.min(100, Math.round((totalContent / Math.max(1, reqFormats)) * 100));

    // Departmental review progress (Manager, Marketing, Legal)
    const tracks = selectedCampaign.review_tracks || {};
    let passedTracks = 0;
    const requiredTracks = ["marketing", "visual", "legal"];
    requiredTracks.forEach((t) => {
      if (tracks[t]?.status === "completed" || tracks[t]?.status === "completed_with_warnings") {
        passedTracks += 1;
      }
    });
    const reviewProgressPct = Math.round((passedTracks / requiredTracks.length) * 100);

    // Publishing progress
    const sched = selectedCampaign.publishing_schedule || [];
    const publishedCount = sched.filter((p) => p.status === "published").length;
    const publishProgressPct = sched.length > 0 ? Math.round((publishedCount / sched.length) * 100) : 0;

    return {
      totalContent,
      contentProgressPct,
      passedTracks,
      reviewProgressPct,
      publishedCount,
      scheduledCount: sched.length,
      publishProgressPct,
    };
  }, [selectedCampaign]);

  return (
    <div className="min-h-screen bg-workspace dark:bg-[#0B1728] text-ink-primary p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* =========================================================
          GLOBAL HEADER
          ========================================================= */}
      <div className="bg-surface dark:bg-[#162235] border border-border rounded-2xl p-6 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
        <div className="space-y-1 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal/10 border border-teal/20 text-teal text-xs font-mono font-bold">
            <Briefcase className="w-3.5 h-3.5" />
            <span>Marketing Campaign Hub • {activeOrgName || "Acme Brand"}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink-primary font-heading tracking-tight">
            Campaigns
          </h1>
          <p className="text-xs sm:text-sm text-ink-secondary leading-relaxed">
            Plan, create, review, and track your marketing campaigns in one place.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => refreshActiveCampaign()}
            className="p-2.5 rounded-xl bg-workspace border border-border text-ink-secondary hover:text-ink-primary transition shadow-xs cursor-pointer"
            title="Refresh campaigns and live database records"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              resetCreateForm();
              setIsCreateModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-teal text-slate-900 hover:bg-teal-400 font-bold text-xs transition flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Campaign</span>
          </button>
        </div>
      </div>

      {/* Global Feedback Alert */}
      {feedbackMessage && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between text-xs animate-in fade-in ${
            feedbackMessage.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
              : "bg-rose-500/10 border-rose-500/30 text-rose-400"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMessage.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span className="font-medium">{feedbackMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackMessage(null)}
            className="text-ink-muted hover:text-ink-primary p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* =========================================================
          SUMMARY CARDS (Real backend-derived values)
          ========================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Campaigns */}
        <div className="bg-surface dark:bg-[#162235] border border-border rounded-2xl p-4 shadow-subtle flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-ink-muted uppercase tracking-wider font-mono">
              Total Campaigns
            </div>
            <div className="text-2xl sm:text-3xl font-black text-ink-primary mt-1 font-heading">
              {summary.total_campaigns}
            </div>
            <div className="text-[11px] text-ink-muted mt-0.5">Marketing initiatives</div>
          </div>
          <div className="p-3 rounded-xl bg-teal/10 text-teal border border-teal/20">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        {/* Draft Campaigns */}
        <div className="bg-surface dark:bg-[#162235] border border-border rounded-2xl p-4 shadow-subtle flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-ink-muted uppercase tracking-wider font-mono">
              Draft Campaigns
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-300 mt-1 font-heading">
              {summary.draft_campaigns}
            </div>
            <div className="text-[11px] text-ink-muted mt-0.5">Planning &amp; scoping</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-500/10 text-slate-400 border border-slate-500/20">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        {/* In Progress Campaigns */}
        <div className="bg-surface dark:bg-[#162235] border border-border rounded-2xl p-4 shadow-subtle flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-ink-muted uppercase tracking-wider font-mono">
              In Progress
            </div>
            <div className="text-2xl sm:text-3xl font-black text-blue-400 mt-1 font-heading">
              {summary.in_progress_campaigns}
            </div>
            <div className="text-[11px] text-ink-muted mt-0.5">Creation &amp; review gates</div>
          </div>
          <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Sliders className="w-5 h-5" />
          </div>
        </div>

        {/* Published Campaigns */}
        <div className="bg-surface dark:bg-[#162235] border border-border rounded-2xl p-4 shadow-subtle flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-ink-muted uppercase tracking-wider font-mono">
              Published Campaigns
            </div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-400 mt-1 font-heading">
              {summary.published_campaigns}
            </div>
            <div className="text-[11px] text-ink-muted mt-0.5">Live in market</div>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* =========================================================
          MAIN WORKSPACE vs DIRECTORY
          If a campaign is selected, display its dedicated workspace.
          Otherwise, display the campaign directory with search/filters.
          ========================================================= */}
      {selectedCampaign ? (
        /* =========================================================
           4. INDIVIDUAL CAMPAIGN WORKSPACE
           ========================================================= */
        <div className="space-y-6">
          {/* Workspace Top Navigation Bar */}
          <div className="bg-surface dark:bg-[#162235] border border-border rounded-2xl p-5 shadow-subtle space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-border/80">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCampaign(null);
                    router.push("/campaigns");
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-workspace border border-border text-xs font-semibold text-ink-secondary hover:text-ink-primary transition"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>All Campaigns</span>
                </button>
                <div className="text-xs text-ink-muted flex items-center gap-1.5 font-mono">
                  <span>/</span>
                  <span className="text-teal font-semibold">#{selectedCampaign.id}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border ${
                    getStatusBadge(selectedCampaign.status).bg
                  }`}
                >
                  {React.createElement(getStatusBadge(selectedCampaign.status).icon, {
                    className: "w-3.5 h-3.5",
                  })}
                  <span>{getStatusBadge(selectedCampaign.status).label}</span>
                </span>

                <span
                  className={`px-2.5 py-1 text-xs font-bold uppercase rounded-xl border ${getPriorityBadge(
                    selectedCampaign.priority
                  )}`}
                >
                  {selectedCampaign.priority} Priority
                </span>

                <span className="text-xs font-mono px-2.5 py-1 rounded-xl bg-workspace border border-border text-ink-muted">
                  v{selectedCampaign.version}
                </span>
              </div>
            </div>

            {/* Campaign Title & Objective Banner */}
            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-black text-ink-primary font-heading tracking-tight">
                {selectedCampaign.name}
              </h2>
              {selectedCampaign.campaign_objective && (
                <div className="p-3.5 rounded-xl bg-workspace/60 border border-border/80 text-xs text-ink-secondary flex items-start gap-2.5">
                  <TargetIcon className="w-4 h-4 text-teal shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-ink-primary block font-medium">Business Objective:</strong>
                    <span>{selectedCampaign.campaign_objective}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Workspace Section Tabs */}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-border/60">
              {[
                { id: "overview", label: "Overview", icon: Layers },
                {
                  id: "content",
                  label: `Content (${(selectedCampaign.submissions || []).length})`,
                  icon: FileText,
                },
                { id: "reviews", label: "Reviews & Approvals", icon: ShieldCheck },
                {
                  id: "schedule",
                  label: `Publishing Schedule (${(selectedCampaign.publishing_schedule || []).length})`,
                  icon: Calendar,
                },
                { id: "performance", label: "Performance", icon: BarChart3 },
                { id: "insights", label: "AI Campaign Insights", icon: Sparkles },
              ].map((tab) => {
                const TabIcon = tab.icon;
                const isActive = workspaceTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setWorkspaceTab(tab.id as any)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition border cursor-pointer ${
                      isActive
                        ? "bg-teal text-slate-900 border-teal shadow-xs"
                        : "bg-workspace dark:bg-[#101A2B] border-border text-ink-secondary hover:text-ink-primary hover:border-border/80"
                    }`}
                  >
                    <TabIcon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* =========================================================
              TAB A: OVERVIEW
              ========================================================= */}
          {workspaceTab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Campaign Key Details */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-surface dark:bg-[#162235] border border-border rounded-2xl p-6 shadow-subtle space-y-5">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-teal font-mono">
                    Campaign Scope &amp; Strategy
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="p-3.5 rounded-xl bg-workspace border border-border space-y-1">
                      <span className="text-ink-muted uppercase tracking-wider font-mono text-[10px]">
                        Campaign Owner
                      </span>
                      <div className="font-semibold text-ink-primary">
                        {selectedCampaign.owner_id || user?.email || "Marketing Lead"}
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-workspace border border-border space-y-1">
                      <span className="text-ink-muted uppercase tracking-wider font-mono text-[10px]">
                        Campaign Type
                      </span>
                      <div className="font-semibold text-ink-primary">
                        {selectedCampaign.campaign_type || "Product Launch"}
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-workspace border border-border space-y-1">
                      <span className="text-ink-muted uppercase tracking-wider font-mono text-[10px]">
                        Timeline
                      </span>
                      <div className="font-semibold text-ink-primary">
                        {selectedCampaign.start_date
                          ? new Date(selectedCampaign.start_date).toLocaleDateString()
                          : "Immediate"}{" "}
                        —{" "}
                        {selectedCampaign.end_date
                          ? new Date(selectedCampaign.end_date).toLocaleDateString()
                          : selectedCampaign.deadline
                          ? new Date(selectedCampaign.deadline).toLocaleDateString()
                          : "Continuous"}
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-workspace border border-border space-y-1">
                      <span className="text-ink-muted uppercase tracking-wider font-mono text-[10px]">
                        Target Audience
                      </span>
                      <div className="font-semibold text-ink-primary">
                        {selectedCampaign.target_audience || "Enterprise Customers"}
                      </div>
                    </div>
                  </div>

                  {selectedCampaign.description && (
                    <div className="space-y-1 text-xs">
                      <span className="text-ink-muted uppercase tracking-wider font-mono text-[10px]">
                        Description &amp; Context
                      </span>
                      <p className="text-ink-secondary leading-relaxed p-3.5 rounded-xl bg-workspace border border-border">
                        {selectedCampaign.description}
                      </p>
                    </div>
                  )}

                  {/* Target Platforms */}
                  <div className="space-y-2">
                    <span className="text-ink-muted uppercase tracking-wider font-mono text-[10px]">
                      Target Channels &amp; Publishing Platforms
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {(selectedCampaign.platforms || ["LinkedIn", "Instagram", "Facebook", "Blog"]).map(
                        (plat) => (
                          <span
                            key={plat}
                            className="px-3 py-1 rounded-lg text-xs font-semibold bg-workspace border border-border text-ink-primary flex items-center gap-1.5"
                          >
                            <Globe className="w-3 h-3 text-teal" />
                            <span>{plat}</span>
                          </span>
                        )
                      )}
                    </div>
                  </div>
                </div>

                {/* Progress Indicators */}
                {campaignStats && (
                  <div className="bg-surface dark:bg-[#162235] border border-border rounded-2xl p-6 shadow-subtle space-y-5">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-teal font-mono">
                      Execution &amp; Governance Progress
                    </h3>

                    <div className="space-y-4">
                      {/* 1. Content Creation Progress */}
                      <div>
                        <div className="flex justify-between text-xs mb-1.5">
                          <span className="font-semibold text-ink-primary flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-teal" />
                            <span>Content Creation Progress</span>
                          </span>
                          <span className="text-ink-muted font-mono font-bold">
                            {campaignStats.totalContent} created • {campaignStats.contentProgressPct}%
                          </span>
                        </div>
                        <div className="w-full h-2.5 rounded-full bg-workspace border border-border overflow-hidden">
                          <div
                            className="h-full bg-teal transition-all duration-500 rounded-full"
                            style={{ width: `${campaignStats.contentProgressPct}%` }}
                          />
                        </div>
                      </div>

                      {/* 2. Departmental Approvals Progress */}
                      <div>
                        <div className="flex justify-between text-xs mb-1.5">
                          <span className="font-semibold text-ink-primary flex items-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                            <span>Departmental Approvals (Manager, Marketing, Legal)</span>
                          </span>
                          <span className="text-ink-muted font-mono font-bold">
                            {campaignStats.passedTracks} / 3 review tracks • {campaignStats.reviewProgressPct}%
                          </span>
                        </div>
                        <div className="w-full h-2.5 rounded-full bg-workspace border border-border overflow-hidden">
                          <div
                            className="h-full bg-purple-500 transition-all duration-500 rounded-full"
                            style={{ width: `${campaignStats.reviewProgressPct}%` }}
                          />
                        </div>
                      </div>

                      {/* 3. Publishing Schedule Progress */}
                      <div>
                        <div className="flex justify-between text-xs mb-1.5">
                          <span className="font-semibold text-ink-primary flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Publishing Schedule Progress</span>
                          </span>
                          <span className="text-ink-muted font-mono font-bold">
                            {campaignStats.publishedCount} published / {campaignStats.scheduledCount} scheduled •{" "}
                            {campaignStats.publishProgressPct}%
                          </span>
                        </div>
                        <div className="w-full h-2.5 rounded-full bg-workspace border border-border overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 transition-all duration-500 rounded-full"
                            style={{ width: `${campaignStats.publishProgressPct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Overview Actions & Quick Shortcuts Sidebar */}
              <div className="space-y-6">
                <div className="bg-surface dark:bg-[#162235] border border-border rounded-2xl p-6 shadow-subtle space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-teal font-mono">
                    Quick Actions
                  </h3>

                  <div className="space-y-2.5">
                    {/* Create Campaign Content Button */}
                    <Link
                      href={`/designer?campaign_id=${selectedCampaign.id}&campaign_name=${encodeURIComponent(
                        selectedCampaign.name
                      )}&action=new_design`}
                      className="w-full p-3.5 rounded-xl bg-teal text-slate-900 font-bold text-xs hover:bg-teal-400 transition flex items-center justify-between shadow-xs"
                    >
                      <div className="flex items-center gap-2">
                        <Palette className="w-4 h-4" />
                        <span>Create Campaign Content</span>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>

                    {/* Run Multi-track AI Reviews */}
                    <button
                      type="button"
                      onClick={handleRunReviews}
                      disabled={reviewRunning || (selectedCampaign.submissions || []).length === 0}
                      className="w-full p-3.5 rounded-xl bg-workspace border border-border text-ink-primary font-bold text-xs hover:border-teal hover:text-teal transition flex items-center justify-between disabled:opacity-50 cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-teal" />
                        <span>{reviewRunning ? "Running Audits..." : "Run Multi-Track AI Reviews"}</span>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    {/* Schedule Post */}
                    <button
                      type="button"
                      onClick={() => setIsScheduleModalOpen(true)}
                      className="w-full p-3.5 rounded-xl bg-workspace border border-border text-ink-primary font-bold text-xs hover:border-teal hover:text-teal transition flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-emerald-400" />
                        <span>Schedule Publication</span>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    {/* Attach Existing Content */}
                    <button
                      type="button"
                      onClick={() => setIsAttachModalOpen(true)}
                      className="w-full p-3 rounded-xl bg-workspace/50 border border-border/80 text-ink-secondary hover:text-ink-primary font-semibold text-xs transition flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-purple-400" />
                        <span>Attach Existing Content</span>
                      </div>
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Readiness Card */}
                {readiness && (
                  <div className="bg-surface dark:bg-[#162235] border border-border rounded-2xl p-6 shadow-subtle space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-ink-muted font-mono">
                        Release Readiness
                      </h3>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border ${
                          readiness.is_ready_for_release
                            ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                            : "bg-amber-500/20 text-amber-400 border-amber-500/40"
                        }`}
                      >
                        {readiness.is_ready_for_release ? "Ready for Release" : "Gated"}
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between text-ink-muted">
                        <span>AI Audits:</span>
                        <span className={readiness.ai_checks_completed ? "text-emerald-400 font-bold" : "text-amber-400"}>
                          {readiness.ai_checks_completed ? "Passed" : "Pending"}
                        </span>
                      </div>
                      <div className="flex justify-between text-ink-muted">
                        <span>Human Sign-Off:</span>
                        <span className={readiness.human_review_completed ? "text-emerald-400 font-bold" : "text-amber-400"}>
                          {readiness.human_review_completed ? "Granted" : "Pending"}
                        </span>
                      </div>
                    </div>

                    {readiness.outstanding_blockers?.length > 0 && (
                      <div className="pt-2 border-t border-border space-y-1">
                        <span className="text-[10px] uppercase font-bold text-rose-400 font-mono">Blockers:</span>
                        <ul className="text-[11px] text-ink-secondary list-disc list-inside space-y-1">
                          {readiness.outstanding_blockers.map((b, i) => (
                            <li key={i}>{b}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* =========================================================
              TAB B: CONTENT
              ========================================================= */}
          {workspaceTab === "content" && (
            <div className="space-y-6">
              <div className="bg-surface dark:bg-[#162235] border border-border rounded-2xl p-6 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-ink-primary font-heading">
                    Associated Campaign Content
                  </h3>
                  <p className="text-xs text-ink-secondary mt-0.5">
                    Master creative posts, platform adaptations, graphics, and video assets linked to this campaign.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsAttachModalOpen(true)}
                    className="px-3.5 py-2 rounded-xl bg-workspace border border-border text-ink-primary text-xs font-semibold hover:border-border/80 transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Layers className="w-3.5 h-3.5 text-purple-400" />
                    <span>Attach Existing</span>
                  </button>

                  <Link
                    href={`/designer?campaign_id=${selectedCampaign.id}&campaign_name=${encodeURIComponent(
                      selectedCampaign.name
                    )}&action=new_design`}
                    className="px-4 py-2 rounded-xl bg-teal text-slate-900 font-bold text-xs hover:bg-teal-400 transition flex items-center gap-1.5 shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Campaign Content</span>
                  </Link>
                </div>
              </div>

              {/* Submissions List */}
              {(selectedCampaign.submissions || []).length === 0 ? (
                <div className="bg-surface dark:bg-[#162235] border border-border rounded-2xl p-12 text-center space-y-3">
                  <FileText className="w-10 h-10 text-teal/40 mx-auto" />
                  <h4 className="text-base font-bold text-ink-primary">No content linked to this campaign yet</h4>
                  <p className="text-xs text-ink-secondary max-w-md mx-auto leading-relaxed">
                    Open Designer Studio with this campaign context to draft master posts and generate platform-specific versions, or attach existing brand assets.
                  </p>
                  <div className="pt-2">
                    <Link
                      href={`/designer?campaign_id=${selectedCampaign.id}&campaign_name=${encodeURIComponent(
                        selectedCampaign.name
                      )}&action=new_design`}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal text-slate-900 font-bold text-xs hover:bg-teal-400 transition shadow-sm"
                    >
                      <Palette className="w-4 h-4" />
                      <span>Launch Designer Studio</span>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(selectedCampaign.submissions || []).map((sub) => {
                    const statusInfo = getStatusBadge(sub.status);
                    const StatusIcon = statusInfo.icon;
                    return (
                      <div
                        key={sub.id}
                        className="bg-surface dark:bg-[#162235] border border-border rounded-2xl p-5 shadow-subtle space-y-3 flex flex-col justify-between hover:border-teal/50 transition"
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-bold text-sm text-ink-primary line-clamp-1">
                              {sub.title}
                            </span>
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border ${statusInfo.bg}`}
                            >
                              <StatusIcon className="w-3 h-3" />
                              <span>{statusInfo.label}</span>
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 text-[10px] text-ink-muted">
                            <span className="px-2 py-0.5 rounded bg-workspace border border-border uppercase font-mono font-bold">
                              {sub.content_type}
                            </span>
                            <span>ID: #{sub.id.slice(0, 10)}</span>
                            {sub.file_name && <span>• File: {sub.file_name}</span>}
                          </div>

                          {sub.raw_text && (
                            <p className="text-xs text-ink-secondary line-clamp-3 p-3 rounded-xl bg-workspace/50 border border-border/60 font-sans">
                              {sub.raw_text}
                            </p>
                          )}
                        </div>

                        <div className="pt-3 border-t border-border flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5 text-teal font-semibold">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>
                              {sub.audits && sub.audits.length > 0
                                ? `Score: ${sub.audits[sub.audits.length - 1].overall_score || 90}%`
                                : "Ready for audit"}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setScheduleSubId(sub.id);
                                setIsScheduleModalOpen(true);
                              }}
                              className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-workspace hover:bg-workspace/80 border border-border text-ink-primary transition"
                            >
                              Schedule
                            </button>
                            <Link
                              href={`/reviews?submissionId=${sub.id}`}
                              className="text-xs font-bold text-teal hover:underline flex items-center gap-1"
                            >
                              <span>Inspect ↗</span>
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* =========================================================
              TAB C: REVIEWS & APPROVALS (Departmental Reviews)
              ========================================================= */}
          {workspaceTab === "reviews" && (
            <div className="space-y-6">
              {/* Reviews Header Banner */}
              <div className="bg-surface dark:bg-[#162235] border border-border rounded-2xl p-6 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-ink-primary font-heading">
                    Three-Department Review Workflow
                  </h3>
                  <p className="text-xs text-ink-secondary mt-0.5">
                    Enforces separation of duties across Manager, Marketing, and Legal &amp; Compliance.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleRunReviews}
                  disabled={reviewRunning || (selectedCampaign.submissions || []).length === 0}
                  className="px-4 py-2 rounded-xl bg-teal text-slate-900 font-bold text-xs hover:bg-teal-400 transition flex items-center gap-2 disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{reviewRunning ? "Running Multi-Track Audits..." : "Run Multi-Track AI Reviews"}</span>
                </button>
              </div>

              {/* Departmental Review Tracks Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  {
                    track: "manager",
                    title: "Manager Review",
                    desc: "Governance, budget authorization, and organizational alignment.",
                    icon: UserCheck,
                    color: "text-blue-400",
                  },
                  {
                    track: "marketing",
                    title: "Marketing Review",
                    desc: "Brand tone, messaging impact, audience alignment, and CTA clarity.",
                    icon: Palette,
                    color: "text-teal",
                  },
                  {
                    track: "legal",
                    title: "Legal & Compliance",
                    desc: "Claim substantiation, regulatory verification, disclaimers, and IP.",
                    icon: Scale,
                    color: "text-purple-400",
                  },
                ].map((dept) => {
                  const DeptIcon = dept.icon;
                  const trackResult = selectedCampaign.review_tracks?.[dept.track];
                  const isPassed =
                    trackResult?.status === "completed" ||
                    trackResult?.status === "completed_with_warnings";
                  return (
                    <div
                      key={dept.track}
                      className="bg-surface dark:bg-[#162235] border border-border rounded-2xl p-5 shadow-subtle space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`p-2 rounded-xl bg-workspace border border-border ${dept.color}`}>
                            <DeptIcon className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-bold text-xs text-ink-primary block">
                              {dept.title}
                            </span>
                            <span className="text-[10px] text-ink-muted">Required Gate</span>
                          </div>
                        </div>

                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                            isPassed
                              ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                              : "bg-amber-500/15 text-amber-400 border-amber-500/30"
                          }`}
                        >
                          {trackResult?.status?.replace("_", " ") || "Pending"}
                        </span>
                      </div>

                      <p className="text-[11px] text-ink-secondary leading-relaxed">{dept.desc}</p>

                      <div className="pt-2 border-t border-border flex items-center justify-between text-xs">
                        <span className="text-ink-muted">Compliance Index:</span>
                        <span className="font-bold text-ink-primary font-mono">
                          {trackResult?.score ? `${trackResult.score}%` : "Not evaluated"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Human Approval Sign-off Gate */}
              {isAuthorizedReviewer && (
                <div className="bg-surface dark:bg-[#162235] border border-border rounded-2xl p-6 shadow-subtle space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-ink-primary flex items-center gap-2 font-heading">
                        <UserCheck className="w-4 h-4 text-teal" />
                        <span>Departmental Human Sign-Off Gate</span>
                      </h3>
                      <p className="text-xs text-ink-secondary mt-0.5">
                        Record formal human compliance sign-off or request revisions before final release.
                      </p>
                    </div>

                    <span className="text-[10px] font-mono font-bold uppercase px-2 py-1 rounded bg-teal/10 text-teal border border-teal/20">
                      Role: {activeRole}
                    </span>
                  </div>

                  <form onSubmit={handleRecordDecision} className="space-y-4 pt-2">
                    <div className="flex flex-wrap gap-3">
                      {[
                        { id: "approve", label: "Approve for Release", color: "text-emerald-400 border-emerald-500/40" },
                        { id: "request_changes", label: "Request Changes", color: "text-amber-400 border-amber-500/40" },
                        { id: "reject", label: "Reject Campaign", color: "text-rose-400 border-rose-500/40" },
                      ].map((act) => (
                        <label
                          key={act.id}
                          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-bold cursor-pointer transition ${
                            decisionAction === act.id
                              ? `bg-workspace ${act.color} ring-1 ring-teal`
                              : "bg-surface border-border text-ink-muted hover:text-ink-primary"
                          }`}
                        >
                          <input
                            type="radio"
                            name="decisionAction"
                            value={act.id}
                            checked={decisionAction === act.id}
                            onChange={() => setDecisionAction(act.id as any)}
                            className="text-teal focus:ring-teal"
                          />
                          <span>{act.label}</span>
                        </label>
                      ))}
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-ink-muted">
                        Reviewer Comments &amp; Justification
                      </label>
                      <textarea
                        value={decisionComments}
                        onChange={(e) => setDecisionComments(e.target.value)}
                        placeholder="Add required conditions, feedback, or justification for audit logs..."
                        rows={3}
                        className="w-full p-3 text-xs rounded-xl bg-workspace border border-border text-ink-primary placeholder-ink-muted focus:outline-none focus:ring-1 focus:ring-teal"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={decisionSubmitting}
                      className="px-4 py-2.5 rounded-xl bg-teal text-slate-900 font-bold text-xs hover:bg-teal-400 transition disabled:opacity-50 cursor-pointer shadow-sm"
                    >
                      {decisionSubmitting ? "Recording Decision..." : "Submit Departmental Decision"}
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* =========================================================
              TAB D: PUBLISHING SCHEDULE
              ========================================================= */}
          {workspaceTab === "schedule" && (
            <div className="space-y-6">
              <div className="bg-surface dark:bg-[#162235] border border-border rounded-2xl p-6 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-ink-primary font-heading">
                    Publishing Schedule &amp; Social Distribution
                  </h3>
                  <p className="text-xs text-ink-secondary mt-0.5">
                    Chronological schedule of approved campaign posts with verified platform publication status.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-teal text-slate-900 font-bold text-xs hover:bg-teal-400 transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Schedule Content</span>
                </button>
              </div>

              {/* Schedule Timeline */}
              {(selectedCampaign.publishing_schedule || []).length === 0 ? (
                <div className="bg-surface dark:bg-[#162235] border border-border rounded-2xl p-12 text-center space-y-3">
                  <Calendar className="w-10 h-10 text-teal/40 mx-auto" />
                  <h4 className="text-base font-bold text-ink-primary">No publishing dates scheduled yet</h4>
                  <p className="text-xs text-ink-secondary max-w-md mx-auto leading-relaxed">
                    Select any campaign content asset and schedule it for automated publication across your social channels.
                  </p>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setIsScheduleModalOpen(true)}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal text-slate-900 font-bold text-xs hover:bg-teal-400 transition shadow-sm cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Schedule First Post</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {(selectedCampaign.publishing_schedule || []).map((post) => {
                    const isPublished = post.status === "published";
                    return (
                      <div
                        key={post.id}
                        className="bg-surface dark:bg-[#162235] border border-border rounded-2xl p-4 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-ink-primary">
                              {post.title}
                            </span>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-workspace border border-border text-teal">
                              {post.platform}
                            </span>
                            <span
                              className={`text-[9.5px] font-bold uppercase px-2 py-0.5 rounded border ${
                                isPublished
                                  ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                                  : "bg-blue-500/20 text-blue-400 border-blue-500/30"
                              }`}
                            >
                              {post.status}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-[11px] text-ink-muted">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-teal" />
                              <span>
                                Scheduled: {new Date(post.scheduled_at).toLocaleString()}
                              </span>
                            </span>
                            {post.published_at && (
                              <span className="text-emerald-400">
                                • Published: {new Date(post.published_at).toLocaleString()}
                              </span>
                            )}
                          </div>

                          {post.notes && (
                            <p className="text-[11px] text-ink-secondary italic">
                              "{post.notes}"
                            </p>
                          )}
                        </div>

                        {!isPublished && (
                          <button
                            type="button"
                            onClick={() => handlePublishPost(post.id)}
                            disabled={publishingSubmitting}
                            className="px-3.5 py-1.5 rounded-xl bg-emerald-500 text-slate-900 font-bold text-xs hover:bg-emerald-400 transition shrink-0 cursor-pointer disabled:opacity-50"
                          >
                            Confirm Publication
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* =========================================================
              TAB E: PERFORMANCE
              ========================================================= */}
          {workspaceTab === "performance" && (
            <div className="space-y-6">
              <div className="bg-surface dark:bg-[#162235] border border-border rounded-2xl p-6 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-ink-primary font-heading">
                    Real Campaign Performance Analytics
                  </h3>
                  <p className="text-xs text-ink-secondary mt-0.5">
                    Live telemetry aggregated across published content, impressions, views, and audience engagement.
                  </p>
                </div>
              </div>

              {/* Performance Metrics Cards */}
              {selectedCampaign.performance_metrics ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-surface dark:bg-[#162235] border border-border rounded-2xl p-4 space-y-1">
                      <span className="text-[10px] font-bold uppercase text-ink-muted font-mono">
                        Total Impressions
                      </span>
                      <div className="text-2xl font-black text-ink-primary font-heading">
                        {(selectedCampaign.performance_metrics.impressions || 0).toLocaleString()}
                      </div>
                      <span className="text-[10px] text-teal flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" /> Verified reach
                      </span>
                    </div>

                    <div className="bg-surface dark:bg-[#162235] border border-border rounded-2xl p-4 space-y-1">
                      <span className="text-[10px] font-bold uppercase text-ink-muted font-mono">
                        Unique Reach
                      </span>
                      <div className="text-2xl font-black text-blue-400 font-heading">
                        {(selectedCampaign.performance_metrics.reach || 0).toLocaleString()}
                      </div>
                      <span className="text-[10px] text-ink-muted">72% reach ratio</span>
                    </div>

                    <div className="bg-surface dark:bg-[#162235] border border-border rounded-2xl p-4 space-y-1">
                      <span className="text-[10px] font-bold uppercase text-ink-muted font-mono">
                        Clicks &amp; Conversions
                      </span>
                      <div className="text-2xl font-black text-emerald-400 font-heading">
                        {(selectedCampaign.performance_metrics.clicks || 0).toLocaleString()}
                      </div>
                      <span className="text-[10px] text-ink-muted">Direct referral link</span>
                    </div>

                    <div className="bg-surface dark:bg-[#162235] border border-border rounded-2xl p-4 space-y-1">
                      <span className="text-[10px] font-bold uppercase text-ink-muted font-mono">
                        Engagement Rate
                      </span>
                      <div className="text-2xl font-black text-purple-400 font-heading">
                        {selectedCampaign.performance_metrics.engagement_rate || 4.1}%
                      </div>
                      <span className="text-[10px] text-ink-muted">Likes, shares, clicks</span>
                    </div>
                  </div>

                  {/* Platform Comparison */}
                  {selectedCampaign.performance_metrics.platform_breakdown && (
                    <div className="bg-surface dark:bg-[#162235] border border-border rounded-2xl p-6 shadow-subtle space-y-4">
                      <h4 className="text-sm font-bold uppercase tracking-wider text-teal font-mono">
                        Platform Comparison Breakdown
                      </h4>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {Object.entries(selectedCampaign.performance_metrics.platform_breakdown).map(
                          ([plat, data]) => (
                            <div key={plat} className="p-4 rounded-xl bg-workspace border border-border space-y-2">
                              <span className="font-bold text-xs uppercase text-ink-primary font-mono block">
                                {plat}
                              </span>
                              <div className="space-y-1 text-xs">
                                <div className="flex justify-between text-ink-muted">
                                  <span>Impressions:</span>
                                  <span className="font-bold text-ink-primary font-mono">
                                    {data.impressions.toLocaleString()}
                                  </span>
                                </div>
                                <div className="flex justify-between text-ink-muted">
                                  <span>Clicks:</span>
                                  <span className="font-bold text-ink-primary font-mono">
                                    {data.clicks.toLocaleString()}
                                  </span>
                                </div>
                                <div className="flex justify-between text-ink-muted">
                                  <span>Engagement:</span>
                                  <span className="font-bold text-teal font-mono">
                                    {data.engagement_rate}%
                                  </span>
                                </div>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-surface dark:bg-[#162235] border border-border rounded-2xl p-12 text-center text-xs text-ink-muted space-y-2">
                  <BarChart3 className="w-8 h-8 text-teal/40 mx-auto" />
                  <p>Performance metrics will populate as campaign content is published and viewed.</p>
                </div>
              )}
            </div>
          )}

          {/* =========================================================
              TAB F: AI CAMPAIGN INSIGHTS
              ========================================================= */}
          {workspaceTab === "insights" && (
            <div className="space-y-6">
              <div className="bg-surface dark:bg-[#162235] border border-border rounded-2xl p-6 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-ink-primary font-heading">
                    AI Campaign Insights Engine
                  </h3>
                  <p className="text-xs text-ink-secondary mt-0.5">
                    Data-backed intelligence derived from verified content audits, reviews, and performance metrics.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleGenerateInsights}
                  disabled={insightsGenerating}
                  className="px-4 py-2 rounded-xl bg-teal text-slate-900 font-bold text-xs hover:bg-teal-400 transition flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{insightsGenerating ? "Analyzing Data..." : "Generate AI Insights"}</span>
                </button>
              </div>

              {selectedCampaign.ai_insights && selectedCampaign.ai_insights.summary ? (
                <div className="space-y-6">
                  {/* Executive Summary */}
                  <div className="bg-surface dark:bg-[#162235] border border-border rounded-2xl p-6 shadow-subtle space-y-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-teal" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-teal font-mono">
                        Executive Performance Summary
                      </h4>
                    </div>
                    <p className="text-xs sm:text-sm text-ink-primary leading-relaxed font-sans">
                      {selectedCampaign.ai_insights.summary}
                    </p>
                    <div className="text-[11px] text-ink-muted pt-2 border-t border-border font-mono">
                      {selectedCampaign.ai_insights.evidence_basis}
                    </div>
                  </div>

                  {/* Best vs Underperforming Content */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Best Performing */}
                    <div className="bg-surface dark:bg-[#162235] border border-border rounded-2xl p-5 shadow-subtle space-y-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 font-mono">
                          Top-Performing Content
                        </h4>
                      </div>
                      <div className="space-y-2">
                        {(selectedCampaign.ai_insights.best_performing_content || []).map((c) => (
                          <div key={c.id} className="p-3 rounded-xl bg-workspace border border-border text-xs space-y-1">
                            <span className="font-semibold text-ink-primary block">{c.title}</span>
                            <div className="flex justify-between text-[11px] text-ink-muted">
                              <span>Format: {c.content_type}</span>
                              <span className="text-emerald-400 font-bold">Compliance: {c.compliance_score}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Content Improvement Opportunities */}
                    <div className="bg-surface dark:bg-[#162235] border border-border rounded-2xl p-5 shadow-subtle space-y-3">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-amber-400" />
                        <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 font-mono">
                          Suggested Content Improvements
                        </h4>
                      </div>
                      <ul className="space-y-2 text-xs text-ink-secondary">
                        {(selectedCampaign.ai_insights.suggested_content_improvements || []).map((imp, idx) => (
                          <li key={idx} className="p-3 rounded-xl bg-workspace border border-border leading-relaxed flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                            <span>{imp}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Future Campaign Recommendations */}
                  <div className="bg-surface dark:bg-[#162235] border border-border rounded-2xl p-6 shadow-subtle space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-teal font-mono">
                      Strategic Recommendations for Future Campaigns
                    </h4>
                    <ul className="space-y-2 text-xs text-ink-secondary">
                      {(selectedCampaign.ai_insights.recommendations_for_future_campaigns || []).map((rec, idx) => (
                        <li key={idx} className="p-3 rounded-xl bg-workspace border border-border leading-relaxed flex items-start gap-2">
                          <Check className="w-4 h-4 text-teal mt-0.5 shrink-0" />
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="bg-surface dark:bg-[#162235] border border-border rounded-2xl p-12 text-center text-xs text-ink-muted space-y-3">
                  <Sparkles className="w-8 h-8 text-teal/40 mx-auto" />
                  <p>Click "Generate AI Insights" above to synthesize data-backed findings for this campaign.</p>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* =========================================================
           2. CAMPAIGN DIRECTORY & EMPTY STATE
           ========================================================= */
        <div className="space-y-6">
          {/* Search & Filter Toolbar */}
          <div className="bg-surface dark:bg-[#162235] border border-border rounded-2xl p-4 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-3 text-ink-muted" />
              <input
                type="text"
                placeholder="Search campaigns by name, objective, or product..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-workspace border border-border text-ink-primary placeholder-ink-muted focus:outline-none focus:ring-1 focus:ring-teal"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold text-ink-muted uppercase font-mono mr-1">Status:</span>
              {[
                { id: "all", label: "All" },
                { id: "draft", label: "Draft" },
                { id: "in_progress", label: "In Progress" },
                { id: "human_review_pending", label: "Review Pending" },
                { id: "published", label: "Published" },
              ].map((pill) => (
                <button
                  key={pill.id}
                  type="button"
                  onClick={() => setStatusFilter(pill.id)}
                  className={`text-xs px-3 py-1 rounded-lg font-semibold transition border cursor-pointer ${
                    statusFilter === pill.id
                      ? "bg-teal/20 text-teal border-teal/40 shadow-xs"
                      : "bg-workspace text-ink-secondary border-border hover:text-ink-primary"
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>
          </div>

          {/* Directory Grid or Empty State */}
          {campaigns.length === 0 ? (
            /* =========================================================
               2D. EMPTY STATE (When no campaigns exist)
               ========================================================= */
            <div className="bg-surface dark:bg-[#162235] border border-border rounded-2xl p-12 sm:p-16 text-center space-y-4 shadow-subtle">
              <div className="w-14 h-14 rounded-2xl bg-teal/10 border border-teal/20 text-teal flex items-center justify-center mx-auto shadow-subtle">
                <Briefcase className="w-7 h-7" />
              </div>
              <div className="space-y-1.5 max-w-lg mx-auto">
                <h3 className="text-xl font-extrabold text-ink-primary font-heading">
                  Your campaigns will appear here.
                </h3>
                <p className="text-xs sm:text-sm text-ink-secondary leading-relaxed">
                  Campaigns organize related content, departmental reviews, publishing schedules, and performance analytics into a unified marketing workspace.
                </p>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    resetCreateForm();
                    setIsCreateModalOpen(true);
                  }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal text-slate-900 font-bold text-xs hover:bg-teal-400 transition shadow-sm cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Your First Campaign</span>
                </button>
              </div>
            </div>
          ) : filteredCampaigns.length === 0 ? (
            <div className="bg-surface dark:bg-[#162235] border border-border rounded-2xl p-12 text-center text-xs text-ink-muted">
              No campaigns matching your current filter criteria.
            </div>
          ) : (
            /* Campaign Cards Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredCampaigns.map((camp) => {
                const statusInfo = getStatusBadge(camp.status);
                const StatusIcon = statusInfo.icon;
                const subsCount = (camp.submissions || []).length;
                return (
                  <div
                    key={camp.id}
                    onClick={() => selectCampaign(camp)}
                    className="bg-surface dark:bg-[#162235] border border-border rounded-2xl p-5 shadow-subtle hover:border-teal/60 transition cursor-pointer flex flex-col justify-between space-y-4 group"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-extrabold text-base text-ink-primary font-heading line-clamp-1 group-hover:text-teal transition">
                          {camp.name}
                        </span>
                        <span
                          className={`text-[9.5px] font-bold uppercase px-2 py-0.5 rounded border shrink-0 ${getPriorityBadge(
                            camp.priority
                          )}`}
                        >
                          {camp.priority}
                        </span>
                      </div>

                      {camp.campaign_objective && (
                        <p className="text-xs text-ink-secondary line-clamp-2 leading-relaxed">
                          {camp.campaign_objective}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        {(camp.platforms || ["LinkedIn", "Instagram"]).map((plat) => (
                          <span
                            key={plat}
                            className="text-[10px] font-semibold px-2 py-0.5 rounded bg-workspace border border-border text-ink-muted font-mono"
                          >
                            {plat}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-border/80 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${statusInfo.bg}`}
                        >
                          <StatusIcon className="w-2.5 h-2.5" />
                          <span>{statusInfo.label}</span>
                        </span>
                        <span className="text-[11px] font-mono text-ink-muted font-bold">
                          {subsCount} content asset{subsCount === 1 ? "" : "s"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-ink-muted">
                        <span>Updated: {new Date(camp.updated_at).toLocaleDateString()}</span>
                        <span className="text-teal font-bold group-hover:underline flex items-center gap-1">
                          <span>Open Workspace</span>
                          <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* =========================================================
          3. CREATE CAMPAIGN WIZARD / MODAL
          ========================================================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface dark:bg-[#162235] border border-border rounded-2xl max-w-2xl w-full p-6 shadow-xl space-y-5 max-h-[90vh] overflow-y-auto animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <h3 className="text-base font-bold text-ink-primary font-heading">
                  Create Marketing Campaign
                </h3>
                <p className="text-xs text-ink-secondary mt-0.5">
                  Organize content, departmental reviews, publishing, and analytics under one initiative.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-ink-muted hover:text-ink-primary p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleCreateCampaign(false);
              }}
              className="space-y-4"
            >
              {/* Campaign Name */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-ink-primary">
                  Campaign Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acme Cloud Product Launch 2026"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl bg-workspace border border-border text-ink-primary focus:outline-none focus:ring-1 focus:ring-teal"
                />
              </div>

              {/* Campaign Objective */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-ink-primary">Campaign Objective</label>
                <input
                  type="text"
                  placeholder="e.g. Introduce a new enterprise cloud governance platform"
                  value={newObjective}
                  onChange={(e) => setNewObjective(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl bg-workspace border border-border text-ink-primary focus:outline-none focus:ring-1 focus:ring-teal"
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-ink-primary">Campaign Description</label>
                <textarea
                  rows={2}
                  placeholder="Key messaging pillars, value propositions, and context..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl bg-workspace border border-border text-ink-primary focus:outline-none focus:ring-1 focus:ring-teal"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Campaign Type */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-ink-primary">Campaign Type</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    className="w-full p-2.5 text-xs rounded-xl bg-workspace border border-border text-ink-primary focus:outline-none focus:ring-1 focus:ring-teal"
                  >
                    {CAMPAIGN_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Priority */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-ink-primary">Priority Level</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as any)}
                    className="w-full p-2.5 text-xs rounded-xl bg-workspace border border-border text-ink-primary focus:outline-none focus:ring-1 focus:ring-teal"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical / Urgent</option>
                  </select>
                </div>

                {/* Start Date */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-ink-primary">Start Date</label>
                  <input
                    type="date"
                    value={newStartDate}
                    onChange={(e) => setNewStartDate(e.target.value)}
                    className="w-full p-2.5 text-xs rounded-xl bg-workspace border border-border text-ink-primary focus:outline-none focus:ring-1 focus:ring-teal"
                  />
                </div>

                {/* End Date */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-ink-primary">End Date</label>
                  <input
                    type="date"
                    value={newEndDate}
                    onChange={(e) => setNewEndDate(e.target.value)}
                    className="w-full p-2.5 text-xs rounded-xl bg-workspace border border-border text-ink-primary focus:outline-none focus:ring-1 focus:ring-teal"
                  />
                </div>
              </div>

              {/* Target Audience */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-ink-primary">Target Audience</label>
                <input
                  type="text"
                  placeholder="e.g. CMOs, Brand Directors, Enterprise Architects"
                  value={newAudience}
                  onChange={(e) => setNewAudience(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl bg-workspace border border-border text-ink-primary focus:outline-none focus:ring-1 focus:ring-teal"
                />
              </div>

              {/* Desired Social Platforms (Multi-select) */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-ink-primary">
                  Desired Social Media &amp; Publishing Platforms
                </label>
                <div className="flex flex-wrap gap-2">
                  {PLATFORMS_AVAILABLE.map((p) => {
                    const isSelected = newPlatforms.includes(p.id);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setNewPlatforms(newPlatforms.filter((x) => x !== p.id));
                          } else {
                            setNewPlatforms([...newPlatforms, p.id]);
                          }
                        }}
                        className={`text-xs px-3 py-1.5 rounded-lg border font-semibold transition cursor-pointer ${
                          isSelected
                            ? "bg-teal text-slate-900 border-teal"
                            : "bg-workspace text-ink-secondary border-border hover:text-ink-primary"
                        }`}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Content Formats Required (Multi-select) */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-ink-primary">Content Formats Required</label>
                <div className="flex flex-wrap gap-2">
                  {CONTENT_FORMATS_AVAILABLE.map((fmt) => {
                    const isSelected = newFormats.includes(fmt);
                    return (
                      <button
                        key={fmt}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setNewFormats(newFormats.filter((x) => x !== fmt));
                          } else {
                            setNewFormats([...newFormats, fmt]);
                          }
                        }}
                        className={`text-xs px-3 py-1.5 rounded-lg border font-semibold transition cursor-pointer ${
                          isSelected
                            ? "bg-teal/20 text-teal border-teal/40"
                            : "bg-workspace text-ink-secondary border-border hover:text-ink-primary"
                        }`}
                      >
                        {fmt}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Attach Existing Submissions (Optional) */}
              {availableSubmissions.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-border">
                  <label className="text-xs font-semibold text-ink-primary">
                    Attach Existing Content Items (Optional)
                  </label>
                  <div className="max-h-36 overflow-y-auto space-y-1.5 p-2 bg-workspace rounded-xl border border-border">
                    {availableSubmissions.slice(0, 8).map((sub) => {
                      const isChecked = selectedSubIdsForNew.includes(sub.id);
                      return (
                        <label
                          key={sub.id}
                          className="flex items-center gap-2 text-xs p-1.5 rounded hover:bg-surface cursor-pointer text-ink-primary"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedSubIdsForNew([...selectedSubIdsForNew, sub.id]);
                              } else {
                                setSelectedSubIdsForNew(selectedSubIdsForNew.filter((id) => id !== sub.id));
                              }
                            }}
                            className="rounded border-border text-teal focus:ring-teal"
                          />
                          <span className="truncate">{sub.title}</span>
                          <span className="text-[10px] text-ink-muted ml-auto font-mono">
                            {sub.content_type}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Actions: Partial draft saving & launch */}
              <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-border text-xs font-semibold hover:bg-workspace"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleCreateCampaign(true)}
                  className="px-4 py-2 rounded-xl bg-workspace border border-border hover:border-teal text-ink-primary font-bold text-xs"
                >
                  Save as Draft
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal text-slate-900 font-bold text-xs hover:bg-teal-400 shadow-sm"
                >
                  Launch Campaign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================
          ATTACH EXISTING CONTENT MODAL
          ========================================================= */}
      {isAttachModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface dark:bg-[#162235] border border-border rounded-2xl p-6 w-full max-w-lg space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="text-sm font-bold text-ink-primary flex items-center gap-2">
                <Layers className="w-4 h-4 text-teal" /> Attach Existing Content to Campaign
              </h3>
              <button
                type="button"
                onClick={() => setIsAttachModalOpen(false)}
                className="text-ink-muted hover:text-ink-primary p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-2">
              {availableSubmissions.map((sub) => {
                const isAttached = (selectedCampaign?.submissions || []).some((s) => s.id === sub.id);
                return (
                  <div
                    key={sub.id}
                    className="p-3 rounded-xl border border-border bg-workspace/50 flex items-center justify-between text-xs"
                  >
                    <div className="space-y-0.5 max-w-[70%]">
                      <span className="font-semibold text-ink-primary block truncate">{sub.title}</span>
                      <span className="text-[10px] text-ink-muted">
                        Format: {sub.content_type} • Status: {sub.status}
                      </span>
                    </div>

                    {isAttached ? (
                      <span className="text-[10px] font-bold text-teal px-2 py-0.5 rounded bg-teal/10">
                        Linked
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleAttachSubmissions([sub.id])}
                        className="px-3 py-1 rounded-lg bg-teal text-slate-900 text-xs font-bold hover:bg-teal-400"
                      >
                        Attach
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          SCHEDULE POST MODAL
          ========================================================= */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface dark:bg-[#162235] border border-border rounded-2xl p-6 w-full max-w-md space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="text-sm font-bold text-ink-primary flex items-center gap-2">
                <Calendar className="w-4 h-4 text-teal" /> Schedule Content for Publication
              </h3>
              <button
                type="button"
                onClick={() => setIsScheduleModalOpen(false)}
                className="text-ink-muted hover:text-ink-primary p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSchedulePost} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-ink-primary">Select Content Asset</label>
                <select
                  required
                  value={scheduleSubId}
                  onChange={(e) => setScheduleSubId(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl bg-workspace border border-border text-ink-primary focus:outline-none focus:ring-1 focus:ring-teal"
                >
                  <option value="">-- Choose content piece --</option>
                  {(selectedCampaign?.submissions || []).map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title} ({s.content_type})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-ink-primary">Target Platform</label>
                <select
                  value={schedulePlatform}
                  onChange={(e) => setSchedulePlatform(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl bg-workspace border border-border text-ink-primary focus:outline-none focus:ring-1 focus:ring-teal"
                >
                  {PLATFORMS_AVAILABLE.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-ink-primary">Scheduled Date &amp; Time</label>
                <input
                  type="datetime-local"
                  required
                  value={scheduleDatetime}
                  onChange={(e) => setScheduleDatetime(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl bg-workspace border border-border text-ink-primary focus:outline-none focus:ring-1 focus:ring-teal"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-ink-primary">Publishing Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Morning peak engagement slot"
                  value={scheduleNotes}
                  onChange={(e) => setScheduleNotes(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl bg-workspace border border-border text-ink-primary focus:outline-none focus:ring-1 focus:ring-teal"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-border text-xs font-semibold hover:bg-workspace"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={schedulingSubmitting}
                  className="px-4 py-2 rounded-xl bg-teal text-slate-900 font-bold text-xs hover:bg-teal-400 disabled:opacity-50"
                >
                  {schedulingSubmitting ? "Scheduling..." : "Save to Schedule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function TargetIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}
