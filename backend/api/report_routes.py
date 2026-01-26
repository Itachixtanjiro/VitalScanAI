from fastapi import APIRouter, UploadFile, File, HTTPException
from utils.report_parser import ReportParser
from api.model_loader import ModelLoader
from api.routers.diabetes import predict_diabetes, DiabetesInput
from api.routers.cancer import predict_cancer_risk, CancerRiskInput
import logging
import pandas as pd
import asyncio
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)

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
        Look for Cancer Risk features (radius_mean, texture_mean, etc.) and Diabetes features (Glucose, BMI, etc.).
        
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
            cancer_input = CancerRiskInput(**parsed_data['cancer_data'])
            tasks.append(predict_cancer_risk(cancer_input))
            task_names.append('cancer')
        
        if parsed_data.get('diabetes_data'):
            diabetes_input = DiabetesInput(**parsed_data['diabetes_data'])
            tasks.append(predict_diabetes(diabetes_input))
            task_names.append('diabetes')
        
        # Execute predictions in parallel
        if tasks:
            logger.info(f"[PARALLEL] Running {len(tasks)} predictions concurrently")
            results = await asyncio.gather(*tasks, return_exceptions=True)
        else:
            results = []
        
        # Step 6: Build response
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
            "text_summary": parsed_data.get('text_summary', full_text[:500])
        }
        
    except Exception as e:
        logger.error(f"Report analysis failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")
