"use client";

import React, { useState } from "react";
import { ContentSubmission, AnalyticsSummary, MemberInfo, AuditResult } from "@/types";
import { api } from "@/services/api";
import { useAuth } from "@/services/auth-context";

interface ManagerDashboardProps {
  submissions: ContentSubmission[];
  analytics: AnalyticsSummary | null;
  members: MemberInfo[];
  onRefresh: () => void;
}

export function ManagerDashboard({ submissions, analytics, members, onRefresh }: ManagerDashboardProps) {
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

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrgId) return;
    setIsInviting(true);
    setInviteSuccessMsg(null);
    try {
      const inv = await api.createInvitation(activeOrgId, inviteEmail.trim(), inviteRole);
      setInviteSuccessMsg(`Invitation sent! Join link: ${window.location.origin}${inv.invite_url}`);
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
        comments: action === "approve" ? "Manager approved for publication." : "Manager requested visual/copy revisions.",
      });
      setActionFeedback(`Submission successfully marked as '${action === "approve" ? "Approved" : "Changes Requested"}'!`);
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
        return "bg-emerald-950/80 text-emerald-300 border-emerald-800/80";
      case "pending_approval":
      case "submitted":
        return "bg-indigo-950/80 text-indigo-300 border-indigo-800/80";
      case "changes_requested":
        return "bg-amber-950/80 text-amber-300 border-amber-800/80";
      case "rejected":
        return "bg-rose-950/80 text-rose-300 border-rose-800/80";
      default:
        return "bg-slate-800 text-slate-300 border-slate-700";
    }
  };

  const filteredSubmissions = submissions.filter((s) => {
    if (pipelineFilter === "pending") return s.status === "pending_approval" || s.status === "submitted";
    if (pipelineFilter === "visual") return s.content_type === "image" || s.content_type === "video";
    if (pipelineFilter === "approved") return s.status === "approved";
    return true;
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Hero Welcome Banner */}
      <div className="relative rounded-3xl overflow-hidden p-8 border border-indigo-500/20 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 shadow-2xl">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-bold">
            <span>👑 Executive Manager Workspace</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight sm:text-4xl">
            {activeOrgName || "Enterprise"} Brand Governance
          </h1>
          <p className="text-slate-300 text-sm leading-relaxed">
            Organization overview, cross-functional compliance rates, active employee management, and review operations across marketing and design teams.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <button
              onClick={() => setIsInviteModalOpen(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2"
            >
              <span>➕</span> Invite Employee
            </button>
            <button
              onClick={onRefresh}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
            >
              <span>🔄</span> Refresh Pipeline
            </button>
            <a
              href="/team"
              className="px-4 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold rounded-xl transition-all"
            >
              Manage Team & Permissions
            </a>
            <a
              href="/settings"
              className="px-4 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold rounded-xl transition-all"
            >
              Brand Guidelines Standard
            </a>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Overall Compliance</span>
            <span className="text-emerald-400 font-bold">✓ Target 90%</span>
          </div>
          <div className="text-3xl font-black text-white mt-2">
            {analytics?.overall_compliance_rate ?? 92.5}%
          </div>
          <div className="text-xs text-slate-500 mt-1">Passing corporate standards</div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Pending Reviews</span>
            <span className="text-amber-400 font-bold">Requires Action</span>
          </div>
          <div className="text-3xl font-black text-amber-400 mt-2">
            {submissions.filter((s) => s.status === "pending_approval" || s.status === "submitted").length}
          </div>
          <div className="text-xs text-slate-500 mt-1">Awaiting manager/legal sign-off</div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Total Submissions</span>
            <span className="text-indigo-400 font-bold">Workspace</span>
          </div>
          <div className="text-3xl font-black text-white mt-2">{submissions.length}</div>
          <div className="text-xs text-slate-500 mt-1">Campaigns, visual assets & media</div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Active Team Members</span>
            <span className="text-indigo-400 font-bold">Roles</span>
          </div>
          <div className="text-3xl font-black text-white mt-2">{members.length || 4}</div>
          <div className="text-xs text-slate-500 mt-1">Designers, Legal, Marketing</div>
        </div>
      </div>

      {/* Two Column Section: Recent Submissions + Active Team Members */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Organization Submissions */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>📋</span> Organization Content Pipeline
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Live view across all creative, media, and marketing submissions</p>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={onRefresh}
                className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
              >
                🔄 Refresh
              </button>
              <a href="/content" className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold">
                + New Submission
              </a>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 pt-1 border-b border-slate-800/80 pb-3">
            <button
              onClick={() => setPipelineFilter("all")}
              className={`text-xs px-3 py-1 rounded-lg font-semibold transition ${
                pipelineFilter === "all" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white bg-slate-950/60"
              }`}
            >
              All ({submissions.length})
            </button>
            <button
              onClick={() => setPipelineFilter("pending")}
              className={`text-xs px-3 py-1 rounded-lg font-semibold transition ${
                pipelineFilter === "pending" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white bg-slate-950/60"
              }`}
            >
              Pending Action ({submissions.filter((s) => s.status === "pending_approval" || s.status === "submitted").length})
            </button>
            <button
              onClick={() => setPipelineFilter("visual")}
              className={`text-xs px-3 py-1 rounded-lg font-semibold transition ${
                pipelineFilter === "visual" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white bg-slate-950/60"
              }`}
            >
              Design & Media ({submissions.filter((s) => s.content_type === "image" || s.content_type === "video").length})
            </button>
            <button
              onClick={() => setPipelineFilter("approved")}
              className={`text-xs px-3 py-1 rounded-lg font-semibold transition ${
                pipelineFilter === "approved" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white bg-slate-950/60"
              }`}
            >
              Approved ({submissions.filter((s) => s.status === "approved").length})
            </button>
          </div>

          <div className="divide-y divide-slate-800">
            {filteredSubmissions.length > 0 ? (
              filteredSubmissions.map((sub) => (
                <div key={sub.id} className="py-3.5 flex items-center justify-between hover:bg-slate-800/30 px-3 rounded-xl transition-all">
                  <div className="space-y-1 max-w-[55%]">
                    <div className="text-sm font-bold text-white flex items-center gap-2">
                      <span className="truncate">{sub.title}</span>
                      <span className={`text-[10px] uppercase px-1.5 py-0.5 rounded border shrink-0 ${
                        sub.content_type === "image"
                          ? "bg-fuchsia-950/80 text-fuchsia-300 border-fuchsia-800"
                          : sub.content_type === "video"
                          ? "bg-sky-950/80 text-sky-300 border-sky-800"
                          : "bg-slate-800 text-slate-400 border-slate-700"
                      }`}>
                        {sub.content_type}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 line-clamp-1">{sub.description || "No description provided."}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-bold border capitalize whitespace-nowrap ${getStatusBadge(sub.status)}`}>
                      {sub.status.replace("_", " ")}
                    </span>
                    <button
                      onClick={() => handleInspectAudit(sub)}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 transition-all flex items-center gap-1.5"
                    >
                      <span>🛡️</span> AI Summary
                    </button>
                    <a
                      href={`/audits?id=${sub.id}`}
                      className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all"
                    >
                      Diff
                    </a>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-xs text-slate-500">
                No submissions found for the selected filter.
              </div>
            )}
          </div>
        </div>

        {/* Right: Team Members Quick Glance */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>👥</span> Workspace Team
            </h2>
            <button
              onClick={() => setIsInviteModalOpen(true)}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
            >
              + Invite
            </button>
          </div>

          <div className="space-y-3">
            {members.map((m) => (
              <div key={m.user_id} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
                <div className="truncate pr-2">
                  <div className="text-xs font-bold text-white truncate">{m.full_name || m.email}</div>
                  <div className="text-[10px] text-slate-400 truncate">{m.email}</div>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-950/80 border border-indigo-800 text-indigo-400 capitalize">
                  {m.role}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-2">
            <a
              href="/team"
              className="block w-full py-2.5 text-center text-xs font-bold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all"
            >
              Manage Permissions & Invitations →
            </a>
          </div>
        </div>
      </div>

      {/* Manager AI Audit & Decision Modal */}
      {isAuditModalOpen && selectedSubForAudit && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                  <span>🛡️</span> AI Brand Governance Review
                </div>
                <h3 className="text-xl font-black text-white mt-1">{selectedSubForAudit.title}</h3>
              </div>
              <button
                onClick={() => setIsAuditModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {actionFeedback && (
              <div className="p-3.5 bg-emerald-950 border border-emerald-800 text-emerald-300 text-xs rounded-xl font-bold flex items-center gap-2">
                <span>✅</span>
                <span>{actionFeedback}</span>
              </div>
            )}

            {isLoadingAudit ? (
              <div className="py-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                <span className="w-4 h-4 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin"></span>
                <span>Loading AI audit findings...</span>
              </div>
            ) : inspectionAudit ? (
              <div className="space-y-4">
                {/* Score & Human in loop status */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                    <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Compliance Score</div>
                    <div className="text-3xl font-black text-emerald-400 mt-1 flex items-baseline">
                      {inspectionAudit.summary.compliance_score}
                      <span className="text-sm text-slate-400 font-bold ml-1">%</span>
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                    <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Human Authority</div>
                    <div className="text-sm font-bold text-amber-300 mt-2 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                      <span>Sign-off Required</span>
                    </div>
                  </div>
                </div>

                {/* AI Executive Verdict */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-1.5">
                  <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider">AI Executive Verdict</div>
                  <p className="text-xs text-slate-200 leading-relaxed italic">
                    &quot;{inspectionAudit.summary.verdict_overview}&quot;
                  </p>
                </div>

                {/* Findings List */}
                <div className="space-y-2.5">
                  <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Findings & Verification Checks ({inspectionAudit.findings.length})
                  </div>
                  {inspectionAudit.findings.map((f) => (
                    <div key={f.id} className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">{f.title}</span>
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                          f.severity === "high" || f.severity === "critical"
                            ? "bg-rose-950 text-rose-300 border border-rose-800"
                            : f.severity === "medium"
                            ? "bg-amber-950 text-amber-300 border border-amber-800"
                            : "bg-indigo-950 text-indigo-300 border border-indigo-800"
                        }`}>
                          {f.severity}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">{f.message}</p>
                      {f.suggested_correction && (
                        <div className="text-xs p-2 rounded-lg bg-indigo-950/30 border border-indigo-900/40 text-indigo-200 mt-1">
                          <strong>Remediation:</strong> {f.suggested_correction.replacement_text}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Decision Actions */}
                <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <a
                    href={`/audits?id=${inspectionAudit.content_id}`}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                  >
                    Open in Full Audit Workspace ↗
                  </a>

                  <div className="flex items-center gap-2.5 w-full sm:w-auto">
                    <button
                      onClick={() => handleManagerDecision("request_changes")}
                      className="flex-1 sm:flex-none px-4 py-2 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40 font-bold text-xs rounded-xl transition"
                    >
                      ⚠️ Request Changes
                    </button>
                    <button
                      onClick={() => handleManagerDecision("approve")}
                      className="flex-1 sm:flex-none px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-1.5"
                    >
                      <span>✅</span> Approve Asset
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
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>✉️</span> Invite Team Member
              </h3>
              <button
                onClick={() => setIsInviteModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {inviteSuccessMsg && (
              <div className="p-3 bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs rounded-xl break-all">
                {inviteSuccessMsg}
              </div>
            )}

            <form onSubmit={handleSendInvite} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Employee Email</label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@acmecloud.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Designated Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="marketing">Marketing Content Creator</option>
                  <option value="designer">Senior Designer</option>
                  <option value="compliance_officer">Legal & Compliance Reviewer</option>
                  <option value="admin">Workspace Co-Administrator</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isInviting}
                  className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50"
                >
                  {isInviting ? "Sending..." : "Send Invitation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
