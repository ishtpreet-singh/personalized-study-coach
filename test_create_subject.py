import requests

url = "http://localhost:8000/api/v1/auth/login"
payload = {
    "email": "aulakhishtsingh21@gmail.com",
    "password": "Isht@1234"
}
res = requests.post(url, json=payload)
if res.status_code != 200:
    print("Login failed:", res.text)
    exit(1)

token = res.json().get("access_token")

subject_payload = {
    "name": "Machine Learning",
    "semester": "Fall 2024",
    "color": "indigo",
    "icon": "🧠"
}

res2 = requests.post(
    "http://localhost:8000/api/v1/subjects", 
    json=subject_payload,
    headers={"Authorization": f"Bearer {token}"}
)

print(f"Status: {res2.status_code}")
print(f"Response: {res2.text}")
