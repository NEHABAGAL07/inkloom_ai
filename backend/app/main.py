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
        from app.database.seed import seed_initial_data
        seed_initial_data()


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
