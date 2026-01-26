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
        trace = []
        
        # 1. X-Ray Contribution
        xray_contrib = inputs.xray_risk * cls.W_XRAY
        trace.append(f"- **X-Ray Risk** ({inputs.xray_risk:.2f}) * Weight ({cls.W_XRAY}) = **+{xray_contrib:.3f}**")
        
        # 2. Lab Contribution
        lab_contrib = inputs.lab_risk * cls.W_LAB
        trace.append(f"- **Lab Risk** ({inputs.lab_risk:.2f}) * Weight ({cls.W_LAB}) = **+{lab_contrib:.3f}**")
        
        # 3. Text Flags Contribution
        # Calculate max penalty from flags found
        flag_score = 0.0
        active_flags = []
        for flag in inputs.parsed_flags:
            lower_flag = flag.lower()
            for key, penalty in cls.FLAG_PENALTIES.items():
                if key in lower_flag:
                    flag_score = max(flag_score, penalty)
                    active_flags.append(f"{flag}({penalty})")
        
        flag_contrib = flag_score * cls.W_FLAGS
        trace.append(f"- **Text Flags** Max({', '.join(active_flags) or 'None'}) * Weight ({cls.W_FLAGS}) = **+{flag_contrib:.3f}**")
        
        # 4. Aggregation
        total_score = xray_contrib + lab_contrib + flag_contrib
        # Cap at 1.0
        total_score = min(total_score, 1.0)
        trace.append(f"\n**Aggregated Score**: `{total_score:.3f}`")
        
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
            
        trace.append(f"> Threshold Applied: Score {total_score:.2f} maps to Level '{level}'")
        
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
