"use client";

import React from "react";
import { FileQuestion, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-workspace text-ink-primary flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full bg-white dark:bg-surface border border-[#DDEBE5] dark:border-border rounded-2xl p-8 shadow-sm dark:shadow-card text-center space-y-5 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#087F70] via-[#10A995] to-[#43D6B3] dark:from-[#FF7A36] dark:via-[#FFAA35] dark:to-[#FFD84D]" />
        <div className="w-12 h-12 mx-auto rounded-xl bg-[#E8F7F1] dark:bg-teal/10 border border-[#C8E2D8] dark:border-teal/20 flex items-center justify-center text-[#087F70] dark:text-teal">
          <FileQuestion className="w-6 h-6" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-lg font-bold text-[#18352F] dark:text-navy">Page Not Found</h2>
          <p className="text-xs text-[#58716A] dark:text-ink-secondary leading-relaxed">
            The requested governance page or asset could not be found.
          </p>
        </div>
        <div className="pt-2">
          <a
            href="/"
            className="w-full py-2.5 px-4 btn-gradient-warm text-white dark:text-ink-950 font-semibold rounded-xl text-xs transition shadow-sm flex items-center justify-center gap-1.5"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Return to Workspace Overview</span>
          </a>
        </div>
      </div>
    </div>
  );
}
