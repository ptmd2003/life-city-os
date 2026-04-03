/**
 * Convert isometric tile coordinates to screen coordinates
 * 
 * @param {number} tx - Tile X coordinate
 * @param {number} ty - Tile Y coordinate
 * @param {number} originX - Screen X origin (center of world)
 * @param {number} originY - Screen Y origin (top of world)
 * @param {number} xStep - Pixels per tile on X axis
 * @param {number} yStep - Pixels per tile on Y axis
 * @returns {Object} { x, y } - Screen coordinates
 */
export function isoToScreen(tx, ty, originX, originY, xStep, yStep) {

  return {
    x: originX + (tx - ty) * xStep,
    y: originY + (tx + ty) * yStep
  }

}

/**
 * Convert screen coordinates to isometric tile coordinates
 * 
 * Inverse of isoToScreen. Takes screen X/Y and returns the tile position.
 * Useful for mouse input conversion and position queries.
 * 
 * @param {number} screenX - Screen X coordinate
 * @param {number} screenY - Screen Y coordinate
 * @param {number} originX - Screen X origin
 * @param {number} originY - Screen Y origin
 * @param {number} xStep - Pixels per tile on X axis
 * @param {number} yStep - Pixels per tile on Y axis
 * @returns {Object} { x, y } - Tile coordinates (may be fractional)
 */
export function screenToIso(screenX, screenY, originX, originY, xStep, yStep) {
  const relX = screenX - originX
  const relY = screenY - originY

  const tileX = (relX / xStep + relY / yStep) / 2
  const tileY = (relY / yStep - relX / xStep) / 2

  return { x: tileX, y: tileY }
}