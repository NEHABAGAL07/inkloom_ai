/**
 * Shared Brand Governance Audit Result TypeScript Contract
 * Conforms 1:1 to contracts/audit-result.schema.json
 */

export type OverallAuditStatus = "compliant" | "needs_review" | "non_compliant" | "error";

export type FindingCategory =
  | "tone_voice"
  | "terminology"
  | "claim_verification"
  | "visual_brand"
  | "accessibility"
  | "editorial_standards"
  | "legal_compliance"
  | "marketing_quality"
  | "cross_rule_conflict";

export type FindingSeverity = "critical" | "high" | "medium" | "low" | "info";

export type FindingStatus = "open" | "accepted" | "dismissed" | "manual_check_required";

export type VerificationStatus = "verified" | "unverified" | "contradicted" | "not_applicable" | "supported" | "unavailable";

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FindingLocation {
  page_number?: number;
  line_number?: number;
  start_char?: number;
  end_char?: number;
  timestamp_seconds?: number;
  bounding_box?: BoundingBox;
}

export interface SourceReference {
  guideline_id?: string;
  section?: string;
  rule_name: string;
  source_url?: string | null;
  is_external?: boolean;
  verification_status: VerificationStatus;
}

export interface SuggestedCorrection {
  replacement_text: string;
  rationale: string;
  preserves_intent?: boolean;
}

export interface Finding {
  id: string;
  category: FindingCategory;
  severity: FindingSeverity;
  title: string;
  message: string;
  evidence?: string | null;
  source_reference?: SourceReference | null;
  confidence: number; // 0.0 to 1.0
  suggested_correction?: SuggestedCorrection | null;
  status: FindingStatus;
  location?: FindingLocation | null;
  requires_human_review: boolean;

  // Extended Phase 2 Evidence & Provenance Fields
  original_text?: string | null;
  explanation?: string | null;
  rule_reference?: string | null;
  evidence_status?: string | null;
  evidence_references?: string[];
  jurisdiction?: string | null;
  correction_rationale?: string | null;
  review_required?: boolean;
  limitations?: string | null;
  alternative_punchlines?: Array<{ text: string; rationale: string; trade_off?: string }> | null;
}

export interface AuditSummary {
  compliance_score: number; // 0 to 100
  total_findings: number;
  critical_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
  info_count: number;
  human_review_required: boolean;
  verdict_overview?: string;
}

export interface EngineMetadata {
  engine_version: string;
  execution_time_ms: number;
  modules_executed: string[];
  models_used?: string[];
  warnings?: string[];
  [key: string]: unknown;
}

export interface AuditResult {
  schema_version: string;
  audit_id: string;
  content_id: string;
  revision_id?: string | null;
  overall_status: OverallAuditStatus;
  summary: AuditSummary;
  findings: Finding[];
  created_at: string; // ISO 8601
  engine_metadata: EngineMetadata;
}
