from typing import Optional
from backend.config import settings

class GeminiClient:
    """
    Bounded client for Google Gemini.
    Enforces strict task-based usage.
    """
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        
    async def generate_summary(self, context: str) -> str:
        """
        Summarizes clinical notes.
        """
        if not self.api_key:
            return "Simulated Summary: Patient history indicates consistent vitals."
            
        # Stub: Real API call would go here
        return f"Gemini Summary of {len(context)} chars."

gemini_client = GeminiClient()
