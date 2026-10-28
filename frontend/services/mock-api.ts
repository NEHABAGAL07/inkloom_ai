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
  BrandGuidelineProfile,
  BrandGuidelineData,
  BrandGuidelineVersionInfo,
  EffectiveSettings,
  ApprovedAsset,
  AnalyticsSummary,
  User,
  Organization,
  OrgMembership,
  AuthResponse,
  MemberInfo,
  Invitation,
  PublicInvitation,
  ClarificationReport,
  ConflictCheckResult,
  StarterTemplateRule,
  ContentComment,
  CommentsListResponse,
  CitationItem,
  AskQuestionRequest,
  AskQuestionResponse,
  ChatMessage,
  ChatSession,
  ChatSessionDetail,
  KnowledgeDocument,
  DocumentListResponse,
  ChatStatusResponse,
  CampaignBriefRequest,
  MarketingGenerationResponse,
  SaveDraftRequest,
  UpdateDraftRevisionRequest,
  DraftDetailResponse,
  BrandAssetItem,
  CreativeBriefRequest,
  DesignConceptGenerationResponse,
  SaveCreativeBriefDraftRequest,
  DesignDraftDetailResponse,
  DesignRevisionItem,
  DesignConceptAlternative,
  ColorTokenRecommendation,
  TypographyRecommendation,
  AuthoritativeLegalSource,
  LegalReviewRequest,
  LegalReviewReport,
  ApplyRevisionRequest,
  RecordLegalFeedbackRequest,
  Campaign,
  CampaignCreate,
  CampaignUpdate,
  CampaignDecisionRequest,
  CampaignReadinessEvaluation,
  NotificationItem,
} from "../types";

export interface CreateSubmissionInput {
  title: string;
  description?: string;
  content_type: "text" | "document" | "image" | "video";
  initial_text?: string;
  file_name?: string;
  media_url?: string;
  file_path?: string;
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
  createRevision(submissionId: string, data: { raw_text?: string; file_name?: string; file_path?: string; file_size_bytes?: number }): Promise<any>;
  triggerAudit(submissionId: string, revisionId?: string): Promise<AuditResult>;
  getAudit(auditId: string): Promise<AuditResult>;
  getPendingReviews(): Promise<ContentSubmission[]>;
  submitReviewDecision(data: ReviewDecisionInput): Promise<ReviewDecision>;
  getGuidelines(): Promise<BrandGuideline[]>;
  createGuideline(data: { name: string; description?: string; version?: string }): Promise<BrandGuideline>;
  getGuidelineProfile(): Promise<BrandGuidelineProfile>;
  saveDraftGuideline(draftData: BrandGuidelineData, name?: string, description?: string): Promise<BrandGuidelineProfile>;
  publishGuideline(version: string, changelog?: string): Promise<BrandGuidelineProfile>;
  submitGuidelineForReview(notes: string, requiresLegalApproval?: boolean, jurisdiction?: string, industry?: string): Promise<BrandGuidelineProfile>;
  getPendingGuidelineReviews(): Promise<BrandGuidelineProfile[]>;
  recordGuidelineReviewDecision(decision: "approved" | "rejected" | "changes_requested", rationale: string): Promise<BrandGuidelineProfile>;
  checkGuidelineConflicts(): Promise<ConflictCheckResult>;
  getStarterTemplates(jurisdiction?: string, industry?: string): Promise<{ total_templates: number; templates: StarterTemplateRule[]; compliance_disclaimer: string }>;
  reportUnclearRule(ruleReference: string, reportType: string, description: string): Promise<ClarificationReport>;
  getClarificationReports(): Promise<ClarificationReport[]>;
  resolveClarificationReport(reportId: string, status: "resolved" | "dismissed", resolutionNotes: string): Promise<ClarificationReport>;
  rollbackGuideline(versionId: string, rationale: string): Promise<BrandGuidelineProfile>;
  getGuidelineVersions(): Promise<BrandGuidelineVersionInfo[]>;
  restoreGuidelineVersion(versionId: string): Promise<BrandGuidelineProfile>;
  getEffectiveSettings(mediaType: string): Promise<EffectiveSettings>;
  getAssets(): Promise<ApprovedAsset[]>;
  getAnalyticsSummary(): Promise<AnalyticsSummary>;

  // Designer Feedback & Change Request Comments
  getSubmissionComments(submissionId: string): Promise<CommentsListResponse>;
  addSubmissionComment(submissionId: string, commentText: string, category?: string): Promise<ContentComment>;
  toggleCommentResolution(submissionId: string, commentId: string, isResolved: boolean, resolutionNote?: string): Promise<ContentComment>;

  // Multi-Tenant Authentication & Workspaces
  login(email: string, password: string): Promise<AuthResponse>;
  register(data: { email: string; password: string; full_name: string; organization_name: string; industry?: string }): Promise<AuthResponse>;
  getCurrentUser(): Promise<{ user: User; active_organization_id: string; active_role: string; memberships: OrgMembership[] } | null>;
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
  logout(): Promise<{ message: string; revoked: boolean }>;

  // Brand Assistant & Document Intelligence
  askAssistant(payload: AskQuestionRequest): Promise<AskQuestionResponse>;
  getAssistantSessions(): Promise<ChatSession[]>;
  getAssistantSession(sessionId: string): Promise<ChatSessionDetail>;
  deleteAssistantSession(sessionId: string): Promise<void>;
  submitMessageFeedback(messageId: string, payload: { helpful: boolean; comment?: string }): Promise<any>;
  uploadKnowledgeDocument(file: File): Promise<KnowledgeDocument>;
  getKnowledgeDocuments(): Promise<DocumentListResponse>;
  getKnowledgeDocument(documentId: string): Promise<KnowledgeDocument>;
  deleteKnowledgeDocument(documentId: string): Promise<void>;
  getChatStatus(): Promise<ChatStatusResponse>;

  // Marketing Copilot
  generateMarketingCopy(brief: CampaignBriefRequest): Promise<MarketingGenerationResponse>;
  saveMarketingDraft(payload: SaveDraftRequest): Promise<DraftDetailResponse>;
  getMarketingDrafts(limit?: number, offset?: number): Promise<DraftDetailResponse[]>;
  getMarketingDraft(draftId: string): Promise<DraftDetailResponse>;
  updateMarketingDraftRevision(draftId: string, payload: UpdateDraftRevisionRequest): Promise<DraftDetailResponse>;
  auditMarketingDraft(draftId: string, revisionId?: string): Promise<AuditResult>;
  submitMarketingDraft(draftId: string): Promise<DraftDetailResponse>;

  // Designer Copilot
  getAuthorizedBrandAssets(assetType?: string): Promise<BrandAssetItem[]>;
  generateDesignConcepts(brief: CreativeBriefRequest): Promise<DesignConceptGenerationResponse>;
  saveDesignBriefDraft(payload: SaveCreativeBriefDraftRequest): Promise<DesignDraftDetailResponse>;
  getDesignBriefs(limit?: number, offset?: number): Promise<DesignDraftDetailResponse[]>;
  getDesignBrief(briefId: string): Promise<DesignDraftDetailResponse>;
  uploadDesignVersion(briefId: string, file: File, changeSummary?: string): Promise<DesignDraftDetailResponse>;
  auditDesignVersion(briefId: string, revisionId?: string): Promise<AuditResult>;
  submitDesignForReview(briefId: string): Promise<DesignDraftDetailResponse>;
  
  // Phase 5: Legal Copilot
  getLegalSources(jurisdiction?: string, regulatedCategory?: string): Promise<AuthoritativeLegalSource[]>;
  reviewLegalCompliance(request: LegalReviewRequest): Promise<LegalReviewReport>;
  getSubmissionLegalReport(submissionId: string, jurisdiction?: string): Promise<LegalReviewReport>;
  applyLegalRevision(submissionId: string, payload: ApplyRevisionRequest): Promise<any>;
  recordLegalDecision(submissionId: string, payload: RecordLegalFeedbackRequest): Promise<any>;

  // Phase 6: Unified Campaign Workflow & Orchestration
  getCampaigns(status?: string, priority?: string): Promise<Campaign[]>;
  getCampaign(campaignId: string): Promise<Campaign>;
  createCampaign(payload: CampaignCreate): Promise<Campaign>;
  updateCampaign(campaignId: string, payload: CampaignUpdate): Promise<Campaign>;
  associateSubmissionsToCampaign(campaignId: string, submissionIds: string[]): Promise<Campaign>;
  runCampaignReviews(campaignId: string): Promise<Campaign>;
  submitCampaignDecision(campaignId: string, payload: CampaignDecisionRequest): Promise<Campaign>;
  getCampaignReadiness(campaignId: string): Promise<CampaignReadinessEvaluation>;
  getCampaignActivity(campaignId: string): Promise<any[]>;
  getNotifications(unreadOnly?: boolean): Promise<NotificationItem[]>;
  markNotificationRead(notificationId: string): Promise<any>;
  markAllNotificationsRead(): Promise<any>;
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
    id: "sub_designer_banner",
    organization_id: "org_default_inkloom",
    creator_id: "user_designer_active",
    creator_name: "Leo Vance (Senior Designer)",
    title: "Q4 Campaign Hero Banner - Cyber Slate",
    description: "Visual brand asset submission for Q4 enterprise campaign. Features dark moody aesthetic, compliant 5.2:1 contrast wordmark, and approved 2026 executive palette.",
    content_type: "image",
    status: "pending_approval",
    file_name: "Q4_Hero_Campaign_Banner.png",
    raw_text: "Visual asset Q4_Hero_Campaign_Banner.png submitted for brand palette & typography compliance check. Colors: #14263D, #0F766E. Wordmark safe-margin: 28px.",
    current_revision_id: "rev_001",
    created_at: "2026-10-23T10:15:00Z",
    updated_at: "2026-10-23T11:00:00Z",
  },
  {
    id: "sub_9281729a",
    organization_id: "org_default_inkloom",
    creator_id: "user_sarah_marketing",
    creator_name: "Sarah Jenkins (Marketing)",
    title: "Q4 Enterprise Product Launch Announcement",
    description: "Global announcement campaign for launch of new enterprise governance suite.",
    content_type: "text",
    status: "pending_approval",
    file_name: "Launch_Announcement.txt",
    raw_text: "Get started with the powerful CloudSpeed Suite today.\nOur newest release lets organizations experience a guaranteed 10x reduction in latency across all regions.\nHurry up before your competitors crush you and steal your market share.",
    current_revision_id: "rev_001",
    created_at: "2026-10-22T16:30:00Z",
    updated_at: "2026-10-22T17:00:00Z",
  },
  {
    id: "sub_4102941b",
    organization_id: "org_default_inkloom",
    creator_id: "user_david_design",
    creator_name: "David Vance (Senior Designer)",
    title: "Annual Sustainability Brand Report PDF",
    description: "Annual ESG and governance disclosures brochure with verified typography standards.",
    content_type: "document",
    status: "approved",
    file_name: "Annual_Sustainability_Report_2026.pdf",
    raw_text: "Acme Cloud Systems datacenters run with 100% certified renewable energy matching ISO 14001 specifications.",
    current_revision_id: "rev_002",
    created_at: "2026-10-21T11:20:00Z",
    updated_at: "2026-10-21T14:45:00Z",
  },
  {
    id: "sub_5581923c",
    organization_id: "org_default_inkloom",
    creator_id: "user_elena_social",
    creator_name: "Elena Rostova (Social Lead)",
    title: "LinkedIn Brand Campaign Video Transcript",
    description: "Short promotional reel script introducing new AI safety pillars.",
    content_type: "video",
    status: "changes_requested",
    file_name: "Brand_Safety_Reel_Script.mp4",
    raw_text: "Empowering organizations with verified brand compliance safeguards and human-in-the-loop audit controls.",
    current_revision_id: "rev_001",
    created_at: "2026-10-22T09:15:00Z",
    updated_at: "2026-10-22T10:00:00Z",
  },
];

function getStoredSubmissions(): ContentSubmission[] {
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("inkloom_mock_submissions_v2");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn("Failed to read stored submissions:", e);
    }
  }
  return [...mockSubmissions];
}

function saveStoredSubmissions(subs: ContentSubmission[]) {
  mockSubmissions = subs;
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("inkloom_mock_submissions_v2", JSON.stringify(subs));
    } catch (e) {
      console.warn("Failed to save stored submissions:", e);
    }
  }
}

function generateAuditForSubmission(sub: ContentSubmission): AuditResult {
  const isVisual = sub.content_type === "image" || sub.content_type === "video";
  const auditId = `aud_${Math.random().toString(36).substring(2, 10)}`;

  if (isVisual) {
    return {
      schema_version: "1.0.0",
      audit_id: auditId,
      content_id: sub.id,
      revision_id: sub.current_revision_id || "rev_001",
      overall_status: "needs_review",
      summary: {
        compliance_score: 91.5,
        total_findings: 3,
        critical_count: 0,
        high_count: 0,
        medium_count: 1,
        low_count: 1,
        info_count: 1,
        human_review_required: true,
        verdict_overview:
          "AI Media Extractor & Visual Brand Engine Analysis: Asset conforms to enterprise color depth and dark moody aesthetic. Color palette adheres to primary slate (#0F172A) with 5.1:1 contrast ratio passing WCAG AA. Safe-margin padding around brand wordmark meets 24px requirement. Ready for final manager sign-off.",
      },
      findings: [
        {
          id: `find_${Date.now()}_1`,
          category: "visual_brand",
          severity: "medium",
          title: "Atmospheric Shadow Contrast Verification",
          message:
            "Dark moody lighting style detected. Lower-third text elements achieve a 4.6:1 contrast ratio against the textured background. Compliant with WCAG AA standards (> 4.5:1), but recommend increasing text fill luminance for optimal readability.",
          evidence: `Asset: ${sub.title}`,
          source_reference: {
            guideline_id: "guide_visual_brand",
            section: "Section 5.3: Visual Standards & Contrast",
            rule_name: "Primary Color Contrast & Safe Margin",
            source_url: "https://brand.acmecloud.com/visual#sec-5-3",
            is_external: false,
            verification_status: "verified",
          },
          confidence: 0.94,
          suggested_correction: {
            replacement_text: "Increase foreground text opacity to 100% or apply subtle 15% dark vignette behind copy.",
            rationale: "Elevates contrast ratio to > 6.0:1 surpassing WCAG AAA.",
            preserves_intent: true,
          },
          status: "open",
          requires_human_review: false,
        },
        {
          id: `find_${Date.now()}_2`,
          category: "visual_brand",
          severity: "info",
          title: "Logo Safe-Area & Wordmark Placement",
          message:
            "Primary Wordmark safe-margin detected at 28px padding, exceeding the minimum 24px requirement. No visual encroachment found.",
          evidence: "Vector bounds analysis: 28px margin clear.",
          source_reference: {
            guideline_id: "guide_visual_brand",
            section: "Section 2.1: Brand Wordmark Usage",
            rule_name: "Safe Area Margin",
            is_external: false,
            verification_status: "verified",
          },
          confidence: 0.99,
          suggested_correction: {
            replacement_text: "Wordmark placement is approved. Maintain current margins.",
            rationale: "Fully compliant with official brand kit.",
            preserves_intent: true,
          },
          status: "open",
          requires_human_review: false,
        },
        {
          id: `find_${Date.now()}_3`,
          category: "terminology",
          severity: "low",
          title: "Resolution & Format Optimization",
          message:
            "Asset successfully ingested via Media Extractor. Image dimensions and compression profile conform to digital web guidelines.",
          evidence: "Lossless PNG header verified.",
          source_reference: {
            guideline_id: "guide_visual_brand",
            section: "Section 6.1: Digital Asset Specifications",
            rule_name: "Approved Export Formats",
            is_external: false,
            verification_status: "verified",
          },
          confidence: 0.98,
          suggested_correction: {
            replacement_text: "No action required.",
            rationale: "File meets all upload limits and security sanitization rules.",
            preserves_intent: true,
          },
          status: "open",
          requires_human_review: false,
        },
      ],
      created_at: new Date().toISOString(),
      engine_metadata: {
        engine_version: "0.1.0-alpha",
        execution_time_ms: 285.4,
        modules_executed: ["media_extractor", "color_palette_checker", "contrast_analyzer", "wordmark_safe_area"],
        models_used: ["media_qa_v1", "contrast_calc_wcag21"],
        warnings: [],
      },
    };
  }

  return {
    ...MOCK_AUDIT_RESULT,
    audit_id: auditId,
    content_id: sub.id,
    revision_id: sub.current_revision_id || "rev_001",
    created_at: new Date().toISOString(),
  };
}

function getStoredAudits(): Record<string, AuditResult> {
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("inkloom_mock_audits_v2");
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {}
  }
  return {
    "7f8b3c10-9b4e-4f76-b6b8-6d8b688d6e90": MOCK_AUDIT_RESULT,
    "sub_9281729a": MOCK_AUDIT_RESULT,
  };
}

function saveStoredAudit(key: string, audit: AuditResult) {
  const audits = getStoredAudits();
  audits[key] = audit;
  if (audit.content_id) {
    audits[audit.content_id] = audit;
  }
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("inkloom_mock_audits_v2", JSON.stringify(audits));
    } catch (e) {}
  }
}

export const DEFAULT_MOCK_BRAND_GUIDELINE_DATA: BrandGuidelineData = {
  identity: {
    brand_name: "Acme Cloud Systems",
    tagline: "Autonomous Zero-Trust Infrastructure for the AI-Native Enterprise",
    description:
      "Acme Cloud Systems provides high-performance, mathematically verifiable hybrid cloud compute and automated zero-trust security infrastructure for regulated global enterprises.",
    industry: "Enterprise Cloud & Infrastructure",
    mission: "Empowering resilient, sovereign computing that scales fearlessly across global multi-cloud boundaries.",
    vision: "To be the undisputed foundation of mission-critical AI workloads and zero-trust cloud fabrics worldwide.",
    values: ["Zero-Trust Rigor", "Transparent Reliability", "Developer Empowerment", "Sustainable Scale"],
    positioning:
      "The premier enterprise cloud infrastructure platform combining silicon-grade isolation with effortless developer velocity.",
    target_market: "Global Fortune 500, High-Frequency Fintech, Healthcare & Defense Technology",
    primary_audience: "Chief Technology Officers, VP Infrastructure, Principal Platform Architects",
    secondary_audience: "Site Reliability Engineers, DevSecOps Leads, Cloud Security Auditors",
    personality: ["Authoritative", "Empowering", "Consultative", "Precise", "Sophisticated"],
    differentiators: [
      "Sub-50ms Global Core Latency",
      "Verified Multi-Region Isolation",
      "Zero Proprietary Lock-In",
    ],
    preferred_language: "English (US)",
    supported_languages: ["English (US)", "English (UK)", "German", "Japanese"],
    website_url: "https://acmecloud.com",
    social_links: [
      {"platform": "LinkedIn", "url": "https://linkedin.com/company/acme-cloud"},
      {"platform": "X", "url": "https://x.com/acmecloud"},
    ],
    contact_email: "brand@acmecloud.com",
  },
  voice: {
    brand_tone: ["Authoritative", "Consultative", "Engineering-Grade", "Empowering"],
    formality_level: "professional",
    personality_traits: ["Direct", "Evidence-Based", "Calm", "No-Hype"],
    communication_style: "Clear, technical precision backed by empirical benchmarks rather than marketing hype.",
    preferred_vocabulary: [
      "zero-trust fabric",
      "verified uptime",
      "deterministic throughput",
      "resilient compute",
      "low-latency mesh",
    ],
    words_to_use: ["verifiable", "deterministic", "engineered", "resilient", "autonomous", "proven"],
    words_to_avoid: [
      "Inkloom Cloud Suite",
      "CloudSpeed",
      "HyperScale",
      "magic",
      "miracle",
      "foolproof",
      "destroying competition",
      "guaranteed 100% reduction",
    ],
    writing_style: "Active voice, concise sentences, evidence-first claims.",
    sentence_length_preference: "concise",
    technical_terminology: "Always define three-letter acronyms on first mention (e.g. Virtual Private Cloud (VPC)).",
    humor_preference: "none",
    emotional_tone: "Reassuring, confident, consultative.",
    cta_style: "Actionable and descriptive, e.g. 'Deploy Zero-Trust Cluster' rather than generic 'Click Here'.",
    headline_preferences: "Clear benefit-driven value statements under 10 words.",
    caption_rules: "Describe technical architecture or benchmark conditions clearly.",
    grammar_conventions: "Oxford comma required. Sentence case for UI actions and title case for major headings.",
    inclusive_communication:
      "Use gender-neutral pronouns. Avoid legacy master/slave terminology in favor of primary/replica.",
    approved_copy_examples: [
      {
        context: "Homepage Headline",
        text: "Engineered for 99.999% Verified Resilience Under Peak Distributed Workloads.",
      },
      {
        context: "Product Feature Copy",
        text: "Deploy microsecond packet routing across 42 sovereign cloud zones without vendor lock-in.",
      },
    ],
    prohibited_copy_examples: [
      {
        context: "Urgency Sales Copy",
        text: "Hurry up before your competitors crush you!",
        reason: "Violates anti-FUD policy.",
      },
      {
        context: "Unverified Quantitative Claim",
        text: "Guaranteed 100% reduction in all infrastructure costs.",
        reason: "Absolute claims violate legal disclosure rules.",
      },
    ],
  },
  colors: {
    palette: [
      {
        id: "col_pri",
        name: "Acme Midnight Slate",
        hex: "#0F172A",
        rgb: "rgb(15, 23, 42)",
        role: "primary",
        usage_intent: "Core brand background and high-contrast typography",
        restrictions: "Mandatory base for enterprise documentation and primary layouts",
        status: "mandatory",
      },
      {
        id: "col_ind",
        name: "Electric Indigo",
        hex: "#6366F1",
        rgb: "rgb(99, 102, 241)",
        role: "accent",
        usage_intent: "Primary interactive elements, call-to-actions, and focus indicators",
        restrictions: "Must maintain 4.5:1 contrast against dark backgrounds",
        status: "mandatory",
      },
      {
        id: "col_sky",
        name: "Sovereign Sky",
        hex: "#0284C7",
        rgb: "rgb(2, 132, 199)",
        role: "secondary",
        usage_intent: "Data visualization, infrastructure status, and secondary links",
        restrictions: "Do not use for body paragraph text",
        status: "preferred",
      },
      {
        id: "col_eme",
        name: "Verified Emerald",
        hex: "#10B981",
        rgb: "rgb(16, 185, 129)",
        role: "semantic",
        usage_intent: "Passed audit benchmarks, 99.99% uptime badges, and verified status",
        restrictions: "Reserved strictly for positive system confirmations",
        status: "mandatory",
      },
      {
        id: "col_amb",
        name: "Caution Amber",
        hex: "#F59E0B",
        rgb: "rgb(245, 158, 11)",
        role: "semantic",
        usage_intent: "High-latency alerts, pending audits, and reviewer triage flags",
        restrictions: "Use only for advisory notices",
        status: "preferred",
      },
      {
        id: "col_ros",
        name: "Critical Rose",
        hex: "#EF4444",
        rgb: "rgb(239, 68, 68)",
        role: "semantic",
        usage_intent: "Governance violations, broken safe-area margins, and non-compliance",
        restrictions: "Never use as a decorative accent",
        status: "mandatory",
      },
      {
        id: "col_neu",
        name: "Neutral Steel",
        hex: "#94A3B8",
        rgb: "rgb(148, 163, 184)",
        role: "neutral",
        usage_intent: "Borders, placeholder copy, secondary captions, and structural lines",
        restrictions: "Ensure secondary text readability",
        status: "preferred",
      },
    ],
    contrast_rules: {
      min_ratio_normal: 4.5,
      min_ratio_large: 3.0,
      notes: "All client-facing assets must strictly comply with WCAG 2.1 Level AA standards.",
    },
  },
  typography: {
    primary_font: "Inter",
    secondary_font: "Roboto",
    display_font: "Outfit",
    monospace_font: "JetBrains Mono",
    approved_weights: ["Regular (400)", "Medium (500)", "Semi-Bold (600)", "Bold (700)", "Extra-Bold (800)"],
    fallback_fonts: ["system-ui", "-apple-system", "sans-serif"],
    restrictions: "Never substitute serif or script typefaces. Decorative drop-shadows on typography are strictly prohibited.",
    licensing_notes: "All approved typefaces are licensed under open SIL OFL or enterprise commercial multi-seat licenses.",
    presets: [
      {
        name: "H1",
        font_family: "Outfit",
        font_weight: "800",
        font_size: "36px",
        line_height: "44px",
        letter_spacing: "-0.02em",
        text_case: "none",
        intended_usage: "Primary hero banners and executive presentation titles",
      },
      {
        name: "H2",
        font_family: "Outfit",
        font_weight: "700",
        font_size: "28px",
        line_height: "36px",
        letter_spacing: "-0.01em",
        text_case: "none",
        intended_usage: "Section headings and modal titles",
      },
      {
        name: "H3",
        font_family: "Inter",
        font_weight: "600",
        font_size: "20px",
        line_height: "28px",
        letter_spacing: "-0.005em",
        text_case: "none",
        intended_usage: "Card titles, subsection dividers",
      },
      {
        name: "Body",
        font_family: "Inter",
        font_weight: "400",
        font_size: "15px",
        line_height: "24px",
        letter_spacing: "0em",
        text_case: "none",
        intended_usage: "Standard paragraphs, documentation, and product descriptions",
      },
      {
        name: "Small",
        font_family: "Inter",
        font_weight: "500",
        font_size: "13px",
        line_height: "18px",
        letter_spacing: "0em",
        text_case: "none",
        intended_usage: "Table rows, metadata tags, and sidebar items",
      },
      {
        name: "Caption",
        font_family: "Inter",
        font_weight: "400",
        font_size: "12px",
        line_height: "16px",
        letter_spacing: "0.01em",
        text_case: "none",
        intended_usage: "Image captions, footnotes, and timestamps",
      },
      {
        name: "CTA",
        font_family: "Inter",
        font_weight: "700",
        font_size: "14px",
        line_height: "20px",
        letter_spacing: "0.02em",
        text_case: "none",
        intended_usage: "Interactive buttons, links, and high-visibility actions",
      },
      {
        name: "Legal",
        font_family: "Inter",
        font_weight: "400",
        font_size: "11px",
        line_height: "15px",
        letter_spacing: "0em",
        text_case: "none",
        intended_usage: "Disclaimers, copyright notices, and patent disclosures",
      },
    ],
  },
  logos: {
    variants: [
      {
        id: "logo_pri",
        name: "Primary Acme Wordmark",
        type: "primary",
        image_url: "https://assets.acmecloud.com/logos/acme-primary.svg",
        min_width_px: 140,
        min_height_px: 32,
        clear_space_formula: "Minimum padding equal to height of letter 'A' or 24px on all sides",
        preferred_placement: "Top-left or centered upper-third",
        approved_backgrounds: "Dark slate (#0F172A) or clean neutral white (#FFFFFF)",
        permitted_modifications: "Monochrome white or black exports only",
        prohibited_modifications:
          "No drop shadows, stretching, distortion, or background gradients behind wordmark",
      },
      {
        id: "logo_ico",
        name: "Acme Sovereign Icon / Monogram",
        type: "icon",
        image_url: "https://assets.acmecloud.com/logos/acme-icon.svg",
        min_width_px: 32,
        min_height_px: 32,
        clear_space_formula: "12px all sides",
        preferred_placement: "App favicons, profile avatars, and compact toolbars",
        approved_backgrounds: "Universal",
        permitted_modifications: "Color fill in Electric Indigo or White",
        prohibited_modifications: "No rotation or partial occlusion",
      },
    ],
    partner_rules:
      "Partner logos must be separated by a 1px solid vertical divider (#475569) with at least 32px horizontal spacing.",
    co_branding_rules:
      "Acme wordmark must always have equal or prominent visual weight in joint press releases.",
  },
  visual_identity: {
    overall_style: "Clean, modern, cyber-architectural, high-fidelity dark aesthetic with focused vibrant accents.",
    photography_aesthetic:
      "Real engineering teams, clean server architecture, authentic collaborative workspaces. Avoid generic stock photos.",
    illustration_style: "Isometric vector diagrams, precise infrastructure schematics, clean geometric topology.",
    graphic_design_style:
      "Editorial layout with generous negative space, crisp border dividers, and subtle glassmorphic panels.",
    iconography_style: "Monoline 2px stroke icons with rounded caps (Lucide / Heroicons style).",
    shapes_and_patterns: "Subtle 24px dot grids and isometric circuit nodes.",
    background_treatment: "Deep dark slate with subtle radial lighting vignettes.",
    textures: "Subtle mesh gradients and fine mathematical noise.",
    use_of_gradients: "Restrained linear gradients between Indigo (#6366F1) and Sky (#0284C7).",
    visual_density: "balanced",
    composition: "Left-anchored content with balanced right-side schematic visuals.",
    negative_space: "Maintain minimum 30% negative space on all major marketing collaterals.",
    image_treatment: "Natural contrast, slightly cool color temperature, authentic lighting.",
    color_grading: "Cool tone balance (5200K - 5600K) with deep shadow retention.",
    preferred_styles_examples: ["Isometric network topology diagrams", "Candid engineering war-room photos"],
    prohibited_styles_examples: ["Cartoon caricatures", "Cheesy handshake stock photography", "Neon lens flares"],
  },
  layout_spacing: {
    alignment: "left",
    grid_system: "8pt grid system with 12-column responsive layout",
    spacing_principles: "Multiples of 8px (8, 16, 24, 32, 48, 64px) for all margins and padding.",
    padding_guidelines: "Cards require 24px internal padding; modals require 32px padding.",
    border_divider_usage: "1px solid border (#1E293B) with subtle opacity.",
    corner_radius: "12px for standard cards and containers; 8px for buttons; 9999px for status pills.",
    shadow_usage: "Subtle elevation shadows: 0 10px 25px -5px rgba(0, 0, 0, 0.4).",
    content_hierarchy: "Eyebrow tag -> Main Title -> Subtitle -> Supporting Body -> Action Group.",
    logo_to_content_spacing: "Minimum 32px separation between logo and nearest headline or visual element.",
    safe_area_principles: "Never place text within 24px of any canvas edge.",
  },
  dos_and_donts: [
    {
      id: "rule_1",
      title: "Always Validate Quantitative Claims",
      description: "Every latency or uptime percentage must cite certified benchmarks and testing methodology.",
      type: "mandatory",
      priority: "critical",
    },
    {
      id: "rule_2",
      title: "Maintain Wordmark Safe Area Margin",
      description: "Ensure at least 24px margin padding around all four sides of the primary logo.",
      type: "mandatory",
      priority: "high",
    },
    {
      id: "rule_3",
      title: "No Fear, Uncertainty, or Doubt (Anti-FUD)",
      description: "Never use fear-inducing sales tactics or aggressive competitor bashing.",
      type: "prohibited",
      priority: "high",
    },
    {
      id: "rule_4",
      title: "Adhere to Approved Color Palettes",
      description: "Do not introduce arbitrary unapproved neon or pastel hues outside official brand specifications.",
      type: "prohibited",
      priority: "medium",
    },
    {
      id: "rule_5",
      title: "Consistent Call-to-Action Terminology",
      description: "Use descriptive action verbs (e.g. 'Deploy Sovereign Mesh') instead of vague 'Click Here'.",
      type: "recommended",
      priority: "low",
    },
    {
      id: "rule_6",
      title: "Avoid Generic Stock Imagery",
      description: "Do not use stereotypical stock photos of suited businessmen shaking hands.",
      type: "common_mistake",
      priority: "medium",
    },
  ],
  compliance: [
    {
      id: "comp_1",
      title: "Quantitative Benchmark Disclaimer",
      category: "disclaimer",
      rule_text:
        "Performance statistics verified under standardized enterprise lab benchmarks (Q1 2026). Individual enterprise latency results may vary based on topological proximity.",
      requirement_level: "mandatory",
    },
    {
      id: "comp_2",
      title: "Registered Trademark Notice",
      category: "trademark",
      rule_text:
        "Acme Cloud Systems™, Acme Core Fabric™, and Sovereign Mesh™ are registered trademarks of Acme Cloud Systems Inc.",
      requirement_level: "mandatory",
    },
    {
      id: "comp_3",
      title: "Availability & SLA Disclosures",
      category: "regulatory",
      rule_text:
        "99.999% SLA availability applies strictly to sovereign multi-region clusters backed by enterprise support agreements.",
      requirement_level: "conditional",
    },
    {
      id: "comp_4",
      title: "Accessibility WCAG Standard",
      category: "accessibility",
      rule_text:
        "All public facing visual media, banners, and digital ads must achieve minimum WCAG 2.1 AA 4.5:1 contrast ratio.",
      requirement_level: "mandatory",
    },
  ],
  assets_library: [
    {
      id: "ass_1",
      name: "Primary Dark Theme Wordmark",
      type: "logo",
      file_url: "https://assets.acmecloud.com/logos/acme-primary.svg",
      description: "Vector SVG format wordmark for dark backgrounds.",
      usage_restrictions: "Do not distort or stretch.",
      campaign: "Global Corporate",
      approval_status: "approved",
    },
    {
      id: "ass_2",
      name: "Sovereign Cloud Mesh Architecture Diagram",
      type: "reference_design",
      file_url: "https://assets.acmecloud.com/graphics/mesh-topo.png",
      description: "Approved isometric topology diagram for technical presentations.",
      usage_restrictions: "Authorized for customer facing architecture briefings.",
      campaign: "Core Fabric 2026",
      approval_status: "approved",
    },
    {
      id: "ass_3",
      name: "Brand Guidelines PDF Specification v2026.1",
      type: "document",
      file_url: "https://assets.acmecloud.com/docs/acme-brand-book-2026.pdf",
      description: "Complete PDF brand guidelines and design system reference.",
      usage_restrictions: "Internal and certified agency distribution.",
      campaign: "Enterprise Governance",
      approval_status: "approved",
    },
  ],
  media_guidelines: {
    social_media: {
      enabled: true,
      description: "Governance rules for LinkedIn, X (Twitter), Facebook, and YouTube social campaign banners.",
      inherit_brand_defaults: true,
      overrides: { primary_color: "#0F172A", cta_style: "High-contrast action banner" },
      platforms: [
        {
          platform: "LinkedIn",
          placement: "Feed Banner",
          dimensions: "1200x627",
          aspect_ratio: "1.91:1",
          safe_areas: "40px margin on all sides",
          text_density_limit: "Maximum 20% canvas text area",
          headline_size: "28px Outfit Bold",
          body_size: "15px Inter Regular",
          cta_rules: "Bottom-right pill button with 4.5:1 contrast",
          logo_placement: "Top-left 32px offset",
          export_format: "PNG (Lossless)",
        },
        {
          platform: "X (Twitter)",
          placement: "In-Stream Card",
          dimensions: "1600x900",
          aspect_ratio: "16:9",
          safe_areas: "30px margins",
          text_density_limit: "Concise text under 15 words",
          headline_size: "32px Outfit Bold",
          body_size: "16px Inter",
          cta_rules: "Visible action prompt",
          logo_placement: "Top-left or Bottom-right",
          export_format: "PNG / JPG",
        },
        {
          platform: "YouTube",
          placement: "Video Thumbnail",
          dimensions: "1280x720",
          aspect_ratio: "16:9",
          safe_areas: "Avoid bottom-right timestamp zone (160x50px)",
          text_density_limit: "Under 6 words in high-contrast display type",
          headline_size: "48px Outfit Black",
          body_size: "N/A",
          cta_rules: "Visual focal point",
          logo_placement: "Top-left",
          export_format: "PNG / JPG",
        },
      ],
      mandatory_rules: [
        "Include primary Acme wordmark with 24px clear space",
        "WCAG AA contrast on all overlaid copy",
      ],
      prohibited_elements: ["Generic unbranded stock photos", "Unapproved color gradients"],
    },
    photography: {
      enabled: true,
      description: "Visual standards for professional photoshoot production, employee portraits, and facility imagery.",
      inherit_brand_defaults: true,
      overrides: {},
      lighting: "Natural diffused lighting with cool directional rim accents.",
      composition: "Rule of thirds; intentional negative space for headline overlay.",
      framing: "Medium close-up for portraits; wide-angle schematic depth for data centers.",
      color_grading: "Cool neutral palette (5400K) preserving natural skin tones and deep slate shadows.",
      retouching_restrictions:
        "Minor blemish cleanup permitted; altering physical features or heavy AI smoothing is prohibited.",
      product_visibility: "Enterprise hardware must show genuine industrial design without exaggerated 3D glows.",
      model_direction: "Authentic, focused, collaborative demeanor.",
      required_resolutions: "Minimum 300 DPI for print, minimum 4K (3840x2160) for digital master archives.",
      output_formats: "TIFF / Adobe RGB 1998 for master archives; WebP / PNG for digital.",
    },
    video: {
      enabled: true,
      description: "Motion graphics, product demos, webinar recordings, and promotional video reels.",
      inherit_brand_defaults: true,
      overrides: {},
      video_styles: ["Cinematic Realism", "Technical Product Walkthrough", "Executive Keynote"],
      aspect_ratios: ["16:9 (Landscape)", "9:16 (Vertical Reel)", "1:1 (Square)"],
      resolutions: ["1080p (1920x1080)", "4K (3840x2160)"],
      frame_rates: ["24 fps (Cinematic)", "30 fps (Web)", "60 fps (Product Screencasts)"],
      duration_recommendations: "Social clips: 15-45s; Product demos: 90-180s; Keynotes: 15-30min.",
      opening_hook_rules: "Brand identity or compelling customer problem statement within first 3 seconds.",
      logo_appearance_timing: "Opening bug (lower left) or dedicated 1.5s motion intro.",
      subtitles_placement: "Centered lower-third with 10% black translucent backing box for readability.",
      music_restrictions:
        "Modern ambient electronic or subtle orchestral. Prohibit aggressive trap or cheerful ukelele tracks.",
      end_card_cta: "Clear URL (acmecloud.com) with approved logo and certified disclaimer.",
      export_formats: "MP4 (H.264 / AAC) at 15-25 Mbps bitrate.",
    },
    print: {
      enabled: true,
      description: "Standards for physical exhibition booths, brochures, print ads, and whitepapers.",
      inherit_brand_defaults: true,
      overrides: {},
      dpi: 300,
      color_mode: "CMYK & Pantone Matching System (PMS)",
      bleed: "3mm (0.125 in) all sides",
      safe_margin: "5mm (0.2 in) inside trim line",
      paper_finishes: ["Matte Coated 120gsm (Brochures)", "Heavy Silk 300gsm (Business Collaterals)"],
      export_format: "PDF/X-1a:2001 with embedded fonts and crop marks",
    },
    web_ads: {
      enabled: true,
      description: "Google Display Network, programmatic banners, and digital marketing placements.",
      inherit_brand_defaults: true,
      overrides: {},
      standard_sizes: [
        "300x250 (Medium Rectangle)",
        "728x90 (Leaderboard)",
        "160x600 (Skyscraper)",
        "300x600 (Half Page)",
      ],
      max_file_size_kb: 150,
      animation_rules: "Maximum 15 seconds animation loop. No rapid strobing or deceptive click triggers.",
      mobile_adaptations: "Responsive scaling with minimum 14px font size on mobile screens.",
    },
    custom_media: [],
  },
};

function getStoredBrandProfile(): BrandGuidelineProfile {
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("inkloom_brand_guideline_profile_v3");
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {}
  }
  return {
    id: "guide_acme_master",
    organization_id: "org_acme_cloud",
    name: "Acme Cloud Master Brand Standard 2026",
    description: "Official corporate guidelines governing tone, terminology, typography, and certified performance claims.",
    version: "2026.1.0",
    status: "published",
    is_active: true,
    published_at: "2026-02-15T09:00:00Z",
    published_by: "Alex Mercer (Manager)",
    is_manager: true,
    draft_data: DEFAULT_MOCK_BRAND_GUIDELINE_DATA,
    published_data: DEFAULT_MOCK_BRAND_GUIDELINE_DATA,
    created_at: "2026-01-10T08:00:00Z",
    updated_at: "2026-02-15T09:00:00Z",
  };
}

function saveStoredBrandProfile(profile: BrandGuidelineProfile) {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("inkloom_brand_guideline_profile_v3", JSON.stringify(profile));
    } catch (e) {}
  }
}

function getStoredBrandVersions(): BrandGuidelineVersionInfo[] {
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("inkloom_brand_guideline_versions_v3");
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {}
  }
  return [
    {
      id: "ver_acme_master_2026_1",
      guideline_id: "guide_acme_master",
      organization_id: "org_acme_cloud",
      version: "2026.1.0",
      changelog: "Official publication of Acme Cloud Systems enterprise brand standards 2026.",
      published_by: "Alex Mercer (Manager)",
      published_at: "2026-02-15T09:00:00Z",
      snapshot_data: DEFAULT_MOCK_BRAND_GUIDELINE_DATA,
    },
  ];
}

function saveStoredBrandVersions(versions: BrandGuidelineVersionInfo[]) {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("inkloom_brand_guideline_versions_v3", JSON.stringify(versions));
    } catch (e) {}
  }
}

export class MockApiService implements IApiService {
  async getSubmissions(): Promise<ContentSubmission[]> {
    return getStoredSubmissions();
  }

  async getSubmission(id: string): Promise<ContentSubmission> {
    const subs = getStoredSubmissions();
    const item = subs.find((s) => s.id === id);
    if (!item) throw new Error(`Submission with id ${id} not found.`);
    return item;
  }

  async createSubmission(data: CreateSubmissionInput): Promise<ContentSubmission> {
    const subs = getStoredSubmissions();
    const subId = `sub_${Math.random().toString(36).substring(2, 10)}`;
    const revId = `rev_${Date.now()}`;
    const newSub: ContentSubmission = {
      id: subId,
      organization_id: "org_acme_cloud",
      creator_id: "user_designer_active",
      creator_name: "Leo Vance (Designer)",
      title: data.title,
      description: data.description,
      content_type: data.content_type,
      status: "pending_approval",
      current_revision_id: revId,
      raw_text: data.initial_text || data.media_url,
      file_name: data.file_name || (data.content_type === "image" ? `${data.title.replace(/\s+/g, "_")}.png` : undefined),
      file_path: data.file_path || data.media_url,
      media_url: data.media_url,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    subs.unshift(newSub);
    saveStoredSubmissions(subs);

    // Automatically generate and persist AI Audit Result
    const audit = generateAuditForSubmission(newSub);
    saveStoredAudit(audit.audit_id, audit);
    saveStoredAudit(subId, audit);

    return newSub;
  }

  async createRevision(submissionId: string, data: { raw_text?: string; file_name?: string; file_path?: string; file_size_bytes?: number }): Promise<any> {
    const subs = getStoredSubmissions();
    const idx = subs.findIndex((s) => s.id === submissionId);
    const revId = `rev_${Date.now()}`;
    if (idx !== -1) {
      if (data.file_path) {
        subs[idx].file_path = data.file_path;
        subs[idx].media_url = data.file_path;
      }
      if (data.file_name) subs[idx].file_name = data.file_name;
      if (data.raw_text) subs[idx].raw_text = data.raw_text;
      subs[idx].current_revision_id = revId;
      subs[idx].updated_at = new Date().toISOString();
      saveStoredSubmissions(subs);
    }
    return {
      id: revId,
      submission_id: submissionId,
      version_number: 2,
      raw_text: data.raw_text,
      file_name: data.file_name,
      file_path: data.file_path,
      created_at: new Date().toISOString(),
    };
  }

  async triggerAudit(submissionId: string, revisionId?: string): Promise<AuditResult> {
    const subs = getStoredSubmissions();
    const sub = subs.find((s) => s.id === submissionId);
    if (sub) {
      sub.status = "pending_approval";
      sub.updated_at = new Date().toISOString();
      saveStoredSubmissions(subs);
    }
    const audits = getStoredAudits();
    if (audits[submissionId]) {
      return audits[submissionId];
    }
    const generated = generateAuditForSubmission(
      sub || {
        id: submissionId,
        organization_id: "org_acme_cloud",
        creator_id: "user_designer",
        title: "Design Visual Asset",
        content_type: "image",
        status: "pending_approval",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    );
    saveStoredAudit(generated.audit_id, generated);
    saveStoredAudit(submissionId, generated);
    return generated;
  }

  async getAudit(auditId: string): Promise<AuditResult> {
    const audits = getStoredAudits();
    if (audits[auditId]) {
      return audits[auditId];
    }
    const subs = getStoredSubmissions();
    const matchingSub = subs.find((s) => s.id === auditId);
    if (matchingSub) {
      const generated = generateAuditForSubmission(matchingSub);
      saveStoredAudit(generated.audit_id, generated);
      saveStoredAudit(matchingSub.id, generated);
      return generated;
    }
    return { ...MOCK_AUDIT_RESULT, audit_id: auditId };
  }

  async getPendingReviews(): Promise<ContentSubmission[]> {
    const subs = getStoredSubmissions();
    return subs.filter((s) =>
      ["pending_approval", "changes_requested", "submitted"].includes(s.status)
    );
  }

  async submitReviewDecision(data: ReviewDecisionInput): Promise<ReviewDecision> {
    const subs = getStoredSubmissions();
    const sub = subs.find((s) => s.id === data.submission_id);
    if (sub) {
      if (data.action === "approve") sub.status = "approved";
      else if (data.action === "reject") sub.status = "rejected";
      else if (data.action === "request_changes") sub.status = "changes_requested";
      sub.updated_at = new Date().toISOString();
      saveStoredSubmissions(subs);
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

  async getGuidelineProfile(): Promise<BrandGuidelineProfile> {
    const profile = getStoredBrandProfile();
    // Check current active role
    let isManager = true;
    if (typeof window !== "undefined") {
      try {
        const storedRole = localStorage.getItem("inkloom_active_role") || "admin";
        isManager = ["admin", "compliance_officer", "reviewer"].includes(storedRole.toLowerCase());
      } catch (e) {}
    }
    return {
      ...profile,
      is_manager: isManager,
      draft_data: isManager ? profile.draft_data : undefined,
    };
  }

  async saveDraftGuideline(draftData: BrandGuidelineData, name?: string, description?: string): Promise<BrandGuidelineProfile> {
    const profile = getStoredBrandProfile();
    profile.draft_data = draftData;
    if (name) profile.name = name;
    if (description !== undefined) profile.description = description;
    profile.status = profile.published_data ? "changes_pending" : "draft";
    profile.updated_at = new Date().toISOString();
    saveStoredBrandProfile(profile);
    return {
      ...profile,
      is_manager: true,
    };
  }

  async publishGuideline(version: string, changelog?: string): Promise<BrandGuidelineProfile> {
    const profile = getStoredBrandProfile();
    const draft = profile.draft_data || profile.published_data || DEFAULT_MOCK_BRAND_GUIDELINE_DATA;
    const now = new Date().toISOString();
    const publisher = "Alex Mercer (Manager)";

    profile.published_data = draft;
    profile.version = version;
    profile.status = "published";
    profile.published_at = now;
    profile.published_by = publisher;
    profile.updated_at = now;

    saveStoredBrandProfile(profile);

    // Save version history record
    const versions = getStoredBrandVersions();
    const newVersion: BrandGuidelineVersionInfo = {
      id: `ver_${Date.now()}`,
      guideline_id: profile.id,
      organization_id: profile.organization_id,
      version,
      changelog: changelog || `Published version ${version} by ${publisher}.`,
      published_by: publisher,
      published_at: now,
      snapshot_data: draft,
    };
    versions.unshift(newVersion);
    saveStoredBrandVersions(versions);

    return {
      ...profile,
      is_manager: true,
    };
  }

  async getGuidelineVersions(): Promise<BrandGuidelineVersionInfo[]> {
    return getStoredBrandVersions();
  }

  async restoreGuidelineVersion(versionId: string): Promise<BrandGuidelineProfile> {
    const versions = getStoredBrandVersions();
    const target = versions.find((v) => v.id === versionId);
    if (!target) throw new Error("Version not found");

    const profile = getStoredBrandProfile();
    profile.draft_data = target.snapshot_data;
    profile.status = "changes_pending";
    profile.updated_at = new Date().toISOString();
    saveStoredBrandProfile(profile);

    return {
      ...profile,
      is_manager: true,
    };
  }

  async submitGuidelineForReview(notes: string, requiresLegalApproval: boolean = true, jurisdiction?: string, industry?: string): Promise<BrandGuidelineProfile> {
    const profile = getStoredBrandProfile();
    profile.status = "submitted";
    profile.submitted_by = "Alex Mercer (Manager)";
    profile.submitted_at = new Date().toISOString();
    profile.submission_notes = notes;
    profile.requires_legal_approval = requiresLegalApproval;
    if (jurisdiction) profile.jurisdiction = jurisdiction;
    if (industry) profile.industry = industry;
    saveStoredBrandProfile(profile);
    return { ...profile, is_manager: true, can_edit: true };
  }

  async getPendingGuidelineReviews(): Promise<BrandGuidelineProfile[]> {
    const profile = getStoredBrandProfile();
    return profile.status === "submitted" || profile.status === "changes_requested" ? [profile] : [];
  }

  async recordGuidelineReviewDecision(decision: "approved" | "rejected" | "changes_requested", rationale: string): Promise<BrandGuidelineProfile> {
    const profile = getStoredBrandProfile();
    profile.status = decision;
    profile.review_decision = decision;
    profile.review_rationale = rationale;
    profile.reviewed_by = "Elena Rostova (Compliance Officer)";
    profile.reviewed_at = new Date().toISOString();
    saveStoredBrandProfile(profile);
    return { ...profile, is_manager: true, can_review_legal: true };
  }

  async checkGuidelineConflicts(): Promise<ConflictCheckResult> {
    return {
      total_conflicts: 1,
      conflicts: [
        {
          rule_name: "Web Ads Contrast Override (3.8:1)",
          conflicting_with: "W3C WCAG 2.1 AA Contrast Mandate (4.5:1)",
          category: "accessibility",
          priority_high: "Priority 1 (Mandatory Legal)",
          priority_low: "Priority 4 (Media Override)",
          explanation: "Digital advertisement contrast ratio of 3.8:1 falls below the mandatory WCAG 2.1 AA standard of 4.5:1.",
          escalate_to_legal: true,
          remediation_suggestion: "Adjust secondary text color to achieve at least 4.5:1 contrast against light backgrounds.",
        },
      ],
      priority_hierarchy: [
        { level: 1, name: "Mandatory Legal Requirements", description: "Statutes, regulations, and public safety mandates (e.g. FTC Act §5, WCAG 2.1 AA)." },
        { level: 2, name: "Organization Legal & Compliance Policies", description: "Internal policies, disclaimers, and certified benchmarks." },
        { level: 3, name: "Official Brand Standards", description: "Brand voice, logo usage, color systems, and typography." },
        { level: 4, name: "Channel & Campaign Rules", description: "Media-specific overrides and promotional rules." },
        { level: 5, name: "Advisory Recommendations", description: "AI suggestions and aesthetic tips." },
      ],
      compliance_disclaimer: "Inkloom AI conflict detection assists organizational decision-making by applying documented governance priority hierarchies. It does not replace qualified legal review.",
    };
  }

  async getStarterTemplates(jurisdiction: string = "all", industry: string = "all"): Promise<{ total_templates: number; templates: StarterTemplateRule[]; compliance_disclaimer: string }> {
    return {
      total_templates: 4,
      templates: [
        {
          category: "claim_verification",
          rule_name: "Objective Performance Claims Substantiation",
          rule_type: "legal_mandatory",
          priority_level: 1,
          jurisdiction: "US",
          industry: "General",
          authoritative_source: "FTC Policy Statement on Deception (103 F.T.C. 110)",
          source_url: "https://www.ftc.gov/legal-library/browse/ftc-policy-statement-deception",
          verification_status: "verified",
          severity_default: "critical",
          requires_human_review: true,
          description: "Objective quantitative claims require documented pre-existing scientific, technical, or benchmark substantiation.",
          rule_definition: { requires_prior_evidence: true },
          required_disclosure: "Results based on internal enterprise testing; individual operational results may vary.",
        },
        {
          category: "accessibility",
          rule_name: "W3C WCAG 2.1 AA Minimum Text Contrast Ratio (4.5:1)",
          rule_type: "legal_mandatory",
          priority_level: 1,
          jurisdiction: "Global",
          industry: "General",
          authoritative_source: "W3C WCAG 2.1 SC 1.4.3",
          source_url: "https://www.w3.org/TR/WCAG21/#contrast-minimum",
          verification_status: "verified",
          severity_default: "high",
          requires_human_review: false,
          description: "Text must have a contrast ratio of at least 4.5:1 against its background.",
          rule_definition: { min_contrast_normal: 4.5 },
        },
      ],
      compliance_disclaimer: "Templates provide reference points for organizational compliance policies and do not constitute legal advice.",
    };
  }

  async reportUnclearRule(ruleReference: string, reportType: string, description: string): Promise<ClarificationReport> {
    return {
      id: `rep_${Date.now()}`,
      guideline_id: "guideline_acme_official",
      organization_id: "org_acme_cloud",
      user_email: "employee@acmecloud.com",
      user_name: "Marketing Creator",
      rule_reference: ruleReference,
      report_type: reportType,
      description,
      status: "open",
      created_at: new Date().toISOString(),
    };
  }

  async getClarificationReports(): Promise<ClarificationReport[]> {
    return [
      {
        id: "rep_sample_01",
        guideline_id: "guideline_acme_official",
        organization_id: "org_acme_cloud",
        user_email: "maya.lin@acmecloud.com",
        user_name: "Maya Lin (Marketing Lead)",
        rule_reference: "Brand Voice - Words to Avoid",
        report_type: "unclear",
        description: "Can we use 'robust' when referring to cloud encryption protocols?",
        status: "open",
        created_at: new Date().toISOString(),
      },
    ];
  }

  async resolveClarificationReport(reportId: string, status: "resolved" | "dismissed", resolutionNotes: string): Promise<ClarificationReport> {
    return {
      id: reportId,
      guideline_id: "guideline_acme_official",
      organization_id: "org_acme_cloud",
      user_email: "maya.lin@acmecloud.com",
      user_name: "Maya Lin (Marketing Lead)",
      rule_reference: "Brand Voice - Words to Avoid",
      report_type: "unclear",
      description: "Can we use 'robust' when referring to cloud encryption protocols?",
      status,
      resolution_notes: resolutionNotes,
      resolved_by: "Elena Rostova (Compliance Officer)",
      resolved_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };
  }

  async rollbackGuideline(versionId: string, rationale: string): Promise<BrandGuidelineProfile> {
    const versions = getStoredBrandVersions();
    const target = versions.find((v) => v.id === versionId);
    if (!target) throw new Error("Target version not found");

    const profile = getStoredBrandProfile();
    const newVersionTag = `${profile.version}.rollback-${Date.now()}`;
    profile.published_data = target.snapshot_data;
    profile.draft_data = target.snapshot_data;
    profile.version = newVersionTag;
    profile.status = "published";
    profile.updated_at = new Date().toISOString();
    saveStoredBrandProfile(profile);

    return { ...profile, is_manager: true };
  }


  async getEffectiveSettings(mediaType: string): Promise<EffectiveSettings> {
    const profile = getStoredBrandProfile();
    const source = profile.draft_data || profile.published_data || DEFAULT_MOCK_BRAND_GUIDELINE_DATA;
    const generalIdentity = source.identity || {};
    const generalColors = source.colors || { palette: [] };
    const generalTypography = source.typography || {};
    const generalVoice = source.voice || {};

    const mediaGuidelines = source.media_guidelines || {};
    const specific = (mediaGuidelines as any)[mediaType] || {};

    const primaryHex = generalColors.palette?.find((c: any) => c.role === "primary")?.hex || "#0F172A";

    const effective: Record<string, any> = {
      brand_name: generalIdentity.brand_name || "Acme Cloud Systems",
      primary_color: primaryHex,
      primary_font: generalTypography.primary_font || "Inter",
      brand_tone: generalVoice.brand_tone || ["Professional", "Consultative"],
    };

    const inheritedKeys = ["brand_name", "primary_color", "primary_font", "brand_tone"];
    const overriddenKeys: string[] = [];
    const conflicts: any[] = [];

    if (specific.enabled !== false && specific.overrides) {
      for (const [k, v] of Object.entries(specific.overrides)) {
        if (v !== undefined && v !== "") {
          effective[k] = v;
          const idx = inheritedKeys.indexOf(k);
          if (idx !== -1) inheritedKeys.splice(idx, 1);
          overriddenKeys.push(k);
        }
      }

      if (specific.overrides.contrast_ratio && specific.overrides.contrast_ratio < 4.5) {
        conflicts.push({
          field: "contrast_ratio",
          severity: "critical",
          message: `Media override contrast ratio (${specific.overrides.contrast_ratio}:1) violates General Brand WCAG AA standard (min 4.5:1).`,
        });
      }
    }

    return {
      media_type: mediaType,
      effective_settings: effective,
      inherited_keys: inheritedKeys,
      overridden_keys: overriddenKeys,
      conflicts,
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
    const cleanEmail = email.toLowerCase().trim();
    const isNova = cleanEmail.includes("novabio");
    const isDesigner = cleanEmail.includes("designer") || cleanEmail.includes("creative");
    const isMarketing = cleanEmail.includes("marketing") || cleanEmail.includes("creator") || cleanEmail.includes("employee");
    const isCompliance = cleanEmail.includes("compliance") || cleanEmail.includes("legal") || cleanEmail.includes("reviewer");

    const orgId = isNova ? "org_novabio_health" : "org_acme_cloud";
    const orgName = isNova ? "NovaBio Health Sciences" : "Acme Cloud Systems";
    const orgSlug = isNova ? "novabio-health" : "acme-cloud";

    let role = "admin";
    if (isDesigner) role = "designer";
    else if (isMarketing) role = "marketing";
    else if (isCompliance) role = "compliance_officer";

    // Known Persona Full Names
    const PERSONA_NAMES: Record<string, string> = {
      "admin@acmecloud.com": "Alex Mercer (Manager)",
      "compliance@acmecloud.com": "Elena Rostova (Legal & Compliance)",
      "designer@acmecloud.com": "Leo Vance (Senior Designer)",
      "marketing@acmecloud.com": "Maya Lin (Marketing Lead)",
      "admin@novabio.com": "Dr. Rachel Hayes (Biotech Admin)",
      "compliance@novabio.com": "Marcus Thorne (FDA Regulatory)",
      "employee@acmecloud.com": "Staff Member (Marketing)",
    };

    const fullName =
      PERSONA_NAMES[cleanEmail] ||
      cleanEmail
        .split("@")[0]
        .replace(/[._-]/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());

    return {
      access_token: `mock_jwt_token_${Date.now()}`,
      token_type: "bearer",
      user: {
        id: `user_${cleanEmail.replace(/[^a-zA-Z0-9]/g, "_")}`,
        email: cleanEmail,
        full_name: fullName,
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

  async logout(): Promise<{ message: string; revoked: boolean }> {
    return { message: "Mock logout successful", revoked: true };
  }

  // --- Designer Feedback & Change Request Comments ---
  private commentsStore: ContentComment[] = [
    {
      id: "cm_1",
      submission_id: "b5b271f5-507a-4346-9c2e-fb793f67e43d",
      organization_id: "org_acme_cloud",
      author_id: "user_acme_compliance",
      author_name: "Elena Rostova (Legal & Regulatory)",
      author_role: "compliance_officer",
      comment_text: "Mandatory FTC disclaimer text is missing from bottom left corner of graphic asset. Please add: 'Based on internal benchmark tests across 10,000 enterprise clusters.'",
      category: "legal_compliance",
      is_resolved: false,
      created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
      updated_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    },
    {
      id: "cm_2",
      submission_id: "b5b271f5-507a-4346-9c2e-fb793f67e43d",
      organization_id: "org_acme_cloud",
      author_id: "user_acme_admin",
      author_name: "Alex Mercer (Manager)",
      author_role: "admin",
      comment_text: "Ensure Acme Cloud primary logo maintains 32px clear exclusion zone around the tagline.",
      category: "visual_design",
      is_resolved: true,
      resolved_at: new Date(Date.now() - 3600000).toISOString(),
      resolved_by: "Leo Vance (Designer)",
      resolution_note: "Updated clear-space padding to 40px in vector master.",
      created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
      updated_at: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: "cm_3",
      submission_id: "b5b271f5-507a-4346-9c2e-fb793f67e43d",
      organization_id: "org_acme_cloud",
      author_id: "user_acme_marketing",
      author_name: "Maya Lin (Marketing Lead)",
      author_role: "marketing",
      comment_text: "Use the approved active headline font 'Inter Display' instead of Roboto Slab to align with Q4 campaign standard.",
      category: "brand_rules",
      is_resolved: false,
      created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
      updated_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
  ];

  async getSubmissionComments(submissionId: string): Promise<CommentsListResponse> {
    const matched = this.commentsStore.filter((c) => c.submission_id === submissionId);
    // If no comments yet, generate standard starter review comments for evaluation
    if (matched.length === 0) {
      const seeded: ContentComment[] = [
        {
          id: `cm_seed_${Date.now()}_1`,
          submission_id: submissionId,
          organization_id: "org_acme_cloud",
          author_id: "user_acme_compliance",
          author_name: "Elena Rostova (Legal & Regulatory)",
          author_role: "compliance_officer",
          comment_text: "Please verify statutory claim substantiation or add qualification asterisk before release.",
          category: "legal_compliance",
          is_resolved: false,
          created_at: new Date(Date.now() - 1800000).toISOString(),
          updated_at: new Date(Date.now() - 1800000).toISOString(),
        },
        {
          id: `cm_seed_${Date.now()}_2`,
          submission_id: submissionId,
          organization_id: "org_acme_cloud",
          author_id: "user_acme_admin",
          author_name: "Alex Mercer (Manager)",
          author_role: "admin",
          comment_text: "Review contrast on headline typography to ensure WCAG AA compliance.",
          category: "visual_design",
          is_resolved: true,
          resolved_at: new Date(Date.now() - 600000).toISOString(),
          resolved_by: "Leo Vance (Designer)",
          resolution_note: "Fixed typography contrast ratio to 4.8:1.",
          created_at: new Date(Date.now() - 3600000).toISOString(),
          updated_at: new Date(Date.now() - 600000).toISOString(),
        },
      ];
      this.commentsStore.push(...seeded);
      return {
        comments: seeded,
        total_count: seeded.length,
        open_count: seeded.filter((c) => !c.is_resolved).length,
        resolved_count: seeded.filter((c) => c.is_resolved).length,
      };
    }
    const total = matched.length;
    const resolved = matched.filter((c) => c.is_resolved).length;
    return {
      comments: [...matched].reverse(),
      total_count: total,
      open_count: total - resolved,
      resolved_count: resolved,
    };
  }

  async addSubmissionComment(submissionId: string, commentText: string, category: string = "visual_design"): Promise<ContentComment> {
    const newComment: ContentComment = {
      id: `cm_${Date.now()}`,
      submission_id: submissionId,
      organization_id: "org_acme_cloud",
      author_id: "user_reviewer",
      author_name: "Team Reviewer",
      author_role: "compliance_officer",
      comment_text: commentText,
      category,
      is_resolved: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.commentsStore.push(newComment);
    return newComment;
  }

  async toggleCommentResolution(
    submissionId: string,
    commentId: string,
    isResolved: boolean,
    resolutionNote?: string
  ): Promise<ContentComment> {
    const comment = this.commentsStore.find((c) => c.id === commentId && c.submission_id === submissionId);
    if (!comment) throw new Error("Comment not found.");
    comment.is_resolved = isResolved;
    comment.resolved_at = isResolved ? new Date().toISOString() : null;
    comment.resolved_by = isResolved ? "Leo Vance (Designer)" : null;
    comment.resolution_note = isResolved ? (resolutionNote || "Fixed by designer") : null;
    comment.updated_at = new Date().toISOString();
    return { ...comment };
  }

  // --- Brand Assistant & Document Intelligence Mock State ---
  private mockDocumentsStore: KnowledgeDocument[] = [
    {
      id: "doc_mock_1",
      organization_id: "org_acme_cloud",
      filename: "Acme_Brand_Identity_Standard_2026.pdf",
      file_size_bytes: 4210000,
      mime_type: "application/pdf",
      status: "ready",
      page_count: 24,
      chunks_count: 68,
      created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
      updated_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    },
    {
      id: "doc_mock_2",
      organization_id: "org_acme_cloud",
      filename: "Digital_Accessibility_and_Color_Specs.docx",
      file_size_bytes: 1850000,
      mime_type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      status: "ready",
      page_count: 8,
      chunks_count: 22,
      created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
      updated_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    },
  ];

  private mockSessionsStore: ChatSession[] = [
    {
      id: "ses_mock_1",
      organization_id: "org_acme_cloud",
      user_id: "user_reviewer",
      title: "Logo on dark blue background inquiry",
      created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
      updated_at: new Date(Date.now() - 3600000 * 2).toISOString(),
      message_count: 2,
    },
  ];

  private mockMessagesStore: Record<string, ChatMessage[]> = {
    ses_mock_1: [
      {
        id: "msg_user_1",
        session_id: "ses_mock_1",
        role: "user",
        content: "Can I use a white logo on a dark blue background?",
        created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
      },
      {
        id: "msg_asst_1",
        session_id: "ses_mock_1",
        role: "assistant",
        content:
          "Yes, you can. According to **Acme Brand Identity Standard 2026** (Page 4, Logo Usage & Backgrounds):\n\n> \"The white knockout (reversed) logo must always be used when placed against dark blue, black, or deep navy backgrounds. Never apply the full-color red logo over dark backgrounds.\"\n\nPlease ensure you maintain the minimum 16px clear space perimeter around the mark.",
        citations: [
          {
            document_id: "doc_mock_1",
            document_name: "Acme_Brand_Identity_Standard_2026.pdf",
            page: 4,
            section: "Logo Usage & Backgrounds",
            source_type: "document",
            snippet:
              "The white knockout (reversed) logo must always be used when placed against dark blue, black, or deep navy backgrounds. Never apply the full-color red logo over dark backgrounds.",
          },
        ],
        confidence: "high",
        feedback: { helpful: true, comment: "Accurate rule citation." },
        created_at: new Date(Date.now() - 3600000 * 2 + 1500).toISOString(),
      },
    ],
  };

  async askAssistant(payload: AskQuestionRequest): Promise<AskQuestionResponse> {
    const qLower = payload.question.toLowerCase();
    let sessionId = payload.session_id;

    if (!sessionId) {
      sessionId = `ses_${Date.now()}`;
      const title = payload.question.trim().slice(0, 35) + (payload.question.length > 35 ? "..." : "");
      this.mockSessionsStore.unshift({
        id: sessionId,
        organization_id: "org_acme_cloud",
        user_id: "user_reviewer",
        title,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        message_count: 0,
      });
      this.mockMessagesStore[sessionId] = [];
    }

    // Save user message
    const userMsg: ChatMessage = {
      id: `msg_u_${Date.now()}`,
      session_id: sessionId,
      role: "user",
      content: payload.question,
      created_at: new Date().toISOString(),
    };
    this.mockMessagesStore[sessionId].push(userMsg);

    // Formulate response
    let answer = "";
    let confidence = "high";
    let citations: CitationItem[] = [];

    if (qLower.includes("logo") && (qLower.includes("blue") || qLower.includes("dark") || qLower.includes("white") || qLower.includes("background"))) {
      answer =
        "According to your organization's brand documentation in **Acme_Brand_Identity_Standard_2026.pdf** (Page 4):\n\n> \"The white knockout (reversed) logo must always be used when placed against dark blue, black, or deep navy backgrounds. Never apply the full-color red logo over dark backgrounds.\"\n\nPlease refer to the source citation for full operational specifications.";
      citations = [
        {
          document_id: "doc_mock_1",
          document_name: "Acme_Brand_Identity_Standard_2026.pdf",
          page: 4,
          section: "Logo Usage & Backgrounds",
          source_type: "document",
          snippet:
            "The white knockout (reversed) logo must always be used when placed against dark blue, black, or deep navy backgrounds. Never apply the full-color red logo over dark backgrounds.",
        },
      ];
      confidence = "high";
    } else if (qLower.includes("font") || qLower.includes("typography") || qLower.includes("headline")) {
      answer =
        "Based on **Acme_Brand_Identity_Standard_2026.pdf** (Page 8):\n\n> \"The primary corporate typeface for digital headlines is Inter Bold. Secondary body copy must use Inter Regular or Medium with minimum 1.5 line height.\"\n\nProhibited: Comic Sans, Arial alternatives in branded collateral.";
      citations = [
        {
          document_id: "doc_mock_1",
          document_name: "Acme_Brand_Identity_Standard_2026.pdf",
          page: 8,
          section: "Typography Standards",
          source_type: "document",
          snippet:
            "The primary corporate typeface for digital headlines is Inter Bold. Secondary body copy must use Inter Regular or Medium with minimum 1.5 line height.",
        },
      ];
      confidence = "high";
    } else if (qLower.includes("disclaimer") || qLower.includes("legal") || qLower.includes("promotional")) {
      answer =
        "Based on **Digital_Accessibility_and_Color_Specs.docx** (Page 3):\n\n> \"All public-facing promotional campaigns and social graphics must display the standard statutory disclaimer: 'Terms apply. Subject to regulatory compliance verification.' at a minimum 10pt size.\"\n\nHuman review is required before publishing.";
      citations = [
        {
          document_id: "doc_mock_2",
          document_name: "Digital_Accessibility_and_Color_Specs.docx",
          page: 3,
          section: "Mandatory Disclaimers",
          source_type: "document",
          snippet:
            "All public-facing promotional campaigns and social graphics must display the standard statutory disclaimer: 'Terms apply. Subject to regulatory compliance verification.' at a minimum 10pt size.",
        },
      ];
      confidence = "high";
    } else {
      answer = "I couldn't find this in your uploaded documents or brand guidelines.";
      confidence = "not_found";
      citations = [];
    }

    const mode = confidence === "not_found" ? "extractive" : "llm";

    const asstMsg: ChatMessage = {
      id: `msg_a_${Date.now()}`,
      session_id: sessionId,
      role: "assistant",
      content: answer,
      citations,
      confidence,
      mode,
      created_at: new Date().toISOString(),
    };
    this.mockMessagesStore[sessionId].push(asstMsg);

    const s = this.mockSessionsStore.find((x) => x.id === sessionId);
    if (s) {
      s.message_count = this.mockMessagesStore[sessionId].length;
      s.updated_at = new Date().toISOString();
    }

    return {
      session_id: sessionId,
      answer,
      citations,
      confidence,
      mode,
    };
  }

  async getAssistantSessions(): Promise<ChatSession[]> {
    return [...this.mockSessionsStore];
  }

  async getAssistantSession(sessionId: string): Promise<ChatSessionDetail> {
    const session = this.mockSessionsStore.find((s) => s.id === sessionId);
    if (!session) throw new Error("Chat session not found.");
    return {
      ...session,
      messages: this.mockMessagesStore[sessionId] || [],
    };
  }

  async deleteAssistantSession(sessionId: string): Promise<void> {
    this.mockSessionsStore = this.mockSessionsStore.filter((s) => s.id !== sessionId);
    delete this.mockMessagesStore[sessionId];
  }

  async submitMessageFeedback(messageId: string, payload: { helpful: boolean; comment?: string }): Promise<any> {
    for (const msgs of Object.values(this.mockMessagesStore)) {
      const msg = msgs.find((m) => m.id === messageId);
      if (msg) {
        msg.feedback = {
          helpful: payload.helpful,
          comment: payload.comment,
          created_at: new Date().toISOString(),
          user_id: "user_reviewer",
        };
        return { status: "success", feedback: msg.feedback };
      }
    }
    return { status: "success" };
  }

  async uploadKnowledgeDocument(file: File): Promise<KnowledgeDocument> {
    const newDoc: KnowledgeDocument = {
      id: `doc_${Date.now()}`,
      organization_id: "org_acme_cloud",
      filename: file.name,
      file_size_bytes: file.size,
      mime_type: file.type || "application/pdf",
      status: "ready",
      page_count: Math.floor(Math.random() * 15) + 3,
      chunks_count: Math.floor(Math.random() * 40) + 10,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.mockDocumentsStore.unshift(newDoc);
    return newDoc;
  }

  async getKnowledgeDocuments(): Promise<DocumentListResponse> {
    return {
      documents: [...this.mockDocumentsStore],
      total: this.mockDocumentsStore.length,
    };
  }

  async getKnowledgeDocument(documentId: string): Promise<KnowledgeDocument> {
    const doc = this.mockDocumentsStore.find((d) => d.id === documentId);
    if (!doc) throw new Error("Document not found.");
    return { ...doc };
  }

  async deleteKnowledgeDocument(documentId: string): Promise<void> {
    this.mockDocumentsStore = this.mockDocumentsStore.filter((d) => d.id !== documentId);
  }

  async getChatStatus(): Promise<ChatStatusResponse> {
    return {
      llm_enabled: true,
      provider: "gemini",
      model: "gemini-1.5-flash",
    };
  }

  // ==========================================
  // Marketing Copilot Mock Implementation
  // ==========================================
  private mockDraftsStore: DraftDetailResponse[] = [
    {
      id: "draft_mkt_001",
      organization_id: "org_acme_cloud",
      title: "Q3 Enterprise Security Launch Headline",
      description: "Marketing Copilot Draft for linkedin",
      content_type: "headline",
      status: "draft",
      current_revision_id: "rev_mkt_001",
      current_text: "Engineered for Integrity: Accelerate Your Enterprise Security with Verified Brand Intelligence.",
      version_number: 1,
      created_at: new Date(Date.now() - 3600000).toISOString(),
      updated_at: new Date(Date.now() - 3600000).toISOString(),
      revisions: [
        {
          id: "rev_mkt_001",
          version_number: 1,
          raw_text: "Engineered for Integrity: Accelerate Your Enterprise Security with Verified Brand Intelligence.",
          created_at: new Date(Date.now() - 3600000).toISOString(),
          media_metadata: { channel: "linkedin", target_audience: "IT Directors" },
        },
      ],
      latest_audit: null,
    },
  ];

  async generateMarketingCopy(brief: CampaignBriefRequest): Promise<MarketingGenerationResponse> {
    const product = brief.product || "Inkloom AI Governance Hub";
    const audience = brief.target_audience || "Enterprise Marketing Teams";
    const channel = brief.channel || "linkedin";
    const tone = brief.preferred_tone || "Authoritative & Trustworthy";
    const cta = brief.call_to_action || "Schedule a consultation";
    const contentType = brief.content_type || "short_copy";

    return {
      generation_id: `gen_${Date.now()}`,
      created_at: new Date().toISOString(),
      brief,
      alternatives: [
        {
          id: `alt_${Date.now()}_1`,
          content_type: contentType,
          text: `Empower ${audience} with verified brand governance. With ${product}, automate review workflows while preserving institutional tone and regulatory rigor. ${cta}.`,
          creative_rationale: "Strategic Authority Angle: Emphasizes institutional trust, operational velocity, and governance peace of mind.",
          target_channel: channel,
          target_audience: audience,
          brand_tone_alignment: `Adheres to approved ${tone} guidelines without hyperbolic sales claims.`,
          assumptions: ["Assumes enterprise audience evaluating compliance automation tools."],
          missing_facts: [],
          compliance_warnings: ["Ensure pricing commitments are omitted prior to public syndication."],
          audit_completed: false,
          human_approved: false,
        },
        {
          id: `alt_${Date.now()}_2`,
          content_type: contentType,
          text: `Eliminate review bottlenecks before assets reach legal review. ${product} delivers real-time compliance guardrails tailored for ${audience}.\n\nExplore verified brand governance today: ${cta}.`,
          creative_rationale: "Problem-Solution Contrast: Bridges workflow friction directly with automated governance speed.",
          target_channel: channel,
          target_audience: audience,
          brand_tone_alignment: "Professional, solution-oriented voice maintaining respectful industry terminology.",
          assumptions: ["Assumes team experiences compliance review friction in content lifecycle."],
          missing_facts: [],
          compliance_warnings: ["Terms and conditions apply. Disclose demo licensing requirements where applicable."],
          audit_completed: false,
          human_approved: false,
        },
        {
          id: `alt_${Date.now()}_3`,
          content_type: contentType,
          text: `Where creative velocity meets verified compliance. Built specifically for ${audience}, ${product} guarantees continuous alignment across every customer touchpoint.\n\n${cta}.`,
          creative_rationale: "Empowerment & Speed Hook: Inspires creative agility while reassuring risk-averse stakeholders.",
          target_channel: channel,
          target_audience: audience,
          brand_tone_alignment: "Concise, forward-looking, and strictly within certified product scope.",
          assumptions: ["Conservative baseline without uncertified performance statistics."],
          missing_facts: [],
          compliance_warnings: [],
          audit_completed: false,
          human_approved: false,
        },
      ],
      brand_context: {
        applicable_rule_names: ["Professional Tone Standard", "Approved Product Naming", "Disclaimer Placement Rule"],
        verified_claim_keys: ["enterprise_encryption", "multi_tenant_isolation", "verified_rule_engine"],
        required_disclosures: ["Terms and conditions apply. Consult official documentation."],
        unverified_requested_claims: [],
        jurisdiction: "Global",
        knowledge_available: true,
        limited_mode: false,
      },
      model_version: "inkloom-marketing-copilot-v1",
      prompt_version: "2026.3.0",
      notice: "AI-generated creative drafts must be audited via the AI Audit Engine and approved by an authorized human reviewer prior to public distribution.",
    };
  }

  async saveMarketingDraft(payload: SaveDraftRequest): Promise<DraftDetailResponse> {
    const newDraftId = `draft_${Date.now()}`;
    const newRevId = `rev_${Date.now()}`;
    const newDraft: DraftDetailResponse = {
      id: newDraftId,
      organization_id: "org_acme_cloud",
      title: payload.title,
      description: `Marketing Copilot Draft for ${payload.channel || "general"}`,
      content_type: payload.content_type || "text",
      status: "draft",
      current_revision_id: newRevId,
      current_text: payload.text,
      version_number: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      revisions: [
        {
          id: newRevId,
          version_number: 1,
          raw_text: payload.text,
          created_at: new Date().toISOString(),
          media_metadata: payload.media_metadata || {},
        },
      ],
      latest_audit: null,
    };
    this.mockDraftsStore.unshift(newDraft);
    return newDraft;
  }

  async getMarketingDrafts(limit: number = 50, offset: number = 0): Promise<DraftDetailResponse[]> {
    return this.mockDraftsStore.slice(offset, offset + limit);
  }

  async getMarketingDraft(draftId: string): Promise<DraftDetailResponse> {
    const draft = this.mockDraftsStore.find((d) => d.id === draftId);
    if (!draft) throw new Error(`Draft '${draftId}' not found.`);
    return { ...draft };
  }

  async updateMarketingDraftRevision(
    draftId: string,
    payload: UpdateDraftRevisionRequest
  ): Promise<DraftDetailResponse> {
    const draft = this.mockDraftsStore.find((d) => d.id === draftId);
    if (!draft) throw new Error(`Draft '${draftId}' not found.`);

    const nextVer = draft.version_number + 1;
    const newRevId = `rev_${Date.now()}_v${nextVer}`;
    const newRev = {
      id: newRevId,
      version_number: nextVer,
      raw_text: payload.text,
      created_at: new Date().toISOString(),
      media_metadata: { ...(payload.media_metadata || {}), change_summary: payload.change_summary },
    };
    draft.revisions.unshift(newRev);
    draft.current_revision_id = newRevId;
    draft.current_text = payload.text;
    draft.version_number = nextVer;
    draft.updated_at = new Date().toISOString();
    return { ...draft };
  }

  async auditMarketingDraft(draftId: string, revisionId?: string): Promise<AuditResult> {
    const draft = this.mockDraftsStore.find((d) => d.id === draftId);
    if (!draft) throw new Error(`Draft '${draftId}' not found.`);

    const targetRevId = revisionId || draft.current_revision_id || "rev_001";
    const auditRes: AuditResult = {
      ...MOCK_AUDIT_RESULT,
      audit_id: `audit_mkt_${Date.now()}`,
      content_id: draftId,
      revision_id: targetRevId,
      created_at: new Date().toISOString(),
    };

    draft.latest_audit = {
      audit_id: auditRes.audit_id,
      revision_id: targetRevId,
      overall_status: auditRes.overall_status,
      summary: auditRes.summary,
      findings_count: auditRes.findings.length,
      created_at: auditRes.created_at,
    };

    return auditRes;
  }

  async submitMarketingDraft(draftId: string): Promise<DraftDetailResponse> {
    const draft = this.mockDraftsStore.find((d) => d.id === draftId);
    if (!draft) throw new Error(`Draft '${draftId}' not found.`);
    draft.status = "submitted";
    draft.updated_at = new Date().toISOString();
    return { ...draft };
  }

  // Designer Copilot In-Memory Mock Store
  private mockDesignBriefsStore: DesignDraftDetailResponse[] = [];
  private mockBrandAssetsStore: BrandAssetItem[] = [
    {
      id: "asset_logo_primary",
      organization_id: "org_acme_cloud",
      name: "Inkloom Primary Horizontal Logo",
      asset_type: "logo",
      file_url: "/assets/brand/inkloom-logo-horizontal.svg",
      file_path: "brand/logos/inkloom-logo-horizontal.svg",
      specifications: {
        clearspace: "32px or 1x height of 'I'",
        minimum_width_px: 120,
        allowed_backgrounds: ["light", "dark_navy"],
        file_format: "svg",
      },
      approval_status: "approved",
      is_active: true,
    },
    {
      id: "asset_logo_monogram",
      organization_id: "org_acme_cloud",
      name: "Inkloom Monogram Emblem",
      asset_type: "logo",
      file_url: "/assets/brand/inkloom-monogram.svg",
      file_path: "brand/logos/inkloom-monogram.svg",
      specifications: {
        clearspace: "16px minimum",
        usage: "Favicons, social avatars, small app icons",
      },
      approval_status: "approved",
      is_active: true,
    },
    {
      id: "asset_logo_restricted",
      organization_id: "org_acme_cloud",
      name: "Inkloom Monochromatic Wordmark",
      asset_type: "logo",
      file_url: "/assets/brand/inkloom-wordmark-mono.svg",
      file_path: "brand/logos/inkloom-wordmark-mono.svg",
      specifications: {
        restrictions: "Strictly for high-contrast print or certified monochrome stamping.",
      },
      approval_status: "restricted",
      is_active: true,
    },
    {
      id: "asset_color_navy",
      organization_id: "org_acme_cloud",
      name: "Deep Governance Navy",
      asset_type: "palette",
      specifications: {
        hex: "#0F172A",
        role: "Primary Brand Background / Dark Surface",
        wcag_contrast_white: "15.8:1 (AAA Pass)",
      },
      approval_status: "approved",
      is_active: true,
    },
    {
      id: "asset_color_indigo",
      organization_id: "org_acme_cloud",
      name: "Electric Indigo",
      asset_type: "palette",
      specifications: {
        hex: "#6366F1",
        role: "Primary Accent / Interactive Elements",
        wcag_contrast_navy: "4.8:1 (AA Pass)",
      },
      approval_status: "approved",
      is_active: true,
    },
    {
      id: "asset_color_emerald",
      organization_id: "org_acme_cloud",
      name: "Compliance Teal / Emerald",
      asset_type: "palette",
      specifications: {
        hex: "#10B981",
        role: "Success & Governance Indicator",
        wcag_contrast_navy: "6.2:1 (AA Pass)",
      },
      approval_status: "approved",
      is_active: true,
    },
    {
      id: "asset_font_inter",
      organization_id: "org_acme_cloud",
      name: "Inter Typography Standard",
      asset_type: "typography",
      specifications: {
        font_family: "Inter, sans-serif",
        heading_weights: ["600", "700"],
        body_weights: ["400", "500"],
      },
      approval_status: "approved",
      is_active: true,
    },
    {
      id: "asset_badge_soc2",
      organization_id: "org_acme_cloud",
      name: "AICPA SOC 2 Type II Certification Badge",
      asset_type: "badge",
      file_url: "/assets/brand/soc2-type2.png",
      specifications: {
        mandatory_placement: "Footer or secondary trust section on enterprise collateral",
      },
      approval_status: "approved",
      is_active: true,
    },
  ];

  async getAuthorizedBrandAssets(assetType?: string): Promise<BrandAssetItem[]> {
    if (!assetType) return [...this.mockBrandAssetsStore];
    return this.mockBrandAssetsStore.filter((a) => ((a.asset_type || a.type || "") as string).toLowerCase() === assetType.toLowerCase());
  }

  async generateDesignConcepts(brief: CreativeBriefRequest): Promise<DesignConceptGenerationResponse> {
    const channel = brief.channel || "social";
    const format = brief.creative_format || "social_post";
    const ratio = brief.aspect_ratio || "1:1";
    const projectName = brief.project_name || "Enterprise Brand Creative";

    const concepts: DesignConceptAlternative[] = [
      {
        id: "concept_opt_1",
        concept_name: "Minimalist High-Contrast Authority",
        creative_objective_rationale: `Positions ${brief.product || "Inkloom"} as the undisputed enterprise governance benchmark with an authoritative, restrained layout tailored for ${channel}.`,
        visual_direction_composition: "Deep slate navy canvas (#0F172A) with generous 48px negative margins. Hero headline anchored in top-left quadrant, supported by an electric indigo accent rule line.",
        suggested_layout_hierarchy: "Primary 44px display headline -> 18px supporting rationale -> High-contrast CTA pill button in bottom right -> Primary logo in top-right with verified 32px clearspace buffer.",
        color_palette_tokens: [
          { name: "Deep Navy", hex: "#0F172A", role: "Background Canvas", usage_guidance: "Dominant 70% canvas coverage", contrast_ratio_notes: "15.8:1 against White (WCAG AAA compliant)" },
          { name: "Electric Indigo", hex: "#6366F1", role: "Primary Interactive Accent", usage_guidance: "Used for CTA background and focal graphic borders", contrast_ratio_notes: "4.8:1 against Dark Canvas (WCAG AA compliant)" },
          { name: "Pure White", hex: "#FFFFFF", role: "High-Emphasis Typography", usage_guidance: "Headline copy and primary icons", contrast_ratio_notes: "15.8:1 contrast" },
          { name: "Slate 300", hex: "#CBD5E1", role: "Secondary Typography", usage_guidance: "Supporting copy and metadata captions", contrast_ratio_notes: "9.2:1 contrast" },
        ],
        typography_recommendations: [
          { font_family: "Inter, sans-serif", weight: "Bold (700)", role: "Headline", size_guidance: "40px - 48px, line-height 1.15" },
          { font_family: "Inter, sans-serif", weight: "Regular (400)", role: "Body", size_guidance: "16px - 18px, line-height 1.5" },
          { font_family: "JetBrains Mono, monospace", weight: "Medium (500)", role: "Data / Security Specs", size_guidance: "12px uppercase tracking 0.05em" },
        ],
        imagery_illustration_direction: "Clean vector geometry representing architectural governance nodes. Avoid stock photography or photorealistic artificial faces.",
        logo_asset_placement: "Top-right header corner with strict 32px safe-zone boundary from canvas edges.",
        headline_copy_suggestion: brief.required_copy || "AI Governance Without Compromise.",
        supporting_copy_suggestion: "Automate brand compliance across every customer touchpoint with verifiable audit trails.",
        call_to_action_placement: "Bottom right corner with high-contrast '#6366F1' button and right arrow glyph.",
        channel_specific_considerations: `Optimized for ${channel} feed scanning: key value proposition readable within 1.5 seconds. Respects native mobile safe-zones.`,
        accessibility_considerations: "All text elements exceed WCAG 2.1 AA 4.5:1 minimum contrast requirement. Focus outlines compatible with high-contrast display modes.",
        relevant_brand_rules: [
          "Inkloom Brand Standard 2.1: Logo clearspace must equal 1x logo height",
          "Digital A11y Policy: Minimum 4.5:1 text-to-background contrast ratio",
          "Color Architecture: Dark navy must remain primary background for technical tier collateral",
        ],
        assumptions: ["Standard digital RGB color profile", "Viewer device supports web-safe sans-serif fonts"],
        missing_information: brief.brand_requirements ? [] : ["Specific campaign hashtag or legal disclaimer copy if paid media"],
        warnings: ["Do not overlay text directly across intricate vector intersections"],
        is_ai_generated: true,
        is_approved: false,
        audit_completed: false,
      },
      {
        id: "concept_opt_2",
        concept_name: "Modern Asymmetric Metric Showcase",
        creative_objective_rationale: `Drives conversion for ${brief.target_audience || "Enterprise Stakeholders"} by elevating social proof and quantifiable metrics through an asymmetrical modular card layout.`,
        visual_direction_composition: "Bento-style layout with rounded containment cards (16px border-radius), subtle glassmorphism border highlight, and emerald teal accents.",
        suggested_layout_hierarchy: "Left column: Problem statement + Hero Metric (99.8% Compliance) -> Right column: Product graphic + CTA pill.",
        color_palette_tokens: [
          { name: "Deep Navy", hex: "#0F172A", role: "Base Canvas", usage_guidance: "Base layer background", contrast_ratio_notes: "Foundation tone" },
          { name: "Dark Slate Surface", hex: "#1E293B", role: "Card Containers", usage_guidance: "Background for bento cards with 1px border", contrast_ratio_notes: "Card surface" },
          { name: "Compliance Emerald", hex: "#10B981", role: "Metric & Status Indicator", usage_guidance: "Accent badge and checkmark indicators", contrast_ratio_notes: "6.2:1 against Dark Slate (WCAG AA)" },
          { name: "Electric Indigo", hex: "#6366F1", role: "Primary Button Fill", usage_guidance: "Action trigger", contrast_ratio_notes: "4.8:1 contrast" },
        ],
        typography_recommendations: [
          { font_family: "Inter, sans-serif", weight: "Semi-Bold (600)", role: "Card Headers", size_guidance: "20px - 24px" },
          { font_family: "Inter, sans-serif", weight: "Extra-Bold (800)", role: "Metric Display", size_guidance: "56px tabular numbers" },
          { font_family: "Inter, sans-serif", weight: "Regular (400)", role: "Captions", size_guidance: "14px muted" },
        ],
        imagery_illustration_direction: "Abstract UI card mockup showcasing real-time governance score gauges and verified check marks.",
        logo_asset_placement: "Bottom left corner anchored alongside verified SOC 2 trust badge.",
        headline_copy_suggestion: "99.8% Brand Audit Accuracy in Real Time.",
        supporting_copy_suggestion: "Deploy autonomous visual and textual governance guards before creative content hits production.",
        call_to_action_placement: "Floating bottom-right pill: 'Explore Interactive Demo'",
        channel_specific_considerations: `Configured for ${ratio} viewport with responsive padding across mobile and desktop feeds.`,
        accessibility_considerations: "Color is never used as the sole indicator of status; always accompanied by text labels or iconography.",
        relevant_brand_rules: [
          "Typography Standard: Metric numerals must utilize tabular figure spacing",
          "Asset Usage: SOC 2 badge must be accompanied by active compliance year (2026)",
        ],
        assumptions: ["Collateral will be viewed on screen resolutions of at least 375px width"],
        missing_information: [],
        warnings: ["Ensure metric claims are substantiated by approved compliance reports"],
        is_ai_generated: true,
        is_approved: false,
        audit_completed: false,
      },
    ];

    return {
      generation_id: `gen_${Date.now()}`,
      created_at: new Date().toISOString(),
      brief: { ...brief },
      concepts,
      brand_assets_used: this.mockBrandAssetsStore.slice(0, 4),
      brand_rules_applied: [
        "Brand Guideline v2.1: Logo clearspace equals 1x height",
        "Color Token System: Navy (#0F172A) & Indigo (#6366F1)",
        "WCAG 2.1 AA Accessibility Standards (4.5:1 ratio)",
      ],
      model_version: "gemini-1.5-pro / brand-designer-v4",
      notice: "AI-generated design concept alternatives for exploration. Unapproved draft — subject to brand audit and human sign-off.",
    };
  }

  async saveDesignBriefDraft(payload: SaveCreativeBriefDraftRequest): Promise<DesignDraftDetailResponse> {
    const briefId = `brief_${Date.now()}`;
    const revId = `rev_design_${Date.now()}_v1`;

    const newDraft: DesignDraftDetailResponse = {
      id: briefId,
      organization_id: "org_acme_cloud",
      creator_id: "usr_mock_designer",
      title: payload.project_name || "Creative Design Brief",
      description: payload.brief.design_objective || "Brand-aware creative concept development",
      content_type: "image",
      status: "draft",
      current_revision_id: revId,
      current_file_path: payload.initial_image_url || null,
      current_file_name: payload.initial_image_url ? "initial-concept.png" : null,
      version_number: 1,
      brief: payload.brief as any,
      selected_concept: (payload.selected_concept_data || null) as any,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      revisions: [
        {
          id: revId,
          version_number: 1,
          file_name: payload.initial_image_url ? "initial-concept.png" : null,
          file_path: payload.initial_image_url || null,
          raw_text: payload.brief.required_copy || null,
          created_at: new Date().toISOString(),
          media_metadata: {
            concept_id: payload.selected_concept_id || null,
            channel: payload.brief.channel || "social",
            aspect_ratio: payload.brief.aspect_ratio || "1:1",
          },
        },
      ],
      latest_audit: null,
    };

    this.mockDesignBriefsStore.unshift(newDraft);
    return newDraft;
  }

  async getDesignBriefs(limit: number = 50, offset: number = 0): Promise<DesignDraftDetailResponse[]> {
    return this.mockDesignBriefsStore.slice(offset, offset + limit);
  }

  async getDesignBrief(briefId: string): Promise<DesignDraftDetailResponse> {
    const draft = this.mockDesignBriefsStore.find((b) => b.id === briefId);
    if (!draft) throw new Error(`Design brief '${briefId}' not found.`);
    return { ...draft };
  }

  async uploadDesignVersion(
    briefId: string,
    file: File,
    changeSummary?: string
  ): Promise<DesignDraftDetailResponse> {
    const draft = this.mockDesignBriefsStore.find((b) => b.id === briefId);
    if (!draft) throw new Error(`Design brief '${briefId}' not found.`);

    const nextVer = draft.version_number + 1;
    const newRevId = `rev_design_${Date.now()}_v${nextVer}`;
    const objectUrl = URL.createObjectURL(file);

    const newRev: DesignRevisionItem = {
      id: newRevId,
      version_number: nextVer,
      file_name: file.name,
      file_path: objectUrl,
      raw_text: draft.brief?.required_copy || null,
      created_at: new Date().toISOString(),
      media_metadata: {
        file_size_bytes: file.size,
        file_type: file.type,
        change_summary: changeSummary || `Uploaded revised design iteration v${nextVer}`,
      },
    };

    draft.revisions.unshift(newRev);
    draft.current_revision_id = newRevId;
    draft.current_file_path = objectUrl;
    draft.current_file_name = file.name;
    draft.version_number = nextVer;
    draft.updated_at = new Date().toISOString();

    return { ...draft };
  }

  async auditDesignVersion(briefId: string, revisionId?: string): Promise<AuditResult> {
    const draft = this.mockDesignBriefsStore.find((b) => b.id === briefId);
    if (!draft) throw new Error(`Design brief '${briefId}' not found.`);

    const targetRevId = revisionId || draft.current_revision_id || "rev_design_001";
    const currentRev = draft.revisions.find((r) => r.id === targetRevId);
    const fileName = currentRev?.file_name || draft.current_file_name || "creative-export.png";

    const auditResult: AuditResult = {
      ...MOCK_AUDIT_RESULT,
      schema_version: "1.0.0",
      audit_id: `audit_design_${Date.now()}`,
      content_id: briefId,
      revision_id: targetRevId,
      overall_status: "compliant",
      summary: {
        compliance_score: 94.0,
        total_findings: 2,
        critical_count: 0,
        high_count: 0,
        medium_count: 1,
        low_count: 1,
        info_count: 0,
        human_review_required: false,
        verdict_overview:
          "Visual design satisfies all primary brand governance checks. Logo clearspace meets 32px safe-zone boundary, palette adheres to approved Navy (#0F172A) & Indigo (#6366F1) tokens, and text contrast complies with WCAG 2.1 AA 4.5:1 ratio.",
      },
      findings: [
        {
          id: `find_visual_${Date.now()}_1`,
          category: "accessibility",
          severity: "medium",
          title: "Secondary Text Contrast Optimization",
          message:
            "Supporting caption text has an estimated contrast ratio of 4.6:1 against the dark background. While technically passing WCAG 2.1 AA (4.5:1), increasing font weight from 400 to 500 will significantly enhance mobile legibility.",
          evidence: `Analyzed text layer in ${fileName}: 'Automate brand compliance across every customer touchpoint'`,
          source_reference: {
            guideline_id: "guide_a11y_contrast",
            rule_name: "Text Contrast Ratio Standards",
            section: "Accessibility & Inclusion",
            verification_status: "verified",
          },
          confidence: 0.94,
          status: "open",
          requires_human_review: false,
          suggested_correction: {
            replacement_text: "Adjust secondary text color to Slate 200 (#E2E8F0) or increase font-weight to 500.",
            rationale: "Improves legibility on low-brightness mobile displays without altering visual hierarchy.",
          },
          rule_reference: "VIS-A11Y-002",
        },
        {
          id: `find_visual_${Date.now()}_2`,
          category: "visual_brand",
          severity: "low",
          title: "Optimal Safe-Zone Clearspace",
          message:
            "Primary logo placed in top right quadrant maintains 34px padding from border, exceeding the 32px minimum requirement.",
          evidence: `Logo bounding coordinates in ${fileName} show 34px margin from canvas top and right edges.`,
          source_reference: {
            guideline_id: "guide_brand_assets",
            rule_name: "Inkloom Logo Clearspace Standards",
            section: "Brand Asset Placement",
            verification_status: "verified",
          },
          confidence: 0.98,
          status: "open",
          requires_human_review: false,
          suggested_correction: {
            replacement_text: "Current placement is compliant. Maintain clearspace during export downscaling.",
            rationale: "Preserves brand integrity and visibility.",
          },
          rule_reference: "VIS-LOGO-001",
        },
      ],
      created_at: new Date().toISOString(),
    };

    draft.latest_audit = {
      audit_id: auditResult.audit_id,
      revision_id: targetRevId,
      overall_status: auditResult.overall_status,
      summary: auditResult.summary,
      findings_count: auditResult.findings.length,
      created_at: auditResult.created_at,
    };
    draft.updated_at = new Date().toISOString();

    return auditResult;
  }

  async submitDesignForReview(briefId: string): Promise<DesignDraftDetailResponse> {
    const draft = this.mockDesignBriefsStore.find((b) => b.id === briefId);
    if (!draft) throw new Error(`Design brief '${briefId}' not found.`);
    draft.status = "submitted";
    draft.updated_at = new Date().toISOString();
    return { ...draft };
  }

  // Phase 5: Legal Copilot Implementations
  async getLegalSources(jurisdiction?: string, regulatedCategory?: string): Promise<AuthoritativeLegalSource[]> {
    const sources: AuthoritativeLegalSource[] = [
      {
        source_id: "src_ftc_act_sec5",
        title: "Federal Trade Commission Act, Section 5(a)",
        issuing_authority: "Federal Trade Commission (FTC)",
        jurisdiction: "US",
        authority_level: "binding_law",
        citation: "15 U.S.C. § 45(a)",
        publication_or_effective_date: "1914-09-26",
        section_or_provision: "Section 5(a)(1)",
        source_url: "https://www.ftc.gov/legal-library/browse/statutes/federal-trade-commission-act",
        retrieval_timestamp: new Date().toISOString(),
        excerpt: "Unfair methods of competition in or affecting commerce, and unfair or deceptive acts or practices in or affecting commerce, are hereby declared unlawful.",
        is_binding: true,
      },
      {
        source_id: "src_ftc_endorsements",
        title: "Guides Concerning the Use of Endorsements and Testimonials in Advertising",
        issuing_authority: "Federal Trade Commission (FTC)",
        jurisdiction: "US",
        authority_level: "official_guidance",
        citation: "16 CFR Part 255",
        publication_or_effective_date: "2023-07-26",
        section_or_provision: "16 CFR § 255.1 & § 255.5",
        source_url: "https://www.ecfr.gov/current/title-16/chapter-I/subchapter-B/part-255",
        retrieval_timestamp: new Date().toISOString(),
        excerpt: "Endorsements must reflect the honest opinions, findings, beliefs, or experience of the endorser. Material connections between advertiser and endorser must be clearly and conspicuously disclosed.",
        is_binding: false,
      },
      {
        source_id: "src_lanham_act_43a",
        title: "Lanham Act, Section 43(a) (False Advertising)",
        issuing_authority: "United States Congress",
        jurisdiction: "US",
        authority_level: "binding_law",
        citation: "15 U.S.C. § 1125(a)(1)(B)",
        publication_or_effective_date: "1946-07-05",
        section_or_provision: "Section 43(a)(1)(B)",
        source_url: "https://www.law.cornell.edu/uscode/text/15/1125",
        retrieval_timestamp: new Date().toISOString(),
        excerpt: "Any person who misrepresents the nature, characteristics, qualities, or geographic origin of his or her or another person's goods, services, or commercial activities shall be liable in a civil action.",
        is_binding: true,
      },
      {
        source_id: "src_eu_ai_act_art50",
        title: "EU Artificial Intelligence Act (Regulation 2024/1689)",
        issuing_authority: "European Parliament and Council of the European Union",
        jurisdiction: "EU",
        authority_level: "binding_law",
        citation: "Regulation (EU) 2024/1689, Article 50",
        publication_or_effective_date: "2024-07-12",
        section_or_provision: "Article 50(2) & (4)",
        source_url: "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=OJ:L_202401689",
        retrieval_timestamp: new Date().toISOString(),
        excerpt: "Deployers of an AI system that generates or manipulates image, audio or video content constituting a deep fake shall disclose that the content has been artificially generated or manipulated.",
        is_binding: true,
      },
      {
        source_id: "src_eu_ucpd_2005_29",
        title: "Unfair Commercial Practices Directive (UCPD)",
        issuing_authority: "European Parliament and Council of the European Union",
        jurisdiction: "EU",
        authority_level: "binding_law",
        citation: "Directive 2005/29/EC",
        publication_or_effective_date: "2005-05-11",
        section_or_provision: "Articles 6 and 7",
        source_url: "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32005L0029",
        retrieval_timestamp: new Date().toISOString(),
        excerpt: "A commercial practice shall be regarded as misleading if it contains false information and is therefore untruthful or in any way deceives or is likely to deceive the average consumer.",
        is_binding: true,
      },
      {
        source_id: "src_uk_cprs_2008",
        title: "Consumer Protection from Unfair Trading Regulations 2008",
        issuing_authority: "UK Parliament / Competition and Markets Authority (CMA)",
        jurisdiction: "UK",
        authority_level: "binding_law",
        citation: "SI 2008/1277",
        publication_or_effective_date: "2008-05-26",
        section_or_provision: "Regulations 3, 5, and 6",
        source_url: "https://www.legislation.gov.uk/uksi/2008/1277/contents/made",
        retrieval_timestamp: new Date().toISOString(),
        excerpt: "Prohibits misleading actions and omissions which cause or are likely to cause the average consumer to take a transactional decision he would not have taken otherwise.",
        is_binding: true,
      },
      {
        source_id: "src_canada_competition_act",
        title: "Competition Act (R.S.C., 1985, c. C-34)",
        issuing_authority: "Competition Bureau Canada",
        jurisdiction: "CA",
        authority_level: "binding_law",
        citation: "R.S.C., 1985, c. C-34, Section 74.01",
        publication_or_effective_date: "1985-12-12",
        section_or_provision: "Section 74.01(1)(a)",
        source_url: "https://laws-lois.justice.gc.ca/eng/acts/c-34/section-74.01.html",
        retrieval_timestamp: new Date().toISOString(),
        excerpt: "Prohibits making, or permitting the making of, a representation to the public that is false or misleading in a material respect.",
        is_binding: true,
      },
      {
        source_id: "src_internal_mkt_substantiation",
        title: "Internal Policy: Marketing Claims Substantiation & Disclaimers",
        issuing_authority: "Inkloom Legal & Compliance Department",
        jurisdiction: "Global",
        authority_level: "internal_policy",
        citation: "POL-MKT-042 (Rev 3.1)",
        publication_or_effective_date: "2025-01-15",
        section_or_provision: "Section 4.2 & 4.5",
        source_url: "https://internal.inkloom.ai/legal/policies/POL-MKT-042",
        retrieval_timestamp: new Date().toISOString(),
        excerpt: "All comparative performance metrics exceeding 20% must be supported by double-blind third-party benchmark audits less than 12 months old. Absolute guarantees ('100% uptime', 'never fails') are strictly prohibited without GC waiver.",
        is_binding: true,
      },
    ];

    if (!jurisdiction || jurisdiction === "Global") {
      return sources;
    }
    return sources.filter((s) => s.jurisdiction === jurisdiction || s.jurisdiction === "Global");
  }

  async reviewLegalCompliance(request: LegalReviewRequest): Promise<LegalReviewReport> {
    const text = request.content_text || "";
    const jurisdiction = request.target_jurisdiction || "Global";
    const availableSources = await this.getLegalSources(jurisdiction, request.regulated_category);

    const claims: any[] = [];
    const suggestions: any[] = [];
    const highRisks: string[] = [];
    const missingEvidence: string[] = [];
    const legalItems: string[] = [];

    // Analyze content for potential regulatory issues
    const lower = text.toLowerCase();

    // 1. Check for absolute guarantee claims
    if (lower.includes("100%") || lower.includes("guarantee") || lower.includes("zero error") || lower.includes("never fail") || lower.includes("completely eliminate")) {
      claims.push({
        id: `clm_${Date.now()}_1`,
        claim_text: "Absolute performance promise or guarantee",
        location: "Paragraph 1 / Header",
        category: "absolute_guarantee",
        severity: "critical",
        issue_explanation: "Contains absolute guarantees or promises of zero downtime/error, which are legally indefensible and expose the organization to breach of contract and deceptive marketing claims under trade practices legislation.",
        applicable_jurisdiction: jurisdiction,
        supporting_citations: availableSources.filter((s) => s.source_id === "src_ftc_act_sec5" || s.source_id === "src_internal_mkt_substantiation"),
        evidence_status: "contradicted",
        confidence: 0.95,
        suggested_correction: "Replace absolute guarantees with qualified target commitments (e.g., 'Engineered for high availability with 99.9% target SLA').",
        question_for_content_owner: "Do you have an approved General Counsel SLA waiver for this unqualified uptime guarantee?",
        requires_qualified_legal_review: true,
        uncertainty_or_limitation: "If qualified with an explicit SLA asterisk disclaimer immediately adjacent, severity may reduce to Medium.",
      });

      suggestions.push({
        id: `rev_${Date.now()}_1`,
        original_text: "Guarantees 100% error-free execution and zero downtime.",
        proposed_text: "Designed to deliver enterprise-grade reliability with target 99.9% uptime and proactive error monitoring.",
        material_change_explanation: "Removed absolute guarantee of perfection; introduced verifiable SLA target and realistic capability statement.",
        supporting_evidence_rationale: "Aligns with FTC Act § 5 and internal policy POL-MKT-042 prohibiting unhedged guarantee representations.",
        remaining_assumptions: ["Assumes product architecture supports standard 99.9% SLA."],
        is_ai_generated: true,
        is_approved: false,
      });

      highRisks.push("Absolute performance guarantee violates FTC Section 5 and internal substantiation standards.");
      legalItems.push("Verify SLA commitment language against enterprise Master Services Agreement (MSA).");
    }

    // 2. Check for unsubstantiated statistics / metrics
    if (lower.includes("300%") || lower.includes("10x") || lower.includes("5x") || lower.includes("99.999%") || lower.includes("proven")) {
      claims.push({
        id: `clm_${Date.now()}_2`,
        claim_text: "Specific performance multiplier or speed improvement claim",
        location: "Body Copy",
        category: "unsubstantiated_statistic",
        severity: "high",
        issue_explanation: "Quantitative performance claim requires documented substantiation based on reliable and rigorous benchmarking methodology prior to publication.",
        applicable_jurisdiction: jurisdiction,
        supporting_citations: availableSources.filter((s) => s.source_id === "src_lanham_act_43a" || s.source_id === "src_internal_mkt_substantiation"),
        evidence_status: "insufficient_evidence",
        confidence: 0.88,
        suggested_correction: "Reference the specific benchmark study (e.g., 'Up to 3x faster based on 2025 internal workload test suite of 10,000 requests').",
        question_for_content_owner: "Where is the benchmark documentation or third-party audit verifying this performance improvement metric?",
        requires_qualified_legal_review: true,
        uncertainty_or_limitation: "Substantiation adequacy depends on whether internal or independent third-party testing was conducted.",
      });

      suggestions.push({
        id: `rev_${Date.now()}_2`,
        original_text: "Proves 300% faster processing than all competing tools.",
        proposed_text: "Demonstrated up to 3x faster processing in internal benchmark tests on representative enterprise workloads.",
        material_change_explanation: "Restricted broad superiority claim to documented internal test parameters and inserted 'up to' qualification.",
        supporting_evidence_rationale: "Meets Lanham Act § 43(a) reasonable basis doctrine for commercial advertising claims.",
        remaining_assumptions: ["Assumes internal benchmark test results are documented and reproducible."],
        is_ai_generated: true,
        is_approved: false,
      });

      highRisks.push("Quantitative efficiency metric requires verifiable testing methodology documentation.");
      missingEvidence.push("Formal benchmark audit report or test methodology White Paper supporting numerical multiplier claim.");
    }

    // 3. Check for AI transparency disclosure (EU AI Act requirement)
    if (jurisdiction === "EU" || jurisdiction === "Global") {
      if (lower.includes("ai") || lower.includes("artificial intelligence") || lower.includes("generative") || lower.includes("copilot")) {
        claims.push({
          id: `clm_${Date.now()}_3`,
          claim_text: "AI-generated content or synthetic output capabilities",
          location: "Product Capability Description",
          category: "ai_transparency_disclosure",
          severity: "medium",
          issue_explanation: "EU AI Act Article 50 mandates clear transparency disclosures when AI systems generate or manipulate content or interact with natural persons.",
          applicable_jurisdiction: "EU",
          supporting_citations: availableSources.filter((s) => s.source_id === "src_eu_ai_act_art50"),
          evidence_status: "supported",
          confidence: 0.92,
          suggested_correction: "Include a prominent transparency notice stating that AI tools assist in content formulation and require human oversight.",
          question_for_content_owner: "Will European deployers be informed that this feature uses generative AI and synthetic models?",
          requires_qualified_legal_review: false,
          uncertainty_or_limitation: "Exemptions apply for minor automated filtering, but generative systems require direct disclosure.",
        });

        suggestions.push({
          id: `rev_${Date.now()}_3`,
          original_text: "Automated AI engine publishes all your legal filings instantly.",
          proposed_text: "AI-powered governance assistant streamlines draft review, providing decision support for human legal and compliance teams.",
          material_change_explanation: "Clarified human-in-the-loop requirement and transparent decision-support role.",
          supporting_evidence_rationale: "Complies with EU AI Act Article 50 transparency mandates.",
          remaining_assumptions: ["Deployer interface includes AI disclosure label."],
          is_ai_generated: true,
          is_approved: false,
        });
      }
    }

    // If text was very clean, provide standard review baseline
    if (claims.length === 0) {
      claims.push({
        id: `clm_${Date.now()}_baseline`,
        claim_text: text.slice(0, 80) + (text.length > 80 ? "..." : ""),
        location: "Lead Statement",
        category: "unsupported_performance",
        severity: "low",
        issue_explanation: "Draft copy appears generally aligned with standard commercial practice. Ensure all specific capability mentions correspond to live production feature releases.",
        applicable_jurisdiction: jurisdiction,
        supporting_citations: availableSources.slice(0, 2),
        evidence_status: "supported",
        confidence: 0.85,
        suggested_correction: "Ensure version footnotes are included if features are rolling out in waves.",
        question_for_content_owner: "Are all described features currently generally available (GA)?",
        requires_qualified_legal_review: false,
        uncertainty_or_limitation: "Review based on current brief text only; visual asset context not evaluated.",
      });
    }

    const complianceScore = Math.max(35, 100 - (claims.filter(c => c.severity === "critical").length * 25) - (claims.filter(c => c.severity === "high").length * 15) - (claims.filter(c => c.severity === "medium").length * 5));
    const overallVerdict = complianceScore >= 85 ? "Low Risk / Conditionally Approved" : complianceScore >= 60 ? "Requires Revisions & Evidence Substantiation" : "High Legal & Regulatory Risk";

    const report: LegalReviewReport = {
      report_id: `rep_${Date.now()}`,
      review_id: `rev_chk_${Date.now()}`,
      created_at: new Date().toISOString(),
      submission_id: request.submission_id || null,
      revision_id: request.revision_id || null,
      executive_summary: `Evidence-grounded compliance review conducted for target jurisdiction '${jurisdiction}'. The assessment identified ${claims.length} claim(s) requiring attention, with ${highRisks.length} high-priority risk flag(s). Overall verdict: ${overallVerdict}.`,
      overall_risk_verdict: overallVerdict,
      compliance_score: complianceScore,
      campaign_context: {
        product_name: request.product_name || "Inkloom Platform",
        intended_audience: request.intended_audience || "Enterprise B2B",
        marketing_channel: request.marketing_channel || "Digital / Omnichannel",
        regulated_category: request.regulated_category || "b2b_enterprise_saas",
        campaign_objective: request.campaign_objective || "General Market Awareness",
        content_word_count: text.split(/\s+/).filter(Boolean).length,
      },
      jurisdictions_and_assumptions: {
        target_jurisdiction: jurisdiction,
        statutory_scope: availableSources.map((s) => `${s.citation} (${s.issuing_authority})`),
        assumptions_made: [
          "Target audience possesses standard commercial sophistication for enterprise procurement.",
          "Claims are intended for distribution within the specified jurisdiction without localized cross-border retransmission.",
        ],
        uncertainties: [
          "Absence of technical white paper or benchmark protocol limits verification of performance claims.",
          "State/provincial consumer protection statutes may impose additional disclosure formatting requirements.",
        ],
      },
      high_priority_risks: highRisks.length > 0 ? highRisks : ["No critical statutory prohibitions detected in current copy draft."],
      claims_analysis: claims,
      authoritative_sources_register: availableSources,
      suggested_wording_revisions: suggestions,
      missing_evidence_and_questions: missingEvidence.length > 0 ? missingEvidence : ["Verify all claims against verified product facts in knowledge repository."],
      items_requiring_human_legal_counsel: legalItems.length > 0 ? legalItems : ["Final commercial sign-off by designated in-house compliance officer."],
      limitations_and_disclaimers: "This compliance review is an AI-assisted decision-support evaluation and DOES NOT constitute formal legal advice, attorney-client privileged communication, or a guarantee of non-infringement. In-house legal counsel must review and authorize all regulated marketing claims prior to publication.",
      review_date: new Date().toISOString().split("T")[0],
    };

    return report;
  }

  async getSubmissionLegalReport(submissionId: string, jurisdiction: string = "Global"): Promise<LegalReviewReport> {
    const subs = getStoredSubmissions();
    const item = subs.find((s) => s.id === submissionId);
    const contentText = item?.raw_text || "Inkloom Enterprise Cloud provides automated brand intelligence and content governance across marketing workflows.";
    return this.reviewLegalCompliance({
      submission_id: submissionId,
      content_text: contentText,
      target_jurisdiction: jurisdiction as any,
      product_name: item?.title || "Content Submission",
    });
  }

  async applyLegalRevision(submissionId: string, payload: ApplyRevisionRequest): Promise<any> {
    const subs = getStoredSubmissions();
    const idx = subs.findIndex((s) => s.id === submissionId);
    const newRevId = `rev_${Date.now()}`;
    if (idx !== -1) {
      subs[idx].raw_text = payload.updated_text;
      subs[idx].current_revision_id = newRevId;
      subs[idx].status = "pending_approval";
      subs[idx].updated_at = new Date().toISOString();
      saveStoredSubmissions(subs);
    }
    return {
      submission_id: submissionId,
      new_revision_id: newRevId,
      version_number: 2,
      applied_text: payload.updated_text,
      change_summary: payload.change_summary || "Applied conservative revision recommended by Legal Copilot.",
      status: "applied",
    };
  }

  async recordLegalDecision(submissionId: string, payload: RecordLegalFeedbackRequest): Promise<any> {
    const subs = getStoredSubmissions();
    const idx = subs.findIndex((s) => s.id === submissionId);
    if (idx !== -1) {
      if (payload.action === "approve") {
        subs[idx].status = "approved";
      } else if (payload.action === "reject") {
        subs[idx].status = "rejected";
      } else {
        subs[idx].status = "changes_requested";
      }
      subs[idx].updated_at = new Date().toISOString();
      saveStoredSubmissions(subs);
    }
    return {
      decision_id: `dec_${Date.now()}`,
      submission_id: submissionId,
      action: payload.action,
      comments: payload.comments || "Reviewed and recorded by Compliance Officer.",
      conditions: payload.conditions_or_stipulations || [],
      created_at: new Date().toISOString(),
    };
  }

  // -------------------------------------------------------------------------
  // Phase 6: Unified Campaign Workflow & Orchestration Mock Implementation
  // -------------------------------------------------------------------------

  private getStoredCampaigns(): Campaign[] {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem("inkloom_mock_campaigns");
      if (stored) return JSON.parse(stored);
    } catch (e) {
      // fallback
    }
    const defaultCampaigns: Campaign[] = [
      {
        id: "cmp_mock_101",
        organization_id: "org_default_mock",
        name: "Enterprise Governance Launch 2026",
        description: "Unified cross-copilot launch campaign for Inkloom Governance Hub v2.4.",
        campaign_objective: "Establish market leadership in enterprise AI governance and brand safety.",
        target_audience: "Enterprise CMOs, General Counsels, and VP Brand Stewards",
        product_name: "Inkloom Governance Hub",
        target_channel: "omnichannel",
        target_jurisdiction: "US",
        regulated_category: "b2b_enterprise_saas",
        priority: "high",
        deadline: new Date(Date.now() + 86400000 * 7).toISOString(),
        owner_id: "usr_mock_mkt_1",
        assigned_reviewer_id: "usr_mock_comp_1",
        status: "human_review_pending",
        version: 2,
        creative_brief: "Core narrative: AI governance without velocity penalty. Strict substantiation on all performance metrics.",
        policy_config: {
          required_reviews: ["marketing", "visual", "legal"],
          require_legal_signoff: true,
          require_visual_signoff: true,
        },
        campaign_metadata: {},
        submissions: [],
        review_tracks: {
          marketing: {
            track_name: "marketing",
            status: "completed",
            score: 95.0,
            findings_count: 1,
            critical_findings_count: 0,
            last_run_at: new Date().toISOString(),
            summary_message: "Marketing copy passed brand voice and tone checks with 1 minor terminology warning.",
          },
          visual: {
            track_name: "visual",
            status: "completed",
            score: 91.0,
            findings_count: 0,
            critical_findings_count: 0,
            last_run_at: new Date().toISOString(),
            summary_message: "Visual assets conform to Q1 design system color tokens and typography rules.",
          },
          legal: {
            track_name: "legal",
            status: "completed_with_warnings",
            score: 87.5,
            findings_count: 2,
            critical_findings_count: 0,
            last_run_at: new Date().toISOString(),
            summary_message: "Legal Copilot flagged 1 unsubstantiated efficacy assertion. Footnote disclaimer added.",
          },
        },
        readiness: {
          campaign_id: "cmp_mock_101",
          workflow_state: "human_review_pending",
          ai_checks_completed: true,
          human_review_completed: false,
          required_approvals_completed: false,
          outstanding_blockers: [
            "Mandatory human compliance review sign-off is pending from designated reviewer.",
          ],
          review_tracks: {},
          is_ready_for_release: false,
          compliance_disclaimer:
            "READINESS NOTICE: Campaign readiness indicates completion of internal brand, visual, and legal governance checks. It does NOT guarantee judicial compliance or eliminate external regulatory dispute risks.",
        },
        created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];
    return defaultCampaigns;
  }

  private saveStoredCampaigns(campaigns: Campaign[]): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem("inkloom_mock_campaigns", JSON.stringify(campaigns));
    } catch (e) {
      console.error("Failed to save mock campaigns:", e);
    }
  }

  private getStoredNotifications(): NotificationItem[] {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem("inkloom_mock_notifications");
      if (stored) return JSON.parse(stored);
    } catch (e) {
      // fallback
    }
    return [
      {
        id: "notif_mock_001",
        organization_id: "org_default_mock",
        recipient_id: "usr_mock_comp_1",
        sender_id: "system_governance_engine",
        title: "Campaign Ready for Approval Sign-Off",
        message: "All automated checks completed for 'Enterprise Governance Launch 2026'. Human compliance sign-off requested.",
        notification_type: "review_requested",
        link_url: "/campaigns",
        is_read: false,
        created_at: new Date(Date.now() - 3600000).toISOString(),
      },
    ];
  }

  private saveStoredNotifications(notifs: NotificationItem[]): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem("inkloom_mock_notifications", JSON.stringify(notifs));
    } catch (e) {
      console.error("Failed to save mock notifications:", e);
    }
  }

  async getCampaigns(status?: string, priority?: string): Promise<Campaign[]> {
    let campaigns = this.getStoredCampaigns();
    if (status) {
      campaigns = campaigns.filter((c) => c.status === status);
    }
    if (priority) {
      campaigns = campaigns.filter((c) => c.priority === priority);
    }
    return campaigns;
  }

  async getCampaign(campaignId: string): Promise<Campaign> {
    const campaigns = this.getStoredCampaigns();
    const found = campaigns.find((c) => c.id === campaignId);
    if (!found) {
      throw new Error(`Campaign '${campaignId}' not found.`);
    }
    return found;
  }

  async createCampaign(payload: CampaignCreate): Promise<Campaign> {
    const campaigns = this.getStoredCampaigns();
    const newCampaign: Campaign = {
      id: `cmp_${Date.now()}`,
      organization_id: "org_default_mock",
      name: payload.name,
      description: payload.description || "",
      campaign_objective: payload.campaign_objective || "",
      target_audience: payload.target_audience || "",
      product_name: payload.product_name || "",
      target_channel: payload.target_channel || "omnichannel",
      target_jurisdiction: payload.target_jurisdiction || "Global",
      regulated_category: payload.regulated_category || "general_commercial",
      priority: payload.priority || "medium",
      deadline: payload.deadline,
      assigned_reviewer_id: payload.assigned_reviewer_id,
      status: "draft",
      version: 1,
      creative_brief: payload.creative_brief || "",
      policy_config: payload.policy_config || {
        required_reviews: ["marketing", "visual", "legal"],
      },
      campaign_metadata: {},
      submissions: [],
      review_tracks: {},
      readiness: {
        campaign_id: `cmp_${Date.now()}`,
        workflow_state: "draft",
        ai_checks_completed: false,
        human_review_completed: false,
        required_approvals_completed: false,
        outstanding_blockers: ["Campaign is currently in draft. Automated AI reviews have not been executed."],
        review_tracks: {},
        is_ready_for_release: false,
        compliance_disclaimer:
          "READINESS NOTICE: Campaign readiness indicates completion of internal brand, visual, and legal governance checks. It does NOT guarantee judicial compliance or eliminate external regulatory dispute risks.",
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    campaigns.unshift(newCampaign);
    this.saveStoredCampaigns(campaigns);
    return newCampaign;
  }

  async updateCampaign(campaignId: string, payload: CampaignUpdate): Promise<Campaign> {
    const campaigns = this.getStoredCampaigns();
    const idx = campaigns.findIndex((c) => c.id === campaignId);
    if (idx === -1) throw new Error(`Campaign '${campaignId}' not found.`);

    if (payload.version !== undefined && campaigns[idx].version !== payload.version) {
      throw new Error("Concurrency Conflict: Campaign has been modified by another user.");
    }

    Object.assign(campaigns[idx], payload, {
      version: campaigns[idx].version + 1,
      updated_at: new Date().toISOString(),
    });
    this.saveStoredCampaigns(campaigns);
    return campaigns[idx];
  }

  async associateSubmissionsToCampaign(campaignId: string, submissionIds: string[]): Promise<Campaign> {
    const campaign = await this.getCampaign(campaignId);
    const allSubs = getStoredSubmissions();
    const matched = allSubs.filter((s) => submissionIds.includes(s.id));
    campaign.submissions = matched;
    campaign.version += 1;
    campaign.updated_at = new Date().toISOString();

    const campaigns = this.getStoredCampaigns();
    const idx = campaigns.findIndex((c) => c.id === campaignId);
    if (idx !== -1) {
      campaigns[idx] = campaign;
      this.saveStoredCampaigns(campaigns);
    }
    return campaign;
  }

  async runCampaignReviews(campaignId: string): Promise<Campaign> {
    const campaign = await this.getCampaign(campaignId);
    campaign.status = "human_review_pending";
    campaign.version += 1;
    campaign.review_tracks = {
      marketing: {
        track_name: "marketing",
        status: "completed",
        score: 96.0,
        findings_count: 0,
        critical_findings_count: 0,
        last_run_at: new Date().toISOString(),
        summary_message: "Marketing brand audit passed with zero violations.",
      },
      visual: {
        track_name: "visual",
        status: "completed",
        score: 92.5,
        findings_count: 0,
        critical_findings_count: 0,
        last_run_at: new Date().toISOString(),
        summary_message: "Visual media passed layout and contrast checks.",
      },
      legal: {
        track_name: "legal",
        status: "completed",
        score: 90.0,
        findings_count: 1,
        critical_findings_count: 0,
        last_run_at: new Date().toISOString(),
        summary_message: "Statutory review passed. Footnote disclaimer verified.",
      },
    };
    campaign.readiness = {
      campaign_id: campaign.id,
      workflow_state: "human_review_pending",
      ai_checks_completed: true,
      human_review_completed: false,
      required_approvals_completed: false,
      outstanding_blockers: [
        "Mandatory human compliance review sign-off is pending from designated reviewer.",
      ],
      review_tracks: campaign.review_tracks,
      is_ready_for_release: false,
      compliance_disclaimer:
        "READINESS NOTICE: Campaign readiness indicates completion of internal brand, visual, and legal governance checks. It does NOT guarantee judicial compliance or eliminate external regulatory dispute risks.",
    };

    const campaigns = this.getStoredCampaigns();
    const idx = campaigns.findIndex((c) => c.id === campaignId);
    if (idx !== -1) {
      campaigns[idx] = campaign;
      this.saveStoredCampaigns(campaigns);
    }

    // Dispatch notification
    const notifs = this.getStoredNotifications();
    notifs.unshift({
      id: `notif_${Date.now()}`,
      organization_id: campaign.organization_id,
      recipient_id: campaign.assigned_reviewer_id || "reviewer",
      sender_id: "system",
      title: "Campaign Ready for Approval Sign-Off",
      message: `Automated checks completed for '${campaign.name}'. Human compliance sign-off requested.`,
      notification_type: "review_requested",
      link_url: `/campaigns?id=${campaign.id}`,
      is_read: false,
      created_at: new Date().toISOString(),
    });
    this.saveStoredNotifications(notifs);

    return campaign;
  }

  async submitCampaignDecision(campaignId: string, payload: CampaignDecisionRequest): Promise<Campaign> {
    const campaign = await this.getCampaign(campaignId);
    if (payload.action === "approve") {
      campaign.status = "approved";
      campaign.readiness = {
        campaign_id: campaign.id,
        workflow_state: "approved",
        ai_checks_completed: true,
        human_review_completed: true,
        required_approvals_completed: true,
        outstanding_blockers: [],
        review_tracks: campaign.review_tracks || {},
        is_ready_for_release: true,
        compliance_disclaimer:
          "READINESS NOTICE: Campaign readiness indicates completion of internal brand, visual, and legal governance checks. It does NOT guarantee judicial compliance or eliminate external regulatory dispute risks.",
      };
    } else if (payload.action === "reject") {
      campaign.status = "rejected";
    } else {
      campaign.status = "changes_requested";
    }
    campaign.version += 1;
    campaign.updated_at = new Date().toISOString();

    const campaigns = this.getStoredCampaigns();
    const idx = campaigns.findIndex((c) => c.id === campaignId);
    if (idx !== -1) {
      campaigns[idx] = campaign;
      this.saveStoredCampaigns(campaigns);
    }
    return campaign;
  }

  async getCampaignReadiness(campaignId: string): Promise<CampaignReadinessEvaluation> {
    const campaign = await this.getCampaign(campaignId);
    return (
      campaign.readiness || {
        campaign_id: campaign.id,
        workflow_state: campaign.status,
        ai_checks_completed: false,
        human_review_completed: false,
        required_approvals_completed: false,
        outstanding_blockers: ["Evaluation in progress."],
        review_tracks: {},
        is_ready_for_release: false,
        compliance_disclaimer:
          "READINESS NOTICE: Campaign readiness indicates completion of internal brand, visual, and legal governance checks. It does NOT guarantee judicial compliance or eliminate external regulatory dispute risks.",
      }
    );
  }

  async getCampaignActivity(campaignId: string): Promise<any[]> {
    return [
      {
        id: "act_001",
        event_type: "campaign_created",
        actor_id: "usr_mock_mkt_1",
        created_at: new Date(Date.now() - 86400000).toISOString(),
        details: { action: "Campaign created with multi-track policy requirements." },
      },
      {
        id: "act_002",
        event_type: "campaign_reviews_orchestrated",
        actor_id: "system",
        created_at: new Date(Date.now() - 3600000).toISOString(),
        details: { action: "Multi-track AI reviews executed across Marketing, Visual, and Legal tracks." },
      },
    ];
  }

  async getNotifications(unreadOnly?: boolean): Promise<NotificationItem[]> {
    let notifs = this.getStoredNotifications();
    if (unreadOnly) {
      notifs = notifs.filter((n) => !n.is_read);
    }
    return notifs;
  }

  async markNotificationRead(notificationId: string): Promise<any> {
    const notifs = this.getStoredNotifications();
    const target = notifs.find((n) => n.id === notificationId);
    if (target) {
      target.is_read = true;
      target.read_at = new Date().toISOString();
      this.saveStoredNotifications(notifs);
    }
    return { success: true };
  }

  async markAllNotificationsRead(): Promise<any> {
    const notifs = this.getStoredNotifications();
    notifs.forEach((n) => {
      n.is_read = true;
      n.read_at = new Date().toISOString();
    });
    this.saveStoredNotifications(notifs);
    return { success: true };
  }
}

export const mockApi = new MockApiService();

