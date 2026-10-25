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
  type: "logo" | "photo" | "illustration" | "template" | "reference_design" | "video" | "product_image" | "document";
  file_url: string;
  description: string;
  usage_restrictions?: string;
  campaign?: string;
  approval_status: "approved" | "pending" | "deprecated";
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

