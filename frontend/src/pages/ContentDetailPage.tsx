import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../lib/api/client';
import { ContentItem, ContentHistory, ReviewDecision } from '../types';
import { PageHeader } from '../components/ui/PageHeader';
import { StatusBadge } from '../components/ui/StatusBadge';
import { LoadingState } from '../components/ui/LoadingState';
import { ErrorState } from '../components/ui/ErrorState';
import { formatDate } from '../lib/utils/formatters';
import {
  History,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileText,
  FileEdit,
  ArrowLeft,
  User,
  Info,
} from 'lucide-react';

export const ContentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [content, setContent] = useState<ContentItem | null>(null);
  const [history, setHistory] = useState<ContentHistory | null>(null);
  const [reviews, setReviews] = useState<ReviewDecision[]>([]);
  const [selectedVersionNumber, setSelectedVersionNumber] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDetails = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [itemData, historyData, reviewsData] = await Promise.all([
        api.getContentById(id),
        api.getContentHistory(id),
        api.getContentReviews(id),
      ]);
      setContent(itemData);
      setHistory(historyData);
      setReviews(reviewsData);
      setSelectedVersionNumber(itemData.current_revision);
    } catch (err: any) {
      setError(err.message || 'Failed to retrieve content details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  if (loading) return <LoadingState message="Loading version history and review audit trails..." />;
  if (error || !content) return <ErrorState message={error || 'Content item not found'} onRetry={fetchDetails} />;

  const selectedVersion = history?.versions.find(
    (v) => v.version_number === selectedVersionNumber
  ) || {
    version_number: content.current_revision,
    text: content.raw_text || '',
    change_summary: 'Initial draft',
    created_at: content.created_at,
  };

  const versionReviews = reviews.filter((r) => r.revision_id === selectedVersionNumber);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <Link
          to="/content"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Content Library</span>
        </Link>

        <PageHeader
          title={content.title}
          description={`Content ID: ${content.content_id} • Modality: ${content.content_type}`}
          badge={<StatusBadge status={content.status} />}
          actions={
            <div className="flex items-center gap-2">
              <Link
                to={`/audits?contentId=${content.content_id}`}
                className="px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-medium text-xs shadow-md shadow-brand-600/20 transition-colors inline-flex items-center gap-1.5"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>View Latest Audit</span>
              </Link>
            </div>
          }
        />
      </div>

      {/* Governance Explanatory Callout */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 flex items-start gap-3">
        <Info className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-white block mb-0.5">Immutable Versioning Guarantee:</span>
          Each revision is stored as an immutable snapshot. Approvals and change requests are strictly attached to the version that was inspected. Subsequent revisions automatically invalidate previous approvals and restart the governance review cycle.
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Version Navigator & Review Signoffs */}
        <div className="space-y-6">
          {/* Version Selector */}
          <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
                <History className="w-4 h-4 text-brand-400" />
                <span>Revisions Timeline</span>
              </h3>
              <span className="text-xs text-slate-400">
                {history?.versions.length || 1} Total Versions
              </span>
            </div>

            <div className="space-y-2">
              {history?.versions
                .slice()
                .reverse()
                .map((v) => (
                  <button
                    key={v.version_number}
                    onClick={() => setSelectedVersionNumber(v.version_number)}
                    className={`w-full text-left p-3 rounded-xl border transition-all text-xs flex items-center justify-between ${
                      selectedVersionNumber === v.version_number
                        ? 'border-brand-500 bg-brand-950/40 text-brand-200'
                        : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <div>
                      <div className="font-semibold flex items-center gap-1.5">
                        <span>Version {v.version_number}</span>
                        {v.version_number === content.current_revision && (
                          <span className="text-[10px] bg-brand-900/80 text-brand-300 px-1.5 py-0.2 rounded border border-brand-700">
                            Current
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500 block mt-0.5 truncate max-w-[170px]">
                        {v.change_summary || 'Marketing copy update'}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {formatDate(v.created_at)}
                    </span>
                  </button>
                ))}
            </div>
          </div>

          {/* Review Decision History for this Version */}
          <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-3">
            <h3 className="text-sm font-semibold text-white pb-3 border-b border-slate-800">
              Review Decisions (v{selectedVersionNumber})
            </h3>

            {versionReviews.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">
                No formal review decisions recorded yet for Version {selectedVersionNumber}.
              </p>
            ) : (
              <div className="space-y-3">
                {versionReviews.map((rev) => (
                  <div
                    key={rev.review_id}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold capitalize flex items-center gap-1 text-slate-200">
                        {rev.action === 'approved' ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        ) : rev.action === 'rejected' ? (
                          <XCircle className="w-3.5 h-3.5 text-rose-400" />
                        ) : (
                          <AlertTriangle className="w-3.5 h-3.5 text-orange-400" />
                        )}
                        <span>{rev.action.replace('_', ' ')}</span>
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {formatDate(rev.created_at)}
                      </span>
                    </div>

                    {rev.comments && (
                      <p className="text-xs text-slate-400 italic">"{rev.comments}"</p>
                    )}

                    <div className="flex items-center gap-1 text-[10px] text-slate-500 pt-1 border-t border-slate-800/60">
                      <User className="w-3 h-3" />
                      <span>Reviewer: {rev.reviewer_id || 'System Reviewer'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Content Body Viewer */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Snapshot Content Body
              </span>
              <h2 className="text-base font-bold text-white mt-0.5">
                Version {selectedVersion.version_number} Copy
              </h2>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              Saved on {formatDate(selectedVersion.created_at)}
            </span>
          </div>

          <div className="bg-slate-950 rounded-xl p-5 border border-slate-800/80 font-sans text-sm text-slate-200 leading-relaxed whitespace-pre-wrap min-h-[300px]">
            {selectedVersion.text || 'No text content in this revision.'}
          </div>

          <div className="pt-2 flex items-center justify-between text-xs text-slate-400">
            <span>Change Description: <em>{selectedVersion.change_summary || 'Standard update'}</em></span>
            <Link
              to={`/audits?contentId=${content.content_id}`}
              className="text-brand-400 hover:text-brand-300 font-medium inline-flex items-center gap-1"
            >
              <span>Examine Audit Findings</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
