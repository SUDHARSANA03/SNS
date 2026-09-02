import React, { useState, useEffect } from 'react'
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom'
import TopBar from './components/TopBar'
import StatusBar from './components/StatusBar'
import { LandingPage } from './pages/Landing/LandingPage'
import { LoginPage } from './pages/Auth/LoginPage'
import LiveFeed from './components/LiveFeed'
import Detection from './components/Detection'
import ModelGuard from './components/ModelGuard'
import Timechain from './components/Timechain'
import Profile from './components/Profile'
import ProcessVisualizer from './components/ProcessVisualizer'
import LogInputModal from './components/LogInputModal'
import { NAV_ITEMS, ViewId } from './data'
import { SessionProvider } from './context/SessionContext'
import { AuthProvider } from './context/AuthContext'

function ConsoleWorkspace() {
  const navigate = useNavigate()
  const location = useLocation()
  const initialView = ((location.state as any)?.view as ViewId) || 'feed'
  const [activeView, setActiveView] = useState<ViewId>(initialView)

  useEffect(() => {
    if ((location.state as any)?.view) {
      setActiveView((location.state as any).view)
    }
  }, [location.state])

  const pillLabel = NAV_ITEMS.find((n) => n.view === activeView)?.label ?? 'Explore'

  const openView = (view: ViewId) => {
    setActiveView(view)
    setTimeout(() => {
      const item = document.querySelector(`.accordion-item[data-view="${view}"]`)
      if (item) {
        const y = item.getBoundingClientRect().top + window.scrollY - 104
        window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' })
      }
    }, 50)
  }

  const goHome = () => {
    navigate('/')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div style={{ width: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <TopBar activeView={activeView} pillLabel={pillLabel} onSelect={openView} onHome={goHome} />
      <StatusBar />
      <main style={{ flex: 1, position: 'relative', width: '100%' }}>
        <div className="accordion view-shell visible" id="accordion">
          {NAV_ITEMS.map((item) => (
            <div
              key={item.view}
              className={'accordion-item' + (activeView === item.view ? ' open' : '')}
              data-view={item.view}
            >
              <div className="accordion-body">
                <div className="accordion-body-inner">{activeView === item.view && <ViewFor view={item.view} />}</div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Global Interactive Overlays */}
      <ProcessVisualizer />
      <LogInputModal />
    </div>
  )
}

function AppContent() {
  const navigate = useNavigate()

  const handleNext = (view?: string) => {
    const targetView = (view as ViewId) || 'feed'
    navigate('/console', { state: { view: targetView } })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <Routes>
      <Route path="/" element={<LandingPage onNext={handleNext} />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<Navigate to="/login?mode=signup" replace />} />
      <Route path="/profile" element={<Navigate to="/console" state={{ view: 'profile' }} replace />} />
      <Route path="/console" element={<ConsoleWorkspace />} />
      <Route path="/app" element={<ConsoleWorkspace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <SessionProvider>
        <AppContent />
      </SessionProvider>
    </AuthProvider>
  )
}

function ViewFor({ view }: { view: ViewId }) {
  switch (view) {
    case 'feed':
      return <LiveFeed />
    case 'detect':
      return <Detection />
    case 'guard':
      return <ModelGuard />
    case 'chain':
      return <Timechain />
    case 'profile':
      return <Profile />
  }
}
