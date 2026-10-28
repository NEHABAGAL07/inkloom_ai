"""
Pydantic Schemas for Shared Intelligence Engine & Copilot Orchestration
Supports intent analysis, dynamic tool execution, conversational continuity,
typed structured outputs, observability metadata, and user feedback.
"""
from typing import List, Optional, Dict, Any
from enum import Enum
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field
from app.schemas.chat import CitationItem


class CopilotType(str, Enum):
    BRAND_ASSISTANT = "brand_assistant"
    MARKETING_COPILOT = "marketing_copilot"
    DESIGNER_COPILOT = "designer_copilot"
    LEGAL_COPILOT = "legal_copilot"
    GENERAL = "general"


class TaskType(str, Enum):
    BRAND_INQUIRY = "brand_inquiry"
    CREATIVE_GENERATION = "creative_generation"
    CREATIVE_REVISION = "creative_revision"
    DESIGN_DIRECTION = "design_direction"
    DESIGN_CRITIQUE = "design_critique"
    COMPLIANCE_REVIEW = "compliance_review"
    AUDIT_EXECUTION = "audit_execution"
    WORKFLOW_ACTION = "workflow_action"
    GENERAL_GUIDANCE = "general_guidance"


class IntentAnalysis(BaseModel):
    """Semantic and deterministic decomposition of user goal and requirements."""
    goal: str = Field(..., description="Primary user goal")
    task_type: TaskType = Field(default=TaskType.GENERAL_GUIDANCE, description="Categorized task type")
    deliverable_requested: str = Field(default="direct_answer", description="Requested artifact or deliverable")
    campaign_id: Optional[str] = None
    submission_id: Optional[str] = None
    revision_id: Optional[str] = None
    identified_tools: List[str] = Field(default_factory=list, description="Candidate tools needed for this task")
    constraints: List[str] = Field(default_factory=list, description="Target constraints and preferences")
    preferences: Dict[str, Any] = Field(default_factory=dict, description="Channel, tone, audience preferences")
    missing_information: List[str] = Field(default_factory=list, description="Missing details that affect correctness")
    needs_clarification: bool = Field(default=False, description="Whether clarification is required before proceeding")
    clarification_prompt: Optional[str] = Field(None, description="Concise question to ask user if clarification is needed")
    assumptions: List[str] = Field(default_factory=list, description="Reasonable low-risk assumptions made to proceed")


class ToolParameterSchema(BaseModel):
    name: str
    type: str
    description: str
    required: bool = True
    default: Optional[Any] = None


class ToolDefinition(BaseModel):
    name: str
    description: str
    parameters: List[ToolParameterSchema]
    authorized_roles: List[str]
    authorized_copilots: List[CopilotType]
    is_consequential: bool = False  # If True, requires explicit confirmation


class ToolCall(BaseModel):
    call_id: str
    tool_name: str
    arguments: Dict[str, Any]


class ToolResult(BaseModel):
    call_id: str
    tool_name: str
    success: bool
    data: Optional[Any] = None
    error: Optional[str] = None
    execution_time_ms: float = 0.0


class TaskState(BaseModel):
    """Preserves conversational task continuity across follow-up turns."""
    current_objective: str
    active_campaign_id: Optional[str] = None
    active_submission_id: Optional[str] = None
    active_revision_id: Optional[str] = None
    active_concept_or_draft: Optional[Dict[str, Any]] = None
    approved_constraints: List[str] = Field(default_factory=list)
    previous_tool_results: List[Dict[str, Any]] = Field(default_factory=list)
    recent_revisions: List[str] = Field(default_factory=list)
    unresolved_questions: List[str] = Field(default_factory=list)


class CopilotRequest(BaseModel):
    copilot_type: CopilotType = Field(default=CopilotType.BRAND_ASSISTANT)
    message: str = Field(..., min_length=1, max_length=4000, description="User instruction or follow-up")
    session_id: Optional[str] = Field(None, description="Chat session ID for conversation continuity")
    campaign_id: Optional[str] = None
    submission_id: Optional[str] = None
    revision_id: Optional[str] = None
    channel: Optional[str] = None
    jurisdiction: Optional[str] = None
    user_preferences: Optional[Dict[str, Any]] = None
    force_tool: Optional[str] = None
    confirmed_action: Optional[str] = None  # Confirms a pending consequential action


class CopilotResponse(BaseModel):
    session_id: str
    message_id: str
    copilot_type: CopilotType
    task_type: TaskType
    content: str
    structured_deliverable: Optional[Dict[str, Any]] = None
    citations: List[CitationItem] = Field(default_factory=list)
    tools_executed: List[ToolResult] = Field(default_factory=list)
    pending_confirmation: Optional[Dict[str, Any]] = None
    clarification_needed: bool = False
    confidence: str = "medium"  # high, medium, low, not_found
    mode: str = "tool_orchestrated"  # tool_orchestrated, dynamic_llm, deterministic_grounded, fallback
    assumptions: List[str] = Field(default_factory=list)
    task_state: Optional[TaskState] = None
    observability: Dict[str, Any] = Field(default_factory=dict)


class FeedbackRatingCategory(str, Enum):
    SOLVED_TASK = "solved_task"
    GENERIC_OR_IRRELEVANT = "generic_or_irrelevant"
    MISSED_CONTEXT = "missed_context"
    UNSUPPORTED_CLAIM = "unsupported_claim"
    SUGGESTION_NEEDS_IMPROVEMENT = "suggestion_needs_improvement"
    TOOL_FAILED = "tool_failed"


class CopilotFeedbackCreate(BaseModel):
    session_id: str
    message_id: str
    helpful: bool
    rating_category: Optional[FeedbackRatingCategory] = None
    comment: Optional[str] = Field(None, max_length=1000)


class CopilotFeedbackResponse(BaseModel):
    id: str
    organization_id: str
    user_id: str
    session_id: str
    message_id: str
    helpful: bool
    rating_category: Optional[str] = None
    comment: Optional[str] = None
    created_at: datetime
