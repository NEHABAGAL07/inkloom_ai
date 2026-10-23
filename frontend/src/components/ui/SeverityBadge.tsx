import React from 'react';
import { SeverityLevel } from '../../types';
import { cn } from '../../lib/utils/cn';
import { AlertCircle, AlertTriangle, Info, ShieldAlert } from 'lucide-react';

interface SeverityBadgeProps {
  severity: SeverityLevel | string;
  className?: string;
  showIcon?: boolean;
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({ severity, className, showIcon = true }) => {
  const normalized = severity.toLowerCase() as SeverityLevel;

  const config: Record<
    SeverityLevel,
    { label: string; bg: string; text: string; border: string; icon: React.ReactNode }
  > = {
    critical: {
      label: 'Critical',
      bg: 'bg-rose-950/70',
      text: 'text-rose-300',
      border: 'border-rose-800/80',
      icon: <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />,
    },
    high: {
      label: 'High',
      bg: 'bg-orange-950/70',
      text: 'text-orange-300',
      border: 'border-orange-800/80',
      icon: <AlertTriangle className="w-3.5 h-3.5 text-orange-400" />,
    },
    medium: {
      label: 'Medium',
      bg: 'bg-amber-950/70',
      text: 'text-amber-300',
      border: 'border-amber-800/80',
      icon: <AlertCircle className="w-3.5 h-3.5 text-amber-400" />,
    },
    low: {
      label: 'Low',
      bg: 'bg-sky-950/70',
      text: 'text-sky-300',
      border: 'border-sky-800/80',
      icon: <Info className="w-3.5 h-3.5 text-sky-400" />,
    },
  };

  const current = config[normalized] || {
    label: severity,
    bg: 'bg-slate-800',
    text: 'text-slate-300',
    border: 'border-slate-700',
    icon: <Info className="w-3.5 h-3.5" />,
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider border',
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
