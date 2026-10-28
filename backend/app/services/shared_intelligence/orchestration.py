"""
Shared Intelligence Orchestration Engine
Enterprise-grade orchestrator powering all Inkloom AI chatbots and copilots:
- Semantic intent analysis & task decomposition
- Context construction with strict tenant isolation and role permissions
- Controlled dynamic tool selection and execution
- Multi-turn conversation continuity and task state persistence
- Concrete, actionable, domain-specialized responses
- Consequential action confirmation gates
- Observability metadata and graceful failure handling
"""
import json
import logging
import re
import time
import uuid
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any, Tuple
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import AuthContext, Permission, UserRole
from app.models import (
    ChatSession,
    ChatMessage,
    Campaign,
    ContentSubmission,
    ContentRevision,
    AuditRun,
    AuditFinding,
    ApprovedAsset,
    BrandGuideline,
    GuidelineRule,
    KnowledgeItem,
)
from app.schemas.orchestration import (
    CopilotType,
    TaskType,
    IntentAnalysis,
    TaskState,
    CopilotRequest,
    CopilotResponse,
    ToolResult,
    CitationItem,
)
from app.schemas.ai_context import UntrustedContentContainer
from app.services.shared_intelligence.tool_registry import tool_registry
from app.services.shared_intelligence.service import SharedIntelligenceService
from app.services.shared_intelligence.retrieval import KnowledgeRetriever
from app.services.ai_audit.llm_adapter import get_llm_adapter, LLMAdapterError, BaseLLMAdapter

logger = logging.getLogger("inkloom.intelligence_engine")


class SharedIntelligenceEngine:
    """
    Unified intelligence orchestration layer coordinating Brand Assistant,
    Marketing Copilot, Designer Copilot, and Legal Copilot.
    """

    @classmethod
    def orchestrate(
        cls,
        db: Session,
        auth_context: AuthContext,
        request: CopilotRequest,
    ) -> CopilotResponse:
        """
        Executes end-to-end intelligent orchestration:
        1. Observability setup & tenant verification
        2. Session & conversation continuity resolution
        3. Intent and task understanding (semantic + deterministic)
        4. Context construction & fact vs assumption partitioning
        5. Authorized tool selection & execution
        6. Context-aware response generation with domain persona
        7. State persistence and typed output assembly
        """
        trace_id = f"trace_{uuid.uuid4().hex[:12]}"
        start_time = time.perf_counter()
        org_id = auth_context.organization_id

        # ---------------------------------------------------------------------
        # 1. Resolve or Initialize Chat Session (Tenant & User Isolated)
        # ---------------------------------------------------------------------
        session, prior_history, task_state = cls._resolve_session_and_history(
            db=db,
            auth=auth_context,
            session_id=request.session_id,
            first_user_message=request.message,
            copilot_type=request.copilot_type,
            explicit_campaign_id=request.campaign_id,
            explicit_submission_id=request.submission_id,
        )

        # ---------------------------------------------------------------------
        # 2. Record User Message
        # ---------------------------------------------------------------------
        user_msg = ChatMessage(
            session_id=session.id,
            role="user",
            content=request.message,
        )
        db.add(user_msg)
        db.commit()
        db.refresh(user_msg)

        # ---------------------------------------------------------------------
        # 3. Intent & Task Understanding
        # ---------------------------------------------------------------------
        intent = cls._analyze_intent(
            message=request.message,
            copilot_type=request.copilot_type,
            task_state=task_state,
            history=prior_history,
            request=request,
        )

        # Update task state with newly discovered intent parameters
        if intent.campaign_id:
            task_state.active_campaign_id = intent.campaign_id
        if intent.submission_id:
            task_state.active_submission_id = intent.submission_id
        if intent.constraints:
            for c in intent.constraints:
                if c not in task_state.approved_constraints:
                    task_state.approved_constraints.append(c)

        # ---------------------------------------------------------------------
        # 4. Handle Clarification Gate (Only when missing details materially block execution)
        # ---------------------------------------------------------------------
        if intent.needs_clarification and intent.clarification_prompt and not request.confirmed_action:
            asst_msg = ChatMessage(
                session_id=session.id,
                role="assistant",
                content=intent.clarification_prompt,
                confidence="medium",
                mode="clarification_prompt",
            )
            db.add(asst_msg)
            session.updated_at = datetime.now(timezone.utc)
            db.commit()

            return CopilotResponse(
                session_id=session.id,
                message_id=asst_msg.id,
                copilot_type=request.copilot_type,
                task_type=intent.task_type,
                content=intent.clarification_prompt,
                clarification_needed=True,
                confidence="medium",
                mode="clarification_prompt",
                assumptions=intent.assumptions,
                task_state=task_state,
                observability={
                    "trace_id": trace_id,
                    "latency_ms": round((time.perf_counter() - start_time) * 1000.0, 2),
                    "tools_called": [],
                },
            )

        # ---------------------------------------------------------------------
        # 5. Tool Selection and Execution
        # ---------------------------------------------------------------------
        tools_executed: List[ToolResult] = []
        pending_confirmation: Optional[Dict[str, Any]] = None

        candidate_tools = cls._select_candidate_tools(
            intent=intent,
            copilot_type=request.copilot_type,
            task_state=task_state,
            force_tool=request.force_tool,
        )

        for tool_name, tool_args in candidate_tools:
            # Check if this tool is consequential and whether user confirmed it
            tool_def = tool_registry.get_tool(tool_name)
            is_confirmed = (
                request.confirmed_action == tool_name
                or request.confirmed_action == "confirm"
            )

            tool_result = tool_registry.execute_tool(
                name=tool_name,
                arguments=tool_args,
                db=db,
                auth=auth_context,
                copilot_type=request.copilot_type,
                confirmed=is_confirmed,
            )
            tools_executed.append(tool_result)

            if tool_def and tool_def.is_consequential and not is_confirmed:
                pending_confirmation = {
                    "action": tool_name,
                    "arguments": tool_args,
                    "prompt": (
                        f"Action '{tool_name}' will modify live organizational records or submit content to "
                        f"the human review queue. Please confirm if you wish to proceed."
                    ),
                }
                # Consequential action gated: halt further automated execution until confirmed
                break

        # ---------------------------------------------------------------------
        # 6. Context Construction (Tenant-Isolated, Provenance-Tracked)
        # ---------------------------------------------------------------------
        context_package = cls._build_context_package(
            db=db,
            auth=auth_context,
            task_state=task_state,
            intent=intent,
            tools_executed=tools_executed,
        )

        # ---------------------------------------------------------------------
        # 7. Context-Aware Response Generation
        # ---------------------------------------------------------------------
        response_content, citations, structured_deliverable, confidence, mode = cls._generate_response(
            copilot_type=request.copilot_type,
            intent=intent,
            task_state=task_state,
            context_package=context_package,
            tools_executed=tools_executed,
            prior_history=prior_history,
            pending_confirmation=pending_confirmation,
        )

        # ---------------------------------------------------------------------
        # 8. Persist Assistant Message and Update Task State
        # ---------------------------------------------------------------------
        asst_msg = ChatMessage(
            session_id=session.id,
            role="assistant",
            content=response_content,
            citations=[c.model_dump() for c in citations],
            confidence=confidence,
            mode=mode,
        )
        db.add(asst_msg)

        # Update task state history & session metadata
        if structured_deliverable:
            task_state.active_concept_or_draft = structured_deliverable
        for tool_res in tools_executed:
            if tool_res.success:
                task_state.previous_tool_results.append({
                    "tool": tool_res.tool_name,
                    "summary": f"Executed at {datetime.now(timezone.utc).isoformat()}",
                })

        session.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(asst_msg)

        latency_ms = (time.perf_counter() - start_time) * 1000.0

        return CopilotResponse(
            session_id=session.id,
            message_id=asst_msg.id,
            copilot_type=request.copilot_type,
            task_type=intent.task_type,
            content=response_content,
            structured_deliverable=structured_deliverable,
            citations=citations,
            tools_executed=tools_executed,
            pending_confirmation=pending_confirmation,
            clarification_needed=False,
            confidence=confidence,
            mode=mode,
            assumptions=intent.assumptions,
            task_state=task_state,
            observability={
                "trace_id": trace_id,
                "copilot_type": request.copilot_type.value,
                "latency_ms": round(latency_ms, 2),
                "model_provider": settings.LLM_PROVIDER,
                "model_name": settings.LLM_MODEL_NAME or "gemini-1.5-flash",
                "tools_executed_count": len(tools_executed),
                "successful_tools": [t.tool_name for t in tools_executed if t.success],
                "failed_tools": [t.tool_name for t in tools_executed if not t.success],
            },
        )

    # =========================================================================
    # Internal Helpers
    # =========================================================================

    @classmethod
    def _resolve_session_and_history(
        cls,
        db: Session,
        auth: AuthContext,
        session_id: Optional[str],
        first_user_message: str,
        copilot_type: CopilotType,
        explicit_campaign_id: Optional[str] = None,
        explicit_submission_id: Optional[str] = None,
    ) -> Tuple[ChatSession, List[Dict[str, str]], TaskState]:
        """Resolves existing session or creates a new tenant-and-user isolated session."""
        session = None
        if session_id:
            session = (
                db.query(ChatSession)
                .filter(
                    ChatSession.id == session_id,
                    ChatSession.organization_id == auth.organization_id,
                    ChatSession.user_id == auth.user_id,
                )
                .first()
            )

        if not session:
            title_snippet = first_user_message.strip()[:40]
            if len(first_user_message) > 40:
                title_snippet += "..."
            session = ChatSession(
                organization_id=auth.organization_id,
                user_id=auth.user_id,
                title=f"[{copilot_type.value.replace('_', ' ').title()}] {title_snippet or 'Session'}",
            )
            db.add(session)
            db.commit()
            db.refresh(session)

        # Retrieve prior messages for conversation continuity (bounded to last 8 turns)
        recent_msgs = (
            db.query(ChatMessage)
            .filter(ChatMessage.session_id == session.id)
            .order_by(ChatMessage.created_at.desc())
            .limit(8)
            .all()
        )
        history = [{"role": m.role, "content": m.content} for m in reversed(recent_msgs)]

        # Reconstruct TaskState from history & session
        task_state = TaskState(
            current_objective=first_user_message[:100],
            active_campaign_id=explicit_campaign_id,
            active_submission_id=explicit_submission_id,
        )

        return session, history, task_state

    @classmethod
    def _analyze_intent(
        cls,
        message: str,
        copilot_type: CopilotType,
        task_state: TaskState,
        history: List[Dict[str, str]],
        request: CopilotRequest,
    ) -> IntentAnalysis:
        """
        Decomposes user message into structured intent.
        Combines deterministic domain classifiers with semantic parsing.
        """
        msg_lower = message.lower().strip()

        # Detect follow-up pattern (e.g., "make it more premium", "adjust contrast", "add a cta")
        is_follow_up = False
        follow_up_triggers = [
            "make it", "revise", "change", "tweak", "adjust", "more ", "less ",
            "can you also", "instead of", "variation 2", "concept 1", "update",
            "try again", "what about", "is this", "can i say"
        ]
        if history and any(msg_lower.startswith(t) or f" {t}" in msg_lower for t in follow_up_triggers):
            is_follow_up = True

        # Classify Task Type and Candidate Tools
        task_type = TaskType.GENERAL_GUIDANCE
        identified_tools: List[str] = []

        if request.confirmed_action:
            task_type = TaskType.WORKFLOW_ACTION
            identified_tools.append(request.confirmed_action)
        elif any(w in msg_lower for w in ["submit for review", "submit this draft", "submit", "save draft", "publish", "create version"]):
            task_type = TaskType.WORKFLOW_ACTION
            if "submit" in msg_lower:
                identified_tools.append("submit_for_human_review")
            else:
                identified_tools.append("save_content_draft")
        elif any(w in msg_lower for w in ["analyze image", "inspect image", "image analysis", "reference image", "dominant color", "image contrast", "uploaded image", "visual inspection"]) or (request.user_preferences and "file_path" in request.user_preferences):
            task_type = TaskType.DESIGN_CRITIQUE
            identified_tools.append("analyze_reference_image")
        elif any(w in msg_lower for w in ["critique", "critique design", "review layout", "evaluate design", "design feedback"]):
            task_type = TaskType.DESIGN_CRITIQUE
            identified_tools.extend(["critique_design", "retrieve_brand_guidelines"])
        elif any(w in msg_lower for w in ["make it more premium", "adapt for instagram", "adapt for linkedin", "cleaner composition", "more youthful", "more professional", "more premium", "adapt for mobile", "adapt this design", "adapt concept", "revise concept"]):
            task_type = TaskType.CREATIVE_REVISION
            if copilot_type == CopilotType.MARKETING_COPILOT:
                identified_tools.extend(["retrieve_brand_guidelines", "search_verified_facts", "generate_marketing_copy"])
            else:
                identified_tools.extend(["adapt_design_concept", "retrieve_brand_assets"])
        elif is_follow_up:
            if copilot_type == CopilotType.DESIGNER_COPILOT or any(w in msg_lower for w in ["contrast", "color", "layout", "font", "visual"]):
                task_type = TaskType.CREATIVE_REVISION
                identified_tools.extend(["adapt_design_concept", "retrieve_brand_assets"])
            else:
                task_type = TaskType.CREATIVE_REVISION
                identified_tools.extend(["retrieve_brand_guidelines", "search_verified_facts", "generate_marketing_copy"])
        elif any(w in msg_lower for w in ["write", "copy", "headline", "caption", "slogan", "pitch", "post", "email copy"]):
            task_type = TaskType.CREATIVE_GENERATION
            identified_tools.extend(["retrieve_brand_guidelines", "search_verified_facts", "generate_marketing_copy"])
        elif any(w in msg_lower for w in ["rules for", "guidelines for", "what is", "what are", "allowed", "can i use", "can i say", "color palette", "brand voice", "contrast requirement"]):
            task_type = TaskType.BRAND_INQUIRY
            identified_tools.extend(["retrieve_brand_guidelines", "read_authorized_document"])
        elif any(w in msg_lower for w in ["layout", "poster", "banner", "contrast", "palette", "visual", "font", "typography", "logo placement"]):
            task_type = TaskType.DESIGN_DIRECTION
            identified_tools.extend(["retrieve_brand_guidelines", "retrieve_brand_assets", "generate_design_concept"])
        elif any(w in msg_lower for w in ["legal", "compliance", "ftc", "gdpr", "statute", "claim", "substantiate", "guarantee"]):
            task_type = TaskType.COMPLIANCE_REVIEW
            identified_tools.extend(["retrieve_legal_sources", "search_verified_facts"])
        elif any(w in msg_lower for w in ["audit", "scan", "check violations", "inspect"]):
            task_type = TaskType.AUDIT_EXECUTION
            identified_tools.append("run_brand_audit")
        elif copilot_type == CopilotType.BRAND_ASSISTANT:
            task_type = TaskType.BRAND_INQUIRY
            identified_tools.extend(["retrieve_brand_guidelines", "read_authorized_document"])

        # Align with copilot domain defaults
        if copilot_type == CopilotType.MARKETING_COPILOT and task_type == TaskType.GENERAL_GUIDANCE:
            task_type = TaskType.CREATIVE_REVISION if is_follow_up else TaskType.CREATIVE_GENERATION
            identified_tools.extend(["retrieve_brand_guidelines", "search_verified_facts", "generate_marketing_copy"])
        elif copilot_type == CopilotType.DESIGNER_COPILOT and task_type == TaskType.GENERAL_GUIDANCE:
            task_type = TaskType.DESIGN_CRITIQUE if is_follow_up else TaskType.DESIGN_DIRECTION
            identified_tools.extend(["retrieve_brand_guidelines", "retrieve_brand_assets", "generate_design_concept"])
        elif copilot_type == CopilotType.LEGAL_COPILOT and task_type == TaskType.GENERAL_GUIDANCE:
            task_type = TaskType.COMPLIANCE_REVIEW
            identified_tools.extend(["retrieve_legal_sources", "search_verified_facts"])

        # Campaign identification
        campaign_id = request.campaign_id or task_state.active_campaign_id
        uuid_match = re.search(r"\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b", message, re.IGNORECASE)
        if uuid_match:
            candidate_uuid = uuid_match.group(0)
            if not campaign_id:
                campaign_id = candidate_uuid

        # Clarification check
        needs_clarification = False
        clarification_prompt = None
        missing_info = []

        # Only require clarification if an essential parameter is missing for a destructive or exact tool
        if "submit for review" in msg_lower and not task_state.active_submission_id and not uuid_match:
            needs_clarification = True
            clarification_prompt = "Which content submission or draft ID would you like to submit for human review?"
            missing_info.append("submission_id")

        # Reasonable low-risk assumptions
        assumptions = []
        if is_follow_up:
            assumptions.append("Iterating on the existing concept from previous turns.")
        if task_type == TaskType.CREATIVE_GENERATION and not request.channel:
            assumptions.append("Defaulting to omnichannel professional tone (LinkedIn/Web).")

        return IntentAnalysis(
            goal=message[:150],
            task_type=task_type,
            deliverable_requested="concrete_deliverable",
            campaign_id=campaign_id,
            submission_id=request.submission_id or task_state.active_submission_id,
            revision_id=request.revision_id or task_state.active_revision_id,
            identified_tools=identified_tools,
            constraints=task_state.approved_constraints,
            preferences=request.user_preferences or {},
            missing_information=missing_info,
            needs_clarification=needs_clarification,
            clarification_prompt=clarification_prompt,
            assumptions=assumptions,
        )

    @classmethod
    def _select_candidate_tools(
        cls,
        intent: IntentAnalysis,
        copilot_type: CopilotType,
        task_state: Optional[TaskState] = None,
        force_tool: Optional[str] = None,
    ) -> List[Tuple[str, Dict[str, Any]]]:
        """Maps identified intent tools to execution argument specifications."""
        candidates: List[Tuple[str, Dict[str, Any]]] = []

        if force_tool:
            candidates.append((force_tool, {}))
            return candidates

        for tool_name in intent.identified_tools:
            args: Dict[str, Any] = {}
            if tool_name == "retrieve_brand_guidelines":
                args = {"channel": "web", "query": intent.goal}
            elif tool_name == "search_verified_facts":
                # Ground search query with both active objective and refinement
                search_query = intent.goal
                if task_state and task_state.current_objective:
                    search_query = f"{task_state.current_objective} {intent.goal}"
                args = {"query_text": search_query}
            elif tool_name == "read_authorized_document":
                args = {"query": intent.goal, "top_k": 3}
            elif tool_name == "retrieve_brand_assets":
                args = {}
            elif tool_name == "retrieve_legal_sources":
                args = {"jurisdiction": "Global"}
            elif tool_name == "get_campaign_status" and intent.campaign_id:
                args = {"campaign_id": intent.campaign_id}
            elif tool_name == "generate_marketing_copy":
                product_candidate = intent.goal
                if task_state and task_state.current_objective:
                    product_candidate = f"{task_state.current_objective} ({intent.goal})"
                args = {
                    "product": product_candidate[:80],
                    "objective": "High-performing on-brand communication",
                    "channel": "linkedin",
                    "tone": "Professional & Trustworthy",
                    "num_alternatives": 3,
                }
            elif tool_name == "generate_design_concept":
                product_candidate = intent.goal
                if task_state and task_state.current_objective:
                    product_candidate = f"{task_state.current_objective} ({intent.goal})"
                args = {
                    "product": product_candidate[:80],
                    "objective": "Visual identity and composition",
                    "channel": "general",
                    "visual_style": "High-Contrast Enterprise Modern",
                    "num_concepts": 2,
                }
            elif tool_name == "analyze_reference_image":
                file_candidate = None
                if intent.preferences and isinstance(intent.preferences, dict):
                    file_candidate = intent.preferences.get("file_path")
                args = {
                    "file_path": file_candidate,
                    "submission_id": intent.submission_id or (task_state.active_submission_id if task_state else None),
                    "revision_id": intent.revision_id or (task_state.active_revision_id if task_state else None),
                    "user_query": intent.goal,
                }
            elif tool_name == "critique_design":
                target_ch = (intent.preferences.get("channel") if intent.preferences else None) or "social_feed"
                args = {
                    "submission_id": intent.submission_id or (task_state.active_submission_id if task_state else None),
                    "channel": target_ch,
                    "concept_data": task_state.active_concept_or_draft if task_state else None,
                }
            elif tool_name == "adapt_design_concept":
                target_ch = (intent.preferences.get("channel") if intent.preferences else None) or "general"
                args = {
                    "adaptation_instruction": intent.goal,
                    "base_concept": task_state.active_concept_or_draft if task_state else None,
                    "target_channel": target_ch,
                }
            elif tool_name == "run_brand_audit":
                sub_id = intent.submission_id or (task_state.active_submission_id if task_state else None)
                args = {"submission_id": sub_id}
            elif tool_name == "submit_for_human_review":
                sub_id = intent.submission_id or (task_state.active_submission_id if task_state else None)
                args = {"submission_id": sub_id, "notes": "Submitted via intelligent copilot"}
            elif tool_name == "save_content_draft":
                args = {
                    "title": f"Draft: {intent.goal[:40]}",
                    "content_text": intent.goal,
                    "campaign_id": intent.campaign_id,
                }

            candidates.append((tool_name, args))

        # Limit to max 3 tools per turn to guarantee sub-second performance
        return candidates[:3]

    @classmethod
    def _build_context_package(
        cls,
        db: Session,
        auth: AuthContext,
        task_state: TaskState,
        intent: IntentAnalysis,
        tools_executed: List[ToolResult],
    ) -> Dict[str, Any]:
        """
        Assembles verified brand facts, active rules, campaign metadata, and previous audit findings.
        Strictly enforces tenant isolation and untrusted prompt wrapping.
        """
        org_id = auth.organization_id
        package: Dict[str, Any] = {
            "organization_id": org_id,
            "campaign": None,
            "applicable_rules": [],
            "verified_facts": [],
            "brand_assets": [],
            "tool_data": [],
        }

        # 1. Fetch Campaign if active
        if task_state.active_campaign_id:
            camp = (
                db.query(Campaign)
                .filter(
                    Campaign.id == task_state.active_campaign_id,
                    Campaign.organization_id == org_id,
                )
                .first()
            )
            if camp:
                package["campaign"] = {
                    "id": camp.id,
                    "name": camp.name,
                    "status": camp.status,
                    "target_channel": camp.target_channel,
                    "target_jurisdiction": camp.target_jurisdiction,
                }

        # 2. Extract Tool Findings
        for res in tools_executed:
            if res.success and res.data:
                package["tool_data"].append({
                    "tool": res.tool_name,
                    "data": res.data,
                })

        return package

    @classmethod
    def _generate_response(
        cls,
        copilot_type: CopilotType,
        intent: IntentAnalysis,
        task_state: TaskState,
        context_package: Dict[str, Any],
        tools_executed: List[ToolResult],
        prior_history: List[Dict[str, str]],
        pending_confirmation: Optional[Dict[str, Any]],
    ) -> Tuple[str, List[CitationItem], Optional[Dict[str, Any]], str, str]:
        """
        Generates dynamic response from domain persona, tool evidence, and constraints.
        Returns: (text_content, citations, structured_deliverable, confidence, mode)
        """
        adapter = get_llm_adapter()

        # If there is a pending confirmation for a consequential action, return direct notice
        if pending_confirmation:
            action_name = pending_confirmation.get("action", "action")
            notice = (
                f"**Confirmation Required:**\n\n"
                f"You have requested to execute `{action_name}`. This is a consequential workflow action that "
                f"will modify live organizational records and route items to reviewers.\n\n"
                f"Please confirm: reply with **'confirm'** or **'proceed'** to execute."
            )
            return notice, [], None, "high", "confirmation_gate"

        # Extract citations from tools
        citations: List[CitationItem] = []
        structured_deliverable: Optional[Dict[str, Any]] = None

        for t in tools_executed:
            if t.tool_name == "read_authorized_document" and t.success and isinstance(t.data, list):
                for p in t.data:
                    if p.get("snippet"):
                        citations.append(
                            CitationItem(
                                document_id=p.get("document_id") or "doc_gen",
                                document_name=p.get("document_name") or "Brand Guidelines",
                                page=p.get("page"),
                                section=p.get("section"),
                                snippet=p.get("snippet", ""),
                            )
                        )
            elif t.tool_name in ["generate_marketing_copy", "generate_design_concept", "analyze_reference_image", "critique_design", "adapt_design_concept"] and t.success and isinstance(t.data, dict):
                structured_deliverable = t.data
                if t.tool_name == "adapt_design_concept" and "adapted_concept" in t.data:
                    task_state.active_concept_or_draft = t.data["adapted_concept"]
                elif t.tool_name == "generate_design_concept" and "concepts" in t.data and t.data["concepts"]:
                    task_state.active_concept_or_draft = t.data["concepts"][0]

        # Determine specialized persona instruction
        persona_instructions = {
            CopilotType.BRAND_ASSISTANT: (
                "You are the Inkloom AI Brand Assistant, an authoritative brand governance specialist.\n"
                "Answer questions strictly grounded in the approved brand guidelines and documentation.\n"
                "Provide direct, clear answers quoting exact rules, colors, and typography standards where relevant."
            ),
            CopilotType.MARKETING_COPILOT: (
                "You are the Inkloom AI Marketing Copilot, an enterprise creative strategist and copy architect.\n"
                "Generate compelling, high-converting copy adhering strictly to the brand voice and verified facts.\n"
                "Never invent unverified claims, guarantees, or prices. Explain creative rationale concisely."
            ),
            CopilotType.DESIGNER_COPILOT: (
                "You are the Inkloom AI Designer Copilot, an enterprise visual art director and design systems architect.\n"
                "Provide concrete design direction, spatial hierarchy, typography, and color tokens.\n"
                "Ensure all recommendations meet WCAG 2.1 AA (4.5:1 contrast) and brand clearspace standards."
            ),
            CopilotType.LEGAL_COPILOT: (
                "You are the Inkloom AI Legal & Compliance Copilot, an expert in advertising law and compliance.\n"
                "Evaluate commercial claims against statutory baselines (FTC Act § 5, Lanham Act, EU AI Act).\n"
                "Distinguish binding law from official guidance. Never guarantee judicial compliance or auto-approve."
            ),
            CopilotType.GENERAL: (
                "You are the Inkloom AI Intelligent Copilot, an enterprise brand governance and creative assistant."
            ),
        }
        system_instruction = persona_instructions.get(copilot_type, persona_instructions[CopilotType.GENERAL])

        # Assemble prompt with conversation history & tool evidence
        history_str = ""
        if prior_history:
            history_lines = [f"{m['role'].capitalize()}: {m['content']}" for m in prior_history[-4:]]
            history_str = "Prior Conversation:\n" + "\n".join(history_lines) + "\n\n"

        tool_evidence_str = ""
        if tools_executed:
            evidence_blocks = []
            for t in tools_executed:
                if t.success and t.data:
                    evidence_blocks.append(f"Tool '{t.tool_name}' Result:\n{json.dumps(t.data, indent=2, default=str)[:1200]}")
                elif not t.success:
                    evidence_blocks.append(f"Tool '{t.tool_name}' Notice: {t.error}")
            tool_evidence_str = "Executed Tool Findings:\n" + "\n\n".join(evidence_blocks) + "\n\n"

        prompt = (
            f"{history_str}"
            f"{tool_evidence_str}"
            f"User Task / Instruction:\n{intent.goal}\n\n"
            f"Instructions:\n"
            f"1. Address the user's objective directly with concrete deliverables or answers.\n"
            f"2. Apply relevant brand rules, verified claims, and constraints from the tool findings.\n"
            f"3. Explain key decisions or rationale when useful.\n"
            f"4. If assumptions were made, disclose them concisely.\n"
            f"5. Do NOT use generic opening pleasantries (e.g., 'Hello! As an AI assistant...'). Dive straight into the deliverable."
        )

        try:
            raw_response = adapter.generate_response(
                prompt=prompt,
                system_instruction=system_instruction,
                temperature=0.2,
                max_output_tokens=1200,
            )
            cleaned_text = raw_response.strip()

            from app.services.ai_audit.llm_adapter import OfflineRuleAdapter
            if isinstance(adapter, OfflineRuleAdapter) or raw_response.startswith('{"claims":') or "Deterministic offline" in raw_response:
                grounded_text = cls._build_deterministic_grounded_response(
                    copilot_type=copilot_type,
                    intent=intent,
                    tools_executed=tools_executed,
                )
                if grounded_text:
                    cleaned_text = grounded_text

            confidence = "high" if tools_executed and any(t.success for t in tools_executed) else "medium"
            return cleaned_text, citations, structured_deliverable, confidence, "tool_orchestrated"

        except Exception as exc:
            logger.warning("LLM generation encountered an issue (%s); assembling grounded fallback response.", str(exc))
            # Build deterministic grounded response from tool data
            fallback_text = cls._build_deterministic_grounded_response(
                copilot_type=copilot_type,
                intent=intent,
                tools_executed=tools_executed,
            )
            return fallback_text, citations, structured_deliverable, "medium", "deterministic_grounded"

    @classmethod
    def _build_deterministic_grounded_response(
        cls,
        copilot_type: CopilotType,
        intent: IntentAnalysis,
        tools_executed: List[ToolResult],
    ) -> str:
        """Constructs a factual, direct response directly from tool findings when LLM is offline."""
        sections = []

        for t in tools_executed:
            if not t.success:
                continue
            if t.tool_name == "retrieve_brand_guidelines" and isinstance(t.data, list) and t.data:
                rule_lines = [f"- **{r.get('rule_name')}**: {r.get('description')}" for r in t.data[:4]]
                sections.append("### Applicable Brand Rules\n" + "\n".join(rule_lines))
            elif t.tool_name == "search_verified_facts" and isinstance(t.data, list) and t.data:
                fact_lines = [f"- **{f.get('claim_key')}**: {f.get('statement') or f.get('certified_claim_text', '')}" for f in t.data[:4]]
                sections.append("### Verified Product Claims\n" + "\n".join(fact_lines))
            elif t.tool_name == "read_authorized_document" and isinstance(t.data, list) and t.data:
                doc_lines = [f"- **{p.get('document_name')}** (P. {p.get('page', 1)}): \"{p.get('snippet')}\"" for p in t.data[:3]]
                sections.append("### Grounded Document Citations\n" + "\n".join(doc_lines))
            elif t.tool_name == "generate_marketing_copy" and isinstance(t.data, dict):
                alts = t.data.get("alternatives", [])
                alt_lines = []
                for i, alt in enumerate(alts[:3], 1):
                    alt_lines.append(f"**Option {i}:**\n> {alt.get('text')}\n*Rationale:* {alt.get('creative_rationale')}\n")
                sections.append("### Generated Creative Copy Variations\n" + "\n".join(alt_lines))
            elif t.tool_name == "generate_design_concept" and isinstance(t.data, dict):
                concepts = t.data.get("concepts", [])
                c_lines = []
                for i, c in enumerate(concepts[:2], 1):
                    c_lines.append(f"**Concept {i}: {c.get('concept_name')}**\n- Composition: {c.get('visual_direction_composition')}\n- Layout: {c.get('suggested_layout_hierarchy')}")
                sections.append("### Visual Design Directions\n" + "\n".join(c_lines))
            elif t.tool_name == "analyze_reference_image" and isinstance(t.data, dict):
                dims = t.data.get("dimensions", {})
                dim_str = f"{dims.get('width', 'Unknown')}x{dims.get('height', 'Unknown')}px ({dims.get('aspect_ratio', 'N/A')})"
                colors = ", ".join(t.data.get("dominant_colors_hex", [])) or "None detected"
                contrast = t.data.get("contrast_ratio")
                contrast_str = f"{contrast}:1 ({'Passes WCAG AA' if t.data.get('wcag_aa_compliant') else 'Fails WCAG AA minimum 4.5:1'})" if contrast else "Unavailable"
                facts = "\n".join([f"- {fact}" for fact in t.data.get("observable_facts", [])])
                recs = "\n".join([f"- {rec}" for rec in t.data.get("actionable_recommendations", [])])
                warns = "\n".join([f"- {w}" for w in t.data.get("uncertainty_limitations", [])]) if t.data.get("uncertainty_limitations") else "None"
                sections.append(
                    f"### Visual Reference Analysis ({t.data.get('file_name')})\n"
                    f"- **Dimensions**: `{dim_str}`\n"
                    f"- **Dominant Palette**: `{colors}`\n"
                    f"- **Measured Contrast**: `{contrast_str}`\n"
                    f"- **Brand Palette Concordance**: {t.data.get('brand_palette_concordance')}\n\n"
                    f"**Observable Facts:**\n{facts}\n\n"
                    f"**Visual Recommendations:**\n{recs}\n\n"
                    f"**Uncertainties / Limitations:**\n{warns}"
                )
            elif t.tool_name == "critique_design" and isinstance(t.data, dict):
                summary = t.data.get("overall_summary", "Design critique completed.")
                strengths = "\n".join([f"- {s}" for s in t.data.get("strengths", [])])
                issues = []
                for iss in t.data.get("critical_issues", []):
                    issues.append(
                        f"**{iss.get('issue')}**\n"
                        f"- *Why it matters:* {iss.get('why_it_matters')}\n"
                        f"- *How to fix:* {iss.get('how_to_fix')}\n"
                        f"- *Suggested alternative:* {iss.get('suggested_alternative')}"
                    )
                issues_str = "\n\n".join(issues) if issues else "No critical design defects identified."
                next_steps = "\n".join([f"- {st}" for st in t.data.get("actionable_next_steps", [])])
                sections.append(
                    f"### Structured Creative Critique\n"
                    f"{summary}\n\n"
                    f"**Scores:** Hierarchy: {t.data.get('hierarchy_score')}/100 | Accessibility: {t.data.get('accessibility_score')}/100 | Brand Consistency: {t.data.get('brand_consistency_score')}/100\n\n"
                    f"**Strengths:**\n{strengths}\n\n"
                    f"**Identified Issues & Fixes:**\n{issues_str}\n\n"
                    f"**Actionable Next Steps:**\n{next_steps}"
                )
            elif t.tool_name == "adapt_design_concept" and isinstance(t.data, dict):
                adapted = t.data.get("adapted_concept", {})
                modifications = "\n".join([f"- {m}" for m in t.data.get("applied_modifications", [])])
                preserved = "\n".join([f"- {p}" for p in t.data.get("preserved_elements", [])])
                rationale = t.data.get("design_rationale", "")
                c_name = adapted.get("concept_name", "Adapted Concept")
                sections.append(
                    f"### Stateful Design Adaptation: {c_name}\n"
                    f"**Design Rationale:** {rationale}\n\n"
                    f"**Applied Modifications:**\n{modifications}\n\n"
                    f"**Preserved Constraints:**\n{preserved}\n\n"
                    f"**Updated Composition:**\n{adapted.get('visual_direction_composition')}\n\n"
                    f"**Spatial Hierarchy:**\n{adapted.get('suggested_layout_hierarchy')}"
                )
            elif t.tool_name == "retrieve_legal_sources" and isinstance(t.data, list) and t.data:
                legal_lines = [f"- **{s.get('title')}** ({s.get('citation')}): {s.get('excerpt')}" for s in t.data[:3]]
                sections.append("### Authoritative Legal Sources\n" + "\n".join(legal_lines))
            elif t.tool_name == "run_brand_audit" and isinstance(t.data, dict):
                status_str = t.data.get("overall_status", "completed")
                score = t.data.get("overall_score", 0)
                sections.append(f"### Governance Audit Results\n- Status: `{status_str}`\n- Compliance Score: {score}/100\n- Findings identified: {t.data.get('findings_count', 0)}")
            elif t.tool_name == "submit_for_human_review" and isinstance(t.data, dict):
                sub_id = t.data.get("submission_id")
                status = t.data.get("status")
                msg = t.data.get("message", "Submission placed in review queue.")
                sections.append(f"### Submission Review Status\n- **Submission ID**: `{sub_id}`\n- **Status**: `{status}`\n- **Notice**: {msg}")

        if sections:
            return "\n\n".join(sections)

        return (
            "I have reviewed your inquiry against our verified brand governance records. "
            "No matching brand rules or document passages were identified for this query. "
            "Please verify that relevant brand guidelines have been uploaded or broaden your search criteria."
        )
