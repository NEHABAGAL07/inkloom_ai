"use client";

import React, { useState } from "react";
import { ContentSubmission, AnalyticsSummary, MemberInfo } from "@/types";
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-emerald-950/80 text-emerald-300 border-emerald-800/80";
      case "pending_approval":
        return "bg-indigo-950/80 text-indigo-300 border-indigo-800/80";
      case "changes_requested":
        return "bg-amber-950/80 text-amber-300 border-amber-800/80";
      case "rejected":
        return "bg-rose-950/80 text-rose-300 border-rose-800/80";
      default:
        return "bg-slate-800 text-slate-300 border-slate-700";
    }
  };

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
            {submissions.filter((s) => s.status === "pending_approval").length}
          </div>
          <div className="text-xs text-slate-500 mt-1">Awaiting legal/compliance sign-off</div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Total Submissions</span>
            <span className="text-indigo-400 font-bold">Workspace</span>
          </div>
          <div className="text-3xl font-black text-white mt-2">{submissions.length}</div>
          <div className="text-xs text-slate-500 mt-1">Campaigns & media assets</div>
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
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>📋</span> Organization Content Pipeline
            </h2>
            <a href="/content" className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold">
              + New Submission
            </a>
          </div>

          <div className="divide-y divide-slate-800">
            {submissions.map((sub) => (
              <div key={sub.id} className="py-3.5 flex items-center justify-between hover:bg-slate-800/30 px-3 rounded-xl transition-all">
                <div className="space-y-1">
                  <div className="text-sm font-bold text-white flex items-center gap-2">
                    <span>{sub.title}</span>
                    <span className="text-[10px] text-slate-400 uppercase px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700">
                      {sub.content_type}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 line-clamp-1">{sub.description || "No description provided."}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-bold border capitalize ${getStatusBadge(sub.status)}`}>
                    {sub.status.replace("_", " ")}
                  </span>
                  <a
                    href="/audits"
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all"
                  >
                    View Audit
                  </a>
                </div>
              </div>
            ))}
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

      {/* Quick Invite Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>✉️</span> Invite New Employee
              </h3>
              <button onClick={() => setIsInviteModalOpen(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            {inviteSuccessMsg ? (
              <div className="space-y-4 py-2">
                <div className="p-3 bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs rounded-xl">
                  {inviteSuccessMsg}
                </div>
                <button
                  onClick={() => {
                    setIsInviteModalOpen(false);
                    setInviteSuccessMsg(null);
                  }}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleSendInvite} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Employee Email</label>
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="colleague@company.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Workspace Role</label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="marketing">Marketing (Content Creation & Submission)</option>
                    <option value="designer">Designer (Creative Brand Assets & Media)</option>
                    <option value="compliance_officer">Legal / Compliance (Regulatory Approvals)</option>
                    <option value="admin">Manager / Admin (Full Organization Access)</option>
                  </select>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsInviteModalOpen(false)}
                    className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isInviting}
                    className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold disabled:opacity-50"
                  >
                    {isInviting ? "Generating Invite..." : "Generate Invite Link"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
