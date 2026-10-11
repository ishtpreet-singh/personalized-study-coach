import logging
import os
import re
import shutil
import uuid
from pathlib import Path
from typing import Optional
from fastapi import UploadFile
import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)


def sanitize_filename(filename: str) -> str:
    """Sanitize user-supplied filename to prevent directory traversal or invalid characters."""
    clean = re.sub(r"[^a-zA-Z0-9_.-]", "_", filename)
    clean = clean.strip("._")
    return clean or "document"


class StorageService:
    def __init__(self):
        self.upload_dir = Path("uploads")
        self.upload_dir.mkdir(parents=True, exist_ok=True)

    @property
    def is_supabase_enabled(self) -> bool:
        """Check if Supabase Storage credentials are configured."""
        return bool(settings.SUPABASE_URL and settings.SUPABASE_SERVICE_ROLE_KEY)

    def _get_supabase_headers(self) -> dict:
        return {
            "Authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY}",
            "apikey": settings.SUPABASE_SERVICE_ROLE_KEY,
        }

    def _get_storage_key(self, user_id: uuid.UUID, unique_filename: str) -> str:
        """Structured bucket path: {user_id}/{unique_filename}"""
        return f"{user_id}/{unique_filename}"

    async def _upload_to_supabase(self, storage_key: str, file_bytes: bytes, content_type: str) -> bool:
        """Upload file bytes to private Supabase Storage bucket."""
        if not self.is_supabase_enabled:
            return False

        url = f"{settings.SUPABASE_URL.rstrip('/')}/storage/v1/object/{settings.SUPABASE_STORAGE_BUCKET}/{storage_key}"
        headers = self._get_supabase_headers()
        headers["Content-Type"] = content_type or "application/octet-stream"

        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(url, headers=headers, content=file_bytes)
                if response.status_code in (200, 201):
                    logger.info(f"Successfully uploaded {storage_key} to Supabase Storage.")
                    return True
                else:
                    logger.error(f"Supabase Storage upload failed ({response.status_code}): {response.text}")
                    return False
        except Exception as e:
            logger.error(f"Supabase Storage upload exception for {storage_key}: {e}")
            return False

    async def _download_from_supabase(self, storage_key: str, destination_path: Path) -> bool:
        """Download file from private Supabase Storage bucket to local destination."""
        if not self.is_supabase_enabled:
            return False

        url = f"{settings.SUPABASE_URL.rstrip('/')}/storage/v1/object/authenticated/{settings.SUPABASE_STORAGE_BUCKET}/{storage_key}"
        headers = self._get_supabase_headers()

        try:
            destination_path.parent.mkdir(parents=True, exist_ok=True)
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.get(url, headers=headers)
                if response.status_code == 200:
                    with open(destination_path, "wb") as f:
                        f.write(response.content)
                    logger.info(f"Successfully downloaded {storage_key} from Supabase Storage to {destination_path}.")
                    return True
                else:
                    logger.error(f"Supabase Storage download failed ({response.status_code}): {response.text}")
                    return False
        except Exception as e:
            logger.error(f"Supabase Storage download exception for {storage_key}: {e}")
            return False

    async def _delete_from_supabase(self, storage_key: str) -> bool:
        """Delete file from private Supabase Storage bucket."""
        if not self.is_supabase_enabled:
            return False

        url = f"{settings.SUPABASE_URL.rstrip('/')}/storage/v1/object/{settings.SUPABASE_STORAGE_BUCKET}/{storage_key}"
        headers = self._get_supabase_headers()

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.delete(url, headers=headers)
                if response.status_code in (200, 204):
                    logger.info(f"Successfully deleted {storage_key} from Supabase Storage.")
                    return True
                else:
                    logger.warning(f"Supabase Storage delete returned ({response.status_code}): {response.text}")
                    return False
        except Exception as e:
            logger.error(f"Supabase Storage delete exception for {storage_key}: {e}")
            return False

    async def save_file(self, file: UploadFile, user_id: uuid.UUID) -> str:
        """
        Saves an uploaded file to local disk and replicates to Supabase Storage if enabled.
        Returns the local relative file path (which encodes user_id and unique filename).
        """
        user_dir = self.upload_dir / str(user_id)
        user_dir.mkdir(parents=True, exist_ok=True)

        safe_name = sanitize_filename(file.filename or "upload")
        unique_filename = f"{uuid.uuid4()}_{safe_name}"
        file_path = user_dir / unique_filename

        # Write to local file first
        content = await file.read()
        with open(file_path, "wb") as buffer:
            buffer.write(content)

        # Reset cursor so subsequent reads work
        await file.seek(0)

        # If Supabase Storage is enabled, upload to bucket
        if self.is_supabase_enabled:
            storage_key = self._get_storage_key(user_id, unique_filename)
            await self._upload_to_supabase(storage_key, content, file.content_type or "")

        return str(file_path)

    async def ensure_local_file(self, file_path: str) -> str:
        """
        Ensures the file is present on local disk.
        If missing locally (e.g., after a container restart or deployment on Render),
        fetches it from Supabase Storage.
        """
        path = Path(file_path)
        if path.exists() and path.is_file():
            return str(path)

        # If file missing on disk, attempt retrieval from Supabase
        if self.is_supabase_enabled:
            parts = path.parts
            if len(parts) >= 2:
                # Expected format: uploads/<user_id>/<filename>
                user_id_str = parts[-2]
                filename = parts[-1]
                storage_key = f"{user_id_str}/{filename}"
                success = await self._download_from_supabase(storage_key, path)
                if success and path.exists():
                    return str(path)

        raise FileNotFoundError(f"File not found locally or in Supabase Storage: {file_path}")

    async def delete_file(self, file_path: str) -> None:
        """
        Deletes a file from local disk and Supabase Storage.
        """
        path = Path(file_path)
        if path.exists() and path.is_file():
            try:
                path.unlink()
            except Exception as e:
                logger.warning(f"Error deleting local file {file_path}: {e}")

        if self.is_supabase_enabled:
            parts = path.parts
            if len(parts) >= 2:
                user_id_str = parts[-2]
                filename = parts[-1]
                storage_key = f"{user_id_str}/{filename}"
                await self._delete_from_supabase(storage_key)


storage_service = StorageService()
