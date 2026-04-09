import Phaser from 'phaser'
import { createBuilding } from './buildingFactory.js'
import { isoToScreen, screenToIso } from './IsoHelper.js'
import { WorldHealthSystem } from '../world/WorldHealthSystem.js'
import logger from '../logger.js'
import { useCityStore } from '../../stores/useCityStore.js'

export function setupBuildingPlacement(scene) {

  scene.placedBuildings = []
  scene.hoveredBuilding = null    // ✅ Track hover (visual only, buttons shown)
  scene.isDragging = false        // ✅ Drag active state
  scene.dragThresholdMet = false  // ✅ 8px threshold met
  scene.pointerDownPos = { x: 0, y: 0 }
  scene.dragOffset = { x: 0, y: 0 }

  scene.add.text(10, 10,
    'Click & drag buildings | Right-click to duplicate | Use Transform Panel for rotate/resize/delete',
    { font: '16px Arial', fill: '#ffffff' }
  ).setScrollFactor(0)

  // Global pointer handlers
  scene.input.on('pointerdown', (pointer) => {
    // ✅ Right-click: duplicate object
    if (pointer.button === 2) {
      handleRightClick(scene, pointer)
    } else {
      // Left-click: select/drag
      handleGlobalPointerDown(scene, pointer)
    }
  })

  scene.input.on('pointermove', (pointer) => {
    handleGlobalPointerMove(scene, pointer)
  })

  scene.input.on('pointerup', () => {
    handleGlobalPointerUp(scene)
  })

}

export function spawnBuildings(scene, cityLayout) {
  logger.debug(`Spawning ${cityLayout.length} buildings`)

  cityLayout.forEach(obj => {

    const pos = isoToScreen(
      obj.x,
      obj.y,
      scene.originX,
      scene.originY,
      scene.xStep,
      scene.yStep
    )

    // obj.type is now the asset key (from registry)
    const building = createBuilding(scene, obj.type, pos.x, pos.y)

    if (!building) return

    // apply saved transforms if present
    if (obj.scale) building.setScale(obj.scale)
    if (obj.angle) building.setAngle(obj.angle)
    if (obj.depthOffset !== undefined) building.depthOffset = obj.depthOffset  // ✅ Restore layer offset

    // ✅ Store tile coordinates on sprite for isometric depth sorting
    building.tileX = obj.x
    building.tileY = obj.y

    scene.isoGroup.add(building)

    const buildingData = {
      type: obj.type,
      key: obj.type,           // ✅ Asset key is now the same as type
      tileX: obj.x,            // ✅ Exact tile X (floats for precision)
      tileY: obj.y,            // ✅ Exact tile Y
      worldX: pos.x,
      worldY: pos.y,
      locked: obj.locked ?? false,  // ✅ Include lock state from layout
      depthOffset: obj.depthOffset ?? 0,  // ✅ Include layer offset for persistence
      sprite: building
    }

    scene.placedBuildings.push(buildingData)

  })
}

/**
 * Handle right-click (duplicate object)
 */
function handleRightClick(scene, pointer) {
  const store = useCityStore.getState()
  
  // Find building under pointer
  const clickedBuilding = scene.placedBuildings.find(b => {
    if (!b.sprite) return false
    const dx = pointer.worldX - b.sprite.x
    const dy = pointer.worldY - b.sprite.y
    const radius = Math.min(b.sprite.displayWidth, b.sprite.displayHeight) * 0.25
    return dx*dx + dy*dy < radius*radius
  })

  if (!clickedBuilding) return

  // ✅ Layout now stores exact floats, match with epsilon tolerance
  const buildingFromLayout = store.cityLayout.find(b => {
    if (b.type !== clickedBuilding.type) return false
    return Math.abs(b.x - clickedBuilding.tileX) < 0.01 && 
           Math.abs(b.y - clickedBuilding.tileY) < 0.01
  })

  if (buildingFromLayout?.locked) {
    logger.debug(`Cannot duplicate locked ${clickedBuilding.type}`)
    return
  }

  // ✅ Duplicate: offset by 1 tile down-right (store exact floats)
  const duplicateData = {
    type: clickedBuilding.type,
    x: clickedBuilding.tileX + 1,  // Store exact float
    y: clickedBuilding.tileY + 1,
    scale: buildingFromLayout?.scale || 1.0,
    angle: buildingFromLayout?.angle || 0,
    id: clickedBuilding.type + '-' + (Math.round(clickedBuilding.tileX) + 1) + '-' + (Math.round(clickedBuilding.tileY) + 1) + '-' + Date.now()
  }

  // Add to layout in memory
  const newLayout = [...store.cityLayout, duplicateData]
  store.updateCityLayoutMemory(newLayout)

  // Emit event to spawn the sprite in scene
  scene.events.emit('spawn-building', duplicateData)

  logger.debug(`Copied ${clickedBuilding.type} from (${clickedBuilding.tileX}, ${clickedBuilding.tileY}) to offset position`)
}

function handleGlobalPointerDown(scene, pointer) {
  // ✅ Find ANY building under pointer (locked or unlocked)
  const store = useCityStore.getState()
  
  const clickedBuilding = scene.placedBuildings.find(b => {
    if (!b.sprite) return false
    const dx = pointer.worldX - b.sprite.x
    // Correct for origin at center-bottom: visual center is at y - displayHeight/2
    const dy = pointer.worldY - (b.sprite.y - b.sprite.displayHeight / 2)
    // Match the 0.25 radius from PointerFeedbackSystem
    const radius = Math.min(b.sprite.displayWidth, b.sprite.displayHeight) * 0.25
    
    // Check if this building is within radius
    return dx*dx + dy*dy < radius*radius
  })

  if (clickedBuilding) {
    // ✅ Set hoveredBuilding for ALL buildings (locked and unlocked)
    // We'll check lock state later when deciding whether to drag
    logger.debug(`Clicked ${clickedBuilding.type} ${clickedBuilding.locked ? '(locked)' : '(unlocked)'}`)
    scene.pointerDownPos = { x: pointer.worldX, y: pointer.worldY }
    scene.dragOffset.x = 0
    scene.dragOffset.y = 0
    scene.hoveredBuilding = clickedBuilding
  }
}

function handleGlobalPointerMove(scene, pointer) {
  if (!scene.hoveredBuilding) return
  const building = scene.hoveredBuilding

  // ✅ Drag while pointer is down (not just when threshold met)
  if (pointer.isDown) {
    // ✅ Prevent dragging LOCKED buildings
    if (building.locked) {
      logger.debug(`Cannot drag locked ${building.type}`)
      return
    }

    const dist = Phaser.Math.Distance.Between(
      scene.pointerDownPos.x,
      scene.pointerDownPos.y,
      pointer.worldX,
      pointer.worldY
    )

    // Threshold: 8px before starting drag animation
    if (dist > 8) {
      if (!scene.isDragging) {
        // ✅ Start drag (first time threshold met)
        hideTransformHandles(scene)
        scene.isDragging = true
        logger.debug(`Dragging ${building.type}`)
      }

      // ✅ ALWAYS move while dragging (even after threshold)
      building.sprite.x = pointer.worldX + scene.dragOffset.x
      building.sprite.y = pointer.worldY + scene.dragOffset.y
      updateBuildingTilePosition(scene, building)
      updateGroundLighting(scene, building)
      console.log(`➡️ [DRAG-MOVE] ${building.type} at tile (${building.tileX}, ${building.tileY})`)
    }
  }
}

function handleGlobalPointerUp(scene) {
  const store = useCityStore.getState()
  
  if (scene.isDragging && scene.hoveredBuilding) {
    // 🎯 Building was dragged — update layout
    updateCityLayoutMemory(scene)
    resetGroundLighting(scene)
    logger.debug(`Dropped building`)
  } else if (scene.hoveredBuilding && !scene.isDragging) {
    // ✅ Building was clicked (not dragged) — SELECT it for transform
    const building = scene.hoveredBuilding
    const buildingData = scene.placedBuildings.find(b => b.sprite === building.sprite || b === building)
    
    if (buildingData) {
      logger.debug(`Selected ${buildingData.type} for transform`)
      
      // ✅ buildingData only stores tileX/Y as floats
      // Layout can now also have float coords, so match directly or with tolerance
      const layoutEntry = store.cityLayout.find(b => {
        if (b.type !== buildingData.type) return false
        // Match with small epsilon tolerance for float comparison
        return Math.abs(b.x - buildingData.tileX) < 0.01 && 
               Math.abs(b.y - buildingData.tileY) < 0.01
      })
      const selectedBuildingWithLocked = {
        ...buildingData,
        locked: layoutEntry?.locked ?? buildingData.locked ?? false  // Prefer layout, fallback to buildingData
      }
      
      // Update store with selected building (including locked state)
      store.setSelectedBuilding(selectedBuildingWithLocked)
      // Emit event to trigger visual feedback
      scene.events.emit('select-building', selectedBuildingWithLocked.sprite || selectedBuildingWithLocked)
    }
  }

  // ✅ Reset drag state
  scene.isDragging = false
  scene.dragThresholdMet = false
  scene.hoveredBuilding = null
  hideTransformHandles(scene)
}



function updateBuildingTilePosition(scene, building) {
  // Convert world position back to tile coordinates
  const tilePos = screenToIso(
    building.sprite.x,
    building.sprite.y,
    scene.originX,
    scene.originY,
    scene.xStep,
    scene.yStep
  )

  // ✅ Keep exact float tile coordinates (no rounding)
  // This ensures perfect alignment with ground tiles on reload
  building.tileX = tilePos.x
  building.tileY = tilePos.y
  building.worldX = building.sprite.x
  building.worldY = building.sprite.y
}

function updateGroundLighting(scene, building) {
  // Reset all ground tiles
  scene.groundTiles.forEach(tile => {
    tile.setTint(0xffffff)
  })

  // Light up tiles around the building
  // Use rounded tile coords for tile selection (building tileX/Y are floats)
  const baseTileX = Math.round(building.tileX)
  const baseTileY = Math.round(building.tileY)
  const radius = 2
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      const tileX = baseTileX + dx
      const tileY = baseTileY + dy

      if (tileX >= 0 && tileX < scene.cols && tileY >= 0 && tileY < scene.rows) {
        const tileIndex = tileY * scene.cols + tileX
        if (scene.groundTiles[tileIndex]) {
          scene.groundTiles[tileIndex].setTint(0xaaaaff) // Light blue tint
        }
      }
    }
  }
}

function resetGroundLighting(scene) {
  const health = WorldHealthSystem.getWorldHealth()
  const groundTint = health < 5 ? 0x666666 : 0xffffff
  scene.groundTiles.forEach(tile => tile.setTint(groundTint))
}

function updateCityLayoutMemory(scene) {
  // Create a new layout array with updated positions and transforms
  // Note: 'type' is now the asset key (unified from registry)
  const store = useCityStore.getState()
  
  const newLayout = scene.placedBuildings.map(building => {
    // ✅ Store exact float tile coordinates (preserve decimal precision)
    // This ensures buildings reload at exact same position
    const roundedX = Math.round(building.tileX)  // For matching only
    const roundedY = Math.round(building.tileY)
    
    const originalEntry = store.cityLayout.find(b => 
      b.type === building.type && 
      b.x === roundedX && 
      b.y === roundedY
    )
    
    return {
      type: building.type,
      x: building.tileX,  // ✅ Store exact float, not rounded!
      y: building.tileY,
      scale: building.sprite.scaleX,
      angle: building.sprite.angle,
      depthOffset: building.depthOffset ?? 0,  // ✅ Keep layer ordering!
      locked: building.locked ?? originalEntry?.locked ?? false,  // ✅ Keep lock state!
      id: building.type + '-' + roundedX + '-' + roundedY // ID uses rounded for stability
    }
  })

  // Update the store (memory only, not persisted)
  store.updateCityLayoutMemory(newLayout)

  // Update scene reference
  scene.cityLayout = newLayout
}

// transformation helpers --- BUTTONS NOW IN SIDEBAR TRANSFORM PANEL --------
function hideTransformHandles(scene) {
  if (scene.transformHandles) {
    scene.transformHandles.resize.destroy()
    scene.transformHandles.rotate.destroy()
    if (scene.transformHandles.del) scene.transformHandles.del.destroy()
    scene.transformHandles = null
  }
  scene.transformMode = null
}
