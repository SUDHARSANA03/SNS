import React, { useState } from 'react'
import { useSession } from '../context/SessionContext'

export default function Detection() {
  const { currentSession, openLogModal } = useSession()
  const [openIdx, setOpenIdx] = useState<number | null>(0)
  const [filterLevel, setFilterLevel] = useState<string>('ALL')

  const errors = currentSession?.errors || []
  const rootCauses = currentSession?.analysis?.root_cause_analysis || []

  const filteredErrors = errors.filter((err) => {
    if (filterLevel === 'ALL') return true
    return err.level.toUpperCase() === filterLevel
  })

  return (
    <section className="view" id="view-detect">
      <div className="view-header-row">
        <div>
          <h1>
            <span className="reveal">Threat & Error Detection</span>
          </h1>
          <p className="view-sub">
            {currentSession
              ? `Identified ${errors.length} error signals and anomalous events from ${currentSession.total_logs} parsed logs.`
              : 'No active session. Ingest a log file to extract anomaly and error signals.'}
          </p>
        </div>
        <div className="view-header-actions">
          <button className="btn primary" onClick={() => openLogModal('upload')}>
            📥 Ingest Log File
          </button>
        </div>
      </div>

      {errors.length === 0 ? (
        <div className="empty-state-panel reveal-up in-view">
          <div className="empty-icon">🛡️</div>
          <h3>{currentSession ? 'No Severe Errors Detected' : 'No Anomaly Signals Loaded'}</h3>
          <p>
            {currentSession
              ? 'The backend heuristic error detector analyzed the log stream and found no explicit ERROR or CRITICAL exceptions.'
              : 'Upload a server log file (.log or .txt) to detect anomalies, exceptions, and connection timeouts.'}
          </p>
          <div className="empty-actions">
            <button className="btn primary glow" onClick={() => openLogModal('upload')}>
              Upload Log File
            </button>
            <button className="btn" onClick={() => openLogModal('samples')}>
              Try Sample Incident (With Errors)
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="feed-toolbar reveal-up in-view">
            <div
              className={`filter-chip ${filterLevel === 'ALL' ? 'on' : ''}`}
              onClick={() => setFilterLevel('ALL')}
            >
              ALL ERRORS ({errors.length})
            </div>
            <div
              className={`filter-chip ${filterLevel === 'ERROR' ? 'on' : ''}`}
              onClick={() => setFilterLevel('ERROR')}
              style={filterLevel === 'ERROR' ? { background: 'var(--critical)', borderColor: 'var(--critical)' } : {}}
            >
              ERROR ({errors.filter((e) => e.level === 'ERROR').length})
            </div>
            <div
              className={`filter-chip ${filterLevel === 'CRITICAL' ? 'on' : ''}`}
              onClick={() => setFilterLevel('CRITICAL')}
              style={filterLevel === 'CRITICAL' ? { background: '#9D4EDD', borderColor: '#9D4EDD' } : {}}
            >
              CRITICAL ({errors.filter((e) => e.level === 'CRITICAL').length})
            </div>
          </div>

          <div className="detect-list" id="detectList">
            {filteredErrors.map((err, idx) => {
              const isOpen = openIdx === idx
              const linkedCause = rootCauses.find((c) =>
                c.evidence_log_ids.includes(err.log_id)
              )

              return (
                <div key={err.log_id || idx} style={{ display: 'contents' }}>
                  <div
                    className={'detect-card reveal-up in-view' + (isOpen ? ' open' : '')}
                    onClick={() => setOpenIdx(isOpen ? null : idx)}
                  >
                    <div className="detect-top">
                      <span className={`sev ${err.level}`}>{err.level}</span>
                      <span className="detect-title">
                        {err.message.split('\n')[0].slice(0, 120)}
                      </span>
                    </div>
                    <div className="detect-meta">
                      Log Reference: <b>{err.log_id}</b> · {err.timestamp ? `Timestamp: ${err.timestamp}` : 'Extracted from log stream'}
                    </div>
                    <div className="metric-row">
                      <div className="metric">
                        <span className="label">Error Level</span>
                        <span className="value up">{err.level}</span>
                      </div>
                      <div className="metric">
                        <span className="label">Evidence Grounding</span>
                        <span className="value" style={{ color: linkedCause ? 'var(--ai)' : 'var(--text-dim)' }}>
                          {linkedCause ? `Linked to ${linkedCause.type} (${Math.round(linkedCause.confidence * 100)}%)` : 'Uncorrelated'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="detect-detail" style={{ display: isOpen ? 'block' : 'none' }}>
                    <div className="row">
                      <span className="k">Full Error Message:</span>
                      <pre className="detail-pre">{err.message}</pre>
                    </div>
                    <div className="row">
                      <span className="k">Log ID:</span>
                      <span>{err.log_id}</span>
                    </div>
                    {err.timestamp && (
                      <div className="row">
                        <span className="k">Timestamp:</span>
                        <span>{err.timestamp}</span>
                      </div>
                    )}
                    {linkedCause && (
                      <div className="row">
                        <span className="k">AI Correlation:</span>
                        <span style={{ color: 'var(--ai)' }}>
                          <b>{linkedCause.cause}</b>: {linkedCause.reasoning}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </section>
  )
}
