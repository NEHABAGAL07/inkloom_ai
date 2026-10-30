"""
Unified Campaign Workflow & Approval Orchestrator (Phase 6)
Coordinates multi-track audits (Marketing, Visual, Legal), reviewer assignments,
concurrency safety, and human sign-off gating.
"""
import uuid
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from fastapi import HTTPException, status
from sqlalchemy.orm import Session, selectinload

from app.models.campaign import Campaign
from app.models.submission import ContentSubmission
from app.models.revision import ContentRevision
from app.models.review import ReviewDecision
from app.models.audit import AuditRun, AuditFinding
from app.models.audit_event import AuditEvent
from app.core.security import AuthContext, UserRole
from app.workflow.state_machine import WorkflowStateMachine, WorkflowState, WorkflowTransitionError
from app.schemas.campaign import (
    CampaignCreate,
    CampaignUpdate,
    CampaignDecisionRequest,
    CampaignResponse,
    CampaignReadinessEvaluation,
)
from app.services.audit_orchestrator import AuditOrchestrator
from app.services.legal_copilot.service import LegalCopilotService
from app.schemas.legal_copilot import LegalReviewRequest
from app.services.workflow.campaign_policy import CampaignPolicyService
from app.services.workflow.notification_service import NotificationService


class CampaignOrchestrator:

    @classmethod
    def create_campaign(
        cls,
        db: Session,
        auth: AuthContext,
        payload: CampaignCreate,
    ) -> Campaign:
        """Creates a new campaign bounded strictly to the authenticated tenant."""
        campaign_id = f"cmp_{uuid.uuid4().hex[:12]}"

        policy_dict = (
            payload.policy_config.model_dump()
            if payload.policy_config
            else {
                "required_reviews": ["marketing", "visual", "legal"],
                "min_compliance_score": 75.0,
                "require_legal_signoff": True,
                "require_independent_reviewer": True,
            }
        )

        campaign = Campaign(
            id=campaign_id,
            organization_id=auth.organization_id,
            name=payload.name,
            description=payload.description,
            product_name=payload.product_name,
            target_audience=payload.target_audience,
            campaign_objective=payload.campaign_objective,
            target_channel=payload.target_channel,
            target_jurisdiction=payload.target_jurisdiction,
            regulated_category=payload.regulated_category,
            priority=payload.priority.value if hasattr(payload.priority, "value") else str(payload.priority),
            deadline=payload.deadline,
            creative_brief=payload.creative_brief,
            owner_id=auth.user_id,
            assigned_reviewer_id=payload.assigned_reviewer_id,
            status=WorkflowState.DRAFT.value,
            policy_config=policy_dict,
            campaign_metadata=payload.campaign_metadata or {},
            version=1,
        )
        db.add(campaign)
        db.flush()

        # Associate any initial submissions requested
        if payload.submission_ids:
            subs = (
                db.query(ContentSubmission)
                .filter(
                    ContentSubmission.id.in_(payload.submission_ids),
                    ContentSubmission.organization_id == auth.organization_id,
                )
                .all()
            )
            for sub in subs:
                sub.campaign_id = campaign.id

        # Log audit event
        event = AuditEvent(
            organization_id=auth.organization_id,
            actor_id=auth.user_id,
            entity_type="campaign",
            entity_id=campaign.id,
            event_type="campaign_created",
            details={
                "name": campaign.name,
                "priority": campaign.priority,
                "jurisdiction": campaign.target_jurisdiction,
                "regulated_category": campaign.regulated_category,
            },
        )
        db.add(event)

        # Notify assigned reviewer if specified
        if campaign.assigned_reviewer_id:
            NotificationService.dispatch_notification(
                db=db,
                organization_id=auth.organization_id,
                recipient_id=campaign.assigned_reviewer_id,
                sender_id=auth.user_id,
                title="New Campaign Review Assignment",
                message=f"You have been assigned as reviewer for campaign '{campaign.name}'.",
                notification_type="review_assigned",
                link_url=f"/campaigns?id={campaign.id}",
                idempotency_key=f"assign_{campaign.id}_{campaign.assigned_reviewer_id}",
            )

        db.commit()
        db.refresh(campaign)
        return campaign

    @classmethod
    def get_campaign(
        cls,
        db: Session,
        auth: AuthContext,
        campaign_id: str,
    ) -> Campaign:
        """Retrieves a tenant-isolated campaign."""
        campaign = (
            db.query(Campaign)
            .options(selectinload(Campaign.submissions).selectinload(ContentSubmission.revisions))
            .filter(
                Campaign.id == campaign_id,
                Campaign.organization_id == auth.organization_id,
            )
            .first()
        )
        if not campaign:
            raise HTTPException(status_code=404, detail="Campaign not found.")
        return campaign

    @classmethod
    def list_campaigns(
        cls,
        db: Session,
        auth: AuthContext,
        status_filter: Optional[str] = None,
        priority_filter: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> List[Campaign]:
        """Lists tenant-isolated campaigns with optional filtering."""
        query = (
            db.query(Campaign)
            .options(selectinload(Campaign.submissions).selectinload(ContentSubmission.revisions))
            .filter(Campaign.organization_id == auth.organization_id)
        )
        if status_filter:
            query = query.filter(Campaign.status == status_filter)
        if priority_filter:
            query = query.filter(Campaign.priority == priority_filter)

        return query.order_by(Campaign.updated_at.desc()).offset(offset).limit(limit).all()

    @classmethod
    def update_campaign(
        cls,
        db: Session,
        auth: AuthContext,
        campaign_id: str,
        payload: CampaignUpdate,
    ) -> Campaign:
        """
        Updates campaign metadata with optimistic locking protection.
        Throws HTTP 409 Conflict if payload.version != current database version.
        """
        campaign = cls.get_campaign(db, auth, campaign_id)

        # Optimistic concurrency guard
        if payload.version is not None and payload.version != campaign.version:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Concurrent modification detected. Campaign is at version {campaign.version}, but request specified version {payload.version}. Please refresh.",
            )

        # Validate workflow transition if status is being updated
        if payload.status and payload.status != campaign.status:
            user_primary_role = auth.roles[0].value if auth.roles else "creator"
            WorkflowStateMachine.validate_transition(
                current=campaign.status,
                target=payload.status,
                actor_role=user_primary_role,
                is_ai_action=False,
            )
            campaign.status = payload.status

        # Update metadata fields
        if payload.name is not None:
            campaign.name = payload.name
        if payload.description is not None:
            campaign.description = payload.description
        if payload.product_name is not None:
            campaign.product_name = payload.product_name
        if payload.target_audience is not None:
            campaign.target_audience = payload.target_audience
        if payload.campaign_objective is not None:
            campaign.campaign_objective = payload.campaign_objective
        if payload.target_channel is not None:
            campaign.target_channel = payload.target_channel
        if payload.target_jurisdiction is not None:
            campaign.target_jurisdiction = payload.target_jurisdiction
        if payload.regulated_category is not None:
            campaign.regulated_category = payload.regulated_category
        if payload.priority is not None:
            campaign.priority = payload.priority.value if hasattr(payload.priority, "value") else str(payload.priority)
        if payload.deadline is not None:
            campaign.deadline = payload.deadline
        if payload.creative_brief is not None:
            campaign.creative_brief = payload.creative_brief
        if payload.policy_config is not None:
            campaign.policy_config = payload.policy_config
        if payload.campaign_metadata is not None:
            merged = dict(campaign.campaign_metadata or {})
            merged.update(payload.campaign_metadata)
            campaign.campaign_metadata = merged

        old_reviewer = campaign.assigned_reviewer_id
        if payload.assigned_reviewer_id is not None and payload.assigned_reviewer_id != old_reviewer:
            campaign.assigned_reviewer_id = payload.assigned_reviewer_id
            NotificationService.dispatch_notification(
                db=db,
                organization_id=auth.organization_id,
                recipient_id=payload.assigned_reviewer_id,
                sender_id=auth.user_id,
                title="Campaign Review Reassigned",
                message=f"You have been assigned to review campaign '{campaign.name}'.",
                notification_type="review_assigned",
                link_url=f"/campaigns?id={campaign.id}",
                idempotency_key=f"reassign_{campaign.id}_{payload.assigned_reviewer_id}_{campaign.version}",
            )

        # Increment version for optimistic locking
        campaign.version += 1

        # Log audit event
        event = AuditEvent(
            organization_id=auth.organization_id,
            actor_id=auth.user_id,
            entity_type="campaign",
            entity_id=campaign.id,
            event_type="campaign_updated",
            details={"version": campaign.version, "status": campaign.status},
        )
        db.add(event)
        db.commit()
        db.refresh(campaign)
        return campaign

    @classmethod
    def associate_submissions(
        cls,
        db: Session,
        auth: AuthContext,
        campaign_id: str,
        submission_ids: List[str],
        action: str = "attach",
    ) -> Campaign:
        """Attaches or detaches existing content submissions from the campaign."""
        campaign = cls.get_campaign(db, auth, campaign_id)

        subs = (
            db.query(ContentSubmission)
            .filter(
                ContentSubmission.id.in_(submission_ids),
                ContentSubmission.organization_id == auth.organization_id,
            )
            .all()
        )

        for sub in subs:
            if action == "attach":
                sub.campaign_id = campaign.id
            elif action == "detach":
                if sub.campaign_id == campaign.id:
                    sub.campaign_id = None

        campaign.version += 1

        # Invalidate readiness if content set modified
        if campaign.status == WorkflowState.APPROVED.value:
            campaign.status = WorkflowState.IN_PROGRESS.value

        event = AuditEvent(
            organization_id=auth.organization_id,
            actor_id=auth.user_id,
            entity_type="campaign",
            entity_id=campaign.id,
            event_type=f"campaign_submissions_{action}ed",
            details={"submission_ids": [s.id for s in subs], "action": action},
        )
        db.add(event)
        db.commit()
        db.refresh(campaign)
        return campaign

    @classmethod
    def run_campaign_reviews(
        cls,
        db: Session,
        auth: AuthContext,
        campaign_id: str,
    ) -> CampaignResponse:
        """
        Coordinates end-to-end multi-track AI reviews (Marketing, Visual, Legal)
        for all current revisions in the campaign without blocking the database.
        """
        campaign = cls.get_campaign(db, auth, campaign_id)
        required_tracks = CampaignPolicyService.get_required_tracks_for_campaign(campaign)

        # Transition to AI_REVIEW_IN_PROGRESS
        if WorkflowStateMachine.can_transition(campaign.status, WorkflowState.AI_REVIEW_IN_PROGRESS.value):
            campaign.status = WorkflowState.AI_REVIEW_IN_PROGRESS.value
            db.commit()

        failures: List[str] = []
        has_critical_blockers = False

        # Track 1: Marketing / Brand Rule Audits
        for sub in campaign.submissions or []:
            if sub.content_type in ["text", "document"] or sub.raw_text:
                try:
                    AuditOrchestrator.execute_audit_for_submission(
                        db=db,
                        submission_id=sub.id,
                        revision_id=sub.current_revision_id,
                        actor_id=auth.user_id,
                    )
                except Exception as e:
                    failures.append(f"Marketing audit failed for '{sub.title}': {str(e)}")

        # Track 2: Visual Media Audits
        for sub in campaign.submissions or []:
            if sub.content_type in ["image", "video"]:
                try:
                    AuditOrchestrator.execute_audit_for_submission(
                        db=db,
                        submission_id=sub.id,
                        revision_id=sub.current_revision_id,
                        actor_id=auth.user_id,
                    )
                except Exception as e:
                    failures.append(f"Visual audit failed for '{sub.title}': {str(e)}")

        # Track 3: Legal Copilot Statutory Review
        if "legal" in required_tracks:
            combined_text = "\n\n".join(
                [f"[{s.title}]\n{s.raw_text or s.description or ''}" for s in (campaign.submissions or [])]
            ) or (campaign.creative_brief or campaign.description or campaign.name)

            try:
                legal_service = LegalCopilotService(db, auth)
                legal_req = LegalReviewRequest(
                    title=f"Legal Review: {campaign.name}",
                    content_text=combined_text,
                    product_name=campaign.product_name,
                    intended_audience=campaign.target_audience,
                    target_jurisdiction=campaign.target_jurisdiction,
                    marketing_channel=campaign.target_channel,
                    regulated_category=campaign.regulated_category,
                    campaign_objective=campaign.campaign_objective,
                )
                legal_report = legal_service.review_compliance_and_claims(legal_req)

                # Cache report in campaign metadata
                meta = dict(campaign.campaign_metadata or {})
                meta["legal_review_report"] = legal_report.model_dump(mode="json")
                campaign.campaign_metadata = meta

                if any(c.severity in ["critical", "high"] for c in legal_report.claims_analysis):
                    has_critical_blockers = True

            except Exception as e:
                failures.append(f"Legal review failed: {str(e)}")

        # Check latest audit runs for critical findings
        for sub in campaign.submissions or []:
            latest_run = (
                db.query(AuditRun)
                .filter(AuditRun.submission_id == sub.id)
                .order_by(AuditRun.created_at.desc())
                .first()
            )
            if latest_run:
                if any(f.severity in ["critical", "high"] for f in latest_run.findings):
                    has_critical_blockers = True

        # Progress workflow state based on evaluation
        # Critical rule: AI NEVER transitions to APPROVED.
        if has_critical_blockers:
            next_state = WorkflowState.CHANGES_REQUESTED.value
        else:
            next_state = WorkflowState.HUMAN_REVIEW_PENDING.value

        campaign.status = next_state
        campaign.version += 1

        # Log audit event
        event = AuditEvent(
            organization_id=auth.organization_id,
            actor_id=auth.user_id,
            entity_type="campaign",
            entity_id=campaign.id,
            event_type="campaign_reviews_orchestrated",
            details={
                "tracks_run": required_tracks,
                "has_critical_blockers": has_critical_blockers,
                "failures": failures,
                "new_state": next_state,
            },
        )
        db.add(event)

        # Notify reviewer that campaign is ready for human evaluation
        if next_state == WorkflowState.HUMAN_REVIEW_PENDING.value and campaign.assigned_reviewer_id:
            NotificationService.dispatch_notification(
                db=db,
                organization_id=auth.organization_id,
                recipient_id=campaign.assigned_reviewer_id,
                sender_id=auth.user_id,
                title="Campaign Ready for Approval Sign-Off",
                message=f"All automated checks completed for '{campaign.name}'. Human compliance sign-off requested.",
                notification_type="review_requested",
                link_url=f"/campaigns?id={campaign.id}",
                idempotency_key=f"ready_signoff_{campaign.id}_{campaign.version}",
            )
        elif next_state == WorkflowState.CHANGES_REQUESTED.value and campaign.owner_id:
            NotificationService.dispatch_notification(
                db=db,
                organization_id=auth.organization_id,
                recipient_id=campaign.owner_id,
                sender_id="system_governance_engine",
                title="Action Required: Compliance Blockers Detected",
                message=f"Automated review of campaign '{campaign.name}' identified critical compliance exposures requiring changes.",
                notification_type="changes_requested",
                link_url=f"/campaigns?id={campaign.id}",
                idempotency_key=f"changes_needed_{campaign.id}_{campaign.version}",
            )

        db.commit()
        db.refresh(campaign)

        # Build comprehensive CampaignResponse
        readiness = CampaignPolicyService.evaluate_readiness(campaign, db)
        return cls.build_response(campaign, readiness)

    @classmethod
    def record_decision(
        cls,
        db: Session,
        auth: AuthContext,
        campaign_id: str,
        payload: CampaignDecisionRequest,
    ) -> CampaignResponse:
        """
        Records human compliance reviewer determination (approve, reject, request_changes).
        Enforces separation of duties and valid workflow state machine transitions.
        """
        campaign = cls.get_campaign(db, auth, campaign_id)

        # Map action to target workflow state
        action_map = {
            "approve": WorkflowState.APPROVED.value,
            "reject": WorkflowState.REJECTED.value,
            "request_changes": WorkflowState.CHANGES_REQUESTED.value,
        }
        target_state = action_map.get(payload.action.lower())
        if not target_state:
            raise HTTPException(status_code=400, detail=f"Invalid review action '{payload.action}'.")

        # Segregation of duties: Content owner cannot approve their own campaign
        if target_state == WorkflowState.APPROVED.value and campaign.owner_id == auth.user_id:
            if not auth.has_role(UserRole.ADMIN):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Segregation of duties violation: Campaign creators cannot approve their own campaigns. An independent reviewer or admin must sign off.",
                )

        # Role authorization and state machine transition check
        user_role = auth.roles[0].value if auth.roles else "creator"
        try:
            WorkflowStateMachine.validate_transition(
                current=campaign.status,
                target=target_state,
                actor_role=user_role,
                is_ai_action=False,
            )
        except Exception as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

        campaign.status = target_state
        campaign.version += 1

        # Also cascade review decisions to associated submissions for historical audit provenance
        for sub in campaign.submissions or []:
            dec = ReviewDecision(
                submission_id=sub.id,
                revision_id=sub.current_revision_id,
                reviewer_id=auth.user_id,
                action=payload.action.lower(),
                comments=payload.comments,
                review_metadata={
                    "campaign_id": campaign.id,
                    "conditions": payload.conditions or [],
                    "reviewer_role": user_role,
                },
            )
            db.add(dec)
            sub.status = target_state

        # Log audit event
        event = AuditEvent(
            organization_id=auth.organization_id,
            actor_id=auth.user_id,
            entity_type="campaign",
            entity_id=campaign.id,
            event_type=f"campaign_decision_{payload.action.lower()}",
            details={
                "decision": payload.action.lower(),
                "comments": payload.comments,
                "conditions": payload.conditions or [],
                "target_state": target_state,
            },
        )
        db.add(event)

        # Dispatch notification to campaign owner
        if campaign.owner_id:
            NotificationService.dispatch_notification(
                db=db,
                organization_id=auth.organization_id,
                recipient_id=campaign.owner_id,
                sender_id=auth.user_id,
                title=f"Campaign {payload.action.replace('_', ' ').title()}",
                message=f"Campaign '{campaign.name}' was marked as '{target_state}' by {auth.email or 'Reviewer'}. Comments: {payload.comments or 'None provided.'}",
                notification_type=f"decision_{payload.action.lower()}",
                link_url=f"/campaigns?id={campaign.id}",
                idempotency_key=f"dec_{campaign.id}_{payload.action.lower()}_{campaign.version}",
            )

        db.commit()
        db.refresh(campaign)

        readiness = CampaignPolicyService.evaluate_readiness(campaign, db)
        return cls.build_response(campaign, readiness)

    @classmethod
    def build_response(cls, campaign: Campaign, readiness: CampaignReadinessEvaluation) -> CampaignResponse:
        """Serializes campaign and attached submissions into typed CampaignResponse."""
        return CampaignResponse(
            id=campaign.id,
            organization_id=campaign.organization_id,
            name=campaign.name,
            description=campaign.description,
            product_name=campaign.product_name,
            target_audience=campaign.target_audience,
            campaign_objective=campaign.campaign_objective,
            target_channel=campaign.target_channel,
            target_jurisdiction=campaign.target_jurisdiction,
            regulated_category=campaign.regulated_category,
            priority=campaign.priority,
            deadline=campaign.deadline,
            owner_id=campaign.owner_id,
            assigned_reviewer_id=campaign.assigned_reviewer_id,
            status=campaign.status,
            creative_brief=campaign.creative_brief,
            policy_config=campaign.policy_config or {},
            campaign_metadata=campaign.campaign_metadata or {},
            version=campaign.version,
            created_at=campaign.created_at,
            updated_at=campaign.updated_at,
            submissions=campaign.submissions or [],
            review_tracks=readiness.review_tracks,
            readiness=readiness,
        )
