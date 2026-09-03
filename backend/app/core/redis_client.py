"""
Async Redis Client for Incident AI.
Handles job status tracking, live analysis results caching, and stats counters.
Falls back safely to in-memory dictionary if Redis server is offline.
"""
import json
import logging
from typing import Optional, Dict, Any
from app.core.config import settings

logger = logging.getLogger(__name__)

class RedisClientService:
    _instance: Optional["RedisClientService"] = None
    _redis = None
    _offline: bool = False
    _last_check: float = 0
    _memory_cache: Dict[str, Any] = {}

    def _is_port_open(self, host: str, port: int) -> bool:
        import socket
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(0.05)
            result = sock.connect_ex((host, port))
            sock.close()
            return result == 0
        except Exception:
            return False

    async def get_client(self):
        import time
        now = time.time()
        # If recently confirmed offline, skip attempting connection to keep response time sub-millisecond
        if self._offline and (now - self._last_check < 20):
            return None

        if self._redis is None:
            self._last_check = now
            if not self._is_port_open("127.0.0.1", 6379):
                self._offline = True
                self._redis = None
                return None

            try:
                import redis.asyncio as aioredis
                self._redis = aioredis.from_url(
                    settings.REDIS_URL,
                    encoding="utf-8",
                    decode_responses=True,
                    socket_connect_timeout=0.2,
                    socket_timeout=0.2,
                )
                await self._redis.ping()
                self._offline = False
                logger.info(f"[Redis] Connected to {settings.REDIS_URL}")
            except Exception:
                self._offline = True
                self._redis = None
        return self._redis

    async def set_job_status(self, job_id: str, status: str, extra: Optional[Dict[str, Any]] = None, ttl: int = 7200):
        data = {"job_id": job_id, "status": status}
        if extra:
            data.update(extra)

        r = await self.get_client()
        if r:
            try:
                await r.set(f"job:status:{job_id}", status, ex=ttl)
                await r.set(f"job:meta:{job_id}", json.dumps(data, default=str), ex=ttl)
                return
            except Exception as e:
                logger.warning(f"[Redis] set error: {e}")

        # In-memory fallback
        self._memory_cache[f"job:status:{job_id}"] = status
        self._memory_cache[f"job:meta:{job_id}"] = data

    async def get_job_status(self, job_id: str) -> Optional[Dict[str, Any]]:
        r = await self.get_client()
        if r:
            try:
                raw = await r.get(f"job:meta:{job_id}")
                if raw:
                    return json.loads(raw)
            except Exception:
                pass
        return self._memory_cache.get(f"job:meta:{job_id}")

    async def set_job_result(self, job_id: str, result: Dict[str, Any], ttl: int = 3600):
        r = await self.get_client()
        if r:
            try:
                await r.set(f"job:result:{job_id}", json.dumps(result, default=str), ex=ttl)
                return
            except Exception:
                pass
        self._memory_cache[f"job:result:{job_id}"] = result

    async def get_job_result(self, job_id: str) -> Optional[Dict[str, Any]]:
        r = await self.get_client()
        if r:
            try:
                raw = await r.get(f"job:result:{job_id}")
                if raw:
                    return json.loads(raw)
            except Exception:
                pass
        return self._memory_cache.get(f"job:result:{job_id}")

    async def get_queue_stats(self) -> Dict[str, Any]:
        """Returns high-level queue telemetry."""
        return {
            "queued_jobs": len([k for k, v in self._memory_cache.items() if k.startswith("job:status:") and v == "QUEUED"]),
            "processing_jobs": len([k for k, v in self._memory_cache.items() if k.startswith("job:status:") and v == "PROCESSING"]),
            "completed_jobs": len([k for k, v in self._memory_cache.items() if k.startswith("job:status:") and v == "COMPLETED"]),
            "dead_jobs": len([k for k, v in self._memory_cache.items() if k.startswith("job:status:") and v == "DEAD"]),
        }

redis_service = RedisClientService()
