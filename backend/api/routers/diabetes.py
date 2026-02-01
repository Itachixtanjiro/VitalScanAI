"""Diabetes Risk Prediction Endpoint.

This router provides diabetes risk prediction based on clinical features
from the Pima Indians Diabetes Dataset.

Model: Random Forest Classifier trained on 8 clinical features
Target: Diabetes outcome prediction (0=negative, 1=positive)
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List
import pandas as pd
import numpy as np
import asyncio
import logging
from api.model_loader import ModelLoader, ModelLoadError

logger = logging.getLogger(__name__)
router = APIRouter()

# ============================================================
# FEATURE ORDER - Must match training data column order exactly
# ============================================================
DIABETES_FEATURES = [
    'Pregnancies',
    'Glucose',
    'BloodPressure',
    'SkinThickness',
    'Insulin',
    'BMI',
    'DiabetesPedigreeFunction',
    'Age'
]


# ============================================================
# INPUT/OUTPUT SCHEMAS
# ============================================================
class DiabetesRiskInput(BaseModel):
    """Input for diabetes risk prediction (8 clinical features)."""
    Pregnancies: int = Field(..., ge=0, description="Number of pregnancies")
    Glucose: float = Field(..., ge=0, description="Plasma glucose concentration (mg/dL)")
    BloodPressure: float = Field(..., ge=0, description="Diastolic blood pressure (mm Hg)")
    SkinThickness: float = Field(..., ge=0, description="Triceps skin fold thickness (mm)")
    Insulin: float = Field(..., ge=0, description="2-Hour serum insulin (mu U/ml)")
    BMI: float = Field(..., ge=0, description="Body mass index (kg/m^2)")
    DiabetesPedigreeFunction: float = Field(..., ge=0, description="Diabetes pedigree function (genetic score)")
    Age: int = Field(..., ge=1, le=120, description="Patient age in years")


class DiabetesRiskResponse(BaseModel):
    """Response from diabetes risk prediction."""
    risk_class: int = Field(..., description="0=No Diabetes, 1=Diabetes predicted")
    risk_probability: float = Field(..., ge=0.0, le=1.0, description="Probability of diabetes")
    risk_level: str = Field(..., description="Risk classification: Low, Moderate, or High")
    intensity_level: str = Field(..., description="For frontend compatibility")
    interpretation: str = Field(..., description="Clinical interpretation")
    clinical_reasoning: Optional[str] = None
    contributing_factors: List[str] = Field(default_factory=list)
    # Keep backward compatibility
    is_diabetic: bool = Field(..., description="Boolean diabetes prediction")
    probability: float = Field(..., description="Alias for risk_probability (backward compat)")


# ============================================================
# HELPER FUNCTIONS
# ============================================================
def _get_contributing_factors(data: DiabetesRiskInput) -> List[str]:
    """Identify key contributing risk factors from input data."""
    factors = []

    if data.Glucose > 140:
        factors.append(f"Elevated glucose ({data.Glucose:.0f} mg/dL)")
    elif data.Glucose > 100:
        factors.append(f"Borderline glucose ({data.Glucose:.0f} mg/dL)")

    if data.BMI >= 30:
        factors.append(f"Obesity (BMI {data.BMI:.1f})")
    elif data.BMI >= 25:
        factors.append(f"Overweight (BMI {data.BMI:.1f})")

    if data.Age >= 45:
        factors.append(f"Age risk factor ({data.Age} years)")

    if data.DiabetesPedigreeFunction > 0.5:
        factors.append(f"Strong family history (pedigree {data.DiabetesPedigreeFunction:.3f})")

    if data.Insulin > 166:
        factors.append(f"Elevated insulin ({data.Insulin:.0f} mu U/ml)")

    if data.BloodPressure > 80:
        factors.append(f"Elevated blood pressure ({data.BloodPressure:.0f} mm Hg)")

    if data.Pregnancies >= 6:
        factors.append(f"Multiple pregnancies ({data.Pregnancies})")

    if data.SkinThickness > 35:
        factors.append(f"Elevated skin thickness ({data.SkinThickness:.0f} mm)")

    return factors[:5]  # Top 5 factors


# ============================================================
# ENDPOINTS
# ============================================================
@router.post("/", response_model=DiabetesRiskResponse)
async def predict_diabetes_risk(data: DiabetesRiskInput):
    """
    Predict diabetes risk from clinical features.

    This model is trained on the Pima Indians Diabetes Dataset
    and predicts the likelihood of diabetes.

    **Input**: 8 clinical features including glucose, BMI, age,
    blood pressure, insulin, skin thickness, pregnancies, and pedigree function.

    **Output**: Binary diabetes prediction with probability and risk classification.
    """
    try:
        model, scaler = ModelLoader.get_diabetes_model()
    except ModelLoadError as e:
        raise HTTPException(status_code=503, detail=f"Diabetes Model not loaded: {e}")

    if not model:
        raise HTTPException(status_code=503, detail="Diabetes Model not available")

    try:
        # Prepare features in correct order
        feature_dict = {col: getattr(data, col) for col in DIABETES_FEATURES}
        df = pd.DataFrame([feature_dict])[DIABETES_FEATURES]

        # Scale features
        if scaler:
            scaled_data = await asyncio.to_thread(scaler.transform, df.values)
            logger.debug("Applied StandardScaler to features")
        else:
            scaled_data = df.values
            logger.warning("No scaler found - using raw features")

        # Make prediction
        prediction = await asyncio.to_thread(model.predict, scaled_data)

        # Get probability
        probability = 0.0
        if hasattr(model, 'predict_proba'):
            proba = await asyncio.to_thread(model.predict_proba, scaled_data)
            probability = float(proba[0][1])  # Probability of class 1 (diabetes)

        # Determine risk level and interpretation
        risk_pct = probability * 100
        if risk_pct < 30:
            risk_level = "Low"
            intensity_level = "Low"
            interpretation = (
                "LOW RISK - Based on clinical factors, diabetes risk appears low. "
                "Maintain healthy lifestyle with regular exercise and balanced diet."
            )
        elif risk_pct < 60:
            risk_level = "Moderate"
            intensity_level = "Moderate"
            interpretation = (
                "MODERATE RISK - Some risk factors present. Consider glucose monitoring, "
                "lifestyle modifications, and regular check-ups with healthcare provider."
            )
        else:
            risk_level = "High"
            intensity_level = "High"
            interpretation = (
                "HIGH RISK - Multiple risk factors indicate elevated diabetes risk. "
                "HbA1c testing and fasting glucose assessment strongly recommended. "
                "Consult endocrinologist for management plan."
            )

        # Get contributing factors
        contributing_factors = _get_contributing_factors(data)

        # Build clinical reasoning trace
        reasoning_parts = [
            f"Model prediction: {'Positive' if prediction[0] == 1 else 'Negative'} diabetes likelihood ({probability*100:.1f}%)",
            f"Risk classification: {risk_level}",
        ]
        if contributing_factors:
            reasoning_parts.append(f"Key risk factors: {', '.join(contributing_factors)}")

        return DiabetesRiskResponse(
            risk_class=int(prediction[0]),
            risk_probability=round(probability, 4),
            risk_level=risk_level,
            intensity_level=intensity_level,
            interpretation=interpretation,
            clinical_reasoning="\n".join(reasoning_parts),
            contributing_factors=contributing_factors,
            is_diabetic=bool(prediction[0]),
            probability=round(probability, 4)
        )

    except Exception as e:
        logger.error(f"Diabetes risk prediction failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/model-info")
async def get_model_info():
    """Get information about the diabetes risk model."""
    try:
        model, scaler = ModelLoader.get_diabetes_model()
    except ModelLoadError:
        return {"status": "not_loaded", "message": "Diabetes model not available"}

    if not model:
        return {"status": "not_loaded", "message": "Diabetes model not available"}

    return {
        "status": "ready",
        "model_type": type(model).__name__,
        "expected_features": len(DIABETES_FEATURES),
        "feature_list": DIABETES_FEATURES,
        "scaler_loaded": scaler is not None,
        "description": "Diabetes risk prediction based on Pima Indians Diabetes Dataset",
        "output": "Binary diabetes prediction (0=negative, 1=positive) with probability",
        "dataset": "Pima Indians Diabetes Dataset (UCI)"
    }
