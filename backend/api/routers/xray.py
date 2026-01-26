from fastapi import APIRouter, UploadFile, File, HTTPException
import numpy as np
import tensorflow as tf
from PIL import Image
import io
import asyncio
import gc
from api.model_loader import ModelLoader

router = APIRouter()

IMG_SIZE = (224, 224)
CLASSES = ['Atelectasis', 'Cardiomegaly', 'Consolidation', 'Edema', 'Effusion', 'Emphysema', 'Fibrosis', 'Hernia', 'Infiltration', 'Mass', 'No Finding', 'Nodule', 'Pleural_Thickening', 'Pneumonia', 'Pneumothorax']

def preprocess_image(image_bytes):
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    img = img.resize(IMG_SIZE)
    img_array = tf.keras.preprocessing.image.img_to_array(img)
    img_array = np.expand_dims(img_array, axis=0) / 255.0
    return img_array

@router.post("/")
async def predict_xray(file: UploadFile = File(...)):
    model = ModelLoader.get_xray_model()
    if not model:
        raise HTTPException(status_code=503, detail="X-Ray Model not loaded")
    
    try:
        content = await file.read()
        
        # Offload heavy preprocessing and inference to thread pool
        img_array = await asyncio.to_thread(preprocess_image, content)
        preds = await asyncio.to_thread(model.predict, img_array)
        
        # Explicitly clear memory
        del img_array
        del content
        gc.collect()

        results = []
        for i, class_name in enumerate(CLASSES):
            results.append({
                "condition": class_name,
                "probability": float(preds[0][i])
            })
            
        results.sort(key=lambda x: x['probability'], reverse=True)
        return {
            "ingestion_metadata": {
                "document_type": "radiograph",
                "file_name": file.filename
            },
            "predictions": results
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
