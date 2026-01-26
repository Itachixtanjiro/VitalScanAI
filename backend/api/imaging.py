import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import time
import logging
from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional
from ml.xray_model import xray_model
from ml.preprocess import ImagePreprocessor
from ml.gradcam import gradcam

logger = logging.getLogger(__name__)

router = APIRouter()

class AnalysisResult(BaseModel):
    malignancy_risk: float
    confidence: float
    model_version: str
    heatmap_base64: Optional[str] = None
    inference_time_ms: float
    findings: List[str]

@router.post("/analyze", response_model=AnalysisResult)
async def analyze_image(file: UploadFile = File(...)):
    """
    Uploads an image, runs it through the frozen ML model, 
    and returns probability metrics, latency stats, and GradCAM heatmap.
    """
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="Invalid file type. Only images allowed.")

    start_time = time.time()
    
    try:
        # 1. Read File
        contents = await file.read()
        
        # 2. Preprocess (Deterministic)
        preprocessed_data = ImagePreprocessor.preprocess(contents)
        
        # 3. Inference (Frozen Model)
        prediction = xray_model.predict(preprocessed_data)
        
        # 4. Explainability (GradCAM) with ROI markers
        heatmap = gradcam.generate(
            preprocessed_data,
            target_class="malignant",
            risk_score=prediction["malignancy_risk"],
            add_roi_markers=True
        )
        
        # Calculate Latency
        end_time = time.time()
        latency_ms = round((end_time - start_time) * 1000, 2)
        
        logger.info(f"Inference completed in {latency_ms}ms | Risk: {prediction['malignancy_risk']}")

        return {
            "malignancy_risk": prediction["malignancy_risk"],
            "confidence": prediction["confidence"],
            "model_version": prediction["model_version"],
            "heatmap_base64": heatmap,
            "inference_time_ms": latency_ms,
            "findings": ["Analysis completed successfully."]
        }

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Inference error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal processing error.")
