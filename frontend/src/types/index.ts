export interface FindingItem {
  id: string;
  category: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  original_text?: string;
  explanation: string;
  evidence_status?: string;
  suggestion?: string;
}

export interface AuditResult {
  audit_id: string;
  content_id: string;
  content_version: number;
  guideline_id?: string;
  overall_score: number;
  status: string;
  created_at: string;
  findings: FindingItem[];
}

export interface ContentItem {
  content_id: string;
  title: string;
  content_type: 'text' | 'document' | 'image' | 'video';
  raw_text?: string;
  current_revision: number;
  status: 'draft' | 'submitted' | 'auditing' | 'changes_requested' | 'resubmitted' | 'pending_approval' | 'approved' | 'rejected' | string;
  organization_id: string;
  author_id?: string;
  created_at: string;
  updated_at: string;
}

export interface ContentVersionItem {
  version_number: number;
  text: string;
  change_summary?: string;
  created_at: string;
}

export interface ContentHistory {
  content_id: string;
  title: string;
  current_revision: number;
  status: string;
  versions: ContentVersionItem[];
}

export interface BrandRule {
  id: string;
  title: string;
  description: string;
  category: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  prohibited_phrases?: string[];
  required_phrases?: string[];
}

export interface BrandGuideline {
  id: string;
  organization_id: string;
  name: string;
  category: string;
  version: string;
  is_active: boolean;
  created_at: string;
  rules: BrandRule[];
}

export interface VerifiedFact {
  id: string;
  organization_id: string;
  claim_text: string;
  source_url?: string;
  confidence_score: number;
  status: string;
  created_at: string;
}

export interface ReviewDecision {
  review_id: string;
  content_id: string;
  revision_id: number;
  action: 'approved' | 'rejected' | 'changes_requested';
  status: string;
  reviewer_id: string;
  comments?: string;
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
