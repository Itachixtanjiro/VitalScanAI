import requests
import time
import os

URL = "http://localhost:8000/api/imaging/predict/chest-xray"
IMAGE_PATH = "public/samples/xray/normal_sample_01.png"

def test_endpoint(include_gradcam):
    print(f"\n--- Testing with include_gradcam={include_gradcam} ---")
    try:
        if not os.path.exists(IMAGE_PATH):
            print(f"Error: Image not found at {IMAGE_PATH}")
            return

        files = {'file': open(IMAGE_PATH, 'rb')}
        params = {'include_gradcam': str(include_gradcam).lower()}
        
        start_time = time.time()
        response = requests.post(URL, files=files, params=params)
        duration = time.time() - start_time
        
        print(f"Status Code: {response.status_code}")
        print(f"Time Taken: {duration:.2f}s")
        
        if response.status_code == 200:
            data = response.json()
            enc_heatmap = data.get('gradcam_heatmap')
            print(f"Grad-CAM Key Exists: {'gradcam_heatmap' in data}")
            print(f"Grad-CAM Data Length: {len(enc_heatmap) if enc_heatmap else 0}")
        else:
            print(f"Error Response: {response.text}")
            
    except Exception as e:
        print(f"Exception: {e}")

if __name__ == "__main__":
    test_endpoint(False)
    test_endpoint(True)
