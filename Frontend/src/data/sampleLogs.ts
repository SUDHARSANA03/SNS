export interface SampleLogScenario {
  id: string
  title: string
  category: string
  description: string
  fileName: string
  content: string
}

export const SAMPLE_LOGS: SampleLogScenario[] = [
  {
    id: 'db-pool-exhaustion',
    title: 'Payment DB Pool Saturation',
    category: 'Database / E-Commerce',
    description: 'High throughput traffic causing connection starvation on PostgreSQL primary, leading to 504 Gateway Timeouts in payment-api.',
    fileName: 'payment-db-saturation.log',
    content: `2026-09-02T10:28:01.120Z [INFO] [api-gateway] Incoming traffic spike: 210 req/s -> 520 req/s on /checkout
2026-09-02T10:28:15.450Z [INFO] [payment-api] Processing batch payment authorizations (count=350)
2026-09-02T10:28:30.880Z [INFO] [db-primary] Connection pool usage at 64% (64/100 connections active)
2026-09-02T10:29:05.210Z [WARN] [payment-api] Latency degradation detected: p99 increased from 140ms to 890ms
2026-09-02T10:29:40.004Z [INFO] [order-service] Order #94821 awaiting payment settlement confirmation
2026-09-02T10:30:02.311Z [WARN] [db-primary] Connection pool limit reached: 100/100 active connections
2026-09-02T10:30:15.654Z [ERROR] [payment-api] Connection timeout acquiring DB handle after 15000ms
    at DatabasePool.acquireConnection (pg-pool.js:142)
    at PaymentProcessor.chargeCard (payment.service.js:88)
2026-09-02T10:30:18.902Z [ERROR] [payment-api] Failed to execute query: SELECT * FROM payment_methods WHERE user_id = $1
    ConnectionRefusedError: connection pool exhausted
2026-09-02T10:30:21.430Z [ERROR] [api-gateway] HTTP 504 Gateway Timeout returned for /api/v1/payments/charge (1,240 requests impacted)
2026-09-02T10:30:25.120Z [CRITICAL] [health-monitor] Service payment-api degraded: health check failed 3 consecutive times
2026-09-02T10:30:35.800Z [INFO] [circuit-breaker] Tripped circuit breaker for payment-api. Requests rerouted to fallback queue.`,
  },
  {
    id: 'auth-jwt-storm',
    title: 'Auth Microservice Token Expiry Storm',
    category: 'Security / Authentication',
    description: 'Expired signing key rotation triggering Redis token cache eviction, leading to authentication cascading failures.',
    fileName: 'auth-cascade-failure.log',
    content: `2026-09-02T14:10:00.000Z [INFO] [auth-service] Scheduled JWT signing key rotation initialized (key_id: k_2026_09)
2026-09-02T14:10:05.120Z [INFO] [cache-layer] Redis flush operation triggered on namespace auth:tokens
2026-09-02T14:10:12.330Z [WARN] [auth-service] Key signature verification mismatch for token header kid=k_2026_08
2026-09-02T14:10:18.770Z [ERROR] [auth-service] JsonWebTokenError: invalid signature
    at verifyToken (jwt_handler.py:54)
    at authenticate_request (middleware.py:112)
2026-09-02T14:10:22.400Z [ERROR] [auth-service] Failed to fetch public key from JWKS endpoint: Connection refused (jwks.internal.net:443)
2026-09-02T14:10:28.910Z [ERROR] [api-gateway] 401 Unauthorized spike: 8,400 user sessions rejected in 30 seconds
2026-09-02T14:10:35.200Z [CRITICAL] [auth-service] Redis connection pool timeout: cannot re-cache rotated certificates
2026-09-02T14:10:45.050Z [WARN] [notification-svc] Mass user alert: 'Session expired, please re-authenticate' queued (count=12,500)`,
  },
  {
    id: 'k8s-oom-crash',
    title: 'Kubernetes Memory Leak & CrashLoopBackOff',
    category: 'Infrastructure / Kubernetes',
    description: 'Worker node out-of-memory crash caused by uncollected stream buffer in notification-svc worker pod.',
    fileName: 'k8s-pod-crash.log',
    content: `2026-09-02T08:00:10.000Z [INFO] [k8s-kubelet] Pod notification-svc-78f99c855-4wz2k started on node ip-10-0-4-192
2026-09-02T08:05:00.120Z [INFO] [notification-svc] Subscribed to Kafka topic 'event-stream-v2' on partition 3
2026-09-02T08:12:30.450Z [WARN] [k8s-cadvisor] Memory usage above threshold: 92% (1.84GB / 2.0GB limit) for notification-svc
2026-09-02T08:15:00.002Z [ERROR] [notification-svc] Fatal error: JavaScript heap out of memory
    <--- Last few GCs --->
    [1:0x55c8290] 900120 ms: Mark-sweep 2041.2 (2055.4) -> 2038.9 (2055.4) MB, 1420.5 / 0.0 ms
2026-09-02T08:15:02.890Z [CRITICAL] [k8s-kubelet] Container notification-svc in pod notification-svc-78f99c855-4wz2k failed with status OOMKilled (exit code 137)
2026-09-02T08:15:10.150Z [WARN] [k8s-controller] Back-off restarting failed container notification-svc (CrashLoopBackOff)
2026-09-02T08:15:40.300Z [ERROR] [order-service] Failed to dispatch order status notification: downstream message queue backed up`,
  },
]
