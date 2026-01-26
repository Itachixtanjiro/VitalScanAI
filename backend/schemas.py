from pydantic import BaseModel, Field
from typing import List, Optional, Any, Literal

# Mirroring types/ClinicalSynthesis.ts

IntensityLevel = Literal['Low', 'Moderate', 'High', 'Critical']
ClinicalStatus = Literal['normal', 'warning', 'critical']
ConsensusState = Literal['Unified', 'Mixed Signal', 'Variance Detected']

class Conflict(BaseModel):
    source: str
    description: str
    impact: Literal['High', 'Medium']

class ImagingArtifact(BaseModel):
    source_data: str
    gradcam_data: Optional[str] = None
    roi_coordinates: Optional[List[dict]] = None
    modality: str
    findings: str

class Biomarker(BaseModel):
    name: str
    value: str | float
    unit: str
    status: ClinicalStatus
    reference_range: Optional[str] = None
    description: Optional[str] = None

class LongitudinalTrend(BaseModel):
    date: str
    # Flexible key-value pairs
    data: Optional[dict] = Field(default_factory=dict)
    
    class Config:
        extra = "allow"

class PatientContext(BaseModel):
    age: int
    blood_type: str
    history: List[str]

class ClinicalAnalysisResult(BaseModel):
    """
    Strict Mirror of frontend's ClinicalAnalysisResult interface.
    """
    overall_status: str
    intensity_level: IntensityLevel
    consensus_state: ConsensusState
    signal_intensity_probability: float = Field(..., description="0-100 probability")
    narrative_summary: str
    clinical_reasoning: Optional[str] = None
    
    conflicts: List[Conflict] = []
    
    imaging_artifact: Optional[ImagingArtifact] = None
    
    biomarkers: List[Biomarker] = []
    
    longitudinal_trends: List[LongitudinalTrend] = []
    
    patient_context: Optional[PatientContext] = None
