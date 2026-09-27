import requests
import time
import os

BASE_URL = "http://localhost:8000/api/v1"

# 1. Login
response = requests.post(
    f"{BASE_URL}/auth/login",
    data={"username": "test@example.com", "password": "password123"}
)
if response.status_code != 200:
    print(f"Login failed: {response.text}")
    exit(1)
token = response.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}

# Create a dummy pdf file
with open("test_doc.txt", "w") as f:
    f.write("Operating Systems handle memory management. One key concept is pagination, which allows the OS to retrieve data from secondary storage in same-size blocks called pages. Another concept is scheduling, which decides which process runs at a given time. For scheduling, Round Robin is a popular algorithm where each process gets a small unit of CPU time called a time quantum.")

# 2. Upload Document
with open("test_doc.txt", "rb") as f:
    files = {"file": ("test_doc.txt", f, "text/plain")}
    response = requests.post(f"{BASE_URL}/documents/upload", headers=headers, files=files)

if response.status_code != 201:
    print(f"Upload failed: {response.text}")
    exit(1)
    
doc_id = response.json()["id"]
print(f"Uploaded document: {doc_id}")

# 3. Poll Status
start_time = time.time()
while True:
    res = requests.get(f"{BASE_URL}/documents/{doc_id}", headers=headers)
    status = res.json()["status"]
    print(f"Current Status: {status}")
    
    if status == "COMPLETED" or status == "FAILED":
        print(f"Pipeline finished with status: {status}")
        if status == "FAILED":
            print(f"Error: {res.json().get('error_message')}")
        break
        
    if time.time() - start_time > 180:
        print("Timeout waiting for pipeline")
        break
        
    time.sleep(3)

print(res.json())

# 4. Verify AI Tutor
print("Testing AI Tutor...")
res = requests.post(f"{BASE_URL}/tutor/chat", headers=headers, json={"message": "What is pagination?", "document_id": doc_id})
print(res.status_code)
if res.status_code == 200:
    print(res.json()["answer"][:100] + "...")
else:
    print(res.text)

# 5. Delete Document
print(f"Deleting document {doc_id}...")
res = requests.delete(f"{BASE_URL}/documents/{doc_id}", headers=headers)
print(f"Delete status: {res.status_code}")
if res.status_code != 204:
    print(res.text)

