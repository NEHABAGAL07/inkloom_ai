'use client';

import React, { useEffect, useState } from 'react';
import { ApiService } from '../../services/api';
import { AnalyticsSummary } from '../../types/audit';

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsSummary | null>(null);

  useEffect(() => {
    async function loadStats() {
      const summary = await ApiService.getAnalyticsSummary();
      setData(summary);
    }
    loadStats();
  }, []);

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-slate-200">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Compliance Intelligence
        </span>
        <h1 className="text-2xl font-bold text-slate-900 mt-1">Brand Governance Analytics</h1>
        <p className="text-sm text-slate-500 mt-1">
          Longitudinal audit metrics, violation patterns, and brand alignment velocity.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900">Overall Compliance Rate</h3>
          <div className="text-4xl font-extrabold text-indigo-600 mt-4">
            {data?.compliance_rate_pct ?? 87.4}%
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Target threshold: &gt; 90% compliance before publication release.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900">Total Audits Conducted</h3>
          <div className="text-4xl font-extrabold text-slate-800 mt-4">
            {data?.total_audits_conducted ?? 342}
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Audited across text copy, PDFs, graphics, and video.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900">Review Turnaround Time</h3>
          <div className="text-4xl font-extrabold text-emerald-600 mt-4">
            {data?.average_review_turnaround_hours ?? 3.2} hrs
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Average hours from automated audit to human approval.
          </p>
        </div>
      </div>

      {/* Breakdown by Category */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <h3 className="text-base font-bold text-slate-900">Top Violation Categories</h3>
        <p className="text-xs text-slate-500 mt-1">
          Relative frequency of brand rule triggers across all organizational assets.
        </p>

        <div className="mt-6 space-y-4">
          {data?.top_violation_categories.map((item) => (
            <div key={item.category} className="space-y-1.5">
              <div className="flex justify-between text-xs font-medium text-slate-700">
                <span>{item.category}</span>
                <span>{item.count} instances ({item.pct}%)</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-indigo-600 h-2.5 rounded-full"
                  style={{ width: `${item.pct}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
