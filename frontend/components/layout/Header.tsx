"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/services/auth-context";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/services/theme-context";
import { GlobalSearchBar } from "./GlobalSearchBar";
import {
  Building2,
  ChevronDown,
  LogOut,
  ShieldCheck,
  Check,
  Settings,
  Users,
  Loader2,
  Sparkles,
  Palette,
  FileText,
  Scale,
  Shield,
} from "lucide-react";

interface QuickDept {
  id: string;
  roleKey: string;
  label: string;
  shortLabel: string;
  name: string;
  email: string;
  badge: string;
  icon: React.ComponentType<{ className?: string }>;
}

const DEPARTMENTS: QuickDept[] = [
  {
    id: "admin",
    roleKey: "admin",
    label: "Brand Administrator",
    shortLabel: "Admin",
    name: "Alex Mercer",
    email: "admin@acmecloud.com",
    badge: "bg-navy/10 text-navy border-navy/20 dark:bg-slate-800 dark:text-slate-200",
    icon: Shield,
  },
  {
    id: "designer",
    roleKey: "designer",
    label: "Brand Designer",
    shortLabel: "Designer",
    name: "Leo Vance",
    email: "designer@acmecloud.com",
    badge: "bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300",
    icon: Palette,
  },
  {
    id: "marketing",
    roleKey: "marketing",
    label: "Marketing Lead",
    shortLabel: "Marketing",
    name: "Maya Lin",
    email: "marketing@acmecloud.com",
    badge: "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300",
    icon: FileText,
  },
  {
    id: "compliance",
    roleKey: "compliance_officer",
    label: "Legal & Compliance",
    shortLabel: "Legal",
    name: "Elena Rostova",
    email: "compliance@acmecloud.com",
    badge: "bg-teal/10 text-teal border-teal/20 dark:bg-teal-950/40 dark:text-teal-300",
    icon: Scale,
  },
];

export function Header() {
  const {
    user,
    activeOrgId,
    activeOrgName,
    activeRole,
    memberships,
    switchOrganization,
    logout,
    login,
  } = useAuth();
  const router = useRouter();
  const [isOrgDropdownOpen, setIsOrgDropdownOpen] = useState(false);
  const [isDeptDropdownOpen, setIsDeptDropdownOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [switchingDept, setSwitchingDept] = useState<string | null>(null);

  const orgDropdownRef = useRef<HTMLDivElement>(null);
  const deptDropdownRef = useRef<HTMLDivElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const profileTriggerRef = useRef<HTMLButtonElement>(null);

  const handleSwitchDepartment = async (dept: QuickDept) => {
    if (switchingDept) return;
    setSwitchingDept(dept.id);
    try {
      await login(dept.email, "password123", true);
      router.push("/");
    } catch (err) {
      console.error("Failed to switch department:", err);
    } finally {
      setSwitchingDept(null);
    }
  };

  // Close dropdowns on outside click and handle Escape key globally
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(target)
      ) {
        setIsProfileOpen(false);
      }
      if (
        orgDropdownRef.current &&
        !orgDropdownRef.current.contains(target)
      ) {
        setIsOrgDropdownOpen(false);
      }
      if (
        deptDropdownRef.current &&
        !deptDropdownRef.current.contains(target)
      ) {
        setIsDeptDropdownOpen(false);
      }
    }

    function handleGlobalKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        if (isProfileOpen) {
          setIsProfileOpen(false);
          profileTriggerRef.current?.focus();
        }
        if (isOrgDropdownOpen) {
          setIsOrgDropdownOpen(false);
        }
        if (isDeptDropdownOpen) {
          setIsDeptDropdownOpen(false);
        }
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleGlobalKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleGlobalKeyDown);
    };
  }, [isProfileOpen, isOrgDropdownOpen, isDeptDropdownOpen]);

  const getRoleBadge = (role: string | null) => {
    switch (role) {
      case "admin":
        return {
          label: "Brand Administrator",
          bg: "bg-navy/10 dark:bg-navy-light/40 text-navy dark:text-slate-200 border-navy/20 dark:border-slate-700",
        };
      case "compliance_officer":
      case "legal":
        return {
          label: "Legal & Compliance",
          bg: "bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border-teal-200 dark:border-teal-700/50",
        };
      case "designer":
        return {
          label: "Brand Designer",
          bg: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700",
        };
      case "marketing":
      case "creator":
        return {
          label: "Marketing Creator",
          bg: "bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/60",
        };
      default:
        return {
          label: role || "Member",
          bg: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700",
        };
    }
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await logout();
      router.push("/?reason=logged_out");
    } catch (err) {
      console.error("Sign out error:", err);
      router.push("/?reason=logged_out");
    } finally {
      setIsSigningOut(false);
      setIsProfileOpen(false);
    }
  };

  // Keyboard navigation inside dropdown menu
  const handleMenuKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      setIsProfileOpen(false);
      profileTriggerRef.current?.focus();
      return;
    }

    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const menu = profileDropdownRef.current;
      if (!menu) return;
      const items = Array.from(
        menu.querySelectorAll<HTMLElement>('[role="menuitem"]:not([disabled])')
      );
      if (!items.length) return;

      const currentIndex = items.indexOf(document.activeElement as HTMLElement);
      let nextIndex = 0;
      if (e.key === "ArrowDown") {
        nextIndex = currentIndex >= 0 && currentIndex < items.length - 1 ? currentIndex + 1 : 0;
      } else {
        nextIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
      }
      items[nextIndex]?.focus();
    }
  };

  // Keyboard opening on trigger button
  const handleTriggerKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      if (!isProfileOpen) {
        setIsProfileOpen(true);
        setTimeout(() => {
          const first = profileDropdownRef.current?.querySelector<HTMLElement>(
            '[role="menuitem"]:not([disabled])'
          );
          first?.focus();
        }, 50);
      }
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
    <header className="h-16 border-b border-border bg-surface px-4 lg:px-6 flex items-center justify-between sticky top-0 z-30 select-none shadow-subtle gap-3 transition-colors duration-150">
      {/* ----------------------------------------------------
          Left Section: Workspace Switcher
          ---------------------------------------------------- */}
      <div className="flex items-center space-x-3 shrink-0">
        <div className="relative" ref={orgDropdownRef}>
          <button
            type="button"
            onClick={() => {
              setIsProfileOpen(false);
              setIsOrgDropdownOpen(!isOrgDropdownOpen);
            }}
            className="flex items-center space-x-2 bg-workspace border border-border hover:border-teal/50 rounded-lg px-3 py-1.5 text-xs font-semibold text-ink-primary transition shadow-subtle"
            aria-expanded={isOrgDropdownOpen}
            aria-label="Select organization workspace"
          >
            <Building2 className="w-3.5 h-3.5 text-teal shrink-0" />
            <span className="max-w-[130px] sm:max-w-[170px] truncate">
              {activeOrgName || "Workspace"}
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-ink-muted shrink-0 transition-transform duration-200 ${
                isOrgDropdownOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {isOrgDropdownOpen && (
            <div className="absolute left-0 mt-2 w-64 bg-surface dark:bg-[#162235] border border-border rounded-xl shadow-dropdown p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3 py-1.5 text-[10px] font-bold tracking-wider uppercase text-ink-muted border-b border-border">
                Switch Organization Workspace
              </div>
              <div className="space-y-1 my-1 max-h-56 overflow-y-auto">
                {memberships.map((m) => {
                  const isCurrent = m.organization_id === activeOrgId;
                  return (
                    <button
                      key={m.organization_id}
                      type="button"
                      onClick={() => {
                        setIsOrgDropdownOpen(false);
                        switchOrganization(m.organization_id);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between transition-colors ${
                        isCurrent
                          ? "bg-teal-50 dark:bg-teal-950/50 text-teal-800 dark:text-teal-300 font-semibold border border-teal-200 dark:border-teal-800/60"
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

        {/* Quick Department Role Switcher (Admin, Designer, Marketing, Legal) */}
        <div className="hidden xl:flex items-center gap-1 bg-workspace/80 border border-border rounded-xl p-1 shadow-subtle">
          <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted px-1.5 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-teal" />
            <span>Role:</span>
          </span>
          {DEPARTMENTS.map((dept) => {
            const isActive =
              activeRole === dept.roleKey ||
              (dept.id === "compliance" && (activeRole === "legal" || activeRole === "reviewer"));
            const isSwitching = switchingDept === dept.id;
            return (
              <button
                key={dept.id}
                type="button"
                disabled={isSwitching}
                onClick={() => handleSwitchDepartment(dept)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all duration-150 flex items-center gap-1.5 ${
                  isActive
                    ? "bg-teal text-white shadow-sm font-bold"
                    : "text-ink-secondary hover:text-ink-primary hover:bg-surface"
                }`}
                title={`Switch view to ${dept.label} (${dept.name})`}
              >
                {isSwitching ? (
                  <Loader2 className="w-3 h-3 animate-spin text-teal-light" />
                ) : null}
                <span>{dept.shortLabel}</span>
              </button>
            );
          })}
        </div>

        {/* Compact Role Switcher Dropdown for md-lg screens */}
        <div className="relative hidden md:block xl:hidden" ref={deptDropdownRef}>
          <button
            type="button"
            onClick={() => {
              setIsOrgDropdownOpen(false);
              setIsProfileOpen(false);
              setIsDeptDropdownOpen(!isDeptDropdownOpen);
            }}
            className="flex items-center space-x-1.5 bg-workspace border border-border hover:border-teal/50 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-ink-primary transition shadow-subtle"
            title="Switch Department Persona"
          >
            <Sparkles className="w-3 h-3 text-teal shrink-0" />
            <span className="capitalize">{activeRole === "compliance_officer" ? "Legal" : activeRole || "Role"}</span>
            <ChevronDown className="w-3 h-3 text-ink-muted shrink-0" />
          </button>

          {isDeptDropdownOpen && (
            <div className="absolute left-0 mt-2 w-56 bg-surface dark:bg-[#162235] border border-border rounded-xl shadow-dropdown p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase text-ink-muted border-b border-border">
                Switch Department
              </div>
              <div className="space-y-1 my-1">
                {DEPARTMENTS.map((dept) => {
                  const isActive =
                    activeRole === dept.roleKey ||
                    (dept.id === "compliance" && (activeRole === "legal" || activeRole === "reviewer"));
                  const isSwitching = switchingDept === dept.id;
                  const Icon = dept.icon;
                  return (
                    <button
                      key={dept.id}
                      type="button"
                      disabled={isSwitching}
                      onClick={() => {
                        setIsDeptDropdownOpen(false);
                        handleSwitchDepartment(dept);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between transition-colors ${
                        isActive
                          ? "bg-teal/10 text-teal font-semibold border border-teal/20"
                          : "text-ink-secondary hover:bg-workspace hover:text-ink-primary"
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Icon className="w-3.5 h-3.5 text-teal shrink-0" />
                        <span className="truncate">{dept.shortLabel}</span>
                      </div>
                      {isSwitching ? (
                        <Loader2 className="w-3 h-3 animate-spin text-teal" />
                      ) : isActive ? (
                        <Check className="w-3 h-3 text-teal shrink-0" />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ----------------------------------------------------
          Center Section: Horizontally Centered Global Search Bar
          ---------------------------------------------------- */}
      <GlobalSearchBar />

      {/* ----------------------------------------------------
          Right Section: Theme Toggle & Compact Profile Dropdown
          ---------------------------------------------------- */}
      <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
        {/* Global Light / Dark Theme Toggle */}
        <ThemeToggle />

        {/* Unified Profile Trigger & Dropdown Menu */}
        <div className="relative" ref={profileDropdownRef}>
          <button
            ref={profileTriggerRef}
            type="button"
            onClick={() => {
              setIsOrgDropdownOpen(false);
              setIsProfileOpen((prev) => !prev);
            }}
            onKeyDown={handleTriggerKeyDown}
            aria-expanded={isProfileOpen}
            aria-haspopup="true"
            aria-controls="user-profile-menu"
            id="user-profile-trigger"
            title={`${user?.full_name || user?.email || "Account"} (${roleInfo.label})`}
            className={`flex items-center space-x-2 sm:space-x-2.5 p-1 sm:pl-1.5 sm:pr-2.5 sm:py-1.5 rounded-xl border transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-teal select-none ${
              isProfileOpen
                ? "bg-workspace dark:bg-[#162235] border-teal/40 shadow-subtle"
                : "border-border/60 hover:border-border hover:bg-workspace dark:hover:bg-[#162235]"
            }`}
          >
            {/* User Avatar / Initials */}
            <div className="w-8 h-8 rounded-full bg-navy text-white dark:bg-teal dark:text-slate-900 flex items-center justify-center font-bold text-xs shadow-subtle shrink-0">
              {initials}
            </div>

            {/* Authenticated User Name & Role Label */}
            <div className="text-left hidden sm:block leading-tight max-w-[120px] md:max-w-[150px] lg:max-w-[170px]">
              <div className="text-xs font-semibold text-ink-primary truncate">
                {user?.full_name || user?.email?.split("@")[0] || "User"}
              </div>
              <div className="text-[10.5px] font-medium text-ink-muted truncate">
                {roleInfo.label}
              </div>
            </div>

            {/* Chevron Indicator */}
            <ChevronDown
              className={`w-3.5 h-3.5 text-ink-muted transition-transform duration-200 shrink-0 ${
                isProfileOpen ? "rotate-180 text-teal" : ""
              }`}
            />
          </button>

          {/* Polished Profile Dropdown Menu */}
          {isProfileOpen && (
            <div
              id="user-profile-menu"
              role="menu"
              aria-labelledby="user-profile-trigger"
              onKeyDown={handleMenuKeyDown}
              className="absolute right-0 mt-2 w-72 sm:w-80 max-w-[calc(100vw-2rem)] bg-surface dark:bg-[#162235] border border-border rounded-2xl shadow-dropdown p-2.5 z-50 animate-in fade-in zoom-in-95 duration-100 focus:outline-none"
            >
              {/* 1. Identity & Role Summary Card (Profile) */}
              <div className="p-3 bg-workspace dark:bg-[#101A2B] rounded-xl border border-border/80 mb-2">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 rounded-full bg-navy text-white dark:bg-teal dark:text-slate-900 flex items-center justify-center font-bold text-sm shadow-subtle shrink-0 mt-0.5">
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-ink-primary truncate">
                      {user?.full_name || "User Account"}
                    </div>
                    <div className="text-[11px] text-ink-muted truncate">
                      {user?.email}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${roleInfo.bg}`}
                        title={`Assigned Role: ${roleInfo.label}`}
                      >
                        <ShieldCheck className="w-3 h-3 text-teal shrink-0" />
                        <span className="truncate max-w-[130px]">{roleInfo.label}</span>
                      </span>
                      {activeOrgName && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium text-ink-muted bg-surface dark:bg-[#162235] border border-border truncate max-w-[110px]">
                          <Building2 className="w-2.5 h-2.5 text-teal shrink-0" />
                          <span className="truncate">{activeOrgName}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Switch Department Persona Section */}
              <div className="p-2 border-b border-border mb-2 bg-workspace/50 rounded-xl">
                <div className="text-[10px] font-bold uppercase tracking-wider text-ink-muted px-1 pb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-teal" />
                    <span>Switch Role Persona</span>
                  </span>
                  <span className="text-[9px] text-teal font-medium">1-Click</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {DEPARTMENTS.map((dept) => {
                    const isActive =
                      activeRole === dept.roleKey ||
                      (dept.id === "compliance" && (activeRole === "legal" || activeRole === "reviewer"));
                    const isSwitching = switchingDept === dept.id;
                    const Icon = dept.icon;
                    return (
                      <button
                        key={dept.id}
                        type="button"
                        disabled={isSwitching}
                        onClick={() => {
                          setIsProfileOpen(false);
                          handleSwitchDepartment(dept);
                        }}
                        className={`text-left px-2 py-1.5 rounded-lg text-xs transition flex items-center justify-between border ${
                          isActive
                            ? "bg-teal/10 border-teal text-teal font-bold shadow-xs"
                            : "border-border/60 hover:bg-surface text-ink-secondary hover:text-ink-primary"
                        }`}
                        title={`Switch role to ${dept.name} (${dept.label})`}
                      >
                        <div className="flex items-center gap-1.5 truncate min-w-0">
                          <Icon className="w-3 h-3 text-teal shrink-0" />
                          <span className="truncate text-[11px]">{dept.shortLabel}</span>
                        </div>
                        {isSwitching ? (
                          <Loader2 className="w-3 h-3 animate-spin text-teal shrink-0" />
                        ) : isActive ? (
                          <Check className="w-3 h-3 text-teal shrink-0" />
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Functional Menu Items */}
              <div className="space-y-1">
                <Link
                  href="/settings"
                  role="menuitem"
                  tabIndex={0}
                  onClick={() => setIsProfileOpen(false)}
                  className="w-full flex items-center space-x-2.5 px-3 py-2 text-xs font-medium text-ink-secondary hover:text-ink-primary hover:bg-workspace dark:hover:bg-[#101A2B] rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-teal"
                >
                  <Settings className="w-4 h-4 text-teal shrink-0" />
                  <div className="flex-1 text-left">
                    <div className="font-semibold text-ink-primary">Account & Governance Settings</div>
                    <div className="text-[10px] text-ink-muted">Configure guidelines and rules</div>
                  </div>
                </Link>

                <Link
                  href="/team"
                  role="menuitem"
                  tabIndex={0}
                  onClick={() => setIsProfileOpen(false)}
                  className="w-full flex items-center space-x-2.5 px-3 py-2 text-xs font-medium text-ink-secondary hover:text-ink-primary hover:bg-workspace dark:hover:bg-[#101A2B] rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-teal"
                >
                  <Users className="w-4 h-4 text-teal shrink-0" />
                  <div className="flex-1 text-left">
                    <div className="font-semibold text-ink-primary">Team & Permissions</div>
                    <div className="text-[10px] text-ink-muted">View team members and role access</div>
                  </div>
                </Link>
              </div>

              {/* 3. Divider */}
              <div className="my-1.5 border-t border-border" />

              {/* 4. Cautionary / Destructive Sign Out Action */}
              <button
                type="button"
                role="menuitem"
                tabIndex={0}
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="w-full flex items-center space-x-2.5 px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                {isSigningOut ? (
                  <Loader2 className="w-4 h-4 animate-spin text-rose-500 shrink-0" />
                ) : (
                  <LogOut className="w-4 h-4 text-rose-500 dark:text-rose-400 shrink-0" />
                )}
                <span className="flex-1 text-left">
                  {isSigningOut ? "Signing Out of Workspace..." : "Sign Out"}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
