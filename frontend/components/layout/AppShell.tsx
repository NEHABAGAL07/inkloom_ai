"use client";

import React from "react";
import { useAuth } from "@/services/auth-context";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { usePathname } from "next/navigation";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const pathname = usePathname();

  // Public routes that don't require the dashboard shell or auth
  const isPublicRoute =
    pathname?.startsWith("/invite") ||
    pathname === "/login" ||
    pathname === "/signin";

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

  // Public route or landing page (/)
  if (!isAuthenticated && (isPublicRoute || pathname === "/")) {
    return <main className="min-h-screen bg-slate-950">{children}</main>;
  }

  // If unauthenticated on a protected subroute, provide clean login prompt with redirect
  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="max-w-md w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl text-center z-10 space-y-5">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <span className="text-2xl font-black text-white">🔒</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Authentication Required</h2>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              You must be signed in with an authorized employee or administrator account to access this enterprise workspace.
            </p>
          </div>
          <div className="pt-2 flex flex-col gap-2.5">
            <a
              href={`/login?redirect=${encodeURIComponent(pathname || "/")}`}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2"
            >
              <span>🔑</span> Go to Login Page
            </a>
            <a
              href="/"
              className="w-full py-2.5 px-4 bg-slate-950 hover:bg-slate-800 text-slate-300 font-semibold rounded-xl text-xs transition border border-slate-800"
            >
              Back to Inkloom Home
            </a>
          </div>
        </div>
      </main>
    );
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
