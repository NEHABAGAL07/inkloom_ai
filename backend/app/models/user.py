from sqlalchemy import Column, String, Boolean
from sqlalchemy.orm import relationship
from app.models.base_model import TimestampedModel


class User(TimestampedModel):
    __tablename__ = "users"

    email = Column(String(255), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=True)
    hashed_password = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)

    memberships = relationship("Membership", back_populates="user", cascade="all, delete-orphan")
