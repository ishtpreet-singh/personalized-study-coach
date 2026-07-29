"""
Database Session Management

SQLAlchemy async engine + session factory.
Provides a dependency-injectable async database session for FastAPI routes.
"""

from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings

# ── Convert sync URL to async (psycopg2 → asyncpg) ───────────
DATABASE_URL = settings.DATABASE_URL.replace(
    "postgresql://", "postgresql+asyncpg://"
)

# ── Async Engine ──────────────────────────────────────────────
engine = create_async_engine(
    DATABASE_URL,
    echo=settings.DEBUG,       # Log SQL queries in development
    pool_pre_ping=True,        # Detect stale connections
    pool_size=settings.DB_POOL_SIZE,
    max_overflow=settings.DB_MAX_OVERFLOW,
    pool_timeout=settings.DB_POOL_TIMEOUT,
)

# ── Session Factory ───────────────────────────────────────────
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
)


# ── Base Model ────────────────────────────────────────────────
class Base(DeclarativeBase):
    """
    All SQLAlchemy ORM models should inherit from this Base.
    Enables metadata management and Alembic migrations.
    """
    pass


# ── DB Initialization ─────────────────────────────────────────
async def init_db() -> None:
    """
    Called at application startup.
    Imports all models to ensure they are registered with Base.metadata
    so Alembic can detect them for autogenerate migrations.
    In production, use Alembic migrations (not create_all).
    """
    # Import all models here so their tables register with Base.metadata
    from app.models import user  # noqa: F401


# ── FastAPI Dependency ────────────────────────────────────────
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency that provides a database session per request.
    Automatically commits on success and rolls back on exception.

    Usage:
        @router.get("/")
        async def my_route(db: AsyncSession = Depends(get_db)):
            ...
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
