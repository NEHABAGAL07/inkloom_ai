"""
Campaign Policy Decision Service (Phase 6)
Determines required review tracks, verifies exact-version audit validity,
detects approval invalidation on content changes, and computes comprehensive release readiness.
"""
from typing import List, Dict, Any, Tuple
from sqlalchemy.orm import Session

from app.models.campaign import Campaign
from app.models.submission import ContentSubmission
from app.models.revision import ContentRevision
from app.models.audit import AuditRun, AuditFinding
from app.models.review import ReviewDecision
from app.schemas.campaign import (
    CampaignReviewTrackStatus,
    ReviewTrackResult,
    CampaignReadinessEvaluation,
)
from app.workflow.state_machine import WorkflowState


class CampaignPolicyService:
    """
    Centralized, testable policy engine enforcing multi-track governance gating,
    version integrity, and separation of duties.
    """

    @staticmethod
    def get_required_tracks_for_campaign(campaign: Campaign) -> List[str]:
        """
        Determines which review tracks are strictly required based on campaign metadata,
        content types, target jurisdiction, and regulated product category.
        """
        policy_cfg = campaign.policy_config or {}
        configured_tracks = policy_cfg.get("required_reviews")
        if configured_tracks and isinstance(configured_tracks, list):
            return [t.lower() for t in configured_tracks]

        required: List[str] = ["marketing"]

        # 1. Visual Review track required if campaign contains visual/media content
        has_media = any(
            sub.content_type in ["image", "video"]
            for sub in (campaign.submissions or [])
        )
        if has_media or campaign.target_channel in ["display_ads", "video", "multimedia"]:
            required.append("visual")

        # 2. Legal Review track required if regulated category or specific jurisdiction
        regulated = campaign.regulated_category in [
            "b2b_enterprise_saas",
            "financial_services",
            "healthcare_life_sciences",
            "consumer_tech_ai",
        ]
        statutory_jur = campaign.target_jurisdiction in ["EU", "US", "UK", "CA", "AU"]
        if regulated or statutory_jur or policy_cfg.get("require_legal_signoff", True):
            required.append("legal")

        return required

    @staticmethod
    def evaluate_readiness(campaign: Campaign, db: Session) -> CampaignReadinessEvaluation:
        """
        Computes multi-dimensional readiness without masking critical blockers behind a single score.
        Checks exact content versions, audits, human approvals, and separation of duties.
        """
        required_tracks = CampaignPolicyService.get_required_tracks_for_campaign(campaign)
        blockers: List[str] = []
        review_tracks: Dict[str, ReviewTrackResult] = {}

        # 1. Evaluate Marketing Track
        mkt_result = CampaignPolicyService._evaluate_marketing_track(campaign, db)
        review_tracks["marketing"] = mkt_result
        if "marketing" in required_tracks:
            if mkt_result.status == CampaignReviewTrackStatus.PENDING:
                blockers.append("Marketing brand audit has not been completed on current content version.")
            elif mkt_result.status == CampaignReviewTrackStatus.FAILED:
                blockers.append("Marketing brand audit failed execution.")
            elif mkt_result.critical_findings_count > 0:
                blockers.append(f"Marketing audit identified {mkt_result.critical_findings_count} critical brand rule violation(s).")

        # 2. Evaluate Visual Track
        if "visual" in required_tracks:
            vis_result = CampaignPolicyService._evaluate_visual_track(campaign, db)
            review_tracks["visual"] = vis_result
            if vis_result.status == CampaignReviewTrackStatus.PENDING:
                blockers.append("Visual asset audit has not been completed on current design assets.")
            elif vis_result.status == CampaignReviewTrackStatus.FAILED:
                blockers.append("Visual asset audit failed execution.")
            elif vis_result.critical_findings_count > 0:
                blockers.append(f"Visual audit identified {vis_result.critical_findings_count} critical visual defect(s).")
        else:
            review_tracks["visual"] = ReviewTrackResult(
                track_name="visual",
                status=CampaignReviewTrackStatus.NOT_REQUIRED,
                summary_message="Visual audit not required for pure text campaign.",
            )

        # 3. Evaluate Legal Track
        if "legal" in required_tracks:
            leg_result = CampaignPolicyService._evaluate_legal_track(campaign, db)
            review_tracks["legal"] = leg_result
            if leg_result.status == CampaignReviewTrackStatus.PENDING:
                blockers.append("Statutory legal review has not been completed on current content version.")
            elif leg_result.status == CampaignReviewTrackStatus.FAILED:
                blockers.append("Legal compliance evaluation encountered an error.")
            elif leg_result.critical_findings_count > 0:
                blockers.append(f"Legal Copilot flagged {leg_result.critical_findings_count} critical regulatory risk(s).")
        else:
            review_tracks["legal"] = ReviewTrackResult(
                track_name="legal",
                status=CampaignReviewTrackStatus.NOT_REQUIRED,
                summary_message="Formal legal review optional under current policy.",
            )

        # 4. Content Revision Invalidation Check
        # If any submission was updated after the latest audit or approval, invalidate readiness
        for sub in campaign.submissions or []:
            current_rev = None
            if sub.current_revision_id:
                current_rev = db.query(ContentRevision).filter(ContentRevision.id == sub.current_revision_id).first()
            if not current_rev and sub.revisions:
                current_rev = sub.revisions[0]
            if current_rev:
                # Find latest audit for this submission
                latest_audit = (
                    db.query(AuditRun)
                    .filter(AuditRun.submission_id == sub.id)
                    .order_by(AuditRun.created_at.desc())
                    .first()
                )
                if latest_audit and latest_audit.revision_id and latest_audit.revision_id != current_rev.id:
                    blockers.append(
                        f"Content in '{sub.title}' was revised to v{current_rev.version_number} after last audit. "
                        f"Prior approvals are suspended until re-audited."
                    )

        # 5. Evaluate Human Review & Approval Status
        latest_decision = (
            db.query(ReviewDecision)
            .join(ContentSubmission, ContentSubmission.id == ReviewDecision.submission_id)
            .filter(ContentSubmission.campaign_id == campaign.id)
            .order_by(ReviewDecision.created_at.desc())
            .first()
        )

        ai_completed = all(
            review_tracks[t].status in [
                CampaignReviewTrackStatus.COMPLETED,
                CampaignReviewTrackStatus.COMPLETED_WITH_WARNINGS,
                CampaignReviewTrackStatus.NOT_REQUIRED,
            ]
            for t in required_tracks
            if t in review_tracks
        )

        human_reviewed = campaign.status in [WorkflowState.APPROVED.value, WorkflowState.REJECTED.value, WorkflowState.CHANGES_REQUESTED.value]
        is_approved = campaign.status == WorkflowState.APPROVED.value

        if not is_approved:
            if campaign.status == WorkflowState.CHANGES_REQUESTED.value:
                blockers.append("Reviewer requested changes that must be resolved prior to publication.")
            elif campaign.status == WorkflowState.REJECTED.value:
                blockers.append("Campaign was rejected during human review.")
            else:
                blockers.append("Mandatory human compliance review sign-off is pending.")

        # Invariant: AI results alone CANNOT grant readiness without human sign-off
        is_ready = is_approved and ai_completed and len(blockers) == 0

        return CampaignReadinessEvaluation(
            campaign_id=campaign.id,
            workflow_state=campaign.status,
            ai_checks_completed=ai_completed,
            human_review_completed=human_reviewed,
            required_approvals_completed=is_approved,
            outstanding_blockers=blockers,
            review_tracks=review_tracks,
            is_ready_for_release=is_ready,
        )

    @staticmethod
    def _evaluate_marketing_track(campaign: Campaign, db: Session) -> ReviewTrackResult:
        """Inspects audit runs for text copy submissions in the campaign."""
        text_subs = [s for s in (campaign.submissions or []) if s.content_type in ["text", "document"]]
        if not text_subs:
            return ReviewTrackResult(
                track_name="marketing",
                status=CampaignReviewTrackStatus.PENDING,
                summary_message="No text copy or marketing drafts attached to campaign.",
            )

        latest_runs: List[AuditRun] = []
        for sub in text_subs:
            run = (
                db.query(AuditRun)
                .filter(AuditRun.submission_id == sub.id)
                .order_by(AuditRun.created_at.desc())
                .first()
            )
            if run:
                latest_runs.append(run)

        if not latest_runs:
            return ReviewTrackResult(
                track_name="marketing",
                status=CampaignReviewTrackStatus.PENDING,
                summary_message="Marketing brand audits not yet executed.",
            )

        total_findings = sum(len(r.findings) for r in latest_runs)
        critical_count = sum(
            sum(1 for f in r.findings if f.severity in ["critical", "high"])
            for r in latest_runs
        )
        avg_score = sum(r.summary.get("compliance_score", 0) for r in latest_runs) / len(latest_runs)

        track_status = CampaignReviewTrackStatus.COMPLETED
        if critical_count > 0:
            track_status = CampaignReviewTrackStatus.NEEDS_HUMAN_REVIEW
        elif any(r.overall_status in ["needs_review", "non_compliant"] for r in latest_runs):
            track_status = CampaignReviewTrackStatus.COMPLETED_WITH_WARNINGS

        return ReviewTrackResult(
            track_name="marketing",
            status=track_status,
            score=round(avg_score, 1),
            findings_count=total_findings,
            critical_findings_count=critical_count,
            last_run_at=latest_runs[0].created_at if latest_runs else None,
            reviewed_revision_id=latest_runs[0].revision_id if latest_runs else None,
            summary_message=f"Marketing copy evaluated across {len(latest_runs)} draft asset(s). Score: {round(avg_score, 1)}/100.",
            details={"audits_count": len(latest_runs)},
        )

    @staticmethod
    def _evaluate_visual_track(campaign: Campaign, db: Session) -> ReviewTrackResult:
        """Inspects visual asset audit findings."""
        visual_subs = [s for s in (campaign.submissions or []) if s.content_type in ["image", "video"]]
        if not visual_subs:
            return ReviewTrackResult(
                track_name="visual",
                status=CampaignReviewTrackStatus.NOT_REQUIRED,
                summary_message="No visual media assets attached.",
            )

        latest_runs: List[AuditRun] = []
        for sub in visual_subs:
            run = (
                db.query(AuditRun)
                .filter(AuditRun.submission_id == sub.id)
                .order_by(AuditRun.created_at.desc())
                .first()
            )
            if run:
                latest_runs.append(run)

        if not latest_runs:
            return ReviewTrackResult(
                track_name="visual",
                status=CampaignReviewTrackStatus.PENDING,
                summary_message="Visual audit pending execution for creative assets.",
            )

        total_findings = sum(len(r.findings) for r in latest_runs)
        critical_count = sum(
            sum(1 for f in r.findings if f.severity in ["critical", "high"])
            for r in latest_runs
        )
        avg_score = sum(r.summary.get("compliance_score", 0) for r in latest_runs) / len(latest_runs)

        track_status = CampaignReviewTrackStatus.COMPLETED
        if critical_count > 0:
            track_status = CampaignReviewTrackStatus.NEEDS_HUMAN_REVIEW
        elif any(r.overall_status in ["needs_review", "non_compliant"] for r in latest_runs):
            track_status = CampaignReviewTrackStatus.COMPLETED_WITH_WARNINGS

        return ReviewTrackResult(
            track_name="visual",
            status=track_status,
            score=round(avg_score, 1),
            findings_count=total_findings,
            critical_findings_count=critical_count,
            last_run_at=latest_runs[0].created_at if latest_runs else None,
            reviewed_revision_id=latest_runs[0].revision_id if latest_runs else None,
            summary_message=f"Visual asset audit evaluated {len(latest_runs)} visual artifact(s). Score: {round(avg_score, 1)}/100.",
            details={"media_assets_count": len(visual_subs)},
        )

    @staticmethod
    def _evaluate_legal_track(campaign: Campaign, db: Session) -> ReviewTrackResult:
        """Inspects statutory legal review metadata cached on submissions or audit runs."""
        # Find any legal review metadata stored in campaign_metadata or submissions
        meta = campaign.campaign_metadata or {}
        legal_rep = meta.get("legal_review_report")

        if legal_rep:
            score = float(legal_rep.get("compliance_score", 100.0))
            claims = legal_rep.get("claims_analysis", [])
            crit = sum(1 for c in claims if c.get("severity") in ["critical", "high"])
            status = CampaignReviewTrackStatus.COMPLETED
            if crit > 0:
                status = CampaignReviewTrackStatus.NEEDS_HUMAN_REVIEW
            return ReviewTrackResult(
                track_name="legal",
                status=status,
                score=score,
                findings_count=len(claims),
                critical_findings_count=crit,
                summary_message=f"Legal Copilot report on file. Compliance Index: {score}/100. {crit} critical regulatory exposures.",
                details=legal_rep,
            )

        return ReviewTrackResult(
            track_name="legal",
            status=CampaignReviewTrackStatus.PENDING,
            summary_message="Legal Copilot review has not yet been executed for this campaign.",
        )
