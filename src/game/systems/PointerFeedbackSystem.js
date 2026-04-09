import logger from '../logger.js'
import { screenToIso } from './IsoHelper.js'

export function updatePointerFeedback(scene) {

  const pointer = scene.input.activePointer
  let hovered = null
  let prevHovered = scene.prevHoveredBuilding
  let hoveredBuildingData = null

  // ✅ Convert pointer to tile coords once, use for all detection
  const pointerTile = screenToIso(
    pointer.worldX,
    pointer.worldY,
    scene.originX,
    scene.originY,
    scene.xStep,
    scene.yStep
  )

  if (scene.placedBuildings) {
    hovered = scene.placedBuildings.find(b => {
      if (!b.sprite) return false
      // Check if building is at the clicked tile (with tolerance for floats)
      return Math.abs(b.tileX - pointerTile.x) < 0.5 && 
             Math.abs(b.tileY - pointerTile.y) < 0.5
    })
  }

  if (scene.cat && !hovered) {
    // ✅ Cat hit-detection also uses tile coords
    const catTile = {
      x: scene.cat.tileX !== undefined ? scene.cat.tileX : Math.round(pointerTile.x),
      y: scene.cat.tileY !== undefined ? scene.cat.tileY : Math.round(pointerTile.y)
    }
    
    if (Math.abs(catTile.x - pointerTile.x) < 0.5 && 
        Math.abs(catTile.y - pointerTile.y) < 0.5) {
      hovered = { sprite: scene.cat }
    }
  }

  if (hovered) {
    if (prevHovered !== hovered && hovered.type) {
      scene.prevHoveredBuilding = hovered
    }

    scene.input.setDefaultCursor('pointer')

    // Skip hover feedback for video overlays
    if (!hovered.sprite?._isVideoOverlay && !hovered.visualFeedback) {
      hovered.sprite.setAlpha(0.85)
      hovered.visualFeedback = true
    }

  } else {
    if (prevHovered) {
      scene.prevHoveredBuilding = null
    }

    scene.input.setDefaultCursor('default')

    scene.placedBuildings?.forEach(b => {
      if (b.sprite && b.visualFeedback) {
        b.sprite.setAlpha(1)
        b.visualFeedback = false
      }
    })

    if (scene.cat) scene.cat.setAlpha(1)

  }

}