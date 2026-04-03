import { useCityStore } from '../stores/useCityStore'
import { useState, useEffect, useRef } from 'react'
import { ASSET_REGISTRY, getAllZones } from '../game/sprites/assetRegistry.js'
import { assetManifest } from '../game/preloadAssets.js'
import { colors } from '../theme/colors.js'
import '../styles/TransformPanel.css'

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
    buildMode,
  } = useCityStore()

  const [showSaveConfirm, setShowSaveConfirm] = useState(false)
  const [showNotePrompt, setShowNotePrompt] = useState(false)
  const [noteInput, setNoteInput] = useState('')
  const [selectedZone, setSelectedZone] = useState('dojo') // Default zone filter

  // Get object name/id for display
  const getObjectName = (obj) => {
    return obj.id || obj.key || `${obj.type}-${obj.x},${obj.y}`
  }

  // ✅ Compare objects by their position (unique identifier for placed buildings)
  const isObjectSelected = (obj) => {
    if (!selectedBuilding) return false
    return selectedBuilding.x === obj.x && selectedBuilding.y === obj.y
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

  // Get all available tiles (tile_000 to tile_114)
  const getAllTiles = () => {
    const tiles = []
    for (let i = 0; i <= 114; i++) {
      const key = `tile_${String(i).padStart(3, '0')}`
      tiles.push(key)
    }
    return tiles
  }

  // Get tile image path from manifest
  const getTileImagePath = (tileKey) => {
    const matchedPath = assetManifest.find(path => {
      const filename = path.split('/').pop().replace('.png', '')
      return filename === tileKey
    })
    return matchedPath ? encodeURI(`/${matchedPath}`) : null
  }

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
          <p className="ground-mode-help">Select a tile below. Hover the canvas to preview, click to paint.</p>
          
          {/* Tile Grid */}
          <div className="tile-grid">
            {getAllTiles().map((tileKey) => {
              const imagePath = getTileImagePath(tileKey)
              const isSelected = selectedGroundTile === tileKey
              return (
                <div key={tileKey} className="tile-item">
                  <button
                    className={`tile-thumbnail ${isSelected ? 'selected' : ''}`}
                    style={{
                      backgroundImage: imagePath ? `url('${imagePath}')` : 'none',
                      backgroundSize: 'contain',
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat',
                    }}
                    onClick={() => setSelectedGroundTile(tileKey)}
                    title={tileKey}
                  >
                  </button>
                  <div className="tile-label">{tileKey}</div>
                </div>
              )
            })}
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
