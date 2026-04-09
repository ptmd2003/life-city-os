import { ObjectPath, PathState, createAndStartPath } from './ObjectPathSystem.js'
import { isoToScreen } from './IsoHelper.js'
import logger from '../logger.js'

/**
 * PlayerSystem — Manages player avatar (cat) movement and pathfinding
 * 
 * Integrates ObjectPath for smooth isometric tile-based movement.
 * Handles:
 * - Path following with callbacks
 * - Manual movement by clicking tiles
 * - State tracking (idle, walking, etc.)
 */

export function setupPlayerSystem(scene) {
  scene.player = {
    sprite: null,
    path: null,
    lastTilePos: { tileX: 0, tileY: 0 }
  }

  logger.debug('[PlayerSystem] Initialized')
}

/**
 * Spawn player (cat) at starting position
 * @param {Phaser.Scene} scene 
 * @param {number} startTileX - Starting tile X
 * @param {number} startTileY - Starting tile Y
 * @param {Class} PlayerClass - Player sprite class (e.g., Cat)
 * @returns {Phaser.GameObjects.Sprite|Image}
 */
export function spawnPlayer(scene, startTileX, startTileY, PlayerClass) {
  const startPos = isoToScreen(
    startTileX,
    startTileY,
    scene.originX,
    scene.originY,
    scene.xStep,
    scene.yStep
  )

  const sprite = new PlayerClass(scene, startPos.x, startPos.y)
  
  // Store tile position on sprite
  sprite.tileX = startTileX
  sprite.tileY = startTileY

  // Add to isographic group for depth sorting
  if (scene.isoGroup) {
    scene.isoGroup.add(sprite)
  }

  // Initialize player tracking
  scene.player.sprite = sprite
  scene.player.lastTilePos = { tileX: startTileX, tileY: startTileY }

  // Set proper depth (same formula as buildings)
  sprite.setDepth(startPos.y + sprite.displayHeight * 0.5 + 1000)

  logger.debug(`[PlayerSystem] Spawned player at tile(${startTileX}, ${startTileY})`)

  return sprite
}

/**
 * Move player along a path (array of tile coordinates)
 * 
 * Example:
 * ```
 * movePlayerAlongPath(scene, [
 *   { tileX: 5, tileY: 5 },
 *   { tileX: 6, tileY: 5 },
 *   { tileX: 7, tileY: 6 }
 * ])
 * ```
 * 
 * @param {Phaser.Scene} scene 
 * @param {Array<{tileX, tileY}>} pathCells - Path to follow
 * @param {Object} options - Duration, callbacks, etc.
 * @returns {ObjectPath}
 */
export function movePlayerAlongPath(scene, pathCells, options = {}) {
  if (!scene.player.sprite) {
    logger.warn('[PlayerSystem] No player sprite to move')
    return null
  }

  // Stop any existing path
  if (scene.player.path && scene.player.path.getState() === PathState.MOVING) {
    scene.player.path.abort()
  }

  const gridOrigin = {
    originX: scene.originX,
    originY: scene.originY
  }

  const tileSize = {
    xStep: scene.xStep,
    yStep: scene.yStep
  }

  const defaultOptions = {
    duration: 300,
    costPerTile: 1,
    onComplete: (path) => {
      logger.debug(`[PlayerSystem] Movement complete at tile(${path.getCurrentCell().tileX}, ${path.getCurrentCell().tileY})`)
      
      // Update player tile position
      const lastCell = pathCells[pathCells.length - 1]
      scene.player.lastTilePos = { tileX: lastCell.tileX, tileY: lastCell.tileY }
      scene.player.sprite.tileX = lastCell.tileX
      scene.player.sprite.tileY = lastCell.tileY
    },
    onFailed: (path) => {
      logger.warn(`[PlayerSystem] Movement failed/aborted at step ${path.getCurrentStep()}`)
    },
    ...options
  }

  const path = createAndStartPath(
    scene.player.sprite,
    scene,
    pathCells,
    gridOrigin,
    tileSize,
    defaultOptions
  )

  scene.player.path = path
  return path
}

/**
 * Move player to single tile (creates 1-step path)
 * @param {Phaser.Scene} scene 
 * @param {number} tileX 
 * @param {number} tileY 
 * @param {Object} options 
 * @returns {ObjectPath}
 */
export function movePlayerToTile(scene, tileX, tileY, options = {}) {
  return movePlayerAlongPath(scene, [{ tileX, tileY }], options)
}

/**
 * Stop player movement
 * @param {Phaser.Scene} scene 
 * @param {boolean} instant - If true, stop immediately; if false, abort gracefully
 */
export function stopPlayerMovement(scene, instant = false) {
  if (!scene.player.path) return

  if (instant) {
    scene.player.path.instantAbort()
  } else {
    scene.player.path.abort()
  }

  logger.debug(`[PlayerSystem] Movement stopped (instant: ${instant})`)
}

/**
 * Get player's current tile position
 * @param {Phaser.Scene} scene 
 * @returns {{tileX, tileY}}
 */
export function getPlayerTilePos(scene) {
  if (!scene.player.sprite) return null
  return {
    tileX: scene.player.sprite.tileX,
    tileY: scene.player.sprite.tileY
  }
}

/**
 * Check if player is moving
 * @param {Phaser.Scene} scene 
 * @returns {boolean}
 */
export function isPlayerMoving(scene) {
  return scene.player.path && scene.player.path.getState() === PathState.MOVING
}