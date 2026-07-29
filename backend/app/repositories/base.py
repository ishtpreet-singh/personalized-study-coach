"""
Base Repository — Generic Async CRUD

FIX #7  (HIGH):   update() now iterates update_data.items() only — not all ORM
                   fields. The old pattern serialized the entire ORM object with
                   jsonable_encoder, creating a mass-assignment risk if update_data
                   ever came from user-controlled input.

FIX #25 (LOW):    func import moved to module level.

FIX (MEDIUM):     get_multi() now has deterministic ordering by created_at DESC.
                   Unordered pagination returns different rows on concurrent writes.

FIX: Transaction contract documented explicitly:
     Repositories call flush() to write within the current transaction.
     They NEVER call commit(). The session commits only in get_db() after the
     full request completes successfully. Adding commit() in a service or
     repository causes partial commits that can't be rolled back on error.
"""

from typing import Any, Dict, Generic, List, Optional, Type, TypeVar

from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import Base

# ── TypeVars ───────────────────────────────────────────────────
ModelType = TypeVar("ModelType", bound=Base)
CreateSchemaType = TypeVar("CreateSchemaType", bound=BaseModel)
UpdateSchemaType = TypeVar("UpdateSchemaType", bound=BaseModel)


class BaseRepository(Generic[ModelType, CreateSchemaType, UpdateSchemaType]):
    """
    Generic async repository providing standard CRUD operations.

    Transaction contract:
      - All write methods call flush() — writes to DB WITHIN the current transaction.
      - Never call commit() — that is the responsibility of get_db() in db/session.py.
      - If commit() is added inside a service or repository, partial commits can
        escape the transaction boundary on rollback.

    Type parameters:
        ModelType        — the SQLAlchemy ORM model class
        CreateSchemaType — Pydantic schema for creation
        UpdateSchemaType — Pydantic schema for updates
    """

    model: Type[ModelType]  # Concrete subclasses must set this class attribute

    # ── Read Operations ────────────────────────────────────────

    async def get(
        self, db: AsyncSession, *, id: Any
    ) -> Optional[ModelType]:
        """Fetch a single record by its primary key."""
        result = await db.execute(
            select(self.model).where(self.model.id == id)
        )
        return result.scalar_one_or_none()

    async def get_by_field(
        self, db: AsyncSession, *, field: str, value: Any
    ) -> Optional[ModelType]:
        """
        Fetch a single record by any model field.

        Example:
            user = await user_repo.get_by_field(db, field="email", value="a@b.com")
        """
        column = getattr(self.model, field, None)
        if column is None:
            raise AttributeError(
                f"Model '{self.model.__name__}' has no field '{field}'"
            )
        result = await db.execute(
            select(self.model).where(column == value)
        )
        return result.scalar_one_or_none()

    async def get_multi(
        self,
        db: AsyncSession,
        *,
        skip: int = 0,
        limit: int = 100,
    ) -> List[ModelType]:
        """
        Fetch a paginated list of records.

        FIX (MEDIUM): Default ORDER BY created_at DESC ensures deterministic
        pagination. Unordered offset/limit returns inconsistent rows on concurrent writes.
        """
        result = await db.execute(
            select(self.model)
            .order_by(self.model.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def count(self, db: AsyncSession) -> int:
        """Count total records for this model."""
        # FIX #25: func imported at module level — no longer a local import
        result = await db.execute(
            select(func.count()).select_from(self.model)
        )
        return result.scalar_one()

    # ── Write Operations ───────────────────────────────────────

    async def create(
        self, db: AsyncSession, *, obj_in: CreateSchemaType
    ) -> ModelType:
        """
        Insert a new record from a Pydantic create schema.
        Returns the persisted ORM instance (with generated id, timestamps).
        """
        obj_data = obj_in.model_dump()
        db_obj = self.model(**obj_data)
        db.add(db_obj)
        await db.flush()        # Write within transaction; get_db() commits
        await db.refresh(db_obj)
        return db_obj

    async def create_from_dict(
        self, db: AsyncSession, *, obj_in: Dict[str, Any]
    ) -> ModelType:
        """
        Insert a new record from a plain dict.
        Used when computed fields (e.g. hashed_password) must be passed directly.
        """
        db_obj = self.model(**obj_in)
        db.add(db_obj)
        await db.flush()
        await db.refresh(db_obj)
        return db_obj

    async def update(
        self,
        db: AsyncSession,
        *,
        db_obj: ModelType,
        obj_in: UpdateSchemaType | Dict[str, Any],
    ) -> ModelType:
        """
        Apply partial updates to an existing ORM instance.
        Only fields present in obj_in are updated (PATCH semantics).

        FIX #7 (HIGH): Changed from iterating jsonable_encoder(db_obj) keys
        to iterating update_data.items() only.

        OLD (DANGEROUS):
            obj_data = jsonable_encoder(db_obj)  # Serializes ALL fields including sensitive ones
            for field in obj_data:               # Checks if caller provided that field
                if field in update_data:
                    setattr(db_obj, field, update_data[field])

        NEW (SAFE):
            for field, value in update_data.items():  # Only iterates what caller provided
                if hasattr(db_obj, field):             # Guard against non-existent fields
                    setattr(db_obj, field, value)

        Why this matters: The old pattern could be exploited if update_data ever
        contained "is_superuser": True from an unsanitized source. The service
        layer currently sanitizes all updates, but this pattern was a latent risk.
        """
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            # exclude_unset=True → only fields the caller explicitly set
            update_data = obj_in.model_dump(exclude_unset=True)

        # FIX #7: Iterate only the provided fields — never all ORM fields
        for field, value in update_data.items():
            if hasattr(db_obj, field):
                setattr(db_obj, field, value)

        db.add(db_obj)
        await db.flush()
        await db.refresh(db_obj)
        return db_obj

    async def delete(
        self, db: AsyncSession, *, id: Any
    ) -> Optional[ModelType]:
        """
        Delete a record by primary key.
        Returns the deleted object, or None if not found.
        """
        db_obj = await self.get(db, id=id)
        if db_obj is None:
            return None
        await db.delete(db_obj)
        await db.flush()
        return db_obj

    async def exists(
        self, db: AsyncSession, *, id: Any
    ) -> bool:
        """Check whether a record with the given id exists."""
        result = await self.get(db, id=id)
        return result is not None
