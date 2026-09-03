import logging
import threading

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api import logs, analysis, queue, incidents

logger = logging.getLogger("main")

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


def _start_worker_in_background():
    """
    Runs the Kafka consumer worker in a background thread inside this same
    web service process, so a separate (paid) Render Background Worker isn't
    needed. Controlled by RUN_WORKER_INLINE (defaults to enabled).
    """
    import os
    if os.getenv("RUN_WORKER_INLINE", "true").lower() not in ("1", "true", "yes"):
        logger.info("RUN_WORKER_INLINE is disabled; not starting inline worker.")
        return

    def _run():
        try:
            from app.workers.incident_worker import IncidentWorker
            logger.info("Starting inline Kafka worker thread...")
            IncidentWorker().run()
        except Exception:
            logger.exception("Inline Kafka worker thread crashed")

    thread = threading.Thread(target=_run, name="incident-worker", daemon=True)
    thread.start()


@app.on_event("startup")
def on_startup():
    _start_worker_in_background()


@app.get("/")
def root():
    return {"message": "Welcome to the AI-powered Log Analyzer API"}

@app.get("/api/health")
def health():
    return {"status": "ok", "service": "Incident AI Engine"}

