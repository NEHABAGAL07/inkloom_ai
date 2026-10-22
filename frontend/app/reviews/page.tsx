'use client';

import React, { useEffect, useState } from 'react';
import { ApiService } from '../../services/api';
import { ReviewQueueItem } from '../../types/audit';
import { ReviewQueueTable } from '../../components/reviews/ReviewQueueTable';

export default function ReviewQueuePage() {
  const [items, setItems] = useState<ReviewQueueItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadQueue = async () => {
    try {
      const data = await ApiService.getReviewQueue();
      setItems(data);
    } catch (err) {
      console.error('Failed to load review queue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
  }, []);

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-slate-200">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Human-in-the-Loop Governance
        </span>
        <h1 className="text-2xl font-bold text-slate-900 mt-1">Review & Sign-Off Queue</h1>
        <p className="text-sm text-slate-500 mt-1">
          Review automated AI governance findings and grant official publication approvals or request author revisions.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <p className="text-xs text-slate-500">Pending Review</p>
          <p className="text-2xl font-bold text-purple-700 mt-1">
            {items.filter((i) => i.workflow_status === 'pending_approval').length}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <p className="text-xs text-slate-500">Changes Requested</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">
            {items.filter((i) => i.workflow_status === 'changes_requested').length}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <p className="text-xs text-slate-500">Approved Assets</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">
            {items.filter((i) => i.workflow_status === 'approved').length}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <p className="text-sm text-slate-500">Loading review queue...</p>
        </div>
      ) : (
        <ReviewQueueTable items={items} onRefresh={loadQueue} />
      )}
    </div>
  );
}
