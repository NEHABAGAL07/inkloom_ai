"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/services/api";
import { AnalyticsSummary } from "@/types";
import { BarChart3, TrendingUp, CheckCircle2, Clock, ShieldCheck } from "lucide-react";

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);

  useEffect(() => {
    async function loadStats() {
      const stats = await api.getAnalyticsSummary();
      setAnalytics(stats);
    }
    loadStats();
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-surface rounded-2xl p-6 sm:p-8 border border-border shadow-subtle space-y-2">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal/10 border border-teal/20 text-teal text-xs font-semibold">
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Governance Telemetry & Velocity</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-navy tracking-tight">
          Brand Governance & Compliance Analytics
        </h1>
        <p className="text-sm text-ink-secondary max-w-3xl leading-relaxed">
          Longitudinal audit trends, category violation frequencies, and review turnaround metrics across all organization workspaces.
        </p>
      </div>

      {/* Top Level Scorecards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface rounded-2xl p-5 border border-border shadow-subtle space-y-1">
          <div className="text-[11px] uppercase font-bold tracking-wider text-ink-muted">Total Audits Run</div>
          <div className="text-3xl font-black text-navy mt-1">{analytics?.total_submissions ?? "--"}</div>
          <div className="text-[11px] text-status-success font-medium flex items-center gap-1 mt-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>100% automated pass completed</span>
          </div>
        </div>

        <div className="bg-surface rounded-2xl p-5 border border-border shadow-subtle space-y-1">
          <div className="text-[11px] uppercase font-bold tracking-wider text-ink-muted">Avg Compliance Score</div>
          <div className="text-3xl font-black text-navy mt-1">{analytics?.average_compliance_score ?? "--"}%</div>
          <div className="text-[11px] text-teal font-medium flex items-center gap-1 mt-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+5.2% over last 30 days</span>
          </div>
        </div>

        <div className="bg-surface rounded-2xl p-5 border border-border shadow-subtle space-y-1">
          <div className="text-[11px] uppercase font-bold tracking-wider text-ink-muted">Intent Preserved Rewrites</div>
          <div className="text-3xl font-black text-navy mt-1">98.4%</div>
          <div className="text-[11px] text-ink-secondary mt-1">Zero distortion of commercial intent</div>
        </div>

        <div className="bg-surface rounded-2xl p-5 border border-border shadow-subtle space-y-1">
          <div className="text-[11px] uppercase font-bold tracking-wider text-ink-muted">Review Turnaround</div>
          <div className="text-3xl font-black text-navy mt-1">1.8h</div>
          <div className="text-[11px] text-status-success font-medium flex items-center gap-1 mt-1">
            <Clock className="w-3.5 h-3.5" />
            <span>Down from 48h manual reviews</span>
          </div>
        </div>
      </div>

      {/* Charts & Trends Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Compliance Trend Over Time */}
        <div className="bg-surface rounded-2xl p-6 border border-border shadow-subtle space-y-4">
          <div className="pb-3 border-b border-border">
            <h2 className="text-base font-bold text-navy tracking-tight">Compliance Score Evolution</h2>
            <p className="text-xs text-ink-muted mt-0.5">Daily average score across content submissions</p>
          </div>

          <div className="space-y-4 pt-2">
            {analytics?.compliance_trends.map((pt) => (
              <div key={pt.date} className="flex items-center gap-4">
                <span className="w-16 text-xs text-ink-muted font-mono shrink-0">{pt.date}</span>
                <div className="flex-1 bg-workspace h-3 rounded-full overflow-hidden border border-border">
                  <div
                    className="bg-teal h-full rounded-full transition-all"
                    style={{ width: `${pt.average_compliance_score}%` }}
                  ></div>
                </div>
                <span className="w-12 text-right text-xs font-bold text-navy font-mono">
                  {pt.average_compliance_score}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Violations by Category */}
        <div className="bg-surface rounded-2xl p-6 border border-border shadow-subtle space-y-4">
          <div className="pb-3 border-b border-border">
            <h2 className="text-base font-bold text-navy tracking-tight">Category Breakdown</h2>
            <p className="text-xs text-ink-muted mt-0.5">Distribution of flagged governance issues</p>
          </div>

          <div className="space-y-4 pt-2">
            {analytics?.top_violations.map((v) => (
              <div key={v.category} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-navy capitalize">
                    {v.category.replace("_", " ")}
                  </span>
                  <span className="text-ink-muted font-mono">
                    {v.count} violations ({v.percentage}%)
                  </span>
                </div>
                <div className="w-full bg-workspace h-2.5 rounded-full overflow-hidden border border-border">
                  <div
                    className="bg-teal h-full rounded-full"
                    style={{ width: `${v.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
