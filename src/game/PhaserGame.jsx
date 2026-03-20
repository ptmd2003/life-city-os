import { useEffect, useRef, useState } from 'react'
import Phaser from 'phaser'
import CityScene from './scenes/CityScene'
import { useCityStore } from '../stores/useCityStore'

export default function PhaserGame() {
  const containerRef = useRef(null)
  const gameRef = useRef(null)
  const setPhaserGame = useCityStore((s) => s.setPhaserGame)
  const hydrated = useCityStore((s) => s._hydrated)
  const [isHydrated, setIsHydrated] = useState(false)

  // Wait for store to be hydrated before creating game
  // ✅ Wait for store hydration before creating Phaser scene
  useEffect(() => {
    if (hydrated) {
      console.log('✅ [PhaserGame] Hydration complete, ready to create game')
      setIsHydrated(true)
      return
    }

    // Poll for hydration (up to 2 seconds)
    console.log('⏳ [PhaserGame] Waiting for store hydration...')
    let attempts = 0
    const poll = setInterval(() => {
      attempts++
      const state = useCityStore.getState()
      if (state._hydrated) {
        console.log(`✅ [PhaserGame] Hydration complete (${attempts * 50}ms)`)
        setIsHydrated(true)
        clearInterval(poll)
      } else if (attempts > 40) {
        // Timeout: proceed anyway after 2 seconds
        console.warn('⚠️  [PhaserGame] Hydration timeout, proceeding anyway')
        setIsHydrated(true)
        clearInterval(poll)
      }
    }, 50)

    return () => clearInterval(poll)
  }, [hydrated])

  useEffect(() => {
    if (!isHydrated) {
      console.log('⏳ [PhaserGame] Waiting for store hydration...')
      return
    }

    if (gameRef.current) return

    console.log('🎮 [PhaserGame] Creating Phaser game')
    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: 'game-container',
      width: containerRef.current.offsetWidth,
      height: window.innerHeight,
      backgroundColor: '#1a1a2e',
      scene: [CityScene],
      scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH },
    })

    gameRef.current = game
    setPhaserGame(game)

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true)
        gameRef.current = null
      }
    }
  }, [isHydrated, setPhaserGame])

  return <div ref={containerRef} id="game-container" style={{ flex: 1 }} />
}
