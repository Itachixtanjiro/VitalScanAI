from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import List, Optional

router = APIRouter()

class RiskInput(BaseModel):
    xray_risk: float = Field(..., ge=0.0, le=1.0, description="Normalized risk score from X-Ray model")
    lab_risk: float = Field(..., ge=0.0, le=1.0, description="Normalized risk score from Lab analysis")
    parsed_flags: List[str] = Field(default=[], description="List of clinical flags extracted from text")

class RiskResponse(BaseModel):
    overall_status: str
    risk_level: str
    risk_score: float
    reasoning_trace: List[str]

class RiskEngine:
    """
    Deterministic transparency engine for risk aggregation.
    NO LLM or Black-box logic.
    """
    
    # Configurable weights
    W_XRAY = 0.4
    W_LAB = 0.4
    W_FLAGS = 0.2
    
    FLAG_PENALTIES = {
        "critical": 1.0,
        "warning": 0.5,
        "abnormal": 0.3
    }

    @classmethod
    def analyze(cls, inputs: RiskInput) -> RiskResponse:
        # 1. X-Ray Contribution
        xray_contrib = inputs.xray_risk * cls.W_XRAY

        # 2. Lab Contribution
        lab_contrib = inputs.lab_risk * cls.W_LAB

        # 3. Text Flags Contribution
        flag_score = 0.0
        active_flags = []
        for flag in inputs.parsed_flags:
            lower_flag = flag.lower()
            for key, penalty in cls.FLAG_PENALTIES.items():
                if key in lower_flag:
                    flag_score = max(flag_score, penalty)
                    active_flags.append(flag)

        flag_contrib = flag_score * cls.W_FLAGS

        # 4. Aggregation
        total_score = xray_contrib + lab_contrib + flag_contrib
        total_score = min(total_score, 1.0)

        # 5. Thresholding
        if total_score >= 0.75:
            level = "High"
            status = "Clinical Correlation Strongly Advised"
        elif total_score >= 0.35:
            level = "Moderate"
            status = "Monitoring Suggested"
        else:
            level = "Low"
            status = "Stable / Routine"

        # Build data-oriented trace (consumed by synthesis for LLM context)
        trace = []
        if inputs.xray_risk > 0:
            trace.append(f"xray_risk={inputs.xray_risk:.3f}")
        if inputs.lab_risk > 0:
            trace.append(f"lab_risk={inputs.lab_risk:.3f}")
        if active_flags:
            trace.append(f"flags={','.join(active_flags)}")

        return RiskResponse(
            overall_status=status,
            risk_level=level,
            risk_score=round(total_score, 3),
            reasoning_trace=trace
        )

@router.post("/assess", response_model=RiskResponse)
async def assess_risk(request: RiskInput):
    """
    Deterministically aggregates risk from multimodal sources.
    Transparently explains the calculation.
    """
    return RiskEngine.analyze(request)
