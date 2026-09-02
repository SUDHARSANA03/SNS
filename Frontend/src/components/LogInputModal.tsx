import React, { useState, useRef } from 'react'
import { useSession } from '../context/SessionContext'
import { SAMPLE_LOGS } from '../data/sampleLogs'

export default function LogInputModal() {
  const {
    isLogModalOpen,
    activeModalTab,
    openLogModal,
    closeLogModal,
    analyzeFile,
    analyzeText,
    loadSampleScenario,
  } = useSession()

  const [dragOver, setDragOver] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [pastedText, setPastedText] = useState('')
  const [customFileName, setCustomFileName] = useState('custom-service.log')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!isLogModalOpen) return null

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0])
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0]
      if (file.name.endsWith('.log') || file.name.endsWith('.txt')) {
        setSelectedFile(file)
      } else {
        alert('Please upload a .log or .txt file')
      }
    }
  }

  const handleFileSubmit = async () => {
    if (!selectedFile) return
    setIsSubmitting(true)
    try {
      await analyzeFile(selectedFile)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleTextSubmit = async () => {
    if (!pastedText.trim()) return
    setIsSubmitting(true)
    try {
      await analyzeText(pastedText, customFileName || 'custom-app.log')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSampleClick = async (id: string) => {
    setIsSubmitting(true)
    try {
      await loadSampleScenario(id)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="process-overlay">
      <div className="log-modal reveal-up in-view">
        <div className="modal-top">
          <div className="modal-title-wrap">
            <span className="modal-kicker">INGESTION HUB</span>
            <h2>Provide Log Input for Analysis</h2>
            <p className="modal-desc">
              Feed raw server logs into the backend parser & NVIDIA Nemotron AI reasoning engine.
            </p>
          </div>
          <button className="process-close" onClick={closeLogModal} aria-label="Close modal">
            ✕
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="modal-tabs">
          <button
            className={`modal-tab ${activeModalTab === 'upload' ? 'active' : ''}`}
            onClick={() => openLogModal('upload')}
          >
            📁 Upload Log File (.log / .txt)
          </button>
          <button
            className={`modal-tab ${activeModalTab === 'paste' ? 'active' : ''}`}
            onClick={() => openLogModal('paste')}
          >
            📋 Paste Raw Log Text
          </button>
          <button
            className={`modal-tab ${activeModalTab === 'samples' ? 'active' : ''}`}
            onClick={() => openLogModal('samples')}
          >
            ⚡ Sample Incident Presets
          </button>
        </div>

        {/* Tab 1: File Upload */}
        {activeModalTab === 'upload' && (
          <div className="tab-content">
            <div
              className={`dropzone ${dragOver ? 'drag-over' : ''} ${selectedFile ? 'has-file' : ''}`}
              onDragOver={(e) => {
                e.preventDefault()
                setDragOver(true)
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept=".log,.txt,text/plain"
                onChange={handleFileChange}
              />
              <div className="dropzone-icon">📥</div>
              {selectedFile ? (
                <div className="file-info-box">
                  <div className="file-name"><b>{selectedFile.name}</b></div>
                  <div className="file-meta">
                    {(selectedFile.size / 1024).toFixed(1)} KB · Ready for backend pipeline
                  </div>
                  <span className="change-hint">Click or drop another file to replace</span>
                </div>
              ) : (
                <div className="dropzone-prompt">
                  <h4>Drag & Drop your .log or .txt file here</h4>
                  <p>or click to browse your local filesystem</p>
                  <span className="dropzone-badge">UTF-8 Encoded · Server, App, or Container logs</span>
                </div>
              )}
            </div>

            <div className="modal-actions">
              <button className="btn" onClick={closeLogModal}>
                Cancel
              </button>
              <button
                className="btn primary glow"
                disabled={!selectedFile || isSubmitting}
                onClick={handleFileSubmit}
              >
                {isSubmitting ? 'Starting Process...' : 'Run AI Analysis →'}
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Raw Text Editor */}
        {activeModalTab === 'paste' && (
          <div className="tab-content">
            <div className="paste-meta-bar">
              <input
                className="custom-file-input"
                placeholder="File name (e.g. error.log)"
                value={customFileName}
                onChange={(e) => setCustomFileName(e.target.value)}
              />
              <div className="paste-stats">
                {pastedText ? `${pastedText.split('\n').length} lines · ${pastedText.length} chars` : 'Empty editor'}
              </div>
            </div>
            <textarea
              className="log-textarea"
              placeholder={`Paste your server or application logs here...

Example:
2026-09-02T10:30:15.654Z [ERROR] [payment-api] Connection timeout acquiring DB handle
2026-09-02T10:30:18.902Z [ERROR] [payment-api] Failed to execute query: connection pool exhausted`}
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              rows={12}
            />

            <div className="modal-actions">
              <button className="btn" onClick={() => setPastedText('')}>
                Clear
              </button>
              <button
                className="btn primary glow"
                disabled={!pastedText.trim() || isSubmitting}
                onClick={handleTextSubmit}
              >
                {isSubmitting ? 'Starting Process...' : 'Run AI Analysis →'}
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: Sample Presets */}
        {activeModalTab === 'samples' && (
          <div className="tab-content">
            <div className="samples-grid">
              {SAMPLE_LOGS.map((sample) => (
                <div key={sample.id} className="sample-card">
                  <div className="sample-card-top">
                    <span className="sample-cat">{sample.category}</span>
                    <span className="sample-file">{sample.fileName}</span>
                  </div>
                  <h3>{sample.title}</h3>
                  <p>{sample.description}</p>
                  <button
                    className="btn primary sm"
                    disabled={isSubmitting}
                    onClick={() => handleSampleClick(sample.id)}
                  >
                    Load & Analyze Scenario →
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
