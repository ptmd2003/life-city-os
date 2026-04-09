import { isoToScreen } from './IsoHelper.js'
import { useCityStore } from '../../stores/useCityStore.js'
import logger from '../logger.js'
import { EnhancedGroundLayout, TileMetadata, TileTypes } from './EnhancedGroundSystem.js'

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
      const posX = pos.x
      const posY = pos.y

      // Get tile metadata
      const tileIndex = y * scene.cols + x
      const metadata = groundMetadata.getTile(x, y)
      const tileKey = groundLayout[tileIndex] || 'tile_037'

      // ✅ Create sprite
      const tile = scene.add.image(posX, posY, tileKey)
        .setOrigin(0.5, 1)  // ✅ Bottom-center anchor
        .setDepth(posY + (metadata?.elevation || 0) * 0.1)  // ✅ Elevation affects depth

      // ✅ Store metadata on sprite for reference
      tile._metadata = metadata
      tile._gridX = x
      tile._gridY = y

      // ✅ Optional: Apply tint based on tile type
      const typeInfo = metadata?.getTypeInfo()
      if (typeInfo?.colors) {
        // Use top color as tint (converts hex to number)
        const hexColor = typeInfo.colors.top
        const colorNum = parseInt(hexColor.replace('#', ''), 16)
        tile.setTint(colorNum)
      }

      scene.groundTiles.push(tile)

    }
  }

  console.log(`✅ Ground drawn: ${scene.cols} × ${scene.rows} = ${scene.groundTiles.length} tiles (enhanced metadata system)`)
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
    // New format: set type via metadata
    setGroundType(scene, x, y, tileKey)
  } else {
    // Old format: set texture directly
    tile.setTexture(tileKey)
  }
  
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
