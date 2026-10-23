import os
import sys
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Ensure backend root is in sys.path
backend_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_root not in sys.path:
    sys.path.insert(0, backend_root)

from app.database.base import Base
from app.database.session import get_db
from app.core.security import get_current_auth_context, AuthContext, UserRole
from app.main import app
from app.models import Organization, User, Membership, BrandGuideline, GuidelineRule

TEST_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db_session():
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    
    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture
def mock_auth():
    return AuthContext(
        user_id="test_user_001",
        organization_id="test_org_001",
        roles=[UserRole.COMPLIANCE_OFFICER, UserRole.ADMIN],
        email="compliance@inkloom.internal",
        is_authenticated=True,
    )


@pytest.fixture
def client(db_session, mock_auth):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    def override_auth():
        return mock_auth

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_auth_context] = override_auth

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()


@pytest.fixture
def seed_test_org(db_session):
    org = Organization(id="test_org_001", name="Acme Brand Corp", slug="acme-brand")
    user = User(id="test_user_001", email="compliance@inkloom.internal", full_name="Jane Reviewer")
    membership = Membership(organization_id=org.id, user_id=user.id, role="compliance_officer")
    
    guideline = BrandGuideline(
        id="test_guide_001",
        organization_id=org.id,
        name="Acme Master Brand Standard",
        version="1.0.0",
        is_active=True,
    )
    
    rule = GuidelineRule(
        guideline_id=guideline.id,
        category="terminology",
        rule_name="Deprecated Terms",
        rule_definition={"forbidden_terms": ["OldProduct"]},
        severity_default="high",
        requires_human_review=False,
    )

    db_session.add_all([org, user, membership, guideline, rule])
    db_session.commit()
    return org
