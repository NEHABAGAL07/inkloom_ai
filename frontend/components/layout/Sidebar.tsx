"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/services/auth-context";
import {
  LayoutDashboard,
  BookOpen,
  ShieldCheck,
  ClipboardCheck,
  BarChart3,
  Users,
  Settings,
  Building2,
  ChevronRight,
  Shield,
  Bot,
  Sparkles,
  Palette,
  Scale,
  Briefcase,
} from "lucide-react";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

export function Sidebar() {
  const pathname = usePathname();
  const { activeOrgName, activeRole } = useAuth();

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

  // Role-aware navigation tailored to specific workspace responsibilities
  const getNavItems = (): NavItem[] => {
    const isLegal =
      activeRole === "compliance_officer" || activeRole === "legal" || activeRole === "reviewer";
    const isMarketing = activeRole === "marketing" || activeRole === "creator";
    const isDesigner = activeRole === "designer";
    const isAdmin = activeRole === "admin";

    if (isMarketing) {
      return [
        { name: "Campaigns & Workflows", href: "/campaigns", icon: Briefcase },
        { name: "Marketing Copilot", href: "/marketing", icon: Sparkles },
        { name: "Designer Copilot", href: "/designer", icon: Palette },
        { name: "Legal Copilot", href: "/legal", icon: Scale },
        { name: "Marketing Station", href: "/", icon: LayoutDashboard },
        { name: "Brand Assistant", href: "/assistant", icon: Bot },
        { name: "My Audit Results", href: "/audits", icon: ShieldCheck },
        { name: "Brand Voice & Rules", href: "/guidelines", icon: BookOpen },
      ];
    }

    if (isDesigner) {
      return [
        { name: "Campaigns & Workflows", href: "/campaigns", icon: Briefcase },
        { name: "Designer Copilot", href: "/designer", icon: Palette },
        { name: "Legal Copilot", href: "/legal", icon: Scale },
        { name: "Design Studio", href: "/", icon: LayoutDashboard },
        { name: "Brand Assistant", href: "/assistant", icon: Bot },
        { name: "Visual Brand Standards", href: "/guidelines", icon: BookOpen },
        { name: "Asset Gallery & Audits", href: "/audits", icon: ShieldCheck },
        { name: "Review Feedback", href: "/reviews", icon: ClipboardCheck },
      ];
    }

    if (isLegal) {
      return [
        { name: "Campaign Workflows", href: "/campaigns", icon: Briefcase },
        { name: "Legal Copilot", href: "/legal", icon: Scale },
        { name: "Compliance Station", href: "/", icon: LayoutDashboard },
        { name: "Brand Assistant", href: "/assistant", icon: Bot },
        { name: "Review & Approval Queue", href: "/reviews", icon: ClipboardCheck },
        { name: "Audit Evidence Ledger", href: "/audits", icon: ShieldCheck },
        { name: "Statutory Guidelines", href: "/guidelines", icon: BookOpen },
        { name: "Compliance Analytics", href: "/analytics", icon: BarChart3 },
      ];
    }

    // Default / Admin full executive suite
    return [
      { name: "Campaigns & Workflows", href: "/campaigns", icon: Briefcase },
      { name: "Executive Dashboard", href: "/", icon: LayoutDashboard },
      { name: "Marketing Copilot", href: "/marketing", icon: Sparkles },
      { name: "Designer Copilot", href: "/designer", icon: Palette },
      { name: "Legal Copilot", href: "/legal", icon: Scale },
      { name: "Brand Assistant", href: "/assistant", icon: Bot },
      { name: "Brand Guidelines & Rules", href: "/guidelines", icon: BookOpen },
      { name: "Governance Analytics", href: "/analytics", icon: BarChart3 },
      { name: "Approval Review Queue", href: "/reviews", icon: ClipboardCheck },
      { name: "Audit Results Ledger", href: "/audits", icon: ShieldCheck },
      { name: "Team & Permissions", href: "/team", icon: Users },
    ];
  };

  const navItems = getNavItems();

  return (
    <aside className="w-64 bg-[#0B1728] dark:bg-[#0F172A] border-r border-[#1E3A5F]/40 dark:border-[#334155] flex flex-col h-screen sticky top-0 shrink-0 text-slate-200 select-none transition-colors duration-150">
      {/* Brand Header */}
      <div className="p-5 border-b border-[#1E3A5F]/40 dark:border-[#334155] flex items-center space-x-3">
        <div className="w-9 h-9 rounded-lg bg-teal flex items-center justify-center shadow-sm">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
            Inkloom
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-teal/20 text-teal-300 border border-teal/40 uppercase tracking-wider">
              AI
            </span>
          </div>
          <div className="text-[11px] text-slate-400 font-medium tracking-wide">
            Enterprise Brand Governance
          </div>
        </div>
      </div>

      {/* Tenant Context Selector */}
      <div className="px-3 py-3 border-b border-[#1E3A5F]/40 dark:border-[#334155]">
        <div className="px-3 py-2 rounded-lg bg-[#14263D]/70 dark:bg-[#162235] border border-[#1E3A5F]/50 dark:border-[#334155] flex items-center justify-between">
          <div className="flex items-center space-x-2 truncate min-w-0">
            <Building2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />
            <span className="text-xs font-semibold text-white truncate">
              {activeOrgName || "Workspace"}
            </span>
          </div>
          <span className="text-[10px] font-semibold text-teal-300 bg-teal-950/80 border border-teal-800/60 px-1.5 py-0.5 rounded capitalize shrink-0 ml-1">
            {getRoleLabel(activeRole)}
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
        <div className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Navigation
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href === "/guidelines" && pathname === "/settings");

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                isActive
                  ? "bg-teal text-white font-semibold shadow-sm"
                  : "text-slate-300 hover:text-white hover:bg-[#14263D] dark:hover:bg-[#162235]"
              }`}
            >
              <div className="flex items-center space-x-2.5 min-w-0">
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? "text-white" : "text-slate-400"
                  }`}
                />
                <span className="truncate">{item.name}</span>
              </div>
              {item.badge !== undefined && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isActive
                      ? "bg-white text-teal-800"
                      : "bg-[#14263D] dark:bg-[#162235] text-slate-300 border border-[#1E3A5F] dark:border-[#334155]"
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer System Status */}
      <div className="p-3 border-t border-[#1E3A5F]/40 dark:border-[#334155] text-[11px] text-slate-400 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Audit Engine Online</span>
        </div>
        <span className="font-mono text-[10px] text-slate-400">v2.4.0</span>
      </div>
    </aside>
  );
}
