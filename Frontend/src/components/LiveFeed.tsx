import React, { useState, useRef, useEffect } from 'react'
import { useSession } from '../context/SessionContext'
import { ParsedLogEvent } from '../data'

export default function LiveFeed() {
  const { currentSession, openLogModal } = useSession()
  const [activeLevel, setActiveLevel] = useState<string>('ALL')
  const [search, setSearch] = useState('')
  const [selectedLog, setSelectedLog] = useState<ParsedLogEvent | null>(null)
  const bodyRef = useRef<HTMLDivElement>(null)

  const logs = currentSession?.parsedLogs || []

  // Auto-scroll on initial load of logs
  useEffect(() => {
    if (bodyRef.current && logs.length > 0) {
      bodyRef.current.scrollTop = 0
    }
  }, [logs.length])

  const searchLower = search.toLowerCase()
  const visibleLogs = logs.filter((l) => {
    const matchesLevel =
      activeLevel === 'ALL'
        ? true
        : activeLevel === 'ERROR'
        ? l.level === 'ERROR' || l.level === 'CRITICAL' || l.level === 'FATAL'
        : l.level === activeLevel
    const matchesSearch =
      !searchLower ||
      l.message.toLowerCase().includes(searchLower) ||
      (l.component && l.component.toLowerCase().includes(searchLower)) ||
      l.log_id.toLowerCase().includes(searchLower) ||
      (l.timestamp && l.timestamp.toLowerCase().includes(searchLower))

    return matchesLevel && matchesSearch
  })

  const levelCounts = {
    ALL: logs.length,
    ERROR: logs.filter((l) => l.level === 'ERROR' || l.level === 'CRITICAL' || l.level === 'FATAL').length,
    WARNING: logs.filter((l) => l.level === 'WARNING' || l.level === 'WARN').length,
    INFO: logs.filter((l) => l.level === 'INFO').length,
  }

  return (
    <section className="view" id="view-feed">
      <div className="view-header-row">
        <div>
          <h1>
            <span className="reveal">Parsed Log Stream</span>
          </h1>
          <p className="view-sub">
            {currentSession
              ? `Displaying ${logs.length} parsed events from "${currentSession.fileName || currentSession.session_id}".`
              : 'No log stream loaded. Upload a .log file or choose a preset to inspect.'}
          </p>
        </div>
        <div className="view-header-actions">
          <button className="btn primary" onClick={() => openLogModal('upload')}>
            📥 Ingest Log File
          </button>
        </div>
      </div>

      {logs.length === 0 ? (
        <div className="empty-state-panel reveal-up in-view">
          <div className="empty-icon">📄</div>
          <h3>No Log Stream Loaded</h3>
          <p>
            Upload a server log file (.log or .txt) or choose a sample incident scenario to visualize the parsed log stream.
          </p>
          <div className="empty-actions">
            <button className="btn primary glow" onClick={() => openLogModal('upload')}>
              Upload Log File
            </button>
            <button className="btn" onClick={() => openLogModal('samples')}>
              Select Sample Preset
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="feed-toolbar reveal-up in-view">
            <button className="btn" onClick={() => openLogModal('upload')}>
              🔄 Switch Log
            </button>

            <div
              className={`filter-chip ${activeLevel === 'ALL' ? 'on' : ''}`}
              onClick={() => setActiveLevel('ALL')}
            >
              ALL ({levelCounts.ALL})
            </div>
            <div
              className={`filter-chip ${activeLevel === 'ERROR' ? 'on' : ''}`}
              onClick={() => setActiveLevel('ERROR')}
              style={activeLevel === 'ERROR' ? { background: 'var(--critical)', borderColor: 'var(--critical)' } : {}}
            >
              ERRORS ({levelCounts.ERROR})
            </div>
            <div
              className={`filter-chip ${activeLevel === 'WARNING' ? 'on' : ''}`}
              onClick={() => setActiveLevel('WARNING')}
              style={activeLevel === 'WARNING' ? { background: 'var(--warning)', borderColor: 'var(--warning)', color: '#000' } : {}}
            >
              WARNINGS ({levelCounts.WARNING})
            </div>
            <div
              className={`filter-chip ${activeLevel === 'INFO' ? 'on' : ''}`}
              onClick={() => setActiveLevel('INFO')}
            >
              INFO ({levelCounts.INFO})
            </div>

            <input
              className="feed-search"
              placeholder="Filter by keyword, service component, log ID (e.g. log_00001)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="terminal reveal-up in-view">
            <div className="terminal-head">
              <span>
                Session: <b>{currentSession?.session_id}</b> · {visibleLogs.length} / {logs.length} entries shown
              </span>
              <span>Click any line to inspect raw payload</span>
            </div>
            <div className="terminal-body" ref={bodyRef}>
              {visibleLogs.map((l) => (
                <div
                  className={`log-line ${selectedLog?.log_id === l.log_id ? 'selected-row' : ''}`}
                  key={l.log_id}
                  onClick={() => setSelectedLog(selectedLog?.log_id === l.log_id ? null : l)}
                >
                  <span className="t">{l.timestamp || '--:--:--'}</span>
                  <span className="svc" title={l.component || 'system'}>
                    {l.component || 'system'}
                  </span>
                  <span className={`lvl ${l.level}`}>{l.level}</span>
                  <span className="msg">
                    {l.message}{' '}
                    <span style={{ color: 'var(--text-faint)', fontSize: '10px' }}>
                      [{l.log_id}]
                    </span>
                  </span>
                </div>
              ))}
              {visibleLogs.length === 0 && (
                <div style={{ color: 'var(--text-faint)', padding: '24px', textAlign: 'center' }}>
                  No log entries match the active filter or search query.
                </div>
              )}
            </div>
            <div className="terminal-input">
              $ <span className="cursor"></span>
              <span style={{ color: 'var(--text-dim)', fontSize: '11px', marginLeft: '6px' }}>
                {logs.length} lines parsed · UTF-8 validated
              </span>
            </div>
          </div>

          {/* Log Line Inspector Drawer */}
          {selectedLog && (
            <div className="log-inspector reveal-up in-view">
              <div className="inspector-head">
                <div className="inspector-title">
                  <span className={`lvl ${selectedLog.level}`}>{selectedLog.level}</span>
                  <b>Log ID: {selectedLog.log_id}</b>
                  {selectedLog.component && <span>Service: {selectedLog.component}</span>}
                  {selectedLog.timestamp && <span>Timestamp: {selectedLog.timestamp}</span>}
                </div>
                <button className="inspector-close" onClick={() => setSelectedLog(null)}>
                  ✕
                </button>
              </div>
              <div className="inspector-content">
                <div className="inspector-block">
                  <span className="k">Message:</span>
                  <pre>{selectedLog.message}</pre>
                </div>
                <div className="inspector-block">
                  <span className="k">Raw Log Line:</span>
                  <pre>{selectedLog.raw_log}</pre>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  )
}
