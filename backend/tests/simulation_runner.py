import sys
import os
import io
# Add logic to ensure we can import backend modules from root
sys.path.append(os.getcwd())

from fastapi.testclient import TestClient
from backend.app import app
import logging
import json

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("simulation")

print(">>> SCRIPT INITIALIZING <<<", flush=True)
try:
    client = TestClient(app)
    print(">>> APP LOADED <<<", flush=True)
except Exception as e:
    print(f"FAILED TO LOAD APP: {e}", flush=True)
    exit(1)

def run_simulation():
    print(">>> STARTING END-TO-END SIMULATION <<<", flush=True)
    
    # 1. Create Mock Artifacts
    # X-Ray (1x1 PNG - minimal valid png)
    # Signature: 89 50 4E 47 0D 0A 1A 0A
    xray_content = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82'
    
    # Clinical Text
    # We include 'abnormal' just to see if it catches (though mock LLM might ignore inputs)
    text_content = b"Patient presents with abnormal heart rhythms."
    
    files = [
        ('files', ('chest_xray.png', xray_content, 'image/png')),
        ('files', ('clinical_notes.txt', text_content, 'text/plain'))
    ]
    
    # 2. Fire Request
    logger.info("Sending POST /api/synthesis/analyze...")
    try:
        response = client.post("/api/synthesis/analyze", files=files)
    except Exception as e:
        logger.error(f"Request failed: {e}")
        return

    # 3. Validation
    if response.status_code != 200:
        logger.error(f"Simulation Failed! Status: {response.status_code}")
        logger.error(f"Response: {response.text}")
        return
        
    data = response.json()
    logger.info(f"Simulation Status: {response.status_code}")
    
    # 4. Strict Contract Checks
    try:
        assert "overall_status" in data, "Missing overall_status"
        assert "narrative_summary" in data, "Missing narrative_summary"
        
        if data.get("imaging_artifact"):
            img = data["imaging_artifact"]
            assert img["modality"] == "X-Ray", "Wrong modality"
            assert "source_data" in img, "Missing source_data"
            assert img["findings"], "Missing findings"
            
        logger.info("Contract Validation: PASSED")
        
    except AssertionError as e:
        logger.error(f"Contract Validation FAILED: {e}")
    
    print("\n--- SERVER RESPONSE (JSON) ---")
    print(json.dumps(data, indent=2))
    print("-------------------------------")

if __name__ == "__main__":
    run_simulation()
