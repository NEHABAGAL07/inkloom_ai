"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/services/api";
import { AuditResult, Finding } from "@/types";
import { AuditSummaryCard } from "@/components/audits/AuditSummaryCard";
import { FindingsFilter } from "@/components/audits/FindingsFilter";
import { FindingCard } from "@/components/audits/FindingCard";

export default function AuditsPage() {
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSeverity, setSelectedSeverity] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAudit() {
      try {
        // Fetch audit (falls back to mockApi contract example)
        const res = await api.getAudit("7f8b3c10-9b4e-4f76-b6b8-6d8b688d6e90");
        setAuditResult(res);
      } catch (err) {
        console.error("Failed to load audit result", err);
      } finally {
        setLoading(false);
      }
    }
    loadAudit();
  }, []);

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

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Audit Findings & Remediation</h1>
          <p className="text-xs text-slate-400 mt-1">
            Inspecting content piece <strong className="text-slate-200">{auditResult.content_id}</strong> against active enterprise guidelines.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/reviews"
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-md transition"
          >
            Reviewer Queue Sign-off →
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
