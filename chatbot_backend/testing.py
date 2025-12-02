import os
from dotenv import load_dotenv
import requests

load_dotenv()
API_KEY = os.getenv("GROQ_API_KEY")

response = requests.post(
    "https://api.groq.com/openai/v1/chat/completions",
    headers={
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    },
    json={
        "model": "llama3-70b-8192",
        "messages": [
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": "What is PAF-IAST?"}
        ]
    }
)

print("Status:", response.status_code)
print("Response:", response.text)
