"use client";

import React, { useState } from "react";
import { ContentSubmission, AuditResult } from "@/types";
import { api } from "@/services/api";
import { useAuth } from "@/services/auth-context";

interface LegalDashboardProps {
  submissions: ContentSubmission[];
  onRefresh: () => void;
}

export function LegalDashboard({ submissions, onRefresh }: LegalDashboardProps) {
  const { activeOrgName, user } = useAuth();
  const [selectedSubmission, setSelectedSubmission] = useState<ContentSubmission | null>(null);
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
  const [isLoadingAudit, setIsLoadingAudit] = useState(false);

  // Decision Modal
  const [isDecisionModalOpen, setIsDecisionModalOpen] = useState(false);
  const [decisionAction, setDecisionAction] = useState<"approve" | "reject" | "request_changes">("approve");
  const [comments, setComments] = useState("");
  const [isSubmittingDecision, setIsSubmittingDecision] = useState(false);
  const [decisionFeedback, setDecisionFeedback] = useState<string | null>(null);

  // Filter queue for submissions requiring human approval
  const reviewQueue = submissions.filter(
    (s) => s.status === "pending_approval" || s.status === "changes_requested"
  );

  const handleInspectSubmission = async (sub: ContentSubmission) => {
    setSelectedSubmission(sub);
    setIsLoadingAudit(true);
    setDecisionFeedback(null);
    try {
      // Fetch or trigger audit for this submission
      const audit = await api.triggerAudit(sub.id, sub.current_revision_id);
      setAuditResult(audit);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoadingAudit(false);
    }
  };

  const handleSubmitDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubmission) return;
    setIsSubmittingDecision(true);
    try {
      await api.submitReviewDecision({
        submission_id: selectedSubmission.id,
        revision_id: selectedSubmission.current_revision_id,
        action: decisionAction,
        comments,
      });
      setDecisionFeedback(`✓ Review recorded: Marked as ${decisionAction.replace("_", " ")}.`);
      setIsDecisionModalOpen(false);
      setComments("");
      onRefresh();
    } catch (err: any) {
      alert(err.message || "Review decision failed. Enforce separation of duties.");
    } finally {
      setIsSubmittingDecision(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Hero */}
      <div className="relative rounded-3xl overflow-hidden p-8 border border-emerald-500/20 bg-gradient-to-r from-slate-900 via-emerald-950/30 to-slate-900 shadow-2xl">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
            <span>⚖️ Legal & Regulatory Compliance Triage</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight sm:text-4xl">
            {activeOrgName || "Enterprise"} Compliance Review Queue
          </h1>
          <p className="text-slate-300 text-sm leading-relaxed">
            Human-in-the-loop review station. Inspect unverified claims, tone severity, and evidence citations. Authorized reviewers record final publication approval or change requests.
          </p>
        </div>
      </div>

      {decisionFeedback && (
        <div className="p-4 bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-sm rounded-2xl flex items-center justify-between">
          <span>{decisionFeedback}</span>
          <button onClick={() => setDecisionFeedback(null)} className="text-emerald-400 hover:text-white font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Main Review Section: Queue on Left, Findings Inspection on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Pending Review Queue */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>📋</span> Awaiting Compliance Sign-Off ({reviewQueue.length})
            </h2>
            <span className="text-xs text-amber-400 font-bold bg-amber-950/80 border border-amber-800 px-2 py-0.5 rounded-full">
              Mandatory Human Sign-off
            </span>
          </div>

          <div className="divide-y divide-slate-800 space-y-2">
            {reviewQueue.length > 0 ? (
              reviewQueue.map((sub) => {
                const isSelected = selectedSubmission?.id === sub.id;
                return (
                  <div
                    key={sub.id}
                    onClick={() => handleInspectSubmission(sub)}
                    className={`p-4 rounded-2xl cursor-pointer transition-all border ${
                      isSelected
                        ? "bg-slate-800/80 border-indigo-500 shadow-lg"
                        : "bg-slate-950/50 border-slate-800/80 hover:border-slate-700 hover:bg-slate-800/40"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white truncate max-w-[200px]">{sub.title}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize ${
                          sub.status === "pending_approval"
                            ? "bg-indigo-950/80 text-indigo-300 border-indigo-800"
                            : "bg-amber-950/80 text-amber-300 border-amber-800"
                        }`}
                      >
                        {sub.status.replace("_", " ")}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-1 line-clamp-2">{sub.description}</div>
                    <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-800/80 pt-2">
                      <span className="uppercase font-semibold">{sub.content_type}</span>
                      <span className="text-indigo-400 font-bold">Inspect Findings →</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-12 text-center text-xs text-slate-500">
                🎉 No pending reviews in the queue! All submissions approved or resolved.
              </div>
            )}
          </div>
        </div>

        {/* Right: Detailed Finding Inspection & Decision Hub */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
          {selectedSubmission ? (
            <div className="space-y-6">
              <div className="flex items-start justify-between border-b border-slate-800 pb-4">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Inspecting Submission</div>
                  <h3 className="text-lg font-bold text-white mt-0.5">{selectedSubmission.title}</h3>
                  <div className="text-xs text-slate-400 mt-1">{selectedSubmission.description}</div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setDecisionAction("approve");
                      setIsDecisionModalOpen(true);
                    }}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition-all"
                  >
                    ✓ Authorize Release
                  </button>
                  <button
                    onClick={() => {
                      setDecisionAction("request_changes");
                      setIsDecisionModalOpen(true);
                    }}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-amber-600/20 transition-all"
                  >
                    Request Changes
                  </button>
                </div>
              </div>

              {/* Audit Findings List */}
              <div className="space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                  <span>AI Audit Evidence & Findings</span>
                  {auditResult && (
                    <span className="text-indigo-400">Score: {auditResult.summary.compliance_score}/100</span>
                  )}
                </div>

                {isLoadingAudit ? (
                  <div className="py-12 text-center text-xs text-slate-400 animate-pulse">
                    Retrieving AI Audit Findings & Certified Benchmarks...
                  </div>
                ) : auditResult && auditResult.findings.length > 0 ? (
                  <div className="space-y-3">
                    {auditResult.findings.map((f) => (
                      <div key={f.id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                                f.severity === "critical"
                                  ? "bg-rose-950 text-rose-300 border-rose-800"
                                  : f.severity === "high"
                                  ? "bg-amber-950 text-amber-300 border-amber-800"
                                  : "bg-indigo-950 text-indigo-300 border-indigo-800"
                              }`}
                            >
                              {f.severity}
                            </span>
                            <span className="text-xs font-bold text-white">{f.title}</span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono">Confidence: {Math.round(f.confidence * 100)}%</span>
                        </div>

                        <div className="text-xs text-slate-300">{f.message}</div>

                        {f.evidence && (
                          <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-amber-300/90">
                            &ldquo;{f.evidence}&rdquo;
                          </div>
                        )}

                        {f.suggested_correction && (
                          <div className="text-xs text-emerald-400 font-medium pt-1">
                            💡 Suggested Compliant Phrasing: &quot;{f.suggested_correction.replacement_text}&quot;
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 text-center text-xs text-slate-400">
                    No critical violations detected by automated rule checks. Reviewer judgment required for release.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="py-20 text-center text-slate-500 space-y-2">
              <div className="text-3xl">⚖️</div>
              <div className="text-sm font-semibold text-slate-400">Select a submission from the review queue</div>
              <div className="text-xs max-w-sm mx-auto text-slate-500">
                Inspect AI findings, verify benchmark citations, and record authorized approval decisions.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Review Decision Modal */}
      {isDecisionModalOpen && selectedSubmission && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>📝</span> Record Compliance Decision
              </h3>
              <button onClick={() => setIsDecisionModalOpen(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitDecision} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Target Action</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setDecisionAction("approve")}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                      decisionAction === "approve"
                        ? "bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/30"
                        : "bg-slate-950 text-slate-400 border-slate-800"
                    }`}
                  >
                    ✓ Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => setDecisionAction("request_changes")}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                      decisionAction === "request_changes"
                        ? "bg-amber-600 text-white border-amber-500 shadow-md shadow-amber-600/30"
                        : "bg-slate-950 text-slate-400 border-slate-800"
                    }`}
                  >
                    Needs Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => setDecisionAction("reject")}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                      decisionAction === "reject"
                        ? "bg-rose-600 text-white border-rose-500 shadow-md shadow-rose-600/30"
                        : "bg-slate-950 text-slate-400 border-slate-800"
                    }`}
                  >
                    ✕ Reject
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Compliance Officer Notes / Required Corrections
                </label>
                <textarea
                  required
                  rows={3}
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="State the justification or specific policy citations for the creator..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-[11px] text-slate-400 leading-relaxed">
                <span className="font-bold text-slate-300">Separation of Duties Notice:</span> Your reviewer identity (
                {user?.full_name || user?.email}) and exact timestamp will be permanently logged in the immutable audit event trail.
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsDecisionModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingDecision}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/20 disabled:opacity-50"
                >
                  {isSubmittingDecision ? "Recording Decision..." : "Submit Official Decision"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
