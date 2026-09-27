import requests

url = "http://localhost:8000/api/v1/auth/login"
payload = {
    "username": "aulakhishtsingh21@gmail.com",
    "password": "Isht@1234"
}
# FastAPI OAuth2PasswordRequestForm expects form data (x-www-form-urlencoded), not JSON!
# Let's verify what the frontend is sending.
res = requests.post(url, data=payload)
print(res.status_code)
print(res.text)

# Also test json just in case
res2 = requests.post(url, json={"email": "aulakhishtsingh21@gmail.com", "password": "Isht@1234"})
print("JSON attempt:")
print(res2.status_code)
print(res2.text)
