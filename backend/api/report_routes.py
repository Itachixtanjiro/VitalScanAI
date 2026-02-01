from fastapi import APIRouter, UploadFile, File, HTTPException
from utils.report_parser import ReportParser
from api.model_loader import ModelLoader
from api.routers.diabetes import predict_diabetes_risk, DiabetesRiskInput
from api.routers.cancer import predict_cervical_cancer_risk, CervicalCancerRiskInput
import logging
import pandas as pd
import asyncio
import re
from typing import Optional, Dict, Any, List
from datetime import datetime

logger = logging.getLogger(__name__)

# ============================================================================
# HEALTH METRICS EXTRACTION
# ============================================================================

def extract_health_metrics(text: str) -> Dict[str, Any]:
    """Extract cholesterol, A1C, and blood pressure data from report text."""
    metrics = {
        "cholesterol": [],
        "a1c": [],
        "blood_pressure": [],
        "genomic_variants": []
    }

    # Cholesterol patterns
    ldl_patterns = [
        r"LDL[:\s]+(\d+(?:\.\d+)?)\s*(?:mg/dL)?",
        r"LDL[-\s]?Cholesterol[:\s]+(\d+(?:\.\d+)?)",
        r"Low.Density.Lipoprotein[:\s]+(\d+(?:\.\d+)?)"
    ]
    hdl_patterns = [
        r"HDL[:\s]+(\d+(?:\.\d+)?)\s*(?:mg/dL)?",
        r"HDL[-\s]?Cholesterol[:\s]+(\d+(?:\.\d+)?)",
        r"High.Density.Lipoprotein[:\s]+(\d+(?:\.\d+)?)"
    ]
    total_chol_patterns = [
        r"Total.Cholesterol[:\s]+(\d+(?:\.\d+)?)",
        r"Cholesterol[,\s]+Total[:\s]+(\d+(?:\.\d+)?)"
    ]

    ldl_val = None
    hdl_val = None
    total_chol = None

    for pattern in ldl_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            ldl_val = float(match.group(1))
            break

    for pattern in hdl_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            hdl_val = float(match.group(1))
            break

    for pattern in total_chol_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            total_chol = float(match.group(1))
            break

    if ldl_val or hdl_val:
        metrics["cholesterol"].append({
            "date": datetime.now().strftime("%Y-%m-%d"),
            "ldl": ldl_val or 0,
            "hdl": hdl_val or 0,
            "total": total_chol
        })

    # A1C patterns
    a1c_patterns = [
        r"(?:HbA1c|A1C|Hemoglobin\s*A1c)[:\s]+(\d+(?:\.\d+)?)\s*%?",
        r"Glycated\s*Hemoglobin[:\s]+(\d+(?:\.\d+)?)",
        r"A1C\s*(?:Level)?[:\s]+(\d+(?:\.\d+)?)"
    ]
    glucose_patterns = [
        r"Fasting\s*(?:Blood\s*)?Glucose[:\s]+(\d+(?:\.\d+)?)",
        r"FBG[:\s]+(\d+(?:\.\d+)?)",
        r"Blood\s*Sugar[:\s]+(\d+(?:\.\d+)?)"
    ]

    a1c_val = None
    glucose_val = None

    for pattern in a1c_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            a1c_val = float(match.group(1))
            break

    for pattern in glucose_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            glucose_val = float(match.group(1))
            break

    if a1c_val:
        metrics["a1c"].append({
            "date": datetime.now().strftime("%Y-%m-%d"),
            "value": a1c_val,
            "fasting_glucose": glucose_val
        })

    # Blood Pressure patterns
    bp_patterns = [
        r"(?:Blood\s*Pressure|BP)[:\s]+(\d+)\s*/\s*(\d+)",
        r"(\d{2,3})\s*/\s*(\d{2,3})\s*(?:mmHg)?",
        r"Systolic[:\s]+(\d+).*?Diastolic[:\s]+(\d+)"
    ]

    for pattern in bp_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            sys_val = int(match.group(1))
            dia_val = int(match.group(2))
            if 60 <= sys_val <= 250 and 40 <= dia_val <= 150:
                metrics["blood_pressure"].append({
                    "date": datetime.now().strftime("%Y-%m-%d"),
                    "systolic": sys_val,
                    "diastolic": dia_val
                })
                break

    # Basic genomic variant detection
    gene_patterns = [
        r"(BRCA[12])[:\s]+(c\.[^\s,]+)",
        r"(TP53)[:\s]+(c\.[^\s,]+)",
        r"(APOE)[:\s]+(e[234]/e[234])",
        r"(MTHFR)[:\s]+(C677T|A1298C)"
    ]

    for pattern in gene_patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        for match in matches:
            gene, variant = match
            significance = "VUS"
            if "pathogenic" in text.lower():
                significance = "Pathogenic"
            elif "benign" in text.lower():
                significance = "Benign"

            metrics["genomic_variants"].append({
                "gene": gene.upper(),
                "variant": variant,
                "significance": significance,
                "interpretation": f"Variant detected in {gene.upper()} gene"
            })

    return metrics

router = APIRouter()

# ============================================================================
# PARALLEL PROCESSING HELPERS
# ============================================================================

async def async_rag_index(content: bytes, filename: str, content_type: str) -> tuple[str, int]:
    """Run RAG indexing in parallel - returns (full_text, chunk_count)"""
    try:
        from api.rag import get_vector_store
        from rag.ingester import DocumentIngester
        from rag.chunker import TextChunker
        
        logger.info(f"[PARALLEL] RAG indexing: {filename}")
        full_text = DocumentIngester.ingest_from_bytes(content, filename, content_type or "")
        
        chunker = TextChunker()
        chunks = chunker.chunk_with_sentences(full_text)
        vs = get_vector_store()
        vs.add_chunks(chunks)
        logger.info(f"[PARALLEL] RAG complete: {len(chunks)} chunks")
        return full_text, len(chunks)
    except Exception as e:
        logger.error(f"[PARALLEL] RAG failed: {e}")
        return "", 0

async def async_llm_extract(full_text: str) -> Optional[Dict[str, Any]]:
    """Run LLM extraction in parallel"""
    try:
        from llm.unified_client import unified_client
        import json
        
        logger.info("[PARALLEL] LLM extraction starting")
        prompt = f"""
        Extract clinical data from the following text into JSON format.
        Look for Cervical Cancer Risk features (Age, Number_of_sexual_partners, Smokes, STDs, IUD, etc.) and Diabetes features (Glucose, BMI, etc.).
        
        Text:
        {full_text[:3000]} 
        
        Return ONLY valid JSON.
        """
        
        llm_response = await unified_client.execute_task("extraction", prompt)
        
        if llm_response:
            cleaned_json = llm_response.strip()
            if '```json' in cleaned_json:
                cleaned_json = cleaned_json.split('```json')[1].split('```')[0]
            elif '```' in cleaned_json:
                cleaned_json = cleaned_json.replace('```', '')
                
            data = json.loads(cleaned_json)
            logger.info("[PARALLEL] LLM extraction successful")
            return data
        return None
    except Exception as e:
        logger.warning(f"[PARALLEL] LLM extraction failed: {e}")
        return None

# ============================================================================
# MAIN ENDPOINT WITH PARALLEL PROCESSING
# ============================================================================

@router.post("/")
async def analyze_report(file: UploadFile = File(...)):
    """
    Analyze clinical report with PARALLEL PROCESSING:
    - RAG indexing runs concurrently with parsing
    - LLM extraction runs if needed
    - Cancer + Diabetes predictions run in parallel
    """
    try:
        content = await file.read()
        
        # Step 1: Parse PDF (fast regex extraction)
        parsed_data = ReportParser.extract_data(content)
        
        # Step 2: PARALLEL - Start RAG indexing immediately
        rag_task = asyncio.create_task(async_rag_index(content, file.filename, file.content_type or ""))
        
        # Step 3: Wait for RAG to get full text
        full_text, chunk_count = await rag_task
        
        # Step 4: PARALLEL - Run LLM extraction if needed
        if not parsed_data.get('cancer_data') and not parsed_data.get('diabetes_data'):
            llm_data = await async_llm_extract(full_text)
            if llm_data:
                parsed_data.update(llm_data)
        
        # Step 5: PARALLEL - Run both risk predictions concurrently
        tasks = []
        task_names = []
        
        if parsed_data.get('cancer_data'):
            cancer_input = CervicalCancerRiskInput(**parsed_data['cancer_data'])
            tasks.append(predict_cervical_cancer_risk(cancer_input))
            task_names.append('cancer')
        
        if parsed_data.get('diabetes_data'):
            diabetes_input = DiabetesRiskInput(**parsed_data['diabetes_data'])
            tasks.append(predict_diabetes_risk(diabetes_input))
            task_names.append('diabetes')
        
        # Execute predictions in parallel
        if tasks:
            logger.info(f"[PARALLEL] Running {len(tasks)} predictions concurrently")
            results = await asyncio.gather(*tasks, return_exceptions=True)
        else:
            results = []
        
        # Step 6: Extract health metrics from report text
        health_metrics = extract_health_metrics(full_text)

        # Step 7: Build response
        cancer_result = None
        diabetes_result = None
        modules_run = []

        for i, task_name in enumerate(task_names):
            if not isinstance(results[i], Exception):
                if task_name == 'cancer':
                    cancer_result = results[i]
                    modules_run.append("Cancer Risk")
                elif task_name == 'diabetes':
                    diabetes_result = results[i]
                    modules_run.append("Diabetes Risk")

        # Add health metrics modules if data found
        if health_metrics["cholesterol"]:
            modules_run.append("Lipid Panel")
        if health_metrics["a1c"]:
            modules_run.append("A1C Monitoring")
        if health_metrics["blood_pressure"]:
            modules_run.append("Blood Pressure")
        if health_metrics["genomic_variants"]:
            modules_run.append("Genomic Analysis")

        return {
            "ingestion_metadata": {
                "document_type": "clinical_report",
                "file_name": file.filename,
                "rag_indexed": chunk_count > 0,
                "chunks_indexed": chunk_count,
                "parallel_processing": True
            },
            "modules_run": modules_run,
            "cancer_risk": cancer_result,
            "diabetes_risk": diabetes_result,
            "health_metrics": {
                "cholesterol": health_metrics["cholesterol"],
                "a1c": health_metrics["a1c"],
                "blood_pressure": health_metrics["blood_pressure"]
            },
            "genomic_data": {
                "variants": health_metrics["genomic_variants"],
                "risk_scores": [],
                "predictions": []
            },
            "text_summary": parsed_data.get('text_summary', full_text[:500])
        }
        
    except Exception as e:
        logger.error(f"Report analysis failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")
