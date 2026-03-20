import { useCityStore } from '../stores/useCityStore'
import { useState } from 'react'
import { ASSET_REGISTRY, getAllZones } from '../game/sprites/assetRegistry.js'
import { assetManifest } from '../game/preloadAssets.js'
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
    groundTileMode,
    setGroundTileMode,
  } = useCityStore()

  const [showSaveConfirm, setShowSaveConfirm] = useState(false)
  const [showNotePrompt, setShowNotePrompt] = useState(false)
  const [noteInput, setNoteInput] = useState('')
  const [selectedZone, setSelectedZone] = useState('dojo') // Default zone filter

  // Get object name/id for display
  const getObjectName = (obj) => {
    return obj.id || obj.key || `${obj.type}-${obj.x},${obj.y}`
  }

  // ✅ CRITICAL: Get scene instance from Phaser game
  const getScene = () => {
    if (!phaserGame) {
      console.warn('❌ [TransformPanel] phaserGame not ready')
      return null
    }
    const scene = phaserGame.scene.getScene('CityScene')
    if (!scene) console.warn('❌ [TransformPanel] CityScene not found')
    return scene
  }

  // ✅ CRITICAL: Find actual Phaser sprite from data building
  const getBuilding = (dataBuilding) => {
    if (!dataBuilding) {
      console.warn('❌ [TransformPanel] No dataBuilding provided')
      return null
    }

    const scene = getScene()
    if (!scene) {
      console.warn('❌ [TransformPanel] No scene to search for building')
      return null
    }
    
    console.log(`🔍 [TransformPanel] Searching for building at (${dataBuilding.x}, ${dataBuilding.y})`)
    console.log(`   Scene has ${scene.placedBuildings?.length || 0} placed buildings`)
    
    // Find placedBuilding that matches tile position
    const matched = scene.placedBuildings?.find(b => {
      const match = b.tileX === dataBuilding.x && b.tileY === dataBuilding.y
      if (match) console.log(`   ✅ Found match: ${b.type}`)
      return match
    })
    
    if (!matched) {
      console.warn(`❌ [TransformPanel] No building found at (${dataBuilding.x}, ${dataBuilding.y})`)
      return null
    }
    
    console.log(`✅ [TransformPanel] Returning sprite for ${matched.type}`)
    return matched.sprite
  }

  // Handle object selection in sidebar
  const handleSelectObject = (obj) => {
    console.log(`🎯 [TransformPanel] Clicked object: ${getObjectName(obj)}`)
    setSelectedBuilding(obj)
    
    // ✅ Emit select event with actual sprite on SCENE events
    const scene = getScene()
    console.log(`   Scene exists? ${!!scene}`)
    
    const sprite = getBuilding(obj)
    console.log(`   Sprite exists? ${!!sprite}`)
    
    if (scene && sprite) {
      console.log(`   📤 Emitting 'select-building' event to scene`)
      scene.events.emit('select-building', sprite)
    } else {
      console.error(`❌ Cannot emit: scene=${!!scene}, sprite=${!!sprite}`)
    }
  }

  // Handle transform button click (toggle mode)
  const handleTransformClick = (mode) => {
    if (transformMode === mode) {
      // Exit mode
      setTransformMode(null)
    } else {
      // Enter mode
      // Reset slider to neutral position
      if (mode === 'rotate') {
        setTransformValue({ ...transformValue, rotate: 0 })
      } else if (mode === 'resize') {
        setTransformValue({ ...transformValue, scale: 1.0 })
      }
      setTransformMode(mode)
    }
  }

  // Handle slider changes
  const handleRotateChange = (e) => {
    const newRotate = parseFloat(e.target.value)
    setTransformValue({ ...transformValue, rotate: newRotate })
    console.log(`🔄 [TransformPanel] Rotate slider moved to ${newRotate.toFixed(1)}°`)
    
    // Apply immediately to sprite
    if (selectedBuilding) {
      const scene = getScene()
      const sprite = getBuilding(selectedBuilding)
      console.log(`   Scene exists? ${!!scene}, Sprite exists? ${!!sprite}`)
      
      if (scene && sprite) {
        console.log(`   📤 Emitting 'transform-building' with rotate=${newRotate.toFixed(1)}°`)
        scene.events.emit('transform-building', {
          building: sprite,
          mode: 'rotate',
          value: newRotate,
        })
      } else {
        console.error(`❌ Cannot emit rotate: scene=${!!scene}, sprite=${!!sprite}`)
      }
    } else {
      console.warn('❌ No selectedBuilding for rotate')
    }
  }

  const handleResizeChange = (e) => {
    const newScale = parseFloat(e.target.value)
    setTransformValue({ ...transformValue, scale: newScale })
    console.log(`📐 [TransformPanel] Resize slider moved to ${newScale.toFixed(2)}`)
    
    // Apply immediately to sprite
    if (selectedBuilding) {
      const scene = getScene()
      const sprite = getBuilding(selectedBuilding)
      console.log(`   Scene exists? ${!!scene}, Sprite exists? ${!!sprite}`)
      
      if (scene && sprite) {
        console.log(`   📤 Emitting 'transform-building' with scale=${newScale.toFixed(2)}`)
        scene.events.emit('transform-building', {
          building: sprite,
          mode: 'resize',
          value: newScale,
        })
      } else {
        console.error(`❌ Cannot emit resize: scene=${!!scene}, sprite=${!!sprite}`)
      }
    } else {
      console.warn('❌ No selectedBuilding for resize')
    }
  }

  // Handle delete button
  const handleDelete = () => {
    console.log(`🗑️ [TransformPanel] Delete clicked for selected building`)
    if (selectedBuilding) {
      const scene = getScene()
      const sprite = getBuilding(selectedBuilding)
      console.log(`   Scene exists? ${!!scene}, Sprite exists? ${!!sprite}`)
      
      if (scene && sprite) {
        console.log(`   📤 Emitting 'delete-building' event`)
        scene.events.emit('delete-building', sprite)
      } else {
        console.error(`❌ Cannot emit delete: scene=${!!scene}, sprite=${!!sprite}`)
      }
      deselectBuilding()
    } else {
      console.warn('❌ No selectedBuilding for delete')
    }
  }

  // Handle deselect on close button
  const handleClose = () => {
    console.log(`✖️ [TransformPanel] Close button clicked`)
    deselectBuilding()
    const scene = getScene()
    if (scene) {
      console.log(`   📤 Emitting 'deselect-building' event`)
      scene.events.emit('deselect-building')
    } else {
      console.warn('❌ No scene to emit deselect')
    }
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
      return `/${matchedPath}`
    }

    // Fallback: construct path based on zone + type pattern
    // This handles edge cases where manifest doesn't match exactly
    console.warn(`⚠️  Asset ${assetKey} not found in manifest, using fallback`)
    return `/src/assets/shared/objects/mailbox.png` // Placeholder fallback
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
    return matchedPath ? `/${matchedPath}` : null
  }

  return (
    <div className="transform-panel">
      <div className="panel-header">
        <h2>🎮 {groundPaintMode ? '🌍 Ground' : showStoragePanel ? '🏪 Storage' : 'Transform'}</h2>
        <div className="header-buttons">
          <button
            className={`storage-toggle-btn ${groundPaintMode ? 'active' : ''}`}
            onClick={() => setGroundPaintMode(!groundPaintMode)}
            title="Toggle ground painting mode"
          >
            🌍
          </button>
          <button
            className={`storage-toggle-btn ${showStoragePanel ? 'active' : ''}`}
            onClick={() => setShowStoragePanel(!showStoragePanel)}
            title="Toggle storage view"
          >
            🏪
          </button>
          {selectedBuilding && !showStoragePanel && !groundPaintMode && (
            <button className="close-btn" onClick={handleClose}>×</button>
          )}
        </div>
      </div>

      {/* Ground Painting View */}
      {groundPaintMode && (
        <div className="ground-view">
          <p className="ground-mode-help">Select a tile below. Hover the canvas to preview, click to paint.</p>
          
          {/* Toggle Full vs Flat Tile Mode */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <button
              onClick={() => setGroundTileMode('full')}
              style={{
                flex: 1,
                padding: '8px 12px',
                background: groundTileMode === 'full' ? '#6aab7a' : '#e0e0e0',
                color: groundTileMode === 'full' ? '#fff' : '#666',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 'bold',
                transition: 'all 0.2s',
              }}
              title="Paint full ground tiles (with depth)"
            >
              🌍 Full Tile
            </button>
            <button
              onClick={() => setGroundTileMode('flat')}
              style={{
                flex: 1,
                padding: '8px 12px',
                background: groundTileMode === 'flat' ? '#9888b0' : '#e0e0e0',
                color: groundTileMode === 'flat' ? '#fff' : '#666',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 'bold',
                transition: 'all 0.2s',
              }}
              title="Paint flat overlay tiles (no depth)"
            >
              ✨ Flat Overlay
            </button>
          </div>
          
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
                onClick={() => setSelectedZone(zone)}
              >
                {zone}
              </button>
            ))}
          </div>

          {/* Sprite Grid */}
          <div className="sprite-grid">
            {spritesInZone.map((entry) => (
              <div key={entry.key} className="sprite-item">
                <div
                  className="sprite-thumbnail"
                  style={{
                    backgroundImage: `url('${getSpriteImagePath(entry.key)}')`,
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

      {/* Edit View (Object List + Transform Controls) */}
      {!showStoragePanel && !groundPaintMode && (
        <>

      {/* Object List */}
      <div className="object-list">
        <h3>Objects</h3>
        <div className="objects">
          {cityLayout.map((obj, idx) => {
            const isSelected = selectedBuilding === obj
            return (
              <button
                key={idx}
                className={`object-btn ${isSelected ? 'selected' : ''}`}
                onClick={() => handleSelectObject(obj)}
              >
                {getObjectName(obj)}
              </button>
            )
          })}
        </div>
      </div>

      {/* Transform Controls */}
      <div className="transform-controls">
        <h3>Transform</h3>
        <div className="button-group">
          <button
            className={`transform-btn ${transformMode === 'rotate' ? 'active' : ''} ${!selectedBuilding ? 'disabled' : ''}`}
            onClick={() => handleTransformClick('rotate')}
            disabled={!selectedBuilding}
          >
            🔄 Rotate
          </button>
          <button
            className={`transform-btn ${transformMode === 'resize' ? 'active' : ''} ${!selectedBuilding ? 'disabled' : ''}`}
            onClick={() => handleTransformClick('resize')}
            disabled={!selectedBuilding}
          >
            ↔️ Resize
          </button>
          <button
            className={`transform-btn delete-btn ${!selectedBuilding ? 'disabled' : ''}`}
            onClick={handleDelete}
            disabled={!selectedBuilding}
          >
            ✖️ Delete
          </button>
          <button
            className={`transform-btn lock-btn ${selectedBuilding?.locked ? 'locked' : ''} ${!selectedBuilding ? 'disabled' : ''}`}
            onClick={() => toggleBuildingLock()}
            disabled={!selectedBuilding}
            title={selectedBuilding?.locked ? 'Unlock to move' : 'Lock to prevent moving'}
          >
            {selectedBuilding?.locked ? '🔒 Locked' : '🔓 Unlock'}
          </button>
        </div>
      </div>

      {/* Transform Sliders */}
      {transformMode === 'rotate' && (
        <div className="transform-slider">
          <label>Rotation: {transformValue.rotate.toFixed(1)}°</label>
          <div className="slider-container">
            <span>-180°</span>
            <input
              type="range"
              min="-180"
              max="180"
              step="1"
              value={transformValue.rotate}
              onChange={handleRotateChange}
              className="slider"
            />
            <span>180°</span>
          </div>
        </div>
      )}

      {transformMode === 'resize' && (
        <div className="transform-slider">
          <label>Scale: {transformValue.scale.toFixed(2)}x</label>
          <div className="slider-container">
            <span>0.05x</span>
            <input
              type="range"
              min="0.05"
              max="3"
              step="0.05"
              value={transformValue.scale}
              onChange={handleResizeChange}
              className="slider"
            />
            <span>3x</span>
          </div>
        </div>
      )}

      {/* Confirm Button */}
      {transformMode && (
        <div className="confirm-group">
          <button className="confirm-btn" onClick={() => setTransformMode(null)}>
            ✓ Confirm
          </button>
        </div>
      )}
        </>
      )}

      {/* Save Layout Button (visible in edit view) */}
      {!showStoragePanel && !groundPaintMode && (
        <div className="save-layout-group">
          <button className="save-layout-btn" onClick={handleSaveLayout}>
            💾 Save Layout
          </button>
          {showSaveConfirm && (
            <div className="save-confirm-toast">✅ {showStoragePanel ? 'Sprite added!' : 'Layout saved!'}</div>
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
