import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import io
import time
import asyncio
import logging
import numpy as np
import tensorflow as tf
from PIL import Image
from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from api.model_loader import ModelLoader, ModelLoadError
from ml.bbox_generator import generate_bounding_boxes, format_for_frontend

logger = logging.getLogger(__name__)

router = APIRouter()

# Image preprocessing constants
IMG_SIZE = (224, 224)
CLASSES = ['Atelectasis', 'Cardiomegaly', 'Consolidation', 'Edema', 'Effusion',
           'Emphysema', 'Fibrosis', 'Hernia', 'Infiltration', 'Mass', 'No Finding',
           'Nodule', 'Pleural_Thickening', 'Pneumonia', 'Pneumothorax']


class AnalysisResult(BaseModel):
    malignancy_risk: float
    confidence: float
    model_version: str
    bounding_boxes: List[dict] = []
    inference_time_ms: float
    findings: List[str]


def preprocess_image_for_model(image_bytes: bytes) -> tuple:
    """Preprocess image for real model inference. Returns (img_array, original_array)."""
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    img = img.resize(IMG_SIZE)
    original_array = np.array(img)
    img_array = tf.keras.preprocessing.image.img_to_array(img)
    img_array = np.expand_dims(img_array, axis=0) / 255.0
    return img_array, original_array




@router.post("/analyze", response_model=AnalysisResult)
async def analyze_image(file: UploadFile = File(...)):
    """
    Uploads an image, runs it through the ML model,
    and returns probability metrics, latency stats, and bounding boxes.
    """
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="Invalid file type. Only images allowed.")

    start_time = time.time()

    try:
        # 1. Read File
        contents = await file.read()

        # 2. Get model (will raise ModelLoadError if not available)
        model = ModelLoader.get_xray_model()

        # 3. Preprocess for model
        img_array, original_array = await asyncio.to_thread(
            preprocess_image_for_model, contents
        )

        # 4. Run inference
        preds = await asyncio.to_thread(model.predict, img_array)

        # 5. Parse predictions (real model returns probabilities for each class)
        results = []
        for i, class_name in enumerate(CLASSES):
            results.append({"condition": class_name, "probability": float(preds[0][i])})
        results.sort(key=lambda x: x['probability'], reverse=True)

        top_condition = results[0]['condition']
        malignancy_risk = results[0]['probability']
        confidence = 1.0 - (results[1]['probability'] if len(results) > 1 else 0)
        findings = [f"{r['condition']}: {r['probability']*100:.1f}%" for r in results[:5]]
        model_version = "hybrid-chest-xray-v1.0"

        # 6. Generate bounding boxes for visualization
        bboxes = generate_bounding_boxes(results, confidence_threshold=0.3)
        formatted_bboxes = format_for_frontend(bboxes)

        # Calculate Latency
        end_time = time.time()
        latency_ms = round((end_time - start_time) * 1000, 2)

        logger.info(f"Inference completed in {latency_ms}ms | Risk: {malignancy_risk}")

        return {
            "malignancy_risk": malignancy_risk,
            "confidence": confidence,
            "model_version": model_version,
            "bounding_boxes": formatted_bboxes,
            "inference_time_ms": latency_ms,
            "findings": findings
        }

    except ModelLoadError as e:
        logger.error(f"Model not available: {e}")
        raise HTTPException(status_code=503, detail=f"X-Ray model not available: {e}")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Inference error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal processing error.")
