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

    // ✅ Store tile coordinates on sprite for isometric depth sorting
    building.tileX = obj.x
    building.tileY = obj.y

    scene.isoGroup.add(building)

    const buildingData = {
      type: obj.type,
      key: obj.type,           // ✅ Asset key is now the same as type
      tileX: obj.x,
      tileY: obj.y,
      worldX: pos.x,
      worldY: pos.y,
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

  // ✅ Check if building is locked
  const buildingFromLayout = store.cityLayout.find(b => 
    b.type === clickedBuilding.type && 
    b.x === clickedBuilding.tileX && 
    b.y === clickedBuilding.tileY
  )

  if (buildingFromLayout?.locked) {
    logger.debug(`Cannot duplicate locked ${clickedBuilding.type}`)
    return
  }

  // ✅ Duplicate: offset by 1 tile down-right
  const duplicateData = {
    type: clickedBuilding.type,
    x: clickedBuilding.tileX + 1,
    y: clickedBuilding.tileY + 1,
    scale: buildingFromLayout?.scale || 1.0,
    angle: buildingFromLayout?.angle || 0,
    id: clickedBuilding.type + '-' + (clickedBuilding.tileX + 1) + '-' + (clickedBuilding.tileY + 1) + '-' + Date.now()
  }

  // Add to layout in memory
  const newLayout = [...store.cityLayout, duplicateData]
  store.updateCityLayoutMemory(newLayout)

  // Emit event to spawn the sprite in scene
  scene.events.emit('spawn-building', duplicateData)

  logger.debug(`Copied ${clickedBuilding.type} from (${clickedBuilding.tileX}, ${clickedBuilding.tileY}) to offset position`)
}

function handleGlobalPointerDown(scene, pointer) {
  // ✅ Find UNLOCKED building under pointer for drag
  const store = useCityStore.getState()
  
  const clickedBuilding = scene.placedBuildings.find(b => {
    if (!b.sprite) return false
    const dx = pointer.worldX - b.sprite.x
    const dy = pointer.worldY - b.sprite.y
    const radius = Math.min(b.sprite.displayWidth, b.sprite.displayHeight) * 0.25
    
    // Check if this building is within radius
    if (dx*dx + dy*dy >= radius*radius) return false
    
    // ✅ SKIP locked buildings — let pointer pass through
    const buildingFromLayout = store.cityLayout.find(bl => 
      bl.type === b.type && 
      bl.x === b.tileX && 
      bl.y === b.tileY
    )
    
    if (buildingFromLayout?.locked) {
      logger.debug(`Skipping interaction with locked ${b.type}`)
      return false
    }
    
    return true  // Unlocked — interact
  })

  if (clickedBuilding) {
    // ✅ Prepare for drag (unlocked only)
    logger.debug(`Preparing drag for ${clickedBuilding.type}`)
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
  if (scene.isDragging && scene.hoveredBuilding) {
    console.log(`🎯 [DROP] Placed building (changes in memory, click Save Layout to persist)`)
    updateCityLayoutMemory(scene)
    resetGroundLighting(scene)
  }

  // ✅ Reset drag state
  scene.isDragging = false
  scene.dragThresholdMet = false
  
  // ✅ Transform buttons now handled by TransformPanel sidebar — no hover UI
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

  building.tileX = Math.round(tilePos.x)
  building.tileY = Math.round(tilePos.y)
  building.worldX = building.sprite.x
  building.worldY = building.sprite.y
}

function updateGroundLighting(scene, building) {
  // Reset all ground tiles
  scene.groundTiles.forEach(tile => {
    tile.setTint(0xffffff)
  })

  // Light up tiles around the building
  const radius = 2
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      const tileX = building.tileX + dx
      const tileY = building.tileY + dy

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
  const newLayout = scene.placedBuildings.map(building => ({
    type: building.type,
    x: building.tileX,
    y: building.tileY,
    scale: building.sprite.scaleX,
    angle: building.sprite.angle,
    id: building.type + '-' + building.tileX + '-' + building.tileY // Generate stable ID
  }))

  // Update the store (memory only, not persisted)
  useCityStore.getState().updateCityLayoutMemory(newLayout)

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
