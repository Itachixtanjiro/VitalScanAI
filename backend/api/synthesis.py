import os
import io
import time
import base64
import asyncio
import numpy as np
import tensorflow as tf
from PIL import Image
from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from fastapi.responses import FileResponse
from typing import List, Optional
from loguru import logger
from schemas import ClinicalAnalysisResult, IntensityLevel, ConsensusState, ImagingArtifact
from api.model_loader import ModelLoader, ModelLoadError
from ml.bbox_generator import generate_bounding_boxes, format_for_frontend
from api.risk import RiskEngine, RiskInput
from llm.unified_client import unified_client
from ml.clinical_agent import clinical_agent
from db.database import db
from utils.file_validator import FileValidator

router = APIRouter()


def _generate_fallback_reasoning(risk_assessment, findings_summary: str, parsed_flags: list) -> str:
    """Generate clinical reasoning when LLM is unavailable."""
    parts = []

    # Radiographic findings
    if "No radiographic" in findings_summary:
        parts.append("No radiographic data was included in this analysis.")
    else:
        parts.append(f"Radiographic analysis was performed. {findings_summary}")

    # Clinical flags
    if parsed_flags:
        parts.append(
            f"Clinical text analysis identified the following flags: {', '.join(parsed_flags)}. "
            "These should be reviewed in context of the patient's full clinical history."
        )

    # Risk-level interpretation
    level_text = {
        "High": (
            "The aggregated assessment indicates elevated risk. "
            "Clinical correlation with primary records is strongly advised."
        ),
        "Moderate": (
            "The assessment suggests moderate risk. "
            "Continued monitoring and follow-up evaluation are recommended."
        ),
        "Low": (
            "The overall risk assessment is low. "
            "Routine follow-up is appropriate unless new symptoms present."
        ),
    }
    parts.append(level_text.get(risk_assessment.risk_level, "Risk level could not be determined."))

    return " ".join(parts)


# Image preprocessing constants
IMG_SIZE = (224, 224)
CLASSES = ['Atelectasis', 'Cardiomegaly', 'Consolidation', 'Edema', 'Effusion',
           'Emphysema', 'Fibrosis', 'Hernia', 'Infiltration', 'Mass', 'No Finding',
           'Nodule', 'Pleural_Thickening', 'Pneumonia', 'Pneumothorax']


def preprocess_image_for_model(image_bytes: bytes) -> tuple:
    """Preprocess image for real model inference. Returns (img_array, original_array)."""
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    img = img.resize(IMG_SIZE)
    original_array = np.array(img)
    img_array = tf.keras.preprocessing.image.img_to_array(img)
    img_array = np.expand_dims(img_array, axis=0) / 255.0
    return img_array, original_array


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
                # Run X-Ray Pipeline with REAL model
                logger.info(f"Processing image: {filename}")

                # Get the real X-ray model (raises ModelLoadError if unavailable)
                model = ModelLoader.get_xray_model()

                # Preprocess for model inference
                img_array, original_array = await asyncio.to_thread(
                    preprocess_image_for_model, content
                )

                # Run inference
                preds = await asyncio.to_thread(model.predict, img_array)

                # Parse predictions (real model returns probabilities for each class)
                results = []
                for i, class_name in enumerate(CLASSES):
                    results.append({"condition": class_name, "probability": float(preds[0][i])})
                results.sort(key=lambda x: x['probability'], reverse=True)

                top_condition = results[0]['condition']
                top_index = CLASSES.index(top_condition)
                xray_risk = results[0]['probability']

                # Build findings string from top conditions
                top_findings = [f"{r['condition']}: {r['probability']*100:.1f}%" for r in results[:3]]
                findings_str = f"Top findings: {', '.join(top_findings)}"

                # Generate bounding boxes for visualization
                bboxes = generate_bounding_boxes(results, confidence_threshold=0.3)
                formatted_bboxes = format_for_frontend(bboxes)
                logger.info(f"Generated {len(formatted_bboxes)} bounding boxes for {filename}")

                # Encode the original image as base64 for frontend display
                source_image_base64 = base64.b64encode(content).decode('utf-8')

                # Create proper data URL for frontend
                mime_type = content_type or 'image/png'
                source_data_url = f"data:{mime_type};base64,{source_image_base64}"

                # Map to contract with bounding box data
                imaging_result = ImagingArtifact(
                    source_data=source_data_url,
                    bounding_boxes=formatted_bboxes,
                    modality="X-Ray",
                    findings=findings_str
                )
                logger.success(f"Image processed successfully: {filename}")


            elif content_type and (content_type.startswith("text/") or content_type == "application/json"):
                # Run Clinical Agent Parsing (Robust Pipeline)
                logger.info(f"Processing text document with Clinical Agent: {filename}")
                text_content = content.decode("utf-8")
                
                # Run in threadpool to avoid blocking event loop
                parsing_result = await asyncio.to_thread(clinical_agent.process_note, text_content)
                
                # Extract Structured Data & Flags
                if parsing_result and "structured_data" in parsing_result:
                    structured = parsing_result["structured_data"]
                    
                    # 1. UI Hints
                    # We store them temporarily to attach to result later
                    # (In a real scenario with multiple files, we'd need to merge them, but assuming 1 main note for now)
                    if "ui_hints" in structured:
                         # Attach to request state or return object (handled in assembly step if we scope it out)
                         # QUICK FIX: Store in a local variable that survives this loop scope? 
                         # Actually, 'parsed_flags' is used for risk. let's extract risk flags too.
                         pass
                         
                    # 2. Risk Flags
                    # We can use the 'diagnosis' or 'plan' to find keywords
                    full_text_search = json.dumps(structured).lower()
                    keywords = ["critical", "warning", "abnormal", "high", "severe", "emergency"]
                    for kw in keywords:
                        if kw in full_text_search:
                            parsed_flags.append(kw)
                            
                    # Store the structured result for the final response
                    # (We'll attach it to the first text file processed)
                    parsed_structured_data = structured
                
                logger.info(f"Text document processed: {filename}")
                
    except ModelLoadError as e:
        logger.error(f"Model not available: {e}")
        raise HTTPException(status_code=503, detail=f"X-Ray model not available: {e}")
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
    
    # 4. Build findings context for LLM
    findings_summary = ""
    if imaging_result:
        findings_summary = imaging_result.findings or "Radiographic analysis performed, no significant findings."
    else:
        findings_summary = "No radiographic data included in this analysis."

    flags_summary = ", ".join(parsed_flags) if parsed_flags else "None detected"

    # 5. LLM Summary (Bounded)
    summary_context = f"Patient analysis shows {risk_assessment.risk_level} risk. {findings_summary}"
    summary = await unified_client.execute_task('summary', summary_context)
    if not summary:
        summary = "Summary unavailable."

    # 6. LLM Clinical Reasoning (replaces hardcoded weight formulas)
    reasoning_context = (
        f"Analyzed Sources:\n"
        f"- Radiographic Analysis: {findings_summary}\n"
        f"- Laboratory Indicators: lab_risk={risk_input.lab_risk:.2f}\n"
        f"- Clinical Text Flags: {flags_summary}\n\n"
        f"Overall Risk Assessment: {risk_assessment.risk_level} "
        f"(Normalized Score: {risk_assessment.risk_score:.3f})\n"
        f"Status: {risk_assessment.overall_status}"
    )
    clinical_reasoning = await unified_client.execute_task('reasoning', reasoning_context)
    if not clinical_reasoning:
        # Fallback: generate basic reasoning without LLM
        clinical_reasoning = _generate_fallback_reasoning(
            risk_assessment, findings_summary, parsed_flags
        )

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
        patient_context=None,
        ui_hints=parsed_structured_data.get("ui_hints") if 'parsed_structured_data' in locals() else None
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
                    bounding_boxes=imaging_result.bounding_boxes
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
