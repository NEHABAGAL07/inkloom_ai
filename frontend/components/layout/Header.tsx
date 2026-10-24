"use client";

import React, { useState } from "react";
import { useAuth } from "@/services/auth-context";
import { useRouter } from "next/navigation";
import {
  Building2,
  ChevronDown,
  Search,
  LogOut,
  ShieldCheck,
  Check,
} from "lucide-react";

export function Header() {
  const {
    user,
    activeOrgId,
    activeOrgName,
    activeRole,
    memberships,
    switchOrganization,
    logout,
  } = useAuth();
  const router = useRouter();
  const [isOrgDropdownOpen, setIsOrgDropdownOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const getRoleBadge = (role: string | null) => {
    switch (role) {
      case "admin":
        return {
          label: "Brand Administrator",
          bg: "bg-navy/10 text-navy border-navy/20",
        };
      case "compliance_officer":
      case "legal":
        return {
          label: "Legal & Compliance Officer",
          bg: "bg-teal-50 text-teal-800 border-teal-200",
        };
      case "designer":
        return {
          label: "Brand Designer",
          bg: "bg-slate-100 text-slate-700 border-slate-300",
        };
      case "marketing":
      case "creator":
        return {
          label: "Marketing Creator",
          bg: "bg-amber-50 text-amber-800 border-amber-200",
        };
      default:
        return {
          label: role || "Member",
          bg: "bg-slate-100 text-slate-700 border-slate-200",
        };
    }
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await logout();
      router.push("/login");
    } catch (err) {
      console.error("Sign out error:", err);
      router.push("/login");
    } finally {
      setIsSigningOut(false);
    }
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
    <header className="h-16 border-b border-border bg-surface px-6 flex items-center justify-between sticky top-0 z-30 select-none shadow-subtle">
      {/* Workspace Switcher & Search Bar */}
      <div className="flex items-center space-x-4">
        {/* Workspace Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsOrgDropdownOpen(!isOrgDropdownOpen)}
            className="flex items-center space-x-2 bg-workspace border border-border hover:border-teal/50 rounded-lg px-3 py-1.5 text-xs font-semibold text-ink-primary transition shadow-subtle"
            aria-expanded={isOrgDropdownOpen}
          >
            <Building2 className="w-3.5 h-3.5 text-teal" />
            <span className="max-w-[170px] truncate">
              {activeOrgName || "Workspace"}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-ink-muted" />
          </button>

          {isOrgDropdownOpen && (
            <div className="absolute left-0 mt-2 w-64 bg-surface border border-border rounded-xl shadow-dropdown p-2 z-50">
              <div className="px-3 py-1.5 text-[10px] font-bold tracking-wider uppercase text-ink-muted border-b border-border">
                Switch Organization Workspace
              </div>
              <div className="space-y-1 my-1 max-h-56 overflow-y-auto">
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
                          ? "bg-teal-50 text-teal-800 font-semibold border border-teal-200"
                          : "text-ink-secondary hover:bg-workspace hover:text-ink-primary"
                      }`}
                    >
                      <span className="truncate">{m.organization_name}</span>
                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        <span className="text-[10px] text-ink-muted capitalize bg-workspace px-1.5 py-0.5 rounded border border-border">
                          {m.role}
                        </span>
                        {isCurrent && <Check className="w-3 h-3 text-teal" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Search Input */}
        <div className="relative hidden md:block">
          <Search className="w-3.5 h-3.5 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search guidelines, rules, claims, or audits..."
            className="w-72 bg-workspace border border-border rounded-lg pl-8 pr-3.5 py-1.5 text-xs text-ink-primary placeholder:text-ink-muted focus:outline-none focus:border-teal transition"
          />
        </div>
      </div>

      {/* User Identity, Role Badge & Sign Out */}
      <div className="flex items-center space-x-3">
        {/* Authenticated User Role Badge */}
        <div
          className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border ${roleInfo.bg} flex items-center gap-1.5 shadow-subtle`}
          title={`Active Role: ${roleInfo.label}`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>{roleInfo.label}</span>
        </div>

        {/* User Card */}
        <div className="flex items-center space-x-2.5 border-l border-border pl-3">
          <div className="w-8 h-8 rounded-full bg-navy text-white flex items-center justify-center font-bold text-xs shadow-subtle">
            {initials}
          </div>
          <div className="text-left hidden md:block leading-tight">
            <div className="text-xs font-semibold text-ink-primary truncate max-w-[140px]">
              {user?.full_name || user?.email}
            </div>
            <div className="text-[11px] text-ink-muted truncate max-w-[140px]">
              {user?.email}
            </div>
          </div>
        </div>

        {/* Sign Out Button */}
        <button
          onClick={handleSignOut}
          disabled={isSigningOut}
          title="Sign out of Inkloom"
          className="text-xs text-ink-secondary hover:text-status-error hover:bg-rose-50 disabled:opacity-50 px-2.5 py-1.5 rounded-lg border border-transparent hover:border-rose-200 transition-colors flex items-center gap-1.5 ml-1"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline font-medium">
            {isSigningOut ? "Signing Out..." : "Sign Out"}
          </span>
        </button>
      </div>
    </header>
  );
}
