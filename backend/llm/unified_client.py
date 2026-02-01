import logging
from typing import Optional
from llm.mistral_client import mistral_client

logger = logging.getLogger(__name__)

class UnifiedLLMClient:
    """
    Manages LLM routing strategies.
    Strategy: PRIMARY (Mistral) ONLY
    """
    
    async def execute_task(self, task_type: str, input_text: str) -> Optional[str]:
        # 1. Try Primary (Mistral)
        try:
            logger.info(f"Attempting Primary LLM (Mistral) for task: {task_type}")
            result = await mistral_client.execute_task(task_type, input_text)
            if result:
                logger.info("Primary LLM (Mistral) success.")
                return result
        except Exception as e:
            logger.error(f"Primary LLM unexpected crash: {e}")

        logger.warning("Primary LLM failed. No fallback available.")
        return None

unified_client = UnifiedLLMClient()
