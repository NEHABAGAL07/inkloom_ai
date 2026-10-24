"use client";

import React, { useState, useEffect } from "react";
import { ContentSubmission, AnalyticsSummary, MemberInfo, AuditResult } from "@/types";
import { api } from "@/services/api";
import { useAuth } from "@/services/auth-context";
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
} from "lucide-react";
import { DesignerFeedbackComments } from "@/components/reviews/DesignerFeedbackComments";
import { DesignAssetViewerModal } from "@/components/reviews/DesignAssetViewerModal";

interface ManagerDashboardProps {
  submissions: ContentSubmission[];
  analytics: AnalyticsSummary | null;
  members: MemberInfo[];
  onRefresh: () => void;
}

export function ManagerDashboard({
  submissions,
  analytics,
  members,
  onRefresh,
}: ManagerDashboardProps) {
  const { activeOrgId, activeOrgName } = useAuth();
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

  const handleManagerDecision = async (action: "approve" | "request_changes") => {
    if (!selectedSubForAudit) return;
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
          bg: "bg-emerald-50 text-status-success border-emerald-200",
          icon: CheckCircle,
          label: "Approved",
        };
      case "pending_approval":
      case "submitted":
        return {
          bg: "bg-amber-50 text-status-warning border-amber-200",
          icon: Clock,
          label: "Pending Review",
        };
      case "changes_requested":
        return {
          bg: "bg-amber-50 text-status-warning border-amber-200",
          icon: AlertTriangle,
          label: "Changes Requested",
        };
      case "rejected":
        return {
          bg: "bg-rose-50 text-status-error border-rose-200",
          icon: AlertCircle,
          label: "Rejected",
        };
      default:
        return {
          bg: "bg-slate-100 text-ink-secondary border-border",
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
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Executive Header Banner */}
      <div className="bg-surface border border-border rounded-xl p-6 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-navy/10 text-navy border border-navy/20 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-navy" />
              Executive Brand Administration
            </span>
            <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-teal-50 text-teal-800 border border-teal-200">
              Active Governance
            </span>
          </div>
          <h1 className="text-2xl font-bold text-navy tracking-tight">
            {activeOrgName || "Enterprise"} Governance Overview
          </h1>
          <p className="text-xs text-ink-secondary mt-1 max-w-2xl leading-relaxed">
            Monitor organizational compliance benchmarks, cross-functional review queues, and brand guideline integrity across marketing and creative teams.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => setIsInviteModalOpen(true)}
            className="px-3.5 py-2 bg-teal hover:bg-teal-hover text-white text-xs font-semibold rounded-lg shadow-sm transition flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Invite Team Member</span>
          </button>
          <button
            onClick={onRefresh}
            className="px-3.5 py-2 bg-workspace hover:bg-border text-ink-primary border border-border text-xs font-semibold rounded-lg transition flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5 text-ink-secondary" />
            <span>Refresh</span>
          </button>
          <a
            href="/guidelines"
            className="px-3.5 py-2 bg-workspace hover:bg-border text-ink-primary border border-border text-xs font-semibold rounded-lg transition flex items-center gap-1.5"
          >
            <FileCheck className="w-3.5 h-3.5 text-teal" />
            <span>Brand Standards</span>
          </a>
        </div>
      </div>

      {/* Compliance Advisory Disclaimer Notice */}
      <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200/80 text-xs text-amber-900 flex items-start gap-2.5">
        <Scale className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <div className="text-[11px] leading-relaxed">
          <strong className="font-semibold text-amber-900">Advisory Role &amp; Compliance Workflow:</strong> Inkloom AI provides automated rule evaluation to assist internal brand governance and factual verification. Following approved guidelines establishes organizational conformity but <strong>does not guarantee legal immunity</strong> or eliminate regulatory risk. Final campaign publication requires human authorization.
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Approved Content */}
        <div className="p-5 rounded-xl bg-surface border border-border shadow-subtle space-y-1">
          <div className="flex items-center justify-between text-xs font-medium text-ink-secondary">
            <span>Approved Assets</span>
            <CheckCircle className="w-4 h-4 text-status-success" />
          </div>
          <div className="text-2xl font-bold text-navy mt-1">{approvedCount}</div>
          <div className="text-[11px] text-ink-muted">Authorized for publication</div>
        </div>

        {/* Pending Review */}
        <div className="p-5 rounded-xl bg-surface border border-border shadow-subtle space-y-1">
          <div className="flex items-center justify-between text-xs font-medium text-ink-secondary">
            <span>Pending Review</span>
            <Clock className="w-4 h-4 text-status-warning" />
          </div>
          <div className="text-2xl font-bold text-status-warning mt-1">{pendingCount}</div>
          <div className="text-[11px] text-ink-muted">Awaiting reviewer sign-off</div>
        </div>

        {/* Total Submissions */}
        <div className="p-5 rounded-xl bg-surface border border-border shadow-subtle space-y-1">
          <div className="flex items-center justify-between text-xs font-medium text-ink-secondary">
            <span>Total Submissions</span>
            <FileText className="w-4 h-4 text-teal" />
          </div>
          <div className="text-2xl font-bold text-navy mt-1">{submissions.length}</div>
          <div className="text-[11px] text-ink-muted">Campaigns, copy &amp; media files</div>
        </div>

        {/* Active Team Members */}
        <div className="p-5 rounded-xl bg-surface border border-border shadow-subtle space-y-1">
          <div className="flex items-center justify-between text-xs font-medium text-ink-secondary">
            <span>Workspace Team</span>
            <Users className="w-4 h-4 text-navy" />
          </div>
          <div className="text-2xl font-bold text-navy mt-1">{members.length || 4}</div>
          <div className="text-[11px] text-ink-muted">Legal, designers, marketing</div>
        </div>
      </div>

      {/* Two Column Layout: Content Pipeline & Team Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Organization Content Pipeline */}
        <div className="lg:col-span-8 bg-surface border border-border rounded-xl p-6 shadow-subtle space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
            <div>
              <h2 className="text-base font-bold text-navy flex items-center gap-2">
                <FileText className="w-4 h-4 text-teal" />
                <span>Organization Content Pipeline</span>
              </h2>
              <p className="text-xs text-ink-muted mt-0.5">
                Real-time review and audit status across all active content assets
              </p>
            </div>

            <div className="flex items-center gap-2">
              <a
                href="/content"
                className="text-xs text-teal hover:text-teal-hover font-semibold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Submission</span>
              </a>
            </div>
          </div>

          {/* Pipeline Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <button
              onClick={() => setPipelineFilter("all")}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition ${
                pipelineFilter === "all"
                  ? "bg-navy text-white font-semibold"
                  : "text-ink-secondary hover:bg-workspace bg-surface border border-border"
              }`}
            >
              All ({submissions.length})
            </button>
            <button
              onClick={() => setPipelineFilter("pending")}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition ${
                pipelineFilter === "pending"
                  ? "bg-navy text-white font-semibold"
                  : "text-ink-secondary hover:bg-workspace bg-surface border border-border"
              }`}
            >
              Pending Review ({pendingCount})
            </button>
            <button
              onClick={() => setPipelineFilter("visual")}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition ${
                pipelineFilter === "visual"
                  ? "bg-navy text-white font-semibold"
                  : "text-ink-secondary hover:bg-workspace bg-surface border border-border"
              }`}
            >
              Media &amp; Visuals (
              {
                submissions.filter(
                  (s) => s.content_type === "image" || s.content_type === "video"
                ).length
              }
              )
            </button>
            <button
              onClick={() => setPipelineFilter("approved")}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition ${
                pipelineFilter === "approved"
                  ? "bg-navy text-white font-semibold"
                  : "text-ink-secondary hover:bg-workspace bg-surface border border-border"
              }`}
            >
              Approved ({approvedCount})
            </button>
          </div>

          {/* Submissions List */}
          <div className="divide-y divide-border pt-1">
            {filteredSubmissions.length > 0 ? (
              filteredSubmissions.map((sub) => {
                const badge = getStatusBadge(sub.status);
                const BadgeIcon = badge.icon;
                const isSelected = selectedPipelineSub?.id === sub.id;
                return (
                  <div
                    key={sub.id}
                    onClick={() => setSelectedPipelineSub(sub)}
                    className={`py-3.5 flex items-center justify-between px-3 rounded-lg transition-colors gap-3 cursor-pointer ${
                      isSelected
                        ? "bg-teal/5 border border-teal/40 dark:bg-teal-950/20 shadow-sm"
                        : "hover:bg-workspace/60 border border-transparent"
                    }`}
                  >
                    <div className="space-y-1 max-w-[55%] min-w-0">
                      <div className="text-xs font-bold text-navy flex items-center gap-2 truncate">
                        <span className="truncate">{sub.title}</span>
                        <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-workspace border border-border text-ink-secondary shrink-0">
                          {sub.content_type}
                        </span>
                      </div>
                      <div className="text-[11px] text-ink-muted truncate">
                        {sub.description || "No description provided."}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold border flex items-center gap-1 ${badge.bg}`}
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
                        className="text-xs font-semibold px-2.5 py-1 rounded-md bg-teal hover:bg-teal-hover text-white transition flex items-center gap-1 shadow-sm"
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
                        className="text-xs font-semibold px-2.5 py-1 rounded-md bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 transition flex items-center gap-1"
                        title="Inspect AI rule checks and audit summary"
                      >
                        <ShieldCheck className="w-3 h-3 text-teal" />
                        <span>Audit</span>
                      </button>

                      <a
                        href={`/audits?id=${sub.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs font-medium px-2 py-1 rounded-md bg-workspace hover:bg-border text-ink-secondary border border-border transition"
                      >
                        Details
                      </a>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-12 text-center text-xs text-ink-muted">
                No submissions found for the selected filter.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Workspace Team Members */}
        <div className="lg:col-span-4 bg-surface border border-border rounded-xl p-6 shadow-subtle space-y-4 h-fit">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <h2 className="text-base font-bold text-navy flex items-center gap-2">
              <Users className="w-4 h-4 text-teal" />
              <span>Workspace Team</span>
            </h2>
            <button
              onClick={() => setIsInviteModalOpen(true)}
              className="text-xs text-teal hover:text-teal-hover font-semibold"
            >
              + Invite
            </button>
          </div>

          <div className="space-y-2.5">
            {members.slice(0, 5).map((m) => (
              <div
                key={m.user_id}
                className="p-3 rounded-lg bg-workspace border border-border flex items-center justify-between gap-2"
              >
                <div className="truncate min-w-0">
                  <div className="text-xs font-bold text-navy truncate">
                    {m.full_name || m.email}
                  </div>
                  <div className="text-[10px] text-ink-muted truncate">{m.email}</div>
                </div>
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-surface border border-border text-ink-secondary shrink-0">
                  {m.role.replace("_", " ")}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-2">
            <a
              href="/team"
              className="block w-full py-2 text-center text-xs font-semibold rounded-lg bg-workspace hover:bg-border text-ink-primary border border-border transition"
            >
              Manage Team &amp; Permissions &rarr;
            </a>
          </div>
        </div>
      </div>

      {/* Suggestion / Improvement Box under Designer's Content for Manager */}
      {selectedPipelineSub && (
        <DesignerFeedbackComments
          submissionId={selectedPipelineSub.id}
          submissionTitle={selectedPipelineSub.title}
          contentType={selectedPipelineSub.content_type}
          description={selectedPipelineSub.description}
          rawText={selectedPipelineSub.raw_text}
          fileName={selectedPipelineSub.file_name}
          mediaUrl={selectedPipelineSub.media_url}
          submission={selectedPipelineSub}
        />
      )}

      {/* Manager Audit Summary Modal */}
      {isAuditModalOpen && selectedSubForAudit && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl max-w-2xl w-full p-6 shadow-dropdown space-y-5 max-h-[90vh] overflow-y-auto text-ink-primary">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-teal flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-teal" />
                  <span>AI Brand Governance Review</span>
                </div>
                <h3 className="text-lg font-bold text-navy mt-1">
                  {selectedSubForAudit.title}
                </h3>
              </div>
              <button
                onClick={() => setIsAuditModalOpen(false)}
                className="text-ink-muted hover:text-ink-primary p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {actionFeedback && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-status-success text-xs rounded-lg font-semibold flex items-center gap-2">
                <Check className="w-4 h-4 text-status-success" />
                <span>{actionFeedback}</span>
              </div>
            )}

            {isLoadingAudit ? (
              <div className="py-12 text-center text-ink-muted text-xs flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-teal" />
                <span>Loading audit findings...</span>
              </div>
            ) : inspectionAudit ? (
              <div className="space-y-4">
                {/* Score & Review Notice */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-xl bg-workspace border border-border">
                    <div className="text-[11px] text-ink-secondary font-semibold uppercase tracking-wider">
                      Compliance Score
                    </div>
                    <div className="text-2xl font-bold text-navy mt-1">
                      {inspectionAudit.summary.compliance_score}
                      <span className="text-sm text-ink-muted font-normal ml-1">/100</span>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-workspace border border-border">
                    <div className="text-[11px] text-ink-secondary font-semibold uppercase tracking-wider">
                      Human Authority
                    </div>
                    <div className="text-xs font-bold text-status-warning mt-2 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-status-warning" />
                      <span>Reviewer Sign-off Required</span>
                    </div>
                  </div>
                </div>

                {/* AI Executive Summary */}
                {inspectionAudit.summary.verdict_overview && (
                  <div className="p-3.5 rounded-xl bg-workspace border border-border space-y-1">
                    <div className="text-xs font-bold text-navy uppercase tracking-wider">
                      Executive Verdict
                    </div>
                    <p className="text-xs text-ink-secondary leading-relaxed">
                      {inspectionAudit.summary.verdict_overview}
                    </p>
                  </div>
                )}

                {/* Findings List */}
                <div className="space-y-2">
                  <div className="text-xs font-bold text-navy uppercase tracking-wider">
                    Findings ({inspectionAudit.findings.length})
                  </div>
                  {inspectionAudit.findings.map((f) => (
                    <div
                      key={f.id}
                      className="p-3 rounded-lg bg-workspace border border-border space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-navy">{f.title}</span>
                        <span
                          className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                            f.severity === "high" || f.severity === "critical"
                              ? "bg-rose-50 text-status-error border border-rose-200"
                              : f.severity === "medium"
                              ? "bg-amber-50 text-status-warning border border-amber-200"
                              : "bg-teal-50 text-teal-800 border border-teal-200"
                          }`}
                        >
                          {f.severity}
                        </span>
                      </div>
                      <p className="text-xs text-ink-secondary">{f.message}</p>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="pt-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        setViewingSub(selectedSubForAudit);
                        setIsViewerOpen(true);
                      }}
                      className="text-xs text-teal hover:text-teal-hover font-bold flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Open Visual Asset Inspector ↗</span>
                    </button>
                    <a
                      href={`/audits?id=${inspectionAudit.content_id}`}
                      className="text-xs text-ink-secondary hover:text-navy font-semibold flex items-center gap-1"
                    >
                      <span>Full Audit</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => handleManagerDecision("request_changes")}
                      className="flex-1 sm:flex-none px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-status-warning border border-amber-300 font-semibold text-xs rounded-lg transition"
                    >
                      Request Changes
                    </button>
                    <button
                      onClick={() => handleManagerDecision("approve")}
                      className="flex-1 sm:flex-none px-4 py-2 bg-teal hover:bg-teal-hover text-white font-semibold text-xs rounded-lg shadow-sm transition"
                    >
                      Approve Asset
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Quick Invite Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-xl max-w-md w-full p-6 shadow-dropdown space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-navy flex items-center gap-2">
                <Users className="w-4 h-4 text-teal" />
                <span>Invite Team Member</span>
              </h3>
              <button
                onClick={() => setIsInviteModalOpen(false)}
                className="text-ink-muted hover:text-ink-primary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {inviteSuccessMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-status-success text-xs rounded-lg break-all">
                {inviteSuccessMsg}
              </div>
            )}

            <form onSubmit={handleSendInvite} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ink-primary mb-1">
                  Employee Email
                </label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@acmecloud.com"
                  className="w-full bg-workspace border border-border rounded-lg px-3 py-2 text-xs text-ink-primary focus:outline-none focus:border-teal"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-primary mb-1">
                  Designated Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full bg-workspace border border-border rounded-lg px-3 py-2 text-xs text-ink-primary focus:outline-none focus:border-teal"
                >
                  <option value="marketing">Marketing Content Creator</option>
                  <option value="designer">Senior Designer</option>
                  <option value="compliance_officer">Legal &amp; Compliance Reviewer</option>
                  <option value="admin">Workspace Co-Administrator</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-ink-secondary hover:bg-workspace border border-border"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isInviting}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-teal hover:bg-teal-hover disabled:opacity-50"
                >
                  {isInviting ? "Sending..." : "Send Invitation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Design Asset Viewer Modal */}
      <DesignAssetViewerModal
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
        submission={viewingSub}
        canAuthorize={true}
      />
    </div>
  );
}
