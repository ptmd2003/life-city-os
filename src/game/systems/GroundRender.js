import { isoToScreen } from './IsoHelper.js'
import { useCityStore } from '../../stores/useCityStore.js'
import logger from '../logger.js'
import { EnhancedGroundLayout, TileMetadata, TileTypes } from './EnhancedGroundSystem.js'
import { buildGroundLookup, DEFAULT_TILE } from '../../core/world/worldCommands.js'

/**
 * Initialize enhanced ground metadata from store
 * Migrates old format to new format on first load
 */
function initializeGroundMetadata(scene) {
  const store = useCityStore.getState()
  
  // Check if already enhanced
  if (scene.groundMetadata && scene.groundMetadata.tiles) {
    return scene.groundMetadata
  }

  // Migrate from old groundLayout if needed
  if (store.groundLayout && store.groundLayout[0] && typeof store.groundLayout[0] === 'string') {
    logger.info('[GroundRender] Migrating old groundLayout to enhanced metadata')
    scene.groundMetadata = EnhancedGroundLayout.migrate(store.groundLayout, scene.cols, scene.rows)
  } else {
    // Use existing enhanced format or create new
    scene.groundMetadata = new EnhancedGroundLayout(scene.cols, scene.rows)
  }

  return scene.groundMetadata
}

export function drawGround(scene) {

  scene.groundTiles = []
  const groundMetadata = initializeGroundMetadata(scene)
  const store = useCityStore.getState()

  // Build O(1) tile lookup from the world document (sparse layer).
  // Tiles not listed in the document fall back to DEFAULT_TILE.
  const worldGround = store.world?.layers?.ground ?? []
  const tileOverrides = buildGroundLookup(worldGround)

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
      const posX = pos.x
      const posY = pos.y

      // Get tile metadata
      const metadata = groundMetadata.getTile(x, y)

      // Read from world document — sparse with DEFAULT_TILE fallback
      const tileKey = tileOverrides.get(`${x},${y}`) ?? DEFAULT_TILE

      // Ground tiles use NO Y offset — all tiles share origin(0.5,1) bottom anchor
      // so they naturally align at the same baseline. The old detectTileOffset
      // approach caused seams because different tile types had different top-padding.
      const tile = scene.add.image(posX, posY, tileKey)
        .setOrigin(0.5, 1)  // Bottom-center anchor — bottom vertex of diamond
        .setDepth(posY + (metadata?.elevation || 0) * 0.1)

      // ✅ Store metadata on sprite for reference
      tile._metadata = metadata
      tile._gridX = x
      tile._gridY = y

      scene.groundTiles.push(tile)

    }
  }

  console.log(`✅ Ground drawn: ${scene.cols} × ${scene.rows} = ${scene.groundTiles.length} tiles (world-document driven)`)
}

/**
 * Get tile metadata at position
 */
export function getGroundMetadata(scene, x, y) {
  if (!scene.groundMetadata) return null
  return scene.groundMetadata.getTile(x, y)
}

/**
 * Set tile elevation
 */
export function setGroundElevation(scene, x, y, elevation) {
  if (!scene.groundMetadata) return false
  if (!scene.groundMetadata.setTileElevation(x, y, elevation)) return false

  // Update sprite depth
  const tileIndex = y * scene.cols + x
  if (scene.groundTiles[tileIndex]) {
    const tile = scene.groundTiles[tileIndex]
    const pos = isoToScreen(x, y, scene.originX, scene.originY, scene.xStep, scene.yStep)
    tile.setDepth(pos.y + elevation * 0.1)
    logger.debug(`Tile elevation updated`, { x, y, elevation })
  }
  return true
}

/**
 * Set tile type (grass, water, road, etc.)
 */
export function setGroundType(scene, x, y, type) {
  if (!scene.groundMetadata) return false
  if (!scene.groundMetadata.setTileType(x, y, type)) return false

  // Update sprite tint if type has color scheme
  const tileIndex = y * scene.cols + x
  if (scene.groundTiles[tileIndex]) {
    const tile = scene.groundTiles[tileIndex]
    const typeInfo = TileTypes[type]
    if (typeInfo?.colors) {
      const colorNum = parseInt(typeInfo.colors.top.replace('#', ''), 16)
      tile.setTint(colorNum)
    }
  }

  logger.debug(`Tile type updated`, { x, y, type })
  return true
}

/**
 * Get tile type at position
 */
export function getGroundType(scene, x, y) {
  const metadata = getGroundMetadata(scene, x, y)
  return metadata?.type || 'grass'
}

/**
 * Get tile info (type + properties)
 */
export function getGroundInfo(scene, x, y) {
  const metadata = getGroundMetadata(scene, x, y)
  if (!metadata) return null
  return {
    type: metadata.type,
    elevation: metadata.elevation,
    variation: metadata.variation,
    typeInfo: metadata.getTypeInfo()
  }
}

/**
 * Fill region with terrain type (for painting tools)
 */
export function fillGroundRegion(scene, x1, y1, x2, y2, type) {
  if (!scene.groundMetadata) return 0

  const minX = Math.max(0, Math.min(x1, x2))
  const maxX = Math.min(scene.cols - 1, Math.max(x1, x2))
  const minY = Math.max(0, Math.min(y1, y2))
  const maxY = Math.min(scene.rows - 1, Math.max(y1, y2))

  let count = 0
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      if (setGroundType(scene, x, y, type)) count++
    }
  }

  return count
}

/**
 * Update a single ground tile sprite in the scene (legacy + new format)
 * Supports both old asset keys and new tile type system
 */
export function updateGroundTileSprite(scene, x, y, tileKey) {
  if (x < 0 || x >= 36 || y < 0 || y >= 36) return

  const tileIndex = y * 36 + x
  if (!scene.groundTiles || !scene.groundTiles[tileIndex]) return

  const tile = scene.groundTiles[tileIndex]

  // Check if it's a new type or old asset key
  if (TileTypes[tileKey]) {
    setGroundType(scene, x, y, tileKey)
  } else {
    tile.setTexture(tileKey)
  }

  // Recalculate position — no Y offset for ground tiles (see drawGround)
  const pos = isoToScreen(x, y, scene.originX, scene.originY, scene.xStep, scene.yStep)
  tile.setPosition(pos.x, pos.y)

  logger.debug(`Ground tile updated`, { x, y, tileKey })
}

/**
 * Sync all ground tiles in the scene to a new world ground layer.
 * Called after undo/redo to visually apply the restored WorldDocument.
 * @param {Phaser.Scene} scene
 * @param {Array} worldGroundLayer - world.layers.ground (sparse overrides)
 */
export function syncAllGroundTiles(scene, worldGroundLayer) {
  if (!scene.groundTiles) return
  const lookup = buildGroundLookup(worldGroundLayer)
  for (let y = 0; y < scene.rows; y++) {
    for (let x = 0; x < scene.cols; x++) {
      const tileKey = lookup.get(`${x},${y}`) ?? DEFAULT_TILE
      updateGroundTileSprite(scene, x, y, tileKey)
    }
  }
  logger.debug(`[syncAllGroundTiles] synced ${scene.rows * scene.cols} tiles`)
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
      
      // ✅ Apply auto-detected offset to align by visible content TOP
      const offsetY = window.TILE_OFFSETS?.[tileKey] ?? 0

      const flatTile = scene.add.image(posX, posY - offsetY, tileKey)
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
    const offsetY = window.TILE_OFFSETS?.[tileKey] ?? 0
    existingFlatTile.setTexture(tileKey)
    const pos = isoToScreen(x, y, scene.originX, scene.originY, scene.xStep, scene.yStep)
    existingFlatTile.setPosition(pos.x, pos.y - offsetY)
    console.log(`✨ [updateFlatTileSprite] Updated FLAT tile overlay (${x}, ${y}) to ${tileKey}`)
  } else {
    // Create new flat tile
    const pos = isoToScreen(x, y, scene.originX, scene.originY, scene.xStep, scene.yStep)
    const offsetY = window.TILE_OFFSETS?.[tileKey] ?? 0
    const flatTile = scene.add.image(pos.x, pos.y - offsetY, tileKey)
      .setOrigin(0.5, 1)
      .setDepth(pos.y)  // ✅ Use isometric Y-sort (not +0.5)
    
    flatTile._tileX = x
    flatTile._tileY = y
    scene.flatTiles.push(flatTile)
    console.log(`✨ [updateFlatTileSprite] Created FLAT tile overlay (${x}, ${y}) with ${tileKey}`)
  }
}
