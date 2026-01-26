import requests
import json

BASE_URL = "http://localhost:8000"

def test_xray():
    print("\n[1] Testing X-Ray Endpoint...")
    # Create a dummy image
    try:
        files = {'file': ('test.txt', b'fake image data', 'image/png')} # Will fail image processing but should hit endpoint
        # Sending with and without slash to see behavior
        url = f"{BASE_URL}/api/imaging/predict/chest-xray/"
        resp = requests.post(url, files=files) 
        if resp.status_code == 500 and "cannot identify image file" in resp.text:
             print("SUCCESS: Endpoint reached (rejected invalid image as expected).")
        elif resp.status_code == 200:
             print("SUCCESS: Endpoint reached and processed.")
        else:
             print(f"FAILURE: Status {resp.status_code} | {resp.text}")
    except Exception as e:
        print(f"FAILURE: Connection error {e}")

def test_diabetes():
    print("\n[2] Testing Diabetes Endpoint...")
    data = {
         "Pregnancies": 1, "Glucose": 120, "BloodPressure": 70, "SkinThickness": 20,
         "Insulin": 80, "BMI": 25.0, "DiabetesPedigreeFunction": 0.5, "Age": 30
    }
    url = f"{BASE_URL}/api/risk/predict/diabetes/"
    try:
        resp = requests.post(url, json=data)
        if resp.status_code == 200:
            print(f"SUCCESS: {resp.json()}")
        else:
            print(f"FAILURE: Status {resp.status_code} | {resp.text}")
    except Exception as e:
        print(f"FAILURE: Connection error {e}")

def test_report():
    print("\n[3] Testing Report Endpoint...")
    try:
        # Create dummy PDF
        files = {'file': ('test.pdf', b'%PDF-1.4 dummy content', 'application/pdf')}
        url = f"{BASE_URL}/api/analysis/report/"
        resp = requests.post(url, files=files)
        if resp.status_code == 200:
             print(f"SUCCESS: {resp.json()}")
        else:
             print(f"FAILURE: Status {resp.status_code} | {resp.text}")
    except Exception as e:
        print(f"FAILURE: Connection error {e}")

if __name__ == "__main__":
    test_xray()
    test_diabetes()
    test_report()
