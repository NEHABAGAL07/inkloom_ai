"use client";

import React, { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log unexpected runtime rendering errors
    console.error("Inkloom AI Application Error Boundary caught:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-workspace text-ink-primary flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full bg-white dark:bg-surface border border-[#DDEBE5] dark:border-border rounded-2xl p-8 shadow-sm dark:shadow-card text-center space-y-5 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#087F70] via-[#10A995] to-[#43D6B3] dark:from-[#FF7A36] dark:via-[#FFAA35] dark:to-[#FFD84D]" />
        <div className="w-12 h-12 mx-auto rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-base font-bold text-[#18352F] dark:text-ink-primary">
            Something went wrong
          </h2>
          <p className="text-xs text-[#58716A] dark:text-ink-secondary leading-relaxed">
            An unexpected error occurred while rendering this view.
          </p>
          {error?.message && (
            <div className="mt-2 p-2.5 rounded-lg bg-[#F7FBF9] dark:bg-workspace border border-[#DDEBE5] dark:border-border text-left">
              <p className="font-mono text-[11px] text-[#82948E] dark:text-ink-muted break-words line-clamp-3">
                {error.message}
              </p>
            </div>
          )}
        </div>
        <div className="pt-2 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={() => reset()}
            className="w-full py-2.5 px-4 btn-gradient-warm text-white dark:text-ink-950 font-semibold rounded-xl text-xs transition shadow-sm flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </button>
          <a
            href="/"
            className="w-full py-2 px-4 bg-white dark:bg-surface hover:bg-[#F7FBF9] dark:hover:bg-workspace text-[#58716A] dark:text-ink-secondary font-medium rounded-xl text-xs transition border border-[#DDEBE5] dark:border-border flex items-center justify-center gap-1.5"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Return to Overview</span>
          </a>
        </div>
      </div>
    </div>
  );
}
