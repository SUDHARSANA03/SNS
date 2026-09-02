import React, { useEffect, useRef, useState } from 'react'
import { CARD_DETAILS, ViewId } from '../data'
import { useSession } from '../context/SessionContext'

interface Props {
  exiting: boolean
  hidden: boolean
  onOpen: (view: ViewId) => void
}

const CARDS: { view: ViewId; className: string; rot: string; delay: string }[] = [
  { view: 'feed', className: 'card-live', rot: '-7deg', delay: '0s' },
  { view: 'detect', className: 'card-detect', rot: '-3deg', delay: '.12s' },
  { view: 'guard', className: 'card-guard', rot: '2deg', delay: '.24s' },
  { view: 'chain', className: 'card-chain', rot: '4deg', delay: '.36s' },
  { view: 'profile', className: 'card-profile', rot: '7deg', delay: '.48s' },
]

export default function Landing({ exiting, hidden, onOpen }: Props) {
  const [split, setSplit] = useState(false)
  const [selected, setSelected] = useState<number | null>(null)
  const stackRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const { currentSession, openLogModal, backendConnected } = useSession()

  useEffect(() => {
    let tick = false
    const update = () => {
      tick = false
      if (!stackRef.current) return
      if (window.innerWidth <= 760) {
        setSplit(window.scrollY > 90)
        return
      }
      const rect = stackRef.current.getBoundingClientRect()
      setSplit(rect.top < window.innerHeight * 0.72)
    }
    const onScroll = () => {
      if (!tick) {
        tick = true
        requestAnimationFrame(update)
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', update)
    update()
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', update)
    }
  }, [])

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as Node
      if (stackRef.current?.contains(target)) return
      if (panelRef.current?.contains(target)) return
      setSelected(null)
    }
    document.addEventListener('click', onDocClick)
    return () => document.removeEventListener('click', onDocClick)
  }, [])

  const toggleCard = (index: number) => {
    setSelected((cur) => (cur === index ? null : index))
  }

  if (hidden) return null

  return (
    <section className={'landing' + (exiting ? ' exit' : '')} id="landing">
      <div className="landing-copy">
        <div className="landing-eyebrow">
          <i className={backendConnected ? 'connected' : 'offline'}></i>
          {backendConnected ? 'Backend Connected · FastAPI + NVIDIA AI' : 'FastAPI Backend Ready (Port 8000)'}
        </div>
        <h1 className="landing-title">
          <span className="gradient">
            INCIDENT
            <br />
            AI
          </span>
        </h1>
        <p className="landing-subtitle">
          AI-powered log analysis and root-cause intelligence. Ingest server log streams, detect critical anomalies,
          and synthesize causal timelines with NVIDIA Nemotron LLM reasoning.
        </p>

        {/* Ingest Action Hub */}
        <div className="landing-actions-hub">
          <button className="btn primary lg glow" onClick={() => openLogModal('upload')}>
            <span>📥 Ingest Log File</span>
          </button>
          <button className="btn lg" onClick={() => openLogModal('paste')}>
            <span>📋 Paste Log Snippet</span>
          </button>
          <button className="btn lg" onClick={() => openLogModal('samples')}>
            <span>⚡ Sample Incidents</span>
          </button>
        </div>

        {currentSession ? (
          <div className="landing-active-session" onClick={() => onOpen('feed')}>
            <span className="dot on"></span>
            <span>
              Active Session: <b>{currentSession.fileName || currentSession.session_id.slice(0, 8)}</b> ·{' '}
              {currentSession.total_logs} logs · {currentSession.detected_errors} errors detected
            </span>
            <span className="open-pill">Open Console →</span>
          </div>
        ) : (
          <div className="landing-hint">
            Ready for input <span>→ Select or upload a .log file above to start interactive AI analysis</span>
          </div>
        )}
      </div>

      <div className="feature-stage" aria-label="Incident AI modules">
        <div
          className={
            'feature-track incident-card-stack' +
            (split ? ' cards-split' : '') +
            (selected !== null ? ' has-selection' : '')
          }
          ref={stackRef}
        >
          {CARDS.map((c, i) => (
            <article
              key={c.view}
              className={'feature-card incident-card ' + c.className + (selected === i ? ' is-selected' : '')}
              style={{ '--r': c.rot, '--d': c.delay } as React.CSSProperties}
              tabIndex={0}
              role="button"
              onClick={() => toggleCard(i)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  toggleCard(i)
                }
              }}
              onDoubleClick={() => onOpen(c.view)}
            >
              <CardVisual view={c.view} />
              <div className="feature-meta">
                <span>{CARD_DETAILS[i][0]}</span>
                <small>{cardBadge(c.view, currentSession)}</small>
              </div>
              <h3>{CARD_DETAILS[i][1]}</h3>
              <p>{cardBlurb(c.view)}</p>
            </article>
          ))}
        </div>

        <div className={'card-detail-panel' + (selected !== null ? ' visible' : '')} aria-live="polite" ref={panelRef}>
          <button className="detail-close" aria-label="Close details" onClick={() => setSelected(null)}>
            ×
          </button>
          <div className="detail-kicker">{selected !== null ? CARD_DETAILS[selected][0] : ''}</div>
          <h4>{selected !== null ? CARD_DETAILS[selected][1] : ''}</h4>
          <p>{selected !== null ? CARD_DETAILS[selected][2] : ''}</p>
          {selected !== null && (
            <div style={{ marginTop: '14px' }}>
              <button className="btn primary sm" onClick={() => onOpen(CARDS[selected].view)}>
                Open {CARD_DETAILS[selected][1]} Module →
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

function cardBadge(view: ViewId, session: any) {
  if (session) {
    switch (view) {
      case 'feed':
        return `${session.total_logs} LOGS`
      case 'detect':
        return `${session.detected_errors} ERRORS`
      case 'guard':
        return `${session.analysis?.root_cause_analysis?.length || 0} CAUSES`
      case 'chain':
        return `${session.analysis?.timeline?.length || 0} EVENTS`
      case 'profile':
        return 'SESSION'
    }
  }
  switch (view) {
    case 'feed':
      return 'STREAM'
    case 'detect':
      return 'SIGNALS'
    case 'guard':
      return 'REASONING'
    case 'chain':
      return 'CHRONOLOGY'
    case 'profile':
      return 'HUB'
  }
}

function cardBlurb(view: ViewId) {
  switch (view) {
    case 'feed':
      return 'Inspect real parsed logs from your ingested stream.'
    case 'detect':
      return 'Review isolated error signals and faults.'
    case 'guard':
      return 'Examine NVIDIA AI root cause reasoning and confidence.'
    case 'chain':
      return 'Trace chronological events from signal to failure.'
    case 'profile':
      return 'Review session history, stats, and backend telemetry.'
  }
}

function CardVisual({ view }: { view: ViewId }) {
  if (view === 'feed') {
    return (
      <div className="card-visual terminal-visual">
        <div className="visual-top">
          <span className="mini-dot"></span>
          <span className="mini-dot"></span>
          <span className="mini-dot"></span>
          <b>PARSED STREAM</b>
        </div>
        <div className="terminal-lines">
          <span>
            <i></i> api-gateway <em>200</em>
          </span>
          <span>
            <i></i> auth-service <em>200</em>
          </span>
          <span className="hot">
            <i></i> payment-api <em>ERR_TIMEOUT</em>
          </span>
          <span>
            <i></i> db-primary <em>CONN_POOL</em>
          </span>
        </div>
      </div>
    )
  }
  if (view === 'detect') {
    return (
      <div className="card-visual detection-visual">
        <div className="scan-ring">
          <span></span>
        </div>
        <div className="detect-core">!</div>
        <div className="signal signal-a"></div>
        <div className="signal signal-b"></div>
        <div className="signal signal-c"></div>
        <strong>ANOMALIES</strong>
        <small>Heuristic Scanner</small>
      </div>
    )
  }
  if (view === 'guard') {
    return (
      <div className="card-visual guard-visual">
        <div className="shield-shape">🧠</div>
        <div className="guard-meter">
          <span></span>
        </div>
        <div className="guard-label">
          <b>NVIDIA NEMOTRON</b>
          <em>ACTIVE</em>
        </div>
        <div className="guard-chip">GROUNDED</div>
      </div>
    )
  }
  if (view === 'chain') {
    return (
      <div className="card-visual chain-visual">
        <div className="chain-line"></div>
        <div className="chain-node n1">
          <b>01</b>
          <span>signal</span>
        </div>
        <div className="chain-node n2">
          <b>02</b>
          <span>detect</span>
        </div>
        <div className="chain-node n3">
          <b>03</b>
          <span>resolve</span>
        </div>
      </div>
    )
  }
  return (
    <div className="card-visual profile-visual">
      <div className="profile-orbit">
        <span></span>
        <span></span>
      </div>
      <div className="profile-avatar">AI</div>
      <div className="profile-bars">
        <i></i>
        <i></i>
        <i></i>
      </div>
    </div>
  )
}
