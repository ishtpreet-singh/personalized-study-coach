import asyncio
import httpx
import time
from pathlib import Path
import os

async def test_upload():
    # Make a dummy PDF
    os.system("echo 'This is a test PDF for measuring pipeline performance. It contains concepts like Database Pagination, Indexing, and Memory Management in Operating Systems.' > test_perf.txt")
    os.system("mv test_perf.txt test_perf.pdf")
    
    # Login to get token
    async with httpx.AsyncClient() as client:
        # We need a valid token. Let's register a temporary user
        email = f"perf_{int(time.time())}@example.com"
        await client.post("http://localhost:8000/api/v1/auth/register", json={
            "email": email, "password": "password123", "full_name": "Perf User"
        })
        resp = await client.post("http://localhost:8000/api/v1/auth/login", data={
            "username": email, "password": "password123"
        })
        token = resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Upload
        print("Uploading document...")
        start_time = time.time()
        with open("test_perf.pdf", "rb") as f:
            files = {"file": ("test_perf.pdf", f, "application/pdf")}
            up_resp = await client.post("http://localhost:8000/api/v1/documents/", files=files, headers=headers)
        
        doc_id = up_resp.json()["id"]
        print(f"Uploaded doc {doc_id}. Waiting for completion...")
        
        # Poll
        while True:
            d_resp = await client.get(f"http://localhost:8000/api/v1/documents/{doc_id}", headers=headers)
            status = d_resp.json()["status"]
            print(f"Status: {status} at {time.time() - start_time:.1f}s")
            if status in ["COMPLETED", "FAILED"]:
                break
            await asyncio.sleep(2)

        print(f"Finished in {time.time() - start_time:.1f}s with status {status}")

if __name__ == "__main__":
    asyncio.run(test_upload())
