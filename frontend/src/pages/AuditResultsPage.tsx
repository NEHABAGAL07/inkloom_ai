import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../lib/api/client';
import { AuditResult, ContentItem, FindingCategory, SeverityLevel } from '../types';
import { PageHeader } from '../components/ui/PageHeader';
import { AuditSummaryCard } from '../components/audits/AuditSummaryCard';
import { FindingCard } from '../components/audits/FindingCard';
import { LoadingState } from '../components/ui/LoadingState';
import { ErrorState } from '../components/ui/ErrorState';
import { EmptyState } from '../components/ui/EmptyState';
import { StatusBadge } from '../components/ui/StatusBadge';
import {
  Filter,
  CheckCircle2,
  FileEdit,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  PlusCircle,
} from 'lucide-react';

export const AuditResultsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const contentId = searchParams.get('contentId');
  const auditId = searchParams.get('auditId');

  const [audit, setAudit] = useState<AuditResult | null>(null);
  const [content, setContent] = useState<ContentItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Revision Modal State
  const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false);
  const [revisionText, setRevisionText] = useState('');
  const [changeSummary, setChangeSummary] = useState('');
  const [isSubmittingRevision, setIsSubmittingRevision] = useState(false);

  const fetchAuditData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (auditId) {
        const auditData = await api.getAuditById(auditId);
        setAudit(auditData);
        if (auditData.content_id) {
          const contentData = await api.getContentById(auditData.content_id);
          setContent(contentData);
          setRevisionText(contentData.raw_text || '');
        }
      } else if (contentId) {
        const contentData = await api.getContentById(contentId);
        setContent(contentData);
        setRevisionText(contentData.raw_text || '');
        const auditData = await api.getAuditById(contentId);
        setAudit(auditData);
      } else {
        // Fallback: fetch most recent content item
        const list = await api.getContentList();
        if (list.length > 0) {
          const target = list[0];
          setContent(target);
          setRevisionText(target.raw_text || '');
          const auditData = await api.getAuditById(target.content_id);
          setAudit(auditData);
        } else {
          setAudit(null);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to retrieve audit findings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditData();
  }, [contentId, auditId]);

  const handleCreateRevision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content) return;
    setIsSubmittingRevision(true);
    try {
      // 1. Submit revision to produce a new version (which invalidates prior status)
      const updated = await api.submitRevision(content.content_id, {
        raw_text: revisionText,
        change_summary: changeSummary || 'Revised copy based on audit findings',
      });
      setContent(updated);

      // 2. Automatically rerun audit on the new revision
      const newAudit = await api.runAudit(updated.content_id, updated.current_revision);
      setAudit(newAudit);
      setIsRevisionModalOpen(false);
      setChangeSummary('');
    } catch (err: any) {
      alert(err.message || 'Failed to submit revision');
    } finally {
      setIsSubmittingRevision(false);
    }
  };

  if (loading) return <LoadingState message="Retrieving compliance audit records..." />;
  if (error) return <ErrorState message={error} onRetry={fetchAuditData} />;

  if (!audit) {
    return (
      <EmptyState
        title="No Audit Records Found"
        description="Select or submit marketing copy to view automated brand governance results."
        action={{
          label: 'Create New Content Audit',
          onClick: () => (window.location.href = '/audit/new'),
        }}
      />
    );
  }

  // Filter findings
  const filteredFindings = audit.findings.filter((f) => {
    if (selectedSeverity !== 'all' && f.severity !== selectedSeverity) return false;
    if (selectedCategory !== 'all' && f.category !== selectedCategory) return false;
    return true;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <PageHeader
        title={`Audit Report: ${content?.title || 'Marketing Content'}`}
        description={`Evaluated against brand standards • Version ${audit.content_version}`}
        badge={content && <StatusBadge status={content.status} />}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsRevisionModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-medium text-xs shadow-lg shadow-brand-600/20 transition-colors"
            >
              <FileEdit className="w-3.5 h-3.5" />
              <span>Revise & Rerun Audit</span>
            </button>
            <Link
              to="/reviews"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs border border-slate-700 transition-colors"
            >
              <span>Review Workspace</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        }
      />

      {/* Summary Score Card */}
      <AuditSummaryCard audit={audit} />

      {/* Findings Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-white">Detailed Policy Findings</h2>
            <span className="text-xs bg-slate-800 text-slate-300 font-medium px-2 py-0.5 rounded-full">
              {filteredFindings.length} of {audit.findings.length}
            </span>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <span>Filter:</span>
            </div>

            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-300 outline-none focus:border-brand-500"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-300 outline-none focus:border-brand-500 capitalize"
            >
              <option value="all">All Categories</option>
              <option value="terminology">Terminology</option>
              <option value="tone">Tone & Voice</option>
              <option value="factual_accuracy">Factual Accuracy</option>
              <option value="unsupported_claim">Unsupported Claim</option>
              <option value="accessibility">Accessibility</option>
              <option value="visual_consistency">Visual Consistency</option>
            </select>
          </div>
        </div>

        {filteredFindings.length === 0 ? (
          <div className="glass-card rounded-2xl p-10 text-center flex flex-col items-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mb-2" />
            <h3 className="text-sm font-semibold text-white">No Policy Violations in this Filter</h3>
            <p className="mt-1 text-xs text-slate-400">
              {audit.findings.length === 0
                ? 'Great job! Content passed all deterministic brand checks.'
                : 'Try adjusting your severity or category filter above.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredFindings.map((finding) => (
              <FindingCard key={finding.id} finding={finding} />
            ))}
          </div>
        )}
      </div>

      {/* Revision Modal */}
      {isRevisionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="glass-panel w-full max-w-2xl rounded-2xl p-6 shadow-2xl border border-slate-700 bg-slate-900/95 space-y-4">
            <div>
              <h2 className="text-lg font-bold text-white">Create Revision & Rerun Audit</h2>
              <p className="text-xs text-slate-400 mt-1">
                Editing creates Version {(content?.current_revision || 1) + 1}. Note: Creating a revision resets approval status to Draft.
              </p>
            </div>

            <form onSubmit={handleCreateRevision} className="space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                  Revision Marketing Copy
                </label>
                <textarea
                  rows={8}
                  value={revisionText}
                  onChange={(e) => setRevisionText(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 p-3 text-sm text-slate-200 outline-none focus:border-brand-500 font-sans"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                  Change Summary / Notes
                </label>
                <input
                  type="text"
                  value={changeSummary}
                  onChange={(e) => setChangeSummary(e.target.value)}
                  placeholder="e.g. Corrected brand casing and removed hyperbole"
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-xs text-slate-200 outline-none focus:border-brand-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRevisionModalOpen(false)}
                  disabled={isSubmittingRevision}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingRevision}
                  className="px-5 py-2 rounded-xl text-xs font-medium text-white bg-brand-600 hover:bg-brand-500 shadow-lg shadow-brand-600/25 transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSubmittingRevision ? 'animate-spin' : ''}`} />
                  <span>{isSubmittingRevision ? 'Saving & Auditing...' : 'Save Revision & Re-Audit'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
