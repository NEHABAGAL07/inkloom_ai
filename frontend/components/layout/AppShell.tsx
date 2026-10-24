"use client";

import React from "react";
import { useAuth } from "@/services/auth-context";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { usePathname } from "next/navigation";
import { Lock, ArrowRight, Home } from "lucide-react";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const pathname = usePathname();

  // Public routes that don't require the dashboard shell or auth
  const isPublicRoute =
    pathname?.startsWith("/invite") ||
    pathname === "/login" ||
    pathname === "/signin" ||
    pathname === "/register" ||
    pathname === "/demo";

  if (isLoading) {
    return (
      <div className="min-h-screen bg-workspace flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-navy flex items-center justify-center shadow-subtle border border-border">
          <span className="text-xl font-black text-white">I</span>
        </div>
        <p className="text-xs text-ink-secondary tracking-wider font-semibold uppercase animate-pulse">
          Loading Inkloom Brand Governance...
        </p>
      </div>
    );
  }

  // Public route or landing page (/)
  if (!isAuthenticated && (isPublicRoute || pathname === "/")) {
    return <main className="min-h-screen bg-workspace text-ink-primary">{children}</main>;
  }

  // If unauthenticated on a protected subroute, provide clean login prompt with redirect
  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-workspace flex flex-col items-center justify-center p-6 text-ink-primary">
        <div className="max-w-md w-full bg-surface border border-border rounded-2xl p-8 shadow-card text-center space-y-5">
          <div className="w-12 h-12 mx-auto rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal">
            <Lock className="w-6 h-6 text-teal" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-ink-primary tracking-tight">Authentication Required</h2>
            <p className="text-xs text-ink-secondary mt-2 leading-relaxed">
              Please sign in with your enterprise credentials to access this brand governance workspace.
            </p>
          </div>
          <div className="pt-2 flex flex-col gap-2.5">
            <a
              href={`/login?redirect=${encodeURIComponent(pathname || "/")}`}
              className="w-full py-2.5 px-4 bg-teal hover:bg-teal-hover text-white font-semibold rounded-lg text-xs transition shadow-sm flex items-center justify-center gap-2"
            >
              <span>Sign In to Continue</span>
              <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href="/"
              className="w-full py-2 px-4 bg-surface hover:bg-workspace text-ink-secondary font-medium rounded-lg text-xs transition border border-border flex items-center justify-center gap-1.5"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Back to Overview</span>
            </a>
          </div>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen flex w-full bg-workspace text-ink-primary antialiased">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <Header />
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto bg-workspace">{children}</main>
      </div>
    </div>
  );
}
