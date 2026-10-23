import React, { useEffect, useState } from 'react';
import { api } from '../lib/api/client';
import { AnalyticsOverview, ContentItem } from '../types';
import { PageHeader } from '../components/ui/PageHeader';
import { MetricCard } from '../components/ui/MetricCard';
import { LoadingState } from '../components/ui/LoadingState';
import { ErrorState } from '../components/ui/ErrorState';
import {
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileCheck2,
  TrendingUp,
  Shield,
  Layers,
} from 'lucide-react';

export const AnalyticsPage: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);
  const [contentList, setContentList] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const [data, items] = await Promise.all([
        api.getAnalytics(),
        api.getContentList(),
      ]);
      setAnalytics(data);
      setContentList(items);
    } catch (err: any) {
      setError(err.message || 'Failed to calculate compliance analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) return <LoadingState message="Aggregating compliance analytics and review statistics..." />;
  if (error || !analytics) return <ErrorState message={error || 'No analytics data available'} onRetry={fetchAnalytics} />;

  const totalFindings =
    analytics.findings_by_severity.critical +
    analytics.findings_by_severity.high +
    analytics.findings_by_severity.medium +
    analytics.findings_by_severity.low;

  const totalDecisions =
    analytics.approved_count + analytics.changes_requested_count + analytics.rejected_count;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <PageHeader
        title="Brand Governance & Compliance Analytics"
        description="Real-time telemetry aggregated from stored audit findings, policy violations, and review outcomes."
      />

      {/* Primary KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Overall Compliance"
          value={`${Math.round(analytics.compliance_rate)}%`}
          subtitle="Enterprise guideline adherence"
          icon={<TrendingUp className="w-5 h-5 text-emerald-400" />}
        />
        <MetricCard
          title="Total Content Items"
          value={analytics.total_content_items}
          subtitle="Managed marketing drafts"
          icon={<Layers className="w-5 h-5 text-brand-400" />}
        />
        <MetricCard
          title="Total Audit Runs"
          value={analytics.total_audits}
          subtitle="Deterministic rules evaluations"
          icon={<Shield className="w-5 h-5 text-indigo-400" />}
        />
        <MetricCard
          title="Recorded Violations"
          value={totalFindings}
          subtitle="Across all historical audits"
          icon={<AlertTriangle className="w-5 h-5 text-amber-400" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Severity Distribution */}
        <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
          <div>
            <h2 className="text-base font-semibold text-white">Policy Infractions by Severity</h2>
            <p className="text-xs text-slate-400">Total violations detected across marketing drafts</p>
          </div>

          <div className="space-y-3.5 pt-2">
            {[
              {
                label: 'Critical Severity',
                count: analytics.findings_by_severity.critical,
                color: 'bg-rose-500',
                textColor: 'text-rose-400',
              },
              {
                label: 'High Severity',
                count: analytics.findings_by_severity.high,
                color: 'bg-orange-500',
                textColor: 'text-orange-400',
              },
              {
                label: 'Medium Severity',
                count: analytics.findings_by_severity.medium,
                color: 'bg-amber-500',
                textColor: 'text-amber-400',
              },
              {
                label: 'Low Severity',
                count: analytics.findings_by_severity.low,
                color: 'bg-sky-500',
                textColor: 'text-sky-400',
              },
            ].map((sev) => {
              const pct = totalFindings > 0 ? Math.round((sev.count / totalFindings) * 100) : 0;
              return (
                <div key={sev.label} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-300">{sev.label}</span>
                    <span className={`font-mono font-bold ${sev.textColor}`}>
                      {sev.count} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-900 overflow-hidden border border-slate-800">
                    <div
                      className={`h-full rounded-full ${sev.color} transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Review Signoff Distribution */}
        <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
          <div>
            <h2 className="text-base font-semibold text-white">Reviewer Signoff Outcomes</h2>
            <p className="text-xs text-slate-400">Decisions made on submitted marketing revisions</p>
          </div>

          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-900/40">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <div>
                  <span className="text-xs font-semibold text-white block">Approved for Publication</span>
                  <span className="text-[11px] text-slate-400">Certified by brand team</span>
                </div>
              </div>
              <span className="text-lg font-bold text-emerald-300">{analytics.approved_count}</span>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-amber-950/30 border border-amber-900/40">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <div>
                  <span className="text-xs font-semibold text-white block">Changes Requested</span>
                  <span className="text-[11px] text-slate-400">Returned for creator revision</span>
                </div>
              </div>
              <span className="text-lg font-bold text-amber-300">
                {analytics.changes_requested_count}
              </span>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-rose-950/30 border border-rose-900/40">
              <div className="flex items-center gap-3">
                <XCircle className="w-5 h-5 text-rose-400" />
                <div>
                  <span className="text-xs font-semibold text-white block">Rejected</span>
                  <span className="text-[11px] text-slate-400">Severe guideline infractions</span>
                </div>
              </div>
              <span className="text-lg font-bold text-rose-300">{analytics.rejected_count}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
