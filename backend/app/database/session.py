import os
from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from app.core.config import settings, BACKEND_DIR

db_url = settings.DATABASE_URL
if db_url.startswith("sqlite:///./"):
    db_file = db_url.replace("sqlite:///./", "")
    abs_db = os.path.join(BACKEND_DIR, db_file)
    db_url = f"sqlite:///{abs_db}"

connect_args = {}
if db_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    db_url,
    connect_args=connect_args,
    echo=settings.DEBUG and False,  # set to True for SQL query debugging
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator[Session, None, None]:
    """Dependency for obtaining database sessions per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
