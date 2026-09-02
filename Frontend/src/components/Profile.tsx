import React from 'react'
import { useSession } from '../context/SessionContext'

export default function Profile() {
  const {
    currentSession,
    sessionsHistory,
    backendConnected,
    loadSession,
    deleteSession,
    clearCurrentSession,
    openLogModal,
    checkHealth,
  } = useSession()

  const exportCurrentSession = () => {
    if (!currentSession) return
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(currentSession, null, 2))
    const downloadAnchor = document.createElement('a')
    downloadAnchor.setAttribute('href', dataStr)
    downloadAnchor.setAttribute('download', `incident-session-${currentSession.session_id.slice(0, 8)}.json`)
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.remove()
  }

  return (
    <section className="view" id="view-profile">
      <div className="view-header-row">
        <div>
          <h1>
            <span className="reveal">Investigation Hub & Sessions</span>
          </h1>
          <p className="view-sub">Manage log analysis sessions, investigation history, and backend configuration.</p>
        </div>
        <div className="view-header-actions">
          <button className="btn primary" onClick={() => openLogModal('upload')}>
            📥 New Investigation
          </button>
        </div>
      </div>

      <div className="profile-grid">
        {/* Left Side: System & Backend Telemetry Card */}
        <div className="profile-card reveal-up in-view">
          <div className="avatar">AI</div>
          <div className="profile-name">Incident AI Console</div>
          <div className="profile-role">Root-Cause Intelligence Agent</div>

          <div className="profile-field">
            <b>
              <span className={`dot ${backendConnected ? 'on' : 'crit'}`} style={{ display: 'inline-block', marginRight: '6px' }}></span>
              {backendConnected ? 'Online / Connected' : 'Offline / Checking...'}
            </b>
            Backend Status
          </div>

          <div className="profile-field">
            <b>FastAPI + uvicorn (Port 8000)</b>
            API Server
          </div>

          <div className="profile-field">
            <b>nvidia/nemotron-3-ultra</b>
            LLM Model Engine
          </div>

          <div className="profile-field">
            <b>{sessionsHistory.length} Sessions</b>
            Stored Investigations
          </div>

          <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button className="btn sm" onClick={checkHealth}>
              🔄 Check Backend Ping
            </button>
            {currentSession && (
              <button className="btn primary sm" onClick={exportCurrentSession}>
                💾 Export Active Session JSON
              </button>
            )}
          </div>
        </div>

        {/* Right Side: Historical Investigations Table */}
        <div>
          <div className="section-block">
            <div className="section-head">
              <h2>Recent Investigation Sessions ({sessionsHistory.length})</h2>
              {sessionsHistory.length > 0 && (
                <button
                  className="link-btn"
                  onClick={() => {
                    if (confirm('Clear all session history from local storage?')) {
                      localStorage.removeItem('incident_ai_sessions_v1')
                      window.location.reload()
                    }
                  }}
                >
                  Clear History
                </button>
              )}
            </div>

            {sessionsHistory.length === 0 ? (
              <div className="empty-state-panel" style={{ padding: '32px', textAlign: 'center' }}>
                <p>No investigation sessions stored yet. Analyze a log file to build history.</p>
                <button className="btn primary sm" onClick={() => openLogModal('upload')}>
                  Start First Investigation
                </button>
              </div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Session ID</th>
                    <th>Source File / Target</th>
                    <th>Total Logs</th>
                    <th>Errors</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sessionsHistory.map((s) => {
                    const isCurrent = currentSession?.session_id === s.session_id
                    return (
                      <tr key={s.session_id} className={`reveal-up in-view ${isCurrent ? 'active-row' : ''}`}>
                        <td className="id">
                          <b>{s.session_id.slice(0, 10)}...</b>
                          {isCurrent && <span className="active-badge">Active</span>}
                        </td>
                        <td>{s.fileName || 'custom-logs.log'}</td>
                        <td>{s.total_logs}</td>
                        <td style={{ color: s.detected_errors > 0 ? 'var(--critical)' : 'inherit' }}>
                          {s.detected_errors}
                        </td>
                        <td>
                          <span className={`status-tag ${s.status === 'completed' ? 'Resolved' : 'Investigating'}`}>
                            {s.status}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            {!isCurrent && (
                              <button
                                className="link-btn"
                                onClick={() => loadSession(s.session_id)}
                                title="Load this session"
                              >
                                Load
                              </button>
                            )}
                            <button
                              className="link-btn"
                              style={{ color: 'var(--critical)' }}
                              onClick={() => deleteSession(s.session_id)}
                              title="Delete from history"
                            >
                              ✕
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>

          {currentSession && (
            <div className="section-block">
              <div className="section-head">
                <h2>Active Session Details</h2>
                <button className="link-btn" onClick={clearCurrentSession}>
                  Unload Session
                </button>
              </div>
              <div className="active-session-summary-box">
                <div className="row">
                  <span className="k">Full Session UUID:</span>
                  <span className="v">{currentSession.session_id}</span>
                </div>
                <div className="row">
                  <span className="k">Summary:</span>
                  <span className="v">{currentSession.analysis?.summary || 'No summary available.'}</span>
                </div>
                <div className="row">
                  <span className="k">Analyzed At:</span>
                  <span className="v">{currentSession.createdAt ? new Date(currentSession.createdAt).toLocaleString() : 'Just now'}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
