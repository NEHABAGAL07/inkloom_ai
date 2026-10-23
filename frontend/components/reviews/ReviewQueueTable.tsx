'use client';

import React, { useState } from 'react';
import { ReviewQueueItem } from '../../types/audit';
import { ReviewDecisionModal } from './ReviewDecisionModal';
import { ApiService } from '../../services/api';

interface ReviewQueueTableProps {
  items: ReviewQueueItem[];
  onRefresh?: () => void;
}

export const ReviewQueueTable: React.FC<ReviewQueueTableProps> = ({ items, onRefresh }) => {
  const [selectedItem, setSelectedItem] = useState<ReviewQueueItem | null>(null);
  const [queueItems, setQueueItems] = useState<ReviewQueueItem[]>(items);

  const handleOpenDecision = (item: ReviewQueueItem) => {
    setSelectedItem(item);
  };

  const handleDecisionCommitted = async (
    action: 'approve' | 'reject' | 'request_changes',
    comments: string
  ) => {
    if (!selectedItem) return;

    await ApiService.submitReviewDecision({
      content_id: selectedItem.content_id,
      revision_id: `rev-${selectedItem.content_id}-1`,
      action,
      comments,
    });

    // Update local table
    setQueueItems((prev) =>
      prev.map((i) =>
        i.content_id === selectedItem.content_id
          ? {
              ...i,
              workflow_status:
                action === 'approve'
                  ? 'approved'
                  : action === 'reject'
                  ? 'rejected'
                  : 'changes_requested',
              requires_action: false,
            }
          : i
      )
    );

    if (onRefresh) onRefresh();
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">Approved</span>;
      case 'rejected':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">Rejected</span>;
      case 'changes_requested':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">Changes Requested</span>;
      case 'pending_approval':
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">Pending Review</span>;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-semibold border-b border-slate-200 tracking-wider">
            <tr>
              <th className="px-6 py-3.5">Submission Details</th>
              <th className="px-6 py-3.5">Author</th>
              <th className="px-6 py-3.5">Status</th>
              <th className="px-6 py-3.5">Issues Found</th>
              <th className="px-6 py-3.5">Submitted</th>
              <th className="px-6 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {queueItems.map((item) => (
              <tr key={item.content_id} className="hover:bg-slate-50/60 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-semibold text-slate-900">{item.title}</div>
                  <div className="text-xs font-mono text-slate-400">{item.content_id}</div>
                </td>
                <td className="px-6 py-4 text-xs font-medium text-slate-700">
                  {item.author_email}
                </td>
                <td className="px-6 py-4">
                  {statusBadge(item.workflow_status)}
                </td>
                <td className="px-6 py-4">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                    item.findings_count > 0 ? 'bg-amber-50 text-amber-800' : 'bg-emerald-50 text-emerald-800'
                  }`}>
                    {item.findings_count} finding{item.findings_count !== 1 ? 's' : ''}
                  </span>
                </td>
                <td className="px-6 py-4 text-xs text-slate-500">
                  {new Date(item.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => handleOpenDecision(item)}
                    className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium text-xs transition-colors border border-indigo-200"
                  >
                    Review & Decide
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedItem && (
        <ReviewDecisionModal
          item={selectedItem}
          isOpen={Boolean(selectedItem)}
          onClose={() => setSelectedItem(null)}
          onSubmitDecision={handleDecisionCommitted}
        />
      )}
    </div>
  );
};
