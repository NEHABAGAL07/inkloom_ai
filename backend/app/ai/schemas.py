"""
Core AI Schemas for Inkloom AI
Provider-agnostic request and response structures with typed token usage tracking.
"""
from typing import Any, Dict, List, Literal, Optional, Type, Union
from pydantic import BaseModel, ConfigDict, Field, field_validator
import os
import base64
import mimetypes


class AIImageItem(BaseModel):
    """Base64 encoded image data for visual multimodal inspection."""
    data_base64: str = Field(..., description="Base64 encoded image bytes")
    mime_type: str = Field(default="image/png", description="Image MIME type (e.g. image/png, image/jpeg)")


class AIRequest(BaseModel):
    """
    Normalized, provider-agnostic request container.
    Guarantees consistent invocation parameters across all models and offline paths.
    """
    task: str = Field(default="general", description="Task identifier (e.g. grounded_answer, explain_violation, rewrite)")
    system: str = Field(default="", description="Guiding system instruction or persona definition")
    user: str = Field(default="", description="Sanitized, prompt-injected protected user payload")
    images: List[AIImageItem] = Field(default_factory=list, description="Optional images for multimodal inspection")
    json_schema: Optional[Type[BaseModel]] = Field(default=None, description="Optional Pydantic schema for structured output validation")
    max_tokens: int = Field(default=1000, ge=1, le=8192, description="Upper bound on response tokens")
    temperature: float = Field(default=0.2, ge=0.0, le=2.0, description="Sampling temperature")
    extra_context: Dict[str, Any] = Field(default_factory=dict, description="Task-specific auxiliary parameters")

    @field_validator("images", mode="before")
    @classmethod
    def normalize_images(cls, v: Any) -> List[AIImageItem]:
        if not v:
            return []
        items = []
        for item in v:
            if isinstance(item, AIImageItem):
                items.append(item)
            elif isinstance(item, dict):
                items.append(AIImageItem(**item))
            elif isinstance(item, str):
                if os.path.exists(item) and os.path.isfile(item):
                    mime, _ = mimetypes.guess_type(item)
                    mime = mime or "image/png"
                    with open(item, "rb") as f:
                        b64 = base64.b64encode(f.read()).decode("utf-8")
                    items.append(AIImageItem(data_base64=b64, mime_type=mime))
                elif item.startswith("data:") or len(item) > 100:
                    raw_b64 = item
                    mime = "image/png"
                    if "base64," in raw_b64:
                        parts = raw_b64.split("base64,", 1)
                        header = parts[0]
                        raw_b64 = parts[1]
                        if "image/" in header:
                            mime = header.split(":")[1].split(";")[0]
                    items.append(AIImageItem(data_base64=raw_b64, mime_type=mime))
        return items

    model_config = ConfigDict(arbitrary_types_allowed=True)


class AIUsageInfo(BaseModel):
    """Token and latency execution metrics."""
    prompt_tokens: int = Field(default=0, ge=0)
    completion_tokens: int = Field(default=0, ge=0)
    total_tokens: int = Field(default=0, ge=0)
    latency_ms: float = Field(default=0.0, ge=0.0)


class AIResponse(BaseModel):
    """
    Normalized AI response container.
    Guarantees consistent output shape whether completed by an online LLM or offline fallback.
    """
    text: str = Field(default="", description="Raw or extracted textual completion")
    data: Optional[Any] = Field(default=None, description="Validated structured payload matching json_schema if provided")
    mode: Literal["llm", "offline"] = Field(..., description="Execution mode: 'llm' for cloud provider, 'offline' for deterministic rule")
    provider: str = Field(..., description="Active provider identifier (e.g. 'gemini', 'offline')")
    model: str = Field(..., description="Model name or 'deterministic_engine'")
    usage: AIUsageInfo = Field(default_factory=AIUsageInfo, description="Execution telemetry")
