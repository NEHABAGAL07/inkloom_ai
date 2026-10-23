import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime
from app.database.base import Base


def get_utc_now():
    return datetime.now(timezone.utc)


class TimestampedModel(Base):
    __abstract__ = True

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    created_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=get_utc_now, onupdate=get_utc_now, nullable=False)
