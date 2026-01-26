import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import logging
import asyncio
import time
import re
from typing import Optional, List
from config import settings
from llm.prompt_templates import SAFE_SUMMARY_PROMPT, CLINICAL_PARSE_PROMPT

logger = logging.getLogger(__name__)

class CircuitBreakerOpenException(Exception):
    pass

class SafetyViolationException(Exception):
    pass

class MedGemmaClient:
    """
    Client for MedGemma specialized medical LLM.
    
    SAFETY CONSTRAINTS:
    - Task-restricted: Parsing & Summarization ONLY.
    - Output Guarded: explicitly checks for diagnostic language.
    - Reliability: Implements Timeout, Retry, Circuit Breaker.
    """
    
    def __init__(self):
        self.endpoint = settings.MEDGEMMA_ENDPOINT
        self.api_key = settings.GEMINI_API_KEY
        
        # Reliability Config
        self.max_retries = 3
        self.timeout_sec = 5.0
        self.circuit_breaker_failures = 0
        self.circuit_breaker_threshold = 5
        self.circuit_breaker_reset_time = 60
        self.last_failure_time = 0
        self.max_tokens = 512

    def _check_circuit_breaker(self):
        if self.circuit_breaker_failures >= self.circuit_breaker_threshold:
            time_since_failure = time.time() - self.last_failure_time
            if time_since_failure < self.circuit_breaker_reset_time:
                logger.warning("MedGemma Circuit Breaker OPEN. Request rejected.")
                raise CircuitBreakerOpenException("MedGemma service temporarily unavailable due to accumulated errors.")
            else:
                self.circuit_breaker_failures = 0
                logger.info("MedGemma Circuit Breaker resetting...")

    def _validate_safety(self, text: str) -> str:
        """
        Post-generation guardrail.
        Rejects output if it mimics a diagnosis or probability score.
        """
        forbidden_patterns = [
            r"diagnos(is|e)", 
            r"probability of", 
            r"malignancy risk", 
            r"recommend treatment",
            r"confidence score"
        ]
        
        for pattern in forbidden_patterns:
            if re.search(pattern, text, re.IGNORECASE):
                logger.warning(f"Safety Violation: Detected forbidden pattern '{pattern}' in LLM output.")
                raise SafetyViolationException("Output blocked: LLM attempted to produce diagnostic content.")
        
        return text

    async def _simulate_network_call(self, prompt: str) -> str:
        """
        Simulates the backend LLM call for the prototype.
        """
        await asyncio.sleep(0.5)
        
        if "summarize" in prompt.lower():
            return "Patient presented with consistent vital signs. No acute distress noted in history."
        elif "extract" in prompt.lower() or "json" in prompt.lower():
            # Return valid mock JSON for Cancer/Diabetes extraction
            return """
            {
                "cancer_data": {
                    "radius_mean": 14.1,
                    "texture_mean": 19.3,
                    "perimeter_mean": 92.0,
                    "area_mean": 650.0,
                    "smoothness_mean": 0.09,
                    "compactness_mean": 0.1,
                    "concavity_mean": 0.08,
                    "concave_points_mean": 0.04,
                    "symmetry_mean": 0.18,
                    "fractal_dimension_mean": 0.06
                },
                "diabetes_data": {
                    "Glucose": 110,
                    "BMI": 28.5,
                    "Age": 45
                }
            }
            """
        return "Processed clinical text artifact."

    async def execute_task(self, task_type: str, input_text: str) -> Optional[str]:
        self._check_circuit_breaker()
        
        prompt_template = SAFE_SUMMARY_PROMPT if task_type == 'summary' else CLINICAL_PARSE_PROMPT
        full_prompt = prompt_template.format(text=input_text)
        
        for attempt in range(self.max_retries):
            try:
                result = await asyncio.wait_for(
                    self._simulate_network_call(full_prompt), 
                    timeout=self.timeout_sec
                )
                
                if len(result) > self.max_tokens * 4:
                    logger.warning("Token limit exceeded. Truncating.")
                    result = result[:self.max_tokens * 4]
                
                safe_result = self._validate_safety(result)
                
                self.circuit_breaker_failures = 0
                return safe_result

            except (asyncio.TimeoutError, Exception) as e:
                logger.error(f"MedGemma call failed (Attempt {attempt+1}/{self.max_retries}): {str(e)}")
                
                if attempt == self.max_retries - 1:
                    self.circuit_breaker_failures += 1
                    self.last_failure_time = time.time()
                    raise e
                
                await asyncio.sleep(2 ** attempt)
        
        return None

medgemma_client = MedGemmaClient()
