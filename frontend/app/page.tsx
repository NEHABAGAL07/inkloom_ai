'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ApiService } from '../services/api';
import { AnalyticsSummary, ReviewQueueItem, AuditResult } from '../types/audit';

export default function DashboardPage() {
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [recentAudits, setRecentAudits] = useState<AuditResult[]>([]);
  const [reviewQueue, setReviewQueue] = useState<ReviewQueueItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [stats, audits, reviews] = await Promise.all([
          ApiService.getAnalyticsSummary(),
          ApiService.getRecentAudits(),
          ApiService.getReviewQueue(),
        ]);
        setAnalytics(stats);
        setRecentAudits(audits);
        setReviewQueue(reviews);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-2xl p-6 text-white shadow-md">
        <div>
          <span className="text-xs uppercase font-semibold text-indigo-300 tracking-wider">
            Brand Governance Overview
          </span>
          <h1 className="text-2xl font-bold mt-1">Acme Corp Brand Compliance Portal</h1>
          <p className="text-sm text-indigo-200 mt-1 max-w-xl">
            Automated brand guideline auditing, claim verification, and human-in-the-loop review workflows.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/content"
            className="px-5 py-2.5 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white font-medium text-sm transition-colors shadow-xs"
          >
            + Submit Content
          </Link>
          <Link
            href="/reviews"
            className="px-5 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium text-sm transition-colors backdrop-blur-xs"
          >
            Review Queue ({reviewQueue.filter((r) => r.requires_action).length})
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Compliance Rate</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-bold text-slate-900">{analytics?.compliance_rate_pct ?? 87.4}%</span>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">↑ 3.2%</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Measured against 48 active guidelines</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Audits</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-bold text-slate-900">{analytics?.total_audits_conducted ?? 342}</span>
            <span className="text-xs text-slate-400">Past 30 days</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Copy, documents, and visual assets</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pending Human Review</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-bold text-purple-700">{analytics?.pending_human_reviews ?? 8}</span>
            <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded">Awaiting sign-off</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Avg turnaround: {analytics?.average_review_turnaround_hours ?? 3.2} hrs</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Approved for Publishing</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-bold text-emerald-600">{analytics?.approved_this_month ?? 156}</span>
            <span className="text-xs text-slate-400">This month</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Passed human brand review</p>
        </div>
      </div>

      {/* Two Column Layout: Recent Audits & Review Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Audits */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">Recent Automated Audits</h2>
              <p className="text-xs text-slate-500">Live checks generated via deterministic rules & AI models</p>
            </div>
            <Link href="/audits" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800">
              View All Audits →
            </Link>
          </div>

          <div className="space-y-3">
            {recentAudits.map((audit) => (
              <div
                key={audit.audit_id}
                className="p-4 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 uppercase">
                      {audit.overall_status}
                    </span>
                    <span className="text-xs font-mono text-slate-400">{audit.audit_id.slice(0, 13)}...</span>
                  </div>
                  <p className="text-xs text-slate-700 mt-2 font-medium line-clamp-1">{audit.summary}</p>
                  <p className="text-[11px] text-slate-400 mt-1">{audit.findings.length} findings detected</p>
                </div>
                <Link
                  href="/audits"
                  className="px-3 py-1.5 rounded-md bg-white border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-100 shadow-2xs"
                >
                  Inspect
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Review Queue Preview */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">Pending Review Queue</h2>
              <p className="text-xs text-slate-500">Human sign-off required prior to release</p>
            </div>
            <Link href="/reviews" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800">
              Open Queue →
            </Link>
          </div>

          <div className="space-y-3">
            {reviewQueue.slice(0, 3).map((item) => (
              <div
                key={item.content_id}
                className="p-4 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors flex items-center justify-between"
              >
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">{item.title}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Author: {item.author_email}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs font-medium text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                      {item.workflow_status.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-slate-400">{item.findings_count} findings</span>
                  </div>
                </div>
                <Link
                  href="/reviews"
                  className="px-3 py-1.5 rounded-md bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700 shadow-2xs"
                >
                  Review
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
