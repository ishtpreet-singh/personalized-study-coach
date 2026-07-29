"""
Personalized Study Coach — FastAPI Application Entry Point

This is the main application factory. It:
  - Creates the FastAPI app instance
  - Registers all middleware (CORS, logging, error handling)
  - Mounts all API version routers
  - Sets up startup/shutdown lifecycle events
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
import logging

logger = logging.getLogger(__name__)

from app.core.config import settings
from app.core.logging import setup_logging
from app.db.session import init_db
from app.api.v1.router import api_router


# ── Lifecycle Events ─────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown lifecycle handler."""
    # Startup
    setup_logging()
    await init_db()
    yield
    # Shutdown (cleanup resources, close connections, etc.)


# ── App Factory ───────────────────────────────────────────────
def create_application() -> FastAPI:
    application = FastAPI(
        title=settings.APP_NAME,
        description="Adaptive AI-powered study coach API",
        version="0.1.0",
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
        lifespan=lifespan,
    )

    # ── CORS Middleware ──────────────────────────────────────
    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.BACKEND_CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ── API Routers ──────────────────────────────────────────
    application.include_router(api_router, prefix="/api/v1")

    # ── Exception Handlers ───────────────────────────────────
    @application.exception_handler(StarletteHTTPException)
    async def http_exception_handler(request: Request, exc: StarletteHTTPException):
        return JSONResponse(
            status_code=exc.status_code,
            content={"error": exc.detail},
        )

    @application.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        return JSONResponse(
            status_code=422,
            content={"error": "Validation error", "details": jsonable_encoder(exc.errors())},
        )

    @application.exception_handler(Exception)
    async def generic_exception_handler(request: Request, exc: Exception):
        logger.exception(f"Unhandled exception during request to {request.url.path}", exc_info=exc)
        return JSONResponse(
            status_code=500,
            content={"error": "Internal server error"},
        )

    return application


app = create_application()


# ── Health Check ─────────────────────────────────────────────
@app.get("/health", tags=["Health"])
async def health_check():
    """Basic liveness probe for load balancers and Docker health checks."""
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": "0.1.0",
        "environment": settings.APP_ENV,
    }


@app.get("/", tags=["Root"])
async def root():
    """API root — returns service info."""
    return {
        "message": f"Welcome to {settings.APP_NAME} API",
        "docs": "/docs",
        "health": "/health",
    }
