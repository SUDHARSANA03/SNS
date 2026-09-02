import React, { useState } from 'react'
import MarqueeBar from './components/MarqueeBar'
import TopBar from './components/TopBar'
import StatusBar from './components/StatusBar'
import Landing from './components/Landing'
import LiveFeed from './components/LiveFeed'
import Detection from './components/Detection'
import ModelGuard from './components/ModelGuard'
import Timechain from './components/Timechain'
import Profile from './components/Profile'
import ProcessVisualizer from './components/ProcessVisualizer'
import LogInputModal from './components/LogInputModal'
import { NAV_ITEMS, ViewId } from './data'
import { SessionProvider } from './context/SessionContext'

function AppContent() {
  const [activeView, setActiveView] = useState<ViewId | null>(null)
  const [hasOpenedModule, setHasOpenedModule] = useState(false)
  const [landingExiting, setLandingExiting] = useState(false)
  const [landingHidden, setLandingHidden] = useState(false)
  const [shellVisible, setShellVisible] = useState(false)

  const pillLabel = activeView ? NAV_ITEMS.find((n) => n.view === activeView)?.label ?? 'Explore' : 'Explore'

  const openView = (view: ViewId) => {
    setActiveView(view)

    if (!hasOpenedModule) {
      setHasOpenedModule(true)
      setLandingExiting(true)
      setTimeout(() => {
        setLandingHidden(true)
        setShellVisible(true)
        setTimeout(() => {
          const item = document.querySelector(`.accordion-item[data-view="${view}"]`)
          if (item) {
            const y = item.getBoundingClientRect().top + window.scrollY - 104
            window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' })
          }
        }, 0)
      }, 430)
    } else {
      setTimeout(() => {
        const item = document.querySelector(`.accordion-item[data-view="${view}"]`)
        if (item) {
          const y = item.getBoundingClientRect().top + window.scrollY - 104
          window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' })
        }
      }, 0)
    }
  }

  const goHome = () => {
    setHasOpenedModule(false)
    setActiveView(null)
    setShellVisible(false)
    setLandingExiting(false)
    setLandingHidden(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <>
      <MarqueeBar />
      <TopBar activeView={activeView} pillLabel={pillLabel} onSelect={openView} onHome={goHome} />
      <StatusBar />
      <main>
        <Landing exiting={landingExiting} hidden={landingHidden} onOpen={openView} />

        <div className={'accordion view-shell' + (shellVisible ? ' visible' : '')} id="accordion">
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
    </>
  )
}

export default function App() {
  return (
    <SessionProvider>
      <AppContent />
    </SessionProvider>
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
