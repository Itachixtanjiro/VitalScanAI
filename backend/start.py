"""
VitalScan AI Backend Startup Script
Properly configures environment and starts the server
"""
import os
import sys

# Suppress TensorFlow warnings BEFORE importing anything
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "2"  # 0=all, 1=INFO filtered, 2=WARNING filtered, 3=ERROR filtered
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"  # Disable oneDNN custom operations messages

# Load environment variables from .env if it exists
from dotenv import load_dotenv
load_dotenv()

# Now safe to import the rest
import uvicorn
from loguru import logger

# Configure logger
logger.remove()  # Remove default handler
logger.add(
    sys.stderr,
    format="<green>{time:HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan> - <level>{message}</level>",
    level=os.getenv("LOG_LEVEL", "INFO")
)

def main():
    """Start the VitalScan AI backend server"""

    logger.info("="*60)
    logger.info("Starting VitalScan AI Backend Server")
    logger.info("="*60)

    # Get configuration from environment
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))
    debug = os.getenv("DEBUG", "True").lower() == "true"

    logger.info(f"Host: {host}")
    logger.info(f"Port: {port}")
    logger.info(f"Debug Mode: {debug}")
    logger.info(f"Mock ML Pipeline: {os.getenv('MOCK_ML_PIPELINE', 'False')}")
    logger.info("="*60)

    # Start server
    uvicorn.run(
        "app:app",
        host=host,
        port=port,
        reload=debug,
        log_level="info" if debug else "warning"
    )

if __name__ == "__main__":
    main()
