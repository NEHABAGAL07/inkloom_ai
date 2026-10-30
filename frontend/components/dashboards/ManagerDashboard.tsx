"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ContentSubmission, AnalyticsSummary, MemberInfo, AuditResult } from "@/types";
import { api } from "@/services/api";
import { useAuth } from "@/services/auth-context";
import { BackgroundAtmosphere } from "@/components/layout/BackgroundAtmosphere";
import {
  Shield,
  ShieldCheck,
  AlertTriangle,
  Clock,
  CheckCircle,
  Users,
  FileText,
  Plus,
  RefreshCw,
  ExternalLink,
  Search,
  Building,
  Scale,
  X,
  Check,
  AlertCircle,
  FileCheck,
  Eye,
  Lock,
  Layers,
  Sparkles,
  BookOpen,
} from "lucide-react";
import { DesignAssetViewerModal } from "@/components/reviews/DesignAssetViewerModal";

interface ManagerDashboardProps {
  submissions: ContentSubmission[];
  analytics: AnalyticsSummary | null;
  members: MemberInfo[];
  onRefresh: () => void;
}

const DASHBOARD_TEMPLATES = [
  {
    id: "linkedin",
    name: "LinkedIn Post",
    format: "Social Campaign",
    title: "Autonomous Zero-Trust Cloud Platform Release",
    sample: "We are thrilled to announce Acme Cloud Fabric 4.0! With sub-50ms core latency and deterministic throughput, engineering teams can eliminate downtime forever.",
  },
  {
    id: "instagram",
    name: "Instagram Caption",
    format: "Visual & Social",
    title: "Engineering-First Cloud Performance",
    sample: "Simplicity without compromise. Acme Cloud gives platform architects sub-50ms latency across global edge points. Deterministic compute engineered for modern scale.",
  },
  {
    id: "facebook",
    name: "Facebook Ad",
    format: "Display Ad",
    title: "Eliminate Cloud Outages with Zero-Trust Compute",
    sample: "Tired of unpredictable downtime? Acme Cloud delivers mathematically verifiable hybrid compute. Guaranteed 100% reduction in multi-cloud overhead.",
  },
  {
    id: "blog",
    name: "Blog & Editorial",
    format: "Long-form",
    title: "Why Autonomous Zero-Trust Infrastructure Matters in 2026",
    sample: "In modern distributed enterprise architectures, legacy perimeter defenses are no longer sufficient. Acme Cloud Systems provides deterministic zero-trust compute.",
  },
  {
    id: "email",
    name: "Marketing Email",
    format: "Product Announcement",
    title: "Important Update: Upgrade to Acme Cloud Infrastructure",
    sample: "Hello platform team, We are excited to share new certified performance benchmarks for Acme Cloud. Our platform delivers verified multi-region isolation and sub-50ms latency.",
  },
  {
    id: "press_release",
    name: "Press Release",
    format: "Corporate Comms",
    title: "Acme Cloud Systems Certified for Global Enterprise Deployments",
    sample: "Acme Cloud Systems today announced verified compliance certifications for enterprise cloud infrastructure across 42 global regions.",
  },
];

export function ManagerDashboard({
  submissions,
  analytics,
  members,
  onRefresh,
}: ManagerDashboardProps) {
  const { activeOrgId, activeOrgName, user } = useAuth();
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("marketing");
  const [isInviting, setIsInviting] = useState(false);
  const [inviteSuccessMsg, setInviteSuccessMsg] = useState<string | null>(null);

  // Pipeline Filter: all, pending, visual, approved
  const [pipelineFilter, setPipelineFilter] = useState<"all" | "pending" | "visual" | "approved">("all");

  // Manager Audit Inspection Modal
  const [selectedSubForAudit, setSelectedSubForAudit] = useState<ContentSubmission | null>(null);
  const [inspectionAudit, setInspectionAudit] = useState<AuditResult | null>(null);
  const [isLoadingAudit, setIsLoadingAudit] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Selected submission for live comments & manager suggestions
  const [selectedPipelineSub, setSelectedPipelineSub] = useState<ContentSubmission | null>(null);

  // Asset Viewer Modal state
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [viewingSub, setViewingSub] = useState<ContentSubmission | null>(null);

  useEffect(() => {
    if (!selectedPipelineSub && submissions.length > 0) {
      setSelectedPipelineSub(submissions[0]);
    }
  }, [submissions.length]);

  useEffect(() => {
    const handleAssetUpdate = () => {
      onRefresh();
    };
    if (typeof window !== "undefined") {
      window.addEventListener("inkloom_asset_updated", handleAssetUpdate);
      return () => window.removeEventListener("inkloom_asset_updated", handleAssetUpdate);
    }
  }, [onRefresh]);

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrgId) return;
    setIsInviting(true);
    setInviteSuccessMsg(null);
    try {
      const inv = await api.createInvitation(activeOrgId, inviteEmail.trim(), inviteRole);
      setInviteSuccessMsg(`Invitation generated! Join link: ${window.location.origin}${inv.invite_url}`);
      setInviteEmail("");
      onRefresh();
    } catch (err: any) {
      alert(err.message || "Failed to create invitation");
    } finally {
      setIsInviting(false);
    }
  };

  const handleInspectAudit = async (sub: ContentSubmission) => {
    setSelectedSubForAudit(sub);
    setIsLoadingAudit(true);
    setIsAuditModalOpen(true);
    setActionFeedback(null);
    try {
      const audit = await api.getAudit(sub.id);
      setInspectionAudit(audit);
    } catch (e) {
      console.error("Failed to load audit", e);
    } finally {
      setIsLoadingAudit(false);
    }
  };

  const isAuthorOfSub = Boolean(
    selectedSubForAudit &&
      user &&
      ((selectedSubForAudit.creator_id && selectedSubForAudit.creator_id === user.id) ||
        (selectedSubForAudit.author_id && selectedSubForAudit.author_id === user.id) ||
        (selectedSubForAudit.author_email &&
          user.email &&
          selectedSubForAudit.author_email.toLowerCase() === user.email.toLowerCase()) ||
        (selectedSubForAudit.created_by && selectedSubForAudit.created_by === user.id))
  );

  const handleManagerDecision = async (action: "approve" | "request_changes") => {
    if (!selectedSubForAudit) return;
    if (action === "approve" && isAuthorOfSub) {
      alert(
        "Separation of duties violation: Creators cannot authorize their own submissions. Please request review from another manager or compliance officer."
      );
      return;
    }
    try {
      await api.submitReviewDecision({
        submission_id: selectedSubForAudit.id,
        revision_id: selectedSubForAudit.current_revision_id,
        action,
        comments:
          action === "approve"
            ? "Manager approved for publication."
            : "Manager requested visual/copy revisions.",
      });
      setActionFeedback(
        `Submission marked as '${action === "approve" ? "Approved" : "Changes Requested"}'!`
      );
      setTimeout(() => {
        setIsAuditModalOpen(false);
        onRefresh();
      }, 700);
    } catch (e: any) {
      alert(e.message || "Failed to submit decision");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return {
          bg: "bg-[#E8F7F1] text-[#087F70] border-[#C8E2D8] dark:bg-[#72D6A1]/15 dark:text-[#72D6A1] dark:border-[#72D6A1]/30",
          icon: CheckCircle,
          label: "Approved",
        };
      case "pending_approval":
      case "submitted":
        return {
          bg: "bg-amber-50 text-amber-800 border-amber-200 dark:bg-[#FFAA35]/15 dark:text-[#FFAA35] dark:border-[#FFAA35]/30",
          icon: Clock,
          label: "Pending Review",
        };
      case "changes_requested":
        return {
          bg: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-[#FFD166]/15 dark:text-[#FFD166] dark:border-[#FFD166]/30",
          icon: AlertTriangle,
          label: "Changes Requested",
        };
      case "rejected":
        return {
          bg: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-[#FF6B78]/15 dark:text-[#FF6B78] dark:border-[#FF6B78]/30",
          icon: AlertCircle,
          label: "Rejected",
        };
      default:
        return {
          bg: "bg-[#EFF8F4] text-[#58716A] border-[#DDEBE5] dark:bg-[#272727] dark:text-[#B8B2AC] dark:border-[#383838]",
          icon: FileText,
          label: status.replace("_", " "),
        };
    }
  };

  const filteredSubmissions = submissions.filter((s) => {
    if (pipelineFilter === "pending")
      return s.status === "pending_approval" || s.status === "submitted";
    if (pipelineFilter === "visual")
      return s.content_type === "image" || s.content_type === "video";
    if (pipelineFilter === "approved") return s.status === "approved";
    return true;
  });

  const pendingCount = submissions.filter(
    (s) => s.status === "pending_approval" || s.status === "submitted"
  ).length;
  const approvedCount = submissions.filter((s) => s.status === "approved").length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto relative selection:bg-[#FF7A36]/30 selection:text-white">
      {/* ========================================================
          1. Hero Section with Warm Gradient Ribbon
          ======================================================== */}
      <div className="bg-white dark:bg-[#1C1C1C] rounded-2xl p-7 sm:p-10 border border-border dark:border-[#383838] shadow-[0_8px_30px_rgba(22,91,72,0.07)] dark:shadow-2xl relative overflow-hidden">
        <BackgroundAtmosphere variant="hero" />
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#087F70] via-[#10A995] to-[#58D9D0] dark:from-[#FFD84D] dark:via-[#FF7A36] dark:to-[#F45B91]" />

        <div className="max-w-3xl space-y-4 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#E8F7F1] dark:bg-[#272727] border border-[#C8E2D8] dark:border-[#383838] text-xs font-semibold text-[#087F70] dark:text-[#FFAA35] shadow-sm">
            <Shield className="w-3.5 h-3.5 text-[#10A995] dark:text-[#FFD84D]" />
            <span>Executive Governance Command Center</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-heading font-extrabold tracking-tight text-[#18352F] dark:text-[#F7F3ED] leading-[1.15]">
            Every draft, <span className="text-gradient-warm">in good hands.</span>
          </h1>

          <p className="text-xs sm:text-sm text-[#58716A] dark:text-[#B8B2AC] leading-relaxed max-w-2xl">
            Autonomous zero-trust brand governance co-pilot for {activeOrgName || "Enterprise"}. Monitor cross-functional review queues, enforce certified claims, and manage team authority.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              href="/content"
              className="px-5 py-3 rounded-xl btn-gradient-warm text-xs font-bold transition flex items-center gap-2 shadow-warmGlow text-white dark:text-[#111111]"
            >
              <Plus className="w-4 h-4 text-white dark:text-[#111111] stroke-[2.5]" />
              <span>Start a Content Review</span>
            </Link>

            <button
              onClick={() => setIsInviteModalOpen(true)}
              className="px-5 py-3 rounded-xl btn-dark-secondary text-xs font-bold transition flex items-center gap-2"
            >
              <Users className="w-4 h-4 text-[#087F70] dark:text-[#FFAA35]" />
              <span>Invite Team Member</span>
            </button>

            <Link
              href="/guidelines"
              className="px-5 py-3 rounded-xl bg-[#EFF8F4] dark:bg-[#202020] hover:bg-[#DDF3EB] dark:hover:bg-[#272727] text-[#58716A] dark:text-[#B8B2AC] hover:text-[#18352F] dark:hover:text-[#F7F3ED] border border-border dark:border-[#383838] text-xs font-bold transition flex items-center gap-2"
            >
              <FileCheck className="w-4 h-4 text-[#82948E] dark:text-[#85817D]" />
              <span>Brand Standards</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ========================================================
          2. Template Cards: LinkedIn, Instagram, Facebook, Blogs, Emails
          ======================================================== */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-heading font-bold uppercase tracking-wider text-[#82948E] dark:text-[#85817D] flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#087F70] dark:text-[#FFAA35]" />
            <span>Supported Content Formats &amp; Templates</span>
          </h2>
          <Link
            href="/content"
            className="text-[11px] text-[#087F70] hover:text-[#10A995] dark:text-[#FFAA35] dark:hover:text-[#FFD84D] font-semibold transition"
          >
            Open Full Review Studio →
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {DASHBOARD_TEMPLATES.map((tpl) => (
            <Link
              key={tpl.id}
              href={`/content?template=${tpl.id}`}
              className="p-3.5 rounded-xl bg-white dark:bg-[#1C1C1C] border border-border dark:border-[#383838] hover:border-[#10A995] hover:bg-[#E8F7F1]/60 dark:hover:border-[#FFAA35]/60 dark:hover:bg-[#242424] text-left transition-all duration-150 group flex flex-col justify-between h-32 shadow-[0_4px_20px_rgba(22,91,72,0.05)] dark:shadow-none card-dark-hover"
            >
              <div>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#E8F7F1] text-[#087F70] border border-[#C8E2D8] dark:bg-[#272727] dark:text-[#FFAA35] dark:border-[#383838]">
                  {tpl.format}
                </span>
                <div className="text-xs font-bold text-[#18352F] dark:text-[#F7F3ED] mt-2 group-hover:text-[#087F70] dark:group-hover:text-[#FFAA35] transition truncate">
                  {tpl.name}
                </div>
              </div>
              <p className="text-[10.5px] text-[#58716A] dark:text-[#85817D] line-clamp-2 leading-relaxed">
                {tpl.sample}
              </p>
            </Link>
          ))}
        </div>
      </div>

      {/* Compliance Advisory Disclaimer Notice */}
      <div className="p-4 rounded-xl bg-white dark:bg-[#1C1C1C] border border-border dark:border-[#383838] text-xs text-[#58716A] dark:text-[#B8B2AC] flex items-start gap-3 shadow-[0_4px_20px_rgba(22,91,72,0.05)] dark:shadow-sm">
        <Scale className="w-4 h-4 text-[#087F70] dark:text-[#FFAA35] shrink-0 mt-0.5" />
        <div className="text-[11px] leading-relaxed">
          <strong className="font-semibold text-[#18352F] dark:text-[#F7F3ED]">Human Authority Guarantee:</strong> AI assists, scores, and recommends intent-preserving rewrites, but authorized enterprise reviewers always make the final publication sign-off decision.
        </div>
      </div>

      {/* ========================================================
          3. Executive KPI Cards with Warm Subtle Lighting
          ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Approved Content */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#1C1C1C] border border-border dark:border-[#383838] shadow-[0_8px_30px_rgba(22,91,72,0.07)] dark:shadow-card space-y-1 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-medium text-[#58716A] dark:text-[#85817D]">
            <span>Approved Assets</span>
            <CheckCircle className="w-4 h-4 text-[#087F70] dark:text-[#72D6A1]" />
          </div>
          <div className="text-3xl font-heading font-extrabold text-[#18352F] dark:text-[#F7F3ED] mt-1">{approvedCount}</div>
          <div className="text-[11px] text-[#82948E] dark:text-[#85817D]">Authorized for release</div>
        </div>

        {/* Pending Review */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#1C1C1C] border border-border dark:border-[#383838] shadow-[0_8px_30px_rgba(22,91,72,0.07)] dark:shadow-card space-y-1 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-medium text-[#58716A] dark:text-[#85817D]">
            <span>Pending Review</span>
            <Clock className="w-4 h-4 text-[#087F70] dark:text-[#FFAA35]" />
          </div>
          <div className="text-3xl font-heading font-extrabold text-[#087F70] dark:text-[#FFAA35] mt-1">{pendingCount}</div>
          <div className="text-[11px] text-[#82948E] dark:text-[#85817D]">Awaiting sign-off</div>
        </div>

        {/* Total Submissions */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#1C1C1C] border border-border dark:border-[#383838] shadow-[0_8px_30px_rgba(22,91,72,0.07)] dark:shadow-card space-y-1 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-medium text-[#58716A] dark:text-[#85817D]">
            <span>Total Submissions</span>
            <FileText className="w-4 h-4 text-[#10A995] dark:text-[#F45B91]" />
          </div>
          <div className="text-3xl font-heading font-extrabold text-[#18352F] dark:text-[#F7F3ED] mt-1">{submissions.length}</div>
          <div className="text-[11px] text-[#82948E] dark:text-[#85817D]">Campaigns, copy &amp; media</div>
        </div>

        {/* Active Team Members */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#1C1C1C] border border-border dark:border-[#383838] shadow-[0_8px_30px_rgba(22,91,72,0.07)] dark:shadow-card space-y-1 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-medium text-[#58716A] dark:text-[#85817D]">
            <span>Workspace Team</span>
            <Users className="w-4 h-4 text-[#087F70] dark:text-[#83B9FF]" />
          </div>
          <div className="text-3xl font-heading font-extrabold text-[#18352F] dark:text-[#F7F3ED] mt-1">{members.length || 4}</div>
          <div className="text-[11px] text-[#82948E] dark:text-[#85817D]">Legal, designers, marketing</div>
        </div>
      </div>

      {/* ========================================================
          4. Organization Content Pipeline
          ======================================================== */}
      <div className="bg-white dark:bg-[#1C1C1C] border border-border dark:border-[#383838] rounded-2xl p-6 shadow-[0_8px_30px_rgba(22,91,72,0.07)] dark:shadow-card space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border dark:border-[#383838]">
          <div>
            <h2 className="text-base font-heading font-bold text-[#18352F] dark:text-[#F7F3ED] flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#087F70] dark:text-[#FFAA35]" />
              <span>Organization Content Pipeline</span>
            </h2>
            <p className="text-xs text-[#58716A] dark:text-[#85817D] mt-0.5">
              Real-time review and audit status across all active content assets
            </p>
          </div>
          <button
            onClick={onRefresh}
            className="px-3 py-1.5 rounded-xl btn-dark-secondary text-xs font-semibold flex items-center gap-1.5 transition self-start sm:self-auto"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#58716A] dark:text-[#85817D]" />
            <span>Refresh</span>
          </button>
        </div>

        {/* Pipeline Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <button
            onClick={() => setPipelineFilter("all")}
            className={`text-xs px-3.5 py-1.5 rounded-xl font-medium transition ${
              pipelineFilter === "all"
                ? "bg-[#E8F7F1] text-[#087F70] border border-[#C8E2D8] font-bold shadow-sm dark:bg-[#272727] dark:text-[#F7F3ED] dark:border-[#FFAA35]/50"
                : "text-[#58716A] hover:bg-[#DDF3EB] bg-[#F7FBF9] border border-border dark:text-[#B8B2AC] dark:hover:bg-[#242424] dark:bg-[#202020] dark:border-[#383838]"
            }`}
          >
            All ({submissions.length})
          </button>
          <button
            onClick={() => setPipelineFilter("pending")}
            className={`text-xs px-3.5 py-1.5 rounded-xl font-medium transition ${
              pipelineFilter === "pending"
                ? "bg-[#E8F7F1] text-[#087F70] border border-[#C8E2D8] font-bold shadow-sm dark:bg-[#272727] dark:text-[#F7F3ED] dark:border-[#FFAA35]/50"
                : "text-[#58716A] hover:bg-[#DDF3EB] bg-[#F7FBF9] border border-border dark:text-[#B8B2AC] dark:hover:bg-[#242424] dark:bg-[#202020] dark:border-[#383838]"
            }`}
          >
            Pending Review ({pendingCount})
          </button>
          <button
            onClick={() => setPipelineFilter("visual")}
            className={`text-xs px-3.5 py-1.5 rounded-xl font-medium transition ${
              pipelineFilter === "visual"
                ? "bg-[#E8F7F1] text-[#087F70] border border-[#C8E2D8] font-bold shadow-sm dark:bg-[#272727] dark:text-[#F7F3ED] dark:border-[#FFAA35]/50"
                : "text-[#58716A] hover:bg-[#DDF3EB] bg-[#F7FBF9] border border-border dark:text-[#B8B2AC] dark:hover:bg-[#242424] dark:bg-[#202020] dark:border-[#383838]"
            }`}
          >
            Media &amp; Visuals (
            {submissions.filter((s) => s.content_type === "image" || s.content_type === "video").length}
            )
          </button>
          <button
            onClick={() => setPipelineFilter("approved")}
            className={`text-xs px-3.5 py-1.5 rounded-xl font-medium transition ${
              pipelineFilter === "approved"
                ? "bg-[#E8F7F1] text-[#087F70] border border-[#C8E2D8] font-bold shadow-sm dark:bg-[#272727] dark:text-[#F7F3ED] dark:border-[#FFAA35]/50"
                : "text-[#58716A] hover:bg-[#DDF3EB] bg-[#F7FBF9] border border-border dark:text-[#B8B2AC] dark:hover:bg-[#242424] dark:bg-[#202020] dark:border-[#383838]"
            }`}
          >
            Approved ({approvedCount})
          </button>
        </div>

        {/* Submissions List */}
        <div className="divide-y divide-border dark:divide-[#383838] pt-1">
          {filteredSubmissions.length > 0 ? (
            filteredSubmissions.map((sub) => {
              const badge = getStatusBadge(sub.status);
              const BadgeIcon = badge.icon;
              const isSelected = selectedPipelineSub?.id === sub.id;
              return (
                <div
                  key={sub.id}
                  onClick={() => setSelectedPipelineSub(sub)}
                  className={`py-3.5 flex items-center justify-between px-3 rounded-xl transition-all gap-3 cursor-pointer ${
                    isSelected
                      ? "bg-[#E8F7F1] border border-[#C8E2D8] shadow-sm dark:bg-[#272727] dark:border-[#FFAA35]/40"
                      : "hover:bg-[#EFF8F4] border border-transparent dark:hover:bg-[#202020]"
                  }`}
                >
                  <div className="space-y-1 max-w-[55%] min-w-0">
                    <div className="text-xs font-bold text-[#18352F] dark:text-[#F7F3ED] flex items-center gap-2 truncate">
                      <span className="truncate">{sub.title}</span>
                      <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-[#EFF8F4] border border-[#DDEBE5] text-[#58716A] dark:bg-[#141414] dark:border-[#383838] dark:text-[#85817D] shrink-0">
                        {sub.content_type}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#58716A] dark:text-[#85817D] truncate">
                      {sub.description || "No description provided."}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-[11px] px-2.5 py-1 rounded-full font-bold border flex items-center gap-1 ${badge.bg}`}
                    >
                      <BadgeIcon className="w-3 h-3" />
                      <span>{badge.label}</span>
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setViewingSub(sub);
                        setIsViewerOpen(true);
                      }}
                      className="text-xs font-semibold px-2.5 py-1 rounded-lg btn-dark-secondary transition flex items-center gap-1"
                      title="Open and view design asset or document"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Open</span>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleInspectAudit(sub);
                      }}
                      className="text-xs font-bold px-2.5 py-1 rounded-lg bg-[#E8F7F1] hover:bg-[#DDF3EB] text-[#087F70] border border-[#C8E2D8] dark:bg-[#272727] dark:hover:bg-[#2F2F2F] dark:text-[#FFAA35] dark:border-[#383838] transition flex items-center gap-1"
                      title="Inspect AI rule checks and audit summary"
                    >
                      <ShieldCheck className="w-3 h-3 text-[#087F70] dark:text-[#FFAA35]" />
                      <span>Audit</span>
                    </button>

                    <Link
                      href={`/audits?id=${sub.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs font-medium px-2 py-1 rounded-lg bg-[#EFF8F4] hover:bg-[#DDF3EB] text-[#58716A] hover:text-[#18352F] border border-[#DDEBE5] dark:bg-[#202020] dark:hover:bg-[#272727] dark:text-[#85817D] dark:hover:text-[#F7F3ED] dark:border-[#383838] transition"
                    >
                      Details
                    </Link>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center text-xs text-[#82948E] dark:text-[#85817D]">
              No submissions found for the selected filter.
            </div>
          )}
        </div>
      </div>
{/* Manager Audit Summary Modal */}
      {isAuditModalOpen && selectedSubForAudit && (
        <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1C1C1C] border border-border dark:border-[#383838] rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto text-[#18352F] dark:text-[#F7F3ED]">
            <div className="flex items-center justify-between border-b border-border dark:border-[#383838] pb-4">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-[#087F70] dark:text-[#FFAA35] flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#087F70] dark:text-[#FFAA35]" />
                  <span>AI Brand Governance Review</span>
                </div>
                <h3 className="text-lg font-heading font-bold text-[#18352F] dark:text-[#F7F3ED] mt-1">
                  {selectedSubForAudit.title}
                </h3>
              </div>
              <button
                onClick={() => setIsAuditModalOpen(false)}
                className="text-[#82948E] hover:text-[#18352F] dark:text-[#85817D] dark:hover:text-[#F7F3ED] p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {actionFeedback && (
              <div className="p-3 bg-[#E8F7F1] dark:bg-[#272727] border border-[#C8E2D8] dark:border-[#72D6A1]/40 text-[#087F70] dark:text-[#72D6A1] text-xs rounded-xl font-semibold flex items-center gap-2">
                <Check className="w-4 h-4 text-[#087F70] dark:text-[#72D6A1]" />
                <span>{actionFeedback}</span>
              </div>
            )}

            {isLoadingAudit ? (
              <div className="py-12 text-center text-[#82948E] dark:text-[#85817D] text-xs flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-[#087F70] dark:text-[#FFAA35]" />
                <span>Loading audit findings...</span>
              </div>
            ) : inspectionAudit ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-xl bg-[#F7FBF9] dark:bg-[#202020] border border-border dark:border-[#383838]">
                    <div className="text-[11px] text-[#82948E] dark:text-[#85817D] font-semibold uppercase tracking-wider">
                      Compliance Score
                    </div>
                    <div className="text-2xl font-heading font-bold text-gradient-warm mt-1">
                      {inspectionAudit.summary.compliance_score}
                      <span className="text-sm text-[#82948E] dark:text-[#85817D] font-normal ml-1">/100</span>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-[#F7FBF9] dark:bg-[#202020] border border-border dark:border-[#383838]">
                    <div className="text-[11px] text-[#82948E] dark:text-[#85817D] font-semibold uppercase tracking-wider">
                      Violations Count
                    </div>
                    <div className="text-2xl font-heading font-bold text-[#E11D48] dark:text-[#FF6B78] mt-1">
                      {inspectionAudit.findings.length}
                    </div>
                  </div>
                </div>

                {/* Manager Decision Buttons */}
                <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border dark:border-[#383838]">
                  <button
                    onClick={() => handleManagerDecision("request_changes")}
                    className="px-4 py-2 rounded-xl bg-[#EFF8F4] hover:bg-[#DDF3EB] text-[#087F70] border border-[#C8E2D8] text-xs font-semibold dark:bg-[#272727] dark:hover:bg-[#333333] dark:text-[#FFAA35] dark:border-[#383838]"
                  >
                    Request Revision
                  </button>
                  <button
                    onClick={() => handleManagerDecision("approve")}
                    className="px-4 py-2 rounded-xl btn-gradient-warm text-xs font-bold shadow-warmGlow text-white dark:text-[#111111]"
                  >
                    Authorize Publication
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-[#82948E] dark:text-[#85817D]">
                Unable to load audit details.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Invite Member Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1C1C1C] border border-border dark:border-[#383838] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-[#18352F] dark:text-[#F7F3ED] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border dark:border-[#383838] pb-3">
              <h3 className="text-sm font-heading font-bold text-[#18352F] dark:text-[#F7F3ED]">
                Invite New Team Member
              </h3>
              <button
                onClick={() => {
                  setIsInviteModalOpen(false);
                  setInviteSuccessMsg(null);
                }}
                className="text-[#82948E] hover:text-[#18352F] dark:text-[#85817D] dark:hover:text-[#F7F3ED]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {inviteSuccessMsg && (
              <div className="p-3 rounded-xl bg-[#E8F7F1] dark:bg-[#272727] border border-[#C8E2D8] dark:border-[#72D6A1]/40 text-[#087F70] dark:text-[#72D6A1] text-xs leading-relaxed break-all">
                {inviteSuccessMsg}
              </div>
            )}

            <form onSubmit={handleSendInvite} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#18352F] dark:text-[#F7F3ED] mb-1.5">
                  Corporate Email *
                </label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@acmecloud.com"
                  className="w-full bg-[#F7FBF9] dark:bg-[#141414] border border-border dark:border-[#383838] rounded-xl px-3 py-2 text-xs text-[#18352F] dark:text-[#F7F3ED] placeholder:text-[#82948E] dark:placeholder:text-[#85817D] focus:outline-none focus:border-[#10A995] dark:focus:border-[#FFAA35]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#18352F] dark:text-[#F7F3ED] mb-1.5">
                  Role Assignment *
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full bg-[#F7FBF9] dark:bg-[#141414] border border-border dark:border-[#383838] rounded-xl px-3 py-2 text-xs text-[#18352F] dark:text-[#F7F3ED] focus:outline-none focus:border-[#10A995] dark:focus:border-[#FFAA35]"
                >
                  <option value="marketing" className="bg-white dark:bg-[#1C1C1C]">Marketing Lead</option>
                  <option value="designer" className="bg-white dark:bg-[#1C1C1C]">Brand Designer</option>
                  <option value="compliance_officer" className="bg-white dark:bg-[#1C1C1C]">Legal &amp; Compliance</option>
                  <option value="admin" className="bg-white dark:bg-[#1C1C1C]">Brand Administrator</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border dark:border-[#383838]">
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="px-4 py-2 rounded-xl btn-dark-secondary text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isInviting}
                  className="px-4 py-2 rounded-xl btn-gradient-warm text-xs font-bold shadow-warmGlow text-white dark:text-[#111111]"
                >
                  {isInviting ? "Sending Invite..." : "Send Invitation"}
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
