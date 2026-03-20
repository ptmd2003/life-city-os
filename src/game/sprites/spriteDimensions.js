/**
 * Sprite dimensions in tiles (width x height)
 * Used to properly scale and position sprites in the isometric world
 * Tile size: 44x32 pixels
 */

export const SPRITE_DIMENSIONS = {
  // Dojo assets
  'red-torii-gate': { w: 3, h: 4 },
  'training-lantern': { w: 1, h: 2 },
  'wooden-weapon-rack': { w: 2, h: 1 },
  'hanging-banner-dojo': { w: 1, h: 2 },
  'straw-training-dummy': { w: 1, h: 2 },
  'dojo-main-hall': { w: 5, h: 4 },
  'training-yard': { w: 4, h: 3 },
  'stone-zen-garden': { w: 3, h: 3 },
  'bamboo-grove': { w: 2, h: 3 },

  // Park assets
  'paper-lantern-post': { w: 1, h: 3 },
  'wooden-bench': { w: 2, h: 1 },
  'stone-path-straight': { w: 1, h: 1 },
  'stone-path-corner': { w: 1, h: 1 },
  'stone-path-t-junction': { w: 1, h: 1 },
  'small-koi-pond': { w: 3, h: 3 },
  'cherry-blossom-tree': { w: 2, h: 3 },
  'stone-lantern': { w: 1, h: 2 },
  'small-flower-bed': { w: 2, h: 1 },
  'bamboo-fence': { w: 2, h: 1 },
  'park-vending-machine': { w: 1, h: 2 },
  'feeding-station': { w: 1, h: 1 },

  // Teahouse assets
  'teahouse-main': { w: 4, h: 4 },
  'tea-terrace': { w: 3, h: 3 },
  'tea-table': { w: 2, h: 1 },
  'tea-counter': { w: 3, h: 1 },
  'wind-chime': { w: 1, h: 1 },
  'wisteria-trellis': { w: 1, h: 3 },
  'tea-stepping-stones': { w: 2, h: 2 },
  'water-basin': { w: 1, h: 1 },
  'tea-cart': { w: 1, h: 1 },
  'wooden-deck': { w: 1, h: 1 },

  // Study assets
  'study-hall': { w: 4, h: 4 },
  'tatami-room': { w: 4, h: 3 },
  'study-desk': { w: 2, h: 1 },
  'bookshelf': { w: 2, h: 3 },
  'piano': { w: 2, h: 2 },
  'floor-cushion': { w: 1, h: 1 },
  'hanging-lantern': { w: 1, h: 1 },
  'bonsai-tree': { w: 1, h: 1 },
  'hanging-scroll': { w: 1, h: 2 },
  'incense-holder': { w: 1, h: 1 },
  'book-stack': { w: 1, h: 1 },
  'writing-set': { w: 1, h: 1 },

  // Shared assets
  'grass-tile': { w: 1, h: 1 },
  'packed-earth': { w: 1, h: 1 },
  'water-tile': { w: 1, h: 1 },
  'wooden-bridge': { w: 3, h: 1 },
  'street-lamp': { w: 1, h: 1 },
  'mailbox': { w: 1, h: 1 },
  'signpost': { w: 1, h: 2 },

  // Sakura assets
  'sakura': { w: 2, h: 3 },

  // Cat
  'cat-idle': { w: 1, h: 1 },
  'cat-walking': { w: 1, h: 1 },

  // Effects
  'xp-orb': { w: 1, h: 1 }, // Actually 32x32px, treating as 1x1 tile
  'level-up-effect': { w: 2, h: 2 },
}

/**
 * Get dimensions for an asset key
 * Returns default dimensions if asset not in map
 */
export function getSpriteDimensions(assetKey) {
  // Try direct lookup
  if (SPRITE_DIMENSIONS[assetKey]) {
    return SPRITE_DIMENSIONS[assetKey]
  }

  // Try fuzzy matching on common keywords
  const key = assetKey.toLowerCase()
  for (const [dimKey, dims] of Object.entries(SPRITE_DIMENSIONS)) {
    if (key.includes(dimKey) || dimKey.includes(key.split('-')[0])) {
      return dims
    }
  }

  // Default to 2x2 if not found
  return { w: 2, h: 2 }
}

/**
 * Calculate pixel dimensions from tile dimensions
 * Tile size: 44x32 pixels
 */
export function getTileSizeInPixels(tileDims) {
  const TILE_WIDTH = 44
  const TILE_HEIGHT = 32
  return {
    width: tileDims.w * TILE_WIDTH,
    height: tileDims.h * TILE_HEIGHT,
  }
}
