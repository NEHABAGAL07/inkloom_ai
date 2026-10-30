"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/services/api";
import { useAuth } from "@/services/auth-context";
import {
  AuthoritativeLegalSource,
  LegalReviewRequest,
  LegalReviewReport,
  LegalClaimReviewItem,
  ConservativeRevisionSuggestion,
  TargetJurisdiction,
  RegulatedProductCategory,
  DraftDetailResponse,
  DesignDraftDetailResponse,
  ContentSubmission,
} from "@/types";
import {
  Scale,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  FileText,
  BookOpen,
  Filter,
  Download,
  Share2,
  RefreshCw,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Info,
  Sliders,
  Check,
  Copy,
  Plus,
  HelpCircle,
  FileCheck,
  Gavel,
  History,
  AlertCircle,
  Sparkles,
  Layers,
} from "lucide-react";

export default function LegalCopilotPage() {
  const { activeRole, activeOrgName } = useAuth();

  // Active Navigation Tab: "intake" | "claims" | "revisions" | "sources" | "report"
  const [activeTab, setActiveTab] = useState<"intake" | "claims" | "revisions" | "sources" | "report">("intake");

  // ==========================================
  // Intake & Form State
  // ==========================================
  const [intakeSourceType, setIntakeSourceType] = useState<"standalone" | "marketing_draft" | "design_brief">("standalone");
  const [availableMarketingDrafts, setAvailableMarketingDrafts] = useState<DraftDetailResponse[]>([]);
  const [availableDesignBriefs, setAvailableDesignBriefs] = useState<DesignDraftDetailResponse[]>([]);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string>("");
  const [selectedRevisionId, setSelectedRevisionId] = useState<string>("");

  const [title, setTitle] = useState("Q4 Enterprise AI Cloud Launch Campaign");
  const [contentText, setContentText] = useState(
    `Inkloom AI Enterprise delivers guaranteed 100% zero downtime and error-free legal automation. In head-to-head testing against traditional manual workflows, our generative copilot proved 300% faster at detecting statutory violations than all competing tools. With automated regulatory filing, compliance teams can completely eliminate compliance liability across North American and European operations.`
  );
  const [productName, setProductName] = useState("Inkloom AI Enterprise Governance");
  const [intendedAudience, setIntendedAudience] = useState("Enterprise In-House Legal, General Counsel, & Compliance Leads");
  const [targetJurisdiction, setTargetJurisdiction] = useState<TargetJurisdiction>("US");
  const [regulatedCategory, setRegulatedCategory] = useState<RegulatedProductCategory>("b2b_enterprise_saas");
  const [marketingChannel, setMarketingChannel] = useState("Digital / White Paper & Product Landing Page");
  const [campaignObjective, setCampaignObjective] = useState("Enterprise B2B Lead Generation & Product Launch");
  const [knownClaims, setKnownClaims] = useState("Target 99.9% availability in SLA; 3x speedup observed in internal 10k request benchmark; decision-support only.");
  const [specificQuestions, setSpecificQuestions] = useState("Does our 300% speed claim meet the Lanham Act § 43(a) reasonable basis substantiation test? What disclaimers are required under EU AI Act Article 50?");

  // ==========================================
  // Review Execution & Results
  // ==========================================
  const [isReviewing, setIsReviewing] = useState(false);
  const [reviewReport, setReviewReport] = useState<LegalReviewReport | null>(null);
  const [reviewError, setReviewError] = useState<string | null>(null);

  // ==========================================
  // Statutory Sources Catalog State
  // ==========================================
  const [sourcesList, setSourcesList] = useState<AuthoritativeLegalSource[]>([]);
  const [sourceFilterJurisdiction, setSourceFilterJurisdiction] = useState<string>("all");
  const [loadingSources, setLoadingSources] = useState(false);

  // ==========================================
  // Interactive UI State
  // ==========================================
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [expandedClaimId, setExpandedClaimId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Revision Application State
  const [isApplyingRevision, setIsApplyingRevision] = useState(false);
  const [revisionSuccessMsg, setRevisionSuccessMsg] = useState<string | null>(null);

  // Counsel Sign-off Modal State
  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const [decisionAction, setDecisionAction] = useState<"approve" | "reject" | "request_changes">("approve");
  const [decisionComments, setDecisionComments] = useState("");
  const [decisionStipulations, setDecisionStipulations] = useState("");
  const [isSubmittingDecision, setIsSubmittingDecision] = useState(false);
  const [decisionSuccessMsg, setDecisionSuccessMsg] = useState<string | null>(null);

  // Fetch upstream drafts on mount
  useEffect(() => {
    async function loadUpstreamDrafts() {
      try {
        const mDrafts = await api.getMarketingDrafts(15, 0).catch(() => []);
        setAvailableMarketingDrafts(mDrafts);
        const dBriefs = await api.getDesignBriefs(15, 0).catch(() => []);
        setAvailableDesignBriefs(dBriefs);
      } catch (err) {
        console.warn("Could not load upstream drafts", err);
      }
    }
    loadUpstreamDrafts();
    loadSources();
  }, []);

  async function loadSources() {
    setLoadingSources(true);
    try {
      const sources = await api.getLegalSources(
        sourceFilterJurisdiction === "all" ? undefined : sourceFilterJurisdiction
      );
      setSourcesList(sources);
    } catch (err) {
      console.warn("Could not load legal sources", err);
    } finally {
      setLoadingSources(false);
    }
  }

  // Handle Draft Selection
  function handleSelectMarketingDraft(draftId: string) {
    const draft = availableMarketingDrafts.find((d) => d.id === draftId);
    if (draft) {
      setSelectedSubmissionId(draft.id);
      setSelectedRevisionId(draft.current_revision_id || "");
      setTitle(draft.title);
      setContentText(draft.current_text || draft.description || "");
      if (draft.description) setCampaignObjective(draft.description);
    }
  }

  function handleSelectDesignBrief(briefId: string) {
    const brief = availableDesignBriefs.find((b) => b.id === briefId);
    if (brief) {
      setSelectedSubmissionId(brief.id);
      setSelectedRevisionId(brief.current_revision_id || "");
      setTitle(brief.title);
      setContentText(brief.description || brief.brief?.campaign_goal || "Design Visual Concept Version");
      if (brief.brief?.product_service) setProductName(brief.brief.product_service);
      if (brief.brief?.target_audience) setIntendedAudience(brief.brief.target_audience);
    }
  }

  // Run Compliance Review
  async function handleRunReview() {
    if (!contentText.trim()) {
      setReviewError("Please provide content text or select a saved draft to review.");
      return;
    }
    setIsReviewing(true);
    setReviewError(null);
    setRevisionSuccessMsg(null);
    try {
      const req: LegalReviewRequest = {
        title,
        content_text: contentText,
        submission_id: selectedSubmissionId || undefined,
        revision_id: selectedRevisionId || undefined,
        product_name: productName,
        intended_audience: intendedAudience,
        target_jurisdiction: targetJurisdiction,
        regulated_category: regulatedCategory,
        marketing_channel: marketingChannel,
        campaign_objective: campaignObjective,
        known_product_claims: knownClaims.split(";").map((s) => s.trim()).filter(Boolean),
        supporting_evidence_notes: knownClaims,
        specific_legal_questions: specificQuestions.split("?").map((s) => s.trim() + "?").filter((s) => s.length > 2),
      };

      const result = await api.reviewLegalCompliance(req);
      setReviewReport(result);
      setActiveTab("claims");
    } catch (err: any) {
      setReviewError(err?.message || "Failed to execute compliance review.");
    } finally {
      setIsReviewing(false);
    }
  }

  // Apply Conservative Revision to Draft (creates v+1)
  async function handleApplyRevision(rev: ConservativeRevisionSuggestion) {
    if (!reviewReport) return;
    setIsApplyingRevision(true);
    setRevisionSuccessMsg(null);
    try {
      const subId = reviewReport.submission_id || "sub_active_compliance";
      await api.applyLegalRevision(subId, {
        revision_suggestion_id: rev.id,
        updated_text: rev.proposed_text,
        change_summary: `Applied conservative legal revision to mitigate ${rev.material_change_explanation}`,
      });
      setContentText(rev.proposed_text);
      setRevisionSuccessMsg(`Successfully applied conservative revision as new draft revision (v+1). Marketing text updated.`);
    } catch (err: any) {
      setReviewError(err?.message || "Failed to apply suggested revision.");
    } finally {
      setIsApplyingRevision(false);
    }
  }

  // Submit Counsel Sign-off
  async function handleSubmitDecision() {
    if (!reviewReport) return;
    setIsSubmittingDecision(true);
    try {
      const subId = reviewReport.submission_id || "sub_active_compliance";
      const stipulations = decisionStipulations.split("\n").filter((s) => s.trim().length > 0);
      await api.recordLegalDecision(subId, {
        action: decisionAction,
        comments: decisionComments,
        conditions_or_stipulations: stipulations,
      });
      setDecisionSuccessMsg(`Formal counsel determination '${decisionAction.toUpperCase()}' successfully recorded in audit ledger.`);
      setShowDecisionModal(false);
    } catch (err: any) {
      alert(`Error recording decision: ${err?.message}`);
    } finally {
      setIsSubmittingDecision(false);
    }
  }

  // Export Legal Report as JSON
  function exportReportJson() {
    if (!reviewReport) return;
    const blob = new Blob([JSON.stringify(reviewReport, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Legal_Compliance_Report_${reviewReport.report_id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Export Legal Report as Markdown
  function exportReportMarkdown() {
    if (!reviewReport) return;
    let md = `# Inkloom AI — Evidence-Grounded Legal Compliance Report\n`;
    md += `**Report ID:** ${reviewReport.report_id}  \n`;
    md += `**Date of Review:** ${reviewReport.review_date}  \n`;
    md += `**Target Jurisdiction:** ${reviewReport.jurisdictions_and_assumptions.target_jurisdiction}  \n`;
    md += `**Overall Risk Verdict:** ${reviewReport.overall_risk_verdict} (Compliance Score: ${reviewReport.compliance_score}/100)  \n\n`;
    md += `## 1. Executive Summary\n${reviewReport.executive_summary}\n\n`;
    md += `## 2. Campaign Context\n- Product: ${reviewReport.campaign_context.product_name}\n- Audience: ${reviewReport.campaign_context.intended_audience}\n- Channel: ${reviewReport.campaign_context.marketing_channel}\n\n`;
    md += `## 3. High-Priority Potential Risks\n`;
    reviewReport.high_priority_risks.forEach((r, idx) => {
      md += `${idx + 1}. ${r}\n`;
    });
    md += `\n## 4. Claim-by-Claim Analysis\n`;
    reviewReport.claims_analysis.forEach((c, idx) => {
      md += `### Claim ${idx + 1}: "${c.claim_text}"\n`;
      md += `- **Category:** ${c.category}\n`;
      md += `- **Severity:** ${c.severity.toUpperCase()}\n`;
      md += `- **Evidence Status:** ${c.evidence_status}\n`;
      md += `- **Issue:** ${c.issue_explanation}\n`;
      md += `- **Suggested Correction:** ${c.suggested_correction || "N/A"}\n`;
      md += `- **Citations:** ${c.supporting_citations.map((s) => `${s.citation} (${s.issuing_authority})`).join(", ")}\n\n`;
    });
    md += `## 5. Suggested Wording Changes\n`;
    reviewReport.suggested_wording_revisions.forEach((s, idx) => {
      md += `### Revision ${idx + 1}\n- **Original:** ${s.original_text}\n- **Proposed:** ${s.proposed_text}\n- **Rationale:** ${s.supporting_evidence_rationale}\n\n`;
    });
    md += `## 6. Disclaimers & Legal Notice\n${reviewReport.limitations_and_disclaimers}\n`;

    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Legal_Compliance_Report_${reviewReport.report_id}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function copyToClipboard(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  // Filtered claims
  const filteredClaims = reviewReport
    ? reviewReport.claims_analysis.filter((c) => {
        if (statusFilter !== "all" && c.evidence_status !== statusFilter) return false;
        if (severityFilter !== "all" && c.severity !== severityFilter) return false;
        return true;
      })
    : [];

  return (
    <div className="min-h-screen bg-[#0B132B] text-slate-100 flex flex-col">
      {/* Top Advisory Disclaimer Banner */}
      <div className="bg-[#1C2541]/90 border-b border-teal/20 px-6 py-2.5 flex items-center justify-between text-xs text-slate-300">
        <div className="flex items-center gap-2">
          <Scale className="w-4 h-4 text-teal shrink-0" />
          <span>
            <strong className="text-teal-300 font-semibold">Advisory Decision Support System:</strong> Inkloom AI
            Legal Gemini AI evaluates marketing claims and potential regulatory risks. It does not provide formal legal
            advice, attorney-client privileged counsel, or guarantee compliance.
          </span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
            Jurisdiction: <span className="font-semibold text-teal-300">{targetJurisdiction}</span>
          </span>
          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
            Tenant Isolation: <span className="text-emerald-400 font-mono">Enforced</span>
          </span>
        </div>
      </div>

      {/* Workspace Header */}
      <div className="px-8 py-6 border-b border-slate-800/80 bg-[#0F172A]/70 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal/20 border border-teal/40 flex items-center justify-center text-teal-400">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Legal & Regulatory Gemini AI
                <span className="text-xs px-2 py-0.5 rounded-full bg-teal/20 text-teal-300 border border-teal/30 font-medium">
                  Evidence-Grounded
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Investigate statutory requirements, cross-examine product claims, evaluate substantiation, and prepare
                evidence-grounded legal audit reports.
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          {reviewReport && (
            <>
              <button
                onClick={exportReportJson}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition-colors"
                title="Export structured JSON report"
              >
                <Download className="w-3.5 h-3.5" />
                Export JSON
              </button>
              <button
                onClick={exportReportMarkdown}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition-colors"
                title="Export markdown compliance brief"
              >
                <FileText className="w-3.5 h-3.5" />
                Export Markdown
              </button>
              {(activeRole === "compliance_officer" || activeRole === "legal" || activeRole === "admin") && (
                <button
                  onClick={() => setShowDecisionModal(true)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-teal hover:bg-teal-600 text-xs font-semibold text-white shadow-sm transition-colors"
                >
                  <Gavel className="w-3.5 h-3.5" />
                  Record Legal Sign-Off
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="px-8 border-b border-slate-800 bg-[#0F172A]/40 flex gap-2 overflow-x-auto text-sm">
        <button
          onClick={() => setActiveTab("intake")}
          className={`py-3 px-4 font-medium border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
            activeTab === "intake"
              ? "border-teal text-teal-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <FileCheck className="w-4 h-4" />
          1. Compliance Intake & Brief
        </button>
        <button
          onClick={() => setActiveTab("claims")}
          className={`py-3 px-4 font-medium border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
            activeTab === "claims"
              ? "border-teal text-teal-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          2. Claims & Evidence Matrix
          {reviewReport && (
            <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[11px] bg-slate-800 text-teal-300 border border-slate-700">
              {reviewReport.claims_analysis.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("revisions")}
          className={`py-3 px-4 font-medium border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
            activeTab === "revisions"
              ? "border-teal text-teal-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          3. Suggested Revisions (v+1)
          {reviewReport && (
            <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[11px] bg-slate-800 text-teal-300 border border-slate-700">
              {reviewReport.suggested_wording_revisions.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("sources")}
          className={`py-3 px-4 font-medium border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
            activeTab === "sources"
              ? "border-teal text-teal-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <BookOpen className="w-4 h-4" />
          4. Statutory Source Register
        </button>
        <button
          onClick={() => setActiveTab("report")}
          className={`py-3 px-4 font-medium border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
            activeTab === "report"
              ? "border-teal text-teal-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <FileText className="w-4 h-4" />
          5. 10-Section Legal Audit Report
        </button>
      </div>

      {/* Main Workspace Body */}
      <div className="p-8 flex-1 max-w-7xl w-full mx-auto space-y-6">
        {/* Error / Success Alerts */}
        {reviewError && (
          <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-200 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-rose-300">Compliance Review Warning</p>
              <p className="mt-0.5">{reviewError}</p>
            </div>
          </div>
        )}
        {revisionSuccessMsg && (
          <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-200 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-emerald-300">Draft Version Updated</p>
              <p className="mt-0.5">{revisionSuccessMsg}</p>
            </div>
          </div>
        )}
        {decisionSuccessMsg && (
          <div className="p-4 rounded-xl bg-teal-950/40 border border-teal-800/60 text-teal-200 flex items-start gap-3">
            <Gavel className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-teal-300">Legal Counsel Determination Recorded</p>
              <p className="mt-0.5">{decisionSuccessMsg}</p>
            </div>
          </div>
        )}

        {/* TAB 1: COMPLIANCE INTAKE */}
        {activeTab === "intake" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left 2 Cols: Content and Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Draft Origin Selector */}
              <div className="p-5 rounded-xl bg-[#0F172A]/80 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                    <Layers className="w-4 h-4 text-teal" />
                    Intake Source & Linkage
                  </h2>
                  <div className="flex gap-1.5 text-xs">
                    <button
                      onClick={() => setIntakeSourceType("standalone")}
                      className={`px-3 py-1 rounded-md font-medium transition-colors ${
                        intakeSourceType === "standalone"
                          ? "bg-teal text-white"
                          : "bg-slate-800 text-slate-400 hover:text-white"
                      }`}
                    >
                      Standalone Copy
                    </button>
                    <button
                      onClick={() => setIntakeSourceType("marketing_draft")}
                      className={`px-3 py-1 rounded-md font-medium transition-colors ${
                        intakeSourceType === "marketing_draft"
                          ? "bg-teal text-white"
                          : "bg-slate-800 text-slate-400 hover:text-white"
                      }`}
                    >
                      Marketing Gemini AI Draft
                    </button>
                    <button
                      onClick={() => setIntakeSourceType("design_brief")}
                      className={`px-3 py-1 rounded-md font-medium transition-colors ${
                        intakeSourceType === "design_brief"
                          ? "bg-teal text-white"
                          : "bg-slate-800 text-slate-400 hover:text-white"
                      }`}
                    >
                      Designer Brief Version
                    </button>
                  </div>
                </div>

                {intakeSourceType === "marketing_draft" && (
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Select Saved Marketing Draft
                    </label>
                    <select
                      value={selectedSubmissionId}
                      onChange={(e) => handleSelectMarketingDraft(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-teal"
                    >
                      <option value="">-- Choose from saved marketing campaigns --</option>
                      {availableMarketingDrafts.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.title} (Status: {d.status})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {intakeSourceType === "design_brief" && (
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Select Designer Creative Brief / Version
                    </label>
                    <select
                      value={selectedSubmissionId}
                      onChange={(e) => handleSelectDesignBrief(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-teal"
                    >
                      <option value="">-- Choose from creative design drafts --</option>
                      {availableDesignBriefs.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.title} (Status: {b.status})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Campaign Title */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Campaign or Content Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-teal"
                    placeholder="e.g., Enterprise Cloud AI Autumn Launch"
                  />
                </div>

                {/* Content Textarea */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-medium text-slate-300">
                      Marketing Copy, Claim Statements, or Disclaimers to Review
                    </label>
                    <span className="text-[11px] text-slate-400">
                      {contentText.split(/\s+/).filter(Boolean).length} words
                    </span>
                  </div>
                  <textarea
                    rows={6}
                    value={contentText}
                    onChange={(e) => setContentText(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-slate-200 font-sans focus:outline-none focus:border-teal"
                    placeholder="Enter marketing copy, product descriptions, comparative claims, or performance guarantees..."
                  />
                </div>
              </div>

              {/* Known Product Claims & Legal Questions */}
              <div className="p-5 rounded-xl bg-[#0F172A]/80 border border-slate-800 space-y-4">
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-teal" />
                  Claim Substantiation & Questions
                </h3>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Known Product Facts & Substantiation Notes
                  </label>
                  <textarea
                    rows={2}
                    value={knownClaims}
                    onChange={(e) => setKnownClaims(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-teal"
                    placeholder="Reference existing technical benchmarks, SLA documents, or engineering test reports..."
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Cross-checked against the shared intelligence foundation and verified knowledge documents.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Specific Legal / Regulatory Questions
                  </label>
                  <input
                    type="text"
                    value={specificQuestions}
                    onChange={(e) => setSpecificQuestions(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-teal"
                    placeholder="e.g. Does 300% claim meet FTC substantiation? Is EU AI Act Article 50 disclosure required?"
                  />
                </div>
              </div>
            </div>

            {/* Right Col: Jurisdiction & Regulatory Parameters */}
            <div className="space-y-6">
              <div className="p-5 rounded-xl bg-[#0F172A]/80 border border-slate-800 space-y-4">
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                  <Scale className="w-4 h-4 text-teal" />
                  Target Regulatory Jurisdiction
                </h3>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Target Country / Jurisdiction</label>
                  <select
                    value={targetJurisdiction}
                    onChange={(e) => setTargetJurisdiction(e.target.value as TargetJurisdiction)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 font-medium focus:outline-none focus:border-teal"
                  >
                    <option value="US">United States (FTC Act, Lanham Act, SEC)</option>
                    <option value="EU">European Union (EU AI Act, UCPD 2005/29/EC)</option>
                    <option value="UK">United Kingdom (CPRs 2008, CMA Green Claims)</option>
                    <option value="CA">Canada (Competition Act R.S.C. § 74.01)</option>
                    <option value="AU">Australia (ACCC Australian Consumer Law)</option>
                    <option value="Global">Global / Multi-Jurisdictional Baseline</option>
                  </select>
                  <div className="mt-1.5 p-2 rounded bg-amber-950/20 border border-amber-900/40 text-[11px] text-amber-300 flex items-start gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <span>
                      Inkloom never infers jurisdiction from IP or user location. All evaluations ground against the
                      specific selected jurisdiction.
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Regulated Industry Category</label>
                  <select
                    value={regulatedCategory}
                    onChange={(e) => setRegulatedCategory(e.target.value as RegulatedProductCategory)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-teal"
                  >
                    <option value="b2b_enterprise_saas">B2B Enterprise SaaS & Cloud</option>
                    <option value="financial_services">Financial Services & FinTech</option>
                    <option value="healthcare_life_sciences">Healthcare & Life Sciences</option>
                    <option value="consumer_tech_ai">Consumer Tech & AI Software</option>
                    <option value="general_commercial">General Commercial & Retail</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Marketing Channel</label>
                  <input
                    type="text"
                    value={marketingChannel}
                    onChange={(e) => setMarketingChannel(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-teal"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Intended Audience</label>
                  <input
                    type="text"
                    value={intendedAudience}
                    onChange={(e) => setIntendedAudience(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-teal"
                  />
                </div>

                {/* Partial Brief Warning */}
                {(!productName || !intendedAudience || !marketingChannel) && (
                  <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-800/40 text-xs text-amber-300 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Partial Brief Detected</p>
                      <p className="text-[11px] text-amber-300/80 mt-0.5">
                        Missing audience or channel details will limit contextual reasonableness analysis.
                      </p>
                    </div>
                  </div>
                )}

                {/* Run Review CTA Button */}
                <button
                  onClick={handleRunReview}
                  disabled={isReviewing || !contentText.trim()}
                  className="w-full py-3 px-4 rounded-xl bg-teal hover:bg-teal-600 disabled:opacity-50 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-md transition-all mt-4"
                >
                  {isReviewing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Cross-Examining Claims & Statutes...
                    </>
                  ) : (
                    <>
                      <Scale className="w-4 h-4" />
                      Run Evidence-Grounded Legal Review
                    </>
                  )}
                </button>
              </div>

              {/* Statutory Baseline Info Box */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 space-y-2">
                <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-teal" />
                  Active Statutory Scope
                </div>
                <p>
                  Evaluations for <strong className="text-slate-200">{targetJurisdiction}</strong> strictly cite
                  verified codified legal references (e.g., FTC Act § 5, Lanham Act § 43(a), EU AI Act Art 50).
                </p>
                <p className="text-[11px] text-slate-400">
                  Zero Hallucination Rule: Fabricated statutes, case law, dates, or non-existent URLs are rejected by
                  deterministic post-evaluation filters.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CLAIMS & EVIDENCE MATRIX */}
        {activeTab === "claims" && (
          <div className="space-y-6">
            {!reviewReport ? (
              <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800 space-y-3">
                <Scale className="w-10 h-10 text-slate-600 mx-auto" />
                <h3 className="text-base font-semibold text-slate-300">No Active Review Executed</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Submit marketing copy or select a saved draft in the Compliance Intake tab to run an evidence-grounded
                  claims investigation.
                </p>
                <button
                  onClick={() => setActiveTab("intake")}
                  className="px-4 py-2 rounded-lg bg-teal text-xs font-semibold text-white mt-2"
                >
                  Go to Intake
                </button>
              </div>
            ) : (
              <>
                {/* Metric Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl bg-[#0F172A] border border-slate-800">
                    <p className="text-xs text-slate-400">Overall Compliance Verdict</p>
                    <p className="text-base font-bold text-teal-300 mt-1">{reviewReport.overall_risk_verdict}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Score: <span className="font-semibold text-white">{reviewReport.compliance_score}/100</span>
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-[#0F172A] border border-slate-800">
                    <p className="text-xs text-slate-400">Total Claims Evaluated</p>
                    <p className="text-xl font-bold text-white mt-1">{reviewReport.claims_analysis.length}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Across 12 review categories</p>
                  </div>
                  <div className="p-4 rounded-xl bg-[#0F172A] border border-slate-800">
                    <p className="text-xs text-slate-400">High-Priority Risks</p>
                    <p className="text-xl font-bold text-rose-400 mt-1">{reviewReport.high_priority_risks.length}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Require counsel sign-off</p>
                  </div>
                  <div className="p-4 rounded-xl bg-[#0F172A] border border-slate-800">
                    <p className="text-xs text-slate-400">Suggested Revisions</p>
                    <p className="text-xl font-bold text-teal-300 mt-1">
                      {reviewReport.suggested_wording_revisions.length}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Conservative wording (v+1)</p>
                  </div>
                </div>

                {/* Filter Toolbar */}
                <div className="p-3 rounded-xl bg-[#0F172A]/80 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <span className="text-slate-400 font-medium flex items-center gap-1.5">
                      <Filter className="w-3.5 h-3.5 text-teal" /> Filter Findings:
                    </span>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="bg-slate-900 border border-slate-700 rounded-md px-2.5 py-1 text-slate-200"
                    >
                      <option value="all">All Evidence Statuses</option>
                      <option value="supported">Supported by Evidence</option>
                      <option value="contradicted">Contradicted by Evidence</option>
                      <option value="insufficient_evidence">Insufficient Evidence</option>
                      <option value="not_checked">Not Checked</option>
                      <option value="conflicting_sources">Conflicting Sources</option>
                    </select>

                    <select
                      value={severityFilter}
                      onChange={(e) => setSeverityFilter(e.target.value)}
                      className="bg-slate-900 border border-slate-700 rounded-md px-2.5 py-1 text-slate-200"
                    >
                      <option value="all">All Triage Severities</option>
                      <option value="critical">Critical</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>

                  <div className="text-[11px] text-slate-400">
                    Showing <strong className="text-white">{filteredClaims.length}</strong> of{" "}
                    {reviewReport.claims_analysis.length} evaluated claims
                  </div>
                </div>

                {/* Claims Cards */}
                <div className="space-y-4">
                  {filteredClaims.map((claim) => {
                    const isExpanded = expandedClaimId === claim.id;
                    return (
                      <div
                        key={claim.id}
                        className="rounded-xl bg-[#0F172A]/90 border border-slate-800 hover:border-slate-700 transition-all p-5 space-y-3"
                      >
                        {/* Header Row */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            {/* Severity Badge */}
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
                                claim.severity === "critical"
                                  ? "bg-rose-950/80 text-rose-300 border border-rose-800"
                                  : claim.severity === "high"
                                  ? "bg-amber-950/80 text-amber-300 border border-amber-800"
                                  : claim.severity === "medium"
                                  ? "bg-yellow-950/80 text-yellow-300 border border-yellow-800"
                                  : "bg-blue-950/80 text-blue-300 border border-blue-800"
                              }`}
                              title="Triage priority indicator, not a formal legal ruling."
                            >
                              {claim.severity} Triage
                            </span>

                            {/* Category Badge */}
                            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-xs border border-slate-700 font-mono">
                              {claim.category.replace(/_/g, " ")}
                            </span>

                            {/* Evidence Status */}
                            <span
                              className={`px-2 py-0.5 rounded text-xs font-medium ${
                                claim.evidence_status === "supported"
                                  ? "bg-emerald-950/80 text-emerald-300 border border-emerald-800"
                                  : claim.evidence_status === "contradicted"
                                  ? "bg-rose-950/80 text-rose-300 border border-rose-800"
                                  : claim.evidence_status === "insufficient_evidence"
                                  ? "bg-amber-950/80 text-amber-300 border border-amber-800"
                                  : "bg-purple-950/80 text-purple-300 border border-purple-800"
                              }`}
                            >
                              Evidence: {claim.evidence_status.replace(/_/g, " ")}
                            </span>

                            {claim.requires_qualified_legal_review && (
                              <span className="px-2 py-0.5 rounded bg-rose-900/40 text-rose-300 text-[11px] border border-rose-700/60 font-semibold flex items-center gap-1">
                                <Gavel className="w-3 h-3" /> Counsel Review Required
                              </span>
                            )}
                          </div>

                          <div className="text-xs text-slate-400 font-mono">
                            Confidence: {(claim.confidence * 100).toFixed(0)}%
                          </div>
                        </div>

                        {/* Claim Quote */}
                        <div className="p-3 rounded-lg bg-slate-900 border-l-4 border-teal text-xs text-slate-200">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-teal-400 block mb-0.5">
                            Evaluated Copy / Statement:
                          </span>
                          "{claim.claim_text}"
                        </div>

                        {/* Issue Explanation */}
                        <div className="text-xs text-slate-300 leading-relaxed">
                          <strong className="text-white">Regulatory Issue & Risk:</strong> {claim.issue_explanation}
                        </div>

                        {/* Suggested Correction & Content Owner Question */}
                        {claim.suggested_correction && (
                          <div className="p-3 rounded-lg bg-[#14213d]/60 border border-slate-800 text-xs space-y-1">
                            <span className="font-semibold text-teal-300 flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-teal" /> Suggested Corrective Wording:
                            </span>
                            <p className="text-slate-200">{claim.suggested_correction}</p>
                          </div>
                        )}

                        {claim.question_for_content_owner && (
                          <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs text-slate-300 flex items-start gap-2">
                            <HelpCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                            <div>
                              <strong className="text-amber-300">Question for Content Owner:</strong>{" "}
                              {claim.question_for_content_owner}
                            </div>
                          </div>
                        )}

                        {/* Expandable Citations Drawer */}
                        <div>
                          <button
                            onClick={() => setExpandedClaimId(isExpanded ? null : claim.id)}
                            className="text-xs text-teal-400 hover:text-teal-300 font-medium flex items-center gap-1 mt-1"
                          >
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            {isExpanded ? "Hide Statutory Citations" : `View Authoritative Citations (${claim.supporting_citations.length})`}
                          </button>

                          {isExpanded && (
                            <div className="mt-3 space-y-2 pt-3 border-t border-slate-800">
                              {claim.supporting_citations.map((src, idx) => (
                                <div
                                  key={idx}
                                  className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 text-xs space-y-1.5"
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="font-bold text-white flex items-center gap-1.5">
                                      <BookOpen className="w-3.5 h-3.5 text-teal" />
                                      {src.citation} — {src.title}
                                    </span>
                                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 font-mono">
                                      {src.authority_level.replace(/_/g, " ")}
                                    </span>
                                  </div>
                                  <div className="text-[11px] text-slate-400">
                                    Authority: {src.issuing_authority} | Jurisdiction: {src.jurisdiction}
                                  </div>
                                  <blockquote className="p-2 rounded bg-slate-950 border-l-2 border-teal/60 text-slate-300 italic text-[11px]">
                                    "{src.excerpt}"
                                  </blockquote>
                                  {src.source_url && (
                                    <a
                                      href={src.source_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-[11px] text-teal-400 hover:underline flex items-center gap-1 inline-block mt-0.5"
                                    >
                                      Official Statute Link <ExternalLink className="w-3 h-3 inline" />
                                    </a>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* TAB 3: SUGGESTED REVISIONS */}
        {activeTab === "revisions" && (
          <div className="space-y-6">
            {!reviewReport || reviewReport.suggested_wording_revisions.length === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800 space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                <h3 className="text-base font-semibold text-slate-300">No Revisions Needed</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  The evaluated draft did not trigger statutory prohibitions requiring conservative rewording.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300 flex items-start gap-3">
                  <Info className="w-4 h-4 text-teal shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white">Conservative Revision Governance:</strong> Inkloom AI provides
                    suggested rewording that eliminates legal liability while preserving the core marketing value
                    proposition. Suggested revisions are marked as <span className="text-amber-400 font-semibold">AI-generated and unapproved</span>{" "}
                    until applied by an authorized human user.
                  </div>
                </div>

                <div className="space-y-4">
                  {reviewReport.suggested_wording_revisions.map((rev) => (
                    <div
                      key={rev.id}
                      className="rounded-xl bg-[#0F172A] border border-slate-800 p-6 space-y-4 shadow-sm"
                    >
                      {/* Diff Comparison Side-by-Side */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Original Wording */}
                        <div className="p-4 rounded-lg bg-rose-950/20 border border-rose-900/40 space-y-2">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400 block">
                            Original Proposed Wording:
                          </span>
                          <p className="text-xs text-slate-300 leading-relaxed font-sans">{rev.original_text}</p>
                        </div>

                        {/* Proposed Conservative Wording */}
                        <div className="p-4 rounded-lg bg-emerald-950/20 border border-emerald-900/40 space-y-2">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 block">
                            Proposed Conservative Wording:
                          </span>
                          <p className="text-xs text-slate-200 leading-relaxed font-sans font-medium">
                            {rev.proposed_text}
                          </p>
                        </div>
                      </div>

                      {/* Explanation & Rationale */}
                      <div className="text-xs text-slate-300 space-y-1.5 pt-2 border-t border-slate-800">
                        <div>
                          <strong className="text-white">Material Change:</strong> {rev.material_change_explanation}
                        </div>
                        <div>
                          <strong className="text-teal-300">Statutory Rationale:</strong>{" "}
                          {rev.supporting_evidence_rationale}
                        </div>
                        {rev.remaining_assumptions.length > 0 && (
                          <div className="text-slate-400">
                            <strong>Remaining Assumptions:</strong> {rev.remaining_assumptions.join("; ")}
                          </div>
                        )}
                      </div>

                      {/* Action Button */}
                      <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                        <span className="text-[11px] text-amber-300/80 flex items-center gap-1 font-mono">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                          AI-generated draft proposal • Requires explicit user confirmation
                        </span>

                        <div className="flex gap-2">
                          <button
                            onClick={() => copyToClipboard(rev.proposed_text, rev.id)}
                            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 border border-slate-700 flex items-center gap-1.5"
                          >
                            {copiedId === rev.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            {copiedId === rev.id ? "Copied" : "Copy Wording"}
                          </button>

                          <button
                            onClick={() => handleApplyRevision(rev)}
                            disabled={isApplyingRevision}
                            className="px-4 py-1.5 rounded-lg bg-teal hover:bg-teal-600 disabled:opacity-50 text-xs font-semibold text-white flex items-center gap-1.5 shadow-sm"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            Apply as Draft v+1
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: STATUTORY SOURCES REGISTER */}
        {activeTab === "sources" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-teal" />
                  Authoritative Statutory & Regulatory Register
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Pre-configured, verified statutory baseline covering US, EU, UK, Canada, and internal company policies.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Jurisdiction:</span>
                <select
                  value={sourceFilterJurisdiction}
                  onChange={(e) => {
                    setSourceFilterJurisdiction(e.target.value);
                    loadSources();
                  }}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200"
                >
                  <option value="all">All Jurisdictions</option>
                  <option value="US">United States (FTC / Lanham)</option>
                  <option value="EU">European Union (AI Act / UCPD)</option>
                  <option value="UK">United Kingdom (CPRs / CMA)</option>
                  <option value="CA">Canada (Competition Act)</option>
                  <option value="Global">Internal Company Policy (Global)</option>
                </select>
              </div>
            </div>

            {loadingSources ? (
              <div className="p-12 text-center text-xs text-slate-400">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-teal" />
                Loading authoritative sources...
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sourcesList.map((src) => (
                  <div
                    key={src.source_id}
                    className="p-5 rounded-xl bg-[#0F172A] border border-slate-800 hover:border-slate-700 transition-all space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-xs font-bold text-white flex items-center gap-1.5">
                          {src.citation}
                        </span>
                        <p className="text-xs text-teal-300 mt-0.5 font-medium">{src.title}</p>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          src.is_binding
                            ? "bg-rose-950/80 text-rose-300 border border-rose-800"
                            : "bg-blue-950/80 text-blue-300 border border-blue-800"
                        }`}
                      >
                        {src.authority_level.replace(/_/g, " ")}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400 flex flex-wrap gap-x-4 gap-y-1">
                      <span>Authority: <strong className="text-slate-300">{src.issuing_authority}</strong></span>
                      <span>Jurisdiction: <strong className="text-slate-300">{src.jurisdiction}</strong></span>
                      {src.publication_or_effective_date && (
                        <span>Effective: <strong className="text-slate-300">{src.publication_or_effective_date}</strong></span>
                      )}
                    </div>

                    <blockquote className="p-3 rounded-lg bg-slate-950/80 border-l-2 border-teal text-slate-300 text-xs italic leading-relaxed">
                      "{src.excerpt}"
                    </blockquote>

                    {src.source_url && (
                      <div className="pt-2 border-t border-slate-800/80">
                        <a
                          href={src.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-teal-400 hover:underline flex items-center gap-1"
                        >
                          Official Publication Document <ExternalLink className="w-3 h-3 inline" />
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: 10-SECTION LEGAL AUDIT REPORT */}
        {activeTab === "report" && (
          <div className="space-y-6">
            {!reviewReport ? (
              <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800 space-y-2">
                <FileText className="w-10 h-10 text-slate-600 mx-auto" />
                <h3 className="text-base font-semibold text-slate-300">No Report Generated Yet</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Execute a compliance review in the Intake tab to view the full 10-section structured legal report.
                </p>
              </div>
            ) : (
              <div className="p-8 rounded-2xl bg-[#0F172A] border border-slate-800 space-y-8 font-sans">
                {/* Report Header */}
                <div className="border-b border-slate-800 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-teal-400">
                      Inkloom AI Decision-Support Assessment
                    </span>
                    <h2 className="text-xl font-bold text-white mt-1">Evidence-Grounded Legal Compliance Report</h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Report ID: <span className="font-mono text-slate-300">{reviewReport.report_id}</span> • Date:{" "}
                      {reviewReport.review_date}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={exportReportJson}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      JSON
                    </button>
                    <button
                      onClick={exportReportMarkdown}
                      className="px-3 py-1.5 rounded-lg bg-teal hover:bg-teal-600 text-xs font-semibold text-white flex items-center gap-1.5 shadow-sm"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Export Markdown Brief
                    </button>
                  </div>
                </div>

                {/* 1. Executive Summary */}
                <section className="space-y-2">
                  <h3 className="text-sm font-bold text-teal-300 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-teal/20 text-teal-400 text-xs flex items-center justify-center font-mono">1</span>
                    Executive Summary & Overall Verdict
                  </h3>
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 leading-relaxed space-y-2">
                    <p>{reviewReport.executive_summary}</p>
                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                      <span>Overall Risk Verdict: <strong className="text-white">{reviewReport.overall_risk_verdict}</strong></span>
                      <span>Compliance Score: <strong className="text-teal-300">{reviewReport.compliance_score}/100</strong></span>
                    </div>
                  </div>
                </section>

                {/* 2. Content & Campaign Context */}
                <section className="space-y-2">
                  <h3 className="text-sm font-bold text-teal-300 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-teal/20 text-teal-400 text-xs flex items-center justify-center font-mono">2</span>
                    Content & Campaign Context
                  </h3>
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Product / Service:</span>
                      <span className="text-slate-200 font-medium">{reviewReport.campaign_context.product_name || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Intended Audience:</span>
                      <span className="text-slate-200 font-medium">{reviewReport.campaign_context.intended_audience || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Marketing Channel:</span>
                      <span className="text-slate-200 font-medium">{reviewReport.campaign_context.marketing_channel || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Regulated Category:</span>
                      <span className="text-slate-200 font-medium">{reviewReport.campaign_context.regulated_category || "N/A"}</span>
                    </div>
                  </div>
                </section>

                {/* 3. Jurisdictions & Assumptions Considered */}
                <section className="space-y-2">
                  <h3 className="text-sm font-bold text-teal-300 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-teal/20 text-teal-400 text-xs flex items-center justify-center font-mono">3</span>
                    Jurisdictions & Assumptions Considered
                  </h3>
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 space-y-2">
                    <div>
                      <span className="font-semibold text-white">Target Jurisdiction:</span>{" "}
                      {reviewReport.jurisdictions_and_assumptions.target_jurisdiction}
                    </div>
                    <div>
                      <span className="font-semibold text-white">Assumptions Made:</span>
                      <ul className="list-disc list-inside mt-1 space-y-0.5 text-slate-400">
                        {reviewReport.jurisdictions_and_assumptions.assumptions_made.map((a, i) => (
                          <li key={i}>{a}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </section>

                {/* 4. High-Priority Potential Risks */}
                <section className="space-y-2">
                  <h3 className="text-sm font-bold text-rose-400 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-rose-950 text-rose-300 text-xs flex items-center justify-center font-mono">4</span>
                    High-Priority Potential Risks
                  </h3>
                  <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-900/40 text-xs text-rose-200 space-y-2">
                    {reviewReport.high_priority_risks.map((risk, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                        <span>{risk}</span>
                      </div>
                    ))}
                  </div>
                </section>

                {/* 5. Claim-by-Claim Analysis */}
                <section className="space-y-2">
                  <h3 className="text-sm font-bold text-teal-300 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-teal/20 text-teal-400 text-xs flex items-center justify-center font-mono">5</span>
                    Claim-by-Claim Analysis Matrix
                  </h3>
                  <div className="space-y-3">
                    {reviewReport.claims_analysis.map((claim, idx) => (
                      <div key={idx} className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-white">Claim #{idx + 1}: "{claim.claim_text}"</span>
                          <span className="font-mono text-amber-300 uppercase text-[10px]">{claim.severity} Triage</span>
                        </div>
                        <p className="text-slate-300">{claim.issue_explanation}</p>
                        {claim.suggested_correction && (
                          <p className="text-teal-300 font-medium">Suggestion: {claim.suggested_correction}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </section>

                {/* 6. Source & Evidence Register */}
                <section className="space-y-2">
                  <h3 className="text-sm font-bold text-teal-300 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-teal/20 text-teal-400 text-xs flex items-center justify-center font-mono">6</span>
                    Source & Evidence Register
                  </h3>
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-2">
                    {reviewReport.authoritative_sources_register.map((s, idx) => (
                      <div key={idx} className="flex items-center justify-between text-slate-300 py-1 border-b border-slate-800/60 last:border-0">
                        <span>{s.citation} — {s.title}</span>
                        <span className="text-[11px] text-slate-400 font-mono">{s.issuing_authority}</span>
                      </div>
                    ))}
                  </div>
                </section>

                {/* 7. Suggested Wording Changes */}
                <section className="space-y-2">
                  <h3 className="text-sm font-bold text-teal-300 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-teal/20 text-teal-400 text-xs flex items-center justify-center font-mono">7</span>
                    Suggested Conservative Wording Changes
                  </h3>
                  <div className="space-y-2">
                    {reviewReport.suggested_wording_revisions.map((rev, idx) => (
                      <div key={idx} className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs space-y-1">
                        <p className="text-rose-300 line-through">"{rev.original_text}"</p>
                        <p className="text-emerald-300 font-medium">"{rev.proposed_text}"</p>
                      </div>
                    ))}
                  </div>
                </section>

                {/* 8. Missing Evidence & Questions */}
                <section className="space-y-2">
                  <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-950 text-amber-300 text-xs flex items-center justify-center font-mono">8</span>
                    Missing Evidence & Unanswered Questions
                  </h3>
                  <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-900/40 text-xs text-amber-200 space-y-1.5">
                    {reviewReport.missing_evidence_and_questions.map((q, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <HelpCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                        <span>{q}</span>
                      </div>
                    ))}
                  </div>
                </section>

                {/* 9. Items Requiring In-House Legal Review */}
                <section className="space-y-2">
                  <h3 className="text-sm font-bold text-teal-300 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-teal/20 text-teal-400 text-xs flex items-center justify-center font-mono">9</span>
                    Items Requiring Qualified Legal Review
                  </h3>
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 space-y-1.5">
                    {reviewReport.items_requiring_human_legal_counsel.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <Gavel className="w-3.5 h-3.5 text-teal shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </section>

                {/* 10. Limitations & Disclaimers */}
                <section className="space-y-2">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 text-xs flex items-center justify-center font-mono">10</span>
                    Limitations & Formal Legal Notice
                  </h3>
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
                    {reviewReport.limitations_and_disclaimers}
                  </div>
                </section>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Human Counsel Sign-off Modal */}
      {showDecisionModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-[#0F172A] border border-slate-700 p-6 space-y-4 shadow-xl text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Gavel className="w-4 h-4 text-teal" />
                Record Legal Counsel Determination
              </h3>
              <button
                onClick={() => setShowDecisionModal(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Determination Action</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setDecisionAction("approve")}
                    className={`py-2 rounded-lg font-semibold border transition-colors ${
                      decisionAction === "approve"
                        ? "bg-emerald-600 text-white border-emerald-500"
                        : "bg-slate-900 text-slate-400 border-slate-700 hover:text-white"
                    }`}
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => setDecisionAction("request_changes")}
                    className={`py-2 rounded-lg font-semibold border transition-colors ${
                      decisionAction === "request_changes"
                        ? "bg-amber-600 text-white border-amber-500"
                        : "bg-slate-900 text-slate-400 border-slate-700 hover:text-white"
                    }`}
                  >
                    Request Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => setDecisionAction("reject")}
                    className={`py-2 rounded-lg font-semibold border transition-colors ${
                      decisionAction === "reject"
                        ? "bg-rose-600 text-white border-rose-500"
                        : "bg-slate-900 text-slate-400 border-slate-700 hover:text-white"
                    }`}
                  >
                    Reject Draft
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">In-House Counsel Feedback / Notes</label>
                <textarea
                  rows={3}
                  value={decisionComments}
                  onChange={(e) => setDecisionComments(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-teal"
                  placeholder="Explain legal reasoning, statutory interpretations, or compliance requirements..."
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Conditions or Stipulations (One per line)
                </label>
                <textarea
                  rows={2}
                  value={decisionStipulations}
                  onChange={(e) => setDecisionStipulations(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-teal"
                  placeholder="e.g. Include SLA asterisk disclosure footnote in minimum 10pt font&#10;Verify benchmark protocol is dated within 12 months"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowDecisionModal(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitDecision}
                disabled={isSubmittingDecision}
                className="px-4 py-1.5 rounded-lg bg-teal hover:bg-teal-600 disabled:opacity-50 text-xs font-semibold text-white shadow-sm flex items-center gap-1.5"
              >
                {isSubmittingDecision ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Recording...
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" /> Sign & Record in Audit Ledger
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
