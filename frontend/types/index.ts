export * from "./audit";

export interface ContentSubmission {
  id: string;
  organization_id: string;
  creator_id?: string;
  title: string;
  description?: string;
  content_type: "text" | "document" | "image" | "video";
  status:
    | "draft"
    | "submitted"
    | "auditing"
    | "changes_requested"
    | "resubmitted"
    | "pending_approval"
    | "approved"
    | "rejected";
  current_revision_id?: string;
  created_at: string;
  updated_at: string;
}

export interface ContentRevision {
  id: string;
  submission_id: string;
  version_number: number;
  raw_text?: string;
  file_name?: string;
  file_size_bytes?: number;
  created_at: string;
}

export type ReviewAction = "approve" | "reject" | "request_changes";

export interface ReviewDecision {
  id: string;
  submission_id: string;
  revision_id?: string;
  reviewer_id?: string;
  action: ReviewAction;
  comments?: string;
  created_at: string;
}

export interface BrandGuideline {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  version: string;
  is_active: boolean;
  rules?: GuidelineRule[];
}

export interface GuidelineRule {
  id: string;
  category: string;
  rule_name: string;
  section?: string;
  severity_default: string;
  rule_definition: Record<string, any>;
  requires_human_review: boolean;
  source_url?: string;
}

export interface ApprovedAsset {
  id: string;
  organization_id: string;
  name: string;
  asset_type: "logo" | "color_palette" | "typography" | "verified_claim" | "boilerplate";
  file_url?: string;
  specifications: Record<string, any>;
  is_active: boolean;
  is_approved?: boolean;
  created_at?: string;
}

export interface AnalyticsSummary {
  total_submissions: number;
  pending_reviews: number;
  average_compliance_score: number;
  overall_compliance_rate: number;
  top_violations: { category: string; count: number; percentage: number }[];
  compliance_trends: { date: string; average_compliance_score: number; total_audits: number }[];
  recent_activity_count: number;
}

export interface User {
  id: string;
  email: string;
  full_name?: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  industry?: string;
  description?: string;
  website?: string;
  is_active: boolean;
  created_at?: string;
}

export interface OrgMembership {
  organization_id: string;
  organization_name: string;
  organization_slug: string;
  role: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
  active_organization_id: string;
  active_role: string;
  memberships: OrgMembership[];
}

export interface MemberInfo {
  user_id: string;
  email: string;
  full_name?: string;
  role: string;
  joined_at: string;
}

export interface Invitation {
  id: string;
  email: string;
  role: string;
  token: string;
  invite_url: string;
  expires_at: string;
  is_revoked: boolean;
  created_at: string;
}

export interface PublicInvitation {
  token: string;
  email: string;
  role: string;
  organization_id: string;
  organization_name: string;
  is_valid: boolean;
  expires_at: string;
}
