"use client";

import React, { useState, useEffect } from "react";
import { MemberInfo, Invitation } from "@/types";
import { api } from "@/services/api";
import { useAuth } from "@/services/auth-context";

export default function TeamManagementPage() {
  const { activeOrgId, activeOrgName, activeRole } = useAuth();
  const [members, setMembers] = useState<MemberInfo[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);

  // Invite modal
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("marketing");
  const [isInviting, setIsInviting] = useState(false);
  const [generatedInviteLink, setGeneratedInviteLink] = useState<string | null>(null);

  const isAdmin = activeRole === "admin";

  const loadTeamData = async () => {
    if (!activeOrgId) return;
    setLoading(true);
    try {
      const [membersData, invitesData] = await Promise.all([
        api.getMembers(activeOrgId).catch(() => []),
        api.getInvitations(activeOrgId).catch(() => []),
      ]);
      setMembers(membersData);
      setInvitations(invitesData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeamData();
  }, [activeOrgId]);

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrgId) return;
    setIsInviting(true);
    try {
      const inv = await api.createInvitation(activeOrgId, inviteEmail.trim(), inviteRole);
      const fullUrl = `${window.location.origin}${inv.invite_url}`;
      setGeneratedInviteLink(fullUrl);
      setInviteEmail("");
      loadTeamData();
    } catch (err: any) {
      alert(err.message || "Failed to create invitation");
    } finally {
      setIsInviting(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (!activeOrgId || !isAdmin) return;
    try {
      await api.updateMemberRole(activeOrgId, userId, newRole);
      loadTeamData();
    } catch (err: any) {
      alert(err.message || "Failed to update role");
    }
  };

  const handleRemoveMember = async (userId: string, memberEmail: string) => {
    if (!activeOrgId || !isAdmin) return;
    if (!confirm(`Are you sure you want to remove ${memberEmail} from this workspace?`)) return;
    try {
      await api.removeMember(activeOrgId, userId);
      loadTeamData();
    } catch (err: any) {
      alert(err.message || "Failed to remove member");
    }
  };

  const handleRevokeInvite = async (inviteId: string) => {
    if (!activeOrgId || !isAdmin) return;
    try {
      await api.revokeInvitation(activeOrgId, inviteId);
      loadTeamData();
    } catch (err: any) {
      alert(err.message || "Failed to revoke invitation");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied invite link to clipboard!");
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-bold mb-2">
            <span>👥 Access Control & Team</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            {activeOrgName || "Workspace"} Team & Permissions
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Manage employee access, invite new collaborators, and enforce strict role boundaries across the organization.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => {
              setGeneratedInviteLink(null);
              setIsInviteModalOpen(true);
            }}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2"
          >
            <span>✉️</span> Invite New Employee
          </button>
        )}
      </div>

      {!isAdmin && (
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl text-xs text-slate-400 flex items-center gap-2">
          <span>ℹ️</span> You are viewing the team directory with standard permissions. Only Organization Administrators can invite or update employee roles.
        </div>
      )}

      {/* Active Members Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span>Active Team Members</span>
            <span className="text-xs text-slate-400 font-semibold bg-slate-800 px-2.5 py-0.5 rounded-full">
              {members.length}
            </span>
          </h2>
        </div>

        {loading ? (
          <div className="py-8 text-center text-xs text-slate-400">Loading members...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4 rounded-l-xl">Employee</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Role Assignment</th>
                  <th className="py-3 px-4">Joined Date</th>
                  {isAdmin && <th className="py-3 px-4 text-right rounded-r-xl">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {members.map((m) => (
                  <tr key={m.user_id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-white flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-500 to-sky-400 flex items-center justify-center text-[10px] font-black text-white">
                        {m.full_name ? m.full_name.substring(0, 2).toUpperCase() : "EM"}
                      </div>
                      <span>{m.full_name || "Team Member"}</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-400">{m.email}</td>
                    <td className="py-3.5 px-4">
                      {isAdmin ? (
                        <select
                          value={m.role}
                          onChange={(e) => handleRoleChange(m.user_id, e.target.value)}
                          className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-semibold capitalize"
                        >
                          <option value="admin">Manager / Admin</option>
                          <option value="designer">Designer</option>
                          <option value="compliance_officer">Legal / Compliance</option>
                          <option value="marketing">Marketing Creator</option>
                        </select>
                      ) : (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-indigo-950/80 border border-indigo-800 text-indigo-400 capitalize">
                          {m.role.replace("_", " ")}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {new Date(m.joined_at).toLocaleDateString()}
                    </td>
                    {isAdmin && (
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleRemoveMember(m.user_id, m.email)}
                          className="text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 p-1.5 rounded-lg transition-colors text-[11px]"
                          title="Remove member"
                        >
                          Remove
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pending Invitations */}
      {isAdmin && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>✉️</span> Active Pending Invitations
              <span className="text-xs text-slate-400 font-semibold bg-slate-800 px-2.5 py-0.5 rounded-full">
                {invitations.length}
              </span>
            </h2>
          </div>

          {invitations.length > 0 ? (
            <div className="divide-y divide-slate-800">
              {invitations.map((inv) => (
                <div key={inv.id} className="py-3 flex items-center justify-between hover:bg-slate-800/30 px-3 rounded-xl transition-all">
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-white flex items-center gap-2">
                      <span>{inv.email}</span>
                      <span className="text-[10px] text-indigo-400 font-bold uppercase px-1.5 py-0.5 rounded bg-indigo-950 border border-indigo-800">
                        {inv.role}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      Token: {inv.token} • Expires: {new Date(inv.expires_at).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => copyToClipboard(`${window.location.origin}${inv.invite_url}`)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-all flex items-center gap-1"
                    >
                      <span>📋</span> Copy Link
                    </button>
                    <button
                      onClick={() => handleRevokeInvite(inv.id)}
                      className="px-2.5 py-1 bg-rose-950/50 hover:bg-rose-900/60 text-rose-300 text-xs font-semibold rounded-lg border border-rose-800/60 transition-all"
                    >
                      Revoke
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-6 text-center text-xs text-slate-500">
              No pending invitations. Click &quot;Invite New Employee&quot; above to onboard team members.
            </div>
          )}
        </div>
      )}

      {/* Invite Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>✉️</span> Invite Employee
              </h3>
              <button onClick={() => setIsInviteModalOpen(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            {generatedInviteLink ? (
              <div className="space-y-4 py-2">
                <div className="p-3 bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs rounded-xl space-y-2">
                  <div className="font-bold">✓ Secure invitation generated!</div>
                  <div className="font-mono text-[11px] break-all bg-slate-950 p-2 rounded border border-emerald-900/60 text-slate-300">
                    {generatedInviteLink}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => copyToClipboard(generatedInviteLink)}
                    className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold"
                  >
                    Copy Link
                  </button>
                  <button
                    onClick={() => setIsInviteModalOpen(false)}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateInvite} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Employee Email Address</label>
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="new.teammate@company.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Assigned Role</label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="marketing">Marketing (Content Creator & Submitter)</option>
                    <option value="designer">Designer (Creative Assets & Media)</option>
                    <option value="compliance_officer">Legal / Compliance (Reviewer & Approvals)</option>
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
                    {isInviting ? "Creating Invite..." : "Generate Invitation Link"}
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
