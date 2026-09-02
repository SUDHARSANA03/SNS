import React from 'react'
import CountUp from './CountUp'
import { useSession } from '../context/SessionContext'

export default function StatusBar() {
  const { backendConnected, currentSession, pipelineStage } = useSession()

  const totalLogs = currentSession?.total_logs || 0
  const detectedErrors = currentSession?.detected_errors || 0

  return (
    <div className="statusbar">
      <div className="item">
        <span className={`dot ${backendConnected ? 'on' : 'crit'}`}></span>
        FastAPI Collector{' '}
        <span className="val">{backendConnected ? 'connected (8000)' : 'standby'}</span>
      </div>
      <span className="sep">/</span>
      <div className="item">
        Parsed Logs <CountUp target={totalLogs} />
      </div>
      <span className="sep">/</span>
      <div className="item">
        <span className={`dot ${detectedErrors > 0 ? 'crit' : 'on'}`}></span>
        Detected Errors <CountUp target={detectedErrors} />
      </div>
      <span className="sep">/</span>
      <div className="item">
        <span className="dot on"></span>
        Model Guard{' '}
        <span className="val" style={{ color: 'var(--ai)' }}>
          {pipelineStage === 'llm_reasoning' ? 'Analyzing...' : 'NVIDIA Nemotron Ready'}
        </span>
      </div>
    </div>
  )
}
