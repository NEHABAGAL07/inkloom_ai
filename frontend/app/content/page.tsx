"use client";

import React from "react";
import { SubmissionForm } from "@/components/content/SubmissionForm";
import { Send, CheckCircle2, Shield, FileText } from "lucide-react";

export default function ContentSubmissionPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="bg-surface rounded-2xl p-6 sm:p-8 border border-border shadow-subtle space-y-2">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal/10 border border-teal/20 text-teal text-xs font-semibold">
          <Send className="w-3.5 h-3.5" />
          <span>Brand Governance Audit Ingestion</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-navy tracking-tight">
          Submit Content for Governance Audit
        </h1>
        <p className="text-sm text-ink-secondary max-w-3xl leading-relaxed">
          Submit draft copy, press releases, documents (PDF/DOCX), or media assets for multi-dimensional brand guideline verification before marketing distribution.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form Area */}
        <div className="lg:col-span-2 bg-surface rounded-2xl p-6 border border-border shadow-subtle">
          <SubmissionForm />
        </div>

        {/* Helpful Sidebar Context */}
        <div className="space-y-4">
          <div className="bg-surface rounded-2xl p-5 border border-border shadow-subtle space-y-3">
            <h3 className="text-sm font-bold text-navy flex items-center gap-2">
              <FileText className="w-4 h-4 text-teal" />
              <span>Automated Verification Checks</span>
            </h3>
            <ul className="text-xs text-ink-secondary space-y-2.5 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-teal font-bold mt-0.5">•</span>
                <span><strong className="text-navy">Voice & Tone:</strong> Empowering, transparent, anti-FUD, respectful language.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-teal font-bold mt-0.5">•</span>
                <span><strong className="text-navy">Terminology:</strong> Deprecated legacy naming and trademark registration rules.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-teal font-bold mt-0.5">•</span>
                <span><strong className="text-navy">Claims Verification:</strong> Certified benchmark citations vs unverified marketing multipliers.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-teal font-bold mt-0.5">•</span>
                <span><strong className="text-navy">Visual Standards:</strong> WCAG contrast ratios and logo clear-space.</span>
              </li>
            </ul>
          </div>

          <div className="bg-surface rounded-2xl p-5 border border-border shadow-subtle text-xs text-ink-secondary space-y-2">
            <div className="flex items-center gap-2 text-navy font-bold">
              <Shield className="w-4 h-4 text-teal" />
              <span>Privacy & Tenant Isolation</span>
            </div>
            <p className="leading-relaxed">
              Your content is scoped strictly to your organization tenant. No proprietary copy is shared across tenants or used to train public third-party models.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
