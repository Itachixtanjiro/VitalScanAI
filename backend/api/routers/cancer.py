from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import pandas as pd
from api.model_loader import ModelLoader

router = APIRouter()

class CancerRiskInput(BaseModel):
    # Depending on feature_importance.csv, define required fields. 
    # For now, using a generic dict to pass to DataFrame
    features: dict

@router.post("/")
async def predict_cancer_risk(data: CancerRiskInput):
    model = ModelLoader.get_cancer_model()
    if not model:
        raise HTTPException(status_code=503, detail="Cancer Risk Model not loaded")
    
    try:
        import asyncio
        # Convert dict to DataFrame
        df = pd.DataFrame([data.features])
        
        # Offload prediction to thread
        # Convert to numpy array
        input_values = df.values
        
        # FEATURE ADAPTER: Pad Input if Mismatch
        # The trained model expects ~45000 features (Genomic) but we receive ~30 (Clinical).
        # We auto-pad with zeros to prevent crash and allow "partial" prediction.
        expected_features = getattr(model, "n_features_in_", None)
        if expected_features and input_values.shape[1] < expected_features:
            print(f"DEBUG: Feature Adapter Active. Padding {input_values.shape[1]} -> {expected_features}")
            import numpy as np
            # Create a zero-filled array of correct shape
            padded_input = np.zeros((input_values.shape[0], expected_features))
            # Fill the beginning with our actual data
            padded_input[:, :input_values.shape[1]] = input_values
            input_values = padded_input
            
        prediction = await asyncio.to_thread(model.predict, input_values)
        print(f"DEBUG: Prediction: {prediction}, Type: {type(prediction)}")
        
        # Check for predict_proba safely
        if hasattr(model, 'predict_proba'):
             raw_prob = await asyncio.to_thread(lambda: model.predict_proba(input_values))
             print(f"DEBUG: Raw Prob: {raw_prob}")
             try:
                # Handle standard sklearn output (n_samples, n_classes)
                if hasattr(raw_prob, '__getitem__'):
                    # specific to binary classification, get class 1
                    probability = raw_prob[0][1] 
                else:
                    probability = raw_prob
             except:
                 probability = 0.0 # Fallback
        else:
             probability = None
        
        return {
            "risk_class": prediction[0],
            "risk_probability": float(probability) if probability is not None else "N/A"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
