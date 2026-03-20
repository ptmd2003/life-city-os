import { getSpriteClass, getSpriteDimensions, getTileSizeInPixels } from '../sprites/assetRegistry.js'

/**
 * Factory to create a building sprite from an asset key
 * 
 * @param {Phaser.Scene} scene - The Phaser scene
 * @param {string} assetKey - The asset key (matches filename without .png)
 * @param {number} x - Screen X position
 * @param {number} y - Screen Y position (used for depth sorting)
 * @returns {Phaser.GameObjects.Sprite|Phaser.GameObjects.Image|null}
 */
export function createBuilding(scene, assetKey, x, y) {
  // Check if the asset is loaded in the scene
  if (!scene.textures.exists(assetKey)) {
    console.warn(`Asset not found: ${assetKey}`)
    return null
  }

  let building

  // Check if this asset has a custom sprite class
  const spriteClass = getSpriteClass(assetKey)
  
  if (spriteClass) {
    // Use custom class (e.g., Dojo, Sakura)
    building = new spriteClass(scene, x, y)
  } else {
    // Generic sprite creation
    const tileDims = getSpriteDimensions(assetKey)
    const maxSize = getTileSizeInPixels(tileDims)

    // Create a simple sprite for this asset
    building = scene.add.image(x, y, assetKey)

    // Set origin to center-bottom to prevent clipping
    building.setOrigin(0.5, 1)

    // Scale sprite to fit within its designated tile space
    const width = building.displayWidth
    const height = building.displayHeight

    if (width > maxSize.width || height > maxSize.height) {
      const scaleX = maxSize.width / width
      const scaleY = maxSize.height / height
      const scale = Math.min(scaleX, scaleY)
      building.setScale(scale)
    }
  }

  if (!building) return null

  // Make building interactive
  building.setInteractive({ useHandCursor: true })

  // ✅ Proper isometric depth with height compensation
  // Ground: depth = posY (0-800)
  // Objects: depth = y + displayHeight * 0.5 + 1000
  // - Accounts for building height (tall buildings go back)
  // - +1000 offset ensures all objects are above ground
  building.setDepth(y + building.displayHeight * 0.5 + 1000)

  return building
}