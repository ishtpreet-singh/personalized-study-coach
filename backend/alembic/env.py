"""
Alembic Migration Environment Configuration

This file is used by Alembic to run database migrations.
It imports the SQLAlchemy metadata from our models so Alembic
can detect schema changes and generate migration scripts.
"""

import asyncio
from logging.config import fileConfig

from alembic import context
from sqlalchemy import pool
from sqlalchemy.ext.asyncio import async_engine_from_config

from app.core.config import settings
from app.db.session import Base

# ── Alembic Config Object ─────────────────────────────────────
config = context.config

# ── Logging Setup ─────────────────────────────────────────────
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# ── Inject the database URL from our settings ────────────────
config.set_main_option(
    "sqlalchemy.url",
    settings.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://"),
)

# ── Import ALL models so Alembic can detect table definitions ──
from app.models import user  # noqa: F401 — registers User with Base.metadata
# Add future model imports here as they are created:
# from app.models import document, quiz, quiz_result, study_plan  # noqa

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Run migrations without an active DB connection (offline mode)."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection):
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    """Run migrations with an async database connection (online mode)."""
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await connectable.dispose()


def run_migrations_online() -> None:
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
