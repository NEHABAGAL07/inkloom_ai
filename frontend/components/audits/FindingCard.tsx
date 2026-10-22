'use client';

import React, { useState } from 'react';
import { Finding } from '../../types/audit';
import { SeverityBadge } from './SeverityBadge';

interface FindingCardProps {
  finding: Finding;
  onApplyCorrection?: (findingId: string, correction: string) => void;
}

export const FindingCard: React.FC<FindingCardProps> = ({ finding, onApplyCorrection }) => {
  const [status, setStatus] = useState(finding.status);

  const handleAccept = () => {
    setStatus('accepted');
    if (finding.suggested_correction && onApplyCorrection) {
      onApplyCorrection(finding.id, finding.suggested_correction);
    }
  };

  const handleDismiss = () => {
    setStatus('dismissed');
  };

  return (
    <div className={`p-5 rounded-xl border transition-all ${
      status === 'accepted'
        ? 'border-emerald-300 bg-emerald-50/30'
        : status === 'dismissed'
        ? 'border-slate-200 bg-slate-50/50 opacity-60'
        : 'border-slate-200 bg-white shadow-xs'
    }`}>
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <SeverityBadge severity={finding.severity} />
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium">
              {finding.category.replace('_', ' ')}
            </span>
            <span className="text-xs text-slate-400">
              {Math.round(finding.confidence * 100)}% Confidence
            </span>
            {finding.requires_human_review && (
              <span className="text-xs px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 font-medium">
                Human Review Required
              </span>
            )}
          </div>
          <h4 className="text-base font-semibold text-slate-900 mt-1">{finding.title}</h4>
        </div>

        <div className="flex items-center gap-2">
          {status === 'flagged' && (
            <>
              {finding.suggested_correction && (
                <button
                  onClick={handleAccept}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium transition-colors shadow-xs"
                >
                  Accept Fix
                </button>
              )}
              <button
                onClick={handleDismiss}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-medium transition-colors"
              >
                Dismiss
              </button>
            </>
          )}
          {status === 'accepted' && (
            <span className="text-xs font-medium text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-md">
              ✓ Resolved
            </span>
          )}
          {status === 'dismissed' && (
            <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
              Dismissed
            </span>
          )}
        </div>
      </div>

      <p className="text-sm text-slate-700 mt-3 leading-relaxed">{finding.message}</p>

      {/* Verbatim Evidence Snippet */}
      {finding.evidence ? (
        <div className="mt-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Detected Evidence
          </span>
          <p className="text-xs font-mono text-slate-800 bg-white p-2 rounded border border-slate-200 overflow-x-auto">
            &quot;{finding.evidence}&quot;
          </p>
        </div>
      ) : (
        <div className="mt-2 text-xs italic text-slate-400">
          No verbatim excerpt pinpointed.
        </div>
      )}

      {/* Source Reference Guideline */}
      <div className="mt-3 flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
        <div>
          <span className="font-medium text-slate-700">Source: </span>
          {finding.source_reference ? (
            <span className="font-mono text-slate-600">{finding.source_reference}</span>
          ) : (
            <span className="text-amber-700 italic">No source in verified registry (Unsubstantiated)</span>
          )}
        </div>
        {finding.location?.line && (
          <span>Line {finding.location.line}</span>
        )}
      </div>

      {/* Suggested Correction */}
      {finding.suggested_correction && status === 'flagged' && (
        <div className="mt-3 p-3 rounded-lg bg-indigo-50/50 border border-indigo-100">
          <span className="text-[11px] font-semibold text-indigo-900 uppercase tracking-wider block mb-1">
            Suggested Correction
          </span>
          <p className="text-xs text-indigo-950 font-medium">
            {finding.suggested_correction}
          </p>
        </div>
      )}
    </div>
  );
};
