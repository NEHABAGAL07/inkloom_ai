export * from "./audit";

export interface ContentSubmission {
  id: string;
  organization_id: string;
  creator_id?: string;
  creator_name?: string;
  author_id?: string;
  author_email?: string;
  created_by?: string;
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
  raw_text?: string;
  file_name?: string;
  file_path?: string;
  media_url?: string;
  revisions?: ContentRevision[];
  created_at: string;
  updated_at: string;
}

export interface ContentRevision {
  id: string;
  submission_id: string;
  version_number: number;
  raw_text?: string;
  file_name?: string;
  file_path?: string;
  file_size_bytes?: number;
  media_metadata?: Record<string, any>;
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
  status?: "draft" | "published" | "changes_pending";
  published_at?: string;
  published_by?: string;
  is_active: boolean;
  draft_data?: BrandGuidelineData;
  published_data?: BrandGuidelineData;
  rules?: GuidelineRule[];
}

export interface BrandGuidelineProfile {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  version: string;
  status: "draft" | "submitted" | "changes_requested" | "rejected" | "approved" | "published" | "changes_pending" | "archived";
  is_active: boolean;
  published_at?: string;
  published_by?: string;
  is_manager: boolean;
  can_edit?: boolean;
  can_review_legal?: boolean;
  can_publish?: boolean;
  user_role?: string;
  submission_notes?: string;
  submitted_by?: string;
  submitted_at?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  review_decision?: string;
  review_rationale?: string;
  requires_legal_approval?: boolean;
  jurisdiction?: string;
  industry?: string;
  product_category?: string;
  content_channels?: string[];
  effective_date?: string;
  review_date?: string;
  compliance_disclaimer?: string;
  draft_data?: BrandGuidelineData;
  published_data?: BrandGuidelineData;
  created_at?: string;
  updated_at?: string;
}

export interface RuleConflictItem {
  rule_name: string;
  conflicting_with: string;
  category: string;
  priority_high: string;
  priority_low: string;
  explanation: string;
  escalate_to_legal: boolean;
  remediation_suggestion: string;
}

export interface ConflictCheckResult {
  total_conflicts: number;
  conflicts: RuleConflictItem[];
  priority_hierarchy: { level: number; name: string; description: string }[];
  compliance_disclaimer: string;
}

export interface ClarificationReport {
  id: string;
  guideline_id: string;
  organization_id: string;
  user_email: string;
  user_name: string;
  rule_reference: string;
  report_type: string;
  description: string;
  status: "open" | "in_review" | "resolved" | "dismissed";
  resolution_notes?: string;
  resolved_by?: string;
  resolved_at?: string;
  created_at: string;
}

export interface StarterTemplateRule {
  category: string;
  rule_name: string;
  rule_type: string;
  priority_level: number;
  jurisdiction: string;
  industry: string;
  authoritative_source?: string;
  source_url?: string;
  verification_status: string;
  severity_default: string;
  requires_human_review: boolean;
  description: string;
  rule_definition: Record<string, any>;
  required_disclosure?: string;
}


export interface BrandColor {
  id: string;
  name: string;
  hex: string;
  rgb?: string;
  role: "primary" | "secondary" | "accent" | "background" | "text" | "neutral" | "semantic";
  usage_intent: string;
  restrictions?: string;
  status: "mandatory" | "preferred" | "restricted";
}

export interface TypographyPreset {
  name: string;
  font_family: string;
  font_weight: string;
  font_size: string;
  line_height: string;
  letter_spacing?: string;
  text_case?: string;
  intended_usage: string;
}

export interface LogoVariant {
  id: string;
  name: string;
  type: "primary" | "secondary" | "icon" | "monochrome" | "light_bg" | "dark_bg" | "alternate";
  image_url: string;
  min_width_px: number;
  min_height_px: number;
  clear_space_formula: string;
  preferred_placement?: string;
  approved_backgrounds?: string;
  permitted_modifications?: string;
  prohibited_modifications?: string;
}

export interface BrandDoDont {
  id: string;
  title: string;
  description: string;
  type: "mandatory" | "recommended" | "prohibited" | "common_mistake" | "special_exception";
  priority: "critical" | "high" | "medium" | "low";
}

export interface BrandComplianceRule {
  id: string;
  title: string;
  category: "disclaimer" | "copyright" | "trademark" | "claim_restriction" | "regulatory" | "accessibility" | "usage_rights";
  rule_text: string;
  requirement_level: "mandatory" | "conditional" | "advisory";
}

export interface BrandAssetItem {
  id: string;
  name: string;
  organization_id?: string;
  type?: "logo" | "photo" | "illustration" | "template" | "reference_design" | "video" | "product_image" | "document" | string;
  asset_type?: string;
  file_url?: string;
  file_path?: string | null;
  description?: string;
  usage_restrictions?: string;
  campaign?: string;
  specifications?: Record<string, any>;
  approval_status?: "approved" | "pending" | "deprecated" | "restricted" | "expired" | "pending_review" | string;
  is_active?: boolean;
}

export interface PlatformPlacementSpec {
  platform: string;
  placement: string;
  dimensions: string;
  aspect_ratio: string;
  safe_areas?: string;
  text_density_limit?: string;
  headline_size?: string;
  body_size?: string;
  cta_rules?: string;
  logo_placement?: string;
  export_format?: string;
}

export interface MediaCategoryConfig {
  enabled: boolean;
  description: string;
  inherit_brand_defaults: boolean;
  overrides: Record<string, any>;
  [key: string]: any;
}

export interface BrandGuidelineData {
  identity: {
    brand_name: string;
    tagline: string;
    description: string;
    industry: string;
    mission: string;
    vision: string;
    values: string[];
    positioning: string;
    target_market: string;
    primary_audience: string;
    secondary_audience: string;
    personality: string[];
    differentiators: string[];
    preferred_language: string;
    supported_languages: string[];
    website_url: string;
    social_links: { platform: string; url: string }[];
    contact_email: string;
  };
  voice: {
    brand_tone: string[];
    formality_level: string;
    personality_traits: string[];
    communication_style: string;
    preferred_vocabulary: string[];
    words_to_use: string[];
    words_to_avoid: string[];
    writing_style: string;
    sentence_length_preference: string;
    technical_terminology: string;
    humor_preference: string;
    emotional_tone: string;
    cta_style: string;
    headline_preferences: string;
    caption_rules: string;
    grammar_conventions: string;
    inclusive_communication: string;
    approved_copy_examples: { context: string; text: string }[];
    prohibited_copy_examples: { context: string; text: string; reason: string }[];
  };
  colors: {
    palette: BrandColor[];
    contrast_rules: {
      min_ratio_normal: number;
      min_ratio_large: number;
      notes: string;
    };
  };
  typography: {
    primary_font: string;
    secondary_font: string;
    display_font?: string;
    monospace_font?: string;
    approved_weights: string[];
    fallback_fonts: string[];
    restrictions: string;
    licensing_notes: string;
    presets: TypographyPreset[];
  };
  logos: {
    variants: LogoVariant[];
    partner_rules: string;
    co_branding_rules: string;
  };
  visual_identity: {
    overall_style: string;
    photography_aesthetic: string;
    illustration_style: string;
    graphic_design_style: string;
    iconography_style: string;
    shapes_and_patterns: string;
    background_treatment: string;
    textures: string;
    use_of_gradients: string;
    visual_density: string;
    composition: string;
    negative_space: string;
    image_treatment: string;
    color_grading: string;
    preferred_styles_examples: string[];
    prohibited_styles_examples: string[];
  };
  layout_spacing: {
    alignment: string;
    grid_system: string;
    spacing_principles: string;
    padding_guidelines: string;
    border_divider_usage: string;
    corner_radius: string;
    shadow_usage: string;
    content_hierarchy: string;
    logo_to_content_spacing: string;
    safe_area_principles: string;
  };
  dos_and_donts: BrandDoDont[];
  compliance: BrandComplianceRule[];
  assets_library: BrandAssetItem[];
  media_guidelines: {
    social_media: MediaCategoryConfig & {
      platforms: PlatformPlacementSpec[];
      mandatory_rules: string[];
      prohibited_elements: string[];
    };
    photography: MediaCategoryConfig & {
      lighting: string;
      composition: string;
      framing: string;
      color_grading: string;
      retouching_restrictions: string;
      product_visibility: string;
      model_direction: string;
      required_resolutions: string;
      output_formats: string;
    };
    video: MediaCategoryConfig & {
      video_styles: string[];
      aspect_ratios: string[];
      resolutions: string[];
      frame_rates: string[];
      duration_recommendations: string;
      opening_hook_rules: string;
      logo_appearance_timing: string;
      subtitles_placement: string;
      music_restrictions: string;
      end_card_cta: string;
      export_formats: string;
    };
    print: MediaCategoryConfig & {
      dpi: number;
      color_mode: string;
      bleed: string;
      safe_margin: string;
      paper_finishes: string[];
      export_format: string;
    };
    web_ads: MediaCategoryConfig & {
      standard_sizes: string[];
      max_file_size_kb: number;
      animation_rules: string;
      mobile_adaptations: string;
    };
    custom_media: {
      id: string;
      name: string;
      enabled: boolean;
      description: string;
      fields: { key: string; label: string; value: string }[];
      mandatory_rules: string[];
    }[];
  };
}

export interface BrandGuidelineVersionInfo {
  id: string;
  guideline_id: string;
  organization_id: string;
  version: string;
  changelog?: string;
  published_by: string;
  published_at: string;
  snapshot_data: BrandGuidelineData;
}

export interface EffectiveSettings {
  media_type: string;
  effective_settings: Record<string, any>;
  inherited_keys: string[];
  overridden_keys: string[];
  conflicts: { field: string; severity: string; message: string }[];
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

export interface ContentComment {
  id: string;
  submission_id: string;
  organization_id: string;
  author_id?: string;
  author_name: string;
  author_role: "admin" | "compliance_officer" | "marketing" | "designer" | string;
  comment_text: string;
  category: "visual_design" | "legal_compliance" | "copy_tone" | "brand_rules" | "general" | string;
  is_resolved: boolean;
  resolved_at?: string | null;
  resolved_by?: string | null;
  resolution_note?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CommentsListResponse {
  comments: ContentComment[];
  total_count: number;
  open_count: number;
  resolved_count: number;
}

// Brand Assistant & Document Intelligence Types
export interface CitationItem {
  document_id: string;
  document_name: string;
  page?: number | null;
  section?: string | null;
  source_type: "document" | "guideline_rule" | string;
  snippet: string;
}

export interface AskQuestionRequest {
  session_id?: string;
  question: string;
}

export interface AskQuestionResponse {
  session_id: string;
  answer: string;
  citations: CitationItem[];
  confidence: "high" | "medium" | "low" | "not_found" | string;
  mode?: "llm" | "extractive" | string;
}

export interface ChatStatusResponse {
  llm_enabled: boolean;
  provider: string;
  model: string;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  citations?: CitationItem[];
  confidence?: "high" | "medium" | "low" | "not_found" | string;
  mode?: "llm" | "extractive" | string;
  feedback?: {
    helpful: boolean;
    comment?: string;
    created_at?: string;
    user_id?: string;
  } | null;
  created_at: string;
}

export interface ChatSession {
  id: string;
  organization_id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
}

export interface ChatSessionDetail extends ChatSession {
  messages: ChatMessage[];
}

export interface KnowledgeDocument {
  id: string;
  organization_id: string;
  filename: string;
  file_size_bytes?: number;
  mime_type: string;
  status: "processing" | "ready" | "failed";
  page_count: number;
  error_message?: string | null;
  created_at: string;
  updated_at: string;
  chunks_count?: number;
}

export interface DocumentListResponse {
  documents: KnowledgeDocument[];
  total: number;
}

export type MarketingContentType =
  | "caption"
  | "headline"
  | "punchline"
  | "slogan"
  | "cta"
  | "product_description"
  | "campaign_concept"
  | "audience_variation"
  | "short_copy"
  | "long_copy"
  | "rewrite"
  | "copy_improvement";

export type MarketingChannel = "instagram" | "linkedin" | "website" | "email" | "ad" | "print" | "general";
export type DesiredLength = "short" | "medium" | "long";

export interface CampaignBriefRequest {
  product?: string;
  campaign_objective?: string;
  target_audience?: string;
  channel?: MarketingChannel;
  preferred_tone?: string;
  desired_length?: DesiredLength;
  call_to_action?: string;
  context_constraints?: string;
  supporting_references?: string;
  content_type?: MarketingContentType;
  existing_content?: string;
  num_alternatives?: number;
}

export interface MarketingAlternative {
  id: string;
  content_type: string;
  text: string;
  creative_rationale: string;
  target_channel: string;
  target_audience: string;
  brand_tone_alignment: string;
  assumptions: string[];
  missing_facts: string[];
  compliance_warnings: string[];
  audit_completed: boolean;
  human_approved: boolean;
}

export interface BrandContextSummary {
  applicable_rule_names: string[];
  verified_claim_keys: string[];
  required_disclosures: string[];
  unverified_requested_claims: string[];
  jurisdiction: string;
  knowledge_available: boolean;
  limited_mode: boolean;
  limited_mode_reason?: string | null;
}

export interface MarketingGenerationResponse {
  generation_id: string;
  created_at: string;
  brief: CampaignBriefRequest;
  alternatives: MarketingAlternative[];
  brand_context: BrandContextSummary;
  model_version: string;
  prompt_version: string;
  notice: string;
}

export interface SaveDraftRequest {
  title: string;
  text: string;
  content_type?: string;
  channel?: string;
  target_audience?: string;
  campaign_objective?: string;
  generation_id?: string;
  alternative_id?: string;
  media_metadata?: Record<string, any>;
}

export interface UpdateDraftRevisionRequest {
  text: string;
  change_summary?: string;
  media_metadata?: Record<string, any>;
}

export interface DraftDetailResponse {
  id: string;
  organization_id: string;
  creator_id?: string;
  title: string;
  description?: string;
  content_type: string;
  status: string;
  current_revision_id?: string;
  current_text?: string;
  version_number: number;
  created_at: string;
  updated_at: string;
  revisions: Array<{
    id: string;
    version_number: number;
    raw_text?: string;
    created_at?: string;
    media_metadata?: Record<string, any>;
  }>;
  latest_audit?: {
    audit_id: string;
    revision_id?: string;
    overall_status: string;
    summary: Record<string, any>;
    findings_count: number;
    created_at?: string;
  } | null;
}

// ==========================================
// Phase 4: Designer Copilot Types
// ==========================================
export type CreativeFormat =
  | "social_post"
  | "banner"
  | "poster"
  | "ad"
  | "landing_page_visual"
  | "presentation"
  | "infographic"
  | "email_header"
  | "collateral";

export type DesignPlacementChannel =
  | "instagram"
  | "linkedin"
  | "website"
  | "email"
  | "ad"
  | "print"
  | "presentation"
  | "general";

export type DesignAspectRatio =
  | "1:1"
  | "16:9"
  | "9:16"
  | "4:5"
  | "1.91:1"
  | "728:90"
  | "300:250"
  | "custom";

export type AssetApprovalStatus = "approved" | "restricted" | "expired" | "pending_review";

export interface CreativeBriefRequest {
  project_name?: string;
  product?: string;
  design_objective?: string;
  target_audience?: string;
  channel?: DesignPlacementChannel;
  creative_format?: CreativeFormat;
  visual_style_tone?: string;
  brand_requirements?: string;
  required_copy?: string;
  call_to_action?: string;
  aspect_ratio?: DesignAspectRatio;
  custom_dimensions?: string;
  selected_asset_ids?: string[];
  reference_notes?: string;
  num_concepts?: number;
}

export interface ColorTokenRecommendation {
  name: string;
  hex: string;
  role: string;
  usage_guidance: string;
  contrast_ratio_notes?: string | null;
}

export interface TypographyRecommendation {
  font_family: string;
  weight: string;
  role: string;
  size_guidance: string;
}

export interface DesignConceptAlternative {
  id: string;
  concept_name: string;
  creative_objective_rationale: string;
  visual_direction_composition: string;
  suggested_layout_hierarchy: string;
  color_palette_tokens: ColorTokenRecommendation[];
  typography_recommendations: TypographyRecommendation[];
  imagery_illustration_direction: string;
  logo_asset_placement: string;
  headline_copy_suggestion: string;
  supporting_copy_suggestion?: string | null;
  call_to_action_placement: string;
  channel_specific_considerations: string;
  accessibility_considerations: string;
  relevant_brand_rules: string[];
  assumptions: string[];
  missing_information: string[];
  warnings: string[];
  is_ai_generated: boolean;
  is_approved: boolean;
  audit_completed: boolean;
}

export interface DesignConceptGenerationResponse {
  generation_id: string;
  created_at: string;
  brief: CreativeBriefRequest;
  concepts: DesignConceptAlternative[];
  brand_assets_used: BrandAssetItem[];
  brand_rules_applied: string[];
  model_version: string;
  notice: string;
}

export interface SaveCreativeBriefDraftRequest {
  project_name: string;
  brief: CreativeBriefRequest;
  selected_concept_id?: string;
  selected_concept_data?: Record<string, any>;
  initial_image_url?: string;
}

export interface DesignRevisionItem {
  id: string;
  version_number: number;
  file_name?: string | null;
  file_path?: string | null;
  raw_text?: string | null;
  created_at?: string | null;
  media_metadata: Record<string, any>;
}

export interface DesignDraftDetailResponse {
  id: string;
  organization_id: string;
  creator_id?: string;
  title: string;
  description?: string;
  content_type: string;
  status: string;
  current_revision_id?: string;
  current_file_path?: string | null;
  current_file_name?: string | null;
  version_number: number;
  brief?: Record<string, any> | null;
  selected_concept?: Record<string, any> | null;
  created_at: string;
  updated_at: string;
  revisions: DesignRevisionItem[];
  latest_audit?: {
    audit_id: string;
    revision_id?: string;
    overall_status: string;
    summary: Record<string, any>;
    findings_count: number;
    created_at?: string;
  } | null;
}

// ==========================================
// Phase 5: Legal Copilot Types
// ==========================================
export type LegalAuthorityLevel =
  | "binding_law"
  | "official_guidance"
  | "enforcement_material"
  | "internal_policy"
  | "commentary"
  | "best_practice";

export type EvidenceVerificationStatus =
  | "supported"
  | "contradicted"
  | "insufficient_evidence"
  | "not_checked"
  | "conflicting_sources";

export type LegalFindingCategory =
  | "unsupported_performance"
  | "absolute_guarantee"
  | "misleading_comparison"
  | "unsubstantiated_statistic"
  | "inadequate_disclosure"
  | "endorsement_testimonial"
  | "environmental_claim"
  | "pricing_promotional"
  | "sensitive_regulated"
  | "product_fact_conflict"
  | "visual_disclaimer_mismatch"
  | "ai_transparency_disclosure";

export type TargetJurisdiction = "Global" | "US" | "US-CA" | "EU" | "UK" | "CA" | "AU";

export type RegulatedProductCategory =
  | "b2b_enterprise_saas"
  | "financial_services"
  | "healthcare_life_sciences"
  | "consumer_tech_ai"
  | "general_commercial";

export interface AuthoritativeLegalSource {
  source_id: string;
  title: string;
  issuing_authority: string;
  jurisdiction: string;
  authority_level: LegalAuthorityLevel;
  citation: string;
  publication_or_effective_date?: string | null;
  section_or_provision?: string | null;
  source_url?: string | null;
  retrieval_timestamp: string;
  excerpt: string;
  is_binding: boolean;
}

export interface LegalClaimReviewItem {
  id: string;
  claim_text: string;
  location?: string | null;
  category: LegalFindingCategory;
  severity: "critical" | "high" | "medium" | "low" | "info";
  issue_explanation: string;
  applicable_jurisdiction: string;
  supporting_citations: AuthoritativeLegalSource[];
  evidence_status: EvidenceVerificationStatus;
  confidence: number;
  suggested_correction?: string | null;
  question_for_content_owner?: string | null;
  requires_qualified_legal_review: boolean;
  uncertainty_or_limitation?: string | null;
}

export interface ConservativeRevisionSuggestion {
  id: string;
  original_text: string;
  proposed_text: string;
  material_change_explanation: string;
  supporting_evidence_rationale: string;
  remaining_assumptions: string[];
  is_ai_generated: boolean;
  is_approved: boolean;
}

export interface LegalReviewRequest {
  title?: string;
  content_text: string;
  submission_id?: string;
  revision_id?: string;
  product_name?: string;
  intended_audience?: string;
  target_jurisdiction?: TargetJurisdiction;
  marketing_channel?: string;
  regulated_category?: RegulatedProductCategory;
  campaign_objective?: string;
  known_product_claims?: string[];
  supporting_evidence_notes?: string;
  specific_legal_questions?: string[];
}

export interface LegalReviewReport {
  report_id: string;
  review_id: string;
  created_at: string;
  submission_id?: string | null;
  revision_id?: string | null;
  executive_summary: string;
  overall_risk_verdict: string;
  compliance_score: number;
  campaign_context: {
    product_name?: string;
    intended_audience?: string;
    marketing_channel?: string;
    regulated_category?: string;
    campaign_objective?: string;
    content_word_count?: number;
    [key: string]: any;
  };
  jurisdictions_and_assumptions: {
    target_jurisdiction: string;
    statutory_scope: string[];
    assumptions_made: string[];
    uncertainties: string[];
    [key: string]: any;
  };
  high_priority_risks: string[];
  claims_analysis: LegalClaimReviewItem[];
  authoritative_sources_register: AuthoritativeLegalSource[];
  suggested_wording_revisions: ConservativeRevisionSuggestion[];
  missing_evidence_and_questions: string[];
  items_requiring_human_legal_counsel: string[];
  limitations_and_disclaimers: string;
  review_date: string;
}

export interface ApplyRevisionRequest {
  revision_suggestion_id: string;
  updated_text: string;
  change_summary?: string;
}

export interface RecordLegalFeedbackRequest {
  action: "approve" | "reject" | "request_changes";
  comments?: string;
  conditions_or_stipulations?: string[];
}

// ---------------------------------------------------------------------------
// Phase 6: Unified Campaign Workflow, Policy & Orchestration Types
// ---------------------------------------------------------------------------

export type CampaignStatus =
  | "draft"
  | "in_progress"
  | "ai_review_pending"
  | "ai_review_in_progress"
  | "human_review_pending"
  | "changes_requested"
  | "re_review_pending"
  | "approved"
  | "rejected"
  | "archived";

export type CampaignPriority = "low" | "medium" | "high" | "urgent";

export type CampaignReviewTrackStatus =
  | "not_required"
  | "pending"
  | "running"
  | "completed"
  | "completed_with_warnings"
  | "failed"
  | "needs_human_review";

export interface ReviewTrackResult {
  track_name: string;
  status: CampaignReviewTrackStatus;
  score?: number | null;
  findings_count: number;
  critical_findings_count: number;
  last_run_at?: string | null;
  reviewed_version?: number | null;
  reviewed_revision_id?: string | null;
  summary_message?: string;
  details?: Record<string, any>;
}

export interface CampaignReadinessEvaluation {
  campaign_id: string;
  workflow_state: string;
  ai_checks_completed: boolean;
  human_review_completed: boolean;
  required_approvals_completed: boolean;
  outstanding_blockers: string[];
  review_tracks: Record<string, ReviewTrackResult>;
  is_ready_for_release: boolean;
  compliance_disclaimer: string;
}

export interface CampaignPolicyConfig {
  required_reviews?: string[];
  require_legal_signoff?: boolean;
  require_visual_signoff?: boolean;
  strict_jurisdiction_mode?: boolean;
  allowed_channels?: string[];
  [key: string]: any;
}

export interface Campaign {
  id: string;
  organization_id: string;
  name: string;
  description?: string | null;
  campaign_objective?: string | null;
  target_audience?: string | null;
  product_name?: string | null;
  target_channel?: string | null;
  target_jurisdiction?: string | null;
  regulated_category?: string | null;
  priority: CampaignPriority;
  deadline?: string | null;
  owner_id?: string | null;
  assigned_reviewer_id?: string | null;
  status: CampaignStatus;
  version: number;
  creative_brief?: string | null;
  policy_config?: CampaignPolicyConfig;
  campaign_metadata?: Record<string, any>;
  submissions?: ContentSubmission[];
  review_tracks?: Record<string, ReviewTrackResult>;
  readiness?: CampaignReadinessEvaluation;
  created_at: string;
  updated_at: string;
}

export interface CampaignCreate {
  name: string;
  description?: string;
  campaign_objective?: string;
  target_audience?: string;
  product_name?: string;
  target_channel?: string;
  target_jurisdiction?: string;
  regulated_category?: string;
  priority?: CampaignPriority;
  deadline?: string;
  assigned_reviewer_id?: string;
  creative_brief?: string;
  policy_config?: CampaignPolicyConfig;
  submission_ids?: string[];
}

export interface CampaignUpdate {
  name?: string;
  description?: string;
  campaign_objective?: string;
  target_audience?: string;
  product_name?: string;
  target_channel?: string;
  target_jurisdiction?: string;
  regulated_category?: string;
  priority?: CampaignPriority;
  deadline?: string;
  assigned_reviewer_id?: string;
  creative_brief?: string;
  policy_config?: CampaignPolicyConfig;
  version?: number;
}

export interface CampaignDecisionRequest {
  action: "approve" | "reject" | "request_changes";
  comments: string;
  conditions?: string[];
}

export interface NotificationItem {
  id: string;
  organization_id: string;
  recipient_id: string;
  sender_id?: string | null;
  title: string;
  message: string;
  notification_type: string;
  link_url?: string | null;
  is_read: boolean;
  read_at?: string | null;
  created_at: string;
}

// ============================================================================
// Step 2: Designer Copilot & Shared Intelligence Orchestration
// ============================================================================

export interface ReferenceImageAnalysisRequest {
  file_path?: string;
  submission_id?: string;
  revision_id?: string;
  user_query?: string;
  image_base64?: string;
}

export interface ReferenceImageAnalysisResponse {
  file_name: string;
  dimensions: {
    width?: number;
    height?: number;
    aspect_ratio?: string;
    total_pixels?: number;
  };
  dominant_colors_hex: string[];
  contrast_ratio?: number | null;
  wcag_aa_compliant?: boolean | null;
  brand_palette_concordance: string;
  visual_hierarchy_critique: string;
  observable_facts: string[];
  actionable_recommendations: string[];
  color_recommendations?: string[];
  typography_recommendations?: string[];
  uncertainty_limitations: string[];
  analysis_timestamp: string;
}

export interface DesignCritiqueIssue {
  issue: string;
  why_it_matters: string;
  how_to_fix: string;
  suggested_alternative: string;
  uncertainty_or_limitation?: string | null;
}

export interface DesignCritiqueRequest {
  concept_id?: string;
  concept_data?: Record<string, any>;
  submission_id?: string;
  channel?: DesignPlacementChannel;
  focus_areas?: string[];
}

export interface DesignCritiqueResponse {
  critique_id: string;
  overall_summary: string;
  strengths: string[];
  critical_issues: DesignCritiqueIssue[];
  hierarchy_score: number;
  accessibility_score: number;
  brand_consistency_score: number;
  actionable_next_steps: string[];
}

export interface DesignAdaptationRequest {
  base_concept: Record<string, any>;
  adaptation_instruction: string;
  target_channel?: DesignPlacementChannel;
  target_aspect_ratio?: DesignAspectRatio;
  preserve_elements?: string[];
}

export interface DesignAdaptationResponse {
  adaptation_id: string;
  adapted_concept: DesignConceptAlternative;
  applied_modifications: string[];
  preserved_elements: string[];
  design_rationale: string;
}

export interface CopilotOrchestrateRequest {
  copilot_type: "brand_assistant" | "marketing_copilot" | "designer_copilot" | "legal_copilot" | "general";
  message: string;
  session_id?: string;
  campaign_id?: string;
  submission_id?: string;
  revision_id?: string;
  channel?: string;
  jurisdiction?: string;
  user_preferences?: Record<string, any>;
  confirmed_action?: string;
}

export interface CopilotOrchestrateResponse {
  session_id: string;
  message_id: string;
  copilot_type: string;
  task_type: string;
  content: string;
  structured_deliverable?: Record<string, any> | null;
  citations: Array<{
    document_id: string;
    document_name: string;
    page?: number | null;
    section?: string | null;
    snippet: string;
  }>;
  tools_executed: Array<{
    call_id: string;
    tool_name: string;
    success: boolean;
    data?: any;
    error?: string | null;
    execution_time_ms: number;
  }>;
  pending_confirmation?: Record<string, any> | null;
  clarification_needed: boolean;
  confidence: string;
  mode: string;
  assumptions: string[];
  task_state?: Record<string, any> | null;
  observability: Record<string, any>;
}

export interface CopilotFeedbackRequest {
  session_id: string;
  message_id: string;
  helpful: boolean;
  rating_category?: "solved_task" | "generic_or_irrelevant" | "missed_context" | "unsupported_claim" | "suggestion_needs_improvement" | "tool_failed";
  comment?: string;
}


// =========================================================================
// Centralized Review Cycles, Departmental Reviews, & Feedback Types
// =========================================================================

export interface DepartmentFeedbackItem {
  id: string;
  organization_id?: string;
  cycle_id: string;
  department_review_id?: string;
  submission_id: string;
  revision_id?: string;
  reviewer_id?: string;
  reviewer_name: string;
  reviewer_department: "manager" | "marketing" | "legal";
  feedback_category: string;
  feedback_description: string;
  requested_correction?: string;
  review_outcome: "no_changes_required" | "changes_requested";
  status: "open" | "resolved" | "acknowledged" | "action_required" | "approved";
  relevant_audit_evidence?: Record<string, any>;
  created_at: string;
  updated_at?: string;
}

export interface DepartmentReviewRecord {
  id: string;
  organization_id?: string;
  cycle_id: string;
  submission_id: string;
  revision_id?: string;
  department: "manager" | "marketing" | "legal";
  reviewer_id?: string;
  reviewer_name?: string;
  review_status: "pending" | "completed";
  outcome?: "no_changes_required" | "changes_requested";
  comments?: string;
  submitted_at?: string;
  feedback_items?: DepartmentFeedbackItem[];
}

export interface ReviewCycleRecord {
  id: string;
  organization_id: string;
  submission_id: string;
  revision_id?: string;
  cycle_number: number;
  status: "in_progress" | "changes_requested" | "review_complete" | "approved";
  final_approval_status: "pending_approval" | "approved" | "rejected";
  final_approved_by?: string;
  final_approved_at?: string;
  started_at: string;
  completed_at?: string;
  departmental_reviews: DepartmentReviewRecord[];
  feedback_records: DepartmentFeedbackItem[];
}

export interface DesignVersionSummaryItem {
  version_id: string;
  version_number: number;
  file_name?: string;
  file_path?: string;
  media_url?: string;
  created_at: string;
  change_summary?: string;
}

export interface DesignerFeedbackGroupItem {
  submission_id: string;
  title: string;
  description?: string;
  content_type: string;
  current_version: number;
  thumbnail_url?: string;
  file_name?: string;
  created_at: string;
  workflow_status: string;
  active_cycle?: ReviewCycleRecord;
  cycles: ReviewCycleRecord[];
  versions: DesignVersionSummaryItem[];
  has_changes_requested: boolean;
  all_reviews_completed: boolean;
}

export interface DesignerFeedbackSummaryData {
  total_feedback_items: number;
  changes_requested_count: number;
  reviews_completed_count: number;
  designs_awaiting_review_count: number;
  design_groups: DesignerFeedbackGroupItem[];
}

export interface SubmitDepartmentReviewInput {
  department: "manager" | "marketing" | "legal";
  outcome: "no_changes_required" | "changes_requested";
  comments?: string;
  feedback_items?: Array<{
    category: string;
    description: string;
    requested_correction?: string;
    evidence?: Record<string, any>;
  }>;
}

// =========================================================================
// Media Items & Uploads
// =========================================================================

export interface MediaItem {
  id: string;
  organization_id: string;
  campaign_id?: string | null;
  submission_id?: string | null;
  original_filename: string;
  stored_filename: string;
  file_path: string;
  file_type: "image" | "video" | "document" | "other";
  mime_type: string;
  file_size: number;
  uploaded_by?: string | null;
  description?: string | null;
  status: string;
  extra_metadata?: Record<string, any> | null;
  media_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface MediaItemListResponse {
  items: MediaItem[];
  total: number;
  page: number;
  page_size: number;
}

export interface UploadMediaInput {
  file: File;
  description?: string;
  campaign_id?: string;
  title?: string;
}
