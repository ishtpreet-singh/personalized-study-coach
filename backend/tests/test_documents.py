import uuid
from unittest.mock import patch, AsyncMock
from httpx import AsyncClient

import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.document import Document, DocumentStatus
from app.models.user import User

VALID_USER = {
    "email": "doctest@example.com",
    "full_name": "Doc User",
    "password": "SecurePass1!",
}

@pytest.fixture
def mock_storage_service():
    with patch("app.api.v1.routes.documents.storage_service.save_file", new_callable=AsyncMock) as mock_save:
        mock_save.return_value = "uploads/test_user/test_file.pdf"
        yield mock_save


@pytest.fixture
def mock_document_service():
    with patch("app.api.v1.routes.documents.document_service.process_document", new_callable=AsyncMock) as mock_process:
        yield mock_process


@pytest.fixture
async def authenticated_client(client: AsyncClient, db_session: AsyncSession):
    # Register
    await client.post("/api/v1/auth/register", json=VALID_USER)
    # Login
    resp = await client.post(
        "/api/v1/auth/login",
        json={"email": VALID_USER["email"], "password": VALID_USER["password"]},
    )
    token = resp.json()["access_token"]
    client.headers = {"Authorization": f"Bearer {token}"}
    return client


@pytest.fixture
async def current_user(db_session: AsyncSession):
    # Retrieve the user created by authenticated_client
    stmt = select(User).where(User.email == VALID_USER["email"])
    result = await db_session.execute(stmt)
    return result.scalar_one()


@pytest.mark.asyncio
async def test_upload_document_success(
    authenticated_client: AsyncClient,
    mock_storage_service,
    mock_document_service,
):
    """
    Test successful document upload.
    """
    # Create a dummy file in memory to upload
    files = {"file": ("test.pdf", b"dummy pdf content", "application/pdf")}
    
    response = await authenticated_client.post(
        "/api/v1/documents/upload",
        files=files,
    )
    
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "test.pdf"
    assert data["file_type"] == "application/pdf"
    assert data["status"] == "PENDING"
    assert "id" in data
    
    mock_storage_service.assert_called_once()
    # Note: FastAPIs background tasks are executed after the response is sent. 
    # For testing the router endpoint, we just mock the process_document task


@pytest.mark.asyncio
async def test_upload_document_invalid_type(
    authenticated_client: AsyncClient,
):
    """
    Test uploading an invalid file type.
    """
    files = {"file": ("test.exe", b"dummy content", "application/x-msdownload")}
    
    response = await authenticated_client.post(
        "/api/v1/documents/upload",
        files=files,
    )
    
    assert response.status_code == 400
    assert "Unsupported file type" in response.text


@pytest.mark.asyncio
async def test_list_documents(
    authenticated_client: AsyncClient,
    db_session: AsyncSession,
    current_user: User,
):
    """
    Test listing documents.
    """
    # Create some documents in the DB
    doc1 = Document(
        user_id=current_user.id,
        title="Doc 1",
        file_type="application/pdf",
        file_path="uploads/doc1.pdf",
        file_size=1024,
        status=DocumentStatus.COMPLETED
    )
    doc2 = Document(
        user_id=current_user.id,
        title="Doc 2",
        file_type="text/plain",
        file_path="uploads/doc2.txt",
        file_size=512,
        status=DocumentStatus.PENDING
    )
    db_session.add(doc1)
    db_session.add(doc2)
    await db_session.commit()
    
    response = await authenticated_client.get("/api/v1/documents")
    
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 2
    
    titles = [item["title"] for item in data["items"]]
    assert "Doc 1" in titles
    assert "Doc 2" in titles
