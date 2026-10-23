"use client";

import React, { useState } from "react";
import { ContentSubmission, AuditResult } from "@/types";
import { api } from "@/services/api";
import { useAuth } from "@/services/auth-context";

interface MarketingDashboardProps {
  submissions: ContentSubmission[];
  onRefresh: () => void;
}

export function MarketingDashboard({ submissions, onRefresh }: MarketingDashboardProps) {
  const { activeOrgName } = useAuth();
  const [quickTitle, setQuickTitle] = useState("");
  const [quickText, setQuickText] = useState("");
  const [isAuditing, setIsAuditing] = useState(false);
  const [liveAuditResult, setLiveAuditResult] = useState<AuditResult | null>(null);

  const handleQuickSubmitAndAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle || !quickText) return;
    setIsAuditing(true);
    setLiveAuditResult(null);
    try {
      const sub = await api.createSubmission({
        title: quickTitle,
        description: "Direct Marketing Campaign draft",
        content_type: "text",
        initial_text: quickText,
      });

      const audit = await api.triggerAudit(sub.id, sub.current_revision_id);
      setLiveAuditResult(audit);
      onRefresh();
    } catch (err: any) {
      alert(err.message || "Audit submission failed");
    } finally {
      setIsAuditing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-emerald-950/80 text-emerald-300 border-emerald-800/80";
      case "pending_approval":
        return "bg-indigo-950/80 text-indigo-300 border-indigo-800/80";
      case "changes_requested":
        return "bg-amber-950/80 text-amber-300 border-amber-800/80";
      case "rejected":
        return "bg-rose-950/80 text-rose-300 border-rose-800/80";
      default:
        return "bg-slate-800 text-slate-300 border-slate-700";
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Hero */}
      <div className="relative rounded-3xl overflow-hidden p-8 border border-amber-500/20 bg-gradient-to-r from-slate-900 via-amber-950/30 to-slate-900 shadow-2xl">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold">
            <span>📢 Marketing Campaign & Copy Studio</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight sm:text-4xl">
            {activeOrgName || "Enterprise"} Campaign Governance
          </h1>
          <p className="text-slate-300 text-sm leading-relaxed">
            Create high-converting copy with real-time AI brand governance. Instantly flag deprecated terminology, unverified claims, and overly aggressive tone before legal submission.
          </p>
          <div className="flex gap-3 pt-2">
            <a
              href="/content"
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2"
            >
              <span>✍️</span> Open Full Submission Studio
            </a>
            <a
              href="/audits"
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold rounded-xl transition-all"
            >
              Audit Explorer
            </a>
          </div>
        </div>
      </div>

      {/* Quick Interactive Copy Tester & AI Pre-Flight Audit */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>⚡</span> Live Campaign Copy & Pre-Flight Audit
            </h2>
            <span className="text-xs text-amber-400 font-bold bg-amber-950/80 border border-amber-800 px-2 py-0.5 rounded-full">
              Real-time Deterministic Rules
            </span>
          </div>

          <form onSubmit={handleQuickSubmitAndAudit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Campaign Title</label>
              <input
                type="text"
                required
                value={quickTitle}
                onChange={(e) => setQuickTitle(e.target.value)}
                placeholder="e.g. Q4 Global Product Announcement"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Marketing Copy / Text</label>
              <textarea
                required
                rows={5}
                value={quickText}
                onChange={(e) => setQuickText(e.target.value)}
                placeholder="Paste marketing copy here (try typing deprecated terms or absolute latency claims)..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setQuickTitle("HyperScale Edge Announcement 2026");
                  setQuickText(
                    "Get started with the powerful CloudSpeed Suite today.\nOur newest release lets organizations experience a guaranteed 10x reduction in latency across all regions.\nHurry up before your competitors crush you and steal your market share."
                  );
                }}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700"
              >
                Insert Sample with Violations
              </button>

              <button
                type="submit"
                disabled={isAuditing || !quickTitle || !quickText}
                className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-2"
              >
                {isAuditing ? "Auditing with AI Engine..." : "Run Pre-Flight AI Audit →"}
              </button>
            </div>
          </form>

          {/* Live Findings Display */}
          {liveAuditResult && (
            <div className="mt-4 p-4 rounded-2xl bg-slate-950 border border-amber-500/30 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-white">Pre-Flight Audit Complete</span>
                <span className="text-xs font-bold text-amber-400">
                  Compliance Score: {liveAuditResult.summary.compliance_score}/100
                </span>
              </div>
              <div className="space-y-2">
                {liveAuditResult.findings.map((f) => (
                  <div key={f.id} className="text-xs p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-300">{f.title}</span>
                      <span className="text-[10px] text-slate-400 uppercase">{f.category}</span>
                    </div>
                    <div className="text-slate-300">{f.message}</div>
                    {f.suggested_correction && (
                      <div className="text-emerald-400 font-semibold text-[11px]">
                        💡 Suggestion: {f.suggested_correction.replacement_text}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Campaign Submissions Tracker */}
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>📋</span> My Active Campaign Submissions
            </h2>
            <a href="/content" className="text-xs text-amber-400 font-semibold hover:text-amber-300">
              View All Submissions →
            </a>
          </div>

          <div className="divide-y divide-slate-800">
            {submissions.map((sub) => (
              <div key={sub.id} className="py-3.5 flex items-center justify-between hover:bg-slate-800/30 px-3 rounded-xl transition-all">
                <div className="space-y-1 pr-3">
                  <div className="text-sm font-bold text-white flex items-center gap-2">
                    <span>{sub.title}</span>
                    <span className="text-[10px] text-slate-400 uppercase px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700">
                      {sub.content_type}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 line-clamp-1">{sub.description}</div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-bold border capitalize ${getStatusBadge(sub.status)}`}>
                    {sub.status.replace("_", " ")}
                  </span>
                  <a
                    href="/audits"
                    className="text-xs px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition-all"
                  >
                    Audits
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
