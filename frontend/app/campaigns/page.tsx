"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
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
} from "lucide-react";

export default function CampaignsPage() {
  const { user, activeRole, activeOrgName } = useAuth();
  const searchParams = useSearchParams();
  const initialCampaignId = searchParams.get("id");

  // Campaign list and active selection
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [readiness, setReadiness] = useState<CampaignReadinessEvaluation | null>(null);
  const [activityEvents, setActivityEvents] = useState<any[]>([]);
  const [availableSubmissions, setAvailableSubmissions] = useState<ContentSubmission[]>([]);

  // UI state
  const [loading, setLoading] = useState<boolean>(true);
  const [reviewRunning, setReviewRunning] = useState<boolean>(false);
  const [decisionSubmitting, setDecisionSubmitting] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<
    "overview" | "reviews" | "human_approval" | "readiness" | "activity"
  >("overview");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isAttachModalOpen, setIsAttachModalOpen] = useState<boolean>(false);

  // Create Campaign Form State
  const [newCampaignName, setNewCampaignName] = useState<string>("");
  const [newDescription, setNewDescription] = useState<string>("");
  const [newObjective, setNewObjective] = useState<string>("");
  const [newAudience, setNewAudience] = useState<string>("");
  const [newProduct, setNewProduct] = useState<string>("");
  const [newChannel, setNewChannel] = useState<string>("omnichannel");
  const [newJurisdiction, setNewJurisdiction] = useState<string>("US");
  const [newCategory, setNewCategory] = useState<string>("b2b_enterprise_saas");
  const [newPriority, setNewPriority] = useState<CampaignPriority>("medium");
  const [newDeadline, setNewDeadline] = useState<string>("");
  const [newBrief, setNewBrief] = useState<string>("");
  const [selectedSubIdsForNew, setSelectedSubIdsForNew] = useState<string[]>([]);

  // Decision Form State
  const [decisionAction, setDecisionAction] = useState<"approve" | "reject" | "request_changes">("approve");
  const [decisionComments, setDecisionComments] = useState<string>("");
  const [decisionCondition, setDecisionCondition] = useState<string>("");
  const [decisionConditions, setDecisionConditions] = useState<string[]>([]);

  // Load campaigns and available submissions
  const loadData = async () => {
    try {
      setLoading(true);
      const [allCampaigns, allSubs] = await Promise.all([
        api.getCampaigns(),
        api.getSubmissions(),
      ]);
      setCampaigns(allCampaigns || []);
      setAvailableSubmissions(allSubs || []);

      if (initialCampaignId) {
        const found = (allCampaigns || []).find((c) => c.id === initialCampaignId);
        if (found) {
          selectCampaign(found);
        } else if (allCampaigns && allCampaigns.length > 0) {
          selectCampaign(allCampaigns[0]);
        }
      } else if (allCampaigns && allCampaigns.length > 0 && !selectedCampaign) {
        selectCampaign(allCampaigns[0]);
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
      const [readinessData, activityData] = await Promise.all([
        api.getCampaignReadiness(campaign.id),
        api.getCampaignActivity(campaign.id),
      ]);
      setReadiness(readinessData);
      setActivityEvents(activityData || []);
    } catch (e) {
      // quiet fallback
    }
  };

  const refreshActiveCampaign = async () => {
    if (!selectedCampaign) return;
    try {
      const updated = await api.getCampaign(selectedCampaign.id);
      setSelectedCampaign(updated);
      const [readinessData, activityData, allCampaigns] = await Promise.all([
        api.getCampaignReadiness(updated.id),
        api.getCampaignActivity(updated.id),
        api.getCampaigns(),
      ]);
      setReadiness(readinessData);
      setActivityEvents(activityData || []);
      setCampaigns(allCampaigns || []);
    } catch (e: any) {
      console.error("Refresh failed:", e);
    }
  };

  // Run AI Review Orchestration
  const handleRunAudits = async () => {
    if (!selectedCampaign) return;
    try {
      setReviewRunning(true);
      setFeedbackMessage(null);
      const updated = await api.runCampaignReviews(selectedCampaign.id);
      setSelectedCampaign(updated);
      await refreshActiveCampaign();
      setFeedbackMessage({
        type: "success",
        text: "Multi-track AI reviews completed. Results evaluated against policy gating.",
      });
      setActiveTab("reviews");
    } catch (e: any) {
      setFeedbackMessage({ type: "error", text: e.message || "Failed to execute reviews." });
    } finally {
      setReviewRunning(false);
    }
  };

  // Submit Human Decision
  const handleSubmitDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCampaign) return;
    if ((decisionAction === "reject" || decisionAction === "request_changes") && !decisionComments.trim()) {
      setFeedbackMessage({
        type: "error",
        text: "A detailed comment is required when rejecting or requesting changes.",
      });
      return;
    }

    try {
      setDecisionSubmitting(true);
      setFeedbackMessage(null);
      const payload: CampaignDecisionRequest = {
        action: decisionAction,
        comments: decisionComments.trim() || "Signed off by authorized compliance reviewer.",
        conditions: decisionConditions,
      };
      await api.submitCampaignDecision(selectedCampaign.id, payload);
      await refreshActiveCampaign();
      setFeedbackMessage({
        type: "success",
        text: `Campaign decision '${decisionAction.toUpperCase()}' recorded successfully.`,
      });
      setDecisionComments("");
      setDecisionConditions([]);
      setActiveTab("readiness");
    } catch (e: any) {
      setFeedbackMessage({ type: "error", text: e.message || "Failed to submit decision." });
    } finally {
      setDecisionSubmitting(false);
    }
  };

  // Create Campaign
  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCampaignName.trim()) return;

    try {
      setLoading(true);
      const payload: CampaignCreate = {
        name: newCampaignName.trim(),
        description: newDescription.trim() || undefined,
        campaign_objective: newObjective.trim() || undefined,
        target_audience: newAudience.trim() || undefined,
        product_name: newProduct.trim() || undefined,
        target_channel: newChannel,
        target_jurisdiction: newJurisdiction,
        regulated_category: newCategory,
        priority: newPriority,
        deadline: newDeadline || undefined,
        creative_brief: newBrief.trim() || undefined,
        submission_ids: selectedSubIdsForNew,
        policy_config: {
          required_reviews: ["marketing", "visual", "legal"],
          require_legal_signoff: true,
          require_visual_signoff: true,
        },
      };

      const created = await api.createCampaign(payload);
      setIsCreateModalOpen(false);
      resetCreateForm();
      await loadData();
      selectCampaign(created);
      setFeedbackMessage({ type: "success", text: `Campaign '${created.name}' created successfully.` });
    } catch (e: any) {
      setFeedbackMessage({ type: "error", text: e.message || "Failed to create campaign." });
    } finally {
      setLoading(false);
    }
  };

  const resetCreateForm = () => {
    setNewCampaignName("");
    setNewDescription("");
    setNewObjective("");
    setNewAudience("");
    setNewProduct("");
    setNewChannel("omnichannel");
    setNewJurisdiction("US");
    setNewCategory("b2b_enterprise_saas");
    setNewPriority("medium");
    setNewDeadline("");
    setNewBrief("");
    setSelectedSubIdsForNew([]);
  };

  // Attach Submissions to Existing Campaign
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

  // Helper formatting & badge styles
  const getStatusBadge = (status: CampaignStatus) => {
    switch (status) {
      case "approved":
        return {
          label: "Approved for Release",
          bg: "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
          icon: CheckCircle2,
        };
      case "rejected":
        return {
          label: "Rejected",
          bg: "bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800",
          icon: ShieldAlert,
        };
      case "changes_requested":
        return {
          label: "Changes Requested",
          bg: "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
          icon: AlertTriangle,
        };
      case "human_review_pending":
        return {
          label: "Human Review Pending",
          bg: "bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800",
          icon: UserCheck,
        };
      case "ai_review_in_progress":
      case "ai_review_pending":
        return {
          label: "AI Audit In Progress",
          bg: "bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
          icon: RefreshCw,
        };
      case "in_progress":
        return {
          label: "In Progress",
          bg: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700",
          icon: Sliders,
        };
      case "draft":
      default:
        return {
          label: "Draft",
          bg: "bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800",
          icon: FileText,
        };
    }
  };

  const getPriorityBadge = (priority: CampaignPriority) => {
    switch (priority) {
      case "urgent":
        return "bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-300 border-rose-300";
      case "high":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 border-amber-300";
      case "medium":
        return "bg-teal-50 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300 border-teal-200";
      case "low":
      default:
        return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300";
    }
  };

  // Filter campaigns
  const filteredCampaigns = campaigns.filter((c) => {
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    const matchesSearch =
      !searchQuery ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.description || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.product_name || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const isCreatorOfActive = Boolean(
    selectedCampaign && user && selectedCampaign.owner_id === user.id
  );
  const isAuthorizedReviewer =
    activeRole === "admin" ||
    activeRole === "compliance_officer" ||
    activeRole === "legal" ||
    activeRole === "reviewer";

  return (
    <div className="min-h-screen bg-workspace dark:bg-[#0B1728] text-ink-primary p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Banner / Breadcrumb & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center space-x-2 text-xs text-ink-muted mb-1">
            <span>Brand Governance</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-teal font-semibold">Campaign Orchestration</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-primary flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-teal" />
            Unified Campaign Workspaces
          </h1>
          <p className="text-xs text-ink-muted mt-0.5">
            Cross-team Gemini AI governance, multi-track AI orchestration, and separation-of-duties sign-off gates.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-teal text-slate-900 font-semibold text-xs shadow-sm hover:bg-teal-400 transition-colors focus:ring-2 focus:ring-teal"
          >
            <Plus className="w-4 h-4" />
            <span>Create Campaign</span>
          </button>
        </div>
      </div>

      {/* Global Feedback Banner */}
      {feedbackMessage && (
        <div
          className={`p-3 rounded-xl border flex items-center justify-between text-xs animate-in fade-in duration-150 ${
            feedbackMessage.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-800 dark:text-emerald-200"
              : "bg-rose-50 dark:bg-rose-950/40 border-rose-300 text-rose-800 dark:text-rose-200"
          }`}
        >
          <div className="flex items-center space-x-2">
            {feedbackMessage.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedbackMessage.text}</span>
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

      {/* Main Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Campaigns Directory & Filter (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-surface dark:bg-[#162235] border border-border rounded-2xl p-4 shadow-subtle space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                Campaign Directory
              </span>
              <span className="text-xs text-ink-muted">
                {filteredCampaigns.length} total
              </span>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-ink-muted" />
              <input
                type="text"
                placeholder="Search campaigns, products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-workspace dark:bg-[#0B1728] border border-border focus:outline-none focus:ring-1 focus:ring-teal"
              />
            </div>

            {/* Status Pills Filter */}
            <div className="flex flex-wrap gap-1 text-[11px]">
              {[
                { id: "all", label: "All" },
                { id: "draft", label: "Draft" },
                { id: "human_review_pending", label: "Review" },
                { id: "approved", label: "Approved" },
                { id: "changes_requested", label: "Changes" },
              ].map((pill) => (
                <button
                  key={pill.id}
                  type="button"
                  onClick={() => setStatusFilter(pill.id)}
                  className={`px-2 py-0.5 rounded-lg border transition-colors ${
                    statusFilter === pill.id
                      ? "bg-teal/20 border-teal text-teal-700 dark:text-teal-300 font-semibold"
                      : "bg-surface dark:bg-[#162235] border-border text-ink-muted hover:border-border/80"
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>

            {/* Campaign Cards List */}
            <div className="space-y-2 max-h-[620px] overflow-y-auto pr-1">
              {filteredCampaigns.length === 0 ? (
                <div className="py-12 text-center text-xs text-ink-muted">
                  No campaigns found matching criteria.
                </div>
              ) : (
                filteredCampaigns.map((camp) => {
                  const statusInfo = getStatusBadge(camp.status);
                  const StatusIcon = statusInfo.icon;
                  const isSelected = selectedCampaign?.id === camp.id;

                  return (
                    <div
                      key={camp.id}
                      onClick={() => selectCampaign(camp)}
                      className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                        isSelected
                          ? "bg-teal/10 dark:bg-teal-950/30 border-teal shadow-sm"
                          : "bg-workspace/50 dark:bg-[#101A2B]/40 border-border/60 hover:border-border hover:bg-workspace"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <span className="font-semibold text-xs text-ink-primary line-clamp-1">
                          {camp.name}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 text-[9.5px] font-bold uppercase rounded border shrink-0 ${getPriorityBadge(
                            camp.priority
                          )}`}
                        >
                          {camp.priority}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 mb-2">
                        <span
                          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border ${statusInfo.bg}`}
                        >
                          <StatusIcon className="w-2.5 h-2.5" />
                          <span>{statusInfo.label}</span>
                        </span>
                        <span className="text-[10px] text-ink-muted">
                          v{camp.version}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[10.5px] text-ink-muted pt-2 border-t border-border/40">
                        <span>{camp.target_channel || "General"}</span>
                        <span>{camp.target_jurisdiction || "Global"}</span>
                        <span>{camp.submissions?.length || 0} assets</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Selected Campaign Workspace & Workflows (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {!selectedCampaign ? (
            <div className="bg-surface dark:bg-[#162235] border border-border rounded-2xl p-12 text-center text-ink-muted">
              Select or create a campaign to view its unified governance workspace.
            </div>
          ) : (
            <>
              {/* Campaign Header Card */}
              <div className="bg-surface dark:bg-[#162235] border border-border rounded-2xl p-5 shadow-subtle space-y-3">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-teal tracking-wider uppercase">
                        Campaign Workspace
                      </span>
                      <span className="text-xs text-ink-muted font-mono">
                        #{selectedCampaign.id}
                      </span>
                    </div>
                    <h2 className="text-xl font-bold text-ink-primary">
                      {selectedCampaign.name}
                    </h2>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold border ${
                        getStatusBadge(selectedCampaign.status).bg
                      }`}
                    >
                      {React.createElement(
                        getStatusBadge(selectedCampaign.status).icon,
                        { className: "w-3.5 h-3.5" }
                      )}
                      <span>{getStatusBadge(selectedCampaign.status).label}</span>
                    </span>
                    <span className="text-xs font-mono px-2 py-1 rounded-xl bg-workspace border border-border text-ink-muted">
                      v{selectedCampaign.version}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-ink-muted leading-relaxed">
                  {selectedCampaign.description ||
                    "No formal description provided. Cross-team Gemini AI workspace active."}
                </p>

                {/* Workspace Navigation Tabs */}
                <div className="flex flex-wrap gap-2 pt-2 border-t border-border/60">
                  {[
                    { id: "overview", label: "Overview & Assets", icon: Layers },
                    { id: "reviews", label: "AI Review Ledger", icon: Sparkles },
                    { id: "human_approval", label: "Human Approval Gate", icon: UserCheck },
                    { id: "readiness", label: "Policy Gating & Readiness", icon: ShieldCheck },
                    { id: "activity", label: "Activity Trail", icon: History },
                  ].map((tab) => {
                    const TabIcon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors border ${
                          activeTab === tab.id
                            ? "bg-teal text-slate-900 border-teal shadow-sm"
                            : "bg-workspace dark:bg-[#101A2B] border-border text-ink-muted hover:text-ink-primary"
                        }`}
                      >
                        <TabIcon className="w-3.5 h-3.5" />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tab 1: Overview & Associated Assets */}
              {activeTab === "overview" && (
                <div className="space-y-4">
                  {/* Metadata Matrix */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-surface dark:bg-[#162235] border border-border rounded-2xl p-4 text-xs">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-ink-muted">
                        Product / Service
                      </span>
                      <p className="font-semibold text-ink-primary mt-0.5 truncate">
                        {selectedCampaign.product_name || "Enterprise AI"}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase text-ink-muted">
                        Target Channel
                      </span>
                      <p className="font-semibold text-ink-primary mt-0.5 capitalize truncate">
                        {selectedCampaign.target_channel || "Omnichannel"}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase text-ink-muted">
                        Jurisdiction
                      </span>
                      <p className="font-semibold text-ink-primary mt-0.5 truncate">
                        {selectedCampaign.target_jurisdiction || "Global"}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase text-ink-muted">
                        Regulated Category
                      </span>
                      <p className="font-semibold text-ink-primary mt-0.5 capitalize truncate">
                        {(selectedCampaign.regulated_category || "General").replace(
                          /_/g,
                          " "
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Creative Brief */}
                  {selectedCampaign.creative_brief && (
                    <div className="bg-surface dark:bg-[#162235] border border-border rounded-2xl p-4 text-xs space-y-1.5">
                      <span className="text-[10.5px] font-bold uppercase tracking-wider text-teal">
                        Creative Brief & Core Narrative
                      </span>
                      <p className="text-ink-muted leading-relaxed whitespace-pre-wrap">
                        {selectedCampaign.creative_brief}
                      </p>
                    </div>
                  )}

                  {/* Associated Content Drafts and Design Assets */}
                  <div className="bg-surface dark:bg-[#162235] border border-border rounded-2xl p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-bold text-ink-primary flex items-center gap-1.5">
                          <Layers className="w-4 h-4 text-teal" />
                          Associated Creative Drafts & Design Assets
                        </h3>
                        <p className="text-[11px] text-ink-muted">
                          Exact version identifiers attached to this campaign review ledger.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsAttachModalOpen(true)}
                        className="px-3 py-1.5 rounded-xl border border-teal/40 bg-teal/10 hover:bg-teal/20 text-teal text-xs font-semibold flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" /> Attach Assets
                      </button>
                    </div>

                    <div className="space-y-2">
                      {!selectedCampaign.submissions ||
                      selectedCampaign.submissions.length === 0 ? (
                        <div className="py-8 text-center text-xs text-ink-muted border border-dashed border-border rounded-xl">
                          No drafts or design assets attached yet. Click 'Attach Assets' above to link existing work.
                        </div>
                      ) : (
                        selectedCampaign.submissions.map((sub) => (
                          <div
                            key={sub.id}
                            className="p-3 rounded-xl border border-border/80 bg-workspace/50 dark:bg-[#101A2B]/40 flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center space-x-3">
                              {sub.content_type === "image" ||
                              sub.content_type === "video" ? (
                                <Palette className="w-4 h-4 text-purple-400 shrink-0" />
                              ) : (
                                <FileText className="w-4 h-4 text-teal shrink-0" />
                              )}
                              <div>
                                <span className="font-semibold text-ink-primary block">
                                  {sub.title}
                                </span>
                                <span className="text-[10px] text-ink-muted">
                                  Type: {sub.content_type} | Rev:{" "}
                                  <span className="font-mono text-teal">
                                    {sub.current_revision_id || "v1"}
                                  </span>
                                </span>
                              </div>
                            </div>

                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                                sub.status === "approved"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                                  : "bg-slate-100 text-slate-700 border-slate-300"
                              }`}
                            >
                              {sub.status}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Multi-Track AI Review Orchestration */}
              {activeTab === "reviews" && (
                <div className="space-y-4">
                  {/* Action Banner */}
                  <div className="bg-gradient-to-r from-teal/10 via-surface to-surface dark:from-teal-950/20 dark:via-[#162235] dark:to-[#162235] border border-teal/30 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-sm font-bold text-ink-primary flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-teal" />
                        Multi-Track AI Review Orchestration
                      </h3>
                      <p className="text-xs text-ink-muted mt-0.5">
                        Simultaneously coordinates Marketing Voice, Visual Quality, and Statutory Legal checks across exact revisions.
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={reviewRunning}
                      onClick={handleRunAudits}
                      className="px-4 py-2 rounded-xl bg-teal text-slate-900 font-bold text-xs hover:bg-teal-400 disabled:opacity-50 flex items-center gap-1.5 shadow-sm transition-all"
                    >
                      <RefreshCw
                        className={`w-3.5 h-3.5 ${reviewRunning ? "animate-spin" : ""}`}
                      />
                      <span>
                        {reviewRunning ? "Orchestrating Audits..." : "Run Multi-Track Audits"}
                      </span>
                    </button>
                  </div>

                  {/* Review Tracks Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Track 1: Marketing & Brand Voice */}
                    <div className="bg-surface dark:bg-[#162235] border border-border rounded-2xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-ink-primary flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-teal" /> Marketing Brand
                        </span>
                        <span
                          className={`px-1.5 py-0.5 text-[9.5px] font-bold rounded uppercase border ${
                            selectedCampaign.review_tracks?.marketing?.status === "completed"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                              : "bg-slate-100 text-slate-600 border-slate-300"
                          }`}
                        >
                          {selectedCampaign.review_tracks?.marketing?.status || "Pending"}
                        </span>
                      </div>

                      <div className="bg-workspace/60 dark:bg-[#101A2B]/40 rounded-xl p-3 text-center border border-border/50">
                        <span className="text-2xl font-black text-teal">
                          {selectedCampaign.review_tracks?.marketing?.score !== undefined &&
                          selectedCampaign.review_tracks?.marketing?.score !== null
                            ? `${selectedCampaign.review_tracks.marketing.score}`
                            : "—"}
                        </span>
                        <span className="text-[10px] text-ink-muted block mt-0.5">
                          Compliance Score / 100
                        </span>
                      </div>

                      <p className="text-[11px] text-ink-muted leading-relaxed">
                        {selectedCampaign.review_tracks?.marketing?.summary_message ||
                          "Awaiting automated marketing brand audit execution."}
                      </p>

                      <div className="text-[10px] text-ink-muted pt-2 border-t border-border/40 flex justify-between">
                        <span>
                          Findings:{" "}
                          <strong>
                            {selectedCampaign.review_tracks?.marketing?.findings_count || 0}
                          </strong>
                        </span>
                        <span>
                          Critical:{" "}
                          <strong className="text-rose-600">
                            {selectedCampaign.review_tracks?.marketing?.critical_findings_count || 0}
                          </strong>
                        </span>
                      </div>
                    </div>

                    {/* Track 2: Visual Media & Design */}
                    <div className="bg-surface dark:bg-[#162235] border border-border rounded-2xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-ink-primary flex items-center gap-1.5">
                          <Palette className="w-3.5 h-3.5 text-purple-400" /> Visual & Media
                        </span>
                        <span
                          className={`px-1.5 py-0.5 text-[9.5px] font-bold rounded uppercase border ${
                            selectedCampaign.review_tracks?.visual?.status === "completed"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                              : selectedCampaign.review_tracks?.visual?.status === "not_required"
                              ? "bg-slate-50 text-slate-500 border-slate-200"
                              : "bg-slate-100 text-slate-600 border-slate-300"
                          }`}
                        >
                          {selectedCampaign.review_tracks?.visual?.status || "Not Required"}
                        </span>
                      </div>

                      <div className="bg-workspace/60 dark:bg-[#101A2B]/40 rounded-xl p-3 text-center border border-border/50">
                        <span className="text-2xl font-black text-purple-400">
                          {selectedCampaign.review_tracks?.visual?.score !== undefined &&
                          selectedCampaign.review_tracks?.visual?.score !== null
                            ? `${selectedCampaign.review_tracks.visual.score}`
                            : "—"}
                        </span>
                        <span className="text-[10px] text-ink-muted block mt-0.5">
                          Visual Score / 100
                        </span>
                      </div>

                      <p className="text-[11px] text-ink-muted leading-relaxed">
                        {selectedCampaign.review_tracks?.visual?.summary_message ||
                          "No visual media assets attached requiring inspection."}
                      </p>

                      <div className="text-[10px] text-ink-muted pt-2 border-t border-border/40 flex justify-between">
                        <span>
                          Findings:{" "}
                          <strong>
                            {selectedCampaign.review_tracks?.visual?.findings_count || 0}
                          </strong>
                        </span>
                        <span>
                          Critical:{" "}
                          <strong className="text-rose-600">
                            {selectedCampaign.review_tracks?.visual?.critical_findings_count || 0}
                          </strong>
                        </span>
                      </div>
                    </div>

                    {/* Track 3: Statutory Legal Review */}
                    <div className="bg-surface dark:bg-[#162235] border border-border rounded-2xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-ink-primary flex items-center gap-1.5">
                          <Scale className="w-3.5 h-3.5 text-amber-500" /> Legal Gemini AI
                        </span>
                        <span
                          className={`px-1.5 py-0.5 text-[9.5px] font-bold rounded uppercase border ${
                            selectedCampaign.review_tracks?.legal?.status === "completed"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                              : selectedCampaign.review_tracks?.legal?.status === "completed_with_warnings"
                              ? "bg-amber-50 text-amber-700 border-amber-300"
                              : "bg-slate-100 text-slate-600 border-slate-300"
                          }`}
                        >
                          {selectedCampaign.review_tracks?.legal?.status || "Pending"}
                        </span>
                      </div>

                      <div className="bg-workspace/60 dark:bg-[#101A2B]/40 rounded-xl p-3 text-center border border-border/50">
                        <span className="text-2xl font-black text-amber-500">
                          {selectedCampaign.review_tracks?.legal?.score !== undefined &&
                          selectedCampaign.review_tracks?.legal?.score !== null
                            ? `${selectedCampaign.review_tracks.legal.score}`
                            : "—"}
                        </span>
                        <span className="text-[10px] text-ink-muted block mt-0.5">
                          Statutory Rating / 100
                        </span>
                      </div>

                      <p className="text-[11px] text-ink-muted leading-relaxed">
                        {selectedCampaign.review_tracks?.legal?.summary_message ||
                          "Awaiting statutory claims and disclosure audit."}
                      </p>

                      <div className="text-[10px] text-ink-muted pt-2 border-t border-border/40 flex justify-between">
                        <span>
                          Findings:{" "}
                          <strong>
                            {selectedCampaign.review_tracks?.legal?.findings_count || 0}
                          </strong>
                        </span>
                        <span>
                          Critical:{" "}
                          <strong className="text-rose-600">
                            {selectedCampaign.review_tracks?.legal?.critical_findings_count || 0}
                          </strong>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: Human Review & Approval Gate */}
              {activeTab === "human_approval" && (
                <div className="space-y-4">
                  {/* Separation of Duties Policy Banner */}
                  <div className="bg-surface dark:bg-[#162235] border border-border rounded-2xl p-4 text-xs space-y-2">
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-teal" />
                      <span className="font-bold text-ink-primary">
                        Segregation of Duties & Review Authority Policy
                      </span>
                    </div>
                    <p className="text-ink-muted">
                      Campaign creators cannot approve their own submissions under enterprise brand governance rules. Sign-off must be performed by an independent Compliance Officer, Legal Counsel, or Brand Administrator.
                    </p>
                    {isCreatorOfActive && activeRole !== "admin" && (
                      <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 text-amber-800 dark:text-amber-200 flex items-center gap-2 text-xs">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>
                          You are recorded as the creator of this campaign. As per segregation-of-duties policy, you cannot sign off on final approval.
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Decision Interface Form */}
                  <form
                    onSubmit={handleSubmitDecision}
                    className="bg-surface dark:bg-[#162235] border border-border rounded-2xl p-5 space-y-4 shadow-subtle"
                  >
                    <h3 className="text-sm font-bold text-ink-primary flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-teal" />
                      Record Compliance Determination
                    </h3>

                    {/* Action Selector */}
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        {
                          id: "approve",
                          label: "Approve Campaign",
                          desc: "Certify compliance and unlock release",
                          icon: CheckCircle2,
                          color: "text-emerald-500",
                        },
                        {
                          id: "request_changes",
                          label: "Request Changes",
                          desc: "Require edits prior to sign-off",
                          icon: AlertTriangle,
                          color: "text-amber-500",
                        },
                        {
                          id: "reject",
                          label: "Reject Campaign",
                          desc: "Reject submission with rationale",
                          icon: ShieldAlert,
                          color: "text-rose-500",
                        },
                      ].map((item) => {
                        const Icon = item.icon;
                        const isSelected = decisionAction === item.id;
                        return (
                          <div
                            key={item.id}
                            onClick={() => setDecisionAction(item.id as any)}
                            className={`p-3 rounded-xl border cursor-pointer text-left transition-all ${
                              isSelected
                                ? "bg-teal/10 dark:bg-teal-950/40 border-teal shadow-sm"
                                : "bg-workspace dark:bg-[#101A2B] border-border hover:border-border/80"
                            }`}
                          >
                            <div className="flex items-center space-x-1.5 mb-1">
                              <Icon className={`w-4 h-4 ${item.color}`} />
                              <span className="font-bold text-xs text-ink-primary">
                                {item.label}
                              </span>
                            </div>
                            <p className="text-[10px] text-ink-muted">{item.desc}</p>
                          </div>
                        );
                      })}
                    </div>

                    {/* Comments */}
                    <div>
                      <label className="block text-xs font-bold text-ink-primary mb-1">
                        Reviewer Rationale & Feedback{" "}
                        {decisionAction !== "approve" && (
                          <span className="text-rose-500">* (Required)</span>
                        )}
                      </label>
                      <textarea
                        rows={3}
                        value={decisionComments}
                        onChange={(e) => setDecisionComments(e.target.value)}
                        placeholder={
                          decisionAction === "approve"
                            ? "Reviewed brand and legal compliance. Cleared for distribution."
                            : "Detail specific changes or policy violations that must be remediated..."
                        }
                        className="w-full p-2.5 text-xs rounded-xl bg-workspace dark:bg-[#0B1728] border border-border focus:outline-none focus:ring-1 focus:ring-teal"
                      />
                    </div>

                    {/* Stipulations / Conditions */}
                    <div>
                      <label className="block text-xs font-bold text-ink-primary mb-1">
                        Conditional Stipulations (Optional)
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={decisionCondition}
                          onChange={(e) => setDecisionCondition(e.target.value)}
                          placeholder="e.g. Include 99.9% uptime SLA footnote on landing page"
                          className="flex-1 p-2 text-xs rounded-xl bg-workspace dark:bg-[#0B1728] border border-border focus:outline-none focus:ring-1 focus:ring-teal"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (decisionCondition.trim()) {
                              setDecisionConditions((prev) => [
                                ...prev,
                                decisionCondition.trim(),
                              ]);
                              setDecisionCondition("");
                            }
                          }}
                          className="px-3 py-1.5 rounded-xl border border-border hover:border-teal text-xs font-semibold"
                        >
                          Add
                        </button>
                      </div>

                      {decisionConditions.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {decisionConditions.map((cond, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded-lg bg-teal/10 border border-teal/30 text-[10.5px] text-teal-700 dark:text-teal-300 flex items-center gap-1"
                            >
                              <span>{cond}</span>
                              <button
                                type="button"
                                onClick={() =>
                                  setDecisionConditions((prev) =>
                                    prev.filter((_, idx) => idx !== i)
                                  )
                                }
                                className="text-ink-muted hover:text-ink-primary"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end pt-2 border-t border-border/40">
                      <button
                        type="submit"
                        disabled={
                          decisionSubmitting ||
                          (isCreatorOfActive &&
                            decisionAction === "approve" &&
                            activeRole !== "admin")
                        }
                        className="px-4 py-2 rounded-xl bg-teal text-slate-900 font-bold text-xs hover:bg-teal-400 disabled:opacity-50 transition-all flex items-center gap-1.5"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>
                          {decisionSubmitting ? "Recording..." : "Record Determination"}
                        </span>
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Tab 4: Release Readiness & Policy Gating */}
              {activeTab === "readiness" && (
                <div className="space-y-4">
                  {/* Readiness Banner */}
                  <div
                    className={`border rounded-2xl p-5 ${
                      readiness?.is_ready_for_release
                        ? "bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-300 text-emerald-900 dark:text-emerald-100"
                        : "bg-amber-50/80 dark:bg-amber-950/30 border-amber-300 text-amber-900 dark:text-amber-100"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      {readiness?.is_ready_for_release ? (
                        <CheckCircle2 className="w-8 h-8 text-emerald-600 shrink-0" />
                      ) : (
                        <AlertTriangle className="w-8 h-8 text-amber-600 shrink-0" />
                      )}
                      <div>
                        <h3 className="text-base font-bold">
                          {readiness?.is_ready_for_release
                            ? "Ready for Public Release"
                            : "Release Blocked — Outstanding Governance Requirements"}
                        </h3>
                        <p className="text-xs opacity-90 mt-0.5">
                          {readiness?.is_ready_for_release
                            ? "All required multi-track AI audits and independent human compliance approvals are completed on the exact active content revisions."
                            : "Policy gating has withheld readiness. Resolve the blockers below prior to release."}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Checklist Matrix */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-surface dark:bg-[#162235] border border-border rounded-xl p-3.5 flex items-center space-x-3 text-xs">
                      {readiness?.ai_checks_completed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                      ) : (
                        <Clock className="w-5 h-5 text-amber-500 shrink-0" />
                      )}
                      <div>
                        <span className="font-bold text-ink-primary block">
                          AI Audits Completed
                        </span>
                        <span className="text-[10px] text-ink-muted">
                          {readiness?.ai_checks_completed ? "Passed" : "Checks pending"}
                        </span>
                      </div>
                    </div>

                    <div className="bg-surface dark:bg-[#162235] border border-border rounded-xl p-3.5 flex items-center space-x-3 text-xs">
                      {readiness?.human_review_completed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                      ) : (
                        <UserCheck className="w-5 h-5 text-amber-500 shrink-0" />
                      )}
                      <div>
                        <span className="font-bold text-ink-primary block">
                          Human Review
                        </span>
                        <span className="text-[10px] text-ink-muted">
                          {readiness?.human_review_completed
                            ? "Reviewed"
                            : "Sign-off pending"}
                        </span>
                      </div>
                    </div>

                    <div className="bg-surface dark:bg-[#162235] border border-border rounded-xl p-3.5 flex items-center space-x-3 text-xs">
                      {readiness?.required_approvals_completed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                      ) : (
                        <Lock className="w-5 h-5 text-rose-500 shrink-0" />
                      )}
                      <div>
                        <span className="font-bold text-ink-primary block">
                          Approved Authority
                        </span>
                        <span className="text-[10px] text-ink-muted">
                          {readiness?.required_approvals_completed
                            ? "Authorized"
                            : "Pending decision"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Outstanding Blockers Panel */}
                  <div className="bg-surface dark:bg-[#162235] border border-border rounded-2xl p-5 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-ink-primary flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-rose-500" />
                      Outstanding Blockers Checklist
                    </h4>

                    {readiness?.outstanding_blockers &&
                    readiness.outstanding_blockers.length > 0 ? (
                      <div className="space-y-2">
                        {readiness.outstanding_blockers.map((blocker, idx) => (
                          <div
                            key={idx}
                            className="p-3 rounded-xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/50 flex items-start space-x-2 text-xs text-rose-800 dark:text-rose-200"
                          >
                            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                            <span>{blocker}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>Zero outstanding blockers. All policy gating criteria satisfied!</span>
                      </div>
                    )}
                  </div>

                  {/* Mandatory Legal & Regulatory Disclaimer */}
                  <div className="bg-workspace/80 dark:bg-[#0B1728]/80 border border-border/80 rounded-2xl p-4 text-[11px] text-ink-muted space-y-1">
                    <span className="font-bold uppercase tracking-wider text-[10px] text-teal block">
                      Mandatory Governance Notice
                    </span>
                    <p className="leading-relaxed">
                      {readiness?.compliance_disclaimer ||
                        "READINESS NOTICE: Campaign readiness indicates completion of internal brand, visual, and legal governance checks. It does NOT guarantee judicial compliance or eliminate external regulatory dispute risks."}
                    </p>
                  </div>
                </div>
              )}

              {/* Tab 5: Activity & Audit Trail */}
              {activeTab === "activity" && (
                <div className="bg-surface dark:bg-[#162235] border border-border rounded-2xl p-5 space-y-4 shadow-subtle">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-ink-primary flex items-center gap-1.5">
                        <History className="w-4 h-4 text-teal" />
                        Immutable Campaign Activity & Audit Trail
                      </h3>
                      <p className="text-[11px] text-ink-muted">
                        Cryptographically traceable, append-only record of all workflow events.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {activityEvents.length === 0 ? (
                      <div className="py-8 text-center text-xs text-ink-muted">
                        No activity records found.
                      </div>
                    ) : (
                      activityEvents.map((act) => (
                        <div
                          key={act.id}
                          className="p-3 rounded-xl bg-workspace/50 dark:bg-[#101A2B]/40 border border-border/60 text-xs flex items-start justify-between gap-4"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-semibold text-ink-primary capitalize">
                                {(act.event_type || "Event").replace(/_/g, " ")}
                              </span>
                              <span className="text-[10px] text-teal font-mono">
                                Actor: {act.actor_id || "System"}
                              </span>
                            </div>
                            <p className="text-[11px] text-ink-muted">
                              {act.details?.action ||
                                act.details?.decision ||
                                JSON.stringify(act.details || {})}
                            </p>
                          </div>

                          <span className="text-[10px] text-ink-muted whitespace-nowrap">
                            {new Date(act.created_at).toLocaleString()}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modal 1: Create Campaign */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface dark:bg-[#162235] border border-border rounded-2xl p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="text-base font-bold text-ink-primary flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-teal" /> Create Unified Campaign
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-ink-muted hover:text-ink-primary p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCampaign} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-ink-primary">
                  Campaign Name *
                </label>
                <input
                  type="text"
                  required
                  value={newCampaignName}
                  onChange={(e) => setNewCampaignName(e.target.value)}
                  placeholder="e.g. Q1 2026 AI Governance Hub Launch"
                  className="w-full p-2.5 rounded-xl bg-workspace dark:bg-[#0B1728] border border-border focus:ring-1 focus:ring-teal focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-ink-primary">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Summary of campaign scope, goals, and narrative..."
                  className="w-full p-2.5 rounded-xl bg-workspace dark:bg-[#0B1728] border border-border focus:ring-1 focus:ring-teal focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-ink-primary">
                    Product / Solution
                  </label>
                  <input
                    type="text"
                    value={newProduct}
                    onChange={(e) => setNewProduct(e.target.value)}
                    placeholder="e.g. Inkloom Governance Hub"
                    className="w-full p-2 rounded-xl bg-workspace dark:bg-[#0B1728] border border-border focus:ring-1 focus:ring-teal focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-ink-primary">
                    Priority
                  </label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as CampaignPriority)}
                    className="w-full p-2 rounded-xl bg-workspace dark:bg-[#0B1728] border border-border focus:ring-1 focus:ring-teal focus:outline-none"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-ink-primary">
                    Target Channel
                  </label>
                  <select
                    value={newChannel}
                    onChange={(e) => setNewChannel(e.target.value)}
                    className="w-full p-2 rounded-xl bg-workspace dark:bg-[#0B1728] border border-border focus:ring-1 focus:ring-teal focus:outline-none"
                  >
                    <option value="omnichannel">Omnichannel</option>
                    <option value="social">Social Media</option>
                    <option value="display_ads">Display Ads</option>
                    <option value="email">Email</option>
                    <option value="website">Website / Landing</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-ink-primary">
                    Jurisdiction
                  </label>
                  <select
                    value={newJurisdiction}
                    onChange={(e) => setNewJurisdiction(e.target.value)}
                    className="w-full p-2 rounded-xl bg-workspace dark:bg-[#0B1728] border border-border focus:ring-1 focus:ring-teal focus:outline-none"
                  >
                    <option value="US">United States (FTC)</option>
                    <option value="EU">European Union (AI Act)</option>
                    <option value="UK">United Kingdom (ASA/CMA)</option>
                    <option value="CA">Canada (Competition Act)</option>
                    <option value="Global">Global / Multi-Region</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-ink-primary">
                    Regulated Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full p-2 rounded-xl bg-workspace dark:bg-[#0B1728] border border-border focus:ring-1 focus:ring-teal focus:outline-none"
                  >
                    <option value="b2b_enterprise_saas">B2B Enterprise SaaS</option>
                    <option value="financial_services">Financial Services</option>
                    <option value="healthcare_life_sciences">Healthcare / MedTech</option>
                    <option value="consumer_tech_ai">Consumer AI</option>
                    <option value="general_commercial">General Commercial</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-ink-primary">
                  Creative Brief & Substantiation Standards
                </label>
                <textarea
                  rows={2}
                  value={newBrief}
                  onChange={(e) => setNewBrief(e.target.value)}
                  placeholder="Key messaging pillars, claims requirements, footnotes..."
                  className="w-full p-2.5 rounded-xl bg-workspace dark:bg-[#0B1728] border border-border focus:ring-1 focus:ring-teal focus:outline-none"
                />
              </div>

              {/* Attach Existing Submissions */}
              <div>
                <label className="block font-semibold mb-1 text-ink-primary">
                  Select Existing Content / Design Assets to Attach
                </label>
                <div className="max-h-36 overflow-y-auto space-y-1.5 border border-border rounded-xl p-2 bg-workspace/40">
                  {availableSubmissions.length === 0 ? (
                    <span className="text-[11px] text-ink-muted">No drafts available.</span>
                  ) : (
                    availableSubmissions.map((sub) => {
                      const isChecked = selectedSubIdsForNew.includes(sub.id);
                      return (
                        <label
                          key={sub.id}
                          className="flex items-center space-x-2 text-xs p-1.5 rounded hover:bg-workspace cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedSubIdsForNew((prev) => [...prev, sub.id]);
                              } else {
                                setSelectedSubIdsForNew((prev) =>
                                  prev.filter((id) => id !== sub.id)
                                );
                              }
                            }}
                            className="rounded border-border text-teal focus:ring-teal"
                          />
                          <span className="truncate">{sub.title}</span>
                          <span className="text-[10px] text-ink-muted ml-auto">
                            {sub.content_type}
                          </span>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-border text-xs font-semibold hover:bg-workspace"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-teal text-slate-900 font-bold text-xs hover:bg-teal-400"
                >
                  Create Campaign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Attach Submissions to Existing Campaign */}
      {isAttachModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface dark:bg-[#162235] border border-border rounded-2xl p-6 w-full max-w-md space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="text-sm font-bold text-ink-primary flex items-center gap-2">
                <Layers className="w-4 h-4 text-teal" /> Attach Existing Assets
              </h3>
              <button
                type="button"
                onClick={() => setIsAttachModalOpen(false)}
                className="text-ink-muted hover:text-ink-primary p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2">
              {availableSubmissions.map((sub) => {
                const isAlreadyAttached = (
                  selectedCampaign?.submissions || []
                ).some((s) => s.id === sub.id);
                return (
                  <div
                    key={sub.id}
                    className="p-2.5 rounded-xl border border-border bg-workspace/50 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-semibold text-ink-primary block truncate">
                        {sub.title}
                      </span>
                      <span className="text-[10px] text-ink-muted">
                        Type: {sub.content_type}
                      </span>
                    </div>

                    {isAlreadyAttached ? (
                      <span className="text-[10px] text-teal font-semibold px-2 py-0.5 rounded bg-teal/10">
                        Attached
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleAttachSubmissions([sub.id])}
                        className="px-2.5 py-1 rounded-lg bg-teal text-slate-900 text-xs font-semibold hover:bg-teal-400"
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
    </div>
  );
}
