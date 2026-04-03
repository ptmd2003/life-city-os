import { Cat } from '../sprites/NPC.js'

/**
 * PopulationSystem — Manages the single cat NPC
 * Spawns at 6 AM, despawns at 10 PM (night)
 */
export class PopulationSystem {
  constructor(scene) {
    this.scene = scene
    this.cat = null // Single cat instance
    this.lastSpawnHour = -1
    this.lastDespawnHour = -1
  }

  /**
   * Spawn cat at 6 AM if not already spawned
   */
  spawnCatAtDayStart(timeSystem) {
    const hour = timeSystem.getHour()

    // Spawn once at 6 AM
    if (hour === 6 && this.lastSpawnHour !== 6) {
      if (this.cat) {
        this.cat.destroy()
      }

      // Spawn cat at a random home building (or center if no buildings)
      let spawnX = 18
      let spawnY = 18
      const homeBuildings = this.scene.cityLayout?.filter(b => b.type === 'dojo') || []
      if (homeBuildings.length > 0) {
        const home = homeBuildings[Math.floor(Math.random() * homeBuildings.length)]
        spawnX = home.x
        spawnY = home.y
      }

      this.cat = new Cat(this.scene, spawnX, spawnY, 'cat-001')
      this.lastSpawnHour = 6
    }
  }

  /**
   * Despawn cat at 10 PM (22:00) if spawned
   */
  despawnCatAtNight(timeSystem) {
    const hour = timeSystem.getHour()

    // Despawn once at 10 PM
    if (hour === 22 && this.lastDespawnHour !== 22) {
      if (this.cat) {
        this.cat.destroy()
        this.cat = null
      }
      this.lastDespawnHour = 22
    }

    // Reset despawn counter at midnight
    if (hour === 0) {
      this.lastDespawnHour = -1
    }
  }

  /**
   * Update cat movement and behavior
   */
  update(timeSystem) {
    this.spawnCatAtDayStart(timeSystem)
    this.despawnCatAtNight(timeSystem)

    // Update cat if alive
    if (this.cat) {
      this.cat.update(this.scene.cityLayout || [])
    }
  }
}
