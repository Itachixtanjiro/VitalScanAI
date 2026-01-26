from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import pandas as pd
from api.model_loader import ModelLoader

router = APIRouter()

class DiabetesInput(BaseModel):
    # Standard diabetes dataset features
    Pregnancies: int
    Glucose: int
    BloodPressure: int
    SkinThickness: int
    Insulin: int
    BMI: float
    DiabetesPedigreeFunction: float
    Age: int

@router.post("/")
async def predict_diabetes(data: DiabetesInput):
    model, scaler = ModelLoader.get_diabetes_model()
    if not model or not scaler:
        raise HTTPException(status_code=503, detail="Diabetes Model not loaded")
    
    try:
        import asyncio
        input_data = pd.DataFrame([data.dict()])
        
        # Scale features (fast, but safer in thread)
        scaled_data = await asyncio.to_thread(scaler.transform, input_data)
        
        # Predict
        prediction = await asyncio.to_thread(model.predict, scaled_data)
        probability = await asyncio.to_thread(lambda: model.predict_proba(scaled_data)[0][1])
        
        return {
            "is_diabetic": bool(prediction[0]),
            "probability": float(probability)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
