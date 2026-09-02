import React, { useEffect, useRef, useState } from 'react'
import { NAV_ITEMS, ViewId } from '../data'
import { useSession } from '../context/SessionContext'

interface Props {
  activeView: ViewId | null
  pillLabel: string
  onSelect: (view: ViewId) => void
  onHome: () => void
}

export default function TopBar({ activeView, pillLabel, onSelect, onHome }: Props) {
  const [scrolled, setScrolled] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  const { backendConnected, currentSession, openLogModal, user, openAuthModal, logoutUser } = useSession()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!wrapRef.current) return
      if (!wrapRef.current.contains(e.target as Node)) setDropdownOpen(false)
    }
    document.addEventListener('click', onDocClick)
    return () => document.removeEventListener('click', onDocClick)
  }, [])

  const select = (view: ViewId) => {
    setDropdownOpen(false)
    onSelect(view)
  }

  return (
    <div className={'topbar-wrap' + (scrolled ? ' scrolled' : '')} id="topbarWrap">
      <div className="topbar">
        <div
          className="brand"
          role="button"
          tabIndex={0}
          aria-label="Go to Incident AI home page"
          onClick={onHome}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              onHome()
            }
          }}
        >
          <span className="mark"></span>
          <b>INCIDENT AI</b>
          <span className={`backend-badge ${backendConnected ? 'connected' : 'offline'}`}>
            <span className="mini-pulse"></span>
            {backendConnected ? 'API OK' : 'LOCAL'}
          </span>
        </div>

        <nav>
          {NAV_ITEMS.map((item) => (
            <button
              key={item.view}
              className={activeView === item.view ? 'active' : ''}
              onClick={() => select(item.view)}
            >
              <span className="nav-num">{item.num}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="topbar-right-actions">
          {user ? (
            <button
              className="topbar-upload-btn"
              onClick={logoutUser}
              title="Click to log out"
              style={{
                background: 'rgba(199, 125, 255, 0.15)',
                borderColor: 'rgba(199, 125, 255, 0.4)',
                color: '#fff',
                fontSize: '11px',
              }}
            >
              <span>👤 {user.name.split(' ')[0]} (Exit)</span>
            </button>
          ) : (
            <button
              className="topbar-upload-btn"
              onClick={() => openAuthModal('login')}
              style={{
                background: 'rgba(199, 125, 255, 0.15)',
                borderColor: 'rgba(199, 125, 255, 0.5)',
                color: '#E879F9',
                fontWeight: 700,
              }}
            >
              <span>🔒 Log In</span>
            </button>
          )}

          <button 
            className="topbar-upload-btn" 
            onClick={onHome}
            style={{ 
              background: 'rgba(255, 255, 255, 0.05)', 
              borderColor: 'rgba(255, 255, 255, 0.15)', 
              color: '#B9AFCB',
            }}
          >
            <span>Landing</span>
          </button>

          <button className="topbar-upload-btn" onClick={() => openLogModal('upload')}>
            <span>📥 Ingest Log</span>
          </button>

          <div
            className={'section-pill' + (dropdownOpen ? ' open' : '')}
            id="sectionPill"
            ref={wrapRef}
            onClick={(e) => {
              e.stopPropagation()
              setDropdownOpen((o) => !o)
            }}
          >
            <span id="sectionPillText" key={pillLabel}>
              {pillLabel}
            </span>
            <span className="pill-plus">+</span>
            <div className={'nav-dropdown' + (dropdownOpen ? ' open' : '')} id="navDropdown">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.view}
                  className={activeView === item.view ? 'active' : ''}
                  onClick={(e) => {
                    e.stopPropagation()
                    select(item.view)
                  }}
                >
                  <span className="drop-num">{item.num}</span>
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
