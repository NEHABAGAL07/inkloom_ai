"""
Knowledge Retrieval Engine
Executes multi-tenant, permission-aware retrieval across:
- Approved brand guidelines and rules
- Verified product facts and empirical marketing claims
- Legal statutes, regulations, and official guidance
- Brand assets and specifications
- Content revisions, previous audit findings, and reviewer decisions
"""
from typing import List, Optional, Dict, Any, Tuple
from sqlalchemy import or_, and_, desc, asc
from sqlalchemy.orm import Session

from app.models.knowledge import KnowledgeItem
from app.models.guideline import BrandGuideline, GuidelineRule
from app.models.asset import ApprovedAsset
from app.models.submission import ContentSubmission
from app.models.revision import ContentRevision
from app.models.audit import AuditRun, AuditFinding
from app.models.review import ReviewDecision
from app.schemas.knowledge import (
    KnowledgeSourceType,
    EvidenceStatus,
    RuleApplicability,
    RulePriorityType,
    VerificationStatus,
    KnowledgeSearchFilter,
)
from app.schemas.ai_context import (
    ProvenanceRecord,
    BrandRuleContext,
    VerifiedFactContext,
    LegalSourceContext,
    ContentVersionContext,
    PreviousFindingContext,
    ReviewerDecisionContext,
)
from app.services.shared_intelligence.conflict_detector import ConflictDetector


class KnowledgeRetriever:
    """
    Core retrieval provider enforcing strict multi-tenant isolation,
    explicit unverified/unavailable states, and verifiable provenance tracking.
    """

    @staticmethod
    def search_knowledge_items(
        db: Session,
        organization_id: str,
        filters: KnowledgeSearchFilter,
    ) -> List[KnowledgeItem]:
        """
        Searches knowledge items strictly scoped to the authenticated organization.
        """
        query = db.query(KnowledgeItem).filter(
            KnowledgeItem.organization_id == organization_id
        )

        if filters.is_active is not None:
            query = query.filter(KnowledgeItem.is_active == filters.is_active)

        if filters.source_types:
            query = query.filter(KnowledgeItem.source_type.in_([st.value for st in filters.source_types]))

        if filters.categories:
            query = query.filter(KnowledgeItem.category.in_([c.value for c in filters.categories]))

        if filters.jurisdictions:
            jurisdiction_conditions = [KnowledgeItem.jurisdiction == "Global"]
            for j in filters.jurisdictions:
                jurisdiction_conditions.append(KnowledgeItem.jurisdiction.ilike(f"%{j}%"))
            query = query.filter(or_(*jurisdiction_conditions))

        if filters.verification_statuses:
            query = query.filter(KnowledgeItem.verification_status.in_([vs.value for vs in filters.verification_statuses]))

        if filters.rule_types:
            query = query.filter(KnowledgeItem.rule_type.in_([rt.value for rt in filters.rule_types]))

        if filters.max_priority_level is not None:
            query = query.filter(KnowledgeItem.priority_level <= filters.max_priority_level)

        if filters.query:
            term = f"%{filters.query.strip()}%"
            query = query.filter(
                or_(
                    KnowledgeItem.title.ilike(term),
                    KnowledgeItem.description.ilike(term),
                    KnowledgeItem.source_reference.ilike(term),
                    KnowledgeItem.authoritative_source.ilike(term),
                )
            )

        # Priority 1 (highest / mandatory legal) first, followed by most recently updated
        query = query.order_by(asc(KnowledgeItem.priority_level), desc(KnowledgeItem.updated_at))
        return query.offset(filters.offset).limit(filters.limit).all()

    @staticmethod
    def retrieve_applicable_rules(
        db: Session,
        organization_id: str,
        content_text: Optional[str] = None,
        target_channel: Optional[str] = "web",
        target_jurisdiction: Optional[str] = "Global",
    ) -> List[BrandRuleContext]:
        """
        Retrieves all active brand rules and mandatory legal rules for an organization,
        evaluating applicability for the given channel and jurisdiction.
        """
        rules_context: List[BrandRuleContext] = []

        # 1. Retrieve from BrandGuideline & GuidelineRule
        active_guidelines = (
            db.query(BrandGuideline)
            .filter(
                BrandGuideline.organization_id == organization_id,
                BrandGuideline.is_active == True,
                BrandGuideline.status.in_(["published", "approved"]),
            )
            .all()
        )

        for guideline in active_guidelines:
            for rule in guideline.rules:
                channels = rule.content_channels or guideline.content_channels or ["*"]
                rule_jurisdiction = rule.jurisdiction or guideline.jurisdiction or "Global"

                applicability, reason = ConflictDetector.evaluate_rule_applicability(
                    rule_def=rule.rule_definition or {},
                    content_channels=channels,
                    target_channel=target_channel,
                    target_jurisdiction=target_jurisdiction,
                    rule_jurisdiction=rule_jurisdiction,
                )

                provenance = ProvenanceRecord(
                    source_id=rule.id,
                    source_type=KnowledgeSourceType.BRAND_RULE,
                    title=f"{guideline.name} — {rule.rule_name}",
                    authoritative_source=rule.authoritative_source or guideline.name,
                    source_reference=rule.section or f"Guideline {guideline.version}",
                    source_url=rule.source_url,
                    jurisdiction=rule_jurisdiction,
                    version=guideline.version,
                    effective_date=rule.effective_date or guideline.effective_date,
                    publication_date=guideline.published_at,
                    verification_status=VerificationStatus(rule.verification_status) if rule.verification_status in [v.value for v in VerificationStatus] else VerificationStatus.VERIFIED,
                    is_binding=rule.priority_level == 1,
                )

                rules_context.append(
                    BrandRuleContext(
                        rule_id=rule.id,
                        category=rule.category,
                        rule_name=rule.rule_name,
                        section=rule.section,
                        severity_default=rule.severity_default,
                        rule_type=RulePriorityType(rule.rule_type) if rule.rule_type in [r.value for r in RulePriorityType] else RulePriorityType.BRAND_STANDARD,
                        priority_level=rule.priority_level,
                        rule_definition=rule.rule_definition or {},
                        applicability=applicability,
                        applicability_reason=reason,
                        provenance=provenance,
                    )
                )

        # 2. Retrieve rule-type items from KnowledgeItem registry
        knowledge_rules = (
            db.query(KnowledgeItem)
            .filter(
                KnowledgeItem.organization_id == organization_id,
                KnowledgeItem.is_active == True,
                KnowledgeItem.source_type.in_(["brand_rule", "legislation", "regulation", "official_guidance", "internal_company_policy"]),
            )
            .order_by(asc(KnowledgeItem.priority_level))
            .all()
        )

        for ki in knowledge_rules:
            channels = ki.content_channels or ["*"]
            applicability, reason = ConflictDetector.evaluate_rule_applicability(
                rule_def=ki.content_payload or {},
                content_channels=channels,
                target_channel=target_channel,
                target_jurisdiction=target_jurisdiction,
                rule_jurisdiction=ki.jurisdiction,
            )

            provenance = ProvenanceRecord(
                source_id=ki.id,
                source_type=KnowledgeSourceType(ki.source_type),
                title=ki.title,
                authoritative_source=ki.authoritative_source,
                source_reference=ki.source_reference,
                source_url=ki.source_url,
                jurisdiction=ki.jurisdiction,
                version=ki.version,
                effective_date=ki.effective_date,
                publication_date=ki.publication_date,
                verification_status=VerificationStatus(ki.verification_status),
                verified_by=ki.verified_by,
                verified_at=ki.verified_at,
                is_binding=ki.priority_level == 1,
            )

            rules_context.append(
                BrandRuleContext(
                    rule_id=ki.id,
                    category=ki.category,
                    rule_name=ki.title,
                    section=ki.source_reference,
                    severity_default="critical" if ki.priority_level == 1 else "medium",
                    rule_type=RulePriorityType(ki.rule_type),
                    priority_level=ki.priority_level,
                    rule_definition=ki.content_payload or {},
                    applicability=applicability,
                    applicability_reason=reason,
                    provenance=provenance,
                )
            )

        # Sort by priority level (Priority 1 Legal Mandatory first)
        rules_context.sort(key=lambda r: r.priority_level)
        return rules_context

    @staticmethod
    def retrieve_verified_facts(
        db: Session,
        organization_id: str,
        query_text: Optional[str] = None,
        category: Optional[str] = None,
    ) -> List[VerifiedFactContext]:
        """
        Retrieves registered verified facts and certified claims.
        If a query is supplied and no match exists, returns an explicit UNAVAILABLE record
        rather than inventing a citation.
        """
        query = db.query(KnowledgeItem).filter(
            KnowledgeItem.organization_id == organization_id,
            KnowledgeItem.is_active == True,
            KnowledgeItem.source_type.in_(["verified_fact", "certified_claim"]),
        )

        if category:
            query = query.filter(KnowledgeItem.category == category)

        if query_text:
            term = f"%{query_text.strip()}%"
            query = query.filter(
                or_(
                    KnowledgeItem.title.ilike(term),
                    KnowledgeItem.description.ilike(term),
                    KnowledgeItem.source_reference.ilike(term),
                )
            )

        items = query.all()
        results: List[VerifiedFactContext] = []

        for item in items:
            provenance = ProvenanceRecord(
                source_id=item.id,
                source_type=KnowledgeSourceType(item.source_type),
                title=item.title,
                authoritative_source=item.authoritative_source,
                source_reference=item.source_reference,
                source_url=item.source_url,
                jurisdiction=item.jurisdiction,
                version=item.version,
                effective_date=item.effective_date,
                verification_status=VerificationStatus(item.verification_status),
                verified_by=item.verified_by,
                verified_at=item.verified_at,
                is_binding=False,
            )

            results.append(
                VerifiedFactContext(
                    fact_id=item.id,
                    claim_key=item.content_payload.get("claim_key", item.title.lower().replace(" ", "_")),
                    statement=item.description or item.title,
                    evidence_status=EvidenceStatus(item.evidence_status),
                    metric_limits=item.content_payload.get("metric_limits"),
                    provenance=provenance,
                )
            )

        # If a specific query was requested but returned nothing, return explicit UNAVAILABLE fallback
        if query_text and not results:
            fallback_provenance = ProvenanceRecord(
                source_id="unregistered_fact_fallback",
                source_type=KnowledgeSourceType.VERIFIED_FACT,
                title="Unregistered Claim Query",
                authoritative_source="Internal Knowledge Registry",
                verification_status=VerificationStatus.UNVERIFIED,
                is_binding=False,
            )
            results.append(
                VerifiedFactContext(
                    fact_id="fact_unavailable",
                    claim_key="unregistered_query",
                    statement=f"No certified benchmark or verified fact found matching: '{query_text}'.",
                    evidence_status=EvidenceStatus.UNAVAILABLE,
                    provenance=fallback_provenance,
                )
            )

        return results

    @staticmethod
    def retrieve_legal_sources(
        db: Session,
        organization_id: str,
        jurisdiction: str = "Global",
        industry: Optional[str] = None,
    ) -> List[LegalSourceContext]:
        """
        Retrieves legal sources (legislation, regulation, official guidance, internal legal policy)
        distinguishing binding laws from guidance and internal policies.
        """
        query = db.query(KnowledgeItem).filter(
            KnowledgeItem.organization_id == organization_id,
            KnowledgeItem.is_active == True,
            KnowledgeItem.source_type.in_(["legislation", "regulation", "official_guidance", "internal_company_policy"]),
        )

        if jurisdiction and jurisdiction != "Global":
            query = query.filter(
                or_(
                    KnowledgeItem.jurisdiction == "Global",
                    KnowledgeItem.jurisdiction.ilike(f"%{jurisdiction}%"),
                )
            )

        if industry and industry != "General":
            query = query.filter(
                or_(
                    KnowledgeItem.industry == "General",
                    KnowledgeItem.industry.ilike(f"%{industry}%"),
                )
            )

        items = query.order_by(asc(KnowledgeItem.priority_level)).all()
        legal_contexts: List[LegalSourceContext] = []

        for item in items:
            is_binding = item.source_type in ["legislation", "regulation"] or item.priority_level <= 2
            provenance = ProvenanceRecord(
                source_id=item.id,
                source_type=KnowledgeSourceType(item.source_type),
                title=item.title,
                authoritative_source=item.authoritative_source,
                source_reference=item.source_reference,
                source_url=item.source_url,
                jurisdiction=item.jurisdiction,
                version=item.version,
                effective_date=item.effective_date,
                verification_status=VerificationStatus(item.verification_status),
                verified_by=item.verified_by,
                verified_at=item.verified_at,
                is_binding=is_binding,
            )

            legal_contexts.append(
                LegalSourceContext(
                    source_id=item.id,
                    legal_type=KnowledgeSourceType(item.source_type),
                    citation=item.source_reference,
                    jurisdiction=item.jurisdiction,
                    title=item.title,
                    summary=item.description,
                    is_binding=is_binding,
                    effective_date=item.effective_date,
                    provenance=provenance,
                )
            )

        return legal_contexts

    @staticmethod
    def retrieve_content_and_history(
        db: Session,
        organization_id: str,
        submission_id: str,
        revision_id: Optional[str] = None,
    ) -> Tuple[Optional[ContentVersionContext], List[PreviousFindingContext], List[ReviewerDecisionContext]]:
        """
        Retrieves content revision and previous governance history.
        Enforces tenant isolation by verifying organization ownership.
        """
        submission = (
            db.query(ContentSubmission)
            .filter(
                ContentSubmission.id == submission_id,
                ContentSubmission.organization_id == organization_id,
            )
            .first()
        )
        if not submission:
            return (None, [], [])

        # Content version
        rev_query = db.query(ContentRevision).filter(ContentRevision.submission_id == submission_id)
        if revision_id:
            rev_query = rev_query.filter(ContentRevision.id == revision_id)
        else:
            rev_query = rev_query.order_by(desc(ContentRevision.version_number))

        revision = rev_query.first()
        content_context = None
        if revision:
            content_context = ContentVersionContext(
                submission_id=submission.id,
                revision_id=revision.id,
                version_number=revision.version_number,
                content_type=submission.content_type,
                raw_text=revision.raw_text,
                media_metadata=revision.media_metadata or {},
                file_name=revision.file_name,
            )

        # Previous audit findings
        previous_findings: List[PreviousFindingContext] = []
        audits = (
            db.query(AuditRun)
            .filter(AuditRun.submission_id == submission_id)
            .order_by(desc(AuditRun.created_at))
            .limit(3)
            .all()
        )
        for ar in audits:
            for f in ar.findings:
                previous_findings.append(
                    PreviousFindingContext(
                        finding_id=f.finding_id,
                        category=f.category,
                        severity=f.severity,
                        title=f.title,
                        message=f.message,
                        status=f.status,
                        suggested_replacement=(
                            f.suggested_correction.get("replacement_text")
                            if isinstance(f.suggested_correction, dict)
                            else None
                        ),
                    )
                )

        # Reviewer decisions
        reviewer_decisions: List[ReviewerDecisionContext] = []
        reviews = (
            db.query(ReviewDecision)
            .filter(ReviewDecision.submission_id == submission_id)
            .order_by(desc(ReviewDecision.created_at))
            .all()
        )
        for rd in reviews:
            reviewer_role = rd.reviewer.memberships[0].role if rd.reviewer and rd.reviewer.memberships else "reviewer"
            reviewer_decisions.append(
                ReviewerDecisionContext(
                    decision_id=rd.id,
                    action=rd.action,
                    reviewer_role=reviewer_role,
                    comments=rd.comments,
                    decided_at=rd.created_at,
                )
            )

        return (content_context, previous_findings, reviewer_decisions)
