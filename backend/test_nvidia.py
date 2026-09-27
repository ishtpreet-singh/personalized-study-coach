import os
import requests
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("NVIDIA_API_KEY")
if not api_key:
    print("NVIDIA_API_KEY is missing.")
    exit(1)

url = "https://integrate.api.nvidia.com/v1/chat/completions"
headers = {
    "Authorization": f"Bearer {api_key}",
    "Content-Type": "application/json"
}
data = {
    "model": "meta/llama-3.1-8b-instruct",
    "messages": [{"role": "user", "content": "Hello"}],
    "max_tokens": 50
}

try:
    print("Sending request to NVIDIA API...")
    response = requests.post(url, headers=headers, json=data)
    response.raise_for_status()
    print("Success!")
    print(response.json())
except Exception as e:
    print("Failed!")
    print(e)
