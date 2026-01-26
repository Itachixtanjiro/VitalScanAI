from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import xray, cancer, diabetes

app = FastAPI(title="VitalScanAI Analysis API")

# CORS Setup (Allow Frontend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, set this to the specific frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(xray.router, prefix="/predict/chest-xray", tags=["Chest X-ray"])
app.include_router(cancer.router, prefix="/predict/cancer-risk", tags=["Cancer Risk"])
app.include_router(diabetes.router, prefix="/predict/diabetic-risk", tags=["Diabetes Risk"])

@app.get("/health")
def health_check():
    return {"status": "ok", "version": "1.0.0"}
