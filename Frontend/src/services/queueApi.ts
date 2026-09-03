/**
 * Frontend Queue API Client for Incident AI.
 * Handles async job submission, polling Redis status, and querying Kafka telemetry.
 */

export interface QueueJobSubmitPayload {
  job_type?: 'log_analysis' | 'error_rectify'
  content?: string
  file_name?: string
  error_message?: string
  component?: string | null
  log_id?: string
  priority?: 1 | 2 | 3
}

export interface QueueJobResponse {
  job_id: string
  session_id: string
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'RETRYING' | 'DEAD'
  priority: number
  created_at: string
  message: string
}

export interface QueueStatusResponse {
  job_id: string
  session_id: string
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'RETRYING' | 'DEAD'
  total_logs?: number
  detected_errors?: number
  started_at?: string
  completed_at?: string
  error_message?: string
  retry_count?: number
}

export interface QueueTelemetry {
  broker: string
  active_topics: string[]
  consumer_group: string
  partitions: number
  queue_depth: number
  processing: number
  completed: number
  dlq_size: number
  active_workers: number
}

const API_BASE = '' // Handled by Vite dev proxy -> http://127.0.0.1:8000

export async function submitAsyncJob(payload: QueueJobSubmitPayload): Promise<QueueJobResponse> {
  const res = await fetch(`${API_BASE}/api/queue/jobs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to queue job' }))
    throw new Error(err.detail || 'Queue submission rejected')
  }
  return (await res.json()) as QueueJobResponse
}

export async function pollJobStatus(jobId: string): Promise<QueueStatusResponse> {
  const res = await fetch(`${API_BASE}/api/queue/jobs/${jobId}/status`)
  if (!res.ok) {
    throw new Error(`Job ${jobId} status lookup failed`)
  }
  return (await res.json()) as QueueStatusResponse
}

export async function fetchJobResult(jobId: string): Promise<any> {
  const res = await fetch(`${API_BASE}/api/queue/jobs/${jobId}/result`)
  if (!res.ok) {
    throw new Error(`Job ${jobId} result lookup failed`)
  }
  return await res.json()
}

export async function fetchQueueTelemetry(): Promise<QueueTelemetry> {
  const res = await fetch(`${API_BASE}/api/queue/telemetry`)
  if (!res.ok) {
    return {
      broker: 'Apache Kafka (KRaft mode)',
      active_topics: ['incident-jobs', 'incident-results', 'incident-dlq'],
      consumer_group: 'incident-ai-workers',
      partitions: 3,
      queue_depth: 0,
      processing: 0,
      completed: 0,
      dlq_size: 0,
      active_workers: 1,
    }
  }
  return (await res.json()) as QueueTelemetry
}
