import './App.css'
import { useEffect, useState } from 'react'
import ErrorBoundary from './components/ErrorBoundary'
import PhaserGame from './game/PhaserGame'
import LifeOSSidebar from './components/LifeOSSidebar'
import { TransformPanel } from './components/TransformPanel'
import { TransformBar } from './components/TransformBar'

function App() {
  const [appReady, setAppReady] = useState(false)

  useEffect(() => {
    // ✅ Wait for Zustand persist middleware to hydrate automatically
    // Middleware reads localStorage in onRehydrateStorage callback
    console.group('🚀 [App Init]')
    console.log('   Waiting for Zustand persist middleware...')
    
    // Set ready flag — hydration will be complete via middleware
    // Delay setState to next tick to avoid cascading renders
    setTimeout(() => setAppReady(true), 0)
    console.groupEnd()
  }, [])

  // Don't render until hydration is complete
  if (!appReady) {
    return <div style={{ width: '100vw', height: '100vh', background: '#1a1a2e' }} />
  }

  return (
    <>
      <div style={{ display: 'flex', width: '100vw', height: '100vh' }}>
        <ErrorBoundary name="TransformPanel">
          <TransformPanel />
        </ErrorBoundary>
        <ErrorBoundary name="GameView">
          <PhaserGame />
        </ErrorBoundary>
        <ErrorBoundary name="LifeOSSidebar">
          <LifeOSSidebar />
        </ErrorBoundary>
      </div>
      {/* Transform Bar — Bottom dock-style controls */}
      <ErrorBoundary name="TransformBar">
        <TransformBar />
      </ErrorBoundary>
    </>
  )
}

export default App
