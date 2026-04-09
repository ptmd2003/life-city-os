import Phaser from 'phaser'
import { getSpriteDimensions, getTileSizeInPixels } from './assetRegistry.js'

// Cat is 1x1 tile
const dims = getSpriteDimensions('cat-idle')
const CAT_MAX_SIZE = getTileSizeInPixels(dims)

const CatState = {
  WALKING: 'walking',
  SLEEPING: 'sleeping',
  IDLE: 'idle'
}

export default class Cat extends Phaser.GameObjects.Image {
  constructor (scene, x, y) {
    super(scene, x, y, 'cat-idle')
    scene.add.existing(this)
    this.setInteractive({ useHandCursor: true })
    this.on('pointerdown', (pointer) => {
      // Only respond if pointer is within center radius (0.08 of display size)
      const dx = pointer.worldX - this.x
      const dy = pointer.worldY - (this.y - this.displayHeight / 2)
      const radius = Math.min(this.displayWidth, this.displayHeight) * 0.25
      const dist = Math.sqrt(dx * dx + dy * dy)
      
      if (dist > radius) return // Click outside radius, ignore
      
      // if sleeping, wake up happy
      if (this.state === CatState.SLEEPING) {
        this.toIdle()
        // tiny hop animation to show reaction
        this.scene.tweens.add({
          targets: this,
          y: this.y - 8,
          duration: 150,
          yoyo: true
        })
      } else if (this.state === CatState.WALKING && !this.isOnPath) {
        // Only stop manual walking, not path-based movement
        this.toIdle()
      }
      // If idle or on path, do nothing
    })

    this.setOrigin(0.5, 1)
    
    // Scale cat to fit within 1x1 tile space
    const width = this.displayWidth
    const height = this.displayHeight
    
    if (width > CAT_MAX_SIZE.width || height > CAT_MAX_SIZE.height) {
      const scaleX = CAT_MAX_SIZE.width / width
      const scaleY = CAT_MAX_SIZE.height / height
      const scale = Math.min(scaleX, scaleY)
      this.setScale(scale)
    }

    this.scene = scene
    this.state = CatState.IDLE
    this.walkTween = null
    this.frameTimer = null
    this.sleepTimer = null
    this.isOnPath = false  // ✅ Track if currently following ObjectPath

    this.toIdle()
  }

  clearTimers () {
    if (this.walkTween) this.walkTween.stop()
    if (this.frameTimer) this.frameTimer.remove()
    if (this.sleepTimer) this.sleepTimer.remove()
    this.walkTween = this.frameTimer = this.sleepTimer = null
  }

  /**
   * Apply proper scaling to the cat based on current texture
   * Cat is 1x1 tile (44x32 pixels)
   */
  applyScale() {
    const width = this.displayWidth
    const height = this.displayHeight
    
    if (width > CAT_MAX_SIZE.width || height > CAT_MAX_SIZE.height) {
      const scaleX = CAT_MAX_SIZE.width / width
      const scaleY = CAT_MAX_SIZE.height / height
      const scale = Math.min(scaleX, scaleY)
      this.setScale(scale)
    } else {
      // Reset to max reasonable scale if texture is smaller
      this.setScale(1)
    }
  }

  toIdle () {
    this.clearTimers()
    this.state = CatState.IDLE
    this.setTexture('cat-idle')
    this.applyScale()

    // after 2–4s choose walk or sleep
    this.sleepTimer = this.scene.time.delayedCall(
      Phaser.Math.Between(2000, 4000),
      () => {
        if (this.state !== CatState.IDLE) return
        Phaser.Math.Between(0, 1) === 0 ? this.toWalk() : this.toSleep()
      }
    )
  }

  toSleep () {
    this.clearTimers()
    this.state = CatState.SLEEPING

    const frames = ['cat-idle', 'cat-sleep']
    let idx = 0

    this.setTexture(frames[0])
    this.applyScale()

    this.sleepTimer = this.scene.time.addEvent({
      delay: 800,
      loop: true,
      callback: () => {
        idx = (idx + 1) % frames.length
        this.setTexture(frames[idx])
        this.applyScale()
      }
    })

    this.scene.time.delayedCall(
      Phaser.Math.Between(3000, 6000),
      () => {
        if (this.state === CatState.SLEEPING) this.toIdle()
      }
    )
  }

  toWalk () {
    this.clearTimers()
    this.state = CatState.WALKING
    this.isOnPath = false  // Manual walk (not path-based)

    const frames = ['cat-walk-1', 'cat-walk-2', 'cat-walk-3', 'cat-walk-4']
    let idx = 0

    this.setTexture(frames[0])
    this.applyScale()

    this.frameTimer = this.scene.time.addEvent({
      delay: 450,
      loop: true,
      callback: () => {
        idx = (idx + 1) % frames.length
        this.setTexture(frames[idx])
        this.applyScale()
      }
    })

    this.walkTween = this.scene.tweens.add({
      targets: this,
      x: this.x + 200,
      duration: 8000,
      ease: 'Linear',
      yoyo: true,
      repeat: -1,
      onYoyo: () => this.setFlipX(true),
      onRepeat: () => {
        this.setFlipX(false)
        // 30% chance to stop walking and go idle
        if (Phaser.Math.Between(0, 9) < 3 && this.state === CatState.WALKING) {
          this.toIdle()
        }
      }
    })
  }

  /**
   * Start path-based walking animation
   * Called when object path system starts moving the cat
   */
  startPathWalk() {
    this.clearTimers()
    this.state = CatState.WALKING
    this.isOnPath = true  // Path-based walk (don't stop on click)

    const frames = ['cat-walk-1', 'cat-walk-2', 'cat-walk-3', 'cat-walk-4']
    let idx = 0

    this.setTexture(frames[0])
    this.applyScale()

    // Cycle through walk frames while moving
    this.frameTimer = this.scene.time.addEvent({
      delay: 450,
      loop: true,
      callback: () => {
        idx = (idx + 1) % frames.length
        this.setTexture(frames[idx])
        this.applyScale()
      }
    })
  }

  /**
   * Stop path-based walking and return to idle
   * Called when object path completes
   */
  stopPathWalk() {
    this.clearTimers()
    this.isOnPath = false
    this.toIdle()
  }
}
