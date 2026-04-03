/**
 * ✅ Isometric depth sorting based on screen Y position + object height
 * Objects lower on screen (higher Y) render on top
 * Formula: depth = screenY + displayHeight * 0.5 + 1000 + depthOffset
 * depthOffset is persistent and allows manual layer adjustments
 */
export function depthSort(group) {

  group.children.iterate(obj => {

    if (!obj || obj.y === undefined) return

    // Use screen Y position + height compensation + persistent offset
    // depthOffset allows manual adjustments that survive the sort
    const height = obj.displayHeight || 0
    const offset = obj.depthOffset || 0
    const baseDepth = obj.y + height * 0.5 + 1000  // Match BuildingFactory +1000
    obj.setDepth(baseDepth + offset)

  })

}

/**
 * Bring an object forward in the layer stack
 * Increases persistent depth offset by 10 units
 * Survives depthSort() calls each frame
 */
export function bringToFront(sprite) {
  if (!sprite) return
  if (sprite.depthOffset === undefined) sprite.depthOffset = 0
  sprite.depthOffset += 10
}

/**
 * Send an object backward in the layer stack
 * Decreases persistent depth offset by 10 units
 * Survives depthSort() calls each frame
 */
export function sendToBack(sprite) {
  if (!sprite) return
  if (sprite.depthOffset === undefined) sprite.depthOffset = 0
  sprite.depthOffset -= 10
}