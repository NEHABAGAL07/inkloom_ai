"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/services/auth-context";
import { useSidebar } from "./SidebarContext";
import { InkloomLogo } from "./InkloomLogo";
import { motion, AnimatePresence } from "motion/react";
import {
  LayoutDashboard,
  Folder,
  Sparkles,
  BarChart3,
  ShieldCheck,
  Users,
  Image as ImageIcon,
  Plus,
  LogOut,
  Palette,
  FileText,
  Scale,
  Briefcase,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Settings,
  Loader2,
} from "lucide-react";

export interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

// Role-specific navigation mapping
export const ROLE_NAV_ITEMS: Record<"admin" | "designer" | "marketing" | "legal", NavItem[]> = {
  admin: [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Campaigns", href: "/campaigns", icon: Briefcase },
    { name: "Review history", href: "/audits", icon: Folder },
    { name: "Guidelines", href: "/guidelines", icon: Sparkles },
    { name: "Insights", href: "/analytics", icon: BarChart3 },
    { name: "Claim Review", href: "/reviews", icon: ShieldCheck },
    { name: "Company Admin", href: "/team", icon: Users },
  ],
  designer: [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Media Audit ", href: "/media-audit", icon: ImageIcon },
    { name: "Designer Studio & Copilot", href: "/designer", icon: Palette },
    { name: "Campaigns", href: "/campaigns", icon: Briefcase },
    { name: "Review history", href: "/audits", icon: Folder },
  ],
  marketing: [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Marketing Copilot", href: "/marketing", icon: FileText },
    { name: "Campaigns", href: "/campaigns", icon: Briefcase },
    { name: "Guidelines", href: "/guidelines", icon: Sparkles },
    { name: "Review history", href: "/audits", icon: Folder },
  ],
  legal: [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Legal & Regulatory Review", href: "/legal", icon: Scale },
    { name: "Claim Review", href: "/reviews", icon: ShieldCheck },
    { name: "Review history", href: "/audits", icon: Folder },
    { name: "Guidelines", href: "/guidelines", icon: Sparkles },
    { name: "Insights & Audits", href: "/analytics", icon: BarChart3 },
  ],
};

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { activeOrgName, activeRole, user, logout } = useAuth();
  const {
    isMobileDrawerOpen,
    closeMobileDrawer,
    isDesktopCollapsed,
    toggleDesktopCollapsed,
  } = useSidebar();

  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isMobileAccountMenuOpen, setIsMobileAccountMenuOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const accountMenuRef = useRef<HTMLDivElement>(null);
  const accountTriggerRef = useRef<HTMLButtonElement>(null);
  const mobileAccountMenuRef = useRef<HTMLDivElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  // Close account menu on click-outside or Escape key
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (accountMenuRef.current && !accountMenuRef.current.contains(target)) {
        setIsAccountMenuOpen(false);
      }
      if (mobileAccountMenuRef.current && !mobileAccountMenuRef.current.contains(target)) {
        setIsMobileAccountMenuOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        if (isAccountMenuOpen) {
          setIsAccountMenuOpen(false);
          accountTriggerRef.current?.focus();
        }
        if (isMobileAccountMenuOpen) {
          setIsMobileAccountMenuOpen(false);
        }
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isAccountMenuOpen, isMobileAccountMenuOpen]);

  // Sign out handler wired to auth context
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
      setIsAccountMenuOpen(false);
      setIsMobileAccountMenuOpen(false);
      if (isMobileDrawerOpen) closeMobileDrawer();
    }
  };

  const getRoleKey = (role: string | null): "admin" | "designer" | "marketing" | "legal" => {
    switch (role) {
      case "designer":
        return "designer";
      case "marketing":
      case "creator":
        return "marketing";
      case "compliance_officer":
      case "legal":
      case "reviewer":
        return "legal";
      case "admin":
      default:
        return "admin";
    }
  };

  const getRoleLabel = (role: string | null) => {
    switch (role) {
      case "admin":
        return "Brand Admin";
      case "compliance_officer":
      case "legal":
      case "reviewer":
        return "Legal & Compliance";
      case "designer":
        return "Brand Designer";
      case "marketing":
      case "creator":
        return "Marketing Lead";
      default:
        return role || "Member";
    }
  };

  const getUserInitials = () => {
    if (user?.full_name) {
      const parts = user.full_name.trim().split(/\s+/);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      return parts[0].substring(0, 2).toUpperCase();
    }
    if (user?.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return "JD";
  };

  const roleKey = getRoleKey(activeRole);
  const navItems = ROLE_NAV_ITEMS[roleKey] || ROLE_NAV_ITEMS.admin;
  const userInitials = getUserInitials();

  const isDesigner = roleKey === "designer";
  const primaryActionLabel = isDesigner ? "New Design" : "New Review";
  const primaryActionHref = isDesigner ? "/designer?tab=canvas_audit" : "/reviews";
  const primaryActionTitle = isDesigner
    ? "Create and upload new design"
    : roleKey === "marketing"
    ? "Review submissions from marketing perspective"
    : roleKey === "legal"
    ? "Review submissions for legal and compliance"
    : "Review submitted designs";

  // Consistent high-contrast styling for navigation items
  const getItemClasses = useCallback(
    (isActive: boolean, isCollapsed: boolean) => {
      const base =
        "flex items-center rounded-xl text-xs font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal select-none group";
      const layout = isCollapsed
        ? "justify-center w-11 h-11 mx-auto"
        : "justify-between px-3.5 py-2.5";

      if (isActive) {
        return `${base} ${layout} bg-[#CEF0E5] text-[#065F54] font-bold border border-[#B2E4D4] shadow-2xs dark:bg-[#282828] dark:text-[#F7F3ED] dark:border-[#3E3E3E] dark:shadow-xs`;
      }

      return `${base} ${layout} text-[#334155] hover:text-[#065F54] hover:bg-[#D6F2E8] active:bg-[#C2EADF] dark:text-[#B8B2AC] dark:hover:text-[#F7F3ED] dark:hover:bg-[#252525] dark:active:bg-[#2A2A2A]`;
    },
    []
  );

  const getIconClasses = useCallback((isActive: boolean) => {
    if (isActive) {
      return "w-4 h-4 shrink-0 text-[#087F70] dark:text-[#FFAA35] transition-colors";
    }
    return "w-4 h-4 shrink-0 text-[#58716A] dark:text-[#85817D] group-hover:text-[#087F70] dark:group-hover:text-[#FFAA35] transition-colors";
  }, []);

  const getBadgeClasses = useCallback((isActive: boolean) => {
    if (isActive) {
      return "text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-[#087F70] text-white dark:bg-[#FFAA35] dark:text-[#111111]";
    }
    return "text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-[#D6F2E8] text-[#087F70] border border-[#B2E4D4] dark:bg-[#252525] dark:text-[#B8B2AC] dark:border-[#383838]";
  }, []);

  return (
    <>
      {/* ========================================================
          1. Desktop / Tablet Responsive Sidebar (Sticky in layout)
          ======================================================== */}
      <aside
        className={`hidden lg:flex flex-col h-screen sticky top-0 shrink-0 bg-[#E6F7F2] dark:bg-[#1C1C1C] border-r border-[#D3EEE5] dark:border-[#383838] text-ink-primary select-none z-30 transition-all duration-200 ease-in-out ${
          isDesktopCollapsed ? "w-20" : "w-64"
        }`}
        aria-label="Workspace navigation"
      >
        {/* Brand Header: consistent h-16 height in both expanded and collapsed */}
        <div
          className={`h-16 border-b border-[#D3EEE5] dark:border-[#383838] flex items-center shrink-0 ${
            isDesktopCollapsed ? "justify-center px-2" : "px-4 justify-between"
          }`}
        >
          <Link
            href="/"
            title="Inkloom AI Home"
            className="inline-flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal rounded-xl"
          >
            {isDesktopCollapsed ? (
              <InkloomLogo size="md" showWordmark={false} />
            ) : (
              <InkloomLogo size="md" showWordmark={true} showSubtitle={false} showBadge={true} />
            )}
          </Link>

          {!isDesktopCollapsed && (
            <button
              type="button"
              onClick={toggleDesktopCollapsed}
              aria-label="Collapse sidebar"
              title="Collapse sidebar ( [ )"
              className="w-8 h-8 rounded-xl border border-slate-200/80 dark:border-[#383838] bg-white/70 dark:bg-[#252525] flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-[#85817D] dark:hover:text-[#F7F3ED] hover:bg-white dark:hover:bg-[#2E2E2E] shadow-2xs transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal shrink-0 select-none"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Primary Action Button: Role-Aware ("+ New Design" for Designer, "+ New Review" for Reviewers) */}
        <div className={`pt-3 pb-2 shrink-0 ${isDesktopCollapsed ? "px-2 flex justify-center" : "px-4"}`}>
          <Link
            href={primaryActionHref}
            title={primaryActionTitle}
            aria-label={primaryActionLabel}
            className={`flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#10B981] via-[#0284C7] to-[#2563EB] text-white dark:btn-gradient-warm text-xs font-bold shadow-md hover:opacity-95 tracking-tight group transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal ${
              isDesktopCollapsed ? "w-11 h-11 p-0" : "w-full px-4 py-2.5"
            }`}
          >
            <Plus className="w-4 h-4 text-white dark:text-[#111111] stroke-[2.5] transition-transform duration-200 group-hover:rotate-90 shrink-0" />
            {!isDesktopCollapsed && <span>+ {primaryActionLabel}</span>}
          </Link>
        </div>


        {/* Navigation Links */}
        <nav className="flex-1 px-2.5 py-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href === "/guidelines" && pathname === "/settings") ||
              (item.href === "/" && pathname === "/demo");

            return (
              <Link
                key={item.name}
                href={item.href}
                title={item.name}
                aria-label={item.name}
                className={getItemClasses(isActive, isDesktopCollapsed)}
              >
                <div className={`flex items-center ${isDesktopCollapsed ? "justify-center" : "space-x-3 min-w-0"}`}>
                  <Icon className={getIconClasses(isActive)} />
                  {!isDesktopCollapsed && <span className="truncate">{item.name}</span>}
                </div>
                {!isDesktopCollapsed && item.badge !== undefined && (
                  <span className={getBadgeClasses(isActive)}>{item.badge}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Unified User Account Footer with Integrated Menu (Theme Toggle removed) */}
        <div
          ref={accountMenuRef}
          className={`border-t border-[#D3EEE5] dark:border-[#383838] bg-[#E6F7F2] dark:bg-[#1C1C1C] relative shrink-0 ${
            isDesktopCollapsed ? "p-2.5 flex justify-center" : "p-3"
          }`}
        >
          {/* Expanded Profile Trigger Button */}
          {!isDesktopCollapsed ? (
            <button
              ref={accountTriggerRef}
              type="button"
              onClick={() => setIsAccountMenuOpen((prev) => !prev)}
              aria-expanded={isAccountMenuOpen}
              aria-haspopup="true"
              aria-label="User account menu"
              title={`Account: ${user?.full_name || user?.email || "User"} (${getRoleLabel(activeRole)})`}
              className={`w-full flex items-center justify-between p-2 rounded-xl transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal ${
                isAccountMenuOpen
                  ? "bg-[#D6F2E8] dark:bg-[#282828] border border-[#BDE7D9] dark:border-[#3E3E3E]"
                  : "hover:bg-[#D6F2E8] dark:hover:bg-[#252525] border border-transparent"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#087F70] via-[#10A995] to-[#43D6B3] text-white dark:from-[#FFAA35] dark:to-[#FF7A36] dark:text-[#111111] flex items-center justify-center font-bold text-xs shadow-xs shrink-0 select-none">
                  {userInitials}
                </div>
                <div className="min-w-0 text-left leading-tight">
                  <div className="text-xs font-bold text-[#0F172A] dark:text-[#F7F3ED] truncate">
                    {user?.full_name || user?.email?.split("@")[0] || "User Account"}
                  </div>
                  <div className="text-[10.5px] font-medium text-[#64748B] dark:text-[#85817D] truncate mt-0.5">
                    {getRoleLabel(activeRole)}
                  </div>
                </div>
              </div>

              <ChevronUp
                className={`w-4 h-4 text-slate-400 dark:text-[#85817D] transition-transform duration-200 shrink-0 ${
                  isAccountMenuOpen ? "rotate-180 text-[#0F766E] dark:text-[#FFAA35]" : ""
                }`}
              />
            </button>
          ) : (
            /* Collapsed Profile Trigger Button (Avatar only) */
            <button
              ref={accountTriggerRef}
              type="button"
              onClick={() => setIsAccountMenuOpen((prev) => !prev)}
              aria-expanded={isAccountMenuOpen}
              aria-haspopup="true"
              aria-label={`Account menu for ${user?.full_name || "User"}`}
              title={`Account: ${user?.full_name || user?.email || "User"} (${getRoleLabel(activeRole)})`}
              className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal ${
                isAccountMenuOpen
                  ? "bg-[#D6F2E8] dark:bg-[#282828] border border-[#BDE7D9] dark:border-[#3E3E3E]"
                  : "hover:bg-[#D6F2E8] dark:hover:bg-[#252525] border border-transparent"
              }`}
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#087F70] via-[#10A995] to-[#43D6B3] text-white dark:from-[#FFAA35] dark:to-[#FF7A36] dark:text-[#111111] flex items-center justify-center font-bold text-xs shadow-xs select-none">
                {userInitials}
              </div>
            </button>
          )}

          {/* Integrated User Account Dropdown Popover */}
          {isAccountMenuOpen && (
            <div
              role="menu"
              aria-label="User account actions"
              className={`absolute z-50 bg-white dark:bg-[#202020] border border-[#D3EEE5] dark:border-[#383838] rounded-2xl p-3 shadow-dropdown animate-in fade-in zoom-in-95 duration-100 ${
                isDesktopCollapsed
                  ? "left-full bottom-0 ml-3 w-72"
                  : "bottom-full left-3 right-3 mb-2"
              }`}
            >
              {/* User Identity & Role Context */}
              <div className="p-3 rounded-xl bg-[#F0FAF6] dark:bg-[#171717] border border-[#DDEBE5] dark:border-[#2C2C2C] mb-2">
                <div className="flex items-start gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#087F70] via-[#10A995] to-[#43D6B3] text-white dark:from-[#FFAA35] dark:to-[#FF7A36] dark:text-[#111111] flex items-center justify-center font-bold text-xs shadow-xs shrink-0 mt-0.5">
                    {userInitials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div
                      className="text-xs font-bold text-[#0F172A] dark:text-[#F7F3ED] truncate"
                      title={user?.full_name || "User"}
                    >
                      {user?.full_name || user?.email?.split("@")[0] || "User Account"}
                    </div>
                    {user?.email && (
                      <div
                        className="text-[11px] text-[#64748B] dark:text-[#85817D] truncate"
                        title={user.email}
                      >
                        {user.email}
                      </div>
                    )}
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#CEF0E5] text-[#0F766E] border border-[#BDE7D9] dark:bg-[#FFAA35]/15 dark:text-[#FFAA35] dark:border-[#FFAA35]/30">
                        {getRoleLabel(activeRole)}
                      </span>
                      {activeOrgName && (
                        <span className="text-[10px] font-medium text-slate-500 dark:text-[#85817D] truncate max-w-[120px]">
                          {activeOrgName}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation link: Settings & Guidelines */}
              <div className="space-y-0.5">
                <Link
                  href="/settings"
                  role="menuitem"
                  onClick={() => setIsAccountMenuOpen(false)}
                  className="w-full flex items-center space-x-2.5 px-3 py-2 text-xs font-medium text-slate-600 dark:text-[#B8B2AC] hover:text-slate-900 dark:hover:text-[#F7F3ED] hover:bg-[#F0FAF6] dark:hover:bg-[#272727] rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal"
                >
                  <Settings className="w-4 h-4 text-[#087F70] dark:text-[#FFAA35] shrink-0" />
                  <span className="flex-1 text-left">Settings & Guidelines</span>
                </Link>
              </div>

              {/* Divider */}
              <div className="my-1.5 border-t border-[#D3EEE5] dark:border-[#2C2C2C]" />

              {/* Clear, integrated Sign Out action */}
              <button
                type="button"
                role="menuitem"
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="w-full flex items-center space-x-2.5 px-3 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
              >
                {isSigningOut ? (
                  <Loader2 className="w-4 h-4 animate-spin text-rose-500 shrink-0" />
                ) : (
                  <LogOut className="w-4 h-4 text-rose-500 shrink-0" />
                )}
                <span className="flex-1 text-left">
                  {isSigningOut ? "Signing Out..." : "Sign Out"}
                </span>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ========================================================
          2. Mobile Slide-in Drawer Navigation (< lg screens)
          ======================================================== */}
      <AnimatePresence>
        {isMobileDrawerOpen && (
          <>
            {/* Backdrop Fade */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={closeMobileDrawer}
              aria-hidden="true"
              className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 lg:hidden"
            />

            {/* Slide-in Drawer */}
            <motion.aside
              ref={drawerRef}
              role="dialog"
              aria-modal="true"
              aria-label="Workspace navigation menu"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-[#E6F7F2] dark:bg-[#1C1C1C] border-r border-[#D3EEE5] dark:border-[#383838] flex flex-col z-50 shadow-2xl lg:hidden select-none"
            >
              {/* Drawer Header with Logo & Close Button */}
              <div className="h-16 px-4 border-b border-[#D3EEE5] dark:border-border flex items-center justify-between shrink-0">
                <Link
                  href="/"
                  onClick={closeMobileDrawer}
                  className="inline-block group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal rounded-lg"
                >
                  <InkloomLogo size="md" showWordmark={true} showSubtitle={false} showBadge={true} />
                </Link>

                <button
                  type="button"
                  onClick={closeMobileDrawer}
                  aria-label="Close navigation menu"
                  className="w-10 h-10 rounded-xl border border-[#D3EEE5] dark:border-[#383838] bg-white/80 dark:bg-[#252525] text-slate-600 dark:text-slate-300 flex items-center justify-center hover:bg-white dark:hover:bg-[#2E2E2E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal transition shadow-xs"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Primary Action Button: Role-Aware ("+ New Design" for Designer, "+ New Review" for Reviewers) */}
              <div className="p-4 pb-2 shrink-0">
                <Link
                  href={primaryActionHref}
                  onClick={closeMobileDrawer}
                  title={primaryActionTitle}
                  aria-label={primaryActionLabel}
                  className="w-full min-h-[44px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#10B981] via-[#0284C7] to-[#2563EB] text-white dark:btn-gradient-warm text-xs font-bold shadow-md hover:opacity-95 tracking-tight group transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal"
                >
                  <Plus className="w-4 h-4 text-white dark:text-[#111111] stroke-[2.5]" />
                  <span>+ {primaryActionLabel}</span>
                </Link>
              </div>


              {/* Navigation Links in Scrollable Area */}
              <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    pathname === item.href ||
                    (item.href === "/guidelines" && pathname === "/settings") ||
                    (item.href === "/" && pathname === "/demo");

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={closeMobileDrawer}
                      className={getItemClasses(isActive, false)}
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <Icon className={getIconClasses(isActive)} />
                        <span className="truncate">{item.name}</span>
                      </div>
                      {item.badge !== undefined && (
                        <span className={getBadgeClasses(isActive)}>{item.badge}</span>
                      )}
                    </Link>
                  );
                })}
              </nav>

              {/* Drawer Bottom Profile Section with Integrated Account Menu */}
              <div
                ref={mobileAccountMenuRef}
                className="p-3 border-t border-[#D3EEE5] dark:border-border bg-[#E6F7F2] dark:bg-[#1C1C1C] relative shrink-0"
              >
                <button
                  type="button"
                  onClick={() => setIsMobileAccountMenuOpen((prev) => !prev)}
                  aria-expanded={isMobileAccountMenuOpen}
                  aria-haspopup="true"
                  aria-label="User account menu"
                  className={`w-full flex items-center justify-between p-2 rounded-xl transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal ${
                    isMobileAccountMenuOpen
                      ? "bg-[#D6F2E8] dark:bg-[#282828] border border-[#BDE7D9] dark:border-[#3E3E3E]"
                      : "hover:bg-[#D6F2E8] dark:hover:bg-[#252525] border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#087F70] via-[#10A995] to-[#43D6B3] text-white dark:from-[#FFAA35] dark:to-[#FF7A36] dark:text-[#111111] flex items-center justify-center font-bold text-xs shadow-xs shrink-0 select-none">
                      {userInitials}
                    </div>
                    <div className="min-w-0 text-left leading-tight">
                      <div className="text-xs font-bold text-[#0F172A] dark:text-[#F7F3ED] truncate">
                        {user?.full_name || user?.email?.split("@")[0] || "User Account"}
                      </div>
                      <div className="text-[11px] font-medium text-[#64748B] dark:text-[#85817D] truncate mt-0.5">
                        {getRoleLabel(activeRole)}
                      </div>
                    </div>
                  </div>

                  <ChevronUp
                    className={`w-4 h-4 text-slate-400 dark:text-[#85817D] transition-transform duration-200 shrink-0 ${
                      isMobileAccountMenuOpen ? "rotate-180 text-[#0F766E] dark:text-[#FFAA35]" : ""
                    }`}
                  />
                </button>

                {/* Mobile Drawer Account Popover */}
                {isMobileAccountMenuOpen && (
                  <div
                    role="menu"
                    aria-label="User account actions"
                    className="absolute bottom-full left-3 right-3 mb-2 bg-white dark:bg-[#202020] border border-[#D3EEE5] dark:border-[#383838] rounded-2xl p-3 shadow-dropdown z-50 animate-in fade-in zoom-in-95 duration-100"
                  >
                    <div className="p-3 rounded-xl bg-[#F0FAF6] dark:bg-[#171717] border border-[#DDEBE5] dark:border-[#2C2C2C] mb-2">
                      <div className="text-xs font-bold text-[#0F172A] dark:text-[#F7F3ED] truncate">
                        {user?.full_name || user?.email?.split("@")[0] || "User Account"}
                      </div>
                      {user?.email && (
                        <div className="text-[11px] text-[#64748B] dark:text-[#85817D] truncate">
                          {user.email}
                        </div>
                      )}
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#CEF0E5] text-[#0F766E] border border-[#BDE7D9] dark:bg-[#FFAA35]/15 dark:text-[#FFAA35] dark:border-[#FFAA35]/30">
                          {getRoleLabel(activeRole)}
                        </span>
                        {activeOrgName && (
                          <span className="text-[10px] font-medium text-slate-500 dark:text-[#85817D] truncate max-w-[120px]">
                            {activeOrgName}
                          </span>
                        )}
                      </div>
                    </div>

                    <Link
                      href="/settings"
                      role="menuitem"
                      onClick={() => {
                        setIsMobileAccountMenuOpen(false);
                        closeMobileDrawer();
                      }}
                      className="w-full flex items-center space-x-2.5 px-3 py-2 text-xs font-medium text-slate-600 dark:text-[#B8B2AC] hover:text-slate-900 dark:hover:text-[#F7F3ED] hover:bg-[#F0FAF6] dark:hover:bg-[#272727] rounded-xl transition-colors"
                    >
                      <Settings className="w-4 h-4 text-[#087F70] dark:text-[#FFAA35] shrink-0" />
                      <span className="flex-1 text-left">Settings & Guidelines</span>
                    </Link>

                    <div className="my-1.5 border-t border-[#D3EEE5] dark:border-[#2C2C2C]" />

                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleSignOut}
                      disabled={isSigningOut}
                      className="w-full flex items-center space-x-2.5 px-3 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors disabled:opacity-50"
                    >
                      {isSigningOut ? (
                        <Loader2 className="w-4 h-4 animate-spin text-rose-500 shrink-0" />
                      ) : (
                        <LogOut className="w-4 h-4 text-rose-500 shrink-0" />
                      )}
                      <span className="flex-1 text-left">
                        {isSigningOut ? "Signing Out..." : "Sign Out"}
                      </span>
                    </button>
                  </div>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
