'use client';

import React from 'react';
import { FindingSeverity } from '../../types/audit';

interface SeverityBadgeProps {
  severity: FindingSeverity;
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({ severity }) => {
  const styles: Record<FindingSeverity, { bg: string; text: string; border: string }> = {
    critical: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
    high: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
    medium: { bg: 'bg-yellow-50', text: 'text-yellow-800', border: 'border-yellow-200' },
    low: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    info: { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200' },
  };

  const style = styles[severity] || styles.info;

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border uppercase tracking-wider ${style.bg} ${style.text} ${style.border}`}
    >
      {severity}
    </span>
  );
};
