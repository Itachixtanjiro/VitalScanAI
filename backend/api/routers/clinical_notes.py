"""Clinical Notes Analysis Endpoint.

This router processes unstructured clinical notes to extract structured data
using a hybrid pipeline of BioBERT (local NER) and Mistral (LLM prediction).

Also provides sample clinical notes generated from synthetic SYNTHEA data.
"""
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
from typing import Optional, Dict, List, Any
import logging
from ml.clinical_agent import clinical_agent
from ml.note_generator import generate_sample_notes

logger = logging.getLogger(__name__)
router = APIRouter()

class ClinicalNoteInput(BaseModel):
    """Input for clinical note parsing."""
    text: str = Field(..., min_length=10, description="Raw clinical note text")
    use_llm: bool = Field(True, description="Enable Mistral LLM parsing")
    use_bert: bool = Field(True, description="Enable local BioBERT entity extraction")

class BertEntity(BaseModel):
    """A single named entity extracted by BioBERT NER."""
    entity_group: str
    score: float
    word: str
    start: int
    end: int

class ClinicalNoteResponse(BaseModel):
    """Response containing extracted entities and structured data."""
    raw_text: str
    bert_entities: List[BertEntity]
    structured_data: Dict[str, Any]
    status: str = "success"

class SampleNoteResponse(BaseModel):
    """A synthetic clinical note generated from SYNTHEA data."""
    id: str
    title: str
    text: str
    expected_entities: List[str]
    category: str

@router.post("/parse", response_model=ClinicalNoteResponse)
async def parse_clinical_note(data: ClinicalNoteInput):
    """
    Parse a clean text clinical note into structured data.

    Pipeline:
    1. BioBERT (Local): Extracts medical entities (Meds, Diseases, Anatomy)
    2. Mistral (API): Generates structured JSON (Demographics, Vitals, Plan)
    3. UI Hints: heuristic analysis for frontend visualization triggers
    """
    try:
        # Check if Mistral key is available if LLM is requested
        if data.use_llm and not clinical_agent.mistral_key:
            logger.warning("Mistral API key missing - fallback to BERT only")

        logger.info(f"Processing clinical note ({len(data.text)} chars)")

        # Run the agent pipeline
        result = clinical_agent.process_note(
            text=data.text,
            use_local=data.use_bert,
            use_llm=data.use_llm
        )

        return ClinicalNoteResponse(
            raw_text=result.get("raw_text", ""),
            bert_entities=result.get("bert_entities", []),
            structured_data=result.get("structured_data", {})
        )

    except Exception as e:
        logger.error(f"Clinical note parsing failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/samples", response_model=List[SampleNoteResponse])
async def get_sample_notes(count: int = 5):
    """
    Generate sample clinical notes from the SYNTHEA synthetic dataset.

    These notes are constructed from real-structured synthetic patient data
    (encounters, conditions, medications, observations) and can be used
    to test the BioBERT + Mistral NLP pipeline.
    """
    try:
        notes = generate_sample_notes(count=min(count, 20))
        if not notes:
            raise HTTPException(
                status_code=404,
                detail="Synthetic dataset not available. Check Models/Clinical_note/synthetic-medical-dataset/"
            )
        return [SampleNoteResponse(**note) for note in notes]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to generate sample notes: {e}")
        raise HTTPException(status_code=500, detail=str(e))
