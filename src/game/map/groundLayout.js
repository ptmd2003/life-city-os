// ============================================================
// Ground Layout — 36×36 terrain grid
// Each cell stores a tile key (e.g., 'tile_037' for grass)
// Default: 'tile_037' (grass) for all tiles
// ============================================================

export function createDefaultGroundLayout() {
  const cols = 36
  const rows = 36
  const defaultTile = 'tile_037' // Grass tile

  const layout = []
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      layout.push(defaultTile)
    }
  }

  return layout
}

/**
 * Get ground tile at grid position (x, y)
 * Returns tile key string or undefined if out of bounds
 */
export function getGroundTileAt(groundLayout, x, y) {
  if (x < 0 || x >= 36 || y < 0 || y >= 36) return undefined
  return groundLayout[y * 36 + x]
}

/**
 * Set ground tile at grid position (x, y)
 * Returns new groundLayout array
 */
export function setGroundTileAt(groundLayout, x, y, tileKey) {
  if (x < 0 || x >= 36 || y < 0 || y >= 36) return groundLayout
  const newLayout = [...groundLayout]
  newLayout[y * 36 + x] = tileKey
  return newLayout
}
