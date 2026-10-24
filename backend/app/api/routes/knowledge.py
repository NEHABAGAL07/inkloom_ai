"""
Knowledge & Provenance Management API Endpoints
Provides authenticated CRUD and verification lifecycle for legal sources,
certified benchmarks, and brand knowledge items with multi-tenant isolation.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.core.security import get_current_auth_context, AuthContext
from app.models.knowledge import KnowledgeItem
from app.schemas.knowledge import (
    KnowledgeItemCreate,
    KnowledgeItemUpdate,
    KnowledgeItemResponse,
    KnowledgeVerificationRequest,
    KnowledgeSearchFilter,
    KnowledgeSourceType,
    KnowledgeCategory,
    VerificationStatus,
    RulePriorityType,
)
from app.services.shared_intelligence import SharedIntelligenceService, KnowledgeRetriever

router = APIRouter(prefix="/knowledge", tags=["Knowledge & Provenance Registry"])


@router.get("", response_model=List[KnowledgeItemResponse])
def list_knowledge_items(
    query: Optional[str] = Query(None, description="Search term for title, description, or citation"),
    source_type: Optional[KnowledgeSourceType] = Query(None),
    category: Optional[KnowledgeCategory] = Query(None),
    jurisdiction: Optional[str] = Query(None),
    verification_status: Optional[VerificationStatus] = Query(None),
    rule_type: Optional[RulePriorityType] = Query(None),
    max_priority: Optional[int] = Query(None, ge=1, le=5),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    auth_context: AuthContext = Depends(get_current_auth_context),
    db: Session = Depends(get_db),
):
    """
    Lists knowledge items strictly scoped to the caller's authenticated organization.
    Supports multi-attribute filtering by source type, category, jurisdiction, and priority.
    """
    filters = KnowledgeSearchFilter(
        query=query,
        source_types=[source_type] if source_type else None,
        categories=[category] if category else None,
        jurisdictions=[jurisdiction] if jurisdiction else None,
        verification_statuses=[verification_status] if verification_status else None,
        rule_types=[rule_type] if rule_type else None,
        max_priority_level=max_priority,
        limit=limit,
        offset=offset,
    )
    items = KnowledgeRetriever.search_knowledge_items(
        db=db,
        organization_id=auth_context.organization_id,
        filters=filters,
    )
    return items


@router.post("", response_model=KnowledgeItemResponse, status_code=status.HTTP_201_CREATED)
def create_knowledge_item(
    payload: KnowledgeItemCreate,
    auth_context: AuthContext = Depends(get_current_auth_context),
    db: Session = Depends(get_db),
):
    """
    Registers a new knowledge item (legal statute, certified benchmark, or brand rule)
    with provenance tracking. Requires Admin or Compliance Officer role.
    """
    item = SharedIntelligenceService.create_knowledge_item(
        db=db,
        auth_context=auth_context,
        payload=payload,
    )
    return item


@router.get("/{item_id}", response_model=KnowledgeItemResponse)
def get_knowledge_item(
    item_id: str,
    auth_context: AuthContext = Depends(get_current_auth_context),
    db: Session = Depends(get_db),
):
    """
    Retrieves a knowledge item with full source provenance.
    Enforces tenant isolation by verifying organization ownership.
    """
    item = (
        db.query(KnowledgeItem)
        .filter(
            KnowledgeItem.id == item_id,
            KnowledgeItem.organization_id == auth_context.organization_id,
        )
        .first()
    )
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Knowledge item '{item_id}' not found in your organization.",
        )
    return item


@router.put("/{item_id}", response_model=KnowledgeItemResponse)
def update_knowledge_item(
    item_id: str,
    payload: KnowledgeItemUpdate,
    auth_context: AuthContext = Depends(get_current_auth_context),
    db: Session = Depends(get_db),
):
    """Updates an existing knowledge item. Requires Admin or Compliance Officer role."""
    item = SharedIntelligenceService.update_knowledge_item(
        db=db,
        auth_context=auth_context,
        item_id=item_id,
        payload=payload,
    )
    return item


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_knowledge_item(
    item_id: str,
    auth_context: AuthContext = Depends(get_current_auth_context),
    db: Session = Depends(get_db),
):
    """Deletes a knowledge item, recording an immutable audit event."""
    SharedIntelligenceService.delete_knowledge_item(
        db=db,
        auth_context=auth_context,
        item_id=item_id,
    )
    return None


@router.post("/{item_id}/verify", response_model=KnowledgeItemResponse)
def verify_knowledge_item(
    item_id: str,
    verification_req: KnowledgeVerificationRequest,
    auth_context: AuthContext = Depends(get_current_auth_context),
    db: Session = Depends(get_db),
):
    """
    Records human compliance officer attestation for a knowledge item.
    Never marks verified via automated LLM output alone.
    """
    item = SharedIntelligenceService.verify_knowledge_item(
        db=db,
        auth_context=auth_context,
        item_id=item_id,
        verification_req=verification_req,
    )
    return item
