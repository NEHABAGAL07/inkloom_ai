/**
 * Inkloom AI - Deterministic Mock API Service
 * Used for frontend standalone development, design previews, and testing.
 * Strict conformance with `contracts/audit-result.schema.json`.
 */

import {
  AuditResult,
  ContentSubmission,
  ReviewQueueItem,
  ReviewDecisionPayload,
  AnalyticsSummary,
  BrandGuideline,
  WorkflowState,
} from '../types/audit';

export const MOCK_AUDIT_RESULT: AuditResult = {
  schema_version: '1.0.0',
  audit_id: '7f8b9a10-2c3d-4e5f-8a9b-0c1d2e3f4a5b',
  content_id: 'cnt-demo-001',
  overall_status: 'warning',
  summary:
    'Mock Audit Result (Demonstration Only): Content exhibits 3 findings across terminology, claim verification, and tone standards. Final publication approval requires designated human review.',
  findings: [
    {
      id: 'fnd-001',
      category: 'terminology',
      severity: 'medium',
      title: 'Brand Name Capitalization Inconsistency',
      message:
        "Product name 'inkloom' is written in lowercase without proper camel-case styling specified in brand identity guidelines.",
      evidence: 'Try inkloom today for best-in-class workflows.',
      source_reference: 'Brand Identity Guidelines v2.4, Section 3.1: Naming & Trademarks',
      confidence: 0.99,
      suggested_correction: 'Try Inkloom AI today for best-in-class workflows.',
      status: 'flagged',
      location: {
        start_offset: 4,
        end_offset: 11,
        line: 1,
        page: 1,
      },
      requires_human_review: false,
    },
    {
      id: 'fnd-002',
      category: 'claim_verification',
      severity: 'high',
      title: 'Unsubstantiated Performance Claim',
      message:
        "Superlative claim '100% error-free guarantee' lacks verifiable empirical proof in the corporate claim registry and exposes marketing to regulatory challenge.",
      evidence: 'Our system delivers a 100% error-free guarantee across all media.',
      source_reference: null,
      confidence: 0.94,
      suggested_correction:
        'Our system delivers rigorous, multi-stage compliance verification across all media.',
      status: 'flagged',
      location: {
        start_offset: 23,
        end_offset: 48,
        line: 3,
        page: 1,
      },
      requires_human_review: true,
    },
    {
      id: 'fnd-003',
      category: 'tone_and_voice',
      severity: 'low',
      title: 'Colloquial Phrasing in Enterprise Copy',
      message:
        "Use of colloquial filler 'super pumped' deviates from our professional and authoritative enterprise brand voice standard.",
      evidence: 'We are super pumped to announce this capability.',
      source_reference:
        'Editorial Voice & Tone Standard v1.2, Principle 2: Authoritative yet Accessible',
      confidence: 0.88,
      suggested_correction: 'We are proud to announce this capability.',
      status: 'flagged',
      location: {
        start_offset: 7,
        end_offset: 19,
        line: 5,
        page: 1,
      },
      requires_human_review: false,
    },
  ],
  created_at: new Date().toISOString(),
  engine_metadata: {
    engine_version: 'inkloom-mock-engine-v1.0.0',
    execution_time_ms: 120.0,
    rules_checked_count: 48,
    ai_model_used: null,
    extractors_used: ['plain_text_extractor'],
  },
};

export const MockApiService = {
  async getRecentAudits(): Promise<AuditResult[]> {
    return [MOCK_AUDIT_RESULT];
  },

  async getAuditById(auditId: string): Promise<AuditResult> {
    return { ...MOCK_AUDIT_RESULT, audit_id: auditId };
  },

  async submitContent(data: {
    title: string;
    raw_text?: string;
    content_type: 'text' | 'document' | 'image' | 'video';
  }): Promise<ContentSubmission> {
    return {
      id: `cnt-${Date.now()}`,
      organization_id: 'org-inkloom-demo-001',
      workspace_id: 'ws-main-001',
      author_id: 'usr-dev-reviewer-001',
      title: data.title,
      content_type: data.content_type,
      current_status: 'submitted',
      current_revision_num: 1,
      raw_text: data.raw_text,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  },

  async runAudit(contentId: string): Promise<AuditResult> {
    return {
      ...MOCK_AUDIT_RESULT,
      content_id: contentId,
      audit_id: `aud-${Date.now()}`,
    };
  },

  async getReviewQueue(): Promise<ReviewQueueItem[]> {
    return [
      {
        content_id: 'cnt-demo-001',
        title: 'Q4 Global Launch Collateral',
        author_email: 'creator@example.com',
        workflow_status: 'pending_approval',
        findings_count: 3,
        submitted_at: '2026-10-22T10:15:00Z',
        requires_action: true,
      },
      {
        content_id: 'cnt-demo-002',
        title: 'Social Media Banner Campaign',
        author_email: 'social@example.com',
        workflow_status: 'changes_requested',
        findings_count: 1,
        submitted_at: '2026-10-22T11:45:00Z',
        requires_action: false,
      },
      {
        content_id: 'cnt-demo-003',
        title: 'Enterprise Security Whitepaper',
        author_email: 'content@example.com',
        workflow_status: 'approved',
        findings_count: 0,
        submitted_at: '2026-10-22T08:30:00Z',
        requires_action: false,
      },
    ];
  },

  async submitReviewDecision(
    payload: ReviewDecisionPayload
  ): Promise<{ status: string; new_state: WorkflowState }> {
    let newState: WorkflowState = 'pending_approval';
    if (payload.action === 'approve') newState = 'approved';
    if (payload.action === 'reject') newState = 'rejected';
    if (payload.action === 'request_changes') newState = 'changes_requested';

    return {
      status: 'success',
      new_state: newState,
    };
  },

  async getAnalyticsSummary(): Promise<AnalyticsSummary> {
    return {
      compliance_rate_pct: 87.4,
      total_audits_conducted: 342,
      pending_human_reviews: 8,
      approved_this_month: 156,
      top_violation_categories: [
        { category: 'Terminology', count: 78, pct: 42.1 },
        { category: 'Claim Verification', count: 54, pct: 29.2 },
        { category: 'Tone & Voice', count: 35, pct: 18.9 },
        { category: 'Visual Compliance', count: 18, pct: 9.8 },
      ],
      average_review_turnaround_hours: 3.2,
    };
  },

  async getGuidelines(): Promise<BrandGuideline[]> {
    return [
      {
        id: 'gd-brand-voice',
        name: 'Brand Voice & Editorial Standards',
        category: 'tone_and_voice',
        version: '2.4',
        description: 'Authoritative, accessible corporate voice standards avoiding hyperbole.',
        is_active: true,
        rules_count: 12,
      },
      {
        id: 'gd-legal-claims',
        name: 'Legal Substantiation & Claim Standards',
        category: 'claim_verification',
        version: '3.0',
        description: 'Mandatory empirical proof rules for promotional statements and superlative claims.',
        is_active: true,
        rules_count: 8,
      },
      {
        id: 'gd-brand-naming',
        name: 'Trademark & Naming Conventions',
        category: 'terminology',
        version: '1.5',
        description: 'Approved brand asset naming, capitalization, and trademark annotations.',
        is_active: true,
        rules_count: 16,
      },
    ];
  },
};
