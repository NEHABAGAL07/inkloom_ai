'use client';

import React, { useEffect, useState } from 'react';
import { ApiService } from '../../services/api';
import { AuditResult, FindingCategory, FindingSeverity } from '../../types/audit';
import { AuditSummaryCard } from '../../components/audits/AuditSummaryCard';
import { FindingCard } from '../../components/audits/FindingCard';

export default function AuditsPage() {
  const [audit, setAudit] = useState<AuditResult | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAudit() {
      try {
        const audits = await ApiService.getRecentAudits();
        if (audits.length > 0) {
          setAudit(audits[0]);
        }
      } catch (err) {
        console.error('Failed to load audit results:', err);
      } finally {
        setLoading(false);
      }
    }
    loadAudit();
  }, []);

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="inline-block animate-spin text-2xl">⏳</div>
        <p className="text-sm text-slate-500 mt-2">Loading audit findings...</p>
      </div>
    );
  }

  if (!audit) {
    return (
      <div className="py-20 text-center">
        <p className="text-slate-600">No recent audit results found.</p>
      </div>
    );
  }

  const filteredFindings = audit.findings.filter((f) => {
    if (categoryFilter !== 'all' && f.category !== categoryFilter) return false;
    if (severityFilter !== 'all' && f.severity !== severityFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Verification Findings
          </span>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">Audit Results & Remediation</h1>
          <p className="text-sm text-slate-500 mt-1">
            Detailed breakdown of findings conforming strictly to the shared audit contract.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-3">
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700"
          >
            <option value="all">All Categories</option>
            <option value="terminology">Terminology</option>
            <option value="claim_verification">Claim Verification</option>
            <option value="tone_and_voice">Tone & Voice</option>
            <option value="visual_compliance">Visual Compliance</option>
          </select>
        </div>
      </div>

      {/* Top Level Summary Card */}
      <AuditSummaryCard audit={audit} />

      {/* Findings List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">
            Findings ({filteredFindings.length} of {audit.findings.length})
          </h3>
          <span className="text-xs text-slate-400">
            Accept suggested corrections to update working draft
          </span>
        </div>

        {filteredFindings.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500">
            No findings match the current filter selection.
          </div>
        ) : (
          filteredFindings.map((finding) => (
            <FindingCard key={finding.id} finding={finding} />
          ))
        )}
      </div>
    </div>
  );
}
