import React from 'react';
import { AuditFinding, EvidenceStatus } from '../../types';
import { SeverityBadge } from '../ui/SeverityBadge';
import { cn } from '../../lib/utils/cn';
import { CheckCircle, AlertOctagon, HelpCircle, Shield, Lightbulb, FileCode } from 'lucide-react';

interface FindingCardProps {
  finding: AuditFinding;
  className?: string;
}

export const FindingCard: React.FC<FindingCardProps> = ({ finding, className }) => {
  const renderEvidenceStatus = (status: EvidenceStatus) => {
    switch (status) {
      case 'supported':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded">
            <CheckCircle className="w-3 h-3" />
            Supported by Facts
          </span>
        );
      case 'contradicted':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-rose-400 bg-rose-950/60 border border-rose-800/60 px-2 py-0.5 rounded">
            <AlertOctagon className="w-3 h-3" />
            Contradicted by Facts
          </span>
        );
      case 'unverified':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-400 bg-amber-950/60 border border-amber-800/60 px-2 py-0.5 rounded">
            <HelpCircle className="w-3 h-3" />
            Unverified Claim
          </span>
        );
      case 'unavailable':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-400 bg-slate-900 border border-slate-700 px-2 py-0.5 rounded">
            <Shield className="w-3 h-3" />
            Evidence Unavailable
          </span>
        );
    }
  };

  return (
    <div
      className={cn(
        'glass-card rounded-xl p-5 border border-slate-800/80 hover:border-slate-700 transition-all space-y-3.5',
        finding.severity === 'critical' && 'border-l-4 border-l-rose-500',
        finding.severity === 'high' && 'border-l-4 border-l-orange-500',
        finding.severity === 'medium' && 'border-l-4 border-l-amber-500',
        finding.severity === 'low' && 'border-l-4 border-l-sky-500',
        className
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <SeverityBadge severity={finding.severity} />
          <span className="text-xs font-medium uppercase tracking-wider text-slate-400 bg-slate-800/80 px-2.5 py-0.5 rounded-full border border-slate-700">
            {finding.category.replace(/_/g, ' ')}
          </span>
        </div>
        <div>{renderEvidenceStatus(finding.evidence_status)}</div>
      </div>

      {/* Flagged snippet */}
      <div className="bg-slate-950/80 rounded-lg p-3 border border-slate-800/60 font-mono text-xs">
        <span className="text-slate-500 select-none mr-2">FLAGGED:</span>
        <span className="text-rose-300 font-semibold bg-rose-950/40 px-1 py-0.5 rounded border border-rose-900/60">
          "{finding.original_text}"
        </span>
      </div>

      {/* Explanation */}
      <p className="text-sm text-slate-300 leading-relaxed">{finding.explanation}</p>

      {/* Suggestion */}
      {finding.suggestion && (
        <div className="bg-brand-950/30 border border-brand-800/40 rounded-lg p-3 flex items-start gap-2.5">
          <Lightbulb className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
          <div className="text-xs text-brand-200">
            <span className="font-semibold block mb-0.5">Recommended Adjustment:</span>
            {finding.suggestion}
          </div>
        </div>
      )}

      {/* Guideline reference if available */}
      {finding.guideline_id && (
        <div className="flex items-center gap-1.5 text-xs text-slate-500 pt-1 border-t border-slate-800/50">
          <FileCode className="w-3.5 h-3.5" />
          <span>Rule Reference: <code className="text-slate-400">{finding.guideline_id}</code></span>
        </div>
      )}
    </div>
  );
};
