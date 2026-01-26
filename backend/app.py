from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import settings
from api import session, imaging, llm, risk, synthesis, rag, database # Restored
from api.routers import xray, cancer, diabetes # Corrected Paths
from api import report_routes

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Research Prototype - NOT FOR CLINICAL USE"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(session.router, prefix="/api/session", tags=["Session"])
app.include_router(imaging.router, prefix="/api/imaging", tags=["Imaging"])
app.include_router(llm.router, prefix="/api/llm", tags=["LLM"])
app.include_router(risk.router, prefix="/api/risk", tags=["Risk"])
app.include_router(synthesis.router, prefix="/api/synthesis", tags=["Synthesis"])
app.include_router(rag.router, prefix="/api/rag", tags=["RAG"])
app.include_router(database.router, prefix="/api/database", tags=["Database"])

# Unified Analysis Routes
app.include_router(xray.router, prefix="/api/imaging/predict/chest-xray", tags=["X-Ray"])
app.include_router(cancer.router, prefix="/api/risk/predict/cancer", tags=["Cancer"])
app.include_router(diabetes.router, prefix="/api/risk/predict/diabetes", tags=["Diabetes"])
app.include_router(report_routes.router, prefix="/api/analysis/report", tags=["Report Analysis"])

@app.get("/health")
async def health_check():
    return {"status": "ok", "mode": "development" if settings.DEBUG else "production"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)
