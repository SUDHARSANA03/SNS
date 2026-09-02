import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession } from '../context/SessionContext'
import { useAuth } from '../context/AuthContext'
import {
  ArrowRight,
  Trash2,
  Copy,
  Check,
  Bookmark,
  Database,
  ShieldAlert,
  Clock,
  Sparkles,
  ShieldCheck,
  Cpu,
  Terminal,
  Wrench,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
  LogOut,
} from 'lucide-react'

export default function Profile() {
  const navigate = useNavigate()
  const {
    currentSession,
    sessionsHistory,
    backendConnected,
    loadSession,
    deleteSession,
    openLogModal,
    checkHealth,
  } = useSession()

  const {
    user,
    isAuthenticated,
    isSupabaseLive,
    savedErrors,
    isLoadingErrors,
    removeError,
    logout,
  } = useAuth()

  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'errors' | 'sessions'>('errors')

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

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

  const handleNextToLogin = () => {
    navigate('/login')
  }

  return (
    <section className="view" id="view-profile" style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '60px' }}>
      
      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* 1. LINKEDIN-STYLE TOP PROFILE CARD: BANNER + AVATAR + IDENTITY     */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <div
        className="reveal-up in-view"
        style={{
          background: '#120E1E',
          border: '1px solid rgba(199, 125, 255, 0.35)',
          borderRadius: '24px',
          overflow: 'hidden',
          boxShadow: '0 16px 40px rgba(0, 0, 0, 0.6)',
          marginBottom: '20px',
        }}
      >
        {/* Profile Banner */}
        <div
          style={{
            height: '160px',
            background: 'linear-gradient(135deg, #1f1136 0%, #35155d 50%, #0d0918 100%)',
            position: 'relative',
            borderBottom: '1px solid rgba(199, 125, 255, 0.2)',
          }}
        >
          {/* Subtle Grid Accent */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: 'radial-gradient(rgba(199, 125, 255, 0.15) 1px, transparent 1px)',
              backgroundSize: '20px 20px',
              opacity: 0.7,
            }}
          />

          {/* Top-Right Badges on Banner */}
          <div style={{ position: 'absolute', top: '16px', right: '20px', display: 'flex', gap: '8px' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 10px',
                background: 'rgba(10, 8, 16, 0.75)',
                border: '1px solid rgba(52, 211, 153, 0.4)',
                borderRadius: '8px',
                color: '#34D399',
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                fontWeight: 600,
                backdropFilter: 'blur(8px)',
              }}
            >
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#34D399' }} />
              {isSupabaseLive ? 'Supabase Cloud Sync' : 'Sandbox Store'}
            </span>

            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 10px',
                background: 'rgba(10, 8, 16, 0.75)',
                border: '1px solid rgba(199, 125, 255, 0.4)',
                borderRadius: '8px',
                color: '#C77DFF',
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                fontWeight: 600,
                backdropFilter: 'blur(8px)',
              }}
            >
              <Cpu size={12} />
              NVIDIA Nemotron 340B
            </span>
          </div>
        </div>

        {/* Profile Identity & Info */}
        <div style={{ padding: '0 32px 28px', position: 'relative' }}>
          
          {/* Avatar (Overlapping the banner by 48px) */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '-48px', marginBottom: '16px' }}>
            <div
              style={{
                width: '96px',
                height: '96px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #C77DFF, #7B2CBF)',
                border: '4px solid #120E1E',
                boxShadow: '0 0 24px rgba(199, 125, 255, 0.45)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#0A0810',
                fontSize: '32px',
                fontWeight: 800,
                fontFamily: 'var(--font-mono)',
              }}
            >
              {user?.full_name ? user.full_name.slice(0, 2).toUpperCase() : 'AI'}
            </div>

            {/* Actions: Sign Out (if authenticated) */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              {isAuthenticated && (
                <button
                  onClick={logout}
                  className="btn sm"
                  style={{
                    padding: '8px 16px',
                    borderRadius: '20px',
                    borderColor: 'rgba(239, 68, 68, 0.4)',
                    color: '#FCA5A5',
                  }}
                >
                  <LogOut size={13} style={{ display: 'inline', marginRight: '4px' }} />
                  Sign Out
                </button>
              )}
            </div>
          </div>

          {/* Name & Headline */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: '#FFF' }}>
                {user?.full_name || 'Anonymous Investigator'}
              </h2>
              <span title="Verified Investigator">
                <ShieldCheck size={18} color="#C77DFF" />
              </span>
            </div>

            <p style={{ margin: '0 0 10px', fontSize: '14px', color: '#D4C9E2', fontWeight: 500 }}>
              {user?.role || 'Incident Response & Reliability Engineer · Cloud Infrastructure & Automated Root-Cause Remediation'}
            </p>

            {/* Meta tags: Location / Email / Connection */}
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '12px', color: 'var(--text-dim)' }}>
              <span>📍 Incident AI Security Operations Lab</span>
              <span>✉️ {user?.email || 'Not logged in (Guest Session)'}</span>
              <span style={{ color: isSupabaseLive ? '#34D399' : '#C77DFF' }}>
                ● {isSupabaseLive ? 'Supabase Cloud Connected' : 'Supabase Local Fallback'}
              </span>
              <span style={{ color: backendConnected ? '#34D399' : '#F87171' }}>
                ● {backendConnected ? 'FastAPI Backend Online' : 'FastAPI Offline'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* 2. LINKEDIN-STYLE ANALYTICS / TELEMETRY CARD                       */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <div
        className="reveal-up in-view"
        style={{
          background: '#120E1E',
          border: '1px solid rgba(199, 125, 255, 0.25)',
          borderRadius: '20px',
          padding: '20px 24px',
          marginBottom: '20px',
        }}
      >
        <h3 style={{ margin: '0 0 14px', fontSize: '15px', color: '#FFF', fontWeight: 700 }}>
          Investigator Telemetry & Activity
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
          <div style={{ background: '#090710', padding: '14px', borderRadius: '12px', border: '1px solid rgba(199, 125, 255, 0.2)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Saved Preferred Errors
            </div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: '#C77DFF', marginTop: '4px' }}>
              {savedErrors.length}
            </div>
            <div style={{ fontSize: '11px', color: '#A098B5', marginTop: '4px' }}>
              Stored in Supabase database
            </div>
          </div>

          <div style={{ background: '#090710', padding: '14px', borderRadius: '12px', border: '1px solid rgba(199, 125, 255, 0.2)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Analyzed Log Sessions
            </div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: '#FFF', marginTop: '4px' }}>
              {sessionsHistory.length}
            </div>
            <div style={{ fontSize: '11px', color: '#A098B5', marginTop: '4px' }}>
              Available in session history
            </div>
          </div>

          <div style={{ background: '#090710', padding: '14px', borderRadius: '12px', border: '1px solid rgba(199, 125, 255, 0.2)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '1px' }}>
              AI Rectification Model
            </div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#34D399', marginTop: '8px' }}>
              Nemotron-4 340B
            </div>
            <div style={{ fontSize: '11px', color: '#A098B5', marginTop: '4px' }}>
              NVIDIA AI Reasoning Engine
            </div>
          </div>

          <div style={{ background: '#090710', padding: '14px', borderRadius: '12px', border: '1px solid rgba(199, 125, 255, 0.2)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Persistence Store
            </div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#E879F9', marginTop: '8px' }}>
              Supabase Postgres
            </div>
            <div style={{ fontSize: '11px', color: '#A098B5', marginTop: '4px' }}>
              RLS Policy Secured
            </div>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* 3. LINKEDIN-STYLE ABOUT CARD                                       */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <div
        className="reveal-up in-view"
        style={{
          background: '#120E1E',
          border: '1px solid rgba(199, 125, 255, 0.25)',
          borderRadius: '20px',
          padding: '20px 24px',
          marginBottom: '20px',
        }}
      >
        <h3 style={{ margin: '0 0 10px', fontSize: '15px', color: '#FFF', fontWeight: 700 }}>
          About Investigator
        </h3>
        <p style={{ margin: 0, fontSize: '13px', color: '#D4C9E2', lineHeight: '1.7' }}>
          Specialized in high-velocity root-cause diagnostics, automated log anomaly detection, and NVIDIA AI error remediation. 
          Errors bookmarked in this profile are persisted to Supabase and equipped with executable terminal commands, step-by-step resolution plans, and verification steps.
        </p>
      </div>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* 4. BOTTOM SECTION: THE ERROR PART (USER-PREFERRED ERROR REGISTRY) */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <div
        className="reveal-up in-view"
        style={{
          background: '#120E1E',
          border: '1px solid rgba(199, 125, 255, 0.35)',
          borderRadius: '24px',
          padding: '24px',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
        }}
      >
        {/* Error Section Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldAlert size={20} color="#C77DFF" />
              <h3 style={{ margin: 0, fontSize: '18px', color: '#FFF', fontWeight: 700 }}>
                User-Preferred Error History & Rectification Registry
              </h3>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--text-dim)' }}>
              All errors saved by investigator across summary and timeline sections, synced with Supabase.
            </p>
          </div>

          {/* Tab Switcher: Saved Errors vs Log Sessions */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setActiveTab('errors')}
              className={`filter-chip ${activeTab === 'errors' ? 'on' : ''}`}
              style={{
                fontSize: '12px',
                padding: '6px 14px',
                borderColor: activeTab === 'errors' ? '#C77DFF' : 'rgba(199, 125, 255, 0.3)',
                background: activeTab === 'errors' ? 'rgba(199, 125, 255, 0.2)' : 'transparent',
              }}
            >
              <Bookmark size={13} style={{ display: 'inline', marginRight: '4px' }} />
              Saved Errors ({savedErrors.length})
            </button>

            <button
              onClick={() => setActiveTab('sessions')}
              className={`filter-chip ${activeTab === 'sessions' ? 'on' : ''}`}
              style={{
                fontSize: '12px',
                padding: '6px 14px',
                borderColor: activeTab === 'sessions' ? '#C77DFF' : 'rgba(199, 125, 255, 0.3)',
                background: activeTab === 'sessions' ? 'rgba(199, 125, 255, 0.2)' : 'transparent',
              }}
            >
              <Clock size={13} style={{ display: 'inline', marginRight: '4px' }} />
              Log Sessions ({sessionsHistory.length})
            </button>
          </div>
        </div>

        {/* ── TAB 1: SAVED ERRORS LIST ── */}
        {activeTab === 'errors' && (
          <div>
            {isLoadingErrors ? (
              <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-dim)' }}>
                Loading saved errors from Supabase...
              </div>
            ) : savedErrors.length === 0 ? (
              <div className="empty-state-panel" style={{ padding: '36px', textAlign: 'center', background: '#090710', borderRadius: '16px' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>⭐</div>
                <h4 style={{ margin: '0 0 6px', fontSize: '16px', color: '#FFF' }}>No Preferred Errors Saved Yet</h4>
                <p style={{ maxWidth: '500px', margin: '0 auto 16px', fontSize: '12px', color: 'var(--text-dim)', lineHeight: '1.6' }}>
                  Whenever a log hits with an <b>ERROR</b> or <b>CRITICAL</b> status, click the{' '}
                  <span style={{ color: '#C77DFF' }}>"Save Error to Profile"</span> button located right after
                  the summary and timeline error section to bookmark it here.
                </p>
                <button className="btn primary sm" onClick={() => openLogModal('samples')}>
                  Analyze Log to Find Errors
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {savedErrors.map((err) => (
                  <div
                    key={err.id}
                    className="reveal-up in-view"
                    style={{
                      background: '#090710',
                      border: '1px solid rgba(199, 125, 255, 0.3)',
                      borderRadius: '16px',
                      padding: '18px',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {/* Error Card Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span
                          className={`status-tag ${err.error_level === 'CRITICAL' ? 'Investigating' : 'Resolved'}`}
                          style={{
                            background: err.error_level === 'CRITICAL' ? 'rgba(157, 78, 221, 0.25)' : 'rgba(239, 68, 68, 0.2)',
                            color: err.error_level === 'CRITICAL' ? '#C77DFF' : '#F87171',
                            border: '1px solid rgba(199, 125, 255, 0.4)',
                            fontWeight: 800,
                            fontSize: '11px',
                          }}
                        >
                          {err.error_level}
                        </span>

                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 600, color: '#E879F9' }}>
                          Ref: {err.log_id}
                        </span>

                        {err.component && (
                          <span style={{ fontSize: '11px', color: 'var(--text-dim)', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '6px' }}>
                            {err.component}
                          </span>
                        )}

                        {err.timestamp && (
                          <span style={{ fontSize: '11px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                            🕒 {err.timestamp}
                          </span>
                        )}
                      </div>

                      {/* Actions: Copy & Delete */}
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          className="link-btn"
                          title="Copy error message"
                          onClick={() => copyToClipboard(err.message, err.id)}
                          style={{ color: copiedId === err.id ? '#34D399' : 'var(--text-dim)' }}
                        >
                          {copiedId === err.id ? <Check size={14} /> : <Copy size={14} />}
                        </button>
                        <button
                          className="link-btn"
                          title="Remove from profile"
                          onClick={() => removeError(err.id)}
                          style={{ color: 'var(--critical)' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Raw Error Message */}
                    <pre
                      style={{
                        margin: '8px 0',
                        padding: '12px',
                        background: '#040306',
                        borderRadius: '8px',
                        border: '1px solid rgba(58, 46, 82, 0.7)',
                        color: '#FCA5A5',
                        fontSize: '12px',
                        fontFamily: 'var(--font-mono)',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        maxHeight: '120px',
                        overflowY: 'auto',
                      }}
                    >
                      {err.message}
                    </pre>

                    {/* Causal Context */}
                    {err.summary && (
                      <div style={{ marginTop: '8px', fontSize: '12px', color: '#D4C9E2', display: 'flex', gap: '6px' }}>
                        <span style={{ color: '#C77DFF', fontWeight: 600 }}>Causal Context:</span>
                        <span>{err.summary}</span>
                      </div>
                    )}

                    {/* 🛠️ NVIDIA AI Rectification Plan */}
                    {err.root_cause && (
                      <div
                        style={{
                          marginTop: '8px',
                          fontSize: '12px',
                          color: '#34D399',
                          background: '#06040A',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: '1px solid rgba(52, 211, 153, 0.35)',
                        }}
                      >
                        <b style={{ color: '#34D399', display: 'block', marginBottom: '4px' }}>
                          🛠️ NVIDIA Remediation Blueprint:
                        </b>
                        <div style={{ whiteSpace: 'pre-wrap', color: '#E2D9F3' }}>{err.root_cause}</div>
                      </div>
                    )}

                    {err.notes && (
                      <div style={{ marginTop: '6px', fontSize: '11px', color: '#A098B5', fontFamily: 'var(--font-mono)', whiteSpace: 'pre-wrap' }}>
                        {err.notes}
                      </div>
                    )}

                    <div style={{ marginTop: '10px', fontSize: '10px', color: 'var(--text-faint)', display: 'flex', justifyContent: 'space-between' }}>
                      <span>Saved on {new Date(err.created_at).toLocaleString()}</span>
                      {err.session_id && <span>Session: {err.session_id.slice(0, 8)}...</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── TAB 2: HISTORICAL LOG SESSIONS ── */}
        {activeTab === 'sessions' && (
          <div>
            {sessionsHistory.length === 0 ? (
              <div className="empty-state-panel" style={{ padding: '36px', textAlign: 'center', background: '#090710', borderRadius: '16px' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>⏳</div>
                <h4 style={{ margin: '0 0 6px', fontSize: '16px', color: '#FFF' }}>No Log Sessions Ingested Yet</h4>
                <p style={{ maxWidth: '460px', margin: '0 auto 16px', fontSize: '12px', color: 'var(--text-dim)' }}>
                  Upload a server log file (.log or .txt) to analyze errors and track sessions in your history.
                </p>
                <button className="btn primary sm" onClick={() => openLogModal('upload')}>
                  Ingest New Log File
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {sessionsHistory.map((s) => (
                  <div
                    key={s.session_id}
                    style={{
                      background: '#090710',
                      border: '1px solid rgba(199, 125, 255, 0.25)',
                      borderRadius: '12px',
                      padding: '14px 18px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '10px',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <b style={{ color: '#FFF', fontSize: '13px' }}>{s.fileName || 'Log Analysis Session'}</b>
                        <span style={{ fontSize: '11px', color: '#A098B5', fontFamily: 'var(--font-mono)' }}>
                          ID: {s.session_id.slice(0, 8)}...
                        </span>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '4px' }}>
                        {s.total_logs} logs parsed · <span style={{ color: '#F87171' }}>{s.detected_errors} errors</span> · {new Date(s.createdAt).toLocaleString()}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <button
                        onClick={() => loadSession(s.session_id)}
                        className="btn sm primary"
                        style={{
                          background: currentSession?.session_id === s.session_id ? 'rgba(52, 211, 153, 0.2)' : 'linear-gradient(90deg, #C77DFF, #9D4EDD)',
                          color: currentSession?.session_id === s.session_id ? '#34D399' : '#000',
                          fontWeight: 700,
                        }}
                      >
                        {currentSession?.session_id === s.session_id ? 'Active Session ✓' : 'Load Session'}
                      </button>
                      <button
                        onClick={() => deleteSession(s.session_id)}
                        className="link-btn"
                        style={{ color: 'var(--critical)' }}
                        title="Delete session"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

    </section>
  )
}
