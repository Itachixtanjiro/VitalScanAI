"""Sample test cases endpoint for demo purposes."""
import os
import base64
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from typing import List
from pydantic import BaseModel

router = APIRouter()

# Sample cases metadata - maps to actual images in public/samples/
SAMPLE_CASES = [
    {
        "id": "pneumonia_01",
        "name": "Pneumonia Case 1",
        "description": "Right lower lobe infiltrate consistent with pneumonia",
        "expected_findings": ["Pneumonia", "Infiltration"],
        "category": "xray",
        "filename": "pneumonia_sample_01.png"
    },
    {
        "id": "cardiomegaly_01",
        "name": "Cardiomegaly Case",
        "description": "Enlarged cardiac silhouette with CTR > 0.5",
        "expected_findings": ["Cardiomegaly"],
        "category": "xray",
        "filename": "cardiomegaly_sample_01.png"
    },
    {
        "id": "normal_01",
        "name": "Normal Chest X-Ray",
        "description": "No acute cardiopulmonary abnormality",
        "expected_findings": ["No Finding"],
        "category": "xray",
        "filename": "normal_sample_01.png"
    },
    {
        "id": "effusion_01",
        "name": "Pleural Effusion Case",
        "description": "Bilateral pleural effusions, left greater than right",
        "expected_findings": ["Effusion"],
        "category": "xray",
        "filename": "effusion_sample_01.png"
    },
    {
        "id": "nodule_01",
        "name": "Pulmonary Nodule Case",
        "description": "Solitary pulmonary nodule in right upper lobe",
        "expected_findings": ["Nodule", "Mass"],
        "category": "xray",
        "filename": "nodule_sample_01.png"
    },
    {
        "id": "clinical_note_01",
        "name": "Hypertension Follow-up",
        "description": "Follow-up visit for hypertension management with BP readings",
        "expected_findings": ["Hypertension", "Lisinopril"],
        "category": "clinical_notes",
        "filename": "hypertension_note.txt"
    },
    {
        "id": "clinical_note_02",
        "name": "Diabetes Management",
        "description": "Type 2 diabetes check with lab results and medication adjustment",
        "expected_findings": ["Diabetes Mellitus", "Metformin"],
        "category": "clinical_notes",
        "filename": "diabetes_note.txt"
    },
    {
        "id": "clinical_note_03",
        "name": "Acute Bronchitis",
        "description": "Acute bronchitis presentation with respiratory symptoms",
        "expected_findings": ["Acute bronchitis", "Acetaminophen"],
        "category": "clinical_notes",
        "filename": "bronchitis_note.txt"
    }
]

class SampleCase(BaseModel):
    id: str
    name: str
    description: str
    expected_findings: List[str]
    category: str
    filename: str
    available: bool = False


def _get_samples_dir():
    """Get absolute path to samples directory."""
    base = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    return os.path.join(base, "..", "public", "samples")


@router.get("/list", response_model=List[SampleCase])
async def list_sample_cases(category: str = None):
    """List available sample test cases."""
    samples_dir = _get_samples_dir()
    results = []

    for sample in SAMPLE_CASES:
        if category and sample["category"] != category:
            continue

        # Check if file actually exists
        file_path = os.path.join(samples_dir, sample["category"], sample["filename"])
        available = os.path.exists(file_path)

        results.append(SampleCase(
            **sample,
            available=available
        ))

    return results


@router.get("/image/{category}/{filename}")
async def get_sample_image(category: str, filename: str):
    """Serve a sample image file."""
    samples_dir = _get_samples_dir()
    file_path = os.path.join(samples_dir, category, filename)

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail=f"Sample image not found: {filename}")

    return FileResponse(file_path, media_type="image/png")


@router.get("/base64/{sample_id}")
async def get_sample_base64(sample_id: str):
    """Get sample image as base64 for direct API testing."""
    sample = next((s for s in SAMPLE_CASES if s["id"] == sample_id), None)
    if not sample:
        raise HTTPException(status_code=404, detail="Sample not found")

    samples_dir = _get_samples_dir()
    file_path = os.path.join(samples_dir, sample["category"], sample["filename"])

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Sample image file not available")

    with open(file_path, "rb") as f:
        img_data = base64.b64encode(f.read()).decode('utf-8')

    return {
        "id": sample_id,
        "name": sample["name"],
        "expected_findings": sample["expected_findings"],
        "image_base64": f"data:image/png;base64,{img_data}"
    }
