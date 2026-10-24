"""
Inkloom AI Brand Governance Backend Application Entrypoint
"""
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.api.routes import api_router
from app.api.routes.health import router as health_router
from app.database.session import engine
from app.database.base import Base
# Import all models to ensure metadata registration
import app.models

app = FastAPI(
    title=settings.APP_NAME,
    version="0.1.0",
    description="Enterprise brand governance API powered by AI: guideline retrieval, tone analysis, claim verification, and human review workflows.",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    """Create database tables on startup if using SQLite for zero-friction local development."""
    if settings.DATABASE_URL.startswith("sqlite"):
        Base.metadata.create_all(bind=engine)
        # Safe column migration for existing sqlite db files
        try:
            from sqlalchemy import text
            with engine.connect() as conn:
                # 1. brand_guidelines table
                cursor = conn.execute(text("PRAGMA table_info(brand_guidelines)"))
                cols = [row[1] for row in cursor.fetchall()]
                if cols:
                    if "status" not in cols:
                        conn.execute(text("ALTER TABLE brand_guidelines ADD COLUMN status VARCHAR(50) DEFAULT 'published' NOT NULL"))
                    if "published_at" not in cols:
                        conn.execute(text("ALTER TABLE brand_guidelines ADD COLUMN published_at DATETIME"))
                    if "published_by" not in cols:
                        conn.execute(text("ALTER TABLE brand_guidelines ADD COLUMN published_by VARCHAR(255)"))
                    if "draft_data" not in cols:
                        conn.execute(text("ALTER TABLE brand_guidelines ADD COLUMN draft_data JSON"))
                    if "published_data" not in cols:
                        conn.execute(text("ALTER TABLE brand_guidelines ADD COLUMN published_data JSON"))
                    if "submission_notes" not in cols:
                        conn.execute(text("ALTER TABLE brand_guidelines ADD COLUMN submission_notes TEXT"))
                    if "submitted_by" not in cols:
                        conn.execute(text("ALTER TABLE brand_guidelines ADD COLUMN submitted_by VARCHAR(255)"))
                    if "submitted_at" not in cols:
                        conn.execute(text("ALTER TABLE brand_guidelines ADD COLUMN submitted_at DATETIME"))
                    if "reviewed_by" not in cols:
                        conn.execute(text("ALTER TABLE brand_guidelines ADD COLUMN reviewed_by VARCHAR(255)"))
                    if "reviewed_at" not in cols:
                        conn.execute(text("ALTER TABLE brand_guidelines ADD COLUMN reviewed_at DATETIME"))
                    if "review_decision" not in cols:
                        conn.execute(text("ALTER TABLE brand_guidelines ADD COLUMN review_decision VARCHAR(50)"))
                    if "review_rationale" not in cols:
                        conn.execute(text("ALTER TABLE brand_guidelines ADD COLUMN review_rationale TEXT"))
                    if "requires_legal_approval" not in cols:
                        conn.execute(text("ALTER TABLE brand_guidelines ADD COLUMN requires_legal_approval BOOLEAN DEFAULT 1 NOT NULL"))
                    if "jurisdiction" not in cols:
                        conn.execute(text("ALTER TABLE brand_guidelines ADD COLUMN jurisdiction VARCHAR(100) DEFAULT 'Global' NOT NULL"))
                    if "industry" not in cols:
                        conn.execute(text("ALTER TABLE brand_guidelines ADD COLUMN industry VARCHAR(100) DEFAULT 'General' NOT NULL"))
                    if "product_category" not in cols:
                        conn.execute(text("ALTER TABLE brand_guidelines ADD COLUMN product_category VARCHAR(100) DEFAULT 'Enterprise Software'"))
                    if "content_channels" not in cols:
                        conn.execute(text("ALTER TABLE brand_guidelines ADD COLUMN content_channels JSON"))
                    if "effective_date" not in cols:
                        conn.execute(text("ALTER TABLE brand_guidelines ADD COLUMN effective_date DATETIME"))
                    if "review_date" not in cols:
                        conn.execute(text("ALTER TABLE brand_guidelines ADD COLUMN review_date DATETIME"))

                # 2. brand_guideline_versions table
                cursor_v = conn.execute(text("PRAGMA table_info(brand_guideline_versions)"))
                cols_v = [row[1] for row in cursor_v.fetchall()]
                if cols_v:
                    if "approved_by" not in cols_v:
                        conn.execute(text("ALTER TABLE brand_guideline_versions ADD COLUMN approved_by VARCHAR(255)"))
                    if "approved_at" not in cols_v:
                        conn.execute(text("ALTER TABLE brand_guideline_versions ADD COLUMN approved_at DATETIME"))
                    if "approval_rationale" not in cols_v:
                        conn.execute(text("ALTER TABLE brand_guideline_versions ADD COLUMN approval_rationale TEXT"))
                    if "jurisdiction" not in cols_v:
                        conn.execute(text("ALTER TABLE brand_guideline_versions ADD COLUMN jurisdiction VARCHAR(100) DEFAULT 'Global' NOT NULL"))
                    if "industry" not in cols_v:
                        conn.execute(text("ALTER TABLE brand_guideline_versions ADD COLUMN industry VARCHAR(100) DEFAULT 'General' NOT NULL"))
                    if "effective_date" not in cols_v:
                        conn.execute(text("ALTER TABLE brand_guideline_versions ADD COLUMN effective_date DATETIME"))
                    if "review_date" not in cols_v:
                        conn.execute(text("ALTER TABLE brand_guideline_versions ADD COLUMN review_date DATETIME"))

                # 3. guideline_rules table
                cursor_r = conn.execute(text("PRAGMA table_info(guideline_rules)"))
                cols_r = [row[1] for row in cursor_r.fetchall()]
                if cols_r:
                    if "rule_type" not in cols_r:
                        conn.execute(text("ALTER TABLE guideline_rules ADD COLUMN rule_type VARCHAR(50) DEFAULT 'brand_standard' NOT NULL"))
                    if "priority_level" not in cols_r:
                        conn.execute(text("ALTER TABLE guideline_rules ADD COLUMN priority_level INTEGER DEFAULT 3 NOT NULL"))
                    if "jurisdiction" not in cols_r:
                        conn.execute(text("ALTER TABLE guideline_rules ADD COLUMN jurisdiction VARCHAR(100) DEFAULT 'Global' NOT NULL"))
                    if "industry" not in cols_r:
                        conn.execute(text("ALTER TABLE guideline_rules ADD COLUMN industry VARCHAR(100) DEFAULT 'General' NOT NULL"))
                    if "content_channels" not in cols_r:
                        conn.execute(text("ALTER TABLE guideline_rules ADD COLUMN content_channels JSON"))
                    if "authoritative_source" not in cols_r:
                        conn.execute(text("ALTER TABLE guideline_rules ADD COLUMN authoritative_source VARCHAR(255)"))
                    if "source_revision_date" not in cols_r:
                        conn.execute(text("ALTER TABLE guideline_rules ADD COLUMN source_revision_date VARCHAR(100)"))
                    if "effective_date" not in cols_r:
                        conn.execute(text("ALTER TABLE guideline_rules ADD COLUMN effective_date DATETIME"))
                    if "review_date" not in cols_r:
                        conn.execute(text("ALTER TABLE guideline_rules ADD COLUMN review_date DATETIME"))
                    if "verification_status" not in cols_r:
                        conn.execute(text("ALTER TABLE guideline_rules ADD COLUMN verification_status VARCHAR(50) DEFAULT 'verified' NOT NULL"))
                    if "evidence_required" not in cols_r:
                        conn.execute(text("ALTER TABLE guideline_rules ADD COLUMN evidence_required BOOLEAN DEFAULT 0 NOT NULL"))
                    if "evidence_description" not in cols_r:
                        conn.execute(text("ALTER TABLE guideline_rules ADD COLUMN evidence_description TEXT"))
                    if "required_disclosure" not in cols_r:
                        conn.execute(text("ALTER TABLE guideline_rules ADD COLUMN required_disclosure TEXT"))

                conn.commit()
        except Exception as e:
            print("Notice: SQLite migration check:", e)

        from app.database.seed import seed_initial_data
        seed_initial_data()


# Initialize SQLite tables and migrations on load
try:
    on_startup()
except Exception as e:
    pass


# Exception handler for generic internal errors to avoid leaking trace details
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    if settings.DEBUG:
        # In debug mode, allow details
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": str(exc), "type": type(exc).__name__},
        )
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An internal governance service error occurred. Please contact system support."},
    )


# Mount health route at root and versioned routes under /api/v1
app.include_router(health_router)
app.include_router(api_router, prefix=settings.API_V1_PREFIX)


@app.get("/")
def root():
    return {
        "service": settings.APP_NAME,
        "version": "0.1.0",
        "documentation": "/docs",
        "api_v1": settings.API_V1_PREFIX,
        "health": "/health",
    }
