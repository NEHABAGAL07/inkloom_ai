import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api/client';
import { AnalyticsOverview, ContentItem, AuditResult } from '../types';
import { PageHeader } from '../components/ui/PageHeader';
import { MetricCard } from '../components/ui/MetricCard';
import { StatusBadge } from '../components/ui/StatusBadge';
import { LoadingState } from '../components/ui/LoadingState';
import { ErrorState } from '../components/ui/ErrorState';
import { formatDate } from '../lib/utils/formatters';
import {
  FileText,
  ShieldCheck,
  Clock,
  AlertOctagon,
  PlusCircle,
  ArrowRight,
  TrendingUp,
  FileCheck2,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);
  const [recentContent, setRecentContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [analyticsData, contentData] = await Promise.all([
        api.getAnalytics(),
        api.getContentList(),
      ]);
      setAnalytics(analyticsData);
      setRecentContent(contentData.slice(0, 5));
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  if (loading) return <LoadingState message="Connecting to brand governance engine..." />;
  if (error) return <ErrorState message={error} onRetry={loadDashboardData} />;

  const pendingReviewCount = recentContent.filter((c) => c.status === 'pending_approval').length;
  const criticalFindings = analytics?.findings_by_severity.critical || 0;
  const highFindings = analytics?.findings_by_severity.high || 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <PageHeader
        title="Brand Governance Overview"
        description="Monitor omni-channel marketing compliance, automated audit results, and reviewer signoffs."
        actions={
          <Link
            to="/audit/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-medium text-sm shadow-lg shadow-brand-600/20 transition-all hover:translate-y-[-1px]"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Content Audit</span>
          </Link>
        }
      />

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Content Submissions"
          value={analytics?.total_content_items ?? 0}
          subtitle="Managed marketing drafts"
          icon={<FileText className="w-5 h-5" />}
        />
        <MetricCard
          title="Audits Completed"
          value={analytics?.total_audits ?? 0}
          subtitle="AI & rules evaluations"
          icon={<ShieldCheck className="w-5 h-5" />}
        />
        <MetricCard
          title="Awaiting Review"
          value={analytics?.changes_requested_count ?? pendingReviewCount}
          subtitle="Ready for human signoff"
          icon={<Clock className="w-5 h-5 text-amber-400" />}
        />
        <MetricCard
          title="Compliance Rate"
          value={`${analytics?.compliance_rate ? Math.round(analytics.compliance_rate) : 100}%`}
          subtitle="Certified policy adherence"
          icon={<TrendingUp className="w-5 h-5 text-emerald-400" />}
        />
      </div>

      {/* Split Grid: Recent Activity & Findings Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Submissions */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-6 border border-slate-800">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-base font-semibold text-white">Recent Marketing Content</h2>
              <p className="text-xs text-slate-400">Latest items submitted for brand auditing</p>
            </div>
            <Link
              to="/content"
              className="text-xs text-brand-400 hover:text-brand-300 font-medium inline-flex items-center gap-1"
            >
              <span>View Library</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-800/60 mt-2">
            {recentContent.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-500">
                No content items submitted yet. Create your first audit above!
              </div>
            ) : (
              recentContent.map((item) => (
                <div key={item.content_id} className="py-3.5 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <Link
                      to={`/content/${item.content_id}`}
                      className="text-sm font-semibold text-white hover:text-brand-300 transition-colors truncate block"
                    >
                      {item.title}
                    </Link>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                      <span className="font-mono bg-slate-900 px-1.5 py-0.2 rounded border border-slate-800">
                        v{item.current_revision}
                      </span>
                      <span>•</span>
                      <span>{formatDate(item.updated_at || item.created_at)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <StatusBadge status={item.status} />
                    <Link
                      to={`/audits?contentId=${item.content_id}`}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-brand-300 hover:bg-slate-800 transition-colors"
                      title="Inspect Audit Findings"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Severity Breakdown */}
        <div className="glass-card rounded-2xl p-6 border border-slate-800 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-semibold text-white">Findings by Severity</h2>
            <p className="text-xs text-slate-400">Policy violations identified across content</p>

            <div className="mt-5 space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-rose-950/30 border border-rose-900/40">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span className="text-xs font-semibold text-rose-300">Critical Severity</span>
                </div>
                <span className="text-sm font-bold text-rose-200">
                  {analytics?.findings_by_severity.critical || 0}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-orange-950/30 border border-orange-900/40">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                  <span className="text-xs font-semibold text-orange-300">High Severity</span>
                </div>
                <span className="text-sm font-bold text-orange-200">
                  {analytics?.findings_by_severity.high || 0}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-amber-950/30 border border-amber-900/40">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span className="text-xs font-semibold text-amber-300">Medium Severity</span>
                </div>
                <span className="text-sm font-bold text-amber-200">
                  {analytics?.findings_by_severity.medium || 0}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-sky-950/30 border border-sky-900/40">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                  <span className="text-xs font-semibold text-sky-300">Low Severity</span>
                </div>
                <span className="text-sm font-bold text-sky-200">
                  {analytics?.findings_by_severity.low || 0}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800">
            <Link
              to="/reviews"
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs flex items-center justify-center gap-2 transition-colors border border-slate-700"
            >
              <FileCheck2 className="w-4 h-4 text-brand-400" />
              <span>Go to Review Workspace</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
