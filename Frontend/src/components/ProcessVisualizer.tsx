import React, { useEffect, useRef } from 'react'
import { useSession, PipelineStage } from '../context/SessionContext'

interface StepConfig {
  id: PipelineStage
  label: string
  desc: string
  icon: string
}

const STAGES: StepConfig[] = [
  { id: 'uploading', label: '1. Ingest & Validation', desc: 'Read file stream & verify UTF-8 format', icon: '📥' },
  { id: 'parsing', label: '2. Regex Log Parser', desc: 'Tokenize timestamps & multiline traces', icon: '⚡' },
  { id: 'detecting', label: '3. Anomaly & Error Scan', desc: 'Isolate error levels & keyword faults', icon: '🔍' },
  { id: 'llm_reasoning', label: '4. NVIDIA AI Synthesis', desc: 'Nemotron LLM root cause & evidence', icon: '🧠' },
  { id: 'completed', label: '5. Pipeline Ready', desc: 'Consolidate timeline & recommendations', icon: '✨' },
]

export default function ProcessVisualizer() {
  const {
    isVisualizerOpen,
    pipelineStage,
    pipelineProgress,
    pipelineLogs,
    pipelineError,
    closeVisualizer,
    currentSession,
  } = useSession()

  const logEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [pipelineLogs])

  if (!isVisualizerOpen) return null

  const getStageStatus = (stageId: PipelineStage) => {
    const stageOrder: PipelineStage[] = ['uploading', 'parsing', 'detecting', 'llm_reasoning', 'completed']
    const currentIndex = stageOrder.indexOf(pipelineStage)
    const thisIndex = stageOrder.indexOf(stageId)

    if (pipelineStage === 'failed') {
      if (thisIndex <= currentIndex) return 'error'
      return 'pending'
    }

    if (pipelineStage === 'completed') return 'done'
    if (thisIndex < currentIndex) return 'done'
    if (thisIndex === currentIndex) return 'active'
    return 'pending'
  }

  return (
    <div className="process-overlay">
      <div className="process-modal reveal-up in-view">
        <div className="process-header">
          <div className="process-title-group">
            <div className="process-badge">
              <span className={`status-pulse ${pipelineStage === 'completed' ? 'ok' : pipelineStage === 'failed' ? 'error' : 'pulse'}`}></span>
              BACKEND RUNNING PROCESS
            </div>
            <h2>AI-Powered Log Analysis Pipeline</h2>
            <p className="process-sub">
              Streaming real-time execution telemetry from FastAPI backend services and NVIDIA AI endpoints.
            </p>
          </div>
          <button className="process-close" onClick={closeVisualizer} aria-label="Close modal">
            ✕
          </button>
        </div>

        {/* Interactive Progress Bar */}
        <div className="process-progress-wrap">
          <div className="process-progress-bar">
            <div
              className={`process-progress-fill ${pipelineStage === 'failed' ? 'failed' : ''}`}
              style={{ width: `${pipelineProgress}%` }}
            ></div>
          </div>
          <div className="process-progress-meta">
            <span>
              Status:{' '}
              <b>
                {pipelineStage === 'idle' && 'Initializing...'}
                {pipelineStage === 'uploading' && 'Ingesting & Validating Log Stream...'}
                {pipelineStage === 'parsing' && 'Running High-Throughput Log Tokenizer...'}
                {pipelineStage === 'detecting' && 'Extracting Severity Signals & Faults...'}
                {pipelineStage === 'llm_reasoning' && 'Running NVIDIA Nemotron Deep Reasoning...'}
                {pipelineStage === 'completed' && 'Analysis Completed Successfully!'}
                {pipelineStage === 'failed' && 'Process Encountered An Error'}
              </b>
            </span>
            <span className="percent-val">{pipelineProgress}%</span>
          </div>
        </div>

        {/* 5-Step Pipeline Visualizer */}
        <div className="process-stepper">
          {STAGES.map((s) => {
            const status = getStageStatus(s.id)
            return (
              <div key={s.id} className={`step-card ${status}`}>
                <div className="step-icon">{s.icon}</div>
                <div className="step-info">
                  <div className="step-label">{s.label}</div>
                  <div className="step-desc">{s.desc}</div>
                </div>
                <div className="step-indicator">
                  {status === 'done' && <span className="ind-done">✓</span>}
                  {status === 'active' && <span className="ind-active">●</span>}
                  {status === 'error' && <span className="ind-error">!</span>}
                  {status === 'pending' && <span className="ind-pending">○</span>}
                </div>
              </div>
            )
          })}
        </div>

        {/* Live Terminal Stream */}
        <div className="process-terminal">
          <div className="process-terminal-header">
            <span>⚡ LIVE BACKEND LOG TRACE</span>
            <span>{pipelineLogs.length} events logged</span>
          </div>
          <div className="process-terminal-body">
            {pipelineLogs.map((log) => (
              <div key={log.id} className={`proc-line ${log.type}`}>
                <span className="proc-time">[{log.time}]</span>
                <span className="proc-text">{log.text}</span>
              </div>
            ))}
            {pipelineStage !== 'completed' && pipelineStage !== 'failed' && (
              <div className="proc-line info">
                <span className="proc-time">[{new Date().toLocaleTimeString()}]</span>
                <span className="proc-text">
                  <span className="inline-spinner"></span> Waiting for backend response...
                </span>
              </div>
            )}
            <div ref={logEndRef} />
          </div>
        </div>

        {/* Action Bar */}
        <div className="process-actions">
          {pipelineStage === 'completed' && (
            <div className="action-success-badge">
              <span>✓ Session Created: <b>{currentSession?.session_id}</b> ({currentSession?.total_logs} logs parsed)</span>
            </div>
          )}
          {pipelineError && (
            <div className="action-error-badge">
              <span>⚠ {pipelineError}</span>
            </div>
          )}
          <div className="action-buttons">
            <button className="btn" onClick={closeVisualizer}>
              {pipelineStage === 'completed' ? 'Explore Incident Views →' : 'Dismiss'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
