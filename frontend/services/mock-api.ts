/**
 * Deterministic Mock API Service
 * Conforms strictly to the ApiService interface and contracts/audit-result.example.json
 * Enables independent frontend development and testing without requiring live backend.
 */
import {
  AuditResult,
  ContentSubmission,
  ReviewDecision,
  BrandGuideline,
  ApprovedAsset,
  AnalyticsSummary,
  User,
  Organization,
  OrgMembership,
  AuthResponse,
  MemberInfo,
  Invitation,
  PublicInvitation,
} from "../types";

export interface CreateSubmissionInput {
  title: string;
  description?: string;
  content_type: "text" | "document" | "image" | "video";
  initial_text?: string;
}

export interface ReviewDecisionInput {
  submission_id: string;
  revision_id?: string;
  action: "approve" | "reject" | "request_changes";
  comments?: string;
}

export interface IApiService {
  getSubmissions(): Promise<ContentSubmission[]>;
  getSubmission(id: string): Promise<ContentSubmission>;
  createSubmission(data: CreateSubmissionInput): Promise<ContentSubmission>;
  triggerAudit(submissionId: string, revisionId?: string): Promise<AuditResult>;
  getAudit(auditId: string): Promise<AuditResult>;
  getPendingReviews(): Promise<ContentSubmission[]>;
  submitReviewDecision(data: ReviewDecisionInput): Promise<ReviewDecision>;
  getGuidelines(): Promise<BrandGuideline[]>;
  createGuideline(data: { name: string; description?: string; version?: string }): Promise<BrandGuideline>;
  getAssets(): Promise<ApprovedAsset[]>;
  getAnalyticsSummary(): Promise<AnalyticsSummary>;

  // Multi-Tenant Authentication & Workspaces
  login(email: string, password: string): Promise<AuthResponse>;
  register(data: { email: string; password: string; full_name: string; organization_name: string; industry?: string }): Promise<AuthResponse>;
  getCurrentUser(): Promise<{ user: User; active_organization_id: string; active_role: string; memberships: OrgMembership[] }>;
  getOrganizations(): Promise<Organization[]>;
  createOrganization(data: { name: string; industry?: string; description?: string; website?: string }): Promise<Organization>;
  getOrganization(orgId: string): Promise<Organization>;
  updateOrganization(orgId: string, data: Partial<Organization>): Promise<Organization>;
  getMembers(orgId: string): Promise<MemberInfo[]>;
  updateMemberRole(orgId: string, userId: string, role: string): Promise<MemberInfo>;
  removeMember(orgId: string, userId: string): Promise<void>;
  getInvitations(orgId: string): Promise<Invitation[]>;
  createInvitation(orgId: string, email: string, role: string): Promise<Invitation>;
  revokeInvitation(orgId: string, inviteId: string): Promise<void>;
  inspectInvitation(token: string): Promise<PublicInvitation>;
  acceptInvitation(data: { token: string; full_name: string; password: string }): Promise<AuthResponse>;
}

// In-memory deterministic mock state
const MOCK_AUDIT_RESULT: AuditResult = {
  schema_version: "1.0.0",
  audit_id: "7f8b3c10-9b4e-4f76-b6b8-6d8b688d6e90",
  content_id: "sub_9281729a",
  revision_id: "rev_001",
  overall_status: "needs_review",
  summary: {
    compliance_score: 74.5,
    total_findings: 4,
    critical_count: 0,
    high_count: 2,
    medium_count: 1,
    low_count: 1,
    info_count: 0,
    human_review_required: true,
    verdict_overview:
      "Content violates brand terminology rules with deprecated product names, makes an unverified performance claim regarding latency reductions, and exhibits overly aggressive sales tone in paragraph 2. Final human sign-off required prior to public release.",
  },
  findings: [
    {
      id: "find_001",
      category: "terminology",
      severity: "high",
      title: "Use of Deprecated Brand Name",
      message:
        "The phrase 'Inkloom Cloud Suite' has been deprecated in favor of 'Inkloom Governance Hub' as per Q1 2026 Naming Guidelines.",
      evidence: "Get started with the powerful Inkloom Cloud Suite today.",
      source_reference: {
        guideline_id: "guide_naming_2026",
        section: "Section 2.1: Product Portfolio Naming",
        rule_name: "Prohibited Deprecated Product Names",
        source_url: "https://brand.inkloom.internal/guidelines/naming-2026#sec-2-1",
        is_external: false,
        verification_status: "verified",
      },
      confidence: 0.98,
      suggested_correction: {
        replacement_text: "Inkloom Governance Hub",
        rationale: "Aligns with official 2026 enterprise brand architecture.",
        preserves_intent: true,
      },
      status: "open",
      location: {
        page_number: 1,
        line_number: 4,
        start_char: 32,
        end_char: 51,
      },
      requires_human_review: false,
    },
    {
      id: "find_002",
      category: "claim_verification",
      severity: "high",
      title: "Unverified Promotional Performance Claim",
      message:
        "Content asserts a '10x reduction in latency' without reference to certified internal benchmark or published customer whitepaper. This claim is unverified in the approved claims registry.",
      evidence: "experience a guaranteed 10x reduction in latency across all regions",
      source_reference: {
        guideline_id: "guide_claims_regulatory",
        section: "Rule C-04: Numerical Performance Claims",
        rule_name: "Mandatory Benchmark Citation for Quantitative Claims",
        source_url: null,
        is_external: false,
        verification_status: "unverified",
      },
      confidence: 0.92,
      suggested_correction: {
        replacement_text: "experience significant latency improvements validated in customer benchmark trials",
        rationale:
          "Replaces unsubstantiated absolute multiplier with verified qualified statement pending published test methodology.",
        preserves_intent: true,
      },
      status: "manual_check_required",
      location: {
        page_number: 1,
        line_number: 8,
        start_char: 11,
        end_char: 79,
      },
      requires_human_review: true,
    },
    {
      id: "find_003",
      category: "tone_voice",
      severity: "medium",
      title: "Overly Aggressive Sales Language",
      message:
        "Brand voice guidelines emphasize an empowering, transparent, and authoritative tone. Phrases like 'Hurry up before your competitors crush you' conflict with our collaborative persona.",
      evidence: "Hurry up before your competitors crush you and steal your market share.",
      source_reference: {
        guideline_id: "guide_voice_tone",
        section: "Pillar 1: Empowering, Never Fear-Inducing",
        rule_name: "Anti-FUD Messaging Policy",
        source_url: "https://brand.inkloom.internal/guidelines/tone#pillar-1",
        is_external: false,
        verification_status: "verified",
      },
      confidence: 0.89,
      suggested_correction: {
        replacement_text: "Stay ahead in brand compliance as the market rapidly evolves.",
        rationale: "Reframes fear-based incentive into constructive forward-looking value proposition.",
        preserves_intent: true,
      },
      status: "open",
      location: {
        page_number: 1,
        line_number: 14,
        start_char: 0,
        end_char: 71,
      },
      requires_human_review: false,
    },
    {
      id: "find_004",
      category: "visual_brand",
      severity: "low",
      title: "Sub-optimal Brand Color Contrast Ratio",
      message:
        "Hero text overlay exhibits a 3.8:1 contrast ratio against the background asset, which fails the WCAG AA 4.5:1 standard for standard body typography.",
      evidence: null,
      source_reference: {
        guideline_id: "guide_visual_brand",
        section: "Section 4.3: Digital Accessibility & Contrast",
        rule_name: "WCAG AA Contrast Minimums",
        source_url: "https://brand.inkloom.internal/guidelines/visual#contrast",
        is_external: false,
        verification_status: "verified",
      },
      confidence: 0.85,
      suggested_correction: {
        replacement_text:
          "Increase hero background overlay opacity from 20% to 45% or switch typography color to Inkloom Slate Dark (#0F172A).",
        rationale: "Restores contrast ratio to > 5.2:1 compliant with accessibility rules.",
        preserves_intent: true,
      },
      status: "open",
      location: {
        page_number: 1,
        bounding_box: {
          x: 48.0,
          y: 120.0,
          width: 640.0,
          height: 180.0,
        },
      },
      requires_human_review: false,
    },
  ],
  created_at: "2026-10-22T17:00:00Z",
  engine_metadata: {
    engine_version: "0.1.0-alpha",
    execution_time_ms: 342.5,
    modules_executed: [
      "guideline_retrieval",
      "tone_analysis",
      "terminology_checker",
      "claim_verifier",
      "visual_brand_validator",
    ],
    models_used: ["rule_engine_v1", "tone_classifier_heuristics"],
    warnings: [],
  },
};

let mockSubmissions: ContentSubmission[] = [
  {
    id: "sub_9281729a",
    organization_id: "org_default_inkloom",
    creator_id: "user_sarah_marketing",
    title: "Q4 Enterprise Product Launch Announcement",
    description: "Global announcement campaign for launch of new enterprise governance suite.",
    content_type: "text",
    status: "pending_approval",
    current_revision_id: "rev_001",
    created_at: "2026-10-22T16:30:00Z",
    updated_at: "2026-10-22T17:00:00Z",
  },
  {
    id: "sub_4102941b",
    organization_id: "org_default_inkloom",
    creator_id: "user_david_design",
    title: "Annual Sustainability Brand Report PDF",
    description: "Annual ESG and governance disclosures brochure.",
    content_type: "document",
    status: "approved",
    current_revision_id: "rev_002",
    created_at: "2026-10-21T11:20:00Z",
    updated_at: "2026-10-21T14:45:00Z",
  },
  {
    id: "sub_5581923c",
    organization_id: "org_default_inkloom",
    creator_id: "user_elena_social",
    title: "LinkedIn Brand Campaign Video Transcript",
    description: "Short promotional reel script introducing new AI safety pillars.",
    content_type: "video",
    status: "changes_requested",
    current_revision_id: "rev_001",
    created_at: "2026-10-22T09:15:00Z",
    updated_at: "2026-10-22T10:00:00Z",
  },
];

export class MockApiService implements IApiService {
  async getSubmissions(): Promise<ContentSubmission[]> {
    return [...mockSubmissions];
  }

  async getSubmission(id: string): Promise<ContentSubmission> {
    const item = mockSubmissions.find((s) => s.id === id);
    if (!item) throw new Error(`Submission with id ${id} not found.`);
    return item;
  }

  async createSubmission(data: CreateSubmissionInput): Promise<ContentSubmission> {
    const newSub: ContentSubmission = {
      id: `sub_${Math.random().toString(36).substring(2, 10)}`,
      organization_id: "org_default_inkloom",
      creator_id: "user_local_dev",
      title: data.title,
      description: data.description,
      content_type: data.content_type,
      status: "submitted",
      current_revision_id: `rev_${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    mockSubmissions.unshift(newSub);
    return newSub;
  }

  async triggerAudit(submissionId: string, revisionId?: string): Promise<AuditResult> {
    const sub = mockSubmissions.find((s) => s.id === submissionId);
    if (sub) {
      sub.status = "pending_approval";
      sub.updated_at = new Date().toISOString();
    }
    return {
      ...MOCK_AUDIT_RESULT,
      audit_id: `aud_${Math.random().toString(36).substring(2, 10)}`,
      content_id: submissionId,
      revision_id: revisionId || "rev_001",
      created_at: new Date().toISOString(),
    };
  }

  async getAudit(auditId: string): Promise<AuditResult> {
    return { ...MOCK_AUDIT_RESULT, audit_id: auditId };
  }

  async getPendingReviews(): Promise<ContentSubmission[]> {
    return mockSubmissions.filter((s) =>
      ["pending_approval", "changes_requested"].includes(s.status)
    );
  }

  async submitReviewDecision(data: ReviewDecisionInput): Promise<ReviewDecision> {
    const sub = mockSubmissions.find((s) => s.id === data.submission_id);
    if (sub) {
      if (data.action === "approve") sub.status = "approved";
      else if (data.action === "reject") sub.status = "rejected";
      else if (data.action === "request_changes") sub.status = "changes_requested";
      sub.updated_at = new Date().toISOString();
    }
    return {
      id: `dec_${Date.now()}`,
      submission_id: data.submission_id,
      revision_id: data.revision_id,
      reviewer_id: "user_reviewer_active",
      action: data.action,
      comments: data.comments,
      created_at: new Date().toISOString(),
    };
  }

  async getGuidelines(): Promise<BrandGuideline[]> {
    return [
      {
        id: "guide_naming_2026",
        organization_id: "org_default_inkloom",
        name: "Inkloom 2026 Enterprise Naming Standards",
        description: "Official nomenclature, trademarks, and retired legacy brand names.",
        version: "2.1.0",
        is_active: true,
      },
      {
        id: "guide_voice_tone",
        organization_id: "org_default_inkloom",
        name: "Inkloom Brand Voice & Tone Pillars",
        description: "Empowering, authoritative, transparent, and empathetic communication guidelines.",
        version: "1.4.0",
        is_active: true,
      },
      {
        id: "guide_claims_regulatory",
        organization_id: "org_default_inkloom",
        name: "Certified Benchmark & Promotional Claims Registry",
        description: "Rules requiring verified benchmark citations for quantitative claims.",
        version: "3.0.0",
        is_active: true,
      },
    ];
  }

  async createGuideline(data: { name: string; description?: string; version?: string }): Promise<BrandGuideline> {
    return {
      id: `guide_${Math.random().toString(36).substring(2, 9)}`,
      organization_id: "org_acme_cloud",
      name: data.name,
      description: data.description || "",
      version: data.version || "1.0.0",
      is_active: true,
    };
  }

  async getAssets(): Promise<ApprovedAsset[]> {
    return [
      {
        id: "asset_logo_primary",
        organization_id: "org_default_inkloom",
        name: "Inkloom Master Logo Vector (Dark)",
        asset_type: "logo",
        file_url: "/assets/inkloom-logo-dark.svg",
        specifications: { min_padding_px: 24, aspect_ratio: "4:1", min_width_px: 120 },
        is_active: true,
      },
      {
        id: "asset_palette_core",
        organization_id: "org_default_inkloom",
        name: "Corporate Core Palette (Slate & Indigo)",
        asset_type: "color_palette",
        specifications: {
          primary: "#0F172A",
          accent: "#6366F1",
          secondary: "#38BDF8",
          surface: "#F8FAFC",
        },
        is_active: true,
      },
      {
        id: "asset_claim_soc2",
        organization_id: "org_default_inkloom",
        name: "SOC 2 Type II Security Benchmark",
        asset_type: "verified_claim",
        specifications: {
          certified_statement: "SOC 2 Type II certified enterprise infrastructure",
          report_id: "AICPA-2025-SOC2",
          valid_until: "2027-01-01",
        },
        is_active: true,
      },
    ];
  }

  async getAnalyticsSummary(): Promise<AnalyticsSummary> {
    return {
      total_submissions: mockSubmissions.length + 28,
      pending_reviews: 4,
      average_compliance_score: 88.4,
      overall_compliance_rate: 93.2,
      top_violations: [
        { category: "terminology", count: 18, percentage: 42.0 },
        { category: "claim_verification", count: 12, percentage: 28.0 },
        { category: "tone_voice", count: 8, percentage: 19.0 },
        { category: "visual_brand", count: 5, percentage: 11.0 },
      ],
      compliance_trends: [
        { date: "Oct 18", average_compliance_score: 81.0, total_audits: 12 },
        { date: "Oct 19", average_compliance_score: 84.5, total_audits: 18 },
        { date: "Oct 20", average_compliance_score: 87.2, total_audits: 25 },
        { date: "Oct 21", average_compliance_score: 89.0, total_audits: 19 },
        { date: "Oct 22", average_compliance_score: 91.4, total_audits: 31 },
      ],
      recent_activity_count: 54,
    };
  }

  // --- Multi-Tenant Mock Implementations ---
  async login(email: string, password?: string): Promise<AuthResponse> {
    const isNova = email.toLowerCase().includes("novabio");
    const isDesigner = email.toLowerCase().includes("designer");
    const isMarketing = email.toLowerCase().includes("marketing");
    const isCompliance = email.toLowerCase().includes("compliance");

    const orgId = isNova ? "org_novabio_health" : "org_acme_cloud";
    const orgName = isNova ? "NovaBio Health Sciences" : "Acme Cloud Systems";
    const orgSlug = isNova ? "novabio-health" : "acme-cloud";

    let role = "admin";
    if (isDesigner) role = "designer";
    else if (isMarketing) role = "marketing";
    else if (isCompliance) role = "compliance_officer";

    return {
      access_token: `mock_jwt_token_${Date.now()}`,
      token_type: "bearer",
      user: {
        id: `user_${email.replace(/[^a-zA-Z0-9]/g, "_")}`,
        email,
        full_name: email.split("@")[0].replace(".", " ").toUpperCase(),
      },
      active_organization_id: orgId,
      active_role: role,
      memberships: [
        {
          organization_id: orgId,
          organization_name: orgName,
          organization_slug: orgSlug,
          role,
        },
      ],
    };
  }

  async register(data: { email: string; password?: string; full_name: string; organization_name: string; industry?: string }): Promise<AuthResponse> {
    const orgId = `org_${Math.random().toString(36).substring(2, 9)}`;
    return {
      access_token: `mock_jwt_token_${Date.now()}`,
      token_type: "bearer",
      user: {
        id: `user_${Math.random().toString(36).substring(2, 9)}`,
        email: data.email,
        full_name: data.full_name,
      },
      active_organization_id: orgId,
      active_role: "admin",
      memberships: [
        {
          organization_id: orgId,
          organization_name: data.organization_name,
          organization_slug: data.organization_name.toLowerCase().replace(/\s+/g, "-"),
          role: "admin",
        },
      ],
    };
  }

  async getCurrentUser() {
    return {
      user: {
        id: "user_acme_admin",
        email: "admin@acmecloud.com",
        full_name: "Alex Mercer (Manager)",
      },
      active_organization_id: "org_acme_cloud",
      active_role: "admin",
      memberships: [
        {
          organization_id: "org_acme_cloud",
          organization_name: "Acme Cloud Systems",
          organization_slug: "acme-cloud",
          role: "admin",
        },
        {
          organization_id: "org_novabio_health",
          organization_name: "NovaBio Health Sciences",
          organization_slug: "novabio-health",
          role: "admin",
        },
      ],
    };
  }

  async getOrganizations(): Promise<Organization[]> {
    return [
      {
        id: "org_acme_cloud",
        name: "Acme Cloud Systems",
        slug: "acme-cloud",
        industry: "Enterprise Cloud Infrastructure",
        is_active: true,
      },
      {
        id: "org_novabio_health",
        name: "NovaBio Health Sciences",
        slug: "novabio-health",
        industry: "Biotech & Clinical Research",
        is_active: true,
      },
    ];
  }

  async createOrganization(data: { name: string; industry?: string }): Promise<Organization> {
    return {
      id: `org_${Math.random().toString(36).substring(2, 9)}`,
      name: data.name,
      slug: data.name.toLowerCase().replace(/\s+/g, "-"),
      industry: data.industry,
      is_active: true,
    };
  }

  async getOrganization(orgId: string): Promise<Organization> {
    const isNova = orgId.includes("novabio");
    return {
      id: orgId,
      name: isNova ? "NovaBio Health Sciences" : "Acme Cloud Systems",
      slug: isNova ? "novabio-health" : "acme-cloud",
      industry: isNova ? "Biotech & Life Sciences" : "Cloud & Infrastructure",
      is_active: true,
    };
  }

  async updateOrganization(orgId: string, data: Partial<Organization>): Promise<Organization> {
    return {
      id: orgId,
      name: data.name || "Acme Cloud Systems",
      slug: "acme-cloud",
      is_active: true,
      ...data,
    };
  }

  async getMembers(orgId: string): Promise<MemberInfo[]> {
    return [
      { user_id: "u1", email: "admin@acmecloud.com", full_name: "Alex Mercer", role: "admin", joined_at: "2026-10-01T00:00:00Z" },
      { user_id: "u2", email: "marketing@acmecloud.com", full_name: "Maya Lin", role: "marketing", joined_at: "2026-10-05T00:00:00Z" },
      { user_id: "u3", email: "designer@acmecloud.com", full_name: "Leo Vance", role: "designer", joined_at: "2026-10-08T00:00:00Z" },
      { user_id: "u4", email: "compliance@acmecloud.com", full_name: "Elena Rostova", role: "compliance_officer", joined_at: "2026-10-10T00:00:00Z" },
    ];
  }

  async updateMemberRole(orgId: string, userId: string, role: string): Promise<MemberInfo> {
    return {
      user_id: userId,
      email: "member@acmecloud.com",
      full_name: "Updated Member",
      role,
      joined_at: new Date().toISOString(),
    };
  }

  async removeMember(orgId: string, userId: string): Promise<void> {}

  async getInvitations(orgId: string): Promise<Invitation[]> {
    return [
      {
        id: "inv_1",
        email: "sam.newhire@acmecloud.com",
        role: "designer",
        token: "acme_invite_designer_2026",
        invite_url: "/invite?token=acme_invite_designer_2026",
        expires_at: "2026-10-30T00:00:00Z",
        is_revoked: false,
        created_at: "2026-10-23T00:00:00Z",
      },
    ];
  }

  async createInvitation(orgId: string, email: string, role: string): Promise<Invitation> {
    const token = `inv_${Math.random().toString(36).substring(2, 10)}`;
    return {
      id: `inv_${Date.now()}`,
      email,
      role,
      token,
      invite_url: `/invite?token=${token}`,
      expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
      is_revoked: false,
      created_at: new Date().toISOString(),
    };
  }

  async revokeInvitation(orgId: string, inviteId: string): Promise<void> {}

  async inspectInvitation(token: string): Promise<PublicInvitation> {
    return {
      token,
      email: "invited.collaborator@acmecloud.com",
      role: "designer",
      organization_id: "org_acme_cloud",
      organization_name: "Acme Cloud Systems",
      is_valid: true,
      expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
    };
  }

  async acceptInvitation(data: { token: string; full_name: string; password?: string }): Promise<AuthResponse> {
    return {
      access_token: `mock_jwt_${Date.now()}`,
      token_type: "bearer",
      user: {
        id: `user_new_${Date.now()}`,
        email: "invited.collaborator@acmecloud.com",
        full_name: data.full_name,
      },
      active_organization_id: "org_acme_cloud",
      active_role: "designer",
      memberships: [
        {
          organization_id: "org_acme_cloud",
          organization_name: "Acme Cloud Systems",
          organization_slug: "acme-cloud",
          role: "designer",
        },
      ],
    };
  }
}

export const mockApi = new MockApiService();
