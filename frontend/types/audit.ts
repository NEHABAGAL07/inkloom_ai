/**
 * Inkloom AI - Shared Audit Contract Types
 * Strictly mirrors `contracts/audit-result.schema.json`
 */

export type AuditStatus = 'passed' | 'failed' | 'warning' | 'needs_human_review';

export type FindingCategory =
  | 'tone_and_voice'
  | 'terminology'
  | 'claim_verification'
  | 'visual_compliance'
  | 'accessibility'
  | 'prohibited_content'
  | 'legal_compliance';

export type FindingSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export type FindingStatus = 'flagged' | 'accepted' | 'dismissed' | 'escalated';

export type WorkflowState =
  | 'draft'
  | 'submitted'
  | 'auditing'
  | 'changes_requested'
  | 'resubmitted'
  | 'pending_approval'
  | 'approved'
  | 'rejected';

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FindingLocation {
  start_offset?: number | null;
  end_offset?: number | null;
  line?: number | null;
  page?: number | null;
  timestamp_seconds?: number | null;
  selector?: string | null;
  bounding_box?: BoundingBox | null;
}

export interface Finding {
  id: string;
  category: FindingCategory;
  severity: FindingSeverity;
  title: string;
  message: string;
  evidence: string | null;
  source_reference: string | null;
  confidence: number;
  suggested_correction: string | null;
  status: FindingStatus;
  location?: FindingLocation | null;
  requires_human_review: boolean;
}

export interface EngineMetadata {
  engine_version: string;
  execution_time_ms: number;
  rules_checked_count: number;
  ai_model_used?: string | null;
  extractors_used?: string[];
}

export interface AuditResult {
  schema_version: string;
  audit_id: string;
  content_id: string;
  overall_status: AuditStatus;
  summary: string;
  findings: Finding[];
  created_at: string;
  engine_metadata: EngineMetadata;
}

export interface ContentSubmission {
  id: string;
  organization_id: string;
  workspace_id: string;
  author_id: string;
  title: string;
  content_type: 'text' | 'document' | 'image' | 'video';
  current_status: WorkflowState;
  current_revision_num: number;
  created_at: string;
  updated_at: string;
  raw_text?: string;
}

export interface ReviewQueueItem {
  content_id: string;
  title: string;
  author_email: string;
  workflow_status: WorkflowState;
  findings_count: number;
  submitted_at: string;
  requires_action: boolean;
}

export interface ReviewDecisionPayload {
  content_id: string;
  revision_id: string;
  action: 'approve' | 'reject' | 'request_changes';
  comments: string;
}

export interface BrandGuideline {
  id: string;
  name: string;
  category: FindingCategory;
  version: string;
  description: string;
  is_active: boolean;
  rules_count: number;
}

export interface AnalyticsSummary {
  compliance_rate_pct: number;
  total_audits_conducted: number;
  pending_human_reviews: number;
  approved_this_month: number;
  top_violation_categories: Array<{
    category: string;
    count: number;
    pct: number;
  }>;
  average_review_turnaround_hours: number;
}
