"""
Logging Configuration

Structured JSON logging for production, pretty logging for development.
"""

import logging
import sys

from app.core.config import settings


def setup_logging() -> None:
    """Configure application-wide logging."""
    log_level = getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)

    logging.basicConfig(
        level=log_level,
        format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
        stream=sys.stdout,
    )

    # Silence noisy third-party loggers in production
    if settings.APP_ENV == "production":
        logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
        logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)

    logging.getLogger(__name__).info(
        f"Logging initialized | level={settings.LOG_LEVEL} | env={settings.APP_ENV}"
    )
