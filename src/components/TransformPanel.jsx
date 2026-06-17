import { useCityStore } from '../stores/useCityStore'
import { useState, useEffect, useRef } from 'react'
import { ASSET_REGISTRY, getAllZones } from '../game/sprites/assetRegistry.js'
import { assetManifest } from '../game/preloadAssets.js'
import { colors } from '../theme/colors.js'
import '../styles/TransformPanel.css'

// ─── Tile categories based on color analysis of tile_000–tile_114 ───────────
const TILE_CATEGORIES = {
  'Earth': {
    tiles: Array.from({length: 22}, (_, i) => i),           // 000–021
    color: '#9B6B5A', emoji: '🟤', desc: 'dirt & earth'
  },
  'Grass': {
    tiles: Array.from({length: 19}, (_, i) => i + 22),      // 022–040
    color: '#7CB87A', emoji: '🌿', desc: 'grass & meadow'
  },
  'Path': {
    tiles: Array.from({length: 20}, (_, i) => i + 41),      // 041–060
    color: '#C4A882', emoji: '🪨', desc: 'paths & decorative'
  },
  'Water': {
    tiles: Array.from({length: 25}, (_, i) => i + 61),      // 061–085
    color: '#6B9EB8', emoji: '💧', desc: 'water & ponds'
  },
  'Deep Water': {
    tiles: Array.from({length: 18}, (_, i) => i + 86),      // 086–103
    color: '#2D5F80', emoji: '🌊', desc: 'deep water & ocean'
  },
  'Shallow': {
    tiles: Array.from({length: 11}, (_, i) => i + 104),     // 104–114
    color: '#8BC4D8', emoji: '🏖️', desc: 'shallow & shore'
  },
}

// Map tile index → category color for mini-map
function getTileColor(tileKey) {
  if (!tileKey) return '#C8DFC8'
  const idx = parseInt(tileKey.replace('tile_', ''), 10)
  if (idx <= 21) return '#9B6B5A'
  if (idx <= 40) return '#7CB87A'
  if (idx <= 60) return '#C4A882'
  if (idx <= 85) return '#6B9EB8'
  if (idx <= 103) return '#2D5F80'
  return '#8BC4D8'
}

export function TransformPanel() {
  const {
    cityLayout,
    selectedBuilding,
    transformMode,
    transformValue,
    setSelectedBuilding,
    setTransformMode,
    setTransformValue,
    deselectBuilding,
    phaserGame,
    saveLayout,
    layoutVersions,
    revertToVersion,
    showStoragePanel,
    setShowStoragePanel,
    addSpriteToLayout,
    toggleBuildingLock,
    groundPaintMode,
    setGroundPaintMode,
    selectedGroundTile,
    setSelectedGroundTile,
    floodFillMode,
    setFloodFillMode,
    buildMode,
  } = useCityStore()

  const [showSaveConfirm, setShowSaveConfirm] = useState(false)
  const [showNotePrompt, setShowNotePrompt] = useState(false)
  const [noteInput, setNoteInput] = useState('')
  const [selectedZone, setSelectedZone] = useState('dojo')
  const [tileCategory, setTileCategory] = useState('Grass')
  const miniMapRef = useRef(null)

  // Draw mini-map whenever groundLayout changes
  const groundLayout = useCityStore(s => s.groundLayout)
  useEffect(() => {
    const canvas = miniMapRef.current
    if (!canvas || !groundPaintMode) return
    const ctx = canvas.getContext('2d')
    const COLS = 36, ROWS = 36
    const CW = canvas.width / COLS
    const CH = canvas.height / ROWS
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const key = groundLayout[y * COLS + x] || 'tile_037'
        ctx.fillStyle = getTileColor(key)
        ctx.fillRect(x * CW, y * CH, CW - 0.5, CH - 0.5)
      }
    }
  }, [groundLayout, groundPaintMode])

  // Get object name/id for display
  const getObjectName = (obj) => {
    return obj.id || obj.key || `${obj.type}-${obj.x},${obj.y}`
  }

  // ✅ Compare objects by their position (unique identifier for placed buildings)
  // selectedBuilding stores tileX/Y as floats, layout can also have floats now
  const isObjectSelected = (obj) => {
    if (!selectedBuilding) return false
    return Math.abs(selectedBuilding.tileX - obj.x) < 0.01 && 
           Math.abs(selectedBuilding.tileY - obj.y) < 0.01
  }

  // Handle close button
  const handleClose = () => {
    deselectBuilding()
  }

  // Handle manual save layout with note prompt
  const handleSaveLayout = () => {
    console.log('💾 [SAVE LAYOUT] Showing note prompt')
    setNoteInput('')
    setShowNotePrompt(true)
  }

  const handleConfirmSave = () => {
    console.group('💾 [SAVE LAYOUT] User confirmed save')
    const state = useCityStore.getState()
    console.log('   cityLayout length:', state.cityLayout.length)
    console.log('   Note:', noteInput)
    
    saveLayout(noteInput)
    
    console.log('   Saved to localStorage')
    const verify = localStorage.getItem('life-city-os-save')
    if (verify) {
      const parsed = JSON.parse(verify)
      console.log('   ✅ Verified: localStorage key "life-city-os-save" has', parsed.cityLayout?.length, 'objects')
    } else {
      console.warn('   ❌ ISSUE: localStorage key not found after save!')
    }
    console.groupEnd()
    
    setShowNotePrompt(false)
    setNoteInput('')
    setShowSaveConfirm(true)
    setTimeout(() => setShowSaveConfirm(false), 2000)
  }

  const handleRevertVersion = (versionId) => {
    console.log(`⏮️ [REVERT] Reverting to version ${versionId}`)
    revertToVersion(versionId)
    setShowSaveConfirm(true)
    setTimeout(() => setShowSaveConfirm(false), 2000)
  }

  // Handle add sprite from storage
  const handleAddSprite = (assetKey) => {
    console.log(`➕ [addSprite] Adding ${assetKey} to canvas`)
    addSpriteToLayout(assetKey)
    setShowSaveConfirm(true)
    setTimeout(() => setShowSaveConfirm(false), 2000)
  }

  // Get all zones for filter
  const zones = getAllZones()

  // Get sprites for selected zone
  const spritesInZone = Object.entries(ASSET_REGISTRY)
    .filter(([, entry]) => entry.zone === selectedZone && entry.label)
    .map(([key, entry]) => ({ key, ...entry }))

  // Get image path for sprite using asset manifest
  const getSpriteImagePath = (assetKey) => {
    // Find the path in assetManifest that matches this asset key
    const matchedPath = assetManifest.find(path => {
      // Extract the filename from path: 'src/assets/zone/type/filename.png'
      const filename = path.split('/').pop().replace('.png', '')
      return filename === assetKey
    })

    if (matchedPath) {
      // Properly encode the URL to handle special characters and spaces
      return encodeURI(`/${matchedPath}`)
    }

    // Asset not found in manifest — don't show it
    console.warn(`⚠️  Asset ${assetKey} not found in manifest, hiding from UI`)
    return null
  }

  // Get tile image path from manifest
  const getTileImagePath = (tileKey) => {
    const matchedPath = assetManifest.find(path => {
      const filename = path.split('/').pop().replace('.png', '')
      return filename === tileKey
    })
    return matchedPath ? encodeURI(`/${matchedPath}`) : null
  }

  // Flood fill is handled directly in CityScene pointerdown — no React handler needed

  return (
    <div className="transform-panel">
      <div className="panel-header">
        <h2>🎮 {groundPaintMode ? '🌍 Ground' : showStoragePanel ? '🏪 Storage' : 'Transform'}</h2>
        <div className="header-buttons">
          <button
            className={`storage-toggle-btn ${groundPaintMode ? 'active' : ''}`}
            onClick={() => {
              setGroundPaintMode(true)
              setShowStoragePanel(false)
            }}
            title="Toggle ground painting mode"
          >
            🌍
          </button>
          <button
            className={`storage-toggle-btn ${showStoragePanel ? 'active' : ''}`}
            onClick={() => {
              setShowStoragePanel(true)
              setGroundPaintMode(false)
            }}
            title="Toggle storage view"
          >
            🏪
          </button>
          {selectedBuilding && !showStoragePanel && !groundPaintMode && buildMode && (
            <button className="close-btn" onClick={handleClose}>×</button>
          )}
        </div>
      </div>

      {/* Ground Painting View */}
      {groundPaintMode && (
        <div className="ground-view">

          {/* Mini-map */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 10, color: 'var(--mossy-shadow)', fontWeight: 600 }}>MAP OVERVIEW</span>
            <canvas
              ref={miniMapRef}
              width={288} height={288}
              style={{
                width: '100%', borderRadius: 6,
                border: '1px solid var(--wa-sage)',
                imageRendering: 'pixelated', cursor: 'crosshair',
              }}
              title="Click on map to jump to area"
            />
          </div>

          {/* Tools row */}
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={{ fontSize: 10, color: 'var(--mossy-shadow)', fontWeight: 600, flex: 1 }}>
              {floodFillMode ? '🪣 FLOOD FILL — click city to fill zone' : '✏️ PAINT — click & drag on city'}
            </span>
            <button
              onClick={() => setFloodFillMode(!floodFillMode)}
              style={{
                padding: '5px 10px', fontSize: 11, fontWeight: 600, borderRadius: 6, cursor: 'pointer',
                border: '1px solid var(--wa-sage)',
                background: floodFillMode ? 'var(--matcha-core)' : 'transparent',
                color: floodFillMode ? 'var(--shizen-white)' : 'var(--mossy-shadow)',
                transition: 'all 150ms ease',
              }}
              title="Toggle flood fill mode — fills entire connected zone"
            >
              🪣 Fill
            </button>
          </div>

          {/* Selected tile preview */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: 'var(--kumo-cloud)', borderRadius: 8, border: '1px solid var(--wa-sage)' }}>
            <div style={{
              width: 40, height: 40, borderRadius: 6, border: '2px solid var(--matcha-core)',
              backgroundImage: getTileImagePath(selectedGroundTile) ? `url('${getTileImagePath(selectedGroundTile)}')` : 'none',
              backgroundSize: 'cover', backgroundPosition: 'center', flexShrink: 0,
            }} />
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--nori-dark)' }}>Selected tile</div>
              <div style={{ fontSize: 10, color: 'var(--mossy-shadow)', fontFamily: 'monospace' }}>{selectedGroundTile}</div>
            </div>
          </div>

          {/* Category tabs */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {Object.entries(TILE_CATEGORIES).map(([name, cat]) => (
              <button
                key={name}
                onClick={() => setTileCategory(name)}
                style={{
                  padding: '4px 10px', fontSize: 10, fontWeight: 600, borderRadius: 20, cursor: 'pointer',
                  border: `1.5px solid ${cat.color}`,
                  background: tileCategory === name ? cat.color : 'transparent',
                  color: tileCategory === name ? '#fff' : cat.color,
                  transition: 'all 120ms ease',
                }}
              >
                {cat.emoji} {name}
              </button>
            ))}
          </div>

          {/* Tile grid for selected category */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <div style={{ fontSize: 10, color: 'var(--wa-sage)', marginBottom: 6, fontStyle: 'italic' }}>
              {TILE_CATEGORIES[tileCategory]?.desc} · {TILE_CATEGORIES[tileCategory]?.tiles.length} tiles
            </div>
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6,
            }}>
              {(TILE_CATEGORIES[tileCategory]?.tiles || []).map((idx) => {
                const tileKey = `tile_${String(idx).padStart(3, '0')}`
                const imagePath = getTileImagePath(tileKey)
                const isSelected = selectedGroundTile === tileKey
                return (
                  <button
                    key={tileKey}
                    onClick={() => setSelectedGroundTile(tileKey)}
                    title={`${tileKey} — click to select, then paint on city`}
                    style={{
                      width: '100%', aspectRatio: '1', borderRadius: 6, cursor: 'pointer',
                      border: isSelected ? '2.5px solid var(--matcha-core)' : '1.5px solid var(--wa-sage)',
                      background: isSelected ? 'rgba(168,197,160,0.2)' : 'var(--shizen-white)',
                      backgroundImage: imagePath ? `url('${imagePath}')` : 'none',
                      backgroundSize: 'cover', backgroundPosition: 'center',
                      boxShadow: isSelected ? '0 0 0 3px rgba(168,197,160,0.35)' : 'none',
                      transition: 'all 100ms ease',
                      padding: 0,
                    }}
                  />
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Storage View */}
      {showStoragePanel && !groundPaintMode && (
        <div className="storage-view">
          {/* Zone Tabs */}
          <div className="zone-tabs">
            {zones.map((zone) => (
              <button
                key={zone}
                className={`zone-tab ${selectedZone === zone ? 'active' : ''}`}
                onClick={() => {
                  setSelectedZone(zone)
                  setGroundPaintMode(false)
                }}
              >
                {zone}
              </button>
            ))}
          </div>

          {/* Sprite Grid */}
          <div className="sprite-grid">
            {spritesInZone
              .map((entry) => ({ ...entry, imagePath: getSpriteImagePath(entry.key) }))
              .filter((entry) => entry.imagePath !== null)
              .map((entry) => (
                <div key={entry.key} className="sprite-item">
                  <div
                    className="sprite-thumbnail"
                    style={{
                      backgroundImage: `url('${entry.imagePath}')`,
                      backgroundSize: 'contain',
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat',
                    }}
                  >
                    <button
                      className="add-sprite-btn"
                      onClick={() => handleAddSprite(entry.key)}
                      title={`Add ${entry.label}`}
                    >
                      +
                    </button>
                  </div>
                  <div className="sprite-label">{entry.label}</div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Edit View - Save Only */}
      {!showStoragePanel && !groundPaintMode && (
        <div className="save-layout-group">
          <button className="save-layout-btn" onClick={handleSaveLayout}>
            💾 Save Layout
          </button>
          {showSaveConfirm && (
            <div className="save-confirm-toast">✅ Layout saved!</div>
          )}
        </div>
      )}

      {/* Note Prompt Modal */}
      {showNotePrompt && (
        <div className="note-prompt-overlay">
          <div className="note-prompt-modal">
            <h3>💭 Save Note (Optional)</h3>
            <textarea
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              placeholder="e.g., 'Built storage district', 'Test layout v2', etc."
              className="note-input"
            />
            <div className="note-button-group">
              <button className="note-confirm-btn" onClick={handleConfirmSave}>
                ✓ Save
              </button>
              <button className="note-cancel-btn" onClick={() => setShowNotePrompt(false)}>
                ✕ Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Version History (edit view only) */}
      {!showStoragePanel && !groundPaintMode && layoutVersions.length > 0 && (
        <div className="version-history">
          <h3>📜 Version History ({layoutVersions.length}/10)</h3>
          <div className="versions-list">
            {layoutVersions.map((version) => (
              <div key={version.id} className="version-item">
                <div className="version-info">
                  <span className="version-time">{version.timestamp}</span>
                  {version.note && (
                    <span className="version-note">"{version.note}"</span>
                  )}
                </div>
                <button
                  className="revert-btn"
                  onClick={() => handleRevertVersion(version.id)}
                  title="Revert to this version"
                >
                  ⏮️ Revert
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
