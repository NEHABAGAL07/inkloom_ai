"""
Loomi AI Chatbot Schemas
Context-aware schemas for conversation history, brand tokens, canvas state, and responses.
"""
from datetime import datetime, timezone
from typing import List, Literal, Optional, Union
from pydantic import BaseModel, Field


class LoomiBrandTokens(BaseModel):
    """Active brand design tokens."""
    primaryWordmark: Optional[str] = Field(default="Acme Cloud", description="Brand primary wordmark or name")
    colors: Optional[List[str]] = Field(
        default_factory=lambda: ["#0F172A", "#6366F1", "#10B981", "#FFFFFF"],
        description="Brand approved hex color palette",
    )
    typography: Optional[List[str]] = Field(
        default_factory=lambda: ["Outfit", "Inter"],
        description="Approved typography font families",
    )


class LoomiContext(BaseModel):
    """Contextual metadata capturing the active workspace and canvas state."""
    workspace: Optional[str] = Field(default="Acme Cloud Systems", description="Active workspace/brand name")
    activeAsset: Optional[str] = Field(default="summer-campaign-banner.png", description="Active canvas filename or title")
    concept: Optional[str] = Field(default="Enterprise High-Contrast Modern", description="Active creative direction concept")
    channel: Optional[str] = Field(default="linkedin (1.91:1)", description="Target marketing channel and aspect ratio")
    brandTokens: Optional[LoomiBrandTokens] = Field(default_factory=LoomiBrandTokens, description="Brand design tokens")


class LoomiChatMessage(BaseModel):
    """Single message in the conversation history."""
    id: Optional[str] = Field(default=None, description="Unique client or server message id")
    role: Literal["user", "assistant", "system"] = Field(..., description="Message author role")
    content: str = Field(..., description="Message text content")
    timestamp: Optional[Union[datetime, str]] = Field(default=None, description="ISO timestamp or date")


class LoomiChatRequest(BaseModel):
    """Inbound request payload containing conversation history and contextual state."""
    messages: List[LoomiChatMessage] = Field(..., min_length=1, description="Sequential conversation history")
    context: Optional[LoomiContext] = Field(default_factory=LoomiContext, description="Active brand and canvas state")


class LoomiChatResponse(BaseModel):
    """Outbound assistant response payload."""
    id: str = Field(..., description="Unique response message ID")
    role: Literal["assistant"] = Field(default="assistant", description="Assistant role indicator")
    content: str = Field(..., description="Markdown-formatted response text with tables/lists")
    timestamp: str = Field(..., description="ISO timestamp")
    model: Optional[str] = Field(default=None, description="Active LLM model name")
    mode: Optional[str] = Field(default=None, description="Execution mode: llm or offline")

