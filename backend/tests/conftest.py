"""Pytest Configuration and Shared Test Fixtures."""

import os
import sys
import pytest
from typing import AsyncGenerator

# Ensure backend root is on Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

# Force test environment variables before importing app
os.environ["ENVIRONMENT"] = "test"
os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///:memory:"
os.environ["SECRET_KEY"] = "test-secret-key-32-characters-minimum"

from app.main import app
from app.services.ai_audit.engine import AIAuditEngine
from app.services.media_audit.extractor import MediaExtractor
from app.services.audit_orchestrator import AuditOrchestrator


@pytest.fixture
def ai_engine() -> AIAuditEngine:
    return AIAuditEngine()


@pytest.fixture
def media_extractor() -> MediaExtractor:
    return MediaExtractor()


@pytest.fixture
def audit_orchestrator(ai_engine: AIAuditEngine, media_extractor: MediaExtractor) -> AuditOrchestrator:
    return AuditOrchestrator(ai_engine=ai_engine, media_extractor=media_extractor)
