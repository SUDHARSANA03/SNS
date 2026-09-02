import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession } from '../context/SessionContext'
import { useAuth } from '../context/AuthContext'
import {
  Bookmark,
  Check,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  Clock,
  Terminal,
  Wrench,
  Copy,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
} from 'lucide-react'
import { getImmediateRectification, RectificationPlan } from '../services/nvidiaService'

interface TimelineItem {
  log_id: string
  event: string
  timestamp: string | null
  level: string
  component: string | null
  message: string
  raw_log?: string
  isError: boolean
}

export default function Timechain() {
  const navigate = useNavigate()
  const { currentSession, openLogModal } = useSession()
  const { saveError, isErrorSaved } = useAuth()
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)
  const [viewFilter, setViewFilter] = useState<'errors_only' | 'all'>('errors_only')
  const [savingLogId, setSavingLogId] = useState<string | null>(null)
  const [copiedCmdId, setCopiedCmdId] = useState<string | null>(null)

  const rawTimeline = currentSession?.analysis?.timeline || []
  const parsedLogs = currentSession?.parsedLogs || []
  const sessionErrors = currentSession?.errors || []
  const summary = currentSession?.analysis?.summary || ''

  // Build the complete, chronological timeline ensuring ALL ERRORS are always present
  const chronologicalTimeline = useMemo(() => {
    const itemsMap = new Map<string, TimelineItem>()

    // 1. Add all detected errors first (Guaranteed to be included!)
    sessionErrors.forEach((err) => {
      const matchedParsed = parsedLogs.find((p) => p.log_id === err.log_id)
      itemsMap.set(err.log_id, {
        log_id: err.log_id,
        event: err.message.split('\n')[0].slice(0, 130),
        timestamp: err.timestamp || matchedParsed?.timestamp || null,
        level: err.level || 'ERROR',
        component: matchedParsed?.component || null,
        message: err.message,
        raw_log: matchedParsed?.raw_log,
        isError: true,
      })
    })

    // 2. Also check parsedLogs for any error/critical logs not captured above
    parsedLogs.forEach((log) => {
      const isErrLevel =
        log.level === 'ERROR' ||
        log.level === 'CRITICAL' ||
        log.level === 'FATAL' ||
        log.message.toLowerCase().includes('failed to establish') ||
        log.message.toLowerCase().includes('connection refused') ||
        log.message.toLowerCase().includes('exited with code 1') ||
        log.message.toLowerCase().includes('unreachable')

      if (isErrLevel && !itemsMap.has(log.log_id)) {
        itemsMap.set(log.log_id, {
          log_id: log.log_id,
          event: log.message.split('\n')[0].slice(0, 130),
          timestamp: log.timestamp || null,
          level: log.level || 'ERROR',
          component: log.component || null,
          message: log.message,
          raw_log: log.raw_log,
          isError: true,
        })
      }
    })

    // 3. Incorporate LLM reconstructed timeline causality
    rawTimeline.forEach((tEv) => {
      const existing = itemsMap.get(tEv.log_id)
      const matchedParsed = parsedLogs.find((p) => p.log_id === tEv.log_id)
      if (existing) {
        existing.event = tEv.event || existing.event
      } else {
        const isCritical =
          matchedParsed?.level === 'ERROR' ||
          matchedParsed?.level === 'CRITICAL' ||
          tEv.event.toLowerCase().includes('fail') ||
          tEv.event.toLowerCase().includes('timeout') ||
          tEv.event.toLowerCase().includes('error')

        itemsMap.set(tEv.log_id, {
          log_id: tEv.log_id,
          event: tEv.event,
          timestamp: matchedParsed?.timestamp || null,
          level: matchedParsed?.level || (isCritical ? 'ERROR' : 'INFO'),
          component: matchedParsed?.component || null,
          message: matchedParsed?.message || tEv.event,
          raw_log: matchedParsed?.raw_log,
          isError: isCritical,
        })
      }
    })

    // Sort chronologically by timestamp
    const allItems = Array.from(itemsMap.values())
    allItems.sort((a, b) => {
      if (a.timestamp && b.timestamp) {
        const timeA = new Date(a.timestamp).getTime()
        const timeB = new Date(b.timestamp).getTime()
        if (!isNaN(timeA) && !isNaN(timeB)) {
          return timeA - timeB
        }
        return a.timestamp.localeCompare(b.timestamp)
      }
      if (a.timestamp) return -1
      if (b.timestamp) return 1
      return a.log_id.localeCompare(b.log_id)
    })

    return allItems
  }, [rawTimeline, parsedLogs, sessionErrors])

  const displayedTimeline = useMemo(() => {
    if (viewFilter === 'errors_only') {
      return chronologicalTimeline.filter((item) => item.isError)
    }
    return chronologicalTimeline
  }, [chronologicalTimeline, viewFilter])

  const allErrorsCount = chronologicalTimeline.filter((t) => t.isError).length

  const handleSaveError = async (item: TimelineItem) => {
    setSavingLogId(item.log_id)
    const plan = getImmediateRectification(item.message, item.component, item.log_id)
    try {
      await saveError({
        log_id: item.log_id,
        error_level: item.level,
        message: item.message,
        component: item.component,
        timestamp: item.timestamp,
        summary: `[Timeline Milestone] ${plan.root_cause}`,
        root_cause: `${plan.root_cause}\nCommand: ${plan.command_fix || 'N/A'}`,
        notes: `Steps:\n${plan.rectification_steps.join('\n')}`,
        session_id: currentSession?.session_id,
      })
    } finally {
      setSavingLogId(null)
    }
  }

  const copyCode = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedCmdId(id)
    setTimeout(() => setCopiedCmdId(null), 2000)
  }

  // Format timestamp cleanly
  const formatTimestamp = (ts?: string | null) => {
    if (!ts) return 'Timestamp Unspecified'
    try {
      const d = new Date(ts)
      if (!isNaN(d.getTime())) {
        return d.toISOString().replace('T', ' ').replace('Z', ' UTC')
      }
    } catch {}
    return ts
  }

  return (
    <section className="view" id="view-chain">
      {/* View Header */}
      <div className="view-header-row">
        <div>
          <h1>
            <span className="reveal">Incident Chronology Timechain</span>
          </h1>
          <p className="view-sub">
            {currentSession
              ? `Reconstructed chronological sequence of ${allErrorsCount} error occurrences with exact timestamps and NVIDIA rectification.`
              : 'No active session. Ingest a log file to reconstruct the chronological error chain.'}
          </p>
        </div>
        <div className="view-header-actions">
          <button className="btn primary" onClick={() => openLogModal('upload')}>
            📥 Ingest Log File
          </button>
        </div>
      </div>

      {displayedTimeline.length === 0 ? (
        <div className="empty-state-panel reveal-up in-view">
          <div className="empty-icon">⏳</div>
          <h3>No Chronological Errors Available</h3>
          <p>
            {currentSession
              ? 'No errors were identified in the active log stream. Ingest a log file with error traces to construct the timeline.'
              : 'Upload a server log file (.log or .txt) to automatically build the chronological error sequence.'}
          </p>
          <div className="empty-actions">
            <button className="btn primary glow" onClick={() => openLogModal('upload')}>
              Upload Log File
            </button>
            <button className="btn" onClick={() => openLogModal('samples')}>
              Try Sample Incident Scenario
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Executive Incident Summary Banner */}
          {summary && (
            <div
              className="reveal-up in-view"
              style={{
                background: 'linear-gradient(135deg, rgba(35, 20, 56, 0.8), rgba(18, 14, 28, 0.9))',
                border: '1px solid rgba(199, 125, 255, 0.35)',
                borderRadius: '16px',
                padding: '16px 20px',
                marginBottom: '20px',
                backdropFilter: 'blur(10px)',
              }}
            >
              <div
                style={{
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  letterSpacing: '1.5px',
                  color: '#C77DFF',
                  fontWeight: 700,
                  marginBottom: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Sparkles size={14} color="#E879F9" />
                EXECUTIVE INCIDENT CHRONOLOGY SUMMARY
              </div>
              <p style={{ margin: 0, fontSize: '13px', color: '#E2D9F3', lineHeight: '1.6' }}>{summary}</p>
            </div>
          )}

          {/* Timechain Filter Chips Bar */}
          <div className="feed-toolbar reveal-up in-view" style={{ marginBottom: '20px' }}>
            <div
              className={`filter-chip ${viewFilter === 'errors_only' ? 'on' : ''}`}
              onClick={() => setViewFilter('errors_only')}
              style={
                viewFilter === 'errors_only'
                  ? { background: 'rgba(239, 68, 68, 0.25)', borderColor: '#EF4444', color: '#FFF' }
                  : {}
              }
            >
              🔴 ALL ERRORS TIMELINE ({allErrorsCount})
            </div>

            <div
              className={`filter-chip ${viewFilter === 'all' ? 'on' : ''}`}
              onClick={() => setViewFilter('all')}
            >
              ⚡ FULL LOG CHRONOLOGY ({chronologicalTimeline.length})
            </div>
          </div>

          {/* CHRONOLOGICAL TIMECHAIN: COLLAPSIBLE DROPDOWN ERRORS */}
          <div className="chain" id="chainList" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {displayedTimeline.map((item, idx) => {
              const isExpanded = selectedIdx === idx
              const isSaved = isErrorSaved(item.log_id, currentSession?.session_id)
              const isSaving = savingLogId === item.log_id
              const plan = getImmediateRectification(item.message, item.component, item.log_id)

              return (
                <div
                  key={item.log_id || idx}
                  className={'chain-item reveal-up in-view' + (item.isError ? ' incident' : '')}
                  style={{ marginBottom: 0 }}
                >
                  <div className="chain-dot" />

                  {/* ─── DROPDOWN HEADER (always visible, click to toggle) ─── */}
                  <div
                    onClick={() => setSelectedIdx(isExpanded ? null : idx)}
                    style={{
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 14px',
                      borderRadius: isExpanded ? '12px 12px 0 0' : '12px',
                      background: isExpanded
                        ? 'rgba(199, 125, 255, 0.12)'
                        : 'rgba(255, 255, 255, 0.03)',
                      border: `1px solid ${isExpanded ? 'rgba(199, 125, 255, 0.4)' : 'rgba(255, 255, 255, 0.06)'}`,
                      borderBottom: isExpanded ? '1px solid rgba(199, 125, 255, 0.2)' : undefined,
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {/* Chevron */}
                    <div
                      style={{
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'transform 0.2s ease',
                        transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                        color: '#C77DFF',
                      }}
                    >
                      <ChevronDown size={16} />
                    </div>

                    {/* Timestamp badge */}
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: 'rgba(199, 125, 255, 0.15)',
                        border: '1px solid rgba(199, 125, 255, 0.3)',
                        borderRadius: '6px',
                        padding: '2px 7px',
                        color: '#E879F9',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 700,
                        fontSize: '10px',
                        flexShrink: 0,
                      }}
                    >
                      <Clock size={10} />
                      {formatTimestamp(item.timestamp).slice(11, 19) || formatTimestamp(item.timestamp)}
                    </span>

                    {/* Event title (truncated single line) */}
                    <span
                      style={{
                        flex: 1,
                        fontSize: '13px',
                        fontWeight: 600,
                        color: '#F5F1FA',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {item.event}
                    </span>

                    {/* Level badge */}
                    <span
                      className={`lvl ${item.level}`}
                      style={{
                        fontWeight: 800,
                        fontSize: '9px',
                        padding: '2px 7px',
                        borderRadius: '4px',
                        flexShrink: 0,
                      }}
                    >
                      {item.level}
                    </span>

                    {/* Milestone # */}
                    <span style={{ color: 'var(--text-faint)', fontSize: '10px', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>
                      #{idx + 1}
                    </span>
                  </div>

                  {/* ─── DROPDOWN BODY (collapsible) ─── */}
                  <div
                    style={{
                      maxHeight: isExpanded ? '800px' : '0',
                      overflow: 'hidden',
                      transition: 'max-height 0.35s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.25s ease',
                      opacity: isExpanded ? 1 : 0,
                    }}
                  >
                    <div
                      style={{
                        padding: '14px',
                        background: 'rgba(15, 12, 22, 0.7)',
                        border: '1px solid rgba(199, 125, 255, 0.2)',
                        borderTop: 'none',
                        borderRadius: '0 0 12px 12px',
                      }}
                    >
                      {/* Header Row */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <ShieldAlert size={14} color="#F87171" />
                          <span style={{ fontWeight: 700, fontSize: '12px', color: '#FFF' }}>Incident Evidence & Remedy</span>
                          {item.component && (
                            <span className="chain-component-tag">{item.component}</span>
                          )}
                          <span style={{ color: 'var(--text-dim)', fontSize: '10px', fontFamily: 'var(--font-mono)' }}>
                            Ref: {item.log_id}
                          </span>
                        </div>

                        {/* Save to Profile */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleSaveError(item)
                          }}
                          className="btn sm"
                          style={{
                            padding: '4px 10px',
                            fontSize: '11px',
                            borderRadius: '8px',
                            background: isSaved ? 'rgba(52, 211, 153, 0.2)' : 'linear-gradient(90deg, #C77DFF, #9D4EDD)',
                            borderColor: isSaved ? '#34D399' : '#C77DFF',
                            color: isSaved ? '#34D399' : '#000',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                          }}
                        >
                          {isSaved ? (
                            <>
                              <Check size={12} />
                              <span>Saved</span>
                            </>
                          ) : isSaving ? (
                            <span>Saving...</span>
                          ) : (
                            <>
                              <Bookmark size={12} />
                              <span>Save Error</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Full timestamp */}
                      <div style={{ marginBottom: '8px', fontSize: '11px', color: '#A098B5', fontFamily: 'var(--font-mono)' }}>
                        <Clock size={11} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
                        {formatTimestamp(item.timestamp)}
                      </div>

                      {/* Raw Log Error Message Box */}
                      <div style={{
                        background: '#0A0714',
                        border: '1px solid rgba(248, 113, 113, 0.25)',
                        borderRadius: '8px',
                        padding: '10px',
                        marginBottom: '12px',
                      }}>
                        <div style={{ fontSize: '10px', color: '#F87171', fontWeight: 700, marginBottom: '4px', letterSpacing: '1px' }}>
                          RAW ERROR:
                        </div>
                        <pre style={{ margin: 0, color: '#FCA5A5', maxHeight: '120px', overflowY: 'auto', fontSize: '11px', fontFamily: 'var(--font-mono)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                          {item.message}
                        </pre>
                      </div>

                      {/* RECTIFICATION PLAN */}
                      <div
                        style={{
                          background: '#090710',
                          border: '1px solid rgba(52, 211, 153, 0.35)',
                          borderRadius: '10px',
                          padding: '12px',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#34D399', fontSize: '11px', fontWeight: 700 }}>
                            <Wrench size={13} />
                            <span>WAY TO RECTIFY THIS ERROR</span>
                          </div>
                          <span style={{ fontSize: '10px', color: '#A098B5', fontFamily: 'var(--font-mono)' }}>
                            {plan.model_used}
                          </span>
                        </div>

                        <div style={{ fontSize: '12px', color: '#F5F1FA', marginBottom: '8px' }}>
                          <span style={{ color: '#C77DFF', fontWeight: 700 }}>Cause: </span>
                          {plan.root_cause}
                        </div>

                        {plan.command_fix && (
                          <div style={{ marginBottom: '8px', background: '#040306', padding: '8px', borderRadius: '6px', border: '1px solid rgba(52, 211, 153, 0.25)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                              <span style={{ fontSize: '10px', color: '#34D399', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Terminal size={11} />
                                TERMINAL COMMAND FIX:
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  copyCode(plan.command_fix!, `cmd_${item.log_id}`)
                                }}
                                className="link-btn"
                                style={{ color: copiedCmdId === `cmd_${item.log_id}` ? '#34D399' : '#A098B5', fontSize: '10px' }}
                              >
                                {copiedCmdId === `cmd_${item.log_id}` ? '✓ Copied' : 'Copy'}
                              </button>
                            </div>
                            <pre style={{ margin: 0, padding: '4px', color: '#34D399', fontSize: '11px', fontFamily: 'monospace', overflowX: 'auto' }}>
                              {plan.command_fix}
                            </pre>
                          </div>
                        )}

                        {plan.rectification_steps?.length > 0 && (
                          <div style={{ fontSize: '11px', color: '#E2D9F3' }}>
                            <span style={{ color: '#C77DFF', fontWeight: 700 }}>Steps: </span>
                            <span>{plan.rectification_steps.join(' · ')}</span>
                          </div>
                        )}

                        {plan.verification_step && (
                          <div style={{ marginTop: '6px', fontSize: '11px', color: '#A098B5' }}>
                            <span style={{ color: '#34D399', fontWeight: 700 }}>Verification: </span>
                            <code style={{ color: '#FFF' }}>{plan.verification_step}</code>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* POST-INCIDENT ACTION CENTER */}
          <div
            className="reveal-up in-view"
            style={{
              marginTop: '36px',
              padding: '24px',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, rgba(30, 20, 48, 0.85), rgba(18, 14, 28, 0.95))',
              border: '1px solid rgba(199, 125, 255, 0.4)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.45)',
              backdropFilter: 'blur(12px)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: '#C77DFF',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    letterSpacing: '1.5px',
                    fontWeight: 700,
                  }}
                >
                  <ShieldAlert size={16} color="#E879F9" />
                  INCIDENT ERROR REGISTRY · TIMELINE PERSISTENCE
                </div>
                <h3 style={{ margin: '8px 0 4px', fontSize: '18px', color: '#FFF' }}>
                  Save All {allErrorsCount} Chronological Errors to Your Profile
                </h3>
                <p style={{ margin: 0, color: 'var(--text-dim)', fontSize: '13px', maxWidth: '560px' }}>
                  Sync the entire incident timeline of errors and their respective AI remedies into your profile history.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                <button
                  onClick={() => {
                    displayedTimeline
                      .filter((t) => t.isError)
                      .forEach((t) => handleSaveError(t))
                  }}
                  className="btn primary glow"
                  style={{
                    background: 'linear-gradient(90deg, #C77DFF, #A855F7, #E879F9)',
                    color: '#000',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 18px',
                    borderRadius: '12px',
                  }}
                >
                  <Bookmark size={15} />
                  <span>Save All Timeline Errors ({allErrorsCount})</span>
                </button>

                <button
                  onClick={() => {
                    const navBtn = document.querySelector('nav button:last-child') as HTMLButtonElement
                    if (navBtn) navBtn.click()
                  }}
                  className="btn"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '10px 16px',
                    borderRadius: '12px',
                    borderColor: 'rgba(199, 125, 255, 0.4)',
                    color: '#C77DFF',
                  }}
                >
                  <span>Open Profile Registry</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  )
}
