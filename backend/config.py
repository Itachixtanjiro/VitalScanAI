import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    """
    Application configuration settings.
    Uses Pydantic for validation and strict typing.
    Values can be overridden by environment variables.
    """
    APP_NAME: str = "VitalScan AI Research Backend"
    APP_VERSION: str = "0.1.0-prototype"
    DEBUG: bool = True
    
    # Server Config
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # Security
    CORS_ORIGINS: list[str] = ["*"]
    
    # External APIs (Bounded)
    GEMINI_API_KEY: str | None = None
    MEDGEMMA_ENDPOINT: str | None = None
    MISTRAL_API_KEY: str | None = None  # Mistral API for NLP tasks
    
    # Feature Flags & Limits
    LLM_ENABLED: bool = True
    LLM_RATE_LIMIT_PER_MIN: int = 10
    
    # ML Config
    MOCK_ML_PIPELINE: bool = False  # Defaults to Mock for dev
    
    class Config:
        env_file = ".env"

settings = Settings()
