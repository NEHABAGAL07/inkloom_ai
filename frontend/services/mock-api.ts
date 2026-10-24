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
  getGuidelineProfile(): Promise<BrandGuidelineProfile>;
  saveDraftGuideline(draftData: BrandGuidelineData, name?: string, description?: string): Promise<BrandGuidelineProfile>;
  publishGuideline(version: string, changelog?: string): Promise<BrandGuidelineProfile>;
  getGuidelineVersions(): Promise<BrandGuidelineVersionInfo[]>;
  restoreGuidelineVersion(versionId: string): Promise<BrandGuidelineProfile>;
  getEffectiveSettings(mediaType: string): Promise<EffectiveSettings>;
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
  logout(): Promise<{ message: string; revoked: boolean }>;
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
      title: data.title,
      description: data.description,
      content_type: data.content_type,
      status: "pending_approval",
      current_revision_id: revId,
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
}

export const mockApi = new MockApiService();
