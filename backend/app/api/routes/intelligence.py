"""
Shared Intelligence API Endpoints
Provides unified AI context assembly, permission-aware retrieval,
and conflict detection across statutory, legal, and brand governance rules.
"""
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.core.security import get_current_auth_context, AuthContext, Permission, require_permission
from app.schemas.knowledge import (
    KnowledgeSearchFilter,
    KnowledgeSourceType,
    KnowledgeCategory,
    UnifiedRetrievalResponse,
)
from app.schemas.ai_context import (
    SharedAIContext,
    BrandRuleContext,
    VerifiedFactContext,
    LegalSourceContext,
    BrandAssetContext,
    RuleConflictDetail,
)
from app.services.shared_intelligence import (
    SharedIntelligenceService,
    KnowledgeRetriever,
    ConflictDetector,
)

router = APIRouter(prefix="/intelligence", tags=["Shared Intelligence Foundation"])


class ContextAssemblyRequest(BaseModel):
    content_text: Optional[str] = Field(None, description="Raw draft text for pre-publication governance inspection")
    submission_id: Optional[str] = Field(None, description="Optional ContentSubmission UUID")
    revision_id: Optional[str] = Field(None, description="Optional ContentRevision UUID")
    target_channel: str = Field(default="web", description="Target distribution channel (e.g. social, web, email, packaging)")
    target_jurisdiction: Optional[str] = Field(default="Global", description="Target legal jurisdiction (e.g. US, EU, UK, Global)")
    query_topics: Optional[List[str]] = Field(default_factory=list, description="Specific factual topics or claim phrases to verify")


class ConflictScanRequest(BaseModel):
    draft_data: Optional[Dict[str, Any]] = Field(None, description="Draft brand guidelines payload to scan for statutory conflicts")
    content_text: Optional[str] = Field(None, description="Optional promotional copy to inspect")
    target_jurisdiction: str = Field(default="Global")


class BrandAssetRetrievalRequest(BaseModel):
    asset_type: Optional[str] = Field(None, description="Filter by asset type: logo, color_palette, typography, boilerplate, etc.")
    name_query: Optional[str] = Field(None, description="Case-insensitive title or name search")
    active_only: bool = Field(default=True, description="Only return active assets")


class UnifiedSearchRequest(BaseModel):
    query: str = Field(..., description="Query text to search across rules, facts, statutes, and documents")
    source_types: Optional[List[str]] = None
    categories: Optional[List[str]] = None
    jurisdictions: Optional[List[str]] = None
    limit: int = Field(default=50, ge=1, le=100)


@router.post("/context", response_model=SharedAIContext)
def assemble_ai_context(
    request: ContextAssemblyRequest,
    auth_context: AuthContext = Depends(require_permission(Permission.GENERATE_AI_CONTEXT)),
    db: Session = Depends(get_db),
):
    """
    Assembles a unified, typed SharedAIContext for downstream AI services.
    Enforces multi-tenant isolation, permission bounds, prompt injection containment,
    and priority conflict evaluation.
    """
    context = SharedIntelligenceService.assemble_shared_ai_context(
        db=db,
        auth_context=auth_context,
        content_text=request.content_text,
        submission_id=request.submission_id,
        revision_id=request.revision_id,
        target_channel=request.target_channel,
        target_jurisdiction=request.target_jurisdiction,
        query_topics=request.query_topics,
    )
    return context


@router.post("/retrieve/rules", response_model=List[BrandRuleContext])
def retrieve_applicable_rules(
    channel: str = "web",
    jurisdiction: str = "Global",
    content_text: Optional[str] = None,
    auth_context: AuthContext = Depends(require_permission(Permission.VIEW_KNOWLEDGE)),
    db: Session = Depends(get_db),
):
    """Retrieves approved brand and statutory rules applicable to target channel and jurisdiction."""
    return KnowledgeRetriever.retrieve_applicable_rules(
        db=db,
        organization_id=auth_context.organization_id,
        content_text=content_text,
        target_channel=channel,
        target_jurisdiction=jurisdiction,
    )


@router.post("/retrieve/facts", response_model=List[VerifiedFactContext])
def retrieve_verified_facts(
    query_text: Optional[str] = None,
    category: Optional[str] = None,
    auth_context: AuthContext = Depends(require_permission(Permission.VIEW_KNOWLEDGE)),
    db: Session = Depends(get_db),
):
    """
    Retrieves certified facts and claims.
    If query_text is specified and unverified, returns explicit UNAVAILABLE evidence status
    rather than fabricating a citation.
    """
    return KnowledgeRetriever.retrieve_verified_facts(
        db=db,
        organization_id=auth_context.organization_id,
        query_text=query_text,
        category=category,
    )


@router.post("/retrieve/legal", response_model=List[LegalSourceContext])
def retrieve_legal_sources(
    jurisdiction: str = "Global",
    industry: Optional[str] = None,
    auth_context: AuthContext = Depends(require_permission(Permission.VIEW_KNOWLEDGE)),
    db: Session = Depends(get_db),
):
    """
    Retrieves applicable statutes, regulations, and official guidance.
    Distinguishes binding legal mandates from advisory recommendations.
    """
    return KnowledgeRetriever.retrieve_legal_sources(
        db=db,
        organization_id=auth_context.organization_id,
        jurisdiction=jurisdiction,
        industry=industry,
    )


@router.post("/retrieve/assets", response_model=List[BrandAssetContext])
def retrieve_brand_assets(
    request: Optional[BrandAssetRetrievalRequest] = None,
    auth_context: AuthContext = Depends(require_permission(Permission.VIEW_KNOWLEDGE)),
    db: Session = Depends(get_db),
):
    """Retrieves approved brand assets and specifications with provenance metadata."""
    asset_type = request.asset_type if request else None
    name_query = request.name_query if request else None
    return KnowledgeRetriever.retrieve_brand_assets(
        db=db,
        organization_id=auth_context.organization_id,
        asset_type=asset_type,
        name_query=name_query,
    )


@router.post("/retrieve/search", response_model=UnifiedRetrievalResponse)
def unified_search(
    request: UnifiedSearchRequest,
    auth_context: AuthContext = Depends(require_permission(Permission.VIEW_KNOWLEDGE)),
    db: Session = Depends(get_db),
):
    """
    Unified multi-source search across approved rules, verified claims, legal citations, and documents.
    If evidence is missing or unverified, explicitly returns UNAVAILABLE without fabricating citations.
    """
    filters = None
    if request.source_types or request.categories or request.jurisdictions:
        filters = KnowledgeSearchFilter(
            query=request.query,
            source_types=[KnowledgeSourceType(st) for st in request.source_types] if request.source_types else None,
            categories=[KnowledgeCategory(c) for c in request.categories] if request.categories else None,
            jurisdictions=request.jurisdictions,
            limit=request.limit,
        )
    return KnowledgeRetriever.unified_search(
        db=db,
        organization_id=auth_context.organization_id,
        query=request.query,
        filters=filters,
    )


@router.post("/conflicts", response_model=List[RuleConflictDetail])
def scan_conflicts(
    request: ConflictScanRequest,
    auth_context: AuthContext = Depends(require_permission(Permission.VIEW_KNOWLEDGE)),
    db: Session = Depends(get_db),
):
    """
    Scans working guidelines and rules against statutory mandates (e.g. WCAG 2.1 AA vs brand contrast).
    Preserves conflicting sources and structures human review escalation.
    """
    rules = KnowledgeRetriever.retrieve_applicable_rules(
        db=db,
        organization_id=auth_context.organization_id,
        target_jurisdiction=request.target_jurisdiction,
    )
    legal_sources = KnowledgeRetriever.retrieve_legal_sources(
        db=db,
        organization_id=auth_context.organization_id,
        jurisdiction=request.target_jurisdiction,
    )
    conflicts = ConflictDetector.detect_conflicts(
        rules=rules,
        legal_sources=legal_sources,
        draft_guideline_data=request.draft_data,
    )
    return conflicts


@router.get("/tools", summary="List Authorized Copilot Tools")
def list_authorized_tools(
    copilot_type: str = "general",
    auth_context: AuthContext = Depends(require_permission(Permission.VIEW_KNOWLEDGE)),
):
    """
    Returns the catalog of registered intelligence tools authorized for the caller's role and target copilot domain.
    """
    from app.services.shared_intelligence.tool_registry import tool_registry
    from app.schemas.orchestration import CopilotType

    try:
        c_type = CopilotType(copilot_type)
    except ValueError:
        c_type = CopilotType.GENERAL

    tools = tool_registry.list_authorized_tools(c_type, auth_context)
    return [t.model_dump() for t in tools]
