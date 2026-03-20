import Phaser from 'phaser'
import { getSpriteDimensions, getTileSizeInPixels } from './assetRegistry.js'

export default class Dojo extends Phaser.GameObjects.Image {
  constructor (scene, x, y) {
    super(scene, x, y, 'dojo-lv1')
    scene.add.existing(this)
    
    // Get dimensions from registry
    const dims = getSpriteDimensions('dojo-lv1')
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
  }
}
