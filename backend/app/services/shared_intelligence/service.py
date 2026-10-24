"""
Shared Intelligence Service
Coordinates multi-tenant knowledge management, provenance lifecycle,
prompt-injection protection, and unified AI context assembly for all Inkloom AI capabilities.
"""
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.organization import Organization
from app.models.knowledge import KnowledgeItem
from app.models.audit_event import AuditEvent
from app.core.security import AuthContext, UserRole, Permission
from app.schemas.knowledge import (
    KnowledgeItemCreate,
    KnowledgeItemUpdate,
    KnowledgeVerificationRequest,
    KnowledgeSearchFilter,
    VerificationStatus,
    EvidenceStatus,
)
from app.schemas.ai_context import (
    SharedAIContext,
    OrganizationScopeContext,
    UserSecurityContext,
    UntrustedContentContainer,
)
from app.services.shared_intelligence.retrieval import KnowledgeRetriever
from app.services.shared_intelligence.conflict_detector import ConflictDetector


class SharedIntelligenceService:
    """
    Modular intelligence foundation responsible for retrieving, organizing,
    and supplying verified governance knowledge to downstream AI services.
    """

    @classmethod
    def assemble_shared_ai_context(
        cls,
        db: Session,
        auth_context: AuthContext,
        content_text: Optional[str] = None,
        submission_id: Optional[str] = None,
        revision_id: Optional[str] = None,
        target_channel: str = "web",
        target_jurisdiction: Optional[str] = None,
        query_topics: Optional[List[str]] = None,
    ) -> SharedAIContext:
        """
        Assembles unified, typed SharedAIContext for AI capabilities.
        Enforces tenant isolation, role authorization, and prompt containment.
        """
        org_id = auth_context.organization_id
        org = db.query(Organization).filter(Organization.id == org_id).first()
        if not org:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Organization '{org_id}' not found.",
            )

        jurisdiction = target_jurisdiction or "Global"
        industry = org.industry or "General"

        # 1. Organization Scope Context
        org_context = OrganizationScopeContext(
            organization_id=org.id,
            organization_name=org.name,
            industry=industry,
            jurisdiction=jurisdiction,
            permitted_channels=["web", "social", "email", "print", "packaging"],
        )

        # 2. User Security Context (authorized operations only)
        user_role_str = auth_context.roles[0].value if auth_context.roles else "viewer"
        allowed_ops = []
        if auth_context.has_permission(Permission.AUDIT_CONTENT):
            allowed_ops.append("audit_content")
        if auth_context.has_permission(Permission.APPROVE_CONTENT_PUBLICATION):
            allowed_ops.append("approve_content")
        if auth_context.has_permission(Permission.EDIT_BRAND_RULES):
            allowed_ops.append("manage_brand_rules")
        if auth_context.has_permission(Permission.APPROVE_LEGAL_CHANGES):
            allowed_ops.append("verify_legal_sources")

        user_context = UserSecurityContext(
            user_id=auth_context.user_id,
            role=user_role_str,
            email=auth_context.email,
            allowed_operations=allowed_ops,
        )

        # 3. Retrieve Applicable Rules
        applicable_rules = KnowledgeRetriever.retrieve_applicable_rules(
            db=db,
            organization_id=org_id,
            content_text=content_text,
            target_channel=target_channel,
            target_jurisdiction=jurisdiction,
        )

        # 4. Retrieve Verified Facts & Certified Claims
        verified_facts = []
        if query_topics:
            for topic in query_topics:
                facts = KnowledgeRetriever.retrieve_verified_facts(
                    db=db,
                    organization_id=org_id,
                    query_text=topic,
                )
                verified_facts.extend(facts)
        else:
            verified_facts = KnowledgeRetriever.retrieve_verified_facts(
                db=db,
                organization_id=org_id,
            )

        # 5. Retrieve Legal Sources
        legal_sources = KnowledgeRetriever.retrieve_legal_sources(
            db=db,
            organization_id=org_id,
            jurisdiction=jurisdiction,
            industry=industry,
        )

        # 6. Retrieve Content Version & History (if submission_id provided)
        content_version = None
        previous_findings = []
        reviewer_decisions = []
        if submission_id:
            content_version, previous_findings, reviewer_decisions = (
                KnowledgeRetriever.retrieve_content_and_history(
                    db=db,
                    organization_id=org_id,
                    submission_id=submission_id,
                    revision_id=revision_id,
                )
            )
            if not content_text and content_version and content_version.raw_text:
                content_text = content_version.raw_text

        # 7. Evaluate Rule & Statutory Conflicts
        conflicts = ConflictDetector.detect_conflicts(
            rules=applicable_rules,
            legal_sources=legal_sources,
        )

        # 8. Wrap User Content in Untrusted Container (Prompt Injection Neutralization)
        untrusted_container = None
        if content_text:
            untrusted_container = UntrustedContentContainer.wrap_untrusted_content(
                text=content_text,
                source_id=submission_id or "user_input_prompt",
            )

        return SharedAIContext(
            organization=org_context,
            user=user_context,
            content=content_version,
            untrusted_content=untrusted_container,
            applicable_rules=applicable_rules,
            verified_facts=verified_facts,
            legal_sources=legal_sources,
            previous_findings=previous_findings,
            reviewer_decisions=reviewer_decisions,
            conflicts_detected=conflicts,
        )

    @classmethod
    def create_knowledge_item(
        cls,
        db: Session,
        auth_context: AuthContext,
        payload: KnowledgeItemCreate,
    ) -> KnowledgeItem:
        """
        Creates a new knowledge item with provenance metadata.
        Strictly enforces tenant isolation and authorized role access.
        """
        if not auth_context.has_role(UserRole.ADMIN, UserRole.COMPLIANCE_OFFICER):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only Organization Admins and Compliance Officers may register knowledge items.",
            )

        # Principle: Never mark verified without explicit human certification
        verified_by = None
        verified_at = None
        if payload.verification_status == VerificationStatus.VERIFIED:
            verified_by = auth_context.email or auth_context.user_id
            verified_at = datetime.now(timezone.utc)

        item = KnowledgeItem(
            organization_id=auth_context.organization_id,
            source_type=payload.source_type.value,
            category=payload.category.value,
            title=payload.title,
            description=payload.description,
            content_payload=payload.content_payload,
            source_reference=payload.source_reference,
            source_url=payload.source_url,
            jurisdiction=payload.jurisdiction,
            industry=payload.industry,
            content_channels=payload.content_channels,
            publication_date=payload.publication_date,
            effective_date=payload.effective_date,
            review_date=payload.review_date,
            version=payload.version,
            verification_status=payload.verification_status.value,
            evidence_status=payload.evidence_status.value,
            rule_type=payload.rule_type.value,
            priority_level=payload.priority_level,
            authoritative_source=payload.authoritative_source,
            verified_by=verified_by,
            verified_at=verified_at,
            is_active=payload.is_active,
            tags=payload.tags or [],
        )

        db.add(item)
        db.flush()

        # Audit Event Log
        event = AuditEvent(
            organization_id=auth_context.organization_id,
            actor_id=auth_context.user_id,
            entity_type="knowledge_item",
            entity_id=item.id,
            event_type="knowledge_created",
            details={
                "title": item.title,
                "source_type": item.source_type,
                "category": item.category,
                "priority_level": item.priority_level,
                "verification_status": item.verification_status,
            },
        )
        db.add(event)
        db.commit()
        db.refresh(item)
        return item

    @classmethod
    def verify_knowledge_item(
        cls,
        db: Session,
        auth_context: AuthContext,
        item_id: str,
        verification_req: KnowledgeVerificationRequest,
    ) -> KnowledgeItem:
        """
        Updates human verification status for an existing knowledge item.
        Requires Compliance Officer or Admin authorization.
        """
        if not auth_context.has_role(UserRole.ADMIN, UserRole.COMPLIANCE_OFFICER):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Verification requires Compliance Officer or Organization Admin authority.",
            )

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
                detail=f"Knowledge item '{item_id}' not found.",
            )

        old_status = item.verification_status
        item.verification_status = verification_req.verification_status.value
        item.verification_rationale = verification_req.verification_rationale
        item.verified_by = auth_context.email or auth_context.user_id
        item.verified_at = datetime.now(timezone.utc)

        if verification_req.evidence_status:
            item.evidence_status = verification_req.evidence_status.value

        # Audit Event Log
        event = AuditEvent(
            organization_id=auth_context.organization_id,
            actor_id=auth_context.user_id,
            entity_type="knowledge_item",
            entity_id=item.id,
            event_type="knowledge_verified",
            details={
                "old_status": old_status,
                "new_status": item.verification_status,
                "rationale": item.verification_rationale,
                "verified_by": item.verified_by,
            },
        )
        db.add(event)
        db.commit()
        db.refresh(item)
        return item

    @classmethod
    def update_knowledge_item(
        cls,
        db: Session,
        auth_context: AuthContext,
        item_id: str,
        payload: KnowledgeItemUpdate,
    ) -> KnowledgeItem:
        """Updates a knowledge item preserving tenant boundaries and audit logs."""
        if not auth_context.has_role(UserRole.ADMIN, UserRole.COMPLIANCE_OFFICER):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Editing knowledge items requires Admin or Compliance Officer role.",
            )

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
                detail=f"Knowledge item '{item_id}' not found.",
            )

        update_dict = payload.model_dump(exclude_unset=True)
        for key, value in update_dict.items():
            if hasattr(item, key):
                setattr(item, key, value.value if hasattr(value, "value") else value)

        db.commit()
        db.refresh(item)
        return item

    @classmethod
    def delete_knowledge_item(
        cls,
        db: Session,
        auth_context: AuthContext,
        item_id: str,
    ) -> bool:
        """Deletes a knowledge item, recording an audit event."""
        if not auth_context.has_role(UserRole.ADMIN, UserRole.COMPLIANCE_OFFICER):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Deleting knowledge items requires Admin or Compliance Officer role.",
            )

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
                detail=f"Knowledge item '{item_id}' not found.",
            )

        db.delete(item)
        event = AuditEvent(
            organization_id=auth_context.organization_id,
            actor_id=auth_context.user_id,
            entity_type="knowledge_item",
            entity_id=item_id,
            event_type="knowledge_deleted",
            details={"title": item.title, "source_type": item.source_type},
        )
        db.add(event)
        db.commit()
        return True
