import React from 'react';
import { cn } from '../../lib/utils/cn';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDestructive = false,
  isLoading = false,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="glass-panel w-full max-w-md rounded-2xl p-6 shadow-2xl border border-slate-700/80 bg-slate-900/95 relative animate-in zoom-in-95 duration-150">
        <button
          onClick={onCancel}
          disabled={isLoading}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-4">
          <div
            className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border',
              isDestructive
                ? 'bg-rose-950/70 border-rose-800/80 text-rose-400'
                : 'bg-brand-950/70 border-brand-800/80 text-brand-400'
            )}
          >
            <AlertTriangle className="w-5 h-5" />
          </div>

          <div>
            <h3 className="text-base font-semibold text-white">{title}</h3>
            <p className="mt-1 text-sm text-slate-400 leading-relaxed">{description}</p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 rounded-xl text-sm font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={cn(
              'px-4 py-2 rounded-xl text-sm font-medium text-white transition-colors shadow-lg disabled:opacity-50',
              isDestructive
                ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/25'
                : 'bg-brand-600 hover:bg-brand-500 shadow-brand-600/25'
            )}
          >
            {isLoading ? 'Processing...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
