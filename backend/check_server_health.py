import requests
import time

def check_health():
    try:
        print("Checking /health...")
        resp = requests.get("http://localhost:8000/health", timeout=5)
        print(f"Status: {resp.status_code}")
        print(f"Response: {resp.text}")
    except Exception as e:
        print(f"Health Check Failed: {e}")

def check_model_info():
    try:
        print("\nChecking /api/imaging/model-info...")
        resp = requests.get("http://localhost:8000/api/imaging/model-info", timeout=5)
        print(f"Status: {resp.status_code}")
        print(f"Response: {resp.text}")
    except Exception as e:
        print(f"Model Info Check Failed: {e}")

if __name__ == "__main__":
    check_health()
    check_model_info()
