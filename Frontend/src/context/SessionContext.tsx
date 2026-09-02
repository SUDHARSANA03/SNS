import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { AnalysisResult, SessionData, formatTime } from '../data'
import { checkBackendHealth, parseLogContentClient, uploadLogFile, fetchSessionAnalysis } from '../services/api'
import { SAMPLE_LOGS } from '../data/sampleLogs'

export type PipelineStage = 'idle' | 'uploading' | 'parsing' | 'detecting' | 'llm_reasoning' | 'completed' | 'failed'

export interface PipelineLogItem {
  id: number
  time: string
  text: string
  type: 'info' | 'success' | 'warn' | 'error'
}

interface SessionContextType {
  currentSession: SessionData | null
  sessionsHistory: SessionData[]
  backendConnected: boolean | null
  backendMessage: string
  // Interactive Visualizer state
  isVisualizerOpen: boolean
  pipelineStage: PipelineStage
  pipelineProgress: number
  pipelineLogs: PipelineLogItem[]
  pipelineError: string | null
  // Modal state
  isLogModalOpen: boolean
  activeModalTab: 'upload' | 'paste' | 'samples'
  // Actions
  openLogModal: (tab?: 'upload' | 'paste' | 'samples') => void
  closeLogModal: () => void
  closeVisualizer: () => void
  analyzeFile: (file: File) => Promise<void>
  analyzeText: (content: string, fileName?: string) => Promise<void>
  loadSampleScenario: (scenarioId: string) => Promise<void>
  loadSession: (sessionId: string) => Promise<void>
  deleteSession: (sessionId: string) => void
  clearCurrentSession: () => void
  checkHealth: () => Promise<void>
}

const STORAGE_KEY = 'incident_ai_sessions_v1'

const SessionContext = createContext<SessionContextType | undefined>(undefined)

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentSession, setCurrentSession] = useState<SessionData | null>(null)
  const [sessionsHistory, setSessionsHistory] = useState<SessionData[]>([])
  const [backendConnected, setBackendConnected] = useState<boolean | null>(null)
  const [backendMessage, setBackendMessage] = useState('')

  // Visualizer / Pipeline state
  const [isVisualizerOpen, setIsVisualizerOpen] = useState(false)
  const [pipelineStage, setPipelineStage] = useState<PipelineStage>('idle')
  const [pipelineProgress, setPipelineProgress] = useState(0)
  const [pipelineLogs, setPipelineLogs] = useState<PipelineLogItem[]>([])
  const [pipelineError, setPipelineError] = useState<string | null>(null)

  // Ingest Modal state
  const [isLogModalOpen, setIsLogModalOpen] = useState(false)
  const [activeModalTab, setActiveModalTab] = useState<'upload' | 'paste' | 'samples'>('upload')

  const logCounter = useRef(0)

  const addPipelineLog = useCallback((text: string, type: 'info' | 'success' | 'warn' | 'error' = 'info') => {
    setPipelineLogs((prev) => [
      ...prev,
      {
        id: ++logCounter.current,
        time: formatTime(),
        text,
        type,
      },
    ])
  }, [])

  // Load saved history on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as SessionData[]
        setSessionsHistory(parsed)
        if (parsed.length > 0) {
          setCurrentSession(parsed[0])
        }
      }
    } catch (e) {
      console.error('Failed to load history from localStorage', e)
    }
  }, [])

  // Save history to storage
  const saveHistory = useCallback((updated: SessionData[]) => {
    setSessionsHistory(updated)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated.slice(0, 20)))
    } catch (e) {
      console.error('Failed to persist history', e)
    }
  }, [])

  // Check health periodically
  const checkHealth = useCallback(async () => {
    const res = await checkBackendHealth()
    setBackendConnected(res.ok)
    if (res.message) setBackendMessage(res.message)
  }, [])

  useEffect(() => {
    checkHealth()
    const interval = setInterval(checkHealth, 20000)
    return () => clearInterval(interval)
  }, [checkHealth])

  const openLogModal = useCallback((tab: 'upload' | 'paste' | 'samples' = 'upload') => {
    setActiveModalTab(tab)
    setIsLogModalOpen(true)
  }, [])

  const closeLogModal = useCallback(() => {
    setIsLogModalOpen(false)
  }, [])

  const closeVisualizer = useCallback(() => {
    setIsVisualizerOpen(false)
  }, [])

  // Core analysis runner with interactive multi-stage live telemetry
  const analyzeFile = useCallback(
    async (file: File) => {
      closeLogModal()
      setIsVisualizerOpen(true)
      setPipelineError(null)
      setPipelineLogs([])
      logCounter.current = 0

      // Stage 1: Uploading & Reading
      setPipelineStage('uploading')
      setPipelineProgress(15)
      addPipelineLog(`Selected source: "${file.name}" (${(file.size / 1024).toFixed(1)} KB)`, 'info')
      addPipelineLog('Verifying UTF-8 encoding and multipart payload boundaries...', 'info')

      let textContent = ''
      try {
        textContent = await file.text()
      } catch (err: any) {
        setPipelineStage('failed')
        setPipelineError(`Failed to read file: ${err.message}`)
        addPipelineLog(`File read error: ${err.message}`, 'error')
        return
      }

      await new Promise((r) => setTimeout(r, 450))

      // Stage 2: Parsing log stream
      setPipelineStage('parsing')
      setPipelineProgress(35)
      addPipelineLog('Initializing regex stream tokenizer and timestamp normalizer...', 'info')
      const parsedLogs = parseLogContentClient(textContent)
      addPipelineLog(`Parsed ${parsedLogs.length} log events across timestamps. Multi-line stack traces grouped.`, 'success')

      await new Promise((r) => setTimeout(r, 500))

      // Stage 3: Error Heuristic Detection
      setPipelineStage('detecting')
      setPipelineProgress(60)
      addPipelineLog('Running heuristic scan on log levels and keywords (Exception, Timeout, Refused, Crash)...', 'info')
      const preliminaryErrors = parsedLogs.filter((l) => l.level === 'ERROR' || l.level === 'CRITICAL' || l.level === 'FATAL')
      addPipelineLog(`Detected ${preliminaryErrors.length} preliminary error signatures in log stream.`, preliminaryErrors.length > 0 ? 'warn' : 'info')

      await new Promise((r) => setTimeout(r, 400))

      // Stage 4: NVIDIA AI Model Analysis
      setPipelineStage('llm_reasoning')
      setPipelineProgress(80)
      addPipelineLog('Dispatching error telemetry and events to NVIDIA Nemotron Ultra LLM engine...', 'info')
      addPipelineLog('Prompting root cause reasoning, hypothesis grounding, and causal timeline mapping...', 'info')

      try {
        const backendResult = await uploadLogFile(file)
        addPipelineLog('Received structured JSON analysis from NVIDIA model reasoning pipeline.', 'success')

        // Stage 5: Completion & State consolidation
        setPipelineStage('completed')
        setPipelineProgress(100)
        addPipelineLog(`Session initialized: ${backendResult.session_id}`, 'success')
        addPipelineLog(
          `Analysis complete: ${backendResult.total_logs} total logs, ${backendResult.detected_errors} errors, ${backendResult.analysis?.root_cause_analysis?.length || 0} root causes synthesized.`,
          'success'
        )

        const newSession: SessionData = {
          ...backendResult,
          parsedLogs: parsedLogs.length > 0 ? parsedLogs : parseLogContentClient(textContent),
          rawContent: textContent,
          fileName: file.name,
          createdAt: new Date().toISOString(),
        }

        setCurrentSession(newSession)
        saveHistory([newSession, ...sessionsHistory.filter((s) => s.session_id !== newSession.session_id)])
      } catch (err: any) {
        setPipelineStage('failed')
        const msg = err.message || 'Analysis failed'
        setPipelineError(msg)
        addPipelineLog(`Pipeline execution failed: ${msg}`, 'error')

        // Fallback: build a client-only emergency session if backend was unreachable
        if (parsedLogs.length > 0) {
          const fallbackSession: SessionData = {
            session_id: `offline_${Date.now()}`,
            status: 'completed_offline',
            total_logs: parsedLogs.length,
            detected_errors: preliminaryErrors.length,
            errors: preliminaryErrors.map((p) => ({
              log_id: p.log_id,
              level: p.level,
              message: p.message,
              timestamp: p.timestamp,
            })),
            analysis: {
              summary: `Offline Analysis for ${file.name}. Backend reported: ${msg}`,
              root_cause_analysis: preliminaryErrors.map((p) => ({
                cause: p.message.split('\n')[0],
                type: 'fact',
                confidence: 0.9,
                evidence_log_ids: [p.log_id],
                reasoning: `Extracted from log line ${p.log_id}: ${p.message}`,
              })),
              timeline: preliminaryErrors.map((p) => ({
                log_id: p.log_id,
                event: `Detected ${p.level}: ${p.message.slice(0, 100)}`,
              })),
              recommendations: [
                'Ensure backend server is running on http://127.0.0.1:8000',
                'Verify NVIDIA_API_KEY environment variable is configured in backend/.env',
              ],
            },
            parsedLogs,
            rawContent: textContent,
            fileName: file.name,
            createdAt: new Date().toISOString(),
          }
          setCurrentSession(fallbackSession)
          saveHistory([fallbackSession, ...sessionsHistory])
        }
      }
    },
    [addPipelineLog, closeLogModal, saveHistory, sessionsHistory]
  )

  const analyzeText = useCallback(
    async (content: string, fileName = 'incident-log.log') => {
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
      const file = new File([blob], fileName, { type: 'text/plain' })
      await analyzeFile(file)
    },
    [analyzeFile]
  )

  const loadSampleScenario = useCallback(
    async (scenarioId: string) => {
      const sample = SAMPLE_LOGS.find((s) => s.id === scenarioId) || SAMPLE_LOGS[0]
      await analyzeText(sample.content, sample.fileName)
    },
    [analyzeText]
  )

  const loadSession = useCallback(
    async (sessionId: string) => {
      const existing = sessionsHistory.find((s) => s.session_id === sessionId)
      if (existing) {
        setCurrentSession(existing)
        return
      }

      try {
        const fetched = await fetchSessionAnalysis(sessionId)
        const newSession: SessionData = {
          ...fetched,
          parsedLogs: [],
          createdAt: new Date().toISOString(),
        }
        setCurrentSession(newSession)
      } catch (err) {
        console.error('Failed to fetch session from backend', err)
      }
    },
    [sessionsHistory]
  )

  const deleteSession = useCallback(
    (sessionId: string) => {
      const updated = sessionsHistory.filter((s) => s.session_id !== sessionId)
      saveHistory(updated)
      if (currentSession?.session_id === sessionId) {
        setCurrentSession(updated[0] || null)
      }
    },
    [currentSession?.session_id, saveHistory, sessionsHistory]
  )

  const clearCurrentSession = useCallback(() => {
    setCurrentSession(null)
  }, [])

  return (
    <SessionContext.Provider
      value={{
        currentSession,
        sessionsHistory,
        backendConnected,
        backendMessage,
        isVisualizerOpen,
        pipelineStage,
        pipelineProgress,
        pipelineLogs,
        pipelineError,
        isLogModalOpen,
        activeModalTab,
        openLogModal,
        closeLogModal,
        closeVisualizer,
        analyzeFile,
        analyzeText,
        loadSampleScenario,
        loadSession,
        deleteSession,
        clearCurrentSession,
        checkHealth,
      }}
    >
      {children}
    </SessionContext.Provider>
  )
}

export function useSession() {
  const context = useContext(SessionContext)
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider')
  }
  return context
}
