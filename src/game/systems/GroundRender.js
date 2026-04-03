import { isoToScreen } from './IsoHelper.js'
import { useCityStore } from '../../stores/useCityStore.js'
import logger from '../logger.js'

export function drawGround(scene) {

  scene.groundTiles = []
  const groundLayout = useCityStore.getState().groundLayout

  for (let y = 0; y < scene.rows; y++) {
    for (let x = 0; x < scene.cols; x++) {

      const pos = isoToScreen(
        x,
        y,
        scene.originX,
        scene.originY,
        scene.xStep,
        scene.yStep
      )

      // ✅ Use precise floats (no rounding) for perfect tile alignment
      // Rounding causes inconsistent gaps — floats align tile edges perfectly
      const posX = pos.x
      const posY = pos.y

      // Get tile from groundLayout
      const tileIndex = y * scene.cols + x
      const tileKey = groundLayout[tileIndex] || 'tile_037'

      const tile = scene.add.image(posX, posY, tileKey)
        .setOrigin(0.5, 1)  // ✅ Bottom-center anchor
        .setDepth(posY)

      scene.groundTiles.push(tile)

    }
  }

  console.log(`✅ Ground drawn: ${scene.cols} × ${scene.rows} = ${scene.groundTiles.length} tiles`)
}

/**
 * Update a single ground tile sprite in the scene
 * Called when player paints a ground tile
 */
export function updateGroundTileSprite(scene, x, y, tileKey) {
  if (x < 0 || x >= 36 || y < 0 || y >= 36) return

  const tileIndex = y * 36 + x
  if (!scene.groundTiles || !scene.groundTiles[tileIndex]) return

  const tile = scene.groundTiles[tileIndex]
  tile.setTexture(tileKey)
  logger.debug(`Ground tile updated`, { x, y, tileKey })
}

/**
 * Draw flat tile overlays on top of the ground layer
 * Flat tiles don't replace full tiles — they layer on top
 */
export function drawFlatTiles(scene) {
  scene.flatTiles = []
  const flatTileLayout = useCityStore.getState().flatTileLayout

  for (let y = 0; y < scene.rows; y++) {
    for (let x = 0; x < scene.cols; x++) {
      const tileIndex = y * scene.cols + x
      const tileKey = flatTileLayout[tileIndex]
      
      // Only render if a flat tile exists at this position
      if (!tileKey) continue

      const pos = isoToScreen(
        x,
        y,
        scene.originX,
        scene.originY,
        scene.xStep,
        scene.yStep
      )

      const posX = pos.x
      const posY = pos.y

      const flatTile = scene.add.image(posX, posY, tileKey)
        .setOrigin(0.5, 1)  // ✅ Bottom-center anchor
        .setDepth(posY)  // ✅ Same depth as ground tile (uses isometric Y-sort)

      flatTile._tileX = x
      flatTile._tileY = y
      scene.flatTiles.push(flatTile)
    }
  }
}

/**
 * Update or place a flat tile overlay
 */
export function updateFlatTileSprite(scene, x, y, tileKey) {
  if (x < 0 || x >= 36 || y < 0 || y >= 36) return

  if (!scene.flatTiles) scene.flatTiles = []

  // Check if flat tile already exists at this position
  const existingFlatTile = scene.flatTiles.find(t => t._tileX === x && t._tileY === y)

  if (existingFlatTile) {
    // Update existing flat tile
    existingFlatTile.setTexture(tileKey)
    console.log(`✨ [updateFlatTileSprite] Updated FLAT tile overlay (${x}, ${y}) to ${tileKey}`)
  } else {
    // Create new flat tile
    const pos = isoToScreen(x, y, scene.originX, scene.originY, scene.xStep, scene.yStep)
    const flatTile = scene.add.image(pos.x, pos.y, tileKey)
      .setOrigin(0.5, 1)
      .setDepth(pos.y)  // ✅ Use isometric Y-sort (not +0.5)
    
    flatTile._tileX = x
    flatTile._tileY = y
    scene.flatTiles.push(flatTile)
    console.log(`✨ [updateFlatTileSprite] Created FLAT tile overlay (${x}, ${y}) with ${tileKey}`)
  }
}
