import React, { useState } from 'react'
import { useSession } from '../context/SessionContext'

export default function Timechain() {
  const { currentSession, openLogModal } = useSession()
  const [selected, setSelected] = useState<number>(0)

  const timeline = currentSession?.analysis?.timeline || []
  const parsedLogs = currentSession?.parsedLogs || []

  return (
    <section className="view" id="view-chain">
      <div className="view-header-row">
        <div>
          <h1>
            <span className="reveal">Incident Chronology Timechain</span>
          </h1>
          <p className="view-sub">
            {currentSession
              ? `Reconstructed sequence of ${timeline.length} chronological events leading up to and following the incident.`
              : 'No active session. Ingest a log file to reconstruct the chronological event chain.'}
          </p>
        </div>
        <div className="view-header-actions">
          <button className="btn primary" onClick={() => openLogModal('upload')}>
            📥 Ingest Log File
          </button>
        </div>
      </div>

      {timeline.length === 0 ? (
        <div className="empty-state-panel reveal-up in-view">
          <div className="empty-icon">⏳</div>
          <h3>No Chronological Timeline Available</h3>
          <p>
            The AI model reconstructs chronological causality based on timestamps and error propagation in your logs.
          </p>
          <div className="empty-actions">
            <button className="btn primary glow" onClick={() => openLogModal('upload')}>
              Upload Log File
            </button>
            <button className="btn" onClick={() => openLogModal('samples')}>
              Try Sample Incident
            </button>
          </div>
        </div>
      ) : (
        <div className="chain" id="chainList">
          {timeline.map((ev, idx) => {
            const isSelected = selected === idx
            const matchedLog = parsedLogs.find((l) => l.log_id === ev.log_id)
            const isCritical =
              matchedLog?.level === 'ERROR' ||
              matchedLog?.level === 'CRITICAL' ||
              ev.event.toLowerCase().includes('fail') ||
              ev.event.toLowerCase().includes('timeout') ||
              ev.event.toLowerCase().includes('crash')

            return (
              <div
                key={ev.log_id || idx}
                className={
                  'chain-item reveal-up in-view' +
                  (isCritical ? ' incident' : '') +
                  (isSelected ? ' selected' : '')
                }
                onClick={() => setSelected(isSelected ? -1 : idx)}
              >
                <div className="chain-dot"></div>
                <div className="chain-time">
                  {matchedLog?.timestamp ? matchedLog.timestamp : `Step #${idx + 1}`} · Reference: <b>{ev.log_id}</b>
                  {matchedLog?.component && <span className="chain-component-tag">{matchedLog.component}</span>}
                </div>
                <div className="chain-title">
                  {ev.event}
                </div>
                <div className="chain-evidence">
                  <div className="chain-evidence-head">
                    <span>Evidence Details for {ev.log_id}</span>
                    {matchedLog?.level && <span className={`lvl ${matchedLog.level}`}>{matchedLog.level}</span>}
                  </div>
                  {matchedLog ? (
                    <div className="chain-evidence-body">
                      <p><b>Raw Log Message:</b></p>
                      <pre className="detail-pre">{matchedLog.message}</pre>
                    </div>
                  ) : (
                    <div className="chain-evidence-body">
                      <p>Reconstructed from LLM causal analysis inference on session payload.</p>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
