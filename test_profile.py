import asyncio
import httpx
import time
import os

async def main():
    os.system("echo 'This is a test PDF for measuring pipeline performance. It contains concepts like Database Pagination, Indexing, and Memory Management in Operating Systems. Llama is a great model. Apple computers use ARM.' > perf.txt")
    os.system("mv perf.txt perf.pdf")
    
    email = f"perf_{int(time.time())}@example.com"
    async with httpx.AsyncClient() as client:
        await client.post("http://localhost:8000/api/v1/auth/register", json={
            "email": email, "password": "password123", "full_name": "Perf"
        })
        resp = await client.post("http://localhost:8000/api/v1/auth/login", data={
            "username": email, "password": "password123"
        })
        token = resp.json().get("access_token")
        
        if not token:
            print("Login failed!")
            return
            
        headers = {"Authorization": f"Bearer {token}"}
        
        with open("perf.pdf", "rb") as f:
            up = await client.post("http://localhost:8000/api/v1/documents/", files={"file": ("perf.pdf", f, "application/pdf")}, headers=headers)
        
        doc_id = up.json()["id"]
        print(f"Uploaded: {doc_id}")
        
        # Poll
        while True:
            r = await client.get(f"http://localhost:8000/api/v1/documents/{doc_id}", headers=headers)
            data = r.json()
            print(f"Status: {data['status']}, Ready: {data['quiz_ready']}")
            if data["quiz_ready"] == 1 or data["status"] == "FAILED":
                break
            await asyncio.sleep(2)
            
if __name__ == "__main__":
    asyncio.run(main())
