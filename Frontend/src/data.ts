export type ViewId = 'feed' | 'detect' | 'guard' | 'chain' | 'profile'

export interface NavItem {
  view: ViewId
  num: string
  label: string
}

export const NAV_ITEMS: NavItem[] = [
  { view: 'feed', num: '01', label: 'Live Feed' },
  { view: 'detect', num: '02', label: 'Detection' },
  { view: 'guard', num: '03', label: 'Model Guard' },
  { view: 'chain', num: '04', label: 'Timechain' },
  { view: 'profile', num: '05', label: 'Profile' },
]

export const CARD_DETAILS: [string, string, string][] = [
  ['01 / LIVE FEED', 'Parsed Log Stream', 'Inspect real parsed logs from your ingested log file with service attribution, timestamps, and log level filters.'],
  ['02 / DETECTION', 'Threat & Error Signals', 'Isolate real runtime exceptions, database timeouts, connection drops, and syntax failures identified in your logs.'],
  ['03 / MODEL GUARD', 'AI Root Cause Synthesis', 'Review reasoning from the NVIDIA Nemotron AI engine: confidence calibration, grounded evidence, and mitigation steps.'],
  ['04 / TIMECHAIN', 'Incident Chronology', 'Follow the chronological sequence of events reconstructed by the AI model from the initial signal to system failure.'],
  ['05 / PROFILE', 'Investigation Hub', 'Manage your log analysis sessions, historical incident reports, and view backend connection telemetry.'],
]

export type LogLevel = 'INFO' | 'WARN' | 'WARNING' | 'ERROR' | 'CRITICAL' | 'FATAL' | 'DEBUG' | 'TRACE' | 'UNKNOWN'

export interface ParsedLogEvent {
  log_id: string
  timestamp: string | null
  level: string
  component: string | null
  message: string
  raw_log: string
}

export interface DetectedError {
  log_id: string
  level: string
  message: string
  timestamp?: string | null
}

export interface RootCause {
  cause: string
  type: string // 'hypothesis' | 'fact'
  confidence: number
  evidence_log_ids: string[]
  reasoning: string
}

export interface TimelineEvent {
  log_id: string
  event: string
}

export interface AnalysisResponse {
  summary: string
  root_cause_analysis: RootCause[]
  timeline: TimelineEvent[]
  recommendations: string[]
}

export interface AnalysisResult {
  session_id: string
  status: 'completed' | 'failed' | 'analysis_started' | string
  total_logs: number
  detected_errors: number
  errors: DetectedError[]
  analysis: AnalysisResponse
}

export interface SessionData extends AnalysisResult {
  parsedLogs: ParsedLogEvent[]
  rawContent?: string
  fileName?: string
  createdAt: string
}

export function pad(n: number) {
  return n.toString().padStart(2, '0')
}

export function formatTime(d: Date = new Date()) {
  return pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds())
}
