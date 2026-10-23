'use client';

import React from 'react';
import { AuditResult } from '../../types/audit';

interface AuditSummaryCardProps {
  audit: AuditResult;
}

export const AuditSummaryCard: React.FC<AuditSummaryCardProps> = ({ audit }) => {
  const statusColors = {
    passed: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    warning: 'bg-amber-50 text-amber-800 border-amber-200',
    failed: 'bg-rose-50 text-rose-800 border-rose-200',
    needs_human_review: 'bg-purple-50 text-purple-800 border-purple-200',
  };

  const statusLabel = {
    passed: 'Passed - Guidelines Compliant',
    warning: 'Warning - Non-Blocking Concerns',
    failed: 'Failed - Critical Non-Compliance',
    needs_human_review: 'Pending Human Review Required',
  };

  const criticalCount = audit.findings.filter((f) => f.severity === 'critical' || f.severity === 'high').length;
  const mediumCount = audit.findings.filter((f) => f.severity === 'medium').length;
  const lowCount = audit.findings.filter((f) => f.severity === 'low' || f.severity === 'info').length;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Audit Overview
          </span>
          <h2 className="text-xl font-bold text-slate-900 mt-0.5">Brand Compliance Report</h2>
          <p className="text-xs text-slate-500 mt-1">
            Audit ID: <span className="font-mono">{audit.audit_id}</span>
          </p>
        </div>

        <div className={`px-4 py-2 rounded-lg border font-semibold text-sm ${statusColors[audit.overall_status]}`}>
          {statusLabel[audit.overall_status]}
        </div>
      </div>

      <div className="mt-4">
        <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-100">
          {audit.summary}
        </p>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
        <div className="p-3 rounded-lg border border-slate-100 bg-slate-50">
          <p className="text-xs text-slate-500">Critical / High Issues</p>
          <p className={`text-xl font-bold mt-1 ${criticalCount > 0 ? 'text-rose-600' : 'text-slate-700'}`}>
            {criticalCount}
          </p>
        </div>
        <div className="p-3 rounded-lg border border-slate-100 bg-slate-50">
          <p className="text-xs text-slate-500">Medium Warnings</p>
          <p className="text-xl font-bold text-slate-700 mt-1">{mediumCount}</p>
        </div>
        <div className="p-3 rounded-lg border border-slate-100 bg-slate-50">
          <p className="text-xs text-slate-500">Minor & Tone Suggestions</p>
          <p className="text-xl font-bold text-slate-700 mt-1">{lowCount}</p>
        </div>
        <div className="p-3 rounded-lg border border-slate-100 bg-slate-50">
          <p className="text-xs text-slate-500">Rules Evaluated</p>
          <p className="text-xl font-bold text-indigo-600 mt-1">
            {audit.engine_metadata.rules_checked_count}
          </p>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
        <span>Engine: {audit.engine_metadata.engine_version}</span>
        <span>Execution Time: {audit.engine_metadata.execution_time_ms} ms</span>
      </div>
    </div>
  );
};
