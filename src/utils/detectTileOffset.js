/**
 * Auto-detect tile Y offset by finding the TOP of visible content
 * Calculates how much transparent padding exists ABOVE the visible pixels
 * 
 * @param {Phaser.Scene} scene - Phaser scene with textures
 * @param {string} textureKey - Phaser texture key (e.g., 'tile_037')
 * @returns {number} offsetY - How many pixels to shift UP to align tops
 */
export function detectTileOffset(scene, textureKey) {
  try {
    const texture = scene.textures.get(textureKey)
    if (!texture) {
      console.warn(`[detectTileOffset] Texture not found: ${textureKey}`)
      return 0
    }

    const frame = texture.getSourceImage()
    if (!frame) return 0

    // Create temp canvas to read pixel data
    const tmpCanvas = document.createElement('canvas')
    tmpCanvas.width = frame.width
    tmpCanvas.height = frame.height
    const ctx = tmpCanvas.getContext('2d')
    ctx.drawImage(frame, 0, 0)

    // Get pixel data (RGBA format)
    const imageData = ctx.getImageData(0, 0, frame.width, frame.height)
    const { data } = imageData

    // Find the TOPMOST row with visible pixels (scan top-down)
    let topVisibleRow = frame.height
    for (let y = 0; y < frame.height; y++) {
      for (let x = 0; x < frame.width; x++) {
        const alpha = data[(y * frame.width + x) * 4 + 3]
        if (alpha > 10) {  // Non-transparent
          topVisibleRow = y
          break
        }
      }
      if (topVisibleRow < frame.height) break  // Found top, stop
    }

    if (topVisibleRow >= frame.height) {
      console.warn(`[detectTileOffset] No visible pixels found in ${textureKey}`)
      return 0
    }

    // offsetY = how many pixels of transparent padding are ABOVE the visible content
    // This aligns all tiles at the top of their visible art
    const offsetY = topVisibleRow

    console.log(`[detectTileOffset] ${textureKey}: topRow=${topVisibleRow}, shift up ${offsetY}px`)
    return offsetY
  } catch (err) {
    console.error(`[detectTileOffset] Error scanning ${textureKey}:`, err)
    return 0
  }
}

/**
 * Scan all loaded tiles and build offset map
 * Call this after all tiles are preloaded
 * 
 * @param {Phaser.Scene} scene - Phaser scene
 * @param {Array<string>} tileKeys - Array of texture keys to scan
 * @returns {Object} Map of textureKey → offsetY
 */
export function detectAllTileOffsets(scene, tileKeys) {
  const offsets = {}

  tileKeys.forEach(key => {
    offsets[key] = detectTileOffset(scene, key, 32)
  })

  console.log('[detectAllTileOffsets] Scanned', tileKeys.length, 'tiles', offsets)
  return offsets
}
