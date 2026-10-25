"use client";

import React from "react";
import { FileQuestion, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-workspace text-ink-primary flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full bg-surface border border-border rounded-2xl p-8 shadow-card text-center space-y-5">
        <div className="w-12 h-12 mx-auto rounded-xl bg-teal/10 border border-teal/20 flex items-center justify-center text-teal">
          <FileQuestion className="w-6 h-6" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-lg font-bold text-navy">Page Not Found</h2>
          <p className="text-xs text-ink-secondary leading-relaxed">
            The requested governance page or asset could not be found.
          </p>
        </div>
        <div className="pt-2">
          <a
            href="/"
            className="w-full py-2.5 px-4 bg-teal hover:bg-teal-hover text-white font-semibold rounded-xl text-xs transition shadow-sm flex items-center justify-center gap-1.5"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Return to Workspace Overview</span>
          </a>
        </div>
      </div>
    </div>
  );
}
