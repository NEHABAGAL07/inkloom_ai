"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/services/api";
import { AuditResult, ContentSubmission } from "@/types";
import { AuditSummaryCard } from "@/components/audits/AuditSummaryCard";
import { FindingsFilter } from "@/components/audits/FindingsFilter";
import { FindingCard } from "@/components/audits/FindingCard";

function AuditsContent() {
  const searchParams = useSearchParams();
  const queryId = searchParams?.get("id") || searchParams?.get("content_id");

  const [submissions, setSubmissions] = useState<ContentSubmission[]>([]);
  const [selectedContentId, setSelectedContentId] = useState<string>(queryId || "");
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSeverity, setSelectedSeverity] = useState("all");
  const [loading, setLoading] = useState(true);

  // Load submissions list
  useEffect(() => {
    async function loadSubmissions() {
      try {
        const subs = await api.getSubmissions();
        setSubmissions(subs);
        if (!selectedContentId && subs.length > 0) {
          setSelectedContentId(subs[0].id);
        }
      } catch (err) {
        console.error("Failed to load submissions", err);
      }
    }
    loadSubmissions();
  }, []);

  // Update selectedContentId if queryId changes
  useEffect(() => {
    if (queryId) {
      setSelectedContentId(queryId);
    }
  }, [queryId]);

  // Load audit result for selected content ID
  useEffect(() => {
    async function loadAudit() {
      setLoading(true);
      try {
        const targetId = selectedContentId || "7f8b3c10-9b4e-4f76-b6b8-6d8b688d6e90";
        const res = await api.getAudit(targetId);
        setAuditResult(res);
      } catch (err) {
        console.error("Failed to load audit result", err);
      } finally {
        setLoading(false);
      }
    }
    loadAudit();
  }, [selectedContentId]);

  if (loading || !auditResult) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400 text-sm">
        <span className="w-5 h-5 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin mr-3"></span>
        Loading governance audit results...
      </div>
    );
  }

  // Filter findings
  const filteredFindings = auditResult.findings.filter((f) => {
    const matchesCat = selectedCategory === "all" || f.category === selectedCategory;
    const matchesSev = selectedSeverity === "all" || f.severity === selectedSeverity;
    return matchesCat && matchesSev;
  });

  const activeSub = submissions.find((s) => s.id === selectedContentId);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header & Content Piece Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Audit Findings & Remediation</h1>
          <p className="text-xs text-slate-400 mt-1">
            Inspecting <strong className="text-indigo-300">{activeSub?.title || auditResult.content_id}</strong> against active enterprise guidelines.
          </p>
        </div>

        {/* Content Piece Switcher Dropdown */}
        <div className="flex items-center gap-3">
          {submissions.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-semibold hidden md:inline">Inspect Asset:</span>
              <select
                value={selectedContentId}
                onChange={(e) => setSelectedContentId(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded-xl px-3 py-2 max-w-[240px] truncate focus:outline-none focus:border-indigo-500"
              >
                {submissions.map((s) => (
                  <option key={s.id} value={s.id}>
                    [{s.content_type.toUpperCase()}] {s.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          <a
            href="/reviews"
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-md transition whitespace-nowrap"
          >
            Reviewer Queue →
          </a>
        </div>
      </div>

      {/* Audit Summary Card */}
      <AuditSummaryCard
        summary={auditResult.summary}
        overallStatus={auditResult.overall_status}
        auditId={auditResult.audit_id}
      />

      {/* Filter Bar */}
      <FindingsFilter
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        selectedSeverity={selectedSeverity}
        onSelectSeverity={setSelectedSeverity}
        totalFindings={filteredFindings.length}
      />

      {/* Findings List */}
      <div className="space-y-4">
        {filteredFindings.length === 0 ? (
          <div className="text-center py-12 glass-panel rounded-2xl border border-slate-800 text-slate-400 text-sm">
            No findings match the selected filter criteria.
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

export default function AuditsPage() {
  return (
    <Suspense fallback={<div className="text-slate-400 p-8 text-xs">Loading audit dashboard...</div>}>
      <AuditsContent />
    </Suspense>
  );
}
