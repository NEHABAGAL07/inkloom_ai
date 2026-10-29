"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/services/auth-context";
import { InkloomLogo } from "./InkloomLogo";
import { ThemeToggle } from "@/services/theme-context";
import {
  LayoutDashboard,
  BookOpen,
  Sparkles,
  BarChart3,
  Clock,
  ShieldCheck,
  Bot,
  Users,
  Plus,
  Building2,
  LogOut,
  Folder,
  Layers,
  Briefcase,
  Palette,
  Scale,
} from "lucide-react";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

export function Sidebar() {
  const pathname = usePathname();
  const { activeOrgName, activeRole, user, logout } = useAuth();

  const getRoleLabel = (role: string | null) => {
    switch (role) {
      case "admin":
        return "Brand Admin";
      case "compliance_officer":
      case "legal":
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

  // 8 Workspace Navigation Items matching Image 1 Reference exactly
  const navItems: NavItem[] = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Review history", href: "/audits", icon: Folder },
    { name: "Guidelines", href: "/guidelines", icon: Sparkles },
    { name: "Insights", href: "/analytics", icon: BarChart3 },
    { name: "Brand Drift Time Machine", href: "/content", icon: Layers },
    { name: "Claim Review", href: "/reviews", icon: ShieldCheck },
    { name: "Quality Evaluation", href: "/assistant", icon: Bot },
    { name: "Company Admin", href: "/team", icon: Users },
  ];

  return (
    <aside className="w-64 bg-[#E6F7F2] dark:bg-[#1C1C1C] border-r border-[#D3EEE5] dark:border-[#383838] flex flex-col h-screen sticky top-0 shrink-0 text-ink-primary select-none z-30 transition-colors duration-150">
      {/* Brand Header with Cute Feather Symbol */}
      <div className="p-5 border-b border-[#D3EEE5] dark:border-border">
        <Link href="/" className="inline-block group">
          <InkloomLogo size="md" showSubtitle={true} />
        </Link>
      </div>

      {/* Primary Action Button: "+ New Review" with vibrant Turquoise-to-Royal-Blue gradient */}
      <div className="px-4 pt-4 pb-2">
        <Link
          href="/content"
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#10B981] via-[#0284C7] to-[#2563EB] text-white dark:btn-gradient-warm text-xs font-bold shadow-md hover:opacity-95 tracking-tight group transition-all duration-200"
        >
          <Plus className="w-4 h-4 text-white dark:text-[#111111] stroke-[2.5] transition-transform duration-200 group-hover:rotate-90" />
          <span>+ New Review</span>
        </Link>
      </div>

      {/* Organization Context Pill */}
      <div className="px-4 py-1.5">
        <div className="px-3 py-1.5 rounded-xl bg-[#DDF5ED] dark:bg-surface-elevated border border-[#C5EBDF] dark:border-border flex items-center justify-between">
          <div className="flex items-center space-x-2 truncate min-w-0">
            <Building2 className="w-3.5 h-3.5 text-[#0F766E] dark:text-[#FFAA35] shrink-0" />
            <span className="text-xs font-semibold text-[#0F172A] dark:text-ink-primary truncate">
              {activeOrgName || "Acme Cloud"}
            </span>
          </div>
          <span className="text-[10px] font-bold text-[#0F766E] bg-[#CEF0E5] border border-[#BDE7D9] dark:text-[#FFAA35] dark:bg-[#FFAA35]/10 dark:border-[#FFAA35]/25 px-1.5 py-0.5 rounded capitalize shrink-0 ml-1">
            {getRoleLabel(activeRole)}
          </span>
        </div>
      </div>

      {/* Navigation Links */}
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
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 ${
                isActive
                  ? "bg-[#CEF0E5] text-[#0F766E] font-bold shadow-xs border border-[#BDE7D9] dark:bg-surface-elevated dark:text-ink-primary dark:font-semibold dark:border-border"
                  : "text-[#334155] hover:text-[#0F766E] hover:bg-[#DDF5ED] dark:text-ink-secondary dark:hover:text-ink-primary dark:hover:bg-hover"
              }`}
            >
              <div className="flex items-center space-x-3 min-w-0">
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive ? "text-[#0F766E] dark:text-[#FFAA35]" : "text-[#475569] dark:text-ink-muted"
                  }`}
                />
                <span className="truncate">{item.name}</span>
              </div>
              {item.badge !== undefined && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                    isActive
                      ? "bg-[#10B981] text-white dark:bg-[#FFAA35] dark:text-[#111111]"
                      : "bg-[#DDF5ED] text-[#0F766E] border border-[#C5EBDF] dark:bg-surface-elevated dark:text-ink-secondary dark:border-border"
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Profile Section Anchored at Bottom with Pale Mint Wave Background */}
      <div className="p-3.5 border-t border-[#D3EEE5] dark:border-border bg-[#E6F7F2] dark:bg-surface relative overflow-hidden">
        {/* Soft Decorative Mint Wave in Light Mode */}
        <svg
          className="absolute bottom-0 left-0 right-0 pointer-events-none opacity-45 text-[#B8EBDD] dark:hidden"
          viewBox="0 0 256 60"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M0 32 C 55 10, 110 52, 170 24 C 215 5, 240 38, 256 22 L 256 60 L 0 60 Z" />
        </svg>

        <div className="relative z-10 flex items-center justify-between gap-2">
          {/* Peach Avatar + User Info */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-full bg-[#FB923C] text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0 select-none">
              {user?.full_name ? user.full_name.charAt(0).toUpperCase() : "S"}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-[#0F172A] dark:text-ink-primary truncate">
                {user?.full_name || "Saie Deshmukh"}
              </div>
              <div className="text-[10.5px] font-medium text-[#64748B] dark:text-ink-muted truncate">
                Free Plan
              </div>
            </div>
          </div>

          {/* Theme Toggle & Sign Out */}
          <div className="flex items-center gap-1 shrink-0">
            <ThemeToggle className="!w-8 !h-8 !rounded-full bg-white dark:bg-surface-elevated border-slate-300 dark:border-border shadow-xs" />
            <button
              onClick={() => logout()}
              title="Sign out"
              aria-label="Sign out"
              className="p-1.5 rounded-full text-[#64748B] hover:text-[#EF4444] hover:bg-white/60 dark:hover:bg-surface-elevated transition"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}

