/**
 * Inkloom AI — Core Frontend Type Definitions
 * Strictly matches the backend OpenAPI specification and contracts/audit-result.schema.json
 */

export type FindingCategory =
  | 'tone'
  | 'terminology'
  | 'factual_accuracy'
  | 'unsupported_claim'
  | 'visual_consistency'
  | 'accessibility';

export type SeverityLevel = 'low' | 'medium' | 'high' | 'critical';

export type EvidenceStatus = 'supported' | 'contradicted' | 'unverified' | 'unavailable';

export type WorkflowStatus =
  | 'draft'
  | 'in_audit'
  | 'pending_approval'
  | 'approved'
  | 'changes_requested'
  | 'rejected';

export type ReviewAction = 'approved' | 'changes_requested' | 'rejected' | 'approve' | 'request_changes' | 'reject';

export interface AuditFinding {
  id: string;
  category: FindingCategory;
  severity: SeverityLevel;
  original_text: string;
  explanation: string;
  guideline_id?: string | null;
  evidence_status: EvidenceStatus;
  suggestion?: string | null;
}

export interface AuditResult {
  audit_id: string;
  content_id: string;
  content_version: number;
  guideline_id?: string | null;
  guideline_version?: string | null;
  overall_score: number;
  status: string;
  findings: AuditFinding[];
  created_at: string;
  content_snippet?: string | null;
}

export interface ContentItem {
  content_id: string;
  title: string;
  content_type: 'text' | 'document' | 'image' | 'video';
  raw_text?: string;
  current_revision: number;
  status: WorkflowStatus;
  organization_id: string;
  author_id?: string;
  created_at: string;
  updated_at?: string;
}

export interface ContentVersion {
  version_number: number;
  text: string;
  change_summary?: string | null;
  created_at: string;
}

export interface ContentHistory {
  content_id: string;
  title: string;
  current_revision: number;
  status: WorkflowStatus;
  versions: ContentVersion[];
}

export interface BrandRule {
  id: string;
  title: string;
  description: string;
  category: FindingCategory;
  severity: SeverityLevel;
  prohibited_phrases?: string[];
  required_phrases?: string[];
}

export interface BrandGuideline {
  id: string;
  organization_id: string;
  name: string;
  category: string;
  version: string;
  rules: BrandRule[];
  is_active: boolean;
  created_at?: string;
}

export interface VerifiedFact {
  id: string;
  organization_id: string;
  claim_text: string;
  source_url?: string | null;
  confidence_score: number;
  status: 'verified' | 'pending' | 'disputed';
  created_at?: string;
}

export interface ReviewDecision {
  review_id: string;
  content_id: string;
  revision_id: number;
  action: ReviewAction;
  status: string;
  reviewer_id?: string | null;
  comments?: string | null;
  created_at: string;
}

export interface AnalyticsOverview {
  total_content_items: number;
  total_audits: number;
  approved_count: number;
  changes_requested_count: number;
  rejected_count: number;
  findings_by_severity: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  compliance_rate: number;
}

export interface HealthStatus {
  status: string;
  version: string;
  timestamp: string;
  database: string;
  environment: string;
}
