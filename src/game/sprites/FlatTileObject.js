import Phaser from 'phaser'

/**
 * FlatTileObject — A tile placed as an interactive object on the map
 * Can be rotated, scaled, and deleted like buildings
 * Renders on top of ground tiles
 */
export default class FlatTileObject extends Phaser.GameObjects.Image {
  constructor(scene, x, y, tileKey) {
    super(scene, x, y, tileKey)
    scene.add.existing(this)
    scene.isoGroup.add(this)

    this.setOrigin(0.5, 1)
    this.setDisplaySize(44, 32)  // ✅ Fixed 1x1 tile size

    this.tileKey = tileKey
    this.scene = scene
  }
}
