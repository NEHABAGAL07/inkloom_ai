"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/services/auth-context";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/services/theme-context";
import { GlobalSearchBar } from "./GlobalSearchBar";
import { NotificationBell } from "./NotificationBell";
import {
  Building2,
  ChevronDown,
  LogOut,
  ShieldCheck,
  Check,
  Settings,
  Users,
  Loader2,
  ArrowLeft,
  Bell,
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
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const orgDropdownRef = useRef<HTMLDivElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const profileTriggerRef = useRef<HTMLButtonElement>(null);

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
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleGlobalKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleGlobalKeyDown);
    };
  }, [isProfileOpen, isOrgDropdownOpen]);

  const getRoleBadge = (role: string | null) => {
    switch (role) {
      case "admin":
        return {
          label: "Brand Administrator",
          bg: "bg-[#E8F7F1] text-[#087F70] border-[#C8E2D8] dark:bg-navy-light/40 dark:text-slate-200 dark:border-slate-700",
        };
      case "compliance_officer":
      case "legal":
        return {
          label: "Legal & Compliance",
          bg: "bg-[#EFF8F4] text-[#087F70] border-[#DDEBE5] dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-700/50",
        };
      case "designer":
        return {
          label: "Brand Designer",
          bg: "bg-[#EFF8F4] text-[#10A995] border-[#DDEBE5] dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
        };
      case "marketing":
      case "creator":
        return {
          label: "Marketing Creator",
          bg: "bg-[#E8F7F1] text-[#087F70] border-[#C8E2D8] dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/60",
        };
      default:
        return {
          label: role || "Member",
          bg: "bg-[#EFF8F4] text-[#58716A] border-[#DDEBE5] dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
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
          Left Section: Back Button & Workspace Switcher
          ---------------------------------------------------- */}
      <div className="flex items-center space-x-2.5 shrink-0">
        <button
          type="button"
          onClick={() => {
            if (typeof window !== "undefined") {
              window.history.back();
            }
          }}
          aria-label="Go back"
          className="w-8 h-8 rounded-full border border-slate-200 dark:border-[#383838] bg-white dark:bg-[#1C1C1C] flex items-center justify-center text-slate-600 dark:text-[#85817D] hover:bg-slate-50 dark:hover:bg-[#252525] shadow-xs transition"
          title="Back"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

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
            <div className="absolute left-0 mt-2 w-64 bg-surface border border-border rounded-xl shadow-dropdown p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
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
      </div>

      {/* ----------------------------------------------------
          Center Section: Horizontally Centered Global Search Bar
          ---------------------------------------------------- */}
      <GlobalSearchBar />

      {/* ----------------------------------------------------
          Right Section: Notification Bell, Theme Toggle & Profile Dropdown
          ---------------------------------------------------- */}
      <div className="flex items-center space-x-2 sm:space-x-2.5 shrink-0">
        {/* In-App Workflow Notification Bell */}
        <NotificationBell />

        {/* Global Light / Dark Theme Toggle */}
        <ThemeToggle className="!w-8 !h-8 !rounded-full bg-white dark:bg-[#1C1C1C] border-slate-200 dark:border-[#383838] shadow-xs text-slate-600 dark:text-[#85817D]" />

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
                ? "bg-workspace border-teal/40 shadow-subtle"
                : "border-border/60 hover:border-border hover:bg-workspace"
            }`}
          >
            {/* User Avatar / Initials */}
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#087F70] via-[#10A995] to-[#43D6B3] text-white dark:from-[#FFAA35] dark:to-[#FF7A36] dark:text-[#111111] flex items-center justify-center font-bold text-xs shadow-subtle shrink-0">
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
              className="absolute right-0 mt-2 w-72 sm:w-80 max-w-[calc(100vw-2rem)] bg-surface border border-border rounded-2xl shadow-dropdown p-2.5 z-50 animate-in fade-in zoom-in-95 duration-100 focus:outline-none"
            >
              {/* 1. Identity & Role Summary Card (Profile) */}
              <div className="p-3 bg-workspace rounded-xl border border-border mb-2">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#087F70] via-[#10A995] to-[#43D6B3] text-white dark:from-[#FFAA35] dark:to-[#FF7A36] dark:text-[#111111] flex items-center justify-center font-bold text-sm shadow-subtle shrink-0 mt-0.5">
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
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium text-ink-muted bg-surface border border-border truncate max-w-[110px]">
                          <Building2 className="w-2.5 h-2.5 text-teal shrink-0" />
                          <span className="truncate">{activeOrgName}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Functional Menu Items */}
              <div className="space-y-1">
                <Link
                  href="/settings"
                  role="menuitem"
                  tabIndex={0}
                  onClick={() => setIsProfileOpen(false)}
                  className="w-full flex items-center space-x-2.5 px-3 py-2 text-xs font-medium text-ink-secondary hover:text-ink-primary hover:bg-workspace rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-teal"
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
                  className="w-full flex items-center space-x-2.5 px-3 py-2 text-xs font-medium text-ink-secondary hover:text-ink-primary hover:bg-workspace rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-teal"
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
