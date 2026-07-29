"""
Repositories Package

Exports all repository instances for import in service files.

Usage:
    from app.repositories import user_repository
"""

from app.repositories.user_repository import user_repository

__all__ = [
    "user_repository",
]
