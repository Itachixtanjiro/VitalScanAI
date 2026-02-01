import logging
import time
import aiohttp
import asyncio
from typing import Optional, Dict, Any, List
from config import settings

logger = logging.getLogger(__name__)

# In-memory LLM call log for admin dashboard
_llm_call_log: List[Dict[str, Any]] = []
MAX_LOG_SIZE = 500

class MistralClient:
    """
    Client for Mistral AI API.
    Handles extraction and summarization tasks.
    """
    def __init__(self):
        self.api_key = settings.MISTRAL_API_KEY
        self.endpoint = "https://api.mistral.ai/v1/chat/completions" # Standard Endpoint
        self.model = "mistral-tiny" # Efficient model

    async def execute_task(self, task_type: str, input_text: str) -> Optional[str]:
        """
        Executes a task using Mistral AIP.
        If API Key is missing, returns None to trigger fallback.
        """
        if not self.api_key:
            logger.warning("Mistral API Key missing. Skipping Mistral.")
            return None

        prompt = ""
        if task_type == 'summary':
            prompt = f"Summarize the following medical text concisely:\n\n{input_text}"
        elif task_type == 'extraction':
            prompt = f"""
            Extract clinical data from the text into JSON.
            Fields: Cancer Risk (radius_mean, etc.), Diabetes (Glucose, BMI, Age).
            Return ONLY valid JSON.

            Text:
            {input_text}
            """
        elif task_type == 'reasoning':
            prompt = (
                "You are a clinical decision support system generating a reasoning narrative "
                "for a practitioner. Based on the patient analysis data below, write a concise "
                "clinical reasoning paragraph (3-5 sentences).\n\n"
                "Requirements:\n"
                "- Reference specific findings from the data provided\n"
                "- Explain the clinical significance of each finding\n"
                "- Suggest appropriate follow-up if indicated\n"
                "- Use professional medical language\n"
                "- Do NOT include mathematical formulas, weights, or scoring calculations\n"
                "- Do NOT use markdown formatting\n\n"
                f"{input_text}"
            )
        else:
            prompt = input_text

        payload = {
            "model": self.model,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.1,
        }
        if task_type == 'extraction':
            payload["response_format"] = {"type": "json_object"}

        t0 = time.time()
        entry: Dict[str, Any] = {
            "timestamp": t0,
            "task_type": task_type,
            "model": self.model,
            "input_length": len(input_text),
            "status": "pending",
            "latency_ms": 0,
            "output_length": 0,
            "error": None,
        }

        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    self.endpoint,
                    headers={"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"},
                    json=payload,
                    timeout=aiohttp.ClientTimeout(total=30),
                ) as response:
                    latency = int((time.time() - t0) * 1000)
                    entry["latency_ms"] = latency

                    if response.status != 200:
                        err = await response.text()
                        logger.error(f"Mistral API Error ({response.status}): {err}")
                        entry["status"] = "error"
                        entry["error"] = f"HTTP {response.status}"
                        return None

                    data = await response.json()
                    content = data['choices'][0]['message']['content']
                    entry["status"] = "success"
                    entry["output_length"] = len(content) if content else 0
                    usage = data.get("usage", {})
                    entry["prompt_tokens"] = usage.get("prompt_tokens", 0)
                    entry["completion_tokens"] = usage.get("completion_tokens", 0)
                    entry["total_tokens"] = usage.get("total_tokens", 0)
                    return content

        except Exception as e:
            logger.error(f"Mistral Connection Failed: {e}")
            entry["status"] = "error"
            entry["error"] = str(e)
            entry["latency_ms"] = int((time.time() - t0) * 1000)
            return None
        finally:
            _llm_call_log.append(entry)
            if len(_llm_call_log) > MAX_LOG_SIZE:
                _llm_call_log.pop(0)

mistral_client = MistralClient()


def get_llm_call_log() -> List[Dict[str, Any]]:
    """Return the in-memory LLM call log (most recent last)."""
    return list(_llm_call_log)
