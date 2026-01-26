import sys
import os

# Add project root to path so we can import 'backend'
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../")))

from fastapi.testclient import TestClient
from backend.app import app
import logging
import io

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

def test_synthesis_analyze_flow():
    # Mock X-Ray
    xray_content = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82'
    
    # Mock Clinical Note
    text_content = b"Patient reports severe chest pain. Critical condition."
    
    files = [
        ('files', ('chest_xray.png', xray_content, 'image/png')),
        ('files', ('notes.txt', text_content, 'text/plain'))
    ]
    
    response = client.post("/api/synthesis/analyze", files=files)
    
    assert response.status_code == 200
    data = response.json()
    
    # Contract Checks
    assert data["overall_status"] is not None
    assert data["intensity_level"] in ["Low", "Moderate", "High", "Critical"]
    assert data["imaging_artifact"]["modality"] == "X-Ray"
    # Check if 'critical' flag in text influenced the risk (RiskEngine logic)
    # 0.2 (text) + ... should be > 0.
    assert data["signal_intensity_probability"] > 0
