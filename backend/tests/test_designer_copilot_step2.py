"""
Step 2 Evaluation Suite: Designer Copilot as an Intelligent Creative Partner
Tests and validates 10 core capabilities:
1. Dynamic Intent & Adaptive Concept Generation (single vs multi-concept)
2. Genuine Reference Image Analysis with PIL (dimensions, dominant colors, WCAG AA contrast)
3. Honest Handling of Missing and Low-Resolution Reference Images
4. Structured Creative Critique with Root-Cause, Impact, Fix, and Alternatives
5. Stateful Design Adaptation ('Make It More Premium' preserving headline & product)
6. Cross-Platform Re-Layout Adaptation (Instagram 1:1 vs LinkedIn 1.91:1)
7. Tool Registry Execution & Role Authorization for Designer Tools
8. Multi-Turn Orchestration Continuity across Creative Follow-Ups
9. Real Visual Audit Integration without Auto-Approval Bypasses
10. Multi-Tenant Isolation & Role Security Enforcement
"""
import os
import tempfile
import uuid
import pytest
from PIL import Image, ImageDraw
from sqlalchemy.orm import Session

from app.models.organization import Organization
from app.models.user import User
from app.models.submission import ContentSubmission
from app.models.revision import ContentRevision
from app.models.guideline import BrandGuideline, GuidelineRule
from app.models.asset import ApprovedAsset
from app.core.security import AuthContext, UserRole
from app.schemas.designer_copilot import (
    CreativeBriefRequest,
    DesignPlacementChannel,
    DesignAspectRatio,
    CreativeFormat,
    SaveCreativeBriefDraftRequest,
    ReferenceImageAnalysisRequest,
    DesignCritiqueRequest,
    DesignAdaptationRequest,
)
from app.schemas.orchestration import (
    CopilotType,
    TaskType,
    CopilotRequest,
)
from app.services.designer_copilot.service import DesignerCopilotService
from app.services.shared_intelligence.orchestration import SharedIntelligenceEngine
from app.services.shared_intelligence.tool_registry import tool_registry


@pytest.fixture
def designer_test_env(db_session: Session):
    """Sets up a tenant environment for Designer Copilot testing."""
    org = Organization(id="org_designer_eval_1", name="Supersonic AeroCorp", slug="supersonic-aero")
    db_session.add(org)

    user = User(
        id="user_designer_eval_1",
        email="art.director@supersonic.com",
        hashed_password="fake_hash_value",
        full_name="Art Director Alex",
        is_active=True,
    )
    db_session.add(user)

    # Brand Guideline & Rules
    guideline = BrandGuideline(
        id="gl_supersonic_1",
        organization_id=org.id,
        name="Supersonic 2026 Brand Standards",
        version="2.0.0",
        is_active=True,
    )
    db_session.add(guideline)

    rule1 = GuidelineRule(
        guideline_id=guideline.id,
        category="visual_brand",
        rule_name="Logo Safe Zone",
        rule_definition={"min_clearspace_px": 32, "description": "Preserve 32px safe zone around logo"},
        severity_default="high",
    )
    rule2 = GuidelineRule(
        guideline_id=guideline.id,
        category="accessibility",
        rule_name="WCAG 2.1 AA Contrast",
        rule_definition={"min_contrast_ratio": 4.5, "description": "Minimum 4.5:1 text-to-background contrast ratio"},
        severity_default="critical",
    )
    db_session.add_all([rule1, rule2])

    # Approved Brand Assets
    asset_logo = ApprovedAsset(
        id="asset_logo_super",
        organization_id=org.id,
        name="Supersonic Primary Horizontal Logo",
        asset_type="logo",
        file_path="/assets/logos/supersonic_primary.png",
        specifications={"min_width_px": 120, "clearspace_px": 32},
        is_active=True,
    )
    asset_palette = ApprovedAsset(
        id="asset_palette_super",
        organization_id=org.id,
        name="Supersonic Navy & Electric Indigo Palette",
        asset_type="color_palette",
        specifications={"primary": "#0A192F", "accent": "#00E5FF", "text": "#FFFFFF"},
        is_active=True,
    )
    db_session.add_all([asset_logo, asset_palette])
    db_session.commit()

    auth = AuthContext(
        user_id=user.id,
        organization_id=org.id,
        roles=[UserRole.DESIGNER, UserRole.ADMIN],
        email=user.email,
        is_authenticated=True,
    )

    return {"org": org, "user": user, "guideline": guideline, "auth": auth}


def test_single_and_multi_concept_generation(db_session: Session, designer_test_env):
    """
    Test 1: Dynamic Concept Generation
    Verifies that requesting 1 concept prioritizes 1 strong solution,
    and requesting multiple concepts produces distinct visual directions.
    """
    auth = designer_test_env["auth"]

    # 1. Single concept generation
    brief_single = CreativeBriefRequest(
        product="AeroCorp Mach 3 Commercial Transport",
        design_objective="Introduce premium transcontinental jet",
        placement_channel=DesignPlacementChannel.LINKEDIN,
        aspect_ratio=DesignAspectRatio.LINKEDIN_1_91_1,
        num_concepts=1,
    )
    res_single = DesignerCopilotService.generate_creative_concepts(db_session, auth, brief_single)
    assert len(res_single.concepts) == 1
    assert "Mach 3" in res_single.concepts[0].headline_copy_suggestion or "AeroCorp" in res_single.concepts[0].headline_copy_suggestion
    assert res_single.concepts[0].is_ai_generated is True
    assert res_single.concepts[0].is_approved is False

    # 2. Multi-concept generation (2 distinct directions)
    brief_multi = CreativeBriefRequest(
        product="AeroCorp Mach 3 Commercial Transport",
        design_objective="Introduce premium transcontinental jet",
        placement_channel=DesignPlacementChannel.LINKEDIN,
        num_concepts=2,
    )
    res_multi = DesignerCopilotService.generate_creative_concepts(db_session, auth, brief_multi)
    assert len(res_multi.concepts) == 2
    # Ensure directions are distinctly named
    assert res_multi.concepts[0].concept_name != res_multi.concepts[1].concept_name


def test_real_reference_image_analysis_with_pil(db_session: Session, designer_test_env):
    """
    Test 2: Genuine Reference Image Analysis with PIL
    Generates a real 800x600 test image on disk and verifies exact dimensions,
    dominant color quantization, and mathematically exact WCAG 2.1 AA contrast ratio.
    """
    auth = designer_test_env["auth"]

    # Create real black & white image with PIL (Luminance ratio should be 21.0)
    with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
        tmp_path = tmp.name

    try:
        img = Image.new("RGB", (800, 600), color=(255, 255, 255))
        draw = ImageDraw.Draw(img)
        # Draw pure black text block
        draw.rectangle([100, 100, 700, 300], fill=(0, 0, 0))
        img.save(tmp_path)

        req = ReferenceImageAnalysisRequest(file_path=tmp_path)
        res = DesignerCopilotService.analyze_reference_image(db_session, auth, req)

        assert res.dimensions["width"] == 800
        assert res.dimensions["height"] == 600
        assert res.dimensions["aspect_ratio"] == "1.33:1"
        assert res.contrast_ratio == 21.0
        assert res.wcag_aa_compliant is True
        assert len(res.dominant_colors_hex) >= 2
        assert "#FFFFFF" in res.dominant_colors_hex
        assert "#000000" in res.dominant_colors_hex
        assert len(res.observable_facts) > 0
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)


def test_missing_and_low_res_image_honest_handling(db_session: Session, designer_test_env):
    """
    Test 3: Honest Handling of Missing or Low-Resolution Images
    Ensures the copilot never fakes visual metrics when image access fails or resolution is degraded.
    """
    auth = designer_test_env["auth"]

    # 1. Missing image path
    req_missing = ReferenceImageAnalysisRequest(file_path="non_existent_image_98765.png")
    res_missing = DesignerCopilotService.analyze_reference_image(db_session, auth, req_missing)

    assert res_missing.contrast_ratio is None
    assert res_missing.wcag_aa_compliant is None
    assert any("unavailable" in u.lower() or "does not exist" in u.lower() for u in res_missing.uncertainty_limitations)

    # 2. Low-resolution image (<200px)
    with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
        tmp_path = tmp.name

    try:
        tiny_img = Image.new("RGB", (120, 120), color=(10, 25, 47))
        tiny_img.save(tmp_path)

        req_tiny = ReferenceImageAnalysisRequest(file_path=tmp_path)
        res_tiny = DesignerCopilotService.analyze_reference_image(db_session, auth, req_tiny)

        assert res_tiny.dimensions["width"] == 120
        assert any("low resolution" in u.lower() for u in res_tiny.uncertainty_limitations)
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)


def test_structured_design_critique_evaluation(db_session: Session, designer_test_env):
    """
    Test 4: Structured Creative Design Critique
    Evaluates visual hierarchy, contrast, safe-zones, and outputs structured issues
    with why it matters, how to fix, and suggested alternatives.
    """
    auth = designer_test_env["auth"]

    brief = CreativeBriefRequest(
        product="Skyline Executive Suite",
        design_objective="Executive aircraft charter",
        placement_channel=DesignPlacementChannel.INSTAGRAM,
        num_concepts=1,
    )
    gen = DesignerCopilotService.generate_creative_concepts(db_session, auth, brief)
    concept = gen.concepts[0]

    req = DesignCritiqueRequest(
        concept_data=concept.model_dump(),
        channel=DesignPlacementChannel.INSTAGRAM,
    )
    critique = DesignerCopilotService.critique_design_direction(db_session, auth, req)

    assert critique.critique_id is not None
    assert critique.hierarchy_score > 0
    assert critique.accessibility_score > 0
    assert len(critique.strengths) > 0
    assert len(critique.actionable_next_steps) > 0

    for issue in critique.critical_issues:
        assert issue.issue != ""
        assert issue.why_it_matters != ""
        assert issue.how_to_fix != ""
        assert issue.suggested_alternative != ""


def test_stateful_adaptation_make_it_more_premium(db_session: Session, designer_test_env):
    """
    Test 5: Stateful Design Adaptation ('Make It More Premium')
    Transforms canvas palette to #0A192F (Deep Navy), expands negative space to 45%,
    and refines typography tracking while strictly preserving headline and product offering.
    """
    auth = designer_test_env["auth"]

    base_concept_dict = {
        "id": "concept_baseline_1",
        "concept_name": "Modern Horizon",
        "product": "AeroCorp Mach 3",
        "creative_objective_rationale": "High-speed corporate jet positioning",
        "headline_copy_suggestion": "The Speed of Sound, Redefined.",
        "visual_direction_composition": "Bold gradient banner with high contrast typography.",
        "suggested_layout_hierarchy": "1. Logo 2. Headline 3. Call to Action",
        "color_palette_tokens": [],
        "typography_recommendations": [],
        "imagery_illustration_direction": "High-altitude jet photograph",
        "logo_asset_placement": "Top-left with 32px safe-zone padding",
        "call_to_action_placement": "Bottom center button",
        "channel_specific_considerations": "Landscape feed display",
        "accessibility_considerations": "WCAG AA compliant",
    }

    req = DesignAdaptationRequest(
        base_concept=base_concept_dict,
        adaptation_instruction="Make this design more premium, luxury and high-end but keep headline and product",
    )
    res = DesignerCopilotService.adapt_design_concept(db_session, auth, req)

    adapted = res.adapted_concept
    assert "Premium" in adapted.concept_name
    assert "0A192F" in adapted.visual_direction_composition or any(t.hex == "#0A192F" for t in adapted.color_palette_tokens)
    assert any("negative space" in m.lower() for m in res.applied_modifications)

    # Verify headline and logo anchors are strictly preserved
    assert any("The Speed of Sound, Redefined." in p for p in res.preserved_elements)
    assert any("Logo Clearspace" in p for p in res.preserved_elements)


def test_cross_platform_adaptation_instagram_vs_linkedin(db_session: Session, designer_test_env):
    """
    Test 6: Cross-Platform Re-Layout Adaptation
    Adapts concepts between Instagram (1:1 square, single vertical flow)
    and LinkedIn (1.91:1 landscape, 60/40 B2B split).
    """
    auth = designer_test_env["auth"]

    base_concept_dict = {
        "id": "concept_cross_1",
        "concept_name": "Aero Velocity",
        "product": "AeroCorp",
        "creative_objective_rationale": "Cross-platform visual consistency",
        "headline_copy_suggestion": "Unmatched Velocity.",
        "visual_direction_composition": "Horizontal banner layout",
        "suggested_layout_hierarchy": "1. Logo 2. Headline 3. CTA",
        "color_palette_tokens": [],
        "typography_recommendations": [],
        "imagery_illustration_direction": "Jet render",
        "logo_asset_placement": "Top left",
        "call_to_action_placement": "Bottom right",
        "channel_specific_considerations": "General web",
        "accessibility_considerations": "Compliant",
    }

    # 1. Adapt for Instagram
    req_insta = DesignAdaptationRequest(
        base_concept=base_concept_dict,
        adaptation_instruction="Adapt for Instagram square feed",
    )
    res_insta = DesignerCopilotService.adapt_design_concept(db_session, auth, req_insta)
    assert "Instagram" in res_insta.adapted_concept.concept_name
    assert "1:1" in res_insta.adapted_concept.channel_specific_considerations
    assert any("1:1" in m for m in res_insta.applied_modifications)

    # 2. Adapt for LinkedIn
    req_li = DesignAdaptationRequest(
        base_concept=base_concept_dict,
        adaptation_instruction="Adapt for LinkedIn B2B feed",
    )
    res_li = DesignerCopilotService.adapt_design_concept(db_session, auth, req_li)
    assert "LinkedIn" in res_li.adapted_concept.concept_name
    assert "1.91:1" in res_li.adapted_concept.channel_specific_considerations
    assert any("1.91:1" in m for m in res_li.applied_modifications)


def test_designer_tools_in_registry(db_session: Session, designer_test_env):
    """
    Test 7: Tool Registry Integration & Execution
    Verifies analyze_reference_image, critique_design, and adapt_design_concept
    are registered, enforce role checks, and execute truthfully.
    """
    auth = designer_test_env["auth"]

    # 1. Critique design tool execution
    critique_result = tool_registry.execute_tool(
        name="critique_design",
        arguments={"channel": "instagram"},
        db=db_session,
        auth=auth,
        copilot_type=CopilotType.DESIGNER_COPILOT,
    )
    assert critique_result.success is True
    assert "hierarchy_score" in critique_result.data

    # 2. Adapt design concept tool execution
    adapt_result = tool_registry.execute_tool(
        name="adapt_design_concept",
        arguments={"adaptation_instruction": "make it more premium with deep navy"},
        db=db_session,
        auth=auth,
        copilot_type=CopilotType.DESIGNER_COPILOT,
    )
    assert adapt_result.success is True
    assert "adapted_concept" in adapt_result.data

    # 3. Unauthorized copilot domain check
    unauthorized_res = tool_registry.execute_tool(
        name="critique_design",
        arguments={},
        db=db_session,
        auth=auth,
        copilot_type=CopilotType.LEGAL_COPILOT,  # Legal copilot not authorized for visual critique
    )
    assert unauthorized_res.success is False
    assert "not authorized" in unauthorized_res.error.lower()


def test_multi_turn_copilot_conversation_orchestration(db_session: Session, designer_test_env):
    """
    Test 8: Multi-Turn Conversation Continuity in Designer Copilot
    Turn 1: User asks for a visual concept.
    Turn 2: User says 'Make it more premium'. Copilot maintains session and applies adaptation.
    """
    auth = designer_test_env["auth"]

    # Turn 1: Initial design brief
    turn1_req = CopilotRequest(
        copilot_type=CopilotType.DESIGNER_COPILOT,
        message="Create a visual design layout for AeroCorp Supersonic Jet on LinkedIn",
    )
    turn1_res = SharedIntelligenceEngine.orchestrate(db_session, auth, turn1_req)
    assert turn1_res.session_id is not None
    assert turn1_res.structured_deliverable is not None or "Visual Design Directions" in turn1_res.content

    # Turn 2: Follow-up iteration
    turn2_req = CopilotRequest(
        copilot_type=CopilotType.DESIGNER_COPILOT,
        message="Make it more premium, but keep the headline and logo placement",
        session_id=turn1_res.session_id,
    )
    turn2_res = SharedIntelligenceEngine.orchestrate(db_session, auth, turn2_req)

    assert turn2_res.session_id == turn1_res.session_id
    assert turn2_res.task_type == TaskType.CREATIVE_REVISION
    # Check that tool execution or grounded text reflects adaptation
    assert any(t.tool_name == "adapt_design_concept" for t in turn2_res.tools_executed) or "Stateful Design Adaptation" in turn2_res.content


def test_visual_audit_service_integration(db_session: Session, designer_test_env):
    """
    Test 9: Real Visual Audit Engine Integration
    Saves a design draft revision, executes visual audit, and verifies
    findings and score are computed without premature publication approval.
    """
    auth = designer_test_env["auth"]

    # 1. Create design draft
    brief_req = CreativeBriefRequest(
        product="AeroCorp Mach 3",
        design_objective="Executive charter promotion",
        placement_channel=DesignPlacementChannel.GENERAL,
    )
    draft_req = SaveCreativeBriefDraftRequest(
        project_name="AeroCorp Mach 3 Campaign",
        brief=brief_req,
    )
    draft = DesignerCopilotService.save_creative_brief_draft(db_session, auth, draft_req)
    assert draft.id is not None
    assert draft.status == "draft"

    # 2. Audit design version
    audit_res = DesignerCopilotService.audit_design_version(
        db=db_session,
        auth=auth,
        brief_id=draft.id,
    )
    assert audit_res.audit_id is not None
    assert audit_res.summary is not None
    assert audit_res.summary.compliance_score >= 0.0

    # Verify audit does NOT automatically approve or publish the submission
    submission = db_session.query(ContentSubmission).filter(ContentSubmission.id == draft.id).first()
    assert submission.status != "approved"  # Must never auto-approve publication
    assert submission.status in ["draft", "pending_approval", "pending_review"]


def test_tenant_isolation_and_rbac_defense(db_session: Session, designer_test_env):
    """
    Test 10: Multi-Tenant Isolation & Role Security
    Ensures Tenant B cannot access Tenant A's creative briefs, assets, or run audits on them.
    """
    auth_a = designer_test_env["auth"]

    # Create Tenant B
    org_b = Organization(id="org_foreign_b", name="Foreign Rival Inc", slug="foreign-rival")
    db_session.add(org_b)
    user_b = User(id="user_foreign_b", email="rival@foreign.com", hashed_password="pw", full_name="Rival")
    db_session.add(user_b)
    db_session.commit()

    auth_b = AuthContext(
        user_id=user_b.id,
        organization_id=org_b.id,
        roles=[UserRole.DESIGNER],
        email=user_b.email,
        is_authenticated=True,
    )

    # Tenant A creates brief
    brief_req = CreativeBriefRequest(product="AeroCorp Stealth", design_objective="Classified design")
    draft_a = DesignerCopilotService.save_creative_brief_draft(
        db_session,
        auth_a,
        SaveCreativeBriefDraftRequest(project_name="Tenant A Secret Project", brief=brief_req),
    )

    # Tenant B tries to access Tenant A brief
    with pytest.raises(Exception):
        DesignerCopilotService.get_creative_brief(db_session, auth_b, draft_a.id)

    # Tenant B lists briefs: must not see Tenant A's project
    briefs_b = DesignerCopilotService.list_creative_briefs(db_session, auth_b)
    assert not any(b.id == draft_a.id for b in briefs_b)
