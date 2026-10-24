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
      <div className="max-w-md w-full bg-surface border border-border rounded-2xl p-8 shadow-card text-center space-y-5">
        <div className="w-12 h-12 mx-auto rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-base font-bold text-ink-primary">
            Something went wrong
          </h2>
          <p className="text-xs text-ink-secondary leading-relaxed">
            An unexpected error occurred while rendering this view.
          </p>
          {error?.message && (
            <div className="mt-2 p-2.5 rounded-lg bg-workspace border border-border text-left">
              <p className="font-mono text-[11px] text-ink-muted break-words line-clamp-3">
                {error.message}
              </p>
            </div>
          )}
        </div>
        <div className="pt-2 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={() => reset()}
            className="w-full py-2.5 px-4 bg-teal hover:bg-teal-hover text-white font-semibold rounded-lg text-xs transition shadow-sm flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </button>
          <a
            href="/"
            className="w-full py-2 px-4 bg-surface hover:bg-workspace text-ink-secondary font-medium rounded-lg text-xs transition border border-border flex items-center justify-center gap-1.5"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Return to Overview</span>
          </a>
        </div>
      </div>
    </div>
  );
}
