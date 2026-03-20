import './App.css'
import { useEffect, useState } from 'react'
import PhaserGame from './game/PhaserGame'
import Sidebar from './components/Sidebar'
import { TransformPanel } from './components/TransformPanel'

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
    <div style={{ display: 'flex', width: '100vw', height: '100vh' }}>
      <TransformPanel />
      <PhaserGame />
      <Sidebar />
    </div>
  )
}

export default App
