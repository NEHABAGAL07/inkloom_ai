import React from 'react';
import { WorkflowStatus } from '../../types';
import { cn } from '../../lib/utils/cn';
import { CheckCircle2, Clock, AlertTriangle, XCircle, FileEdit, PlayCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: WorkflowStatus | string;
  className?: string;
  showIcon?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className, showIcon = true }) => {
  const normalized = status.toLowerCase() as WorkflowStatus;

  const config: Record<
    WorkflowStatus,
    { label: string; bg: string; text: string; border: string; icon: React.ReactNode }
  > = {
    draft: {
      label: 'Draft',
      bg: 'bg-slate-800/80',
      text: 'text-slate-300',
      border: 'border-slate-700',
      icon: <FileEdit className="w-3.5 h-3.5" />,
    },
    in_audit: {
      label: 'Auditing',
      bg: 'bg-blue-950/60',
      text: 'text-blue-300',
      border: 'border-blue-800/60',
      icon: <PlayCircle className="w-3.5 h-3.5 animate-pulse text-blue-400" />,
    },
    pending_approval: {
      label: 'Awaiting Review',
      bg: 'bg-amber-950/60',
      text: 'text-amber-300',
      border: 'border-amber-800/60',
      icon: <Clock className="w-3.5 h-3.5 text-amber-400" />,
    },
    approved: {
      label: 'Approved',
      bg: 'bg-emerald-950/60',
      text: 'text-emerald-300',
      border: 'border-emerald-800/60',
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />,
    },
    changes_requested: {
      label: 'Changes Requested',
      bg: 'bg-orange-950/60',
      text: 'text-orange-300',
      border: 'border-orange-800/60',
      icon: <AlertTriangle className="w-3.5 h-3.5 text-orange-400" />,
    },
    rejected: {
      label: 'Rejected',
      bg: 'bg-rose-950/60',
      text: 'text-rose-300',
      border: 'border-rose-800/60',
      icon: <XCircle className="w-3.5 h-3.5 text-rose-400" />,
    },
  };

  const current = config[normalized] || {
    label: status.replace(/_/g, ' '),
    bg: 'bg-slate-800',
    text: 'text-slate-300',
    border: 'border-slate-700',
    icon: <Clock className="w-3.5 h-3.5" />,
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize',
        current.bg,
        current.text,
        current.border,
        className
      )}
    >
      {showIcon && current.icon}
      {current.label}
    </span>
  );
};
