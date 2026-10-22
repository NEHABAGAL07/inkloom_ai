"""Inkloom AI - Application Entry Point."""

from contextlib import asynccontextmanager
import logging
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.api.routes import api_router

# Configure secure logging
logging.basicConfig(
    level=logging.INFO if not settings.DEBUG else logging.DEBUG,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("inkloom_ai")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown hooks."""
    logger.info("Initializing Inkloom AI Brand Governance Platform...")
    logger.info(f"Environment: {settings.ENVIRONMENT} | Debug: {settings.DEBUG}")
    logger.info(f"LLM Provider: {settings.LLM_PROVIDER}")
    yield
    logger.info("Inkloom AI services shutting down cleanly.")


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Enterprise AI-Powered Brand Governance & Compliance Platform",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root-level health endpoint
@app.get("/health", tags=["Health"])
async def root_health():
    return {
        "status": "healthy",
        "service": "inkloom_ai_backend",
        "version": "1.0.0",
        "environment": settings.ENVIRONMENT,
    }


# Mount Versioned API
app.include_router(api_router, prefix=settings.API_V1_STR)


# Safe Exception Handler
@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    """Prevents leaking stack traces or confidential database details."""
    logger.error(f"Unhandled exception on {request.method} {request.url.path}: {str(exc)}", exc_info=settings.DEBUG)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error_code": "INTERNAL_SERVER_ERROR",
            "message": "An unexpected error occurred. Please contact system administrator." if not settings.DEBUG else str(exc),
        },
    )
