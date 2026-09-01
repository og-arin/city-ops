import os
import requests
from dotenv import load_dotenv

# Load the variables from your .env file
load_dotenv()

api_key = os.getenv("GROQ_API_KEY")

if not api_key:
    print("❌ GROQ_API_KEY not found in .env file!")
    exit()

print("🔍 Fetching available Groq models for your API key...\n")

url = "https://api.groq.com/openai/v1/models"
headers = {
    "Authorization": f"Bearer {api_key}",
    "Content-Type": "application/json"
}

response = requests.get(url, headers=headers)

if response.status_code == 200:
    data = response.json()
    models = [model["id"] for model in data.get("data", [])]
    
    print("✅ Available Models you can paste into your .env:")
    print("-" * 40)
    for m in sorted(models):
        print(m)
else:
    print(f"❌ Failed to fetch models. Status Code: {response.status_code}")
    print(response.text)