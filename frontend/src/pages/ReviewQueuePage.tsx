import React, { useEffect, useState } from 'react';
import { api } from '../lib/api/client';
import { ContentItem, ReviewAction, ReviewDecision } from '../types';
import { PageHeader } from '../components/ui/PageHeader';
import { ReviewQueueTable } from '../components/reviews/ReviewQueueTable';
import { ReviewDecisionModal } from '../components/reviews/ReviewDecisionModal';
import { LoadingState } from '../components/ui/LoadingState';
import { ErrorState } from '../components/ui/ErrorState';
import { EmptyState } from '../components/ui/EmptyState';
import { CheckSquare, CheckCircle2, Clock, Filter, AlertCircle } from 'lucide-react';

export const ReviewQueuePage: React.FC = () => {
  const [contentList, setContentList] = useState<ContentItem[]>([]);
  const [reviews, setReviews] = useState<ReviewDecision[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Review Modal State
  const [selectedItemForReview, setSelectedItemForReview] = useState<ContentItem | null>(null);
  const [viewFilter, setViewFilter] = useState<'pending' | 'all'>('pending');

  const loadReviewQueue = async () => {
    setLoading(true);
    setError(null);
    try {
      const [items, revs] = await Promise.all([
        api.getContentList(),
        api.getReviews(),
      ]);
      setContentList(items);
      setReviews(revs);
    } catch (err: any) {
      setError(err.message || 'Failed to load review queue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviewQueue();
  }, []);

  const handleDecisionSubmit = async (data: {
    content_id: string;
    revision_id: number;
    action: ReviewAction;
    comments: string;
  }) => {
    // Call backend API /reviews/{id}/decision
    await api.submitReviewDecision(data.content_id, {
      ...data,
      reviewer_id: 'brand-director-01',
    });
    // Refresh list
    await loadReviewQueue();
  };

  if (loading) return <LoadingState message="Loading reviewer governance workspace..." />;
  if (error) return <ErrorState message={error} onRetry={loadReviewQueue} />;

  const pendingItems = contentList.filter((c) => c.status === 'pending_approval');
  const displayedItems = viewFilter === 'pending' ? pendingItems : contentList;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title="Human Review & Compliance Signoff"
        description="Official approval queue for marketing assets after automated brand audits have concluded."
        actions={
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setViewFilter('pending')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                viewFilter === 'pending'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Pending Approval ({pendingItems.length})
            </button>
            <button
              onClick={() => setViewFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                viewFilter === 'all'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Items ({contentList.length})
            </button>
          </div>
        }
      />

      {/* Review Queue KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card rounded-xl p-4 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs uppercase font-semibold text-slate-400">Queue Depth</span>
            <div className="text-2xl font-bold text-amber-300 mt-1">{pendingItems.length}</div>
            <span className="text-[11px] text-slate-500">Awaiting human signoff</span>
          </div>
          <Clock className="w-8 h-8 text-amber-400/30" />
        </div>

        <div className="glass-card rounded-xl p-4 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs uppercase font-semibold text-slate-400">Approved Assets</span>
            <div className="text-2xl font-bold text-emerald-400 mt-1">
              {contentList.filter((c) => c.status === 'approved').length}
            </div>
            <span className="text-[11px] text-slate-500">Certified compliant</span>
          </div>
          <CheckCircle2 className="w-8 h-8 text-emerald-400/30" />
        </div>

        <div className="glass-card rounded-xl p-4 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs uppercase font-semibold text-slate-400">Changes / Rejected</span>
            <div className="text-2xl font-bold text-rose-400 mt-1">
              {contentList.filter((c) => c.status === 'changes_requested' || c.status === 'rejected').length}
            </div>
            <span className="text-[11px] text-slate-500">Returned to creator</span>
          </div>
          <AlertCircle className="w-8 h-8 text-rose-400/30" />
        </div>
      </div>

      {/* Main Review Queue Table */}
      {displayedItems.length === 0 ? (
        <EmptyState
          title="Review Queue is Clean"
          description={
            viewFilter === 'pending'
              ? 'No marketing items are currently awaiting review. Content will appear here when creators run audits.'
              : 'No content records found.'
          }
          icon={<CheckSquare className="w-7 h-7 text-emerald-400" />}
        />
      ) : (
        <ReviewQueueTable
          items={displayedItems}
          onOpenReview={(item) => setSelectedItemForReview(item)}
        />
      )}

      {/* Signoff Modal */}
      {selectedItemForReview && (
        <ReviewDecisionModal
          isOpen={true}
          contentId={selectedItemForReview.content_id}
          contentTitle={selectedItemForReview.title}
          revisionId={selectedItemForReview.current_revision}
          onClose={() => setSelectedItemForReview(null)}
          onSubmit={handleDecisionSubmit}
        />
      )}
    </div>
  );
};
