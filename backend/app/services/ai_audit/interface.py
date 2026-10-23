"""Inkloom AI - Shared Types, Data Models, and Interface Contracts for AI Audit Engine."""

from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class EvidenceStatusEnum(str, Enum):
    """Categorization of claim verification status relative to evidence."""
    SUPPORTED = "supported"
    CONTRADICTED = "contradicted"
    UNVERIFIED = "unverified"
    UNAVAILABLE = "unavailable"


class AdvisoryOutcomeEnum(str, Enum):
    """Advisory compliance outcome without replacing human publication approval."""
    NEEDS_CHANGES = "needs_changes"
    HUMAN_REVIEW_REQUIRED = "human_review_required"
    NO_BLOCKING_FINDINGS = "no_blocking_findings"


@dataclass
class BrandVoiceDimension:
    """Configured brand voice dimension."""
    dimension_key: str
    name: str
    target_value: float = 0.0  # -1.0 to +1.0 scale
    description: str = ""
    tolerance: float = 0.3


@dataclass
class VerifiedFact:
    """Authoritative empirical fact or claim registered by legal/brand teams."""
    fact_id: str
    organization_id: str
    claim_category: str  # e.g., 'metric', 'certification', 'pricing', 'timeline', 'superlative'
    statement: str
    approved_value: Optional[str] = None
    source_reference: Optional[str] = None
    evidence_url: Optional[str] = None
    version: str = "1.0"
    is_active: bool = True
    context_tags: List[str] = field(default_factory=list)


@dataclass
class LearnedPreference:
    """Human-confirmed brand preference with full audit trail."""
    preference_id: str
    organization_id: str
    rule_key: str
    preference_type: str  # e.g., 'terminology_exception', 'preferred_tone', 'custom_exclusion'
    pattern: str
    replacement: Optional[str] = None
    approved_by: str = "admin"
    approved_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    is_active: bool = True
    reason: str = ""


class ContentContext(BaseModel):
    """Execution context accompanying content under brand audit."""
    content_id: str
    revision_id: Optional[str] = None
    revision_num: int = 1
    organization_id: str = "org-default"
    workspace_id: Optional[str] = None
    content_type: str = "text"
    campaign_name: Optional[str] = None
    target_audience: Optional[str] = None  # e.g. "enterprise", "consumer", "developer"
    channel: Optional[str] = None  # e.g. "press_release", "social_media", "landing_page", "email"
    raw_text: Optional[str] = None
    previous_revision_text: Optional[str] = None
    media_metadata: Optional[Dict[str, Any]] = None


@dataclass
class RevisionDiff:
    """Comparison metrics between current revision and previous revision."""
    resolved_count: int = 0
    persistent_count: int = 0
    new_findings_count: int = 0
    resolved_titles: List[str] = field(default_factory=list)
    persistent_titles: List[str] = field(default_factory=list)
    new_titles: List[str] = field(default_factory=list)
