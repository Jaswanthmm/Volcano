
import requests
import sys

try:
    print("Attempting to connect to http://localhost:8080...")
    response = requests.get("http://localhost:8080", timeout=5)
    print(f"Status Code: {response.status_code}")
    print(f"Content Length: {len(response.content)}")
    print("First 200 chars:")
    print(response.text[:200])
    
    if response.status_code == 200 and "<html" in response.text.lower():
        print("[SUCCESS] Server is returning HTML.")
    else:
        print("[WARNING] Server returned non-200 or non-HTML.")

except Exception as e:
    print(f"[FAILURE] Could not connect. {e}")
