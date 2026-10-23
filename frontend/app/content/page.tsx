"use client";

import React from "react";
import { SubmissionForm } from "@/components/content/SubmissionForm";

export default function ContentSubmissionPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">Submit Content for Brand Governance Audit</h1>
        <p className="text-sm text-slate-400 mt-1">
          Submit copy, press releases, documents (PDF/DOCX), or media assets for multi-dimensional brand guideline verification.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form Area */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-6 border border-slate-800">
          <SubmissionForm />
        </div>

        {/* Helpful Sidebar Context */}
        <div className="space-y-4">
          <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>📋</span> What We Check
            </h3>
            <ul className="text-xs text-slate-300 space-y-2 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-indigo-400 font-bold">•</span>
                <span><strong>Voice & Tone:</strong> Empowering, transparent, anti-FUD, respectful language.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-400 font-bold">•</span>
                <span><strong>Terminology:</strong> Deprecated legacy naming and trademark rules.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-400 font-bold">•</span>
                <span><strong>Claims Verification:</strong> Certified benchmark citations vs unverified marketing multipliers.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-400 font-bold">•</span>
                <span><strong>Visual Standards:</strong> WCAG contrast ratios and logo clear-space.</span>
              </li>
            </ul>
          </div>

          <div className="glass-panel rounded-2xl p-5 border border-slate-800 text-xs text-slate-400 space-y-2">
            <span className="font-bold text-slate-200 block">🔒 Privacy & Tenant Isolation</span>
            <p className="leading-relaxed">
              Your content is scoped strictly to your organization tenant. No proprietary copy is shared across tenants or used to train third-party public models.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
