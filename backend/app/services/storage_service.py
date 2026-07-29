import os
import shutil
import uuid
from pathlib import Path
from fastapi import UploadFile

from app.core.config import settings


class StorageService:
    def __init__(self):
        # In a real app, this path could come from settings
        # The docker-compose mounts ./backend/uploads to /app/uploads
        self.upload_dir = Path("uploads")
        self.upload_dir.mkdir(parents=True, exist_ok=True)

    async def save_file(self, file: UploadFile, user_id: uuid.UUID) -> str:
        """
        Saves an uploaded file to local disk (or S3 in the future).
        Returns the relative file path.
        """
        # Create user-specific subdirectory to prevent collisions
        user_dir = self.upload_dir / str(user_id)
        user_dir.mkdir(parents=True, exist_ok=True)

        # Generate a unique filename to prevent overwriting
        # e.g., <uuid>_filename.pdf
        unique_filename = f"{uuid.uuid4()}_{file.filename}"
        file_path = user_dir / unique_filename

        # Write file in chunks to avoid loading large files in memory
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        return str(file_path)

    def delete_file(self, file_path: str) -> None:
        """
        Deletes a file from storage.
        """
        path = Path(file_path)
        if path.exists() and path.is_file():
            path.unlink()


storage_service = StorageService()
