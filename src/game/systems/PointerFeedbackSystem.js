import logger from '../logger.js'

export function updatePointerFeedback(scene) {

  const pointer = scene.input.activePointer
  let hovered = null
  let prevHovered = scene.prevHoveredBuilding
  let hoveredBuildingData = null

  if (scene.placedBuildings) {
    hovered = scene.placedBuildings.find(b => {
      if (!b.sprite) return false
      const s = b.sprite
      const halfW = s.displayWidth * 0.5
      const halfH = s.displayHeight * 0.5
      const cx = s.x
      const cy = s.y - s.displayHeight * 0.5
      return Math.abs(pointer.worldX - cx) < halfW && Math.abs(pointer.worldY - cy) < halfH
    })
  }

  if (scene.cat) {
    const halfW = scene.cat.displayWidth * 0.5
    const halfH = scene.cat.displayHeight * 0.5
    const cx = scene.cat.x
    const cy = scene.cat.y - scene.cat.displayHeight * 0.5
    if (Math.abs(pointer.worldX - cx) < halfW && Math.abs(pointer.worldY - cy) < halfH) {
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