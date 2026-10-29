"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/services/auth-context";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/services/theme-context";
import { GlobalSearchBar } from "./GlobalSearchBar";
import { NotificationBell } from "./NotificationBell";
import { useSidebar } from "./SidebarContext";
import {
  Building2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  LogOut,
  ShieldCheck,
  Check,
  Settings,
  Users,
  Loader2,
  ArrowLeft,
  Bell,
  Menu,
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
  const {
    toggleMobileDrawer,
    isMobileDrawerOpen,
    menuTriggerRef,
    isDesktopCollapsed,
    toggleDesktopCollapsed,
  } = useSidebar();
  const router = useRouter();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const profileTriggerRef = useRef<HTMLButtonElement>(null);

  // Close dropdown on outside click and handle Escape key globally
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(target)
      ) {
        setIsProfileOpen(false);
      }
    }

    function handleGlobalKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        if (isProfileOpen) {
          setIsProfileOpen(false);
          profileTriggerRef.current?.focus();
        }
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleGlobalKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleGlobalKeyDown);
    };
  }, [isProfileOpen]);

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
    <header className="h-16 border-b border-border bg-surface px-3 sm:px-4 lg:px-6 flex items-center justify-between sticky top-0 z-30 select-none shadow-subtle gap-2 sm:gap-3 transition-colors duration-150">
      {/* ----------------------------------------------------
          Left Section: Mobile Menu Trigger, Back Button & Workspace Switcher
          ---------------------------------------------------- */}
      <div className="flex items-center space-x-1.5 sm:space-x-2.5 shrink-0">
        {/* Desktop Bringing Back / Expand Sidebar Button in Header (shown only when collapsed) */}
        {isDesktopCollapsed && (
          <button
            type="button"
            onClick={toggleDesktopCollapsed}
            aria-label="Expand sidebar"
            title="Expand sidebar ( [ )"
            className="hidden lg:flex w-8 h-8 rounded-xl border border-slate-200 dark:border-[#383838] bg-white dark:bg-[#1C1C1C] items-center justify-center text-slate-700 dark:text-[#85817D] hover:text-[#087F70] dark:hover:text-[#FFAA35] hover:bg-slate-100 dark:hover:bg-[#252525] shadow-xs transition shrink-0 focus:outline-none focus:ring-2 focus:ring-teal select-none"
          >
            <ChevronRight className="w-4 h-4 text-ink-primary" />
          </button>
        )}

        {/* Mobile Navigation Drawer Trigger (< lg screens) */}
        <button
          ref={menuTriggerRef}
          type="button"
          onClick={toggleMobileDrawer}
          aria-label="Open navigation menu"
          aria-expanded={isMobileDrawerOpen}
          className="w-8 h-8 rounded-xl border border-slate-200 dark:border-[#383838] bg-white dark:bg-[#1C1C1C] flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#252525] shadow-xs transition lg:hidden shrink-0 focus:outline-none focus:ring-2 focus:ring-teal"
        >
          <Menu className="w-4 h-4 text-ink-primary" />
        </button>

        <button
          type="button"
          onClick={() => {
            if (typeof window !== "undefined") {
              window.history.back();
            }
          }}
          aria-label="Go back"
          className="w-8 h-8 rounded-full border border-slate-200 dark:border-[#383838] bg-white dark:bg-[#1C1C1C] hidden xs:flex items-center justify-center text-slate-600 dark:text-[#85817D] hover:bg-slate-50 dark:hover:bg-[#252525] shadow-xs transition"
          title="Back"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        {/* Company Identity: Logo Emblem and Company Name */}
        <div className="flex items-center gap-2.5 select-none py-1">
          {/* Branded Company Logo Emblem */}
          <div className="w-8 h-8 rounded-xl bg-teal-500/10 dark:bg-[#FFAA35]/15 border border-teal-500/20 dark:border-[#FFAA35]/30 flex items-center justify-center shrink-0 shadow-xs">
            <Building2 className="w-4 h-4 text-teal-600 dark:text-[#FFAA35]" />
          </div>

          {/* Company Name */}
          <span className="text-base sm:text-lg font-bold text-slate-900 dark:text-[#F7F3ED] tracking-tight truncate max-w-[160px] xs:max-w-[200px] sm:max-w-[260px] md:max-w-[340px]">
            {activeOrgName || "Acme Cloud Systems"}
          </span>
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

        {/* User Account Avatar Trigger (shows ONLY the avatar logo; no text in header) */}
        <div className="relative" ref={profileDropdownRef}>
          <button
            ref={profileTriggerRef}
            type="button"
            onClick={() => setIsProfileOpen((prev) => !prev)}
            onKeyDown={handleTriggerKeyDown}
            aria-expanded={isProfileOpen}
            aria-haspopup="true"
            aria-controls="user-profile-menu"
            id="user-profile-trigger"
            title={`Account: ${user?.full_name || user?.email || "User"} (${roleInfo.label})`}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal select-none ${
              isProfileOpen
                ? "ring-2 ring-teal dark:ring-[#FFAA35] shadow-xs"
                : "hover:opacity-90 hover:scale-105 active:scale-95"
            }`}
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#087F70] via-[#10A995] to-[#43D6B3] text-white dark:from-[#FFAA35] dark:to-[#FF7A36] dark:text-[#111111] flex items-center justify-center font-bold text-xs shadow-xs select-none">
              {initials}
            </div>
          </button>

          {/* Polished Profile Dropdown Menu in Table Format */}
          {isProfileOpen && (
            <div
              id="user-profile-menu"
              role="menu"
              aria-labelledby="user-profile-trigger"
              onKeyDown={handleMenuKeyDown}
              className="absolute right-0 mt-2 w-72 sm:w-84 max-w-[calc(100vw-2rem)] bg-surface border border-border rounded-2xl shadow-dropdown p-3 z-50 animate-in fade-in zoom-in-95 duration-100 focus:outline-none"
            >
              {/* Header Identity Card */}
              <div className="p-3 bg-workspace rounded-xl border border-border mb-2.5">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#087F70] via-[#10A995] to-[#43D6B3] text-white dark:from-[#FFAA35] dark:to-[#FF7A36] dark:text-[#111111] flex items-center justify-center font-bold text-sm shadow-subtle shrink-0">
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-ink-primary truncate">
                      {user?.full_name || "User Account"}
                    </div>
                    <div className="text-[11px] text-ink-muted truncate">
                      {user?.email}
                    </div>
                  </div>
                </div>
              </div>

              {/* Account Details Table */}
              <div className="rounded-xl border border-border overflow-hidden mb-2.5">
                <table className="w-full text-left text-xs border-collapse">
                  <tbody className="divide-y divide-border">
                    <tr className="bg-surface">
                      <td className="py-2 px-3 font-semibold text-ink-muted text-[11px] w-24 bg-workspace/50">
                        Role
                      </td>
                      <td className="py-2 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-semibold border ${roleInfo.bg}`}
                          title={`Assigned Role: ${roleInfo.label}`}
                        >
                          <ShieldCheck className="w-3 h-3 text-teal shrink-0" />
                          <span className="truncate max-w-[140px]">{roleInfo.label}</span>
                        </span>
                      </td>
                    </tr>
                    <tr className="bg-surface">
                      <td className="py-2 px-3 font-semibold text-ink-muted text-[11px] bg-workspace/50">
                        Workspace
                      </td>
                      <td className="py-2 px-3 font-medium text-ink-primary text-xs">
                        <div className="flex items-center gap-1.5 truncate">
                          <Building2 className="w-3.5 h-3.5 text-teal shrink-0" />
                          <span className="truncate">{activeOrgName || "Acme Cloud Systems"}</span>
                        </div>
                      </td>
                    </tr>
                    <tr className="bg-surface">
                      <td className="py-2 px-3 font-semibold text-ink-muted text-[11px] bg-workspace/50">
                        Access
                      </td>
                      <td className="py-2 px-3 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                        <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span>Active Authenticated</span>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Functional Menu Items */}
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

              {/* Divider */}
              <div className="my-1.5 border-t border-border" />

              {/* Sign Out Action */}
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
