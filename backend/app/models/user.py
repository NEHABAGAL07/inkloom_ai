"""User Account Model."""

from sqlalchemy import Column, String, Boolean
from sqlalchemy.orm import relationship
from app.database.base import Base, TimestampMixin, generate_uuid


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, nullable=False, index=True)
    full_name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    memberships = relationship("Membership", back_populates="user", cascade="all, delete-orphan")
    submissions = relationship("ContentSubmission", back_populates="author")
    reviews = relationship("ReviewDecisionModel", back_populates="reviewer")
