import os
from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    LOG_LEVEL: str = "INFO"

    APP_NAME: str = "Inkloom AI Brand Governance API"
    API_V1_PREFIX: str = "/api/v1"

    # CORS configuration
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://inkloom-ai.vercel.app",
        "https://inkloom.vercel.app",
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            v_trimmed = v.strip()
            if v_trimmed.startswith("[") and v_trimmed.endswith("]"):
                import json
                try:
                    return json.loads(v_trimmed)
                except Exception:
                    pass
            return [i.strip() for i in v_trimmed.split(",") if i.strip()]
        elif isinstance(v, list):
            return v
        return []

    # Security
    SECRET_KEY: str = "dev_secret_key_not_for_production_use_only"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24

    # Database
    DATABASE_URL: str = "sqlite:///./inkloom_dev.db"

    # Uploads & Media
    UPLOAD_STORAGE_DIR: str = "./uploads"
    MAX_UPLOAD_SIZE_MB: int = 25
    ALLOWED_MEDIA_TYPES: List[str] = [
        "text/plain",
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "image/png",
        "image/jpeg",
        "image/webp",
        "video/mp4",
    ]

    # AI Engine & Assistant LLM Settings
    AI_ENGINE_MODE: str = "deterministic"
    LLM_PROVIDER: str = "offline_rule_engine"
    LLM_API_KEY: str = ""
    LLM_MODEL_NAME: str = ""
    LLM_TIMEOUT_SECONDS: float = 20.0
    LLM_MAX_OUTPUT_TOKENS: int = 800
    CHAT_RATE_LIMIT_PER_MINUTE: int = 10

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )


settings = Settings()
