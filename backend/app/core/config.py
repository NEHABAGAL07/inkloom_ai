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

    @field_validator("DATABASE_URL", mode="after")
    def resolve_sqlite_path(cls, v: str) -> str:
        if v.startswith("sqlite:///./") or v == "sqlite:///inkloom_dev.db":
            backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            rel_file = v.replace("sqlite:///./", "").replace("sqlite:///", "")
            abs_path = os.path.abspath(os.path.join(backend_dir, rel_file))
            return f"sqlite:///{abs_path.replace(os.sep, '/')}"
        return v

    # Uploads & Media
    UPLOAD_STORAGE_DIR: str = "./uploads"

    @field_validator("UPLOAD_STORAGE_DIR", mode="after")
    def resolve_upload_dir(cls, v: str) -> str:
        if not os.path.isabs(v):
            backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            return os.path.abspath(os.path.join(backend_dir, v))
        return v

    MAX_UPLOAD_SIZE_MB: int = 25
    ALLOWED_MEDIA_TYPES: List[str] = [
        "text/plain",
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "image/png",
        "image/jpeg",
        "image/webp",
        "image/svg+xml",
        "image/gif",
        "video/mp4",
        "video/webm",
        "video/quicktime",
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
