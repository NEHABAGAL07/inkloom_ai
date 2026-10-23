import React from 'react';
import { AuditResult } from '../../types';
import { formatDate } from '../../lib/utils/formatters';
import { ShieldCheck, ShieldAlert, Award } from 'lucide-react';
import { cn } from '../../lib/utils/cn';

interface AuditSummaryCardProps {
  audit: AuditResult;
  className?: string;
}

export const AuditSummaryCard: React.FC<AuditSummaryCardProps> = ({ audit, className }) => {
  const criticalCount = audit.findings.filter((f) => f.severity === 'critical').length;
  const highCount = audit.findings.filter((f) => f.severity === 'high').length;
  const mediumCount = audit.findings.filter((f) => f.severity === 'medium').length;
  const lowCount = audit.findings.filter((f) => f.severity === 'low').length;

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-400 border-emerald-500/30 bg-emerald-950/20';
    if (score >= 70) return 'text-amber-400 border-amber-500/30 bg-amber-950/20';
    return 'text-rose-400 border-rose-500/30 bg-rose-950/20';
  };

  return (
    <div className={cn('glass-card rounded-2xl p-6 border border-slate-800', className)}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div
            className={cn(
              'w-20 h-20 rounded-2xl border-2 flex flex-col items-center justify-center font-bold shadow-lg shrink-0',
              getScoreColor(audit.overall_score)
            )}
          >
            <span className="text-2xl">{Math.round(audit.overall_score)}</span>
            <span className="text-[10px] uppercase tracking-wider font-semibold opacity-75">Score</span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-white">Brand Governance Audit</h2>
              <span className="text-xs bg-brand-950/80 border border-brand-800/80 text-brand-300 px-2 py-0.5 rounded-full font-mono">
                Version {audit.content_version}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Audit ID: <code className="text-slate-300 font-mono">{audit.audit_id}</code> • Ran on {formatDate(audit.created_at)}
            </p>
            <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
              {audit.findings.length === 0 ? (
                <span className="inline-flex items-center gap-1.5 text-emerald-400 font-medium">
                  <ShieldCheck className="w-4 h-4" /> Zero Policy Violations Found
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-amber-400 font-medium">
                  <ShieldAlert className="w-4 h-4" /> {audit.findings.length} findings require creator/reviewer attention
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Severity counts pill grid */}
        <div className="flex items-center gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800/60 self-start md:self-auto">
          <div className="text-center px-3 border-r border-slate-800">
            <span className="block text-sm font-bold text-rose-400">{criticalCount}</span>
            <span className="text-[10px] uppercase font-semibold text-slate-500">Critical</span>
          </div>
          <div className="text-center px-3 border-r border-slate-800">
            <span className="block text-sm font-bold text-orange-400">{highCount}</span>
            <span className="text-[10px] uppercase font-semibold text-slate-500">High</span>
          </div>
          <div className="text-center px-3 border-r border-slate-800">
            <span className="block text-sm font-bold text-amber-400">{mediumCount}</span>
            <span className="text-[10px] uppercase font-semibold text-slate-500">Medium</span>
          </div>
          <div className="text-center px-3">
            <span className="block text-sm font-bold text-sky-400">{lowCount}</span>
            <span className="text-[10px] uppercase font-semibold text-slate-500">Low</span>
          </div>
        </div>
      </div>
    </div>
  );
};
