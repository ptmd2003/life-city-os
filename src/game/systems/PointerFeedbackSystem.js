import logger from '../logger.js'

export function updatePointerFeedback(scene) {

  const pointer = scene.input.activePointer
  let hovered = null
  let prevHovered = scene.prevHoveredBuilding
  let hoveredBuildingData = null

  if (scene.placedBuildings) {
    hovered = scene.placedBuildings.find(b => {

      if (!b.sprite) return false

      const dx = pointer.worldX - b.sprite.x
      const dy = pointer.worldY - b.sprite.y

      // circle radius based on smaller dimension (center area only)
      const radius = Math.min(b.sprite.displayWidth, b.sprite.displayHeight) * 0.25
      return dx*dx + dy*dy < radius*radius
    })
  }

  if (scene.cat) {

    const dx = pointer.worldX - scene.cat.x
    const dy = pointer.worldY - scene.cat.y

    // circular hit area for cat too
    const radius = Math.min(scene.cat.displayWidth, scene.cat.displayHeight) * 0.25
    if (dx*dx + dy*dy < radius*radius) {
      hovered = { sprite: scene.cat }
    }

  }

  if (hovered) {
    if (prevHovered !== hovered && hovered.type) {
      logger.debug(`Hovering ${hovered.type}`)
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
      logger.debug(`Unhovered ${prevHovered.type}`)
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