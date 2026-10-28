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

export type KnowledgeSourceType =
  | 'legislation'
  | 'regulation'
  | 'official_guidance'
  | 'internal_company_policy'
  | 'model_generated_explanation'
  | 'verified_fact'
  | 'certified_claim'
  | 'brand_rule'
  | 'asset_metadata';

export type KnowledgeCategory =
  | 'legal_compliance'
  | 'claim_verification'
  | 'tone_voice'
  | 'terminology'
  | 'visual_brand'
  | 'accessibility'
  | 'editorial_standards'
  | 'product_specification';

export type EvidenceStatus = 'supported' | 'contradicted' | 'unverified' | 'unavailable';

export type RuleApplicability = 'applicable' | 'not_applicable' | 'uncertain' | 'conflicting_requirements';

export type RulePriorityType =
  | 'legal_mandatory'
  | 'legal_policy'
  | 'brand_standard'
  | 'campaign_rule'
  | 'advisory';

export type VerificationStatus =
  | 'verified'
  | 'unverified'
  | 'contradicted'
  | 'requires_legal_review'
  | 'overdue_for_review';

export interface ProvenanceRecord {
  source_id: string;
  source_type: KnowledgeSourceType;
  title: string;
  authoritative_source?: string;
  responsible_owner?: string;
  source_reference?: string;
  source_url?: string;
  jurisdiction: string;
  version: string;
  effective_date?: string;
  publication_date?: string;
  verification_status: VerificationStatus;
  verified_by?: string;
  verified_at?: string;
  is_binding: boolean;
}

export interface KnowledgeItem {
  id: string;
  organization_id: string;
  source_type: KnowledgeSourceType;
  category: KnowledgeCategory;
  title: string;
  description?: string;
  content_payload: Record<string, any>;
  source_reference?: string;
  source_url?: string;
  jurisdiction: string;
  industry: string;
  content_channels?: string[];
  publication_date?: string;
  effective_date?: string;
  review_date?: string;
  version: string;
  rule_type: RulePriorityType;
  priority_level: number;
  authoritative_source?: string;
  responsible_owner?: string;
  verification_status: VerificationStatus;
  evidence_status: EvidenceStatus;
  verified_by?: string;
  verified_at?: string;
  verification_rationale?: string;
  is_active: boolean;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

export interface BrandAssetContext {
  asset_id: string;
  asset_name: string;
  asset_type: string;
  file_url?: string;
  file_path?: string;
  specifications: Record<string, any>;
  is_active: boolean;
  provenance: ProvenanceRecord;
}

export interface BrandRuleContext {
  rule_id: string;
  category: string;
  rule_name: string;
  section?: string;
  severity_default: string;
  rule_type: RulePriorityType;
  priority_level: number;
  rule_definition: Record<string, any>;
  applicability: RuleApplicability;
  applicability_reason?: string;
  provenance: ProvenanceRecord;
}

export interface VerifiedFactContext {
  fact_id: string;
  claim_key: string;
  statement: string;
  evidence_status: EvidenceStatus;
  metric_limits?: Record<string, any>;
  provenance: ProvenanceRecord;
}

export interface LegalSourceContext {
  source_id: string;
  legal_type: KnowledgeSourceType;
  citation?: string;
  jurisdiction: string;
  title: string;
  summary?: string;
  is_binding: boolean;
  effective_date?: string;
  provenance: ProvenanceRecord;
}

export interface RuleConflictDetail {
  conflict_id: string;
  higher_priority_rule: string;
  higher_priority_level: number;
  higher_priority_source: string;
  lower_priority_rule: string;
  lower_priority_level: number;
  lower_priority_source: string;
  category: string;
  explanation: string;
  escalate_to_human: boolean;
  remediation_suggestion?: string;
  higher_priority_provenance?: ProvenanceRecord;
  lower_priority_provenance?: ProvenanceRecord;
}

export interface SharedAIContext {
  context_id: string;
  timestamp: string;
  organization: {
    organization_id: string;
    organization_name: string;
    industry: string;
    jurisdiction: string;
    permitted_channels: string[];
  };
  user: {
    user_id: string;
    role: string;
    email?: string;
    allowed_operations: string[];
  };
  content?: {
    submission_id: string;
    revision_id?: string;
    version_number: number;
    content_type: string;
    raw_text?: string;
    media_metadata: Record<string, any>;
    file_name?: string;
  };
  untrusted_content?: {
    raw_content: string;
    sanitized_content: string;
    source_identifier: string;
    detected_injection_attempts: string[];
    isolated_xml_block: string;
  };
  applicable_rules: BrandRuleContext[];
  verified_facts: VerifiedFactContext[];
  legal_sources: LegalSourceContext[];
  brand_assets: BrandAssetContext[];
  previous_findings: any[];
  reviewer_decisions: any[];
  conflicts_detected: RuleConflictDetail[];
  system_boundary_instructions: string;
}

export interface UnifiedRetrievalResultItem {
  id: string;
  source_type: string;
  category: string;
  title: string;
  summary_or_excerpt: string;
  provenance_reference?: string;
  source_url?: string;
  jurisdiction: string;
  priority_level: number;
  rule_type: string;
  verification_status: string;
  evidence_status: string;
  is_binding: boolean;
  relevance_score: number;
  responsible_owner?: string;
  metadata: Record<string, any>;
}

export interface UnifiedRetrievalResponse {
  organization_id: string;
  query?: string;
  total_matches: number;
  results: UnifiedRetrievalResultItem[];
  unavailable_evidence_requested: string[];
  search_timestamp: string;
}
