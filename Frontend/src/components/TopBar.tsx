import React, { useEffect, useState } from 'react'
import { NAV_ITEMS, ViewId } from '../data'

interface Props {
  activeView: ViewId | null
  pillLabel: string
  onSelect: (view: ViewId) => void
  onHome: () => void
}

export default function TopBar({ activeView, onSelect, onHome }: Props) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

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
          <span className="badge">NVIDIA AI</span>
        </div>

        <nav>
          {NAV_ITEMS.map((item) => (
            <button
              key={item.view}
              className={activeView === item.view ? 'active' : ''}
              onClick={() => onSelect(item.view)}
            >
              <span className="nav-num">{item.num}</span>
              {item.label}
            </button>
          ))}
        </nav>
      </div>
    </div>
  )
}
