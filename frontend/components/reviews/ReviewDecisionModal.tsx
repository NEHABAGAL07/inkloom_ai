'use client';

import React, { useState } from 'react';
import { ReviewQueueItem } from '../../types/audit';

interface ReviewDecisionModalProps {
  item: ReviewQueueItem;
  isOpen: boolean;
  onClose: () => void;
  onSubmitDecision: (
    action: 'approve' | 'reject' | 'request_changes',
    comments: string
  ) => Promise<void>;
}

export const ReviewDecisionModal: React.FC<ReviewDecisionModalProps> = ({
  item,
  isOpen,
  onClose,
  onSubmitDecision,
}) => {
  const [action, setAction] = useState<'approve' | 'reject' | 'request_changes'>('request_changes');
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comments.trim()) {
      setError('Please provide comments justifying your decision.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSubmitDecision(action, comments);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to submit review decision.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Governance Review Sign-Off
            </span>
            <h3 className="text-lg font-bold text-slate-900 mt-0.5">{item.title}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-lg font-semibold"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Decision Action
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setAction('approve')}
                className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all ${
                  action === 'approve'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                ✓ Approve
              </button>
              <button
                type="button"
                onClick={() => setAction('request_changes')}
                className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all ${
                  action === 'request_changes'
                    ? 'border-amber-600 bg-amber-50 text-amber-800 ring-2 ring-amber-500/20'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                ⚠️ Request Fixes
              </button>
              <button
                type="button"
                onClick={() => setAction('reject')}
                className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all ${
                  action === 'reject'
                    ? 'border-rose-600 bg-rose-50 text-rose-800 ring-2 ring-rose-500/20'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                ✕ Reject
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Reviewer Rationale & Feedback (Mandatory)
            </label>
            <textarea
              rows={4}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Detail reasons for decision, guidelines referenced, or necessary modifications..."
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
            />
          </div>

          <div className="p-3 bg-slate-50 rounded-lg text-[11px] text-slate-500 border border-slate-100">
            <strong>Human Responsibility Clause:</strong> Your decision will be permanently recorded in the immutable audit event log with your reviewer ID and timestamp.
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium shadow-xs disabled:opacity-50"
            >
              {isSubmitting ? 'Recording Decision...' : 'Commit Review Decision'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
