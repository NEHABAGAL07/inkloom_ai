"use client";

import React from "react";
import { useAuth } from "@/services/auth-context";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { usePathname } from "next/navigation";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const pathname = usePathname();

  // Public routes that don't require the dashboard shell
  const isPublicRoute = pathname?.startsWith("/invite");

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-400 flex items-center justify-center animate-pulse shadow-xl shadow-indigo-500/20">
          <span className="text-2xl font-black text-white">I</span>
        </div>
        <p className="text-xs text-slate-400 tracking-wider font-medium uppercase animate-pulse">
          Loading Inkloom Brand Governance...
        </p>
      </div>
    );
  }

  if (!isAuthenticated && !isPublicRoute) {
    // If not authenticated and on main route, display landing/login page without sidebar/header
    return <main className="min-h-screen bg-slate-950">{children}</main>;
  }

  if (isPublicRoute && !isAuthenticated) {
    return <main className="min-h-screen bg-slate-950">{children}</main>;
  }

  return (
    <div className="min-h-screen flex w-full bg-slate-950 text-slate-100">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <Header />
        <main className="flex-1 p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
