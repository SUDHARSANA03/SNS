import React, { useState, useEffect } from 'react'
import {
  FileText,
  Download,
  Copy,
  Check,
  Bookmark,
  ShieldAlert,
  Calendar,
  AlertTriangle,
  Clock,
  Sparkles,
  Cpu,
  CheckCircle2,
  Tag,
  Wrench,
  Edit3,
} from 'lucide-react'
import { useSession } from '../context/SessionContext'
import { useAuth } from '../context/AuthContext'
import { IncidentRecord, ActionItem } from '../data'
import { saveIncidentRecord, generateRCADraftFromBackend } from '../services/incidentService'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSaved?: (record: IncidentRecord) => void
}

export default function RCADraftModal({ isOpen, onClose, onSaved }: Props) {
  const { currentSession } = useSession()
  const { user, isSupabaseLive } = useAuth()

  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [saved, setSaved] = useState(false)
  const [activeTab, setActiveTab] = useState<'preview' | 'markdown' | 'actions'>('preview')

  // Editable fields
  const [title, setTitle] = useState('')
  const [severity, setSeverity] = useState<'CRITICAL' | 'MAJOR' | 'MINOR' | 'LOW'>('MAJOR')
  const [status, setStatus] = useState<'INVESTIGATING' | 'IDENTIFIED' | 'MITIGATED' | 'RESOLVED' | 'CLOSED'>('IDENTIFIED')
  const [summary, setSummary] = useState('')
  const [rootCauseText, setRootCauseText] = useState('')
  const [markdown, setMarkdown] = useState('')
  const [actionItems, setActionItems] = useState<ActionItem[]>([])

  useEffect(() => {
    if (!isOpen) return

    const loadDraft = async () => {
      setLoading(true)
      setSaved(false)
      try {
        const rootCauses = currentSession?.analysis?.root_cause_analysis || []
        const defaultTitle = rootCauses[0]?.cause
          ? `Outage: ${rootCauses[0].cause.slice(0, 80)}`
          : `Incident Investigation - ${currentSession?.fileName || currentSession?.session_id?.slice(0, 8) || 'SRE'}`

        const defaultSev: 'CRITICAL' | 'MAJOR' | 'MINOR' | 'LOW' =
          (currentSession?.errors?.some((e) => e.level === 'CRITICAL' || e.level === 'FATAL') ? 'CRITICAL' : 'MAJOR')

        setTitle(defaultTitle)
        setSeverity(defaultSev)
        setSummary(currentSession?.analysis?.summary || 'System incident identified through automated log triage.')
        setRootCauseText(rootCauses[0]?.cause || 'Under investigation')

        // Build default action items from recommendations
        const recs = currentSession?.analysis?.recommendations || []
        const defaultActions: ActionItem[] = recs.map((r, i) => ({
          title: `Mitigation Step #${i + 1}`,
          description: r,
          owner: 'SRE Team',
          status: 'OPEN',
          type: i === 0 ? 'IMMEDIATE' : 'PREVENTATIVE',
        }))
        if (defaultActions.length === 0) {
          defaultActions.push({
            title: 'Socket Connectivity Guard',
            description: 'Implement healthcheck probes on downstream services',
            owner: 'Platform Engineering',
            status: 'OPEN',
            type: 'PREVENTATIVE',
          })
        }
        setActionItems(defaultActions)

        // Request comprehensive markdown draft from backend
        try {
          const res = await generateRCADraftFromBackend({
            sessionId: currentSession?.session_id,
            incidentTitle: defaultTitle,
            severity: defaultSev,
          })
          if (res && res.rca_draft_markdown) {
            setMarkdown(res.rca_draft_markdown)
          }
        } catch (e) {
          // Fallback client-side markdown generator
          setMarkdown(`# SRE Incident Post-Mortem & RCA\n\n## Incident Title: ${defaultTitle}\n\n## Executive Summary\n${currentSession?.analysis?.summary || 'Degradation detected.'}\n\n## Root Cause\n${rootCauses[0]?.cause || 'N/A'}`)
        }
      } finally {
        setLoading(false)
      }
    }

    loadDraft()
  }, [isOpen, currentSession])

  if (!isOpen) return null

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(markdown)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownloadMarkdown = () => {
    const element = document.createElement('a')
    const file = new Blob([markdown], { type: 'text/markdown;charset=utf-8' })
    element.href = URL.createObjectURL(file)
    element.download = `RCA-PostMortem-${(title || 'Incident').replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30)}.md`
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  const handleSaveToPersistentRecords = async () => {
    setLoading(true)
    try {
      const components = Array.from(new Set(currentSession?.errors?.map((e) => (e as any).component || 'system') || ['system']))

      const record = await saveIncidentRecord({
        user_id: user?.id,
        session_id: currentSession?.session_id,
        incident_title: title,
        severity,
        status,
        executive_summary: summary,
        root_cause: rootCauseText,
        trigger_event: currentSession?.errors?.[0]?.message || 'System exception logged',
        impact_assessment: `Identified ${currentSession?.detected_errors || 0} errors across ${currentSession?.total_logs || 0} parsed logs.`,
        affected_components: components,
        causal_timeline: currentSession?.analysis?.timeline || [],
        action_items: actionItems,
        rca_draft_markdown: markdown,
      })

      setSaved(true)
      if (onSaved) onSaved(record)
      setTimeout(() => setSaved(false), 3000)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="process-overlay" style={{ zIndex: 999999 }}>
      <div
        className="log-modal reveal-up in-view"
        style={{
          maxWidth: '920px',
          width: '95%',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          background: '#120E1E',
          border: '1px solid rgba(199, 125, 255, 0.45)',
          borderRadius: '24px',
          padding: '0',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.85)',
          overflow: 'hidden',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid rgba(199, 125, 255, 0.25)',
            background: 'linear-gradient(135deg, rgba(31, 17, 54, 0.95), rgba(13, 9, 24, 0.95))',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: '16px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span
                style={{
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  color: '#C77DFF',
                  fontWeight: 700,
                  letterSpacing: '1px',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  background: 'rgba(199, 125, 255, 0.15)',
                }}
              >
                FORMAL INCIDENT RECORD & SRE RCA ENGINE
              </span>
              <span style={{ fontSize: '11px', color: '#34D399' }}>
                ● {isSupabaseLive ? 'Supabase Sync Ready' : 'Local Persistence'}
              </span>
            </div>
            <h2 style={{ margin: 0, fontSize: '20px', color: '#FFF', fontWeight: 700 }}>
              Final Incident Summary & Publication-Ready RCA Draft
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#A098B5' }}>
              Synthesized by NVIDIA Nemotron AI with root causes, chronological timeline, impact metrics, and corrective guardrails.
            </p>
          </div>

          <button
            onClick={onClose}
            className="process-close"
            style={{ position: 'static', transform: 'none' }}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Modal Tabs & Quick Actions Bar */}
        <div
          style={{
            padding: '12px 24px',
            borderBottom: '1px solid rgba(58, 46, 82, 0.7)',
            background: '#0D0916',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setActiveTab('preview')}
              className={`filter-chip ${activeTab === 'preview' ? 'on' : ''}`}
              style={{ padding: '6px 14px', fontSize: '12px' }}
            >
              <FileText size={13} style={{ display: 'inline', marginRight: '4px' }} />
              Structured Overview
            </button>
            <button
              onClick={() => setActiveTab('markdown')}
              className={`filter-chip ${activeTab === 'markdown' ? 'on' : ''}`}
              style={{ padding: '6px 14px', fontSize: '12px' }}
            >
              <Edit3 size={13} style={{ display: 'inline', marginRight: '4px' }} />
              Post-Mortem Markdown (.md)
            </button>
            <button
              onClick={() => setActiveTab('actions')}
              className={`filter-chip ${activeTab === 'actions' ? 'on' : ''}`}
              style={{ padding: '6px 14px', fontSize: '12px' }}
            >
              <Wrench size={13} style={{ display: 'inline', marginRight: '4px' }} />
              Action Items ({actionItems.length})
            </button>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              onClick={handleCopyMarkdown}
              className="btn sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11px' }}
            >
              {copied ? <Check size={12} color="#34D399" /> : <Copy size={12} />}
              <span>{copied ? 'Copied ✓' : 'Copy Report'}</span>
            </button>

            <button
              onClick={handleDownloadMarkdown}
              className="btn sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11px' }}
            >
              <Download size={12} />
              <span>Export .md</span>
            </button>

            <button
              onClick={handleSaveToPersistentRecords}
              disabled={loading}
              className="btn sm primary glow"
              style={{
                background: saved ? 'rgba(52, 211, 153, 0.2)' : 'linear-gradient(90deg, #C77DFF, #9D4EDD)',
                borderColor: saved ? '#34D399' : '#C77DFF',
                color: saved ? '#34D399' : '#000',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '11px',
              }}
            >
              {saved ? <Check size={13} /> : <Bookmark size={13} />}
              <span>{saved ? 'Saved to Records ✓' : 'Save Incident Record'}</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {/* TAB 1: Structured Overview */}
          {activeTab === 'preview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* Title & Metadata Inputs */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '12px',
                  background: '#090710',
                  padding: '16px',
                  borderRadius: '12px',
                  border: '1px solid rgba(199, 125, 255, 0.2)',
                }}
              >
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: '11px', color: '#A098B5', display: 'block', marginBottom: '4px' }}>
                    INCIDENT TITLE
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    style={{
                      width: '100%',
                      background: '#120E1E',
                      border: '1px solid rgba(199, 125, 255, 0.4)',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      color: '#FFF',
                      fontSize: '14px',
                      fontWeight: 'bold',
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: '#A098B5', display: 'block', marginBottom: '4px' }}>
                    SEVERITY
                  </label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value as any)}
                    style={{
                      width: '100%',
                      background: '#120E1E',
                      border: '1px solid rgba(199, 125, 255, 0.4)',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      color: severity === 'CRITICAL' ? '#EF4444' : '#C77DFF',
                      fontSize: '12px',
                      fontWeight: 'bold',
                    }}
                  >
                    <option value="CRITICAL">🔴 CRITICAL (P1)</option>
                    <option value="MAJOR">🟠 MAJOR (P2)</option>
                    <option value="MINOR">🟡 MINOR (P3)</option>
                    <option value="LOW">🟢 LOW (P4)</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: '#A098B5', display: 'block', marginBottom: '4px' }}>
                    INCIDENT STATUS
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    style={{
                      width: '100%',
                      background: '#120E1E',
                      border: '1px solid rgba(199, 125, 255, 0.4)',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      color: '#34D399',
                      fontSize: '12px',
                      fontWeight: 'bold',
                    }}
                  >
                    <option value="INVESTIGATING">🔍 INVESTIGATING</option>
                    <option value="IDENTIFIED">⚠️ IDENTIFIED</option>
                    <option value="MITIGATED">🛡️ MITIGATED</option>
                    <option value="RESOLVED">✅ RESOLVED</option>
                    <option value="CLOSED">🔒 CLOSED</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: '#A098B5', display: 'block', marginBottom: '4px' }}>
                    SESSION / INCIDENT ID
                  </label>
                  <div
                    style={{
                      background: '#120E1E',
                      border: '1px solid rgba(58, 46, 82, 0.8)',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      color: '#E879F9',
                      fontSize: '12px',
                      fontFamily: 'monospace',
                    }}
                  >
                    INC-{currentSession?.session_id?.slice(0, 10) || 'DRAFT-01'}
                  </div>
                </div>
              </div>

              {/* Executive Summary */}
              <div
                style={{
                  background: '#090710',
                  padding: '16px',
                  borderRadius: '12px',
                  border: '1px solid rgba(199, 125, 255, 0.2)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                  <Sparkles size={14} color="#C77DFF" />
                  <span style={{ fontSize: '11px', color: '#C77DFF', fontWeight: 700, letterSpacing: '1px' }}>
                    EXECUTIVE SUMMARY
                  </span>
                </div>
                <textarea
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  rows={3}
                  style={{
                    width: '100%',
                    background: '#120E1E',
                    border: '1px solid rgba(58, 46, 82, 0.8)',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    color: '#E2D9F3',
                    fontSize: '13px',
                    lineHeight: '1.6',
                    resize: 'vertical',
                  }}
                />
              </div>

              {/* Primary Root Cause & Deep Reasoning */}
              <div
                style={{
                  background: '#090710',
                  padding: '16px',
                  borderRadius: '12px',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                  <ShieldAlert size={14} color="#F87171" />
                  <span style={{ fontSize: '11px', color: '#F87171', fontWeight: 700, letterSpacing: '1px' }}>
                    ISOLATED ROOT CAUSE DIAGNOSIS
                  </span>
                </div>
                <textarea
                  value={rootCauseText}
                  onChange={(e) => setRootCauseText(e.target.value)}
                  rows={3}
                  style={{
                    width: '100%',
                    background: '#120E1E',
                    border: '1px solid rgba(239, 68, 68, 0.35)',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    color: '#FCA5A5',
                    fontSize: '13px',
                    lineHeight: '1.6',
                    fontFamily: 'monospace',
                    resize: 'vertical',
                  }}
                />
              </div>

              {/* Causal Sequence Timeline Preview */}
              <div
                style={{
                  background: '#090710',
                  padding: '16px',
                  borderRadius: '12px',
                  border: '1px solid rgba(199, 125, 255, 0.2)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                  <Clock size={14} color="#C77DFF" />
                  <span style={{ fontSize: '11px', color: '#C77DFF', fontWeight: 700, letterSpacing: '1px' }}>
                    INCIDENT RECONSTRUCTION TIMELINE ({currentSession?.analysis?.timeline?.length || 0} Events)
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {(currentSession?.analysis?.timeline || []).slice(0, 5).map((evt, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        fontSize: '12px',
                        background: '#120E1E',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: '1px solid rgba(58, 46, 82, 0.6)',
                      }}
                    >
                      <span style={{ color: '#E879F9', fontFamily: 'monospace', fontWeight: 700 }}>
                        {evt.log_id}
                      </span>
                      <span style={{ color: '#E2D9F3' }}>{evt.event}</span>
                    </div>
                  ))}
                  {(!currentSession?.analysis?.timeline || currentSession.analysis.timeline.length === 0) && (
                    <div style={{ fontSize: '12px', color: '#A098B5' }}>No timeline events logged in session.</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Publication-Ready Markdown (.md) */}
          {activeTab === 'markdown' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ fontSize: '12px', color: '#A098B5' }}>
                You can directly edit this markdown report before exporting or publishing to documentation (Confluence, Notion, GitHub):
              </div>
              <textarea
                value={markdown}
                onChange={(e) => setMarkdown(e.target.value)}
                rows={18}
                style={{
                  width: '100%',
                  background: '#07050A',
                  border: '1px solid rgba(199, 125, 255, 0.3)',
                  borderRadius: '10px',
                  padding: '16px',
                  color: '#C77DFF',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  lineHeight: '1.6',
                  whiteSpace: 'pre-wrap',
                }}
              />
            </div>
          )}

          {/* TAB 3: Action Items */}
          {activeTab === 'actions' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ fontSize: '12px', color: '#A098B5' }}>
                Track preventative and corrective guardrails to prevent this incident from recurring:
              </div>

              {actionItems.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    background: '#090710',
                    border: '1px solid rgba(52, 211, 153, 0.3)',
                    borderRadius: '12px',
                    padding: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#34D399' }}>
                      {item.title}
                    </span>
                    <span
                      style={{
                        fontSize: '10px',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: item.type === 'IMMEDIATE' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(52, 211, 153, 0.15)',
                        color: item.type === 'IMMEDIATE' ? '#F87171' : '#34D399',
                        fontWeight: 700,
                      }}
                    >
                      {item.type}
                    </span>
                  </div>

                  <p style={{ margin: 0, fontSize: '12px', color: '#E2D9F3' }}>
                    {item.description}
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#A098B5' }}>
                    <span>Owner: <b>{item.owner || 'SRE Team'}</b></span>
                    <span>Status: <b style={{ color: '#34D399' }}>{item.status}</b></span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
