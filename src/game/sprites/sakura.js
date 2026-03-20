import Phaser from 'phaser'
import { getSpriteDimensions, getTileSizeInPixels } from './assetRegistry.js'

export default class Sakura extends Phaser.GameObjects.Sprite {
  constructor (scene, x, y) {
    super(scene, x, y, 'sakura-small')
    scene.add.existing(this)

    // Get max size for sakura sprite from registry
    const dims = getSpriteDimensions('sakura-small')
    const maxSize = getTileSizeInPixels(dims)
    
    this.setOrigin(0.5, 1)
    
    // Scale to fit within tile space if needed
    const width = this.displayWidth
    const height = this.displayHeight
    
    if (width > maxSize.width || height > maxSize.height) {
      const scaleX = maxSize.width / width
      const scaleY = maxSize.height / height
      const scale = Math.min(scaleX, scaleY)
      this.setScale(scale)
    }

    // Create bloom animation
    if (!scene.anims.exists('sakura-bloom')) {
      scene.anims.create({
        key: 'sakura-bloom',
        frames: [
          { key: 'sakura-small' },
          { key: 'sakura-bloom-1' },
          { key: 'sakura-bloom-2' },
          { key: 'sakura-bloom-1' }
        ],
        frameRate: 3,
        repeat: 0
      })
    }

    // Start with idle frame
    this.setTexture('sakura-small')

    // Add gentle swaying motion
    this.swayTween = scene.tweens.add({
      targets: this,
      angle: { from: -0.75, to: 0.75 },
      duration: 3000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    })

    // Occasionally trigger bloom animation
    this.bloomTimer = scene.time.addEvent({
      delay: Phaser.Math.Between(8000, 15000), // Random interval 8-15 seconds
      callback: () => {
        this.playBloomAnimation()
      },
      loop: true
    })
  }

  playBloomAnimation () {
    // Play bloom animation
    this.play('sakura-bloom')

    // Stop swaying during bloom
    if (this.swayTween) {
      this.swayTween.pause()
    }

    // Return to normal after animation
    this.scene.time.delayedCall(2000, () => {
      this.setTexture('sakura-small')
      if (this.swayTween) {
        this.swayTween.resume()
      }
    })
  }

  destroy () {
    if (this.swayTween) {
      this.swayTween.stop()
    }
    if (this.bloomTimer) {
      this.bloomTimer.remove()
    }
    super.destroy()
  }
}