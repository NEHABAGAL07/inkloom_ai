"""Inkloom AI - Central Application Configuration."""

import os
from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
try:
    from pydantic_settings import BaseSettings, SettingsConfigDict
except ImportError:
    # Fallback if pydantic-settings is not yet installed
    from pydantic import BaseModel as BaseSettings  # type: ignore
    SettingsConfigDict = None  # type: ignore


class Settings(BaseSettings):
    """Application settings with environment variable overrides."""

    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    PROJECT_NAME: str = "Inkloom AI"
    API_V1_STR: str = "/api/v1"
    DEBUG: bool = os.getenv("DEBUG", "true").lower() in ("true", "1", "yes")

    # Networking
    BACKEND_HOST: str = os.getenv("BACKEND_HOST", "0.0.0.0")
    BACKEND_PORT: int = int(os.getenv("BACKEND_PORT", "8000"))
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    # Database
    # Defaults to SQLite in development if PostgreSQL is not specified
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "sqlite+aiosqlite:///./inkloom.db"
    )

    # Security
    SECRET_KEY: str = os.getenv(
        "SECRET_KEY", 
        "development-only-secret-key-do-not-use-in-production-inkloom-0000"
    )
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day
    ALGORITHM: str = "HS256"

    # Uploads & Storage
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "./uploads")
    MAX_UPLOAD_SIZE_BYTES: int = 25 * 1024 * 1024  # 25 MB
    ALLOWED_MEDIA_TYPES: List[str] = [
        "text/plain",
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "image/png",
        "image/jpeg",
        "video/mp4",
    ]

    # AI Audit Engine Configuration
    LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "rule_based_fallback")
    LLM_API_KEY: str = os.getenv("LLM_API_KEY", "")
    LLM_MODEL_NAME: str = os.getenv("LLM_MODEL_NAME", "gemini-1.5-pro")
    LLM_TIMEOUT_SECONDS: float = float(os.getenv("LLM_TIMEOUT_SECONDS", "8.0"))
    CLAIM_VERIFICATION_THRESHOLD: float = 0.75
    MAX_RULES_PER_AUDIT: int = 100
    MAX_AUDIT_TEXT_LENGTH: int = int(os.getenv("MAX_AUDIT_TEXT_LENGTH", "500000"))

    # Media Extraction Tooling
    ENABLE_OCR: bool = os.getenv("ENABLE_OCR", "true").lower() in ("true", "1")
    TESSERACT_CMD: str = os.getenv("TESSERACT_CMD", "tesseract")
    FFMPEG_CMD: str = os.getenv("FFMPEG_CMD", "ffmpeg")

    if SettingsConfigDict:
        model_config = SettingsConfigDict(
            env_file=".env",
            env_file_encoding="utf-8",
            extra="ignore",
            case_sensitive=True,
        )


settings = Settings()
