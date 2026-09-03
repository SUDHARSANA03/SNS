from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api import logs, analysis, queue, incidents

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For MVP
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(logs.router, prefix=f"{settings.API_V1_STR}/logs", tags=["logs"])
app.include_router(analysis.router, prefix=f"{settings.API_V1_STR}/analysis", tags=["analysis"])
app.include_router(queue.router, prefix=f"{settings.API_V1_STR}/queue", tags=["queue"])
app.include_router(incidents.router, prefix=f"{settings.API_V1_STR}/incidents", tags=["incidents"])

@app.get("/")
def root():
    return {"message": "Welcome to the AI-powered Log Analyzer API"}

@app.get("/api/health")
def health():
    return {"status": "ok", "service": "Incident AI Engine"}
