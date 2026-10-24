"use client";

import React, { useState, useEffect } from "react";
import { MemberInfo, Invitation } from "@/types";
import { api } from "@/services/api";
import { useAuth } from "@/services/auth-context";
import { Users, Mail, UserPlus, CheckCircle2, Shield, Trash2, Copy, X } from "lucide-react";

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
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-surface rounded-2xl p-6 sm:p-8 border border-border shadow-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal/10 border border-teal/20 text-teal text-xs font-semibold">
            <Users className="w-3.5 h-3.5" />
            <span>Access Control & Team Governance</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy tracking-tight">
            {activeOrgName || "Workspace"} Team & Permissions
          </h1>
          <p className="text-sm text-ink-secondary max-w-2xl leading-relaxed">
            Manage employee access, invite collaborators, and enforce strict role boundaries across the brand governance workspace.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => {
              setGeneratedInviteLink(null);
              setIsInviteModalOpen(true);
            }}
            className="px-4 py-2.5 bg-teal hover:bg-teal-hover text-white text-xs font-bold rounded-xl shadow-subtle transition flex items-center gap-2 shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>Invite Team Member</span>
          </button>
        )}
      </div>

      {!isAdmin && (
        <div className="p-4 bg-surface border border-border rounded-xl text-xs text-ink-secondary flex items-center gap-2 shadow-subtle">
          <Shield className="w-4 h-4 text-teal shrink-0" />
          <span>You are viewing the team directory with standard permissions. Only Organization Administrators can invite or update employee roles.</span>
        </div>
      )}

      {/* Active Members Table */}
      <div className="bg-surface border border-border rounded-2xl p-6 shadow-subtle space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <h2 className="text-base font-bold text-navy flex items-center gap-2">
            <span>Active Team Members</span>
            <span className="text-xs text-ink-muted font-bold bg-workspace border border-border px-2.5 py-0.5 rounded-full">
              {members.length}
            </span>
          </h2>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-ink-muted">Loading team directory...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-workspace text-ink-muted uppercase text-[10px] font-bold tracking-wider border-b border-border">
                <tr>
                  <th className="py-3 px-4 rounded-l-xl">Employee</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Role Assignment</th>
                  <th className="py-3 px-4">Joined Date</th>
                  {isAdmin && <th className="py-3 px-4 text-right rounded-r-xl">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-ink-primary">
                {members.map((m) => (
                  <tr key={m.user_id} className="hover:bg-workspace transition-colors">
                    <td className="py-3.5 px-4 font-bold text-navy flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-navy text-white flex items-center justify-center text-[10px] font-black">
                        {m.full_name ? m.full_name.substring(0, 2).toUpperCase() : "EM"}
                      </div>
                      <span>{m.full_name || "Team Member"}</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-ink-secondary">{m.email}</td>
                    <td className="py-3.5 px-4">
                      {isAdmin ? (
                        <select
                          value={m.role}
                          onChange={(e) => handleRoleChange(m.user_id, e.target.value)}
                          className="bg-workspace border border-border rounded-lg px-2.5 py-1 text-xs text-navy focus:outline-none focus:border-teal font-semibold capitalize"
                        >
                          <option value="admin">Manager / Admin</option>
                          <option value="designer">Designer</option>
                          <option value="compliance_officer">Legal / Compliance</option>
                          <option value="marketing">Marketing Creator</option>
                        </select>
                      ) : (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-teal/10 border border-teal/20 text-teal capitalize">
                          {m.role.replace("_", " ")}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-ink-muted">
                      {new Date(m.joined_at).toLocaleDateString()}
                    </td>
                    {isAdmin && (
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleRemoveMember(m.user_id, m.email)}
                          className="text-ink-muted hover:text-status-error hover:bg-red-50 p-1.5 rounded-lg transition-colors text-[11px] font-medium"
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
        <div className="bg-surface border border-border rounded-2xl p-6 shadow-subtle space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <h2 className="text-base font-bold text-navy flex items-center gap-2">
              <Mail className="w-4 h-4 text-teal" />
              <span>Pending Invitations</span>
              <span className="text-xs text-ink-muted font-bold bg-workspace border border-border px-2.5 py-0.5 rounded-full">
                {invitations.length}
              </span>
            </h2>
          </div>

          {invitations.length > 0 ? (
            <div className="divide-y divide-border">
              {invitations.map((inv) => (
                <div
                  key={inv.id}
                  className="py-3 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-workspace px-3 rounded-xl transition gap-3"
                >
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-navy flex items-center gap-2">
                      <span>{inv.email}</span>
                      <span className="text-[10px] text-teal font-bold uppercase px-2 py-0.5 rounded bg-teal/10 border border-teal/20">
                        {inv.role}
                      </span>
                    </div>
                    <div className="text-[10px] text-ink-muted font-mono">
                      Token: {inv.token} • Expires: {new Date(inv.expires_at).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      onClick={() => copyToClipboard(`${window.location.origin}${inv.invite_url}`)}
                      className="px-2.5 py-1 bg-workspace hover:bg-slate-200 text-navy text-xs font-semibold rounded-lg border border-border transition flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Copy Link</span>
                    </button>
                    <button
                      onClick={() => handleRevokeInvite(inv.id)}
                      className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-status-error text-xs font-semibold rounded-lg border border-red-200 transition"
                    >
                      Revoke
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-ink-muted">
              No pending invitations. Click &quot;Invite Team Member&quot; above to onboard colleagues.
            </div>
          )}
        </div>
      )}

      {/* Invite Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-navy flex items-center gap-2">
                <Mail className="w-4 h-4 text-teal" />
                <span>Invite Team Member</span>
              </h3>
              <button
                onClick={() => setIsInviteModalOpen(false)}
                className="text-ink-muted hover:text-navy text-sm p-1"
              >
                ✕
              </button>
            </div>

            {generatedInviteLink ? (
              <div className="space-y-4 py-2">
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-status-success text-xs rounded-xl space-y-2">
                  <div className="font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Secure invitation generated successfully!</span>
                  </div>
                  <div className="font-mono text-[11px] break-all bg-surface p-2.5 rounded-lg border border-border text-navy">
                    {generatedInviteLink}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => copyToClipboard(generatedInviteLink)}
                    className="flex-1 py-2.5 bg-teal hover:bg-teal-hover text-white rounded-xl text-xs font-bold transition shadow-subtle"
                  >
                    Copy Link
                  </button>
                  <button
                    onClick={() => setIsInviteModalOpen(false)}
                    className="px-4 py-2.5 bg-workspace hover:bg-slate-200 text-navy border border-border rounded-xl text-xs font-bold transition"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateInvite} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-navy mb-1.5">Employee Email Address *</label>
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="teammate@company.com"
                    className="w-full bg-workspace border border-border rounded-xl px-3.5 py-2 text-sm text-navy placeholder:text-ink-muted focus:outline-none focus:border-teal"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-navy mb-1.5">Assigned Role</label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="w-full bg-workspace border border-border rounded-xl px-3 py-2 text-sm text-navy focus:outline-none focus:border-teal"
                  >
                    <option value="marketing">Marketing (Content Creator &amp; Submitter)</option>
                    <option value="designer">Designer (Creative Assets &amp; Media)</option>
                    <option value="compliance_officer">Legal / Compliance (Reviewer &amp; Approvals)</option>
                    <option value="admin">Manager / Admin (Full Organization Access)</option>
                  </select>
                </div>

                <div className="flex gap-2 pt-2 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setIsInviteModalOpen(false)}
                    className="flex-1 py-2.5 bg-workspace hover:bg-slate-200 text-ink-secondary rounded-xl text-xs font-bold border border-border transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isInviting}
                    className="flex-1 py-2.5 bg-teal hover:bg-teal-hover text-white rounded-xl text-xs font-bold transition shadow-subtle disabled:opacity-50"
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
