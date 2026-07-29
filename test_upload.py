import requests
import json
import time

base_url = "http://localhost:8000/api/v1"
password = "Password123!"
email = f"test_{int(time.time())}@example.com"

try:
    print("Registering...")
    resp = requests.post(f"{base_url}/auth/register", json={"email": email, "password": password, "full_name": "Test User"})
    print("Register:", resp.status_code)

    print("Logging in...")
    resp = requests.post(f"{base_url}/auth/login", json={"email": email, "password": password})
    print("Login:", resp.status_code)
    token = resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    with open("dummy.txt", "w") as f:
        f.write("This is a test document with some content to be embedded. It should be long enough to at least extract one chunk. We are testing the background worker session fix.")

    print("Uploading...")
    files = {'file': ('dummy.txt', open('dummy.txt', 'rb'), 'text/plain')}
    resp = requests.post(f"{base_url}/documents/upload", headers=headers, files=files)
    print("Upload:", resp.status_code)
    
    if resp.status_code == 201:
        doc_id = resp.json()["id"]
        print(f"Document ID: {doc_id}")
        for _ in range(10):
            time.sleep(2)
            resp = requests.get(f"{base_url}/documents/{doc_id}", headers=headers)
            status = resp.json().get("status")
            print(f"Status: {status}")
            if status in ["COMPLETED", "FAILED"]:
                break
except Exception as e:
    print("Error:", e)
