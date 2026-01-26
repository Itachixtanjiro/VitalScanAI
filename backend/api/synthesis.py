import os
import time
import base64
from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from fastapi.responses import FileResponse
from typing import List, Optional
from loguru import logger
from schemas import ClinicalAnalysisResult, IntensityLevel, ConsensusState, ImagingArtifact
from ml.xray_model import xray_model
from ml.preprocess import ImagePreprocessor
from ml.gradcam import gradcam
from api.risk import RiskEngine, RiskInput
from llm.medgemma_client import medgemma_client
from db.database import db
from utils.file_validator import FileValidator
router = APIRouter()

@router.post("/analyze", response_model=ClinicalAnalysisResult)
async def analyze_synthesis(
    files: List[UploadFile] = File(...),
):
    """
    Monolithic endpoint to satisfy frontend contract.
    Aggregates X-Ray, Lab (Mock), and LLM Summary.
    Persists all data to SQLite database.
    """
    start = time.time()
    
    # 1. Validate all files first - PREVENTS CRASHES
    try:
        file_contents = await FileValidator.validate_files(files)
    except HTTPException:
        raise  # Re-raise validation errors
    except Exception as e:
        logger.error(f"File validation error: {e}")
        raise HTTPException(status_code=400, detail="File validation failed")

    # 2. Processing State
    imaging_result = None
    parsed_flags = []
    xray_risk = 0.0
    source_image_base64 = None

    try:
        # 3. Iterate Files (Now validated and safe)
        for filename, file_data in file_contents.items():
            content = file_data['content']
            content_type = file_data['type']
            
            if content_type and content_type.startswith("image/"):
                # Run X-Ray Pipeline
                logger.info(f"Processing image: {filename}")
                preprocessed = ImagePreprocessor.preprocess(content)
                prediction = xray_model.predict(preprocessed)

                xray_risk = prediction["malignancy_risk"]

                # Generate GradCAM with ROI markers based on risk score
                heatmap = gradcam.generate(
                    preprocessed,
                    target_class="malignant",
                    risk_score=xray_risk,
                    add_roi_markers=True
                )

                # Encode the original image as base64 for frontend display
                source_image_base64 = base64.b64encode(content).decode('utf-8')

                # Create proper data URL for frontend
                mime_type = content_type or 'image/png'
                source_data_url = f"data:{mime_type};base64,{source_image_base64}"

                # Map to contract with actual image data
                imaging_result = ImagingArtifact(
                    source_data=source_data_url,  # Now includes actual image as data URL
                    gradcam_data=heatmap,
                    modality="X-Ray",
                    findings=f"Automated Scan: Risk {prediction['malignancy_risk']:.2f}, Confidence {prediction['confidence']:.2f}"
                )
                logger.success(f"Image processed successfully: {filename}")

            elif content_type and (content_type.startswith("text/") or content_type == "application/json"):
                # Run LLM Parsing (Bounded)
                logger.info(f"Processing text document: {filename}")
                text_content = content.decode("utf-8")
                parsing_result = await medgemma_client.execute_task('extract', text_content)
                if parsing_result:
                    keywords = ["critical", "warning", "abnormal", "high", "severe"]
                    for kw in keywords:
                        if kw in parsing_result.lower():
                            parsed_flags.append(kw)
                logger.info(f"Text document processed: {filename}")
                
    except Exception as e:
        logger.error(f"Processing error: {e}")
        raise HTTPException(status_code=500, detail="Pipeline processing failed")

    # 3. Deterministic Risk Aggregation
    risk_input = RiskInput(
        xray_risk=xray_risk,
        lab_risk=0.2,  # Stub for lab data
        parsed_flags=parsed_flags
    )
    risk_assessment = RiskEngine.analyze(risk_input)
    
    # 4. LLM Summary (Bounded)
    context_text = f"Patient analysis shows {risk_assessment.risk_level} risk. X-Ray risk score: {xray_risk}."
    summary = await medgemma_client.execute_task('summary', context_text)
    if not summary:
        summary = "Summary unavailable."

    # 5. Format reasoning trace for better display
    # Convert the trace list into a properly formatted string
    reasoning_lines = []
    for i, trace_item in enumerate(risk_assessment.reasoning_trace, 1):
        reasoning_lines.append(f"{i}. {trace_item}")
    clinical_reasoning = "\n".join(reasoning_lines)

    # 6. Assembly
    intensity_map = {
        "High": "High",
        "Moderate": "Moderate",
        "Low": "Low"
    }
    
    result = ClinicalAnalysisResult(
        overall_status=risk_assessment.overall_status,
        intensity_level=intensity_map.get(risk_assessment.risk_level, "Low"),
        consensus_state="Unified",
        signal_intensity_probability=risk_assessment.risk_score * 100,
        narrative_summary=summary,
        clinical_reasoning=clinical_reasoning,  # Now properly formatted
        imaging_artifact=imaging_result,
        biomarkers=[],
        longitudinal_trends=[],
        patient_context=None 
    )
    
    # 7. Persist to Database - ALL ASYNC NOW
    try:
        session_id = await db.save_analysis(
            overall_status=result.overall_status,
            intensity_level=result.intensity_level,
            consensus_state=result.consensus_state,
            risk_score=risk_assessment.risk_score,
            narrative_summary=result.narrative_summary,
            clinical_reasoning=result.clinical_reasoning,
            raw_response=result.model_dump()
        )

        # Save uploaded files
        for filename, file_data in file_contents.items():
            file_id = await db.save_uploaded_file(
                session_id=session_id,
                filename=filename,
                file_type=file_data['type'] or 'application/octet-stream',
                content=file_data['content']
            )

            # If this was the imaging file, save artifact reference
            if imaging_result and file_data['type'] and file_data['type'].startswith('image/'):
                await db.save_imaging_artifact(
                    session_id=session_id,
                    modality=imaging_result.modality,
                    findings=imaging_result.findings,
                    source_file_id=file_id,
                    gradcam_base64=imaging_result.gradcam_data
                )

        logger.info(f"Analysis persisted with session_id: {session_id}")
        
    except Exception as e:
        logger.error(f"Database persistence error: {e}")
        # Continue without failing - the API response is more important
    
    end = time.time()
    logger.info(f"Analysis completed in {(end-start)*1000:.2f}ms")
    
    return result

@router.get("/history")
async def get_analysis_history(limit: int = 20):
    """Get recent analysis history."""
    return await db.get_analysis_history(limit=limit)

@router.get("/session/{session_id}")
async def get_analysis_session(session_id: str):
    """Get a specific analysis session with all related data."""
    result = await db.get_analysis_by_id(session_id)
    if not result:
        raise HTTPException(status_code=404, detail="Session not found")
    return result

@router.get("/file/{file_id}")
async def get_uploaded_file(file_id: str):
    """Retrieve an uploaded file by its ID."""
    file_path = await db.get_file_path(file_id)
    if not file_path or not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(file_path)
