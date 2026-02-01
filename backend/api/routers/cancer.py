"""Cervical Cancer Risk Prediction Endpoint.

This router provides cervical cancer risk prediction based on clinical features
from the Kaggle cervical cancer risk factors dataset.

Model: Logistic Regression trained on 30 clinical features
Target: Biopsy result prediction (0=negative, 1=positive)
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
CERVICAL_CANCER_FEATURES = [
    'Age',
    'Number of sexual partners',
    'First sexual intercourse',
    'Num of pregnancies',
    'Smokes',
    'Smokes (years)',
    'Smokes (packs/year)',
    'Hormonal Contraceptives',
    'Hormonal Contraceptives (years)',
    'IUD',
    'IUD (years)',
    'STDs',
    'STDs (number)',
    'STDs:condylomatosis',
    'STDs:cervical condylomatosis',
    'STDs:vaginal condylomatosis',
    'STDs:vulvo-perineal condylomatosis',
    'STDs:syphilis',
    'STDs:pelvic inflammatory disease',
    'STDs:genital herpes',
    'STDs:molluscum contagiosum',
    'STDs:AIDS',
    'STDs:HIV',
    'STDs:Hepatitis B',
    'STDs:HPV',
    'STDs: Number of diagnosis',
    'Dx:Cancer',
    'Dx:CIN',
    'Dx:HPV',
    'Dx'
]


# ============================================================
# INPUT/OUTPUT SCHEMAS
# ============================================================
class CervicalCancerRiskInput(BaseModel):
    """Input for cervical cancer risk prediction (30 clinical features)."""
    Age: int = Field(..., ge=15, le=100, description="Patient age in years")
    Number_of_sexual_partners: float = Field(..., ge=0, description="Number of sexual partners")
    First_sexual_intercourse: float = Field(..., ge=10, description="Age at first sexual intercourse")
    Num_of_pregnancies: float = Field(..., ge=0, description="Number of pregnancies")
    Smokes: float = Field(..., ge=0, le=1, description="Smoking status (0=No, 1=Yes)")
    Smokes_years: float = Field(0.0, ge=0, description="Years of smoking")
    Smokes_packs_year: float = Field(0.0, ge=0, description="Packs per year")
    Hormonal_Contraceptives: float = Field(..., ge=0, le=1, description="Hormonal contraceptive use (0=No, 1=Yes)")
    Hormonal_Contraceptives_years: float = Field(0.0, ge=0, description="Years of hormonal contraceptive use")
    IUD: float = Field(..., ge=0, le=1, description="IUD use (0=No, 1=Yes)")
    IUD_years: float = Field(0.0, ge=0, description="Years of IUD use")
    STDs: float = Field(..., ge=0, le=1, description="History of STDs (0=No, 1=Yes)")
    STDs_number: float = Field(0.0, ge=0, description="Number of STDs")
    STDs_condylomatosis: float = Field(0.0, ge=0, le=1)
    STDs_cervical_condylomatosis: float = Field(0.0, ge=0, le=1)
    STDs_vaginal_condylomatosis: float = Field(0.0, ge=0, le=1)
    STDs_vulvo_perineal_condylomatosis: float = Field(0.0, ge=0, le=1)
    STDs_syphilis: float = Field(0.0, ge=0, le=1)
    STDs_pelvic_inflammatory_disease: float = Field(0.0, ge=0, le=1)
    STDs_genital_herpes: float = Field(0.0, ge=0, le=1)
    STDs_molluscum_contagiosum: float = Field(0.0, ge=0, le=1)
    STDs_AIDS: float = Field(0.0, ge=0, le=1)
    STDs_HIV: float = Field(0.0, ge=0, le=1)
    STDs_Hepatitis_B: float = Field(0.0, ge=0, le=1)
    STDs_HPV: float = Field(0.0, ge=0, le=1)
    STDs_Number_of_diagnosis: int = Field(0, ge=0, description="Number of STD diagnoses")
    Dx_Cancer: int = Field(0, ge=0, le=1, description="Prior cancer diagnosis")
    Dx_CIN: int = Field(0, ge=0, le=1, description="Prior CIN diagnosis")
    Dx_HPV: int = Field(0, ge=0, le=1, description="Prior HPV diagnosis")
    Dx: int = Field(0, ge=0, le=1, description="Any prior diagnosis")


class CervicalCancerRiskResponse(BaseModel):
    """Response from cervical cancer risk prediction."""
    risk_class: int = Field(..., description="0=Low Risk, 1=High Risk (Biopsy advised)")
    risk_probability: float = Field(..., ge=0.0, le=1.0, description="Probability of positive biopsy")
    risk_level: str = Field(..., description="Risk classification: Low, Moderate, or High")
    intensity_level: str = Field(..., description="For frontend compatibility")
    interpretation: str = Field(..., description="Clinical interpretation")
    clinical_reasoning: Optional[str] = None
    contributing_factors: List[str] = Field(default_factory=list)


# ============================================================
# HELPER FUNCTIONS
# ============================================================
def _map_input_to_features(data: CervicalCancerRiskInput) -> pd.DataFrame:
    """Map Pydantic model to feature DataFrame with correct column names."""
    feature_dict = {
        'Age': data.Age,
        'Number of sexual partners': data.Number_of_sexual_partners,
        'First sexual intercourse': data.First_sexual_intercourse,
        'Num of pregnancies': data.Num_of_pregnancies,
        'Smokes': data.Smokes,
        'Smokes (years)': data.Smokes_years,
        'Smokes (packs/year)': data.Smokes_packs_year,
        'Hormonal Contraceptives': data.Hormonal_Contraceptives,
        'Hormonal Contraceptives (years)': data.Hormonal_Contraceptives_years,
        'IUD': data.IUD,
        'IUD (years)': data.IUD_years,
        'STDs': data.STDs,
        'STDs (number)': data.STDs_number,
        'STDs:condylomatosis': data.STDs_condylomatosis,
        'STDs:cervical condylomatosis': data.STDs_cervical_condylomatosis,
        'STDs:vaginal condylomatosis': data.STDs_vaginal_condylomatosis,
        'STDs:vulvo-perineal condylomatosis': data.STDs_vulvo_perineal_condylomatosis,
        'STDs:syphilis': data.STDs_syphilis,
        'STDs:pelvic inflammatory disease': data.STDs_pelvic_inflammatory_disease,
        'STDs:genital herpes': data.STDs_genital_herpes,
        'STDs:molluscum contagiosum': data.STDs_molluscum_contagiosum,
        'STDs:AIDS': data.STDs_AIDS,
        'STDs:HIV': data.STDs_HIV,
        'STDs:Hepatitis B': data.STDs_Hepatitis_B,
        'STDs:HPV': data.STDs_HPV,
        'STDs: Number of diagnosis': data.STDs_Number_of_diagnosis,
        'Dx:Cancer': data.Dx_Cancer,
        'Dx:CIN': data.Dx_CIN,
        'Dx:HPV': data.Dx_HPV,
        'Dx': data.Dx
    }
    # Create DataFrame with features in correct order
    return pd.DataFrame([feature_dict])[CERVICAL_CANCER_FEATURES]


def _get_contributing_factors(data: CervicalCancerRiskInput) -> List[str]:
    """Identify key contributing risk factors from input data."""
    factors = []

    if data.STDs_HPV > 0:
        factors.append("HPV positive history")
    if data.STDs > 0 or data.STDs_number > 0:
        factors.append(f"History of {int(data.STDs_number)} STD(s)")
    if data.Smokes > 0:
        factors.append(f"Smoking history ({data.Smokes_years:.0f} years)")
    if data.Number_of_sexual_partners > 3:
        factors.append(f"Multiple sexual partners ({int(data.Number_of_sexual_partners)})")
    if data.First_sexual_intercourse < 16:
        factors.append(f"Early sexual debut (age {int(data.First_sexual_intercourse)})")
    if data.Hormonal_Contraceptives > 0 and data.Hormonal_Contraceptives_years > 5:
        factors.append(f"Long-term hormonal contraceptive use ({data.Hormonal_Contraceptives_years:.0f} years)")
    if data.Dx_HPV > 0:
        factors.append("Prior HPV diagnosis")
    if data.Dx_CIN > 0:
        factors.append("Prior CIN diagnosis")
    if data.Dx_Cancer > 0:
        factors.append("Prior cancer diagnosis")
    if data.STDs_HIV > 0:
        factors.append("HIV positive")

    return factors[:5]  # Top 5 factors


# ============================================================
# ENDPOINTS
# ============================================================
@router.post("/", response_model=CervicalCancerRiskResponse)
async def predict_cervical_cancer_risk(data: CervicalCancerRiskInput):
    """
    Predict cervical cancer risk (biopsy outcome) from clinical features.

    This model is trained on the UCI/Kaggle cervical cancer risk factors dataset
    and predicts the likelihood of a positive biopsy result.

    **Input**: 30 clinical features including demographics, sexual history,
    contraceptive use, STD history, and prior diagnoses.

    **Output**: Binary biopsy prediction with probability and risk classification.
    """
    try:
        model = ModelLoader.get_cancer_model()
    except ModelLoadError as e:
        raise HTTPException(status_code=503, detail=f"Cervical Cancer Model not loaded: {e}")

    if not model:
        raise HTTPException(status_code=503, detail="Cervical Cancer Model not available")

    try:
        # Prepare features in correct order
        df = _map_input_to_features(data)

        # Load and apply scaler if available
        scaler = ModelLoader.get_cancer_scaler()
        if scaler is not None:
            scaled_data = await asyncio.to_thread(scaler.transform, df.values)
            logger.debug("Applied StandardScaler to features")
        else:
            scaled_data = df.values

        # Make prediction
        prediction = await asyncio.to_thread(model.predict, scaled_data)

        # Get probability
        probability = 0.0
        if hasattr(model, 'predict_proba'):
            proba = await asyncio.to_thread(model.predict_proba, scaled_data)
            probability = float(proba[0][1])  # Probability of class 1 (positive biopsy)

        # Determine risk level and interpretation
        risk_pct = probability * 100
        if risk_pct < 30:
            risk_level = "Low"
            intensity_level = "Low"
            interpretation = "LOW RISK - Based on clinical factors, cervical cancer risk appears low. Continue routine screening per guidelines."
        elif risk_pct < 60:
            risk_level = "Moderate"
            intensity_level = "Moderate"
            interpretation = "MODERATE RISK - Some risk factors present. Consider enhanced screening and HPV testing. Discuss prevention strategies with healthcare provider."
        else:
            risk_level = "High"
            intensity_level = "High"
            interpretation = "HIGH RISK - Multiple risk factors indicate elevated cervical cancer risk. Colposcopy and biopsy consultation strongly recommended."

        # Get contributing factors
        contributing_factors = _get_contributing_factors(data)

        # Build clinical reasoning trace
        reasoning_parts = [
            f"Model prediction: {'Positive' if prediction[0] == 1 else 'Negative'} biopsy likelihood ({probability*100:.1f}%)",
            f"Risk classification: {risk_level}",
        ]
        if contributing_factors:
            reasoning_parts.append(f"Key risk factors: {', '.join(contributing_factors)}")

        return CervicalCancerRiskResponse(
            risk_class=int(prediction[0]),
            risk_probability=round(probability, 4),
            risk_level=risk_level,
            intensity_level=intensity_level,
            interpretation=interpretation,
            clinical_reasoning="\n".join(reasoning_parts),
            contributing_factors=contributing_factors
        )

    except Exception as e:
        logger.error(f"Cervical cancer risk prediction failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/model-info")
async def get_model_info():
    """Get information about the cervical cancer risk model."""
    try:
        model = ModelLoader.get_cancer_model()
    except ModelLoadError:
        return {"status": "not_loaded", "message": "Cervical cancer model not available"}

    if not model:
        return {"status": "not_loaded", "message": "Cervical cancer model not available"}

    scaler = ModelLoader.get_cancer_scaler()

    return {
        "status": "ready",
        "model_type": type(model).__name__,
        "expected_features": len(CERVICAL_CANCER_FEATURES),
        "feature_list": CERVICAL_CANCER_FEATURES,
        "scaler_loaded": scaler is not None,
        "description": "Cervical cancer risk prediction based on clinical and demographic factors",
        "output": "Binary biopsy prediction (0=negative, 1=positive) with probability",
        "dataset": "Kaggle Cervical Cancer Risk Factors"
    }
