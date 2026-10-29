from sqlalchemy import Column, String, Float, Integer, Boolean, ForeignKey, JSON, Text
from sqlalchemy.orm import relationship
from app.models.base_model import TimestampedModel


class AuditRun(TimestampedModel):
    __tablename__ = "audit_runs"

    submission_id = Column(String(36), ForeignKey("content_submissions.id", ondelete="CASCADE"), nullable=False, index=True)
    revision_id = Column(String(36), ForeignKey("content_revisions.id", ondelete="SET NULL"), nullable=True, index=True)
    schema_version = Column(String(20), default="1.0.0", nullable=False)
    overall_status = Column(String(50), nullable=False)  # compliant, needs_review, non_compliant, error
    summary = Column(JSON, nullable=False)
    engine_metadata = Column(JSON, nullable=False)

    submission = relationship("ContentSubmission", back_populates="audits")
    revision = relationship("ContentRevision", back_populates="audits")
    findings = relationship("AuditFinding", back_populates="audit_run", cascade="all, delete-orphan")


class AuditFinding(TimestampedModel):
    __tablename__ = "audit_findings"

    audit_run_id = Column(String(36), ForeignKey("audit_runs.id", ondelete="CASCADE"), nullable=False, index=True)
    finding_id = Column(String(64), nullable=False, index=True)
    category = Column(String(50), nullable=False, index=True)
    severity = Column(String(20), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    evidence = Column(Text, nullable=True)
    source_reference = Column(JSON, nullable=True)
    confidence = Column(Float, nullable=False)
    suggested_correction = Column(JSON, nullable=True)
    status = Column(String(50), default="open", nullable=False)  # open, accepted, dismissed, manual_check_required
    location = Column(JSON, nullable=True)
    requires_human_review = Column(Boolean, default=False, nullable=False)
    rule_reference = Column(String(255), nullable=True)
    evidence_status = Column(String(50), nullable=True)
    jurisdiction = Column(String(100), nullable=True)
    details = Column(JSON, nullable=True)

    audit_run = relationship("AuditRun", back_populates="findings")
