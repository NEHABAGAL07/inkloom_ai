"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/services/auth-context";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { usePathname } from "next/navigation";
import { Lock, ArrowRight, Home, AlertTriangle, RefreshCw, ServerOff } from "lucide-react";

import { InkloomLoadingScreen } from "./InkloomLoadingScreen";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, backendError, retryAuth } = useAuth();
  const pathname = usePathname();
  const [isRetrying, setIsRetrying] = useState(false);
  const [showSlowWarning, setShowSlowWarning] = useState(false);

  // Detect slow loading after 6 seconds to prevent unrecoverable infinite spinner
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isLoading) {
      timer = setTimeout(() => {
        setShowSlowWarning(true);
      }, 6000);
    } else {
      setShowSlowWarning(false);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isLoading]);

  // Public routes that don't require the dashboard shell or auth
  const isPublicRoute =
    pathname?.startsWith("/invite") ||
    pathname === "/login" ||
    pathname === "/signin" ||
    pathname === "/register" ||
    pathname === "/demo";

  // Public routes render immediately without being blocked by background auth verification
  if (isPublicRoute) {
    return <main className="min-h-screen bg-workspace text-ink-primary">{children}</main>;
  }

  // Handle backend connection error / service unavailable
  if (backendError && !isAuthenticated) {
    return (
      <main className="min-h-screen bg-workspace flex flex-col items-center justify-center p-6 text-ink-primary">
        <div className="max-w-md w-full bg-surface border border-rose-200 dark:border-rose-900/50 rounded-2xl p-8 shadow-card text-center space-y-5">
          <div className="w-12 h-12 mx-auto rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-center justify-center text-rose-600">
            <ServerOff className="w-6 h-6 text-rose-600 dark:text-rose-400" />
          </div>
          <div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 uppercase tracking-wider">
              Service Unavailable
            </span>
            <h2 className="text-xl font-bold text-navy mt-2 tracking-tight">
              Governance Service Disconnected
            </h2>
            <p className="text-xs text-ink-secondary mt-2 leading-relaxed">
              Unable to reach the Inkloom AI brand governance backend API at{" "}
              <code className="px-1.5 py-0.5 bg-workspace rounded border border-border font-mono text-[11px] text-teal">
                http://localhost:8000
              </code>
              .
            </p>
            <p className="text-[11px] text-ink-muted mt-2">
              Please verify that the backend server is running (<code className="font-mono">uvicorn app.main:app --reload</code>) and retry.
            </p>
          </div>
          <div className="pt-2 flex flex-col gap-2.5">
            <button
              type="button"
              disabled={isRetrying}
              onClick={async () => {
                setIsRetrying(true);
                try {
                  await retryAuth();
                } finally {
                  setIsRetrying(false);
                }
              }}
              className="w-full py-2.5 px-4 bg-teal hover:bg-teal-hover disabled:opacity-60 text-white font-semibold rounded-lg text-xs transition shadow-sm flex items-center justify-center gap-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? "animate-spin" : ""}`} />
              <span>{isRetrying ? "Checking Connection..." : "Retry Connection"}</span>
            </button>
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

  // Branded initial loading state
  if (isLoading) {
    return <InkloomLoadingScreen onRetry={retryAuth} showSlowWarning={showSlowWarning} />;
  }

  // Public Landing page (/) for unauthenticated visitors
  if (!isAuthenticated && pathname === "/") {
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
