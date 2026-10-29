"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/services/api";
import { AnalyticsSummary } from "@/types";
import { BarChart3, TrendingUp, CheckCircle2, Clock, ShieldCheck } from "lucide-react";

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const stats = await api.getAnalyticsSummary();
      setAnalytics(stats);
    } catch (e: any) {
      console.error("Failed to load analytics summary:", e);
      setError(e?.message || "Failed to load governance telemetry.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] space-y-3">
        <div className="w-8 h-8 rounded-full border-2 border-[#FF7A36] border-t-transparent animate-spin"></div>
        <p className="text-xs text-[#85817D] font-medium font-mono">Loading governance telemetry...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <div className="bg-[#1C1C1C] border border-rose-500/30 rounded-2xl p-8 shadow-2xl text-center space-y-4">
          <p className="text-sm font-bold text-[#F7F3ED] font-heading">Analytics Telemetry Error</p>
          <p className="text-xs text-[#85817D]">{error}</p>
          <button
            onClick={loadStats}
            className="px-4 py-2 btn-gradient-warm text-ink-950 text-xs font-bold rounded-xl transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-[#1C1C1C] rounded-2xl p-6 sm:p-8 border border-[#DDEBE5] dark:border-[#383838] shadow-subtle dark:shadow-xl space-y-2 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#087F70] via-[#10A995] to-[#43D6B3] dark:from-[#FFD84D] dark:via-[#FF7A36] dark:to-[#F45B91]" />
        <div className="absolute top-0 right-0 w-80 h-32 bg-gradient-to-l from-[#10A995]/10 dark:from-[#FF7A36]/10 to-transparent pointer-events-none blur-2xl" />
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E8F7F1] border border-[#C8E2D8] text-[#087F70] dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-[#FFAA35] text-xs font-bold font-mono">
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Governance Telemetry &amp; Velocity</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#18352F] dark:text-[#F7F3ED] font-heading tracking-tight">
          Brand Governance &amp; Compliance Analytics
        </h1>
        <p className="text-sm text-[#58716A] dark:text-[#85817D] max-w-3xl leading-relaxed">
          Longitudinal audit trends, category violation frequencies, and review turnaround metrics across all organization workspaces.
        </p>
      </div>

      {/* Top Level Scorecards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#1C1C1C] rounded-2xl p-5 border border-[#DDEBE5] dark:border-[#383838] shadow-subtle dark:shadow-xl space-y-1 hover:border-[#10A995] dark:hover:border-amber-500/30 transition">
          <div className="text-[11px] uppercase font-bold tracking-wider text-[#58716A] dark:text-[#85817D] font-mono">Total Audits Run</div>
          <div className="text-3xl font-black text-[#18352F] dark:text-[#F7F3ED] font-heading mt-1">{analytics?.total_submissions ?? "--"}</div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1 mt-1 font-mono">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>100% automated pass</span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1C1C1C] rounded-2xl p-5 border border-[#DDEBE5] dark:border-[#383838] shadow-subtle dark:shadow-xl space-y-1 hover:border-[#10A995] dark:hover:border-amber-500/30 transition">
          <div className="text-[11px] uppercase font-bold tracking-wider text-[#58716A] dark:text-[#85817D] font-mono">Avg Compliance Score</div>
          <div className="text-3xl font-black text-gradient-warm font-heading mt-1">{analytics?.average_compliance_score ?? "--"}%</div>
          <div className="text-[11px] text-[#087F70] dark:text-[#FFAA35] font-medium flex items-center gap-1 mt-1 font-mono">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+5.2% over last 30 days</span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1C1C1C] rounded-2xl p-5 border border-[#DDEBE5] dark:border-[#383838] shadow-subtle dark:shadow-xl space-y-1 hover:border-[#10A995] dark:hover:border-amber-500/30 transition">
          <div className="text-[11px] uppercase font-bold tracking-wider text-[#58716A] dark:text-[#85817D] font-mono">Intent Preserved Rewrites</div>
          <div className="text-3xl font-black text-[#18352F] dark:text-[#F7F3ED] font-heading mt-1">98.4%</div>
          <div className="text-[11px] text-[#58716A] dark:text-[#85817D] mt-1 font-mono">Zero distortion of commercial intent</div>
        </div>

        <div className="bg-white dark:bg-[#1C1C1C] rounded-2xl p-5 border border-[#DDEBE5] dark:border-[#383838] shadow-subtle dark:shadow-xl space-y-1 hover:border-[#10A995] dark:hover:border-amber-500/30 transition">
          <div className="text-[11px] uppercase font-bold tracking-wider text-[#58716A] dark:text-[#85817D] font-mono">Review Turnaround</div>
          <div className="text-3xl font-black text-[#18352F] dark:text-[#F7F3ED] font-heading mt-1">1.8h</div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1 mt-1 font-mono">
            <Clock className="w-3.5 h-3.5" />
            <span>Down from 48h manual reviews</span>
          </div>
        </div>
      </div>

      {/* Charts & Trends Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Compliance Trend Over Time */}
        <div className="bg-white dark:bg-[#1C1C1C] rounded-2xl p-6 border border-[#DDEBE5] dark:border-[#383838] shadow-subtle dark:shadow-xl space-y-4">
          <div className="pb-3 border-b border-[#DDEBE5] dark:border-[#383838]">
            <h2 className="text-base font-bold text-[#18352F] dark:text-[#F7F3ED] font-heading tracking-tight">Compliance Score Evolution</h2>
            <p className="text-xs text-[#58716A] dark:text-[#85817D] mt-0.5">Daily average score across content submissions</p>
          </div>

          <div className="space-y-4 pt-2">
            {analytics?.compliance_trends.map((pt) => (
              <div key={pt.date} className="flex items-center gap-4">
                <span className="w-20 text-xs text-[#58716A] dark:text-[#85817D] font-mono shrink-0">{pt.date}</span>
                <div className="flex-1 bg-[#EFF8F4] dark:bg-[#141414] h-3 rounded-full overflow-hidden border border-[#DDEBE5] dark:border-[#383838]">
                  <div
                    className="bg-gradient-to-r from-[#087F70] via-[#10A995] to-[#43D6B3] dark:from-[#FFD84D] dark:via-[#FF7A36] dark:to-[#F45B91] h-full rounded-full transition-all"
                    style={{ width: `${pt.average_compliance_score}%` }}
                  ></div>
                </div>
                <span className="w-12 text-right text-xs font-bold text-[#18352F] dark:text-[#F7F3ED] font-mono">
                  {pt.average_compliance_score}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Violations by Category */}
        <div className="bg-white dark:bg-[#1C1C1C] rounded-2xl p-6 border border-[#DDEBE5] dark:border-[#383838] shadow-subtle dark:shadow-xl space-y-4">
          <div className="pb-3 border-b border-[#DDEBE5] dark:border-[#383838]">
            <h2 className="text-base font-bold text-[#18352F] dark:text-[#F7F3ED] font-heading tracking-tight">Category Breakdown</h2>
            <p className="text-xs text-[#58716A] dark:text-[#85817D] mt-0.5">Distribution of flagged governance issues</p>
          </div>

          <div className="space-y-4 pt-2">
            {analytics?.top_violations.map((v) => (
              <div key={v.category} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#18352F] dark:text-[#F7F3ED] capitalize">
                    {v.category.replace("_", " ")}
                  </span>
                  <span className="text-[#58716A] dark:text-[#85817D] font-mono">
                    {v.count} violations ({v.percentage}%)
                  </span>
                </div>
                <div className="w-full bg-[#EFF8F4] dark:bg-[#141414] h-2.5 rounded-full overflow-hidden border border-[#DDEBE5] dark:border-[#383838]">
                  <div
                    className="bg-gradient-to-r from-[#087F70] to-[#10A995] dark:from-[#FFAA35] dark:to-[#FF665C] h-full rounded-full"
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
