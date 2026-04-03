import Phaser from 'phaser'
import { isoToScreen } from '../systems/IsoHelper.js'

/**
 * Cat — Solo NPC that walks around the city
 * Simple walker with no needs/metrics
 */
export class Cat {
  constructor(scene, x, y, id) {
    this.scene = scene
    this.id = id
    this.tileX = x
    this.tileY = y

    // Create sprite (use cat character or simple shape)
    const pos = isoToScreen(x, y, scene.originX, scene.originY, scene.xStep, scene.yStep)
    this.sprite = scene.add.circle(pos.x, pos.y, 10, 0xf4a460) // Sandy brown for cat
      .setDepth(pos.y)
      .setOrigin(0.5, 0.5)

    // Simple state
    this.state = 'walking' // walking | resting
    this.targetBuilding = null
    this.path = []
    this.pathIndex = 0
    this.walkSpeed = 30 // pixels per second
    this.restDuration = 5000 // Rest for 5 seconds at each destination
    this.restStartTime = null
  }

  /**
   * Update cat: walk, rest at destinations
   */
  update(buildings) {
    // Walk toward target
    if (this.state === 'walking' && this.path.length > 0) {
      this.walkPath()
    }

    // Rest at destination
    if (this.state === 'resting') {
      const now = Date.now()
      if (now - this.restStartTime > this.restDuration) {
        // Pick new destination
        this.chooseBehavior(buildings)
      }
    }

    // Update sprite position
    const pos = isoToScreen(this.tileX, this.tileY, this.scene.originX, this.scene.originY, this.scene.xStep, this.scene.yStep)
    this.sprite.setPosition(pos.x, pos.y)
    this.sprite.setDepth(pos.y)
  }

  /**
   * Choose random building to walk toward
   */
  chooseBehavior(buildings) {
    if (!buildings || buildings.length === 0) {
      this.state = 'resting'
      return
    }

    // Pick random building
    this.targetBuilding = buildings[Math.floor(Math.random() * buildings.length)]
    this.pathfindTo(this.targetBuilding.x, this.targetBuilding.y)
    this.state = 'walking'
  }

  /**
   * Simple greedy pathfinding toward target
   */
  pathfindTo(targetX, targetY) {
    this.path = []
    let x = this.tileX
    let y = this.tileY

    // Greedy: move toward target until arrival
    while (Math.hypot(x - targetX, y - targetY) > 1) {
      const dx = Math.sign(targetX - x)
      const dy = Math.sign(targetY - y)

      // Move diagonally or straight
      if (Math.random() > 0.5) {
        x += dx
        y += dy
      } else {
        if (Math.random() > 0.5) x += dx
        else y += dy
      }

      // Clamp to map
      x = Math.max(0, Math.min(35, x))
      y = Math.max(0, Math.min(35, y))

      this.path.push({ x, y })

      if (this.path.length > 50) break
    }

    this.pathIndex = 0
  }

  /**
   * Walk along path
   */
  walkPath() {
    if (this.pathIndex >= this.path.length) {
      // Reached destination, rest
      this.state = 'resting'
      this.restStartTime = Date.now()
      this.path = []
      this.pathIndex = 0
      return
    }

    const nextPos = this.path[this.pathIndex]
    this.tileX = nextPos.x
    this.tileY = nextPos.y
    this.pathIndex++
  }

  /**
   * Destroy cat
   */
  destroy() {
    this.sprite.destroy()
  }
}

