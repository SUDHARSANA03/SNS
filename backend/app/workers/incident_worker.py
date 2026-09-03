"""
Incident AI Async Worker (Kafka Consumer).
Processes log analysis and error rectification requests asynchronously.

Features:
- Reads from `incident-jobs` topic
- Executes parse_log_content -> detect_errors -> analyze_logs_with_llm (NVIDIA Nemotron)
- Updates Redis status: PROCESSING -> COMPLETED
- Handles retry backoff (1s -> 2s -> 4s)
- Exhausted jobs routed to Dead Letter Queue (`incident-dlq`) with DEAD status.
"""
import json
import time
import asyncio
import logging
from datetime import datetime, timezone
from app.core.config import settings
from app.core.kafka_auth import kafka_connection_kwargs
from app.core.redis_client import redis_service
from app.services.log_parser import parse_log_content
from app.services.error_detector import detect_errors
from app.services.llm_service import analyze_logs_with_llm
from app.services.log_analyzer import sessions

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [Worker] %(message)s"
)
logger = logging.getLogger("incident_worker")

RETRY_DELAYS = [1, 2, 4]

class IncidentWorker:
    def __init__(self):
        self._loop = asyncio.new_event_loop()
        asyncio.set_event_loop(self._loop)
        self._consumer = None
        self._producer = None

    def _init_kafka(self):
        from kafka import KafkaConsumer, KafkaProducer
        conn = kafka_connection_kwargs()
        self._consumer = KafkaConsumer(
            settings.KAFKA_TOPIC_JOBS,
            group_id=settings.KAFKA_GROUP_ID,
            value_deserializer=lambda m: json.loads(m.decode("utf-8")),
            key_deserializer=lambda k: k.decode("utf-8") if k else None,
            auto_offset_reset="earliest",
            enable_auto_commit=False,
            session_timeout_ms=30000,
            **conn,
        )
        self._producer = KafkaProducer(
            value_serializer=lambda v: json.dumps(v, default=str).encode("utf-8"),
            key_serializer=lambda k: k.encode("utf-8") if k else None,
            acks="all",
            **conn,
        )
        logger.info(f"Connected to Kafka broker: {settings.KAFKA_BOOTSTRAP_SERVERS}")

    async def _process_job(self, data: dict):
        job_id = data.get("job_id")
        session_id = data.get("session_id")
        content = data.get("content", "")
        file_name = data.get("file_name", "incident.log")
        retry_count = data.get("retry_count", 0)
        max_retries = data.get("max_retries", 3)

        logger.info(f"Start processing {job_id} (Session: {session_id})")

        # Mark PROCESSING in Redis
        await redis_service.set_job_status(job_id, "PROCESSING", {
            "job_id": job_id,
            "session_id": session_id,
            "status": "PROCESSING",
            "started_at": datetime.now(timezone.utc).isoformat(),
            "retry_count": retry_count,
        })

        try:
            # 1. Parse log stream
            events = parse_log_content(content)
            # 2. Detect error anomalies
            errors = detect_errors(events)
            # 3. NVIDIA Nemotron AI Root Cause Analysis
            analysis = await analyze_logs_with_llm(events, errors)

            analysis_dict = analysis.model_dump() if hasattr(analysis, "model_dump") else analysis

            result_payload = {
                "session_id": session_id,
                "job_id": job_id,
                "status": "completed",
                "file_name": file_name,
                "total_logs": len(events),
                "detected_errors": len(errors),
                "errors": [e.model_dump() if hasattr(e, "model_dump") else e for e in errors],
                "analysis": analysis_dict,
                "completed_at": datetime.now(timezone.utc).isoformat(),
            }

            # Cache in Redis and backend in-memory sessions
            sessions[session_id] = result_payload
            await redis_service.set_job_result(job_id, result_payload)
            await redis_service.set_job_status(job_id, "COMPLETED", {
                "job_id": job_id,
                "session_id": session_id,
                "status": "COMPLETED",
                "total_logs": len(events),
                "detected_errors": len(errors),
                "completed_at": datetime.now(timezone.utc).isoformat(),
            })

            logger.info(f"✓ Job {job_id} COMPLETED ({len(events)} logs, {len(errors)} errors)")

        except Exception as e:
            logger.error(f"Error executing job {job_id}: {e}")
            if retry_count < max_retries:
                delay = RETRY_DELAYS[min(retry_count, len(RETRY_DELAYS) - 1)]
                logger.warning(f"Retrying job {job_id} in {delay}s (Attempt {retry_count + 1}/{max_retries})")
                await redis_service.set_job_status(job_id, "RETRYING", {
                    "job_id": job_id,
                    "status": "RETRYING",
                    "retry_count": retry_count + 1,
                    "error_message": str(e),
                })
                await asyncio.sleep(delay)
                data["retry_count"] = retry_count + 1
                if self._producer:
                    self._producer.send(settings.KAFKA_TOPIC_JOBS, key=job_id, value=data)
                    self._producer.flush()
            else:
                logger.error(f"☠️ Job {job_id} exceeded max retries. Routing to Dead Letter Queue.")
                await redis_service.set_job_status(job_id, "DEAD", {
                    "job_id": job_id,
                    "status": "DEAD",
                    "error_message": str(e),
                    "dead_at": datetime.now(timezone.utc).isoformat(),
                })
                if self._producer:
                    self._producer.send(settings.KAFKA_TOPIC_DLQ, key=job_id, value={
                        **data,
                        "failure_reason": str(e),
                        "dead_at": datetime.now(timezone.utc).isoformat()
                    })
                    self._producer.flush()

    def run(self):
        logger.info("Starting Incident AI Kafka Worker (KRaft mode)...")
        while True:
            try:
                self._init_kafka()
                break
            except Exception as e:
                logger.warning(f"[Worker] Kafka broker at {settings.KAFKA_BOOTSTRAP_SERVERS} waiting for startup. Reconnecting in 5s... ({e})")
                time.sleep(5)

        logger.info(f"Subscribed to topic: '{settings.KAFKA_TOPIC_JOBS}'")
        try:
            for msg in self._consumer:
                payload = msg.value
                self._loop.run_until_complete(self._process_job(payload))
                self._consumer.commit()
        except KeyboardInterrupt:
            logger.info("Worker received shutdown signal.")
        finally:
            if self._consumer:
                self._consumer.close()
            if self._producer:
                self._producer.close()
            self._loop.close()

if __name__ == "__main__":
    worker = IncidentWorker()
    worker.run()
