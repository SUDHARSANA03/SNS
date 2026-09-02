import React, { useState, useEffect } from 'react'
import { useSession } from '../context/SessionContext'
import { useAuth } from '../context/AuthContext'
import { Bookmark, Check, Sparkles, Wrench, Terminal, ShieldAlert, Key, Copy, RefreshCw, Cpu, CheckCircle2, ArrowRight } from 'lucide-react'
import {
  requestErrorRectification,
  getImmediateRectification,
  RectificationPlan,
  getStoredNvidiaKey,
  setStoredNvidiaKey,
} from '../services/nvidiaService'

export default function Detection() {
  const { currentSession, openLogModal } = useSession()
  const { saveError, isErrorSaved } = useAuth()
  const [filterLevel, setFilterLevel] = useState<string>('ALL')
  const [savingLogId, setSavingLogId] = useState<string | null>(null)

  // NVIDIA API Key state
  const [nvidiaKey, setNvidiaKey] = useState<string>('')
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false)
  const [keyInput, setKeyInput] = useState('')

  // Rectification plans cache mapped by log_id
  const [rectifications, setRectifications] = useState<Record<string, RectificationPlan>>({})
  const [loadingRectifyId, setLoadingRectifyId] = useState<string | null>(null)
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null)

  const errors = currentSession?.errors || []
  const rootCauses = currentSession?.analysis?.root_cause_analysis || []

  // Load API Key and initialize immediate rectifications for all errors on mount
  useEffect(() => {
    const k = getStoredNvidiaKey()
    setNvidiaKey(k)
    setKeyInput(k)
  }, [])

  // Whenever errors change, immediately populate rectification for every error so the fix is always visible!
  useEffect(() => {
    if (errors.length > 0) {
      const initialPlans: Record<string, RectificationPlan> = {}
      errors.forEach((err) => {
        if (!rectifications[err.log_id]) {
          initialPlans[err.log_id] = getImmediateRectification(
            err.message,
            (err as any).component || 'system',
            err.log_id
          )
        }
      })
      if (Object.keys(initialPlans).length > 0) {
        setRectifications((prev) => ({ ...prev, ...initialPlans }))
      }
    }
  }, [errors])

  const handleSaveApiKey = (e: React.FormEvent) => {
    e.preventDefault()
    setStoredNvidiaKey(keyInput)
    setNvidiaKey(keyInput)
    setIsKeyModalOpen(false)
  }

  const filteredErrors = errors.filter((err) => {
    if (filterLevel === 'ALL') return true
    return err.level.toUpperCase() === filterLevel
  })

  // Trigger live NVIDIA rectification refresh for an error
  const handleLiveRectify = async (err: (typeof errors)[0]) => {
    setLoadingRectifyId(err.log_id)
    try {
      const plan = await requestErrorRectification({
        errorMessage: err.message,
        logId: err.log_id,
        stackTrace: err.message,
        component: (err as any).component || 'system',
        nvidiaApiKey: nvidiaKey,
      })
      setRectifications((prev) => ({
        ...prev,
        [err.log_id]: plan,
      }))
    } finally {
      setLoadingRectifyId(null)
    }
  }

  // Save error with its rectification to Supabase profile
  const handleSaveErrorWithFix = async (err: (typeof errors)[0]) => {
    setSavingLogId(err.log_id)
    const plan = rectifications[err.log_id] || getImmediateRectification(err.message, (err as any).component, err.log_id)

    try {
      await saveError({
        log_id: err.log_id,
        error_level: err.level,
        message: err.message,
        timestamp: err.timestamp,
        summary: `[Rectified] ${plan.root_cause}`,
        root_cause: `${plan.root_cause}\nFix: ${plan.command_fix || ''}`,
        notes: `Rectification Steps:\n${plan.rectification_steps.join('\n')}\nVerification:\n${plan.verification_step || 'N/A'}`,
        session_id: currentSession?.session_id,
      })
    } finally {
      setSavingLogId(null)
    }
  }

  const copySnippet = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedCodeId(id)
    setTimeout(() => setCopiedCodeId(null), 2000)
  }

  return (
    <section className="view" id="view-detect">
      {/* Header */}
      <div className="view-header-row">
        <div>
          <h1>
            <span className="reveal">Threat & Error Detection & Rectification</span>
          </h1>
          <p className="view-sub">
            {currentSession
              ? `Displaying ${errors.length} detected errors alongside actionable NVIDIA Nemotron AI rectification solutions.`
              : 'No active session. Ingest a log file to extract errors and automated rectification blueprints.'}
          </p>
        </div>
        <div className="view-header-actions" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            onClick={() => setIsKeyModalOpen(true)}
            className="btn sm"
            style={{
              borderColor: nvidiaKey ? '#34D399' : '#C77DFF',
              color: nvidiaKey ? '#34D399' : '#C77DFF',
              background: nvidiaKey ? 'rgba(52, 211, 153, 0.1)' : 'rgba(199, 125, 255, 0.12)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Key size={14} />
            <span>{nvidiaKey ? 'NVIDIA API Key: Active' : 'Set NVIDIA API Key'}</span>
          </button>

          <button className="btn primary" onClick={() => openLogModal('upload')}>
            📥 Ingest Log File
          </button>
        </div>
      </div>

      {/* NVIDIA API Key Modal */}
      {isKeyModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            background: 'rgba(10, 8, 16, 0.85)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            style={{
              maxWidth: '480px',
              width: '100%',
              background: '#120E1E',
              border: '1px solid rgba(199, 125, 255, 0.4)',
              borderRadius: '20px',
              padding: '28px',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Cpu size={20} color="#C77DFF" />
              <h3 style={{ margin: 0, fontSize: '18px', color: '#FFF' }}>NVIDIA Nemotron API Configuration</h3>
            </div>
            <p style={{ fontSize: '12px', color: '#A098B5', marginBottom: '16px' }}>
              Provide your NVIDIA API key (starting with <code>nvapi-</code>) for live Nemotron LLM remediation.
            </p>

            <form onSubmit={handleSaveApiKey} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input
                type="password"
                placeholder="nvapi-••••••••••••••••••••••••"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  background: '#0A0810',
                  border: '1px solid rgba(199, 125, 255, 0.4)',
                  color: '#FFF',
                  fontFamily: 'monospace',
                  fontSize: '13px',
                }}
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button type="button" className="btn sm" onClick={() => setIsKeyModalOpen(false)}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn primary sm"
                  style={{ background: 'linear-gradient(90deg, #C77DFF, #9D4EDD)', color: '#000', fontWeight: 'bold' }}
                >
                  Save Key
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {errors.length === 0 ? (
        <div className="empty-state-panel reveal-up in-view">
          <div className="empty-icon">🛡️</div>
          <h3>{currentSession ? 'No Severe Errors Detected' : 'No Anomaly Signals Loaded'}</h3>
          <p>
            {currentSession
              ? 'The backend heuristic error detector analyzed the log stream and found no explicit ERROR or CRITICAL exceptions.'
              : 'Upload a server log file (.log or .txt) to detect anomalies, exceptions, and rectification solutions.'}
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
          {/* Top Filter Chips */}
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

          {/* LIST OF ERRORS: DIRECTLY DISPLAYING THE ERROR AND THE WAY TO RECTIFY IT */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '16px' }}>
            {filteredErrors.map((err, idx) => {
              const isSaved = isErrorSaved(err.log_id, currentSession?.session_id)
              const isSaving = savingLogId === err.log_id
              const plan = rectifications[err.log_id] || getImmediateRectification(err.message, (err as any).component, err.log_id)
              const isRefreshing = loadingRectifyId === err.log_id

              return (
                <div
                  key={err.log_id || idx}
                  className="reveal-up in-view"
                  style={{
                    background: 'rgba(18, 14, 28, 0.85)',
                    border: '1px solid rgba(199, 125, 255, 0.35)',
                    borderRadius: '20px',
                    padding: '24px',
                    boxShadow: '0 10px 35px rgba(0, 0, 0, 0.5)',
                    backdropFilter: 'blur(12px)',
                  }}
                >
                  {/* Top Bar: Error Title & Meta */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <span
                        className={`status-tag ${err.level === 'CRITICAL' ? 'Investigating' : 'Resolved'}`}
                        style={{
                          background: err.level === 'CRITICAL' ? 'rgba(157, 78, 221, 0.25)' : 'rgba(239, 68, 68, 0.2)',
                          color: err.level === 'CRITICAL' ? '#C77DFF' : '#F87171',
                          border: '1px solid rgba(199, 125, 255, 0.4)',
                          fontWeight: 800,
                          fontSize: '11px',
                          letterSpacing: '1px',
                        }}
                      >
                        {err.level}
                      </span>
                      <h3 style={{ margin: 0, fontSize: '16px', color: '#FFF', fontWeight: 700 }}>
                        {err.message.split('\n')[0].slice(0, 130)}
                      </h3>
                    </div>

                    {/* Actions: Save to Profile & Re-verify with NVIDIA */}
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <button
                        type="button"
                        onClick={() => handleLiveRectify(err)}
                        disabled={isRefreshing}
                        className="btn sm"
                        style={{
                          borderColor: '#C77DFF',
                          color: '#C77DFF',
                          background: 'rgba(199, 125, 255, 0.12)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                        }}
                      >
                        <RefreshCw size={12} className={isRefreshing ? 'animate-spin' : ''} />
                        <span>{isRefreshing ? 'Re-analyzing...' : 'Refresh with NVIDIA'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSaveErrorWithFix(err)}
                        className="btn sm primary glow"
                        style={{
                          background: isSaved ? 'rgba(52, 211, 153, 0.2)' : 'linear-gradient(90deg, #C77DFF, #9D4EDD)',
                          borderColor: isSaved ? '#34D399' : '#C77DFF',
                          color: isSaved ? '#34D399' : '#000',
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        {isSaved ? <Check size={13} /> : <Bookmark size={13} />}
                        <span>{isSaved ? 'Saved in Profile ✓' : 'Save Error + Fix'}</span>
                      </button>
                    </div>
                  </div>

                  <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginBottom: '16px' }}>
                    Log Reference: <b style={{ color: '#E879F9' }}>{err.log_id}</b>
                    {err.timestamp && <span> · Timestamp: {err.timestamp}</span>}
                  </div>

                  {/* ══════════════════════════════════════════════════════════════ */}
                  {/* TWO-PART GRID: 1. THE ERROR  |  2. THE WAY TO RECTIFY THE ERROR */}
                  {/* ══════════════════════════════════════════════════════════════ */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
                    
                    {/* 1. THE ERROR SECTION */}
                    <div
                      style={{
                        background: '#0D0A14',
                        border: '1px solid rgba(239, 68, 68, 0.35)',
                        borderRadius: '14px',
                        padding: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          color: '#F87171',
                          fontSize: '11px',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 700,
                          letterSpacing: '1px',
                          marginBottom: '10px',
                        }}
                      >
                        <ShieldAlert size={14} />
                        <span>THE OCCURRING ERROR</span>
                      </div>

                      <pre
                        style={{
                          flex: 1,
                          margin: 0,
                          padding: '12px',
                          background: '#060408',
                          borderRadius: '8px',
                          border: '1px solid rgba(58, 46, 82, 0.7)',
                          color: '#FCA5A5',
                          fontSize: '12px',
                          fontFamily: 'monospace',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                          lineHeight: '1.5',
                        }}
                      >
                        {err.message}
                      </pre>
                    </div>

                    {/* 2. THE WAY TO RECTIFY THE ERROR (NVIDIA AI REMEDIATION) */}
                    <div
                      style={{
                        background: 'linear-gradient(135deg, rgba(26, 17, 40, 0.95), rgba(12, 10, 20, 0.95))',
                        border: '1px solid rgba(52, 211, 153, 0.45)',
                        borderRadius: '14px',
                        padding: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        boxShadow: '0 0 20px rgba(52, 211, 153, 0.1)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            color: '#34D399',
                            fontSize: '11px',
                            fontFamily: 'var(--font-mono)',
                            fontWeight: 700,
                            letterSpacing: '1px',
                          }}
                        >
                          <Wrench size={14} color="#34D399" />
                          <span>WAY TO RECTIFY THIS ERROR (NVIDIA AI)</span>
                        </div>
                        <span style={{ fontSize: '10px', background: 'rgba(52, 211, 153, 0.15)', color: '#34D399', padding: '2px 6px', borderRadius: '4px', fontFamily: 'monospace' }}>
                          {plan.model_used.includes('Live') ? 'NVIDIA Nemotron Live' : 'NVIDIA Nemotron Engine'}
                        </span>
                      </div>

                      {/* Root Cause Diagnosis */}
                      <div style={{ marginBottom: '10px', fontSize: '12px', color: '#F5F1FA', background: '#08060D', padding: '10px', borderRadius: '8px', border: '1px solid rgba(58, 46, 82, 0.6)' }}>
                        <b style={{ color: '#C77DFF', display: 'block', marginBottom: '3px', fontSize: '11px' }}>
                          🔍 ROOT CAUSE DIAGNOSIS:
                        </b>
                        {plan.root_cause}
                      </div>

                      {/* Terminal Command Fix (Copyable) */}
                      {plan.command_fix && (
                        <div style={{ marginBottom: '10px', background: '#08060D', padding: '10px', borderRadius: '8px', border: '1px solid rgba(52, 211, 153, 0.3)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                            <span style={{ fontSize: '11px', color: '#34D399', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Terminal size={12} />
                              RUN THIS TERMINAL COMMAND TO FIX:
                            </span>
                            <button
                              onClick={() => copySnippet(plan.command_fix!, `cmd_${err.log_id}`)}
                              className="link-btn"
                              style={{ color: copiedCodeId === `cmd_${err.log_id}` ? '#34D399' : '#A098B5', fontSize: '11px' }}
                            >
                              {copiedCodeId === `cmd_${err.log_id}` ? '✓ Copied' : 'Copy'}
                            </button>
                          </div>
                          <pre
                            style={{
                              margin: 0,
                              padding: '8px',
                              background: '#040306',
                              borderRadius: '6px',
                              color: '#34D399',
                              fontSize: '12px',
                              fontFamily: 'monospace',
                              overflowX: 'auto',
                            }}
                          >
                            {plan.command_fix}
                          </pre>
                        </div>
                      )}

                      {/* Step-by-Step Rectification Instructions */}
                      {plan.rectification_steps?.length > 0 && (
                        <div style={{ marginBottom: '10px', fontSize: '12px', color: '#E2D9F3' }}>
                          <b style={{ color: '#C77DFF', display: 'block', marginBottom: '4px', fontSize: '11px' }}>
                            📋 STEP-BY-STEP RECTIFICATION:
                          </b>
                          <ul style={{ margin: 0, paddingLeft: '16px', lineHeight: '1.6' }}>
                            {plan.rectification_steps.map((step, sIdx) => (
                              <li key={sIdx}>{step}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Verification Step */}
                      {plan.verification_step && (
                        <div style={{ fontSize: '11px', color: '#A098B5', background: '#08060D', padding: '8px 10px', borderRadius: '6px', border: '1px solid rgba(58, 46, 82, 0.6)' }}>
                          <span style={{ color: '#34D399', fontWeight: 700 }}>✓ HOW TO VERIFY FIX: </span>
                          <code style={{ color: '#F5F1FA', fontFamily: 'monospace' }}>{plan.verification_step}</code>
                        </div>
                      )}
                    </div>

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
