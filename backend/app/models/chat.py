"""
Chat Session & Message Models for Brand Guideline Assistant
Captures conversation history, grounded citations, confidence levels, and user feedback.
Strictly isolated by organization_id and owned by user_id.
"""
from sqlalchemy import Column, String, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.models.base_model import TimestampedModel


class ChatSession(TimestampedModel):
    __tablename__ = "chat_sessions"

    organization_id = Column(
        String(36),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id = Column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    title = Column(String(255), default="Brand Assistant Inquiry", nullable=False)

    organization = relationship("Organization")
    user = relationship("User")
    messages = relationship(
        "ChatMessage",
        back_populates="session",
        cascade="all, delete-orphan",
        order_by="ChatMessage.created_at.asc()",
    )


class ChatMessage(TimestampedModel):
    __tablename__ = "chat_messages"

    session_id = Column(
        String(36),
        ForeignKey("chat_sessions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    # 'user', 'assistant', 'system'
    role = Column(String(32), nullable=False)
    content = Column(Text, nullable=False)

    # Citations metadata payload: [{document_id, document_name, page, snippet, source_type}]
    citations = Column(JSON, nullable=True, default=list)

    # Confidence rating: 'high', 'medium', 'low', 'not_found'
    confidence = Column(String(32), default="medium", nullable=False)

    # Generation mode: 'llm', 'extractive'
    mode = Column(String(32), default="extractive", nullable=True)

    # User feedback: {"helpful": bool, "comment": Optional[str], "created_at": str}
    feedback = Column(JSON, nullable=True)

    session = relationship("ChatSession", back_populates="messages")
