"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/services/api";
import { AnalyticsSummary } from "@/types";

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
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">Brand Governance & Compliance Analytics</h1>
        <p className="text-sm text-slate-400 mt-1">
          Longitudinal trends, category violation frequencies, and review velocity across all organization teams.
        </p>
      </div>

      {/* Top Level Scorecards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel rounded-2xl p-5 border border-slate-800">
          <div className="text-xs uppercase font-bold text-slate-400">Total Audits Run</div>
          <div className="text-3xl font-black text-white mt-1">{analytics?.total_submissions ?? "--"}</div>
          <div className="text-[11px] text-emerald-400 mt-1">100% automated pass completed</div>
        </div>

        <div className="glass-panel rounded-2xl p-5 border border-slate-800">
          <div className="text-xs uppercase font-bold text-slate-400">Avg Compliance Score</div>
          <div className="text-3xl font-black text-indigo-400 mt-1">{analytics?.average_compliance_score ?? "--"}%</div>
          <div className="text-[11px] text-slate-400 mt-1">↑ +5.2% over last 30 days</div>
        </div>

        <div className="glass-panel rounded-2xl p-5 border border-slate-800">
          <div className="text-xs uppercase font-bold text-slate-400">Intent Preserved Rewrites</div>
          <div className="text-3xl font-black text-emerald-400 mt-1">98.4%</div>
          <div className="text-[11px] text-slate-400 mt-1">Zero distortion of marketing intent</div>
        </div>

        <div className="glass-panel rounded-2xl p-5 border border-slate-800">
          <div className="text-xs uppercase font-bold text-slate-400">Review Turnaround</div>
          <div className="text-3xl font-black text-sky-400 mt-1">1.8h</div>
          <div className="text-[11px] text-slate-400 mt-1">Down from 48h manual reviews</div>
        </div>
      </div>

      {/* Charts & Trends Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Compliance Trend Over Time */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">Compliance Score Evolution</h2>
            <p className="text-xs text-slate-400">Daily average score across content submissions</p>
          </div>

          <div className="space-y-4 pt-4">
            {analytics?.compliance_trends.map((pt) => (
              <div key={pt.date} className="flex items-center gap-4">
                <span className="w-16 text-xs text-slate-400 font-mono shrink-0">{pt.date}</span>
                <div className="flex-1 bg-slate-900 h-3 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="bg-gradient-to-r from-indigo-500 to-sky-400 h-full rounded-full transition-all"
                    style={{ width: `${pt.average_compliance_score}%` }}
                  ></div>
                </div>
                <span className="w-12 text-right text-xs font-bold text-slate-200 font-mono">
                  {pt.average_compliance_score}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Violations by Category */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">Category Breakdown</h2>
            <p className="text-xs text-slate-400">Distribution of flagged governance issues</p>
          </div>

          <div className="space-y-4 pt-4">
            {analytics?.top_violations.map((v) => (
              <div key={v.category} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-200 capitalize">
                    {v.category.replace("_", " ")}
                  </span>
                  <span className="text-slate-400 font-mono">
                    {v.count} violations ({v.percentage}%)
                  </span>
                </div>
                <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="bg-indigo-500 h-full rounded-full"
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
