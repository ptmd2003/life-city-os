/**
 * TransformBar — Bottom dock-style control bar
 * Shows transform controls (Rotate, Resize, Delete, Layer, Lock) horizontally
 * Appears only when an object is selected
 * Similar to macOS dock layout
 */

import { useCityStore } from '../stores/useCityStore'
import { bringToFront, sendToBack } from '../game/systems/DepthManager.js'
import { ASSET_REGISTRY } from '../game/sprites/assetRegistry.js'
import { assetManifest } from '../game/preloadAssets.js'
import '../styles/TransformBar.css'

export function TransformBar() {
  const {
    selectedBuilding,
    transformMode,
    transformValue,
    setTransformMode,
    setTransformValue,
    phaserGame,
    toggleBuildingLock,
    buildMode,
    deselectBuilding,
  } = useCityStore()

  // ✅ Get scene instance from Phaser game
  const getScene = () => {
    if (!phaserGame) return null
    const scene = phaserGame.scene.getScene('CityScene')
    return scene
  }

  // ✅ Find actual Phaser sprite from selected building
  const getBuilding = (dataBuilding) => {
    if (!dataBuilding) return null

    const scene = getScene()
    if (!scene) return null
    
    // ✅ Match with float precision (tolerance for epsilon comparison)
    const matched = scene.placedBuildings?.find(b => {
      return b.type === dataBuilding.type &&
             Math.abs(b.tileX - dataBuilding.tileX) < 0.01 && 
             Math.abs(b.tileY - dataBuilding.tileY) < 0.01
    })
    
    if (!matched) return null
    return matched.sprite
  }

  // Handle transform button click (toggle mode)
  const handleTransformClick = (mode) => {
    // ✅ Locked buildings cannot be transformed
    if (selectedBuilding?.locked) return
    
    if (transformMode === mode) {
      setTransformMode(null)
    } else {
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
    
    if (selectedBuilding) {
      const scene = getScene()
      const sprite = getBuilding(selectedBuilding)
      
      if (scene && sprite) {
        scene.events.emit('transform-building', {
          building: sprite,
          mode: 'rotate',
          value: newRotate,
        })
      }
    }
  }

  const handleResizeChange = (e) => {
    const newScale = parseFloat(e.target.value)
    setTransformValue({ ...transformValue, scale: newScale })
    
    if (selectedBuilding) {
      const scene = getScene()
      const sprite = getBuilding(selectedBuilding)
      
      if (scene && sprite) {
        scene.events.emit('transform-building', {
          building: sprite,
          mode: 'resize',
          value: newScale,
        })
      }
    }
  }

  // Handle delete button
  const handleDelete = () => {
    if (selectedBuilding) {
      const scene = getScene()
      const sprite = getBuilding(selectedBuilding)
      
      if (scene && sprite) {
        scene.events.emit('delete-building', sprite)
      }
    }
  }

  // Handle bring to front
  const handleBringToFront = () => {
    if (selectedBuilding) {
      const sprite = getBuilding(selectedBuilding)
      if (sprite) {
        bringToFront(sprite)
        // ✅ Persist to layout so it survives reload
        const scene = getScene()
        if (scene) {
          const store = useCityStore.getState()
          const updatedLayout = store.cityLayout.map(b => {
            if (b.type === selectedBuilding.type &&
                Math.abs(b.x - selectedBuilding.tileX) < 0.01 &&
                Math.abs(b.y - selectedBuilding.tileY) < 0.01) {
              return { ...b, depthOffset: sprite.depthOffset }
            }
            return b
          })
          store.updateCityLayoutMemory(updatedLayout)
        }
      }
    }
  }

  // Handle send to back
  const handleSendToBack = () => {
    if (selectedBuilding) {
      const sprite = getBuilding(selectedBuilding)
      if (sprite) {
        sendToBack(sprite)
        // ✅ Persist to layout so it survives reload
        const scene = getScene()
        if (scene) {
          const store = useCityStore.getState()
          const updatedLayout = store.cityLayout.map(b => {
            if (b.type === selectedBuilding.type &&
                Math.abs(b.x - selectedBuilding.tileX) < 0.01 &&
                Math.abs(b.y - selectedBuilding.tileY) < 0.01) {
              return { ...b, depthOffset: sprite.depthOffset }
            }
            return b
          })
          store.updateCityLayoutMemory(updatedLayout)
        }
      }
    }
  }

  // Get asset label for building
  const getAssetLabel = () => {
    if (!selectedBuilding) return 'Unknown'
    const entry = ASSET_REGISTRY[selectedBuilding.type]
    return entry?.label || selectedBuilding.type || 'Unknown'
  }

  // Get image path for building icon
  const getSpriteImagePath = () => {
    if (!selectedBuilding) return null
    const matchedPath = assetManifest.find(path => {
      const filename = path.split('/').pop().replace('.png', '')
      return filename === selectedBuilding.type
    })
    return matchedPath ? encodeURI(`/${matchedPath}`) : null
  }

  // Define imagePath and placeholderContent once
  const imagePath = getSpriteImagePath()

  // Show placeholder when nothing selected or in view mode
  const placeholderContent = (
    <div className="transform-bar-placeholder">
      <span className="placeholder-text">
        {buildMode ? '🔧 Select an object to transform' : '👁️ View Mode'}
      </span>
    </div>
  )

  // Show placeholder when nothing selected (always show bar)
  if (!selectedBuilding) {
    return (
      <div className="transform-bar">
        <div className="transform-bar-mode-toggle">
          <button
            className={`mode-toggle-btn ${buildMode ? 'build' : 'view'}`}
            onClick={() => useCityStore.setState({ buildMode: !buildMode })}
            title={buildMode ? 'Switch to view mode' : 'Switch to build mode'}
          >
            {buildMode ? '🔨 Build' : '👁️ View'}
          </button>
        </div>
        {placeholderContent}
      </div>
    )
  }

  // In view mode, show object but disable all controls
  if (!buildMode) {
    return (
      <div className="transform-bar">
        <div className="transform-bar-header">
          {imagePath && (
            <div
              className="transform-bar-icon"
              style={{
                backgroundImage: `url('${imagePath}')`,
                backgroundSize: 'contain',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
              }}
            />
          )}
          <div className="transform-bar-info">
            <span className="transform-bar-label">{getAssetLabel()}</span>
            <span className="transform-bar-view-mode">👁️ View Only</span>
          </div>
          <button
            className="transform-bar-deselect-btn"
            onClick={() => deselectBuilding()}
            title="Deselect"
          >
            ✕
          </button>
        </div>
        <div className="transform-bar-mode-toggle">
          <button
            className={`mode-toggle-btn view`}
            onClick={() => useCityStore.setState({ buildMode: !buildMode })}
            title="Switch to build mode"
          >
            👁️ View
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="transform-bar">
      {/* Header with building icon and info */}
      <div className="transform-bar-header">
        {imagePath && (
          <div
            className="transform-bar-icon"
            style={{
              backgroundImage: `url('${imagePath}')`,
              backgroundSize: 'contain',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            }}
          />
        )}
        <div className="transform-bar-info">
          <span className="transform-bar-label">{getAssetLabel()}</span>
          {selectedBuilding?.locked && (
            <span className="transform-bar-lock-indicator">🔒 Locked</span>
          )}
        </div>
        <button
          className="transform-bar-deselect-btn"
          onClick={() => deselectBuilding()}
          title="Deselect"
        >
          ✕
        </button>
      </div>

      {/* Main control buttons */}
      <div className="transform-bar-controls">
        <button
          className={`transform-bar-btn ${transformMode === 'rotate' ? 'active' : ''} ${selectedBuilding?.locked ? 'disabled' : ''}`}
          onClick={() => handleTransformClick('rotate')}
          disabled={selectedBuilding?.locked}
          title={selectedBuilding?.locked ? '🔒 Unlock to rotate' : 'Rotate object'}
        >
          🔄 Rotate
        </button>
        <button
          className={`transform-bar-btn ${transformMode === 'resize' ? 'active' : ''} ${selectedBuilding?.locked ? 'disabled' : ''}`}
          onClick={() => handleTransformClick('resize')}
          disabled={selectedBuilding?.locked}
          title={selectedBuilding?.locked ? '🔒 Unlock to resize' : 'Resize object'}
        >
          ↔️ Resize
        </button>
        
        {/* Separator */}
        <div className="transform-separator"></div>
        
        <button
          className={`transform-bar-btn delete-btn ${selectedBuilding?.locked ? 'disabled' : ''}`}
          onClick={handleDelete}
          disabled={selectedBuilding?.locked}
          title={selectedBuilding?.locked ? '🔒 Unlock to delete' : 'Delete object'}
        >
          ✖️ Delete
        </button>
        
        <button
          className={`transform-bar-btn lock-btn ${selectedBuilding?.locked ? 'locked' : ''}`}
          onClick={() => toggleBuildingLock()}
          title={selectedBuilding?.locked ? 'Unlock to move' : 'Lock to prevent moving'}
        >
          {selectedBuilding?.locked ? '🔒' : '🔓'}
        </button>
        
        {/* Separator */}
        <div className="transform-separator"></div>
        
        <button
          className={`transform-bar-btn ${selectedBuilding?.locked ? 'disabled' : ''}`}
          onClick={handleBringToFront}
          disabled={selectedBuilding?.locked}
          title={selectedBuilding?.locked ? '🔒 Unlock to layer' : 'Bring to front layer'}
        >
          ⬆️
        </button>
        <button
          className={`transform-bar-btn ${selectedBuilding?.locked ? 'disabled' : ''}`}
          onClick={handleSendToBack}
          disabled={selectedBuilding?.locked}
          title={selectedBuilding?.locked ? '🔒 Unlock to layer' : 'Send to back layer'}
        >
          ⬇️
        </button>
      </div>

      {/* Mode toggle (inline with controls) */}
      <div className="transform-bar-mode-toggle">
        <button
          className={`mode-toggle-btn ${buildMode ? 'build' : 'view'}`}
          onClick={() => useCityStore.setState({ buildMode: !buildMode })}
          title={buildMode ? 'Switch to view mode' : 'Switch to build mode'}
        >
          {buildMode ? '🔨 Build' : '👁️ View'}
        </button>
      </div>

      {/* Transform slider panel (appears when transforming) */}
      {(transformMode === 'rotate' || transformMode === 'resize') && (
        <div className="transform-slider-panel">
          {transformMode === 'rotate' && (
            <div className="slider-group">
              <label>Rotation</label>
              <div className="slider-with-value">
                <input
                  type="range"
                  min="-180"
                  max="180"
                  step="1"
                  value={transformValue.rotate}
                  onChange={handleRotateChange}
                  className="slider"
                />
                <span className="value-display">{transformValue.rotate.toFixed(0)}°</span>
              </div>
            </div>
          )}
          
          {transformMode === 'resize' && (
            <div className="slider-group">
              <label>Scale</label>
              <div className="slider-with-value">
                <input
                  type="range"
                  min="0.05"
                  max="3"
                  step="0.05"
                  value={transformValue.scale}
                  onChange={handleResizeChange}
                  className="slider"
                />
                <span className="value-display">{transformValue.scale.toFixed(2)}x</span>
              </div>
            </div>
          )}
          
          <button 
            className="confirm-slider-btn"
            onClick={() => setTransformMode(null)}
            title="Confirm transform"
          >
            ✓
          </button>
        </div>
      )}
    </div>
  )
}
