import React, { useState } from 'react'
import { useSession } from '../context/SessionContext'
import { useAuth } from '../context/AuthContext'
import { Bookmark, Check, ShieldAlert, FileText } from 'lucide-react'
import RCADraftModal from './RCADraftModal'

export default function ModelGuard() {
  const { currentSession, openLogModal } = useSession()
  const { saveError, isErrorSaved } = useAuth()
  const [savingId, setSavingId] = useState<string | null>(null)
  const [isRcaModalOpen, setIsRcaModalOpen] = useState(false)

  const analysis = currentSession?.analysis
  const rootCauses = analysis?.root_cause_analysis || []
  const recommendations = analysis?.recommendations || []
  const summary = analysis?.summary

  // Compute grounding metrics dynamically from real LLM response
  const avgConfidence =
    rootCauses.length > 0
      ? Math.round((rootCauses.reduce((acc, c) => acc + (c.confidence || 0.8), 0) / rootCauses.length) * 100)
      : 90

  const allEvidenceIds = Array.from(new Set(rootCauses.flatMap((c) => c.evidence_log_ids || [])))
  const factsCount = rootCauses.filter((c) => c.type === 'fact').length
  const hypothesesCount = rootCauses.filter((c) => c.type !== 'fact').length

  const handleSaveRootCause = async (rc: (typeof rootCauses)[0], idx: number) => {
    const targetLogId = rc.evidence_log_ids?.[0] || `rc_${idx + 1}`
    setSavingId(targetLogId)
    try {
      await saveError({
        log_id: targetLogId,
        error_level: rc.type === 'fact' ? 'CRITICAL' : 'ERROR',
        message: rc.cause,
        summary: summary,
        root_cause: rc.reasoning,
        session_id: currentSession?.session_id,
      })
    } finally {
      setSavingId(null)
    }
  }

  const handleSaveSummaryError = async () => {
    const primaryLogId = allEvidenceIds[0] || currentSession?.errors?.[0]?.log_id || 'incident_summary'
    setSavingId('summary_save')
    try {
      await saveError({
        log_id: primaryLogId,
        error_level: 'CRITICAL',
        message: currentSession?.errors?.[0]?.message || (summary ? summary.slice(0, 150) : 'System Error Signal'),
        summary: summary,
        root_cause: rootCauses[0]?.cause,
        session_id: currentSession?.session_id,
      })
    } finally {
      setSavingId(null)
    }
  }

  const isSummarySaved = allEvidenceIds[0]
    ? isErrorSaved(allEvidenceIds[0], currentSession?.session_id)
    : false

  return (
    <section className="view" id="view-guard">
      <div className="view-header-row">
        <div>
          <h1>
            <span className="reveal">AI Model Guard & Synthesis</span>
          </h1>
          <p className="view-sub">
            {currentSession
              ? `NVIDIA Nemotron LLM root cause analysis, evidence calibration, and mitigation recommendations.`
              : 'No active analysis. Ingest logs to trigger LLM root cause reasoning and evidence grounding.'}
          </p>
        </div>
        <div className="view-header-actions">
          <button className="btn primary" onClick={() => openLogModal('upload')}>
            📥 Ingest Log File
          </button>
        </div>
      </div>

      {!analysis || rootCauses.length === 0 ? (
        <div className="empty-state-panel reveal-up in-view">
          <div className="empty-icon">🧠</div>
          <h3>No AI Model Reasoning Available</h3>
          <p>
            {summary ||
              'Run an AI analysis on a log file to extract root causes, model confidence, and actionable debugging recommendations.'}
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
        <div className="guard-grid">
          {/* Left Panel: Grounding Metrics & AI Summary */}
          <div className="guard-panel reveal-up in-view">
            <div className="guard-summary-box">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div className="guard-summary-kicker">EXECUTIVE INCIDENT SUMMARY</div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setIsRcaModalOpen(true)}
                    className="btn sm primary glow"
                    style={{
                      padding: '4px 12px',
                      fontSize: '11px',
                      borderRadius: '8px',
                      background: 'linear-gradient(90deg, #C77DFF, #9D4EDD)',
                      color: '#000',
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    <FileText size={12} />
                    <span>Generate RCA Draft</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveSummaryError}
                    className="btn sm"
                    style={{
                      padding: '4px 10px',
                      fontSize: '11px',
                      borderRadius: '8px',
                      background: isSummarySaved ? 'rgba(52, 211, 153, 0.15)' : 'rgba(199, 125, 255, 0.18)',
                      borderColor: isSummarySaved ? '#34D399' : '#C77DFF',
                      color: isSummarySaved ? '#34D399' : '#C77DFF',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    {isSummarySaved ? (
                      <>
                        <Check size={12} />
                        <span>Saved to Profile</span>
                      </>
                    ) : savingId === 'summary_save' ? (
                      <span>Saving...</span>
                    ) : (
                      <>
                        <Bookmark size={12} />
                        <span>Save Error to Profile</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
              <p className="guard-summary-text">{summary}</p>
            </div>

            <div className="guard-metric">
              <div className="guard-metric-top">
                <span className="label">Mean Model Confidence</span>
                <span className="val">{avgConfidence}%</span>
              </div>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: `${avgConfidence}%` }}></div>
              </div>
            </div>

            <div className="guard-metric">
              <div className="guard-metric-top">
                <span className="label">Grounded Log Evidence References</span>
                <span className="val" style={{ color: 'var(--ok)' }}>
                  {allEvidenceIds.length} Log Entries Cited
                </span>
              </div>
              <div className="bar-track">
                <div
                  className="bar-fill"
                  style={{ width: `${Math.min(100, allEvidenceIds.length * 25)}%`, background: 'var(--ok)' }}
                ></div>
              </div>
            </div>

            <div className="guard-metric">
              <div className="guard-metric-top">
                <span className="label">Facts vs Hypotheses Breakdown</span>
                <span className="val" style={{ color: 'var(--text)' }}>
                  {factsCount} Fact{factsCount !== 1 ? 's' : ''} · {hypothesesCount} Hypothes
                  {hypothesesCount !== 1 ? 'es' : 'is'}
                </span>
              </div>
              <div className="bar-track">
                <div
                  className="bar-fill"
                  style={{
                    width: `${Math.round((factsCount / Math.max(1, rootCauses.length)) * 100)}%`,
                    background: 'linear-gradient(90deg, #34D399, #C77DFF)',
                  }}
                ></div>
              </div>
            </div>

            {/* AI Recommendations */}
            {recommendations.length > 0 && (
              <div className="recommendations-box">
                <div className="guard-summary-kicker">SUGGESTED MITIGATION STEPS</div>
                <ul className="rec-list">
                  {recommendations.map((rec, i) => (
                    <li key={i} className="rec-item">
                      <span className="rec-num">0{i + 1}</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Right Panel: Root Cause Analysis Cards */}
          <div className="guard-panel reveal-up in-view">
            <div className="guard-summary-kicker" style={{ marginBottom: '14px' }}>
              IDENTIFIED ROOT CAUSES ({rootCauses.length})
            </div>

            <div className="root-cause-cards-list">
              {rootCauses.map((rc, idx) => {
                const targetLogId = rc.evidence_log_ids?.[0] || `rc_${idx + 1}`
                const isSaved = isErrorSaved(targetLogId, currentSession?.session_id)
                const isSavingThis = savingId === targetLogId

                return (
                  <div className="hyp-card" key={idx}>
                    <div className="hyp-top-bar">
                      <span className="hyp-label">ROOT CAUSE #{idx + 1}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className={`hyp-status ${rc.type === 'fact' ? 'fact' : 'hypothesis'}`}>
                          {rc.type === 'fact' ? '✓ FACT (VERIFIED)' : '⚡ HYPOTHESIS'}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleSaveRootCause(rc, idx)}
                          className="btn sm"
                          style={{
                            padding: '3px 8px',
                            fontSize: '10px',
                            borderRadius: '6px',
                            background: isSaved ? 'rgba(52, 211, 153, 0.15)' : 'rgba(199, 125, 255, 0.15)',
                            borderColor: isSaved ? '#34D399' : '#C77DFF',
                            color: isSaved ? '#34D399' : '#C77DFF',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          {isSaved ? <Check size={11} /> : <Bookmark size={11} />}
                          <span>{isSaved ? 'Saved' : 'Save to Profile'}</span>
                        </button>
                      </div>
                    </div>

                    <div className="hyp-text">{rc.cause}</div>

                    <div className="hyp-stats">
                      <div className="metric">
                        <span className="label">Confidence</span>
                        <span className="value" style={{ color: 'var(--ai)' }}>
                          {Math.round((rc.confidence || 0.8) * 100)}%
                        </span>
                      </div>
                      <div className="metric">
                        <span className="label">Evidence Log IDs</span>
                        <span className="value">
                          {rc.evidence_log_ids?.length > 0 ? rc.evidence_log_ids.join(', ') : 'Inferred from context'}
                        </span>
                      </div>
                    </div>

                    <div className="hyp-reasoning">
                      <b>LLM Reasoning:</b> {rc.reasoning}
                    </div>

                    {rc.evidence_log_ids?.length > 0 && (
                      <div className="evidence-tags-row">
                        {rc.evidence_log_ids.map((id) => (
                          <span key={id} className="evidence-tag">
                            Evidence: {id}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Persistent Incident Record & RCA Draft Modal */}
      <RCADraftModal
        isOpen={isRcaModalOpen}
        onClose={() => setIsRcaModalOpen(false)}
      />
    </section>
  )
}
