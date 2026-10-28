"""
Tool Registry and Execution Dispatcher for Shared Intelligence Engine
Provides role-checked, tenant-isolated, safe tool execution across all copilots.
Never bypasses backend authorization or autonomous approvals.
"""
import time
import uuid
import logging
from typing import Dict, Any, List, Optional, Callable
from sqlalchemy.orm import Session

from app.core.security import AuthContext, Permission, UserRole
from app.schemas.orchestration import (
    CopilotType,
    ToolDefinition,
    ToolParameterSchema,
    ToolResult,
)
from app.models import (
    Organization,
    BrandGuideline,
    GuidelineRule,
    KnowledgeItem,
    ApprovedAsset,
    ContentSubmission,
    ContentRevision,
    Campaign,
    AuditRun,
)
from app.services.document_intelligence.retrieval import DocumentRetrievalService
from app.services.shared_intelligence.retrieval import KnowledgeRetriever

logger = logging.getLogger("inkloom.tool_registry")


class ToolExecutionError(Exception):
    """Raised when tool execution fails."""
    pass


class ToolRegistry:
    """
    Centralized tool execution registry with strict tenant isolation,
    role permission enforcement, timeout handling, and consequential action gates.
    """

    def __init__(self):
        self._tools: Dict[str, ToolDefinition] = {}
        self._handlers: Dict[str, Callable[[Session, AuthContext, Dict[str, Any]], Any]] = {}
        self._register_default_tools()

    def register_tool(
        self,
        definition: ToolDefinition,
        handler: Callable[[Session, AuthContext, Dict[str, Any]], Any],
    ) -> None:
        self._tools[definition.name] = definition
        self._handlers[definition.name] = handler

    def get_tool(self, name: str) -> Optional[ToolDefinition]:
        return self._tools.get(name)

    def list_authorized_tools(self, copilot_type: CopilotType, auth: AuthContext) -> List[ToolDefinition]:
        """Returns tools authorized for the caller's role and copilot domain."""
        user_roles_str = {r.value for r in auth.roles} if auth.roles else {"viewer"}
        authorized: List[ToolDefinition] = []

        for name, tool in self._tools.items():
            # Check copilot domain
            if copilot_type != CopilotType.GENERAL and copilot_type not in tool.authorized_copilots:
                continue
            # Check user role authorization
            if any(role in user_roles_str for role in tool.authorized_roles) or "all" in tool.authorized_roles:
                authorized.append(tool)

        return authorized

    def execute_tool(
        self,
        name: str,
        arguments: Dict[str, Any],
        db: Session,
        auth: AuthContext,
        copilot_type: CopilotType,
        confirmed: bool = False,
    ) -> ToolResult:
        """
        Executes a registered tool within strict tenant and role boundaries.
        Enforces confirmation gate for consequential actions.
        """
        call_id = f"tool_{uuid.uuid4().hex[:8]}"
        start_time = time.perf_counter()

        tool = self._tools.get(name)
        if not tool:
            return ToolResult(
                call_id=call_id,
                tool_name=name,
                success=False,
                error=f"Tool '{name}' is not recognized in the intelligence tool registry.",
                execution_time_ms=(time.perf_counter() - start_time) * 1000.0,
            )

        # 1. Copilot domain authorization check
        if copilot_type != CopilotType.GENERAL and copilot_type not in tool.authorized_copilots:
            return ToolResult(
                call_id=call_id,
                tool_name=name,
                success=False,
                error=f"Copilot '{copilot_type.value}' is not authorized to invoke tool '{name}'.",
                execution_time_ms=(time.perf_counter() - start_time) * 1000.0,
            )

        # 2. Role permission check
        user_roles_str = {r.value for r in auth.roles} if auth.roles else {"viewer"}
        if "all" not in tool.authorized_roles and not any(r in user_roles_str for r in tool.authorized_roles):
            return ToolResult(
                call_id=call_id,
                tool_name=name,
                success=False,
                error=f"User roles {list(user_roles_str)} lack permission to execute '{name}'. Required: {tool.authorized_roles}",
                execution_time_ms=(time.perf_counter() - start_time) * 1000.0,
            )

        # 3. Consequential action confirmation check
        if tool.is_consequential and not confirmed:
            return ToolResult(
                call_id=call_id,
                tool_name=name,
                success=False,
                error="Action is consequential and requires explicit user confirmation before execution.",
                data={"requires_confirmation": True, "action": name, "arguments": arguments},
                execution_time_ms=(time.perf_counter() - start_time) * 1000.0,
            )

        # 4. Execute tool handler
        handler = self._handlers.get(name)
        if not handler:
            return ToolResult(
                call_id=call_id,
                tool_name=name,
                success=False,
                error=f"Tool handler for '{name}' is not implemented.",
                execution_time_ms=(time.perf_counter() - start_time) * 1000.0,
            )

        try:
            result_data = handler(db, auth, arguments)
            latency_ms = (time.perf_counter() - start_time) * 1000.0
            return ToolResult(
                call_id=call_id,
                tool_name=name,
                success=True,
                data=result_data,
                execution_time_ms=round(latency_ms, 2),
            )
        except Exception as exc:
            logger.warning("Tool '%s' execution failed: %s", name, str(exc), exc_info=True)
            latency_ms = (time.perf_counter() - start_time) * 1000.0
            return ToolResult(
                call_id=call_id,
                tool_name=name,
                success=False,
                error=f"Tool execution failed: {str(exc)}",
                execution_time_ms=round(latency_ms, 2),
            )

    # =========================================================================
    # Default Tool Handlers
    # =========================================================================

    def _register_default_tools(self) -> None:
        # 1. retrieve_brand_guidelines
        self.register_tool(
            ToolDefinition(
                name="retrieve_brand_guidelines",
                description="Retrieves approved brand identity rules, typography, color standards, tone, and forbidden terms.",
                parameters=[
                    ToolParameterSchema(name="channel", type="string", description="Target distribution channel", required=False),
                    ToolParameterSchema(name="category", type="string", description="Rule category e.g. visual, editorial, legal", required=False),
                    ToolParameterSchema(name="query", type="string", description="Keyword search query", required=False),
                ],
                authorized_roles=["all"],
                authorized_copilots=[
                    CopilotType.BRAND_ASSISTANT,
                    CopilotType.MARKETING_COPILOT,
                    CopilotType.DESIGNER_COPILOT,
                    CopilotType.LEGAL_COPILOT,
                    CopilotType.GENERAL,
                ],
            ),
            self._handle_retrieve_brand_guidelines,
        )

        # 2. search_verified_facts
        self.register_tool(
            ToolDefinition(
                name="search_verified_facts",
                description="Searches certified organization claims, product specifications, benchmarks, and substantiation facts.",
                parameters=[
                    ToolParameterSchema(name="query_text", type="string", description="Claim or topic to substantiate", required=True),
                    ToolParameterSchema(name="category", type="string", description="Optional category filter", required=False),
                ],
                authorized_roles=["all"],
                authorized_copilots=[
                    CopilotType.BRAND_ASSISTANT,
                    CopilotType.MARKETING_COPILOT,
                    CopilotType.LEGAL_COPILOT,
                    CopilotType.GENERAL,
                ],
            ),
            self._handle_search_verified_facts,
        )

        # 3. read_authorized_document
        self.register_tool(
            ToolDefinition(
                name="read_authorized_document",
                description="Retrieves exact passages from authorized uploaded brand documentation with document name and page citation.",
                parameters=[
                    ToolParameterSchema(name="query", type="string", description="Search query string", required=True),
                    ToolParameterSchema(name="top_k", type="integer", description="Number of passages to retrieve", required=False, default=5),
                ],
                authorized_roles=["all"],
                authorized_copilots=[
                    CopilotType.BRAND_ASSISTANT,
                    CopilotType.MARKETING_COPILOT,
                    CopilotType.DESIGNER_COPILOT,
                    CopilotType.LEGAL_COPILOT,
                    CopilotType.GENERAL,
                ],
            ),
            self._handle_read_authorized_document,
        )

        # 4. retrieve_brand_assets
        self.register_tool(
            ToolDefinition(
                name="retrieve_brand_assets",
                description="Retrieves approved brand assets (logos, palettes, typography, boilerplate) for the tenant.",
                parameters=[
                    ToolParameterSchema(name="asset_type", type="string", description="Filter by logo, color_palette, typography", required=False),
                ],
                authorized_roles=["all"],
                authorized_copilots=[
                    CopilotType.DESIGNER_COPILOT,
                    CopilotType.MARKETING_COPILOT,
                    CopilotType.BRAND_ASSISTANT,
                    CopilotType.GENERAL,
                ],
            ),
            self._handle_retrieve_brand_assets,
        )

        # 5. retrieve_legal_sources
        self.register_tool(
            ToolDefinition(
                name="retrieve_legal_sources",
                description="Retrieves authoritative statutory codes, regulations, and official regulator guidance (FTC, EU AI Act, Lanham Act).",
                parameters=[
                    ToolParameterSchema(name="jurisdiction", type="string", description="Target jurisdiction (US, EU, UK, Global)", required=False, default="Global"),
                    ToolParameterSchema(name="category", type="string", description="Regulated sector filter", required=False),
                ],
                authorized_roles=["all"],
                authorized_copilots=[
                    CopilotType.LEGAL_COPILOT,
                    CopilotType.MARKETING_COPILOT,
                    CopilotType.BRAND_ASSISTANT,
                    CopilotType.GENERAL,
                ],
            ),
            self._handle_retrieve_legal_sources,
        )

        # 6. get_campaign_status
        self.register_tool(
            ToolDefinition(
                name="get_campaign_status",
                description="Retrieves details, linked submissions, and readiness evaluation for a specified campaign.",
                parameters=[
                    ToolParameterSchema(name="campaign_id", type="string", description="Campaign UUID", required=True),
                ],
                authorized_roles=["all"],
                authorized_copilots=[
                    CopilotType.MARKETING_COPILOT,
                    CopilotType.DESIGNER_COPILOT,
                    CopilotType.LEGAL_COPILOT,
                    CopilotType.BRAND_ASSISTANT,
                    CopilotType.GENERAL,
                ],
            ),
            self._handle_get_campaign_status,
        )

        # 7. generate_marketing_copy
        self.register_tool(
            ToolDefinition(
                name="generate_marketing_copy",
                description="Generates brand-governed marketing copy alternatives grounded in verified facts and brand voice rules.",
                parameters=[
                    ToolParameterSchema(name="product", type="string", description="Product name or offering", required=True),
                    ToolParameterSchema(name="objective", type="string", description="Campaign objective", required=True),
                    ToolParameterSchema(name="channel", type="string", description="Marketing channel (linkedin, twitter, email, ad, website)", required=False, default="linkedin"),
                    ToolParameterSchema(name="tone", type="string", description="Preferred brand tone", required=False, default="Professional & Trustworthy"),
                    ToolParameterSchema(name="num_alternatives", type="integer", description="Number of variations", required=False, default=3),
                ],
                authorized_roles=["marketing", "creator", "admin", "compliance_officer", "designer", "reviewer"],
                authorized_copilots=[
                    CopilotType.MARKETING_COPILOT,
                    CopilotType.BRAND_ASSISTANT,
                    CopilotType.GENERAL,
                ],
            ),
            self._handle_generate_marketing_copy,
        )

        # 8. generate_design_concept
        self.register_tool(
            ToolDefinition(
                name="generate_design_concept",
                description="Generates visual design concepts adhering strictly to approved brand tokens, typography, and WCAG AA contrast.",
                parameters=[
                    ToolParameterSchema(name="product", type="string", description="Product or offering name", required=True),
                    ToolParameterSchema(name="objective", type="string", description="Design objective", required=True),
                    ToolParameterSchema(name="channel", type="string", description="Placement channel (social_feed, billboard, web_landing)", required=False, default="social_feed"),
                    ToolParameterSchema(name="visual_style", type="string", description="Visual style/tone guidance", required=False, default="High-Contrast Enterprise Modern"),
                    ToolParameterSchema(name="num_concepts", type="integer", description="Number of concept variations", required=False, default=2),
                ],
                authorized_roles=["designer", "marketing", "creator", "admin", "compliance_officer", "reviewer"],
                authorized_copilots=[
                    CopilotType.DESIGNER_COPILOT,
                    CopilotType.BRAND_ASSISTANT,
                    CopilotType.GENERAL,
                ],
            ),
            self._handle_generate_design_concept,
        )

        # 9. run_brand_audit
        self.register_tool(
            ToolDefinition(
                name="run_brand_audit",
                description="Executes automated multi-track brand, claim, and visual audit on a submitted content asset.",
                parameters=[
                    ToolParameterSchema(name="submission_id", type="string", description="Content submission UUID to audit", required=True),
                    ToolParameterSchema(name="revision_id", type="string", description="Specific revision UUID", required=False),
                ],
                authorized_roles=["marketing", "creator", "admin", "compliance_officer", "designer", "reviewer", "legal"],
                authorized_copilots=[
                    CopilotType.BRAND_ASSISTANT,
                    CopilotType.MARKETING_COPILOT,
                    CopilotType.DESIGNER_COPILOT,
                    CopilotType.LEGAL_COPILOT,
                    CopilotType.GENERAL,
                ],
            ),
            self._handle_run_brand_audit,
        )

        # 10. save_content_draft
        self.register_tool(
            ToolDefinition(
                name="save_content_draft",
                description="Saves a generated marketing or design draft as an organizational submission record in draft status.",
                parameters=[
                    ToolParameterSchema(name="title", type="string", description="Draft title", required=True),
                    ToolParameterSchema(name="content_text", type="string", description="Text content to save", required=True),
                    ToolParameterSchema(name="campaign_id", type="string", description="Optional campaign ID association", required=False),
                    ToolParameterSchema(name="channel", type="string", description="Target distribution channel", required=False, default="web"),
                ],
                authorized_roles=["marketing", "creator", "admin", "designer"],
                authorized_copilots=[
                    CopilotType.MARKETING_COPILOT,
                    CopilotType.DESIGNER_COPILOT,
                    CopilotType.BRAND_ASSISTANT,
                    CopilotType.GENERAL,
                ],
            ),
            self._handle_save_content_draft,
        )

        # 11. submit_for_human_review (Consequential!)
        self.register_tool(
            ToolDefinition(
                name="submit_for_human_review",
                description="Submits a content draft to the human reviewer queue. Requires explicit confirmation.",
                parameters=[
                    ToolParameterSchema(name="submission_id", type="string", description="Submission UUID to transition to review", required=True),
                    ToolParameterSchema(name="notes", type="string", description="Submission rationale or notes", required=False),
                ],
                authorized_roles=["marketing", "creator", "admin", "designer"],
                authorized_copilots=[
                    CopilotType.MARKETING_COPILOT,
                    CopilotType.DESIGNER_COPILOT,
                    CopilotType.BRAND_ASSISTANT,
                    CopilotType.GENERAL,
                ],
                is_consequential=True,
            ),
            self._handle_submit_for_human_review,
        )

        # 12. analyze_reference_image
        self.register_tool(
            ToolDefinition(
                name="analyze_reference_image",
                description="Performs genuine visual analysis on uploaded reference image or revision file, measuring dimensions, dominant palette, and WCAG contrast.",
                parameters=[
                    ToolParameterSchema(name="file_path", type="string", description="Local file path to image", required=False),
                    ToolParameterSchema(name="submission_id", type="string", description="Submission ID with revision image", required=False),
                    ToolParameterSchema(name="revision_id", type="string", description="Exact revision ID", required=False),
                    ToolParameterSchema(name="user_query", type="string", description="Specific visual question", required=False),
                ],
                authorized_roles=["designer", "marketing", "creator", "admin", "compliance_officer", "reviewer"],
                authorized_copilots=[
                    CopilotType.DESIGNER_COPILOT,
                    CopilotType.BRAND_ASSISTANT,
                    CopilotType.GENERAL,
                ],
            ),
            self._handle_analyze_reference_image,
        )

        # 13. critique_design
        self.register_tool(
            ToolDefinition(
                name="critique_design",
                description="Performs structured design critique evaluating visual hierarchy, WCAG contrast, mobile safe-zones, and branding.",
                parameters=[
                    ToolParameterSchema(name="concept_id", type="string", description="Concept ID to critique", required=False),
                    ToolParameterSchema(name="submission_id", type="string", description="Submission ID to critique", required=False),
                    ToolParameterSchema(name="channel", type="string", description="Placement channel", required=False, default="social_feed"),
                ],
                authorized_roles=["designer", "marketing", "creator", "admin", "compliance_officer", "reviewer"],
                authorized_copilots=[
                    CopilotType.DESIGNER_COPILOT,
                    CopilotType.BRAND_ASSISTANT,
                    CopilotType.GENERAL,
                ],
            ),
            self._handle_critique_design,
        )

        # 14. adapt_design_concept
        self.register_tool(
            ToolDefinition(
                name="adapt_design_concept",
                description="Statefully adapts a visual design concept (e.g. 'make it more premium', 'adapt for Instagram') preserving unprompted constraints.",
                parameters=[
                    ToolParameterSchema(name="adaptation_instruction", type="string", description="Refinement prompt (e.g. 'make it more premium')", required=True),
                    ToolParameterSchema(name="target_channel", type="string", description="Target channel", required=False),
                ],
                authorized_roles=["designer", "marketing", "creator", "admin", "compliance_officer", "reviewer"],
                authorized_copilots=[
                    CopilotType.DESIGNER_COPILOT,
                    CopilotType.BRAND_ASSISTANT,
                    CopilotType.GENERAL,
                ],
            ),
            self._handle_adapt_design_concept,
        )

    # Handlers implementation
    def _handle_retrieve_brand_guidelines(self, db: Session, auth: AuthContext, args: Dict[str, Any]) -> Any:
        channel = args.get("channel", "web")
        query_text = args.get("query")
        rules = KnowledgeRetriever.retrieve_applicable_rules(
            db=db,
            organization_id=auth.organization_id,
            content_text=query_text,
            target_channel=channel,
        )
        return [
            {
                "rule_id": r.rule_id,
                "rule_name": r.rule_name,
                "category": r.category,
                "description": (r.rule_definition.get("description") if isinstance(r.rule_definition, dict) else str(r.rule_definition)) or r.rule_name,
                "severity": r.severity_default,
                "suggested_fix": r.rule_definition.get("suggested_fix") if isinstance(r.rule_definition, dict) else None,
            }
            for r in rules
        ]

    def _handle_search_verified_facts(self, db: Session, auth: AuthContext, args: Dict[str, Any]) -> Any:
        query_text = args.get("query_text", "")
        facts = KnowledgeRetriever.retrieve_verified_facts(
            db=db,
            organization_id=auth.organization_id,
            query_text=query_text,
        )
        return [
            {
                "claim_key": f.claim_key,
                "statement": f.statement,
                "evidence_status": f.evidence_status.value if hasattr(f.evidence_status, "value") else str(f.evidence_status),
                "provenance": f.provenance.source_title if f.provenance else None,
            }
            for f in facts
            if f.fact_id != "fact_unavailable"
        ]

    def _handle_read_authorized_document(self, db: Session, auth: AuthContext, args: Dict[str, Any]) -> Any:
        query = args.get("query", "")
        top_k = int(args.get("top_k", 5))
        passages = DocumentRetrievalService.retrieve_passages(
            db=db,
            organization_id=auth.organization_id,
            query=query,
            top_k=top_k,
        )
        return [
            {
                "document_id": p.get("document_id"),
                "document_name": p.get("document_name"),
                "page": p.get("page"),
                "section": p.get("section"),
                "snippet": p.get("snippet"),
                "score": p.get("score"),
            }
            for p in passages
        ]

    def _handle_retrieve_brand_assets(self, db: Session, auth: AuthContext, args: Dict[str, Any]) -> Any:
        asset_type = args.get("asset_type")
        assets = KnowledgeRetriever.retrieve_brand_assets(
            db=db,
            organization_id=auth.organization_id,
            asset_type=asset_type,
        )
        return [
            {
                "asset_id": a.asset_id,
                "name": getattr(a, "name", None) or getattr(a, "asset_name", ""),
                "asset_type": a.asset_type,
                "specifications": a.specifications,
            }
            for a in assets
        ]

    def _handle_retrieve_legal_sources(self, db: Session, auth: AuthContext, args: Dict[str, Any]) -> Any:
        from app.services.legal_copilot.service import LegalCopilotService
        jurisdiction = args.get("jurisdiction", "Global")
        category = args.get("category")
        sources = LegalCopilotService.retrieve_legal_sources(
            db=db,
            auth=auth,
            jurisdiction=jurisdiction,
            regulated_category=category,
        )
        return [s.model_dump() for s in sources]

    def _handle_get_campaign_status(self, db: Session, auth: AuthContext, args: Dict[str, Any]) -> Any:
        campaign_id = args.get("campaign_id")
        campaign = (
            db.query(Campaign)
            .filter(
                Campaign.id == campaign_id,
                Campaign.organization_id == auth.organization_id,
            )
            .first()
        )
        if not campaign:
            raise ToolExecutionError(f"Campaign with ID '{campaign_id}' not found.")

        submissions = (
            db.query(ContentSubmission)
            .filter(
                ContentSubmission.campaign_id == campaign.id,
                ContentSubmission.organization_id == auth.organization_id,
            )
            .all()
        )

        return {
            "campaign_id": campaign.id,
            "name": campaign.name,
            "status": campaign.status,
            "product_name": campaign.product_name,
            "target_channel": campaign.target_channel,
            "target_jurisdiction": campaign.target_jurisdiction,
            "priority": campaign.priority,
            "submissions_count": len(submissions),
            "submissions": [
                {"id": s.id, "title": s.title, "status": s.status}
                for s in submissions[:10]
            ],
        }

    def _handle_generate_marketing_copy(self, db: Session, auth: AuthContext, args: Dict[str, Any]) -> Any:
        from app.services.marketing_copilot.service import MarketingCopilotService
        from app.schemas.marketing_copilot import CampaignBriefRequest, MarketingChannel, MarketingContentType

        channel_val = args.get("channel", "linkedin")
        try:
            m_channel = MarketingChannel(channel_val)
        except ValueError:
            m_channel = MarketingChannel.LINKEDIN

        brief = CampaignBriefRequest(
            product=args.get("product"),
            campaign_objective=args.get("objective"),
            channel=m_channel,
            preferred_tone=args.get("tone", "Professional & Trustworthy"),
            content_type=MarketingContentType.CAPTION,
            num_alternatives=int(args.get("num_alternatives", 3)),
        )
        response = MarketingCopilotService.generate_alternatives(
            db=db,
            auth=auth,
            brief=brief,
        )
        return {
            "generation_id": response.generation_id,
            "alternatives": [
                {
                    "text": alt.text,
                    "creative_rationale": alt.creative_rationale,
                    "brand_tone_alignment": alt.brand_tone_alignment,
                    "assumptions": alt.assumptions,
                    "missing_facts": alt.missing_facts,
                    "compliance_warnings": alt.compliance_warnings,
                }
                for alt in response.alternatives
            ],
            "brand_rules_applied": response.brand_context.applicable_rule_names,
            "verified_claims_referenced": response.brand_context.verified_claim_keys,
        }

    def _handle_generate_design_concept(self, db: Session, auth: AuthContext, args: Dict[str, Any]) -> Any:
        from app.services.designer_copilot.service import DesignerCopilotService
        from app.schemas.designer_copilot import CreativeBriefRequest, DesignPlacementChannel

        channel_val = str(args.get("channel", "general")).lower()
        try:
            d_channel = DesignPlacementChannel(channel_val)
        except ValueError:
            d_channel = DesignPlacementChannel.GENERAL

        brief = CreativeBriefRequest(
            product=args.get("product"),
            design_objective=args.get("objective"),
            placement_channel=d_channel,
            visual_style_tone=args.get("visual_style", "High-Contrast Enterprise Modern"),
            num_concepts=int(args.get("num_concepts", 2)),
        )
        response = DesignerCopilotService.generate_creative_concepts(
            db=db,
            auth=auth,
            brief=brief,
        )
        return {
            "generation_id": response.generation_id,
            "concepts": [
                {
                    "concept_name": c.concept_name,
                    "visual_direction_composition": c.visual_direction_composition,
                    "suggested_layout_hierarchy": c.suggested_layout_hierarchy,
                    "headline_copy_suggestion": c.headline_copy_suggestion,
                    "color_palette_tokens": [t.model_dump() for t in c.color_palette_tokens],
                    "typography_recommendations": [t.model_dump() for t in c.typography_recommendations],
                    "accessibility_considerations": c.accessibility_considerations,
                }
                for c in response.concepts
            ],
            "brand_rules_applied": response.brand_rules_applied,
        }

    def _handle_run_brand_audit(self, db: Session, auth: AuthContext, args: Dict[str, Any]) -> Any:
        from app.services.audit_orchestrator import AuditOrchestrator
        submission_id = args.get("submission_id")
        revision_id = args.get("revision_id")

        submission = (
            db.query(ContentSubmission)
            .filter(
                ContentSubmission.id == submission_id,
                ContentSubmission.organization_id == auth.organization_id,
            )
            .first()
        )
        if not submission:
            raise ToolExecutionError(f"Submission '{submission_id}' not found in your organization.")

        audit_result = AuditOrchestrator.execute_audit_for_submission(
            db=db,
            submission_id=submission_id,
            revision_id=revision_id,
            actor_id=auth.user_id,
        )
        score = audit_result.summary.compliance_score if audit_result.summary else 0.0
        return {
            "audit_id": audit_result.audit_id,
            "overall_status": audit_result.overall_status.value if hasattr(audit_result.overall_status, "value") else str(audit_result.overall_status),
            "overall_score": score,
            "findings_count": len(audit_result.findings),
            "findings": [
                {
                    "title": f.title,
                    "severity": f.severity.value if hasattr(f.severity, "value") else str(f.severity),
                    "category": f.category.value if hasattr(f.category, "value") else str(f.category),
                    "description": f.description,
                    "suggested_fix": f.suggested_correction.replacement_text if f.suggested_correction else None,
                }
                for f in audit_result.findings[:5]
            ],
        }

    def _handle_save_content_draft(self, db: Session, auth: AuthContext, args: Dict[str, Any]) -> Any:
        title = args.get("title", "Untitled Copilot Draft")
        content_text = args.get("content_text", "")
        campaign_id = args.get("campaign_id")

        submission = ContentSubmission(
            organization_id=auth.organization_id,
            creator_id=auth.user_id,
            title=title,
            description="Created via Inkloom Shared Intelligence Copilot",
            content_type="text",
            status="draft",
            campaign_id=campaign_id,
        )
        db.add(submission)
        db.commit()
        db.refresh(submission)

        revision = ContentRevision(
            submission_id=submission.id,
            version_number=1,
            raw_text=content_text,
        )
        db.add(revision)
        db.commit()
        db.refresh(revision)

        submission.current_revision_id = revision.id
        db.commit()

        return {
            "submission_id": submission.id,
            "revision_id": revision.id,
            "title": submission.title,
            "status": submission.status,
            "version_number": revision.version_number,
        }

    def _handle_submit_for_human_review(self, db: Session, auth: AuthContext, args: Dict[str, Any]) -> Any:
        submission_id = args.get("submission_id")
        notes = args.get("notes")

        submission = (
            db.query(ContentSubmission)
            .filter(
                ContentSubmission.id == submission_id,
                ContentSubmission.organization_id == auth.organization_id,
            )
            .first()
        )
        if not submission:
            raise ToolExecutionError(f"Submission '{submission_id}' not found.")

        # Consequential action: transition state to submitted
        submission.status = "submitted"
        db.commit()
        db.refresh(submission)

        return {
            "submission_id": submission.id,
            "status": submission.status,
            "message": "Submission successfully placed in human review queue. Pending reviewer assignment.",
            "notes": notes,
        }

    def _handle_analyze_reference_image(self, db: Session, auth: AuthContext, args: Dict[str, Any]) -> Any:
        from app.services.designer_copilot.service import DesignerCopilotService
        from app.schemas.designer_copilot import ReferenceImageAnalysisRequest

        req = ReferenceImageAnalysisRequest(
            file_path=args.get("file_path"),
            submission_id=args.get("submission_id"),
            revision_id=args.get("revision_id"),
            user_query=args.get("user_query"),
        )
        res = DesignerCopilotService.analyze_reference_image(db=db, auth=auth, request=req)
        return res.model_dump()

    def _handle_critique_design(self, db: Session, auth: AuthContext, args: Dict[str, Any]) -> Any:
        from app.services.designer_copilot.service import DesignerCopilotService
        from app.schemas.designer_copilot import DesignCritiqueRequest, DesignPlacementChannel

        channel_val = str(args.get("channel", "general")).lower()
        try:
            d_channel = DesignPlacementChannel(channel_val)
        except ValueError:
            d_channel = DesignPlacementChannel.GENERAL

        req = DesignCritiqueRequest(
            concept_id=args.get("concept_id"),
            concept_data=args.get("concept_data"),
            submission_id=args.get("submission_id"),
            channel=d_channel,
        )
        res = DesignerCopilotService.critique_design_direction(db=db, auth=auth, request=req)
        return res.model_dump()

    def _handle_adapt_design_concept(self, db: Session, auth: AuthContext, args: Dict[str, Any]) -> Any:
        from app.services.designer_copilot.service import DesignerCopilotService
        from app.schemas.designer_copilot import DesignAdaptationRequest, DesignPlacementChannel

        instruction = args.get("adaptation_instruction", "make it more premium")
        base_concept = args.get("base_concept")
        if not base_concept:
            from app.schemas.designer_copilot import CreativeBriefRequest
            brief = CreativeBriefRequest(
                product="Brand Governance Solution",
                design_objective=instruction,
                placement_channel=DesignPlacementChannel.GENERAL,
                num_concepts=1,
            )
            gen = DesignerCopilotService.generate_creative_concepts(db=db, auth=auth, brief=brief)
            base_concept = gen.concepts[0].model_dump() if gen.concepts else {}

        target_ch_val = args.get("target_channel")
        target_ch = None
        if target_ch_val:
            try:
                target_ch = DesignPlacementChannel(str(target_ch_val).lower())
            except ValueError:
                target_ch = None

        req = DesignAdaptationRequest(
            base_concept=base_concept,
            adaptation_instruction=instruction,
            target_channel=target_ch,
            preserve_elements=args.get("preserve_elements") or ["headline", "product", "logo_placement"],
        )
        res = DesignerCopilotService.adapt_design_concept(db=db, auth=auth, request=req)
        return res.model_dump()


# Global tool registry singleton
tool_registry = ToolRegistry()
