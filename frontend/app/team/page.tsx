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
      <div className="bg-white dark:bg-[#1C1C1C] rounded-2xl p-6 sm:p-8 border border-[#DDEBE5] dark:border-[#383838] shadow-sm dark:shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#087F70] via-[#10A995] to-[#43D6B3] dark:from-[#FF7A36] dark:via-[#FFAA35] dark:to-[#FFD84D]" />
        <div className="absolute top-0 right-0 w-80 h-32 bg-gradient-to-l from-[#43D6B3]/15 dark:from-[#FF7A36]/10 to-transparent pointer-events-none blur-2xl" />
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E8F7F1] dark:bg-amber-500/10 border border-[#C8E2D8] dark:border-amber-500/20 text-[#087F70] dark:text-[#FFAA35] text-xs font-bold font-mono">
            <Users className="w-3.5 h-3.5" />
            <span>Access Control &amp; Team Governance</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#18352F] dark:text-[#F7F3ED] font-heading tracking-tight">
            {activeOrgName || "Workspace"} Team &amp; Permissions
          </h1>
          <p className="text-sm text-[#58716A] dark:text-[#85817D] max-w-2xl leading-relaxed">
            Manage employee access, invite collaborators, and enforce strict role boundaries across the brand governance workspace.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => {
              setGeneratedInviteLink(null);
              setIsInviteModalOpen(true);
            }}
            className="px-4 py-2.5 btn-gradient-warm text-white dark:text-ink-950 text-xs font-bold rounded-xl shadow-lg shadow-teal-500/15 dark:shadow-orange-500/10 transition flex items-center gap-2 shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>Invite Team Member</span>
          </button>
        )}
      </div>

      {!isAdmin && (
        <div className="p-4 bg-white dark:bg-[#1C1C1C] border border-[#DDEBE5] dark:border-[#383838] rounded-xl text-xs text-[#58716A] dark:text-[#85817D] flex items-center gap-2 shadow-sm dark:shadow-xl">
          <Shield className="w-4 h-4 text-[#087F70] dark:text-[#FFAA35] shrink-0" />
          <span>You are viewing the team directory with standard permissions. Only Organization Administrators can invite or update employee roles.</span>
        </div>
      )}

      {/* Active Members Table */}
      <div className="bg-white dark:bg-[#1C1C1C] border border-[#DDEBE5] dark:border-[#383838] rounded-2xl p-6 shadow-sm dark:shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#DDEBE5] dark:border-[#383838]">
          <h2 className="text-base font-bold text-[#18352F] dark:text-[#F7F3ED] font-heading flex items-center gap-2">
            <span>Active Team Members</span>
            <span className="text-xs text-[#087F70] dark:text-[#FFAA35] font-mono font-bold bg-[#EFF8F4] dark:bg-[#272727] border border-[#C8E2D8] dark:border-[#383838] px-2.5 py-0.5 rounded-full">
              {members.length}
            </span>
          </h2>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-[#82948E] dark:text-[#85817D] font-mono">Loading team directory...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#EFF8F4] dark:bg-[#171717] text-[#58716A] dark:text-[#85817D] uppercase text-[10px] font-bold tracking-wider border-b border-[#DDEBE5] dark:border-[#383838] font-mono">
                <tr>
                  <th className="py-3 px-4 rounded-l-xl">Employee</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Role Assignment</th>
                  <th className="py-3 px-4">Joined Date</th>
                  {isAdmin && <th className="py-3 px-4 text-right rounded-r-xl">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DDEBE5] dark:divide-[#383838] text-[#18352F] dark:text-[#F7F3ED]">
                {members.map((m) => (
                  <tr key={m.user_id} className="hover:bg-[#F7FBF9] dark:hover:bg-[#202020] transition-colors">
                    <td className="py-3.5 px-4 font-bold text-[#18352F] dark:text-[#F7F3ED] flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#087F70] via-[#10A995] to-[#43D6B3] text-white dark:from-[#FFD84D] dark:to-[#F45B91] dark:text-ink-950 flex items-center justify-center text-[10px] font-black shadow-xs">
                        {m.full_name ? m.full_name.substring(0, 2).toUpperCase() : "EM"}
                      </div>
                      <span>{m.full_name || "Team Member"}</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[#58716A] dark:text-[#B8B2AC]">{m.email}</td>
                    <td className="py-3.5 px-4">
                      {isAdmin ? (
                        <select
                          value={m.role}
                          onChange={(e) => handleRoleChange(m.user_id, e.target.value)}
                          className="bg-[#F7FBF9] dark:bg-[#141414] border border-[#DDEBE5] dark:border-[#383838] rounded-xl px-2.5 py-1 text-xs text-[#18352F] dark:text-[#F7F3ED] focus:outline-none focus:border-[#10A995] dark:focus:border-[#FF7A36] font-semibold capitalize"
                        >
                          <option value="admin">Manager / Admin</option>
                          <option value="designer">Designer</option>
                          <option value="compliance_officer">Legal / Compliance</option>
                          <option value="marketing">Marketing Creator</option>
                        </select>
                      ) : (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-[#E8F7F1] dark:bg-amber-500/10 border border-[#C8E2D8] dark:border-amber-500/20 text-[#087F70] dark:text-[#FFAA35] capitalize">
                          {m.role.replace("_", " ")}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-[#82948E] dark:text-[#85817D] font-mono">
                      {new Date(m.joined_at).toLocaleDateString()}
                    </td>
                    {isAdmin && (
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleRemoveMember(m.user_id, m.email)}
                          className="text-[#82948E] dark:text-[#85817D] hover:text-red-600 dark:hover:text-red-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 p-1.5 rounded-lg transition-colors text-[11px] font-medium"
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
        <div className="bg-white dark:bg-[#1C1C1C] border border-[#DDEBE5] dark:border-[#383838] rounded-2xl p-6 shadow-sm dark:shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#DDEBE5] dark:border-[#383838]">
            <h2 className="text-base font-bold text-[#18352F] dark:text-[#F7F3ED] font-heading flex items-center gap-2">
              <Mail className="w-4 h-4 text-[#087F70] dark:text-[#FFAA35]" />
              <span>Pending Invitations</span>
              <span className="text-xs text-[#087F70] dark:text-[#FFAA35] font-mono font-bold bg-[#EFF8F4] dark:bg-[#272727] border border-[#C8E2D8] dark:border-[#383838] px-2.5 py-0.5 rounded-full">
                {invitations.length}
              </span>
            </h2>
          </div>

          {invitations.length > 0 ? (
            <div className="divide-y divide-[#DDEBE5] dark:divide-[#383838]">
              {invitations.map((inv) => (
                <div
                  key={inv.id}
                  className="py-3 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-[#F7FBF9] dark:hover:bg-[#202020] px-3 rounded-xl transition gap-3"
                >
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-[#18352F] dark:text-[#F7F3ED] flex items-center gap-2">
                      <span>{inv.email}</span>
                      <span className="text-[10px] text-[#087F70] dark:text-[#FFAA35] font-bold uppercase px-2 py-0.5 rounded bg-[#E8F7F1] dark:bg-amber-500/10 border border-[#C8E2D8] dark:border-amber-500/20 font-mono">
                        {inv.role}
                      </span>
                    </div>
                    <div className="text-[10px] text-[#82948E] dark:text-[#85817D] font-mono">
                      Token: {inv.token} • Expires: {new Date(inv.expires_at).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      onClick={() => copyToClipboard(`${window.location.origin}${inv.invite_url}`)}
                      className="px-2.5 py-1 bg-[#EFF8F4] hover:bg-[#DDF3EB] dark:bg-[#272727] dark:hover:bg-[#383838] text-[#18352F] dark:text-[#F7F3ED] text-xs font-semibold rounded-lg border border-[#DDEBE5] dark:border-[#383838] transition flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Copy Link</span>
                    </button>
                    <button
                      onClick={() => handleRevokeInvite(inv.id)}
                      className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-300 text-xs font-semibold rounded-lg border border-rose-200 dark:border-rose-800/40 transition"
                    >
                      Revoke
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-[#82948E] dark:text-[#85817D]">
              No pending invitations. Click &quot;Invite Team Member&quot; above to onboard colleagues.
            </div>
          )}
        </div>
      )}

      {/* Invite Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1C1C1C] border border-[#DDEBE5] dark:border-[#383838] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#DDEBE5] dark:border-[#383838] pb-3">
              <h3 className="text-base font-bold text-[#18352F] dark:text-[#F7F3ED] font-heading flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#087F70] dark:text-[#FFAA35]" />
                <span>Invite Team Member</span>
              </h3>
              <button
                onClick={() => setIsInviteModalOpen(false)}
                className="text-[#82948E] hover:text-[#18352F] dark:text-[#85817D] dark:hover:text-[#F7F3ED] transition text-sm p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {generatedInviteLink ? (
              <div className="space-y-4 py-2">
                <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs rounded-xl space-y-2">
                  <div className="font-bold flex items-center gap-1.5 font-heading">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Secure invitation generated successfully!</span>
                  </div>
                  <div className="font-mono text-[11px] break-all bg-[#F7FBF9] dark:bg-[#141414] p-3 rounded-xl border border-[#DDEBE5] dark:border-[#383838] text-[#18352F] dark:text-[#F7F3ED]">
                    {generatedInviteLink}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => copyToClipboard(generatedInviteLink)}
                    className="flex-1 py-2.5 btn-gradient-warm text-white dark:text-ink-950 rounded-xl text-xs font-bold transition shadow-lg shadow-teal-500/15 dark:shadow-orange-500/10"
                  >
                    Copy Link
                  </button>
                  <button
                    onClick={() => setIsInviteModalOpen(false)}
                    className="px-4 py-2.5 btn-dark-secondary rounded-xl text-xs font-bold transition"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateInvite} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#18352F] dark:text-[#F7F3ED] mb-1.5">Employee Email Address *</label>
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="teammate@company.com"
                    className="w-full bg-[#F7FBF9] dark:bg-[#141414] border border-[#DDEBE5] dark:border-[#383838] rounded-xl px-3.5 py-2 text-sm text-[#18352F] dark:text-[#F7F3ED] placeholder:text-[#82948E] dark:placeholder:text-[#85817D] focus:outline-none focus:border-[#10A995] dark:focus:border-[#FF7A36]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#18352F] dark:text-[#F7F3ED] mb-1.5">Assigned Role</label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="w-full bg-[#F7FBF9] dark:bg-[#141414] border border-[#DDEBE5] dark:border-[#383838] rounded-xl px-3 py-2 text-sm text-[#18352F] dark:text-[#F7F3ED] focus:outline-none focus:border-[#10A995] dark:focus:border-[#FF7A36]"
                  >
                    <option value="marketing">Marketing (Content Creator &amp; Submitter)</option>
                    <option value="designer">Designer (Creative Assets &amp; Media)</option>
                    <option value="compliance_officer">Legal / Compliance (Reviewer &amp; Approvals)</option>
                    <option value="admin">Manager / Admin (Full Organization Access)</option>
                  </select>
                </div>

                <div className="flex gap-2 pt-2 border-t border-[#DDEBE5] dark:border-[#383838]">
                  <button
                    type="button"
                    onClick={() => setIsInviteModalOpen(false)}
                    className="flex-1 py-2.5 btn-dark-secondary rounded-xl text-xs font-bold transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isInviting}
                    className="flex-1 py-2.5 btn-gradient-warm text-white dark:text-ink-950 rounded-xl text-xs font-bold transition shadow-lg shadow-teal-500/15 dark:shadow-orange-500/10 disabled:opacity-50"
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
