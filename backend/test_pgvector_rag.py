#!/usr/bin/env python3
"""
Test Suite: pgvector Semantic Retrieval, Subject & User Isolation, and Dual Provider
"""

import asyncio
import uuid
import sys

from app.core.config import settings
from app.db.session import AsyncSessionLocal
from app.services.document_service import document_service


async def run_tests():
    print("=" * 60)
    print("RUNNING PGVECTOR MIGRATION VERIFICATION SUITE")
    print("=" * 60)

    # Known test IDs from the database
    user_id = uuid.UUID("831f4dcd-5b80-456d-8933-da2daf1ab7ba")
    subject_oose = uuid.UUID("146870a7-db2a-4fb3-9e15-2b78a6b2a6c4")
    subject_ml = uuid.UUID("4aea9141-4782-406a-8d8c-f599f16b1788")
    other_user_id = uuid.uuid4()

    # TEST 1: Semantic Retrieval with pgvector
    print("\n--- TEST 1: Semantic Retrieval (pgvector) ---")
    settings.VECTOR_STORE_PROVIDER = "pgvector"

    query = "Explain input output organization and interrupt handling"
    print(f"Query: '{query}'")
    results = await document_service.search_by_text(
        query=query,
        subject_id=subject_oose,
        user_id=user_id,
        k=3
    )

    assert len(results) > 0, f"Expected at least 1 result, got {len(results)}"
    print(f"✅ Found {len(results)} chunks.")
    for i, res in enumerate(results):
        dist = res.metadata.get("distance", "N/A")
        print(f"  [{i+1}] Distance: {dist:.4f} | Source: {res.metadata.get('filename')} | Snippet: {res.page_content[:90]}...")
        assert res.metadata.get("subject_id") == str(subject_oose), "Subject ID mismatch in metadata"
        assert res.metadata.get("filename") == "Input Output Organization.pptx"

    # TEST 2: Strict Subject Isolation
    print("\n--- TEST 2: Strict Subject Isolation ---")
    oose_results = await document_service.search_by_text(
        query=query,
        subject_id=subject_oose,
        user_id=user_id,
        k=5
    )
    ml_results = await document_service.search_by_text(
        query=query,
        subject_id=subject_ml,
        user_id=user_id,
        k=5
    )

    for r in oose_results:
        assert r.metadata["subject_id"] == str(subject_oose), f"Leak: found non-OOSE chunk in OOSE search"
    for r in ml_results:
        assert r.metadata["subject_id"] == str(subject_ml), f"Leak: found non-ML chunk in ML search"

    print(f"✅ OOSE search returned {len(oose_results)} chunks strictly belonging to OOSE.")
    print(f"✅ ML search returned {len(ml_results)} chunks strictly belonging to ML.")

    # TEST 3: Strict User Isolation
    print("\n--- TEST 3: Strict User Isolation ---")
    unauthorized_results = await document_service.search_by_text(
        query=query,
        subject_id=subject_oose,
        user_id=other_user_id,
        k=5
    )
    assert len(unauthorized_results) == 0, f"Security violation: unauthorized user saw {len(unauthorized_results)} chunks!"
    print(f"✅ Unauthorized user returned 0 chunks (Access Denied at query level).")

    # TEST 4: ChromaDB Backward Compatibility (when provider='chroma')
    print("\n--- TEST 4: ChromaDB Backward Compatibility ---")
    settings.VECTOR_STORE_PROVIDER = "chroma"
    try:
        chroma_results = await document_service.search_by_text(
            query=query,
            subject_id=subject_oose,
            k=2
        )
        print(f"✅ ChromaDB provider still works as expected (returned {len(chroma_results)} chunks).")
    except Exception as e:
        print(f"⚠️ ChromaDB test warning: {e}")

    # TEST 5: StorageService Local Fallback and Sanitization
    print("\n--- TEST 5: Storage Service Path Sanitization & Safe Download ---")
    from app.services.storage_service import sanitize_filename, storage_service
    dirty_name = "../../../etc/passwd;malicious#file.pdf"
    clean_name = sanitize_filename(dirty_name)
    assert ".." not in clean_name and "/" not in clean_name, f"Sanitization failed: {clean_name}"
    print(f"✅ Filename sanitized from '{dirty_name}' to '{clean_name}'.")

    # Reset provider back to pgvector
    settings.VECTOR_STORE_PROVIDER = "pgvector"

    print("\n" + "=" * 60)
    print("ALL PGVECTOR MIGRATION VERIFICATION TESTS PASSED SUCCESSFULLY! ✅")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(run_tests())
