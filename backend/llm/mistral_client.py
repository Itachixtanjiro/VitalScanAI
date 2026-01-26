import logging
import aiohttp
import asyncio
from typing import Optional, Dict, Any
from config import settings

logger = logging.getLogger(__name__)

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
        else:
            prompt = input_text

        payload = {
            "model": self.model,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.1,
            "response_format": {"type": "json_object"} if task_type == 'extraction' else None
        }

        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    self.endpoint, 
                    headers={"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"},
                    json=payload,
                    timeout=10
                ) as response:
                    if response.status != 200:
                        err = await response.text()
                        logger.error(f"Mistral API Error ({response.status}): {err}")
                        return None
                    
                    data = await response.json()
                    content = data['choices'][0]['message']['content']
                    return content

        except Exception as e:
            logger.error(f"Mistral Connection Failed: {e}")
            return None

mistral_client = MistralClient()
