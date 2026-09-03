"""
Kafka Producer Service for Incident AI.
Connects to Kafka in KRaft mode and publishes async jobs to incident-jobs topic.
"""
import json
import logging
from typing import Optional, Dict, Any
from app.core.config import settings

logger = logging.getLogger(__name__)

class KafkaProducerService:
    _instance: Optional["KafkaProducerService"] = None
    _producer = None
    _offline: bool = False
    _last_check: float = 0

    def __init__(self):
        self._try_connect()

    def _is_port_open(self, host: str, port: int) -> bool:
        import socket
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(0.1)
            result = sock.connect_ex((host, port))
            sock.close()
            return result == 0
        except Exception:
            return False

    def _try_connect(self):
        import time
        self._last_check = time.time()
        
        # Fast socket probe: if port is closed, immediately flag offline in 0.1s instead of 60s
        host, port = settings.KAFKA_BOOTSTRAP_SERVERS.split(":")
        if not self._is_port_open(host, int(port)):
            self._offline = True
            self._producer = None
            return

        try:
            from kafka import KafkaProducer
            self._producer = KafkaProducer(
                bootstrap_servers=settings.KAFKA_BOOTSTRAP_SERVERS,
                value_serializer=lambda v: json.dumps(v, default=str).encode("utf-8"),
                key_serializer=lambda k: k.encode("utf-8") if k else None,
                acks="all",
                retries=1,
                request_timeout_ms=500,
                compression_type="gzip",
            )
            self._offline = False
            logger.info(f"[Kafka] Producer connected to {settings.KAFKA_BOOTSTRAP_SERVERS}")
        except Exception:
            self._offline = True
            self._producer = None

    @classmethod
    def get_instance(cls) -> "KafkaProducerService":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def publish_job(self, job_id: str, payload: Dict[str, Any], topic: Optional[str] = None) -> bool:
        """Publishes an analysis or rectification job to Kafka topic."""
        target_topic = topic or settings.KAFKA_TOPIC_JOBS
        import time
        now = time.time()
        if self._offline and (now - self._last_check < 15):
            return False

        if self._producer is None:
            self._try_connect()
            if self._producer is None:
                return False

        try:
            future = self._producer.send(target_topic, key=job_id, value=payload)
            metadata = future.get(timeout=1.5)
            logger.info(f"[Kafka] Job {job_id} sent to {metadata.topic} partition {metadata.partition}")
            return True
        except Exception as e:
            logger.error(f"[Kafka] Error sending job {job_id}: {e}")
            return False

    def close(self):
        if self._producer:
            try:
                self._producer.flush()
                self._producer.close()
            except Exception:
                pass

def get_kafka_producer() -> KafkaProducerService:
    return KafkaProducerService.get_instance()
