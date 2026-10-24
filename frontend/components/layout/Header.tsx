"use client";

import React, { useState } from "react";
import { useAuth } from "@/services/auth-context";
import { useRouter } from "next/navigation";

export function Header() {
  const { user, activeOrgId, activeOrgName, activeRole, memberships, switchOrganization, login, logout } = useAuth();
  const router = useRouter();
  const [isOrgDropdownOpen, setIsOrgDropdownOpen] = useState(false);
  const [isPersonaDropdownOpen, setIsPersonaDropdownOpen] = useState(false);

  const getRoleBadge = (role: string | null) => {
    switch (role) {
      case "admin":
        return { label: "Manager / Admin", color: "bg-indigo-950/80 text-indigo-400 border-indigo-700/60" };
      case "designer":
        return { label: "Designer", color: "bg-fuchsia-950/80 text-fuchsia-300 border-fuchsia-700/60" };
      case "compliance_officer":
      case "reviewer":
        return { label: "Legal / Compliance", color: "bg-emerald-950/80 text-emerald-300 border-emerald-700/60" };
      case "marketing":
      case "creator":
        return { label: "Marketing", color: "bg-amber-950/80 text-amber-300 border-amber-700/60" };
      default:
        return { label: role || "Member", color: "bg-slate-800 text-slate-300 border-slate-700" };
    }
  };

  const handleQuickSwitch = async (email: string) => {
    setIsPersonaDropdownOpen(false);
    await login(email, "password123");
  };

  const handleSignOut = () => {
    logout();
    router.push("/login");
  };

  const roleInfo = getRoleBadge(activeRole);
  const initials = user?.full_name
    ? user.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase()
    : user?.email?.substring(0, 2).toUpperCase() || "JD";

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Search Bar & Workspace Indicator */}
      <div className="flex items-center space-x-4">
        {/* Workspace Selector */}
        <div className="relative">
          <button
            onClick={() => { setIsOrgDropdownOpen(!isOrgDropdownOpen); setIsPersonaDropdownOpen(false); }}
            className="flex items-center space-x-2.5 bg-slate-950/70 border border-slate-700/70 hover:border-indigo-500/60 rounded-xl px-3.5 py-1.5 text-xs font-semibold text-slate-200 transition-all shadow-sm"
          >
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></div>
            <span className="max-w-[180px] truncate">{activeOrgName || "Workspace"}</span>
            <span className="text-[10px] text-slate-400">▼</span>
          </button>

          {isOrgDropdownOpen && (
            <div className="absolute left-0 mt-2 w-64 bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95">
              <div className="px-3 py-1.5 text-[10px] font-bold tracking-wider uppercase text-slate-400 border-b border-slate-800">
                Switch Organization Workspace
              </div>
              <div className="space-y-1 my-1">
                {memberships.map((m) => {
                  const isCurrent = m.organization_id === activeOrgId;
                  return (
                    <button
                      key={m.organization_id}
                      onClick={() => {
                        setIsOrgDropdownOpen(false);
                        switchOrganization(m.organization_id);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between transition-colors ${
                        isCurrent
                          ? "bg-indigo-600/20 text-indigo-300 font-semibold border border-indigo-500/30"
                          : "text-slate-300 hover:bg-slate-800/80"
                      }`}
                    >
                      <span className="truncate">{m.organization_name}</span>
                      <span className="text-[10px] text-slate-400 capitalize bg-slate-800 px-1.5 py-0.5 rounded">
                        {m.role}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Search Input */}
        <div className="relative hidden md:block">
          <input
            type="text"
            placeholder="Search brand guidelines, claims, or audits..."
            className="w-72 bg-slate-950/80 border border-slate-800 rounded-lg px-3.5 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* User Context, Role Pill & Sign Out */}
      <div className="flex items-center space-x-3">
        {/* Quick Persona Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => { setIsPersonaDropdownOpen(!isPersonaDropdownOpen); setIsOrgDropdownOpen(false); }}
            className={`px-3 py-1 rounded-full text-xs font-bold border ${roleInfo.color} flex items-center gap-1.5 hover:scale-105 transition-all shadow-sm`}
            title="Click to quickly switch demo roles"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-ping"></span>
            <span>{roleInfo.label}</span>
            <span className="text-[9px] opacity-70">▼</span>
          </button>

          {isPersonaDropdownOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-700/90 rounded-2xl shadow-2xl p-2.5 z-50 animate-in fade-in zoom-in-95">
              <div className="px-3 py-1.5 text-[10px] font-bold tracking-wider uppercase text-indigo-400 border-b border-slate-800 flex items-center justify-between">
                <span>⚡ Instant Role Switch</span>
                <span className="text-slate-400 font-mono text-[9px]">Demo</span>
              </div>
              <div className="space-y-1 my-2">
                <button
                  onClick={() => handleQuickSwitch("admin@acmecloud.com")}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs hover:bg-slate-800 flex items-center justify-between transition"
                >
                  <div>
                    <div className="font-bold text-white flex items-center gap-1">👔 Alex Mercer</div>
                    <div className="text-[10px] text-indigo-400">Manager / Admin (Acme)</div>
                  </div>
                  {activeRole === "admin" && activeOrgId?.includes("acme") && (
                    <span className="text-[10px] text-indigo-400 font-bold">✓ Active</span>
                  )}
                </button>

                <button
                  onClick={() => handleQuickSwitch("compliance@acmecloud.com")}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs hover:bg-slate-800 flex items-center justify-between transition"
                >
                  <div>
                    <div className="font-bold text-white flex items-center gap-1">⚖️ Elena Rostova</div>
                    <div className="text-[10px] text-emerald-400">Legal & Compliance (Acme)</div>
                  </div>
                  {activeRole === "compliance_officer" && (
                    <span className="text-[10px] text-emerald-400 font-bold">✓ Active</span>
                  )}
                </button>

                <button
                  onClick={() => handleQuickSwitch("designer@acmecloud.com")}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs hover:bg-slate-800 flex items-center justify-between transition"
                >
                  <div>
                    <div className="font-bold text-white flex items-center gap-1">🎨 Leo Vance</div>
                    <div className="text-[10px] text-fuchsia-400">Senior Designer (Acme)</div>
                  </div>
                  {activeRole === "designer" && (
                    <span className="text-[10px] text-fuchsia-400 font-bold">✓ Active</span>
                  )}
                </button>

                <button
                  onClick={() => handleQuickSwitch("marketing@acmecloud.com")}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs hover:bg-slate-800 flex items-center justify-between transition"
                >
                  <div>
                    <div className="font-bold text-white flex items-center gap-1">📢 Maya Lin</div>
                    <div className="text-[10px] text-amber-400">Marketing Creator (Acme)</div>
                  </div>
                  {activeRole === "marketing" && (
                    <span className="text-[10px] text-amber-400 font-bold">✓ Active</span>
                  )}
                </button>

                <div className="border-t border-slate-800 my-1 pt-1">
                  <button
                    onClick={() => handleQuickSwitch("admin@novabio.com")}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs hover:bg-slate-800 flex items-center justify-between transition"
                  >
                    <div>
                      <div className="font-bold text-white flex items-center gap-1">🧬 Dr. Rachel Hayes</div>
                      <div className="text-[10px] text-teal-400">Biotech Admin (NovaBio)</div>
                    </div>
                  </button>
                </div>
              </div>

              <div className="border-t border-slate-800 pt-1.5 px-2 flex justify-between items-center text-[10px] text-slate-400">
                <a href="/login" className="text-indigo-400 hover:underline">Full Login Portal</a>
                <span>pw: password123</span>
              </div>
            </div>
          )}
        </div>

        {/* User Card */}
        <div className="flex items-center space-x-3 border-l border-slate-800 pl-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-sky-400 flex items-center justify-center font-bold text-xs text-white shadow-md shadow-indigo-500/20">
            {initials}
          </div>
          <div className="text-left hidden md:block">
            <div className="text-xs font-semibold text-slate-200 truncate max-w-[130px]">
              {user?.full_name || user?.email}
            </div>
            <div className="text-[10px] text-slate-400 truncate max-w-[130px]">{user?.email}</div>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleSignOut}
          title="Sign out of Inkloom"
          className="text-xs text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 px-2.5 py-1.5 rounded-lg border border-transparent hover:border-rose-900/50 transition-all flex items-center gap-1.5"
        >
          <span>🚪</span>
          <span className="hidden sm:inline font-medium">Sign Out</span>
        </button>
      </div>
    </header>
  );
}
