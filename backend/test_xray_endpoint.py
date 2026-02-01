import requests
import sys

def test_xray():
    url = "http://localhost:8000/api/imaging/model-info"
    try:
        print(f"Testing X-Ray Model Info: {url}")
        resp = requests.get(url)
        print(f"Status: {resp.status_code}")
        print(f"Response: {resp.text}")
        if resp.status_code == 200:
            print("SUCCESS: X-Ray Model Info available")
            return True
        else:
            print("FAILURE: X-Ray Model Info unavailable")
            return False
    except Exception as e:
        print(f"ERROR: {e}")
        return False

if __name__ == "__main__":
    test_xray()
