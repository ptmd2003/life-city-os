import Phaser from 'phaser'
import { isoToScreen } from './IsoHelper.js'
import logger from '../logger.js'

/**
 * ObjectPath State Machine
 * 
 * Manages smooth movement of a game object along a path of isometric tiles.
 * State flow: READY → MOVING → COMPLETED/FAILED/ABORTED
 * 
 * Adapted from virtualord's ObjectPath.h for isometric tile-based movement.
 */

export const PathState = {
  READY: 'ready',
  MOVING: 'moving',
  COMPLETED: 'completed',
  FAILED: 'failed',
  ABORTING: 'aborting',
  ABORTED: 'aborted'
}

export class ObjectPath {
  /**
   * @param {Phaser.GameObjects.Sprite|Phaser.GameObjects.Image} sprite - The game object to move
   * @param {Phaser.Scene} scene - The Phaser scene
   * @param {Object} gridOrigin - { originX, originY } screen coordinates for tile (0,0)
   * @param {Object} tileSize - { xStep, yStep } pixels per tile in screen space
   * @param {Object} options - Configuration options
   * @param {number} options.duration - Duration per tile in ms (default: 300)
   * @param {number} options.costPerTile - Energy/cost per tile (default: 1)
   * @param {Function} options.onComplete - Callback when path completes
   * @param {Function} options.onFailed - Callback when path fails
   */
  constructor(sprite, scene, gridOrigin, tileSize, options = {}) {
    this.sprite = sprite
    this.scene = scene
    this.gridOrigin = gridOrigin
    this.tileSize = tileSize

    this.state = PathState.READY
    
    // Path configuration
    this.pathCells = [] // [{ tileX, tileY }, ...]
    this.currentStep = -1 // -1 = not started, 0+ = step index
    this.pathCost = 0

    // Movement configuration
    this.duration = options.duration ?? 300
    this.costPerTile = options.costPerTile ?? 1

    // Callbacks
    this.onComplete = options.onComplete ?? null
    this.onFailed = options.onFailed ?? null

    // Active tween
    this.currentTween = null

    logger.debug(`[ObjectPath] Created for sprite (duration: ${this.duration}ms, cost: ${this.costPerTile}/tile)`)
  }

  /**
   * Set the path for this object to follow
   * @param {Array<{tileX: number, tileY: number}>} cells - Array of tile coordinates
   */
  setPath(cells) {
    if (this.state !== PathState.READY && this.state !== PathState.COMPLETED && this.state !== PathState.FAILED && this.state !== PathState.ABORTED) {
      logger.warn(`[ObjectPath] Cannot set path while in state: ${this.state}`)
      return false
    }

    this.pathCells = cells || []
    this.currentStep = -1
    this.updatePathCost()

    logger.debug(`[ObjectPath] Path set with ${this.pathCells.length} cells (total cost: ${this.pathCost})`)
    return true
  }

  /**
   * Start moving along the path
   * @returns {boolean} True if successfully started
   */
  start() {
    if (this.state !== PathState.READY) {
      logger.warn(`[ObjectPath] Cannot start in state: ${this.state}`)
      return false
    }

    if (this.pathCells.length === 0) {
      logger.warn(`[ObjectPath] No path set`)
      return false
    }

    this.state = PathState.MOVING
    this.currentStep = 0
    logger.debug(`[ObjectPath] Started moving (${this.pathCells.length} tiles)`)
    this._moveToNextStep()
    return true
  }

  /**
   * Abort the current movement gracefully
   */
  abort() {
    if (this.state === PathState.MOVING) {
      this.state = PathState.ABORTING
      logger.debug(`[ObjectPath] Abort requested`)
    }
  }

  /**
   * Instantly abort and revert to READY
   */
  instantAbort() {
    if (this.currentTween) {
      this.currentTween.stop()
      this.currentTween = null
    }
    this.state = PathState.ABORTED
    logger.debug(`[ObjectPath] Instantly aborted`)
  }

  /**
   * Get current state
   */
  getState() {
    return this.state
  }

  /**
   * Check if path has started
   */
  hasStarted() {
    return this.state !== PathState.READY
  }

  /**
   * Get total energy cost for this path
   */
  getPathCost() {
    return this.pathCost
  }

  /**
   * Get current step index (or -1 if not started)
   */
  getCurrentStep() {
    return this.currentStep
  }

  /**
   * Get path cells
   */
  getPath() {
    return this.pathCells
  }

  /**
   * Get sprite position at current step
   * @returns {Object|null} { tileX, tileY } or null if not moving
   */
  getCurrentCell() {
    if (this.currentStep < 0 || this.currentStep >= this.pathCells.length) {
      return null
    }
    return this.pathCells[this.currentStep]
  }

  /**
   * PRIVATE: Calculate total movement cost
   */
  updatePathCost() {
    this.pathCost = this.pathCells.length * this.costPerTile
  }

  /**
   * PRIVATE: Move to the next step in the path
   */
  _moveToNextStep() {
    // Check abort signal
    if (this.state === PathState.ABORTING) {
      this.state = PathState.ABORTED
      if (this.onFailed) this.onFailed(this)
      logger.debug(`[ObjectPath] Movement aborted`)
      return
    }

    // Check if path is complete
    if (this.currentStep >= this.pathCells.length) {
      this.state = PathState.COMPLETED
      if (this.onComplete) this.onComplete(this)
      logger.debug(`[ObjectPath] Path completed (${this.pathCells.length} steps)`)
      return
    }

    // Get target tile
    const cell = this.pathCells[this.currentStep]
    const targetScreen = isoToScreen(
      cell.tileX,
      cell.tileY,
      this.gridOrigin.originX,
      this.gridOrigin.originY,
      this.tileSize.xStep,
      this.tileSize.yStep
    )

    // Stop any existing tween
    if (this.currentTween) {
      this.currentTween.stop()
    }

    // Tween to target position
    this.currentTween = this.scene.tweens.add({
      targets: this.sprite,
      x: targetScreen.x,
      y: targetScreen.y,
      duration: this.duration,
      ease: 'Linear',
      onComplete: () => {
        this.currentTween = null
        this.currentStep++
        
        // Continue to next step
        this._moveToNextStep()
      }
    })

    logger.debug(`[ObjectPath] Step ${this.currentStep} → tile(${cell.tileX}, ${cell.tileY})`)
  }
}

/**
 * Helper: Create and start a path for a sprite
 * @param {Phaser.GameObjects.Sprite|Image} sprite 
 * @param {Phaser.Scene} scene 
 * @param {Array<{tileX, tileY}>} pathCells 
 * @param {Object} gridOrigin 
 * @param {Object} tileSize 
 * @param {Object} options 
 * @returns {ObjectPath}
 */
export function createAndStartPath(sprite, scene, pathCells, gridOrigin, tileSize, options = {}) {
  const path = new ObjectPath(sprite, scene, gridOrigin, tileSize, options)
  path.setPath(pathCells)
  path.start()
  return path
}
