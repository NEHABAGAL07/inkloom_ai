import React, { useState } from 'react';
import { ReviewAction } from '../../types';
import { X, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { cn } from '../../lib/utils/cn';

interface ReviewDecisionModalProps {
  isOpen: boolean;
  contentId: string;
  contentTitle: string;
  revisionId: number;
  onClose: () => void;
  onSubmit: (data: {
    content_id: string;
    revision_id: number;
    action: ReviewAction;
    comments: string;
  }) => Promise<void>;
}

export const ReviewDecisionModal: React.FC<ReviewDecisionModalProps> = ({
  isOpen,
  contentId,
  contentTitle,
  revisionId,
  onClose,
  onSubmit,
}) => {
  const [selectedAction, setSelectedAction] = useState<ReviewAction>('approved');
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await onSubmit({
        content_id: contentId,
        revision_id: revisionId,
        action: selectedAction,
        comments,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit review decision');
    } finally {
      setIsSubmitting(false);
    }
  };

  const actionOptions: {
    id: ReviewAction;
    label: string;
    description: string;
    icon: React.ReactNode;
    activeClass: string;
  }[] = [
    {
      id: 'approved',
      label: 'Approve Version',
      description: 'Certify that this exact content revision is compliant and authorized for use.',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
      activeClass: 'border-emerald-500 bg-emerald-950/30 text-emerald-300',
    },
    {
      id: 'changes_requested',
      label: 'Request Changes',
      description: 'Send back to the content creator with specific feedback to address.',
      icon: <AlertTriangle className="w-5 h-5 text-orange-400" />,
      activeClass: 'border-orange-500 bg-orange-950/30 text-orange-300',
    },
    {
      id: 'rejected',
      label: 'Reject Content',
      description: 'Reject this version due to severe brand policy or factual infractions.',
      icon: <XCircle className="w-5 h-5 text-rose-400" />,
      activeClass: 'border-rose-500 bg-rose-950/30 text-rose-300',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="glass-panel w-full max-w-lg rounded-2xl p-6 shadow-2xl border border-slate-700/80 bg-slate-900/95 relative animate-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div>
          <h2 className="text-lg font-bold text-white">Record Human Review Decision</h2>
          <p className="mt-1 text-xs text-slate-400">
            Evaluating <span className="font-semibold text-slate-200">{contentTitle}</span> (Version {revisionId})
          </p>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-200 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Select Decision Outcome
            </label>
            <div className="space-y-2">
              {actionOptions.map((opt) => (
                <div
                  key={opt.id}
                  onClick={() => setSelectedAction(opt.id)}
                  className={cn(
                    'p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3.5',
                    selectedAction === opt.id
                      ? opt.activeClass
                      : 'border-slate-800 bg-slate-950/50 hover:border-slate-700 text-slate-300'
                  )}
                >
                  <div className="mt-0.5 shrink-0">{opt.icon}</div>
                  <div>
                    <span className="text-sm font-semibold block">{opt.label}</span>
                    <span className="text-xs text-slate-400 block mt-0.5">{opt.description}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
              Reviewer Notes / Guidance (Optional)
            </label>
            <textarea
              rows={3}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Provide context for approval or specific corrections required..."
              className="w-full rounded-xl bg-slate-950 border border-slate-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 p-3 text-sm text-slate-200 placeholder-slate-500 outline-none resize-none transition-colors"
            />
          </div>

          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 text-[11px] text-slate-400">
            <span className="font-semibold text-slate-300 block mb-0.5">Governance Note:</span>
            Decisions apply strictly to <strong>Version {revisionId}</strong>. Subsequent content revisions automatically revert status to Draft and will require a new audit and review cycle.
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-sm font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl text-sm font-medium text-white bg-brand-600 hover:bg-brand-500 shadow-lg shadow-brand-600/25 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Recording Decision...' : 'Confirm Decision'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
