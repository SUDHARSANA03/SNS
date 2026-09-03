import { AnalysisResult, ParsedLogEvent } from '../data'

const API_BASE = (import.meta as any).env?.VITE_API_URL || ''

export async function checkBackendHealth(): Promise<{ ok: boolean; message?: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/health`, { method: 'GET' })
    if (res.ok) {
      return { ok: true, message: 'FastAPI Backend Connected' }
    }
    return { ok: false }
  } catch (err: any) {
    return { ok: false, message: err.message }
  }
}

export async function uploadLogFile(file: File): Promise<AnalysisResult> {
  const formData = new FormData()
  formData.append('file', file)

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 30000)

  try {
    const response = await fetch(`${API_BASE}/api/logs/upload`, {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      let errorDetail = 'Upload failed'
      try {
        const errJson = await response.json()
        errorDetail = errJson.detail || errorDetail
      } catch {
        errorDetail = `HTTP ${response.status}: ${response.statusText}`
      }
      throw new Error(errorDetail)
    }

    return (await response.json()) as AnalysisResult
  } catch (err: any) {
    clearTimeout(timeoutId)
    if (err.name === 'AbortError') {
      throw new Error('Backend analysis timed out (30s limit exceeded).')
    }
    throw err
  }
}

export async function fetchSessionAnalysis(sessionId: string): Promise<AnalysisResult> {
  const response = await fetch(`${API_BASE}/api/analysis/${sessionId}`)
  if (!response.ok) {
    throw new Error(`Session ${sessionId} not found`)
  }
  return (await response.json()) as AnalysisResult
}

// Regex matching backend logic from app/services/log_parser.py
const LOG_PATTERN = /^(?:(?<timestamp>\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(?:\.\d+)?)Z?\s+)?(?:(?<brackets>(?:\[[^\]]*\]\s*)+)\s*)?(?:(?<level>INFO|ERROR|WARN|WARNING|CRITICAL|FATAL|DEBUG|TRACE|Exception)\b[:\s]+)?(?<message>.*)$/i
const CONTINUATION_PATTERN = /^(?:\s{2,}|\t|at )/
const LEVEL_NAMES = new Set(['INFO', 'WARN', 'WARNING', 'ERROR', 'CRITICAL', 'FATAL', 'DEBUG', 'TRACE', 'EXCEPTION'])

function extractLevelAndComponent(bracketStr: string): { level: string | null; component: string | null } {
  const matches = Array.from(bracketStr.matchAll(/\[([^\]]*)\]/g)).map((m) => m[1])
  let level: string | null = null
  const components: string[] = []

  for (const part of matches) {
    const up = part.toUpperCase()
    if (!level && LEVEL_NAMES.has(up)) {
      level = up === 'WARN' ? 'WARNING' : up === 'EXCEPTION' ? 'ERROR' : up
    } else {
      components.push(part)
    }
  }

  return {
    level,
    component: components.length > 0 ? components.join(':') : null,
  }
}

export function parseLogContentClient(content: string): ParsedLogEvent[] {
  const events: ParsedLogEvent[] = []
  const lines = content.split(/\r?\n/)
  let idCounter = 1

  for (const rawLine of lines) {
    const trimmed = rawLine.trim()
    if (!trimmed) continue

    if (events.length > 0 && CONTINUATION_PATTERN.test(rawLine)) {
      const prev = events[events.length - 1]
      prev.message = prev.message + '\n' + trimmed
      prev.raw_log = prev.raw_log + '\n' + rawLine
      continue
    }

    const logId = `log_${(idCounter++).toString().padStart(6, '0')}`
    const match = rawLine.match(LOG_PATTERN)

    if (match && match.groups) {
      const g = match.groups
      let timestamp = g.timestamp || null
      let bracketLevel: string | null = null
      let component: string | null = null

      if (g.brackets) {
        const extracted = extractLevelAndComponent(g.brackets)
        bracketLevel = extracted.level
        component = extracted.component
      }

      let level = g.level ? g.level.toUpperCase() : bracketLevel || 'UNKNOWN'
      if (level === 'WARN') level = 'WARNING'
      if (level === 'EXCEPTION') level = 'ERROR'

      // Keyword based promotion if unknown or info
      const msg = g.message || trimmed
      if (
        (level === 'INFO' || level === 'UNKNOWN') &&
        /\b(?:Exception|Traceback|Failed|Connection refused|Timeout|crash|crashed|fatal|critical)\b/i.test(msg)
      ) {
        level = 'ERROR'
      }

      events.push({
        log_id: logId,
        timestamp,
        level,
        component,
        message: msg,
        raw_log: rawLine,
      })
    } else {
      events.push({
        log_id: logId,
        timestamp: null,
        level: 'UNKNOWN',
        component: null,
        message: trimmed,
        raw_log: rawLine,
      })
    }
  }

  return events
}
