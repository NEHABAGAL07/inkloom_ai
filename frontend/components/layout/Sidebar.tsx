"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/services/auth-context";

interface NavItem {
  name: string;
  href: string;
  icon: string;
  badge?: number;
}

export function Sidebar() {
  const pathname = usePathname();
  const { activeOrgName, activeRole } = useAuth();

  // Role-appropriate navigation menus
  const getNavItems = (): NavItem[] => {
    switch (activeRole) {
      case "admin":
        return [
          { name: "Executive Dashboard", href: "/", icon: "📊" },
          { name: "Submit Content", href: "/content", icon: "✍️" },
          { name: "Audit Results", href: "/audits", icon: "🛡️" },
          { name: "Review Queue", href: "/reviews", icon: "📋", badge: 3 },
          { name: "Governance Analytics", href: "/analytics", icon: "📈" },
          { name: "Brand Guidelines", href: "/settings", icon: "⚙️" },
          { name: "Team & Permissions", href: "/team", icon: "👥" },
        ];
      case "designer":
        return [
          { name: "Creative Workspace", href: "/", icon: "🎨" },
          { name: "Brand Kit & Assets", href: "/settings", icon: "🖼️" },
          { name: "Media Audit & Upload", href: "/content", icon: "📤" },
          { name: "Visual Audit Results", href: "/audits", icon: "🛡️" },
          { name: "Review Feedback", href: "/reviews", icon: "💬" },
        ];
      case "compliance_officer":
      case "reviewer":
        return [
          { name: "Compliance Triage", href: "/", icon: "⚖️" },
          { name: "Review Queue", href: "/reviews", icon: "📋", badge: 3 },
          { name: "Audit Findings Explorer", href: "/audits", icon: "🛡️" },
          { name: "Approved Claims & Rules", href: "/settings", icon: "📜" },
          { name: "Risk Analytics", href: "/analytics", icon: "📈" },
        ];
      case "marketing":
      case "creator":
      default:
        return [
          { name: "Campaign Workspace", href: "/", icon: "📢" },
          { name: "Submit Content Studio", href: "/content", icon: "✍️" },
          { name: "AI Audit Findings", href: "/audits", icon: "🛡️" },
          { name: "Content Review Status", href: "/reviews", icon: "📋" },
        ];
    }
  };

  const navItems = getNavItems();

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-screen sticky top-0 shrink-0">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-800/80 flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <span className="text-xl font-black text-white">I</span>
        </div>
        <div>
          <div className="font-bold text-lg tracking-tight text-white flex items-center gap-1.5">
            Inkloom{" "}
            <span className="text-indigo-400 font-extrabold text-xs px-1.5 py-0.5 rounded bg-indigo-950/80 border border-indigo-800/60">
              AI
            </span>
          </div>
          <div className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">Brand Governance</div>
        </div>
      </div>

      {/* Tenant Context */}
      <div className="px-4 py-3 mx-3 my-3 rounded-xl bg-slate-800/50 border border-slate-700/50 flex items-center justify-between">
        <div className="flex items-center space-x-2 truncate">
          <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
          <span className="text-xs font-semibold text-slate-200 truncate">{activeOrgName || "Workspace"}</span>
        </div>
        <span className="text-[10px] text-indigo-400 font-bold bg-indigo-950/80 border border-indigo-800/50 px-2 py-0.5 rounded capitalize">
          {activeRole || "Member"}
        </span>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 pb-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <a
              key={item.name}
              href={item.href}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-semibold"
                  : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/60"
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className="text-base">{item.icon}</span>
                <span>{item.name}</span>
              </div>
              {item.badge !== undefined && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                    isActive
                      ? "bg-white text-indigo-700"
                      : "bg-indigo-900/60 text-indigo-300 border border-indigo-700/40"
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </a>
          );
        })}
      </nav>
    </aside>
  );
}
