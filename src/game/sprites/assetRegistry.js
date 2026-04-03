/**
 * Asset Registry — Single source of truth for all sprite metadata
 * 
 * This centralizes sprite definitions, dimensions, classes, and future metadata
 * (stats, prerequisites, variants, etc.) in one place.
 * 
 * Adding a new sprite:
 *  1. Add file to src/assets/zone/type/
 *  2. Run: npm run generate-assets
 *  3. Add entry below with correct key and dimensions (or auto-populated with defaults)
 *  4. Done!
 */

import Dojo from './dojo.js'
import Sakura from './sakura.js'
import { assetManifest } from '../preloadAssets.js'

/**
 * Core registry: maps asset key → complete metadata
 * key field = Phaser load key = filename without .png
 */
export const ASSET_REGISTRY = {
  // ═══════════════════════════════════════════
  // CHARACTERS
  // ═══════════════════════════════════════════
  'cat-idle': {
    dimensions: { w: 1, h: 1 },
    spriteClass: null,
    zone: 'character',
    label: 'Cat (Idle)',
  },
  'cat-sleep': {
    dimensions: { w: 1, h: 1 },
    spriteClass: null,
    zone: 'character',
    label: 'Cat (Sleeping)',
  },
  'cat-walk-1': {
    dimensions: { w: 1, h: 1 },
    spriteClass: null,
    zone: 'character',
    label: 'Cat (Walking 1)',
  },
  'cat-walk-2': {
    dimensions: { w: 1, h: 1 },
    spriteClass: null,
    zone: 'character',
    label: 'Cat (Walking 2)',
  },
  'cat-walk-3': {
    dimensions: { w: 1, h: 1 },
    spriteClass: null,
    zone: 'character',
    label: 'Cat (Walking 3)',
  },
  'cat-walk-4': {
    dimensions: { w: 1, h: 1 },
    spriteClass: null,
    zone: 'character',
    label: 'Cat (Walking 4)',
  },

  // ═══════════════════════════════════════════
  // DOJO ZONE
  // ═══════════════════════════════════════════
  'dojo-lv1': {
    dimensions: { w: 5, h: 4 },
    spriteClass: Dojo,
    zone: 'dojo',
    label: 'Dojo',
  },
  'dojo2-lv1': {
    dimensions: { w: 5, h: 4 },
    spriteClass: Dojo,
    zone: 'dojo',
    label: 'Dojo (Variant)',
  },
  'red-torii-gate': {
    dimensions: { w: 3, h: 4 },
    spriteClass: null,
    zone: 'dojo',
    label: 'Red Torii Gate',
  },
  'bamboo-grove': {
    dimensions: { w: 2, h: 3 },
    spriteClass: null,
    zone: 'dojo',
    label: 'Bamboo Grove',
  },
  'hanging-banner': {
    dimensions: { w: 1, h: 2 },
    spriteClass: null,
    zone: 'dojo',
    label: 'Hanging Banner',
  },
  'onigiri-stand': {
    dimensions: { w: 1, h: 1 },
    spriteClass: null,
    zone: 'dojo',
    label: 'Onigiri Stand',
  },
  'training-lantern': {
    dimensions: { w: 1, h: 2 },
    spriteClass: null,
    zone: 'dojo',
    label: 'Training Lantern',
  },
  'training-yard': {
    dimensions: { w: 4, h: 3 },
    spriteClass: null,
    zone: 'dojo',
    label: 'Training Yard',
  },
  'weapon-rack': {
    dimensions: { w: 2, h: 1 },
    spriteClass: null,
    zone: 'dojo',
    label: 'Weapon Rack',
  },
  'zen-garden': {
    dimensions: { w: 3, h: 3 },
    spriteClass: null,
    zone: 'dojo',
    label: 'Zen Garden',
  },

  // ═══════════════════════════════════════════
  // NATURE ZONE
  // ═══════════════════════════════════════════
  'bush-1': {
    dimensions: { w: 1, h: 1 },
    spriteClass: null,
    zone: 'nature',
    label: 'Bush',
  },
  'sakura-bloom-1': {
    dimensions: { w: 2, h: 3 },
    spriteClass: null,
    zone: 'nature',
    label: 'Sakura (Bloom 1)',
  },
  'sakura-bloom-2': {
    dimensions: { w: 2, h: 3 },
    spriteClass: null,
    zone: 'nature',
    label: 'Sakura (Bloom 2)',
  },
  'sakura-dying': {
    dimensions: { w: 2, h: 3 },
    spriteClass: null,
    zone: 'nature',
    label: 'Sakura (Dying)',
  },
  'sakura-small': {
    dimensions: { w: 2, h: 3 },
    spriteClass: Sakura,
    zone: 'nature',
    label: 'Sakura (Small)',
  },
  'sakura-style1': {
    dimensions: { w: 2, h: 3 },
    spriteClass: null,
    zone: 'nature',
    label: 'Sakura (Style 1)',
  },

  // ═══════════════════════════════════════════
  // PARK ZONE
  // ═══════════════════════════════════════════
  'bamboo-fence': {
    dimensions: { w: 2, h: 1 },
    spriteClass: null,
    zone: 'park',
    label: 'Bamboo Fence',
  },
  'bird-feeding-station': {
    dimensions: { w: 1, h: 1 },
    spriteClass: null,
    zone: 'park',
    label: 'Bird Feeding Station',
  },
  'flower-bed': {
    dimensions: { w: 2, h: 1 },
    spriteClass: null,
    zone: 'park',
    label: 'Flower Bed',
  },
  'koi-pond': {
    dimensions: { w: 3, h: 3 },
    spriteClass: null,
    zone: 'park',
    label: 'Koi Pond',
  },
  'paper-lantern-post': {
    dimensions: { w: 1, h: 3 },
    spriteClass: null,
    zone: 'park',
    label: 'Paper Lantern Post',
  },
  'red-torii-gate-park': {
    dimensions: { w: 3, h: 4 },
    spriteClass: null,
    zone: 'park',
    label: 'Red Torii Gate',
  },
  'stone-lantern': {
    dimensions: { w: 1, h: 2 },
    spriteClass: null,
    zone: 'park',
    label: 'Stone Lantern',
  },
  'vending-machine': {
    dimensions: { w: 1, h: 2 },
    spriteClass: null,
    zone: 'park',
    label: 'Vending Machine',
  },
  'wooden-bench': {
    dimensions: { w: 2, h: 1 },
    spriteClass: null,
    zone: 'park',
    label: 'Wooden Bench',
  },
  'grass-tile': {
    dimensions: { w: 1, h: 1 },
    spriteClass: null,
    zone: 'park',
    label: 'Grass Tile',
  },
  'stone-path-corner': {
    dimensions: { w: 1, h: 1 },
    spriteClass: null,
    zone: 'park',
    label: 'Stone Path (Corner)',
  },
  'stone-path-straight': {
    dimensions: { w: 1, h: 1 },
    spriteClass: null,
    zone: 'park',
    label: 'Stone Path (Straight)',
  },
  'stone-path-tjunction': {
    dimensions: { w: 1, h: 1 },
    spriteClass: null,
    zone: 'park',
    label: 'Stone Path (T-Junction)',
  },

  // ═══════════════════════════════════════════
  // TEAHOUSE ZONE
  // ═══════════════════════════════════════════
  'teahouse-main': {
    dimensions: { w: 4, h: 4 },
    spriteClass: null,
    zone: 'teahouse',
    label: 'Teahouse',
  },
  'outdoor-terrace': {
    dimensions: { w: 3, h: 3 },
    spriteClass: null,
    zone: 'teahouse',
    label: 'Outdoor Terrace',
  },
  'serving-cart (1)': {
    dimensions: { w: 1, h: 1 },
    spriteClass: null,
    zone: 'teahouse',
    label: 'Serving Cart',
  },
  'stepping-stones': {
    dimensions: { w: 2, h: 2 },
    spriteClass: null,
    zone: 'teahouse',
    label: 'Stepping Stones',
  },
  'tea-counter': {
    dimensions: { w: 3, h: 1 },
    spriteClass: null,
    zone: 'teahouse',
    label: 'Tea Counter',
  },
  'tea-table': {
    dimensions: { w: 2, h: 1 },
    spriteClass: null,
    zone: 'teahouse',
    label: 'Tea Table',
  },
  'water-basin': {
    dimensions: { w: 1, h: 1 },
    spriteClass: null,
    zone: 'teahouse',
    label: 'Water Basin',
  },
  'wind-chime': {
    dimensions: { w: 1, h: 1 },
    spriteClass: null,
    zone: 'teahouse',
    label: 'Wind Chime',
  },
  'wisteria-trellis': {
    dimensions: { w: 1, h: 3 },
    spriteClass: null,
    zone: 'teahouse',
    label: 'Wisteria Trellis',
  },

  // ═══════════════════════════════════════════
  // SHARED ZONE (Effects & Neutral Objects)
  // ═══════════════════════════════════════════
  'level-up-effect': {
    dimensions: { w: 2, h: 2 },
    spriteClass: null,
    zone: 'shared',
    label: 'Level Up Effect',
  },
  'xp-orb': {
    dimensions: { w: 1, h: 1 },
    spriteClass: null,
    zone: 'shared',
    label: 'XP Orb',
  },
  'mailbox': {
    dimensions: { w: 1, h: 1 },
    spriteClass: null,
    zone: 'shared',
    label: 'Mailbox',
  },
  'street-lamp': {
    dimensions: { w: 1, h: 1 },
    spriteClass: null,
    zone: 'shared',
    label: 'Street Lamp',
  },
  'woodcrate': {
    dimensions: { w: 1, h: 1 },
    spriteClass: null,
    zone: 'shared',
    label: 'Wood Crate',
  },
  'wooden-bridge': {
    dimensions: { w: 3, h: 1 },
    spriteClass: null,
    zone: 'shared',
    label: 'Wooden Bridge',
  },

  // ═══════════════════════════════════════════
  // TILES (for static map background)
  // ═══════════════════════════════════════════
  'spritesheet': {
    dimensions: { w: 1, h: 1 },
    spriteClass: null,
    zone: 'tiles',
    label: 'Spritesheet',
  },
  // tile_000 through tile_114 (auto-generated below)
}

// Auto-populate tile entries (tile_000 to tile_114)
// ✅ All tiles available for placement as objects or ground painter
for (let i = 0; i <= 114; i++) {
  const key = `tile_${String(i).padStart(3, '0')}`
  ASSET_REGISTRY[key] = {
    dimensions: { w: 1, h: 1 },
    spriteClass: null,
    zone: 'tiles',
    label: `Tile ${i}`,
  }
}

// Auto-populate missing assets from manifest
// ✅ Any asset in assetManifest that's not in ASSET_REGISTRY gets a default entry
assetManifest.forEach(assetPath => {
  const fileName = assetPath.split('/').pop().replace('.png', '')
  const pathParts = assetPath.split('/')
  const zone = pathParts[2] || 'other' // Extract zone from path: src/assets/[ZONE]/...
  
  if (!ASSET_REGISTRY[fileName]) {
    // Create a human-readable label from the filename
    const label = fileName
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
    
    ASSET_REGISTRY[fileName] = {
      dimensions: { w: 1, h: 1 }, // Default 1x1; can be overridden manually
      spriteClass: null,
      zone,
      label,
    }
  }
})

// ✅ VALIDATION: Remove any registry entries that don't exist in manifest
// This prevents UI from trying to load deleted assets
const validKeys = new Set(
  assetManifest.map(path => path.split('/').pop().replace('.png', ''))
)

Object.keys(ASSET_REGISTRY).forEach(key => {
  if (!validKeys.has(key)) {
    console.warn(`⚠️  Removing deleted asset from registry: ${key}`)
    delete ASSET_REGISTRY[key]
  }
})

/**
 * Get dimensions (in tiles) for an asset key
 * Returns { w, h } where w=width in tiles, h=height in tiles
 */
export function getSpriteDimensions(assetKey) {
  const entry = ASSET_REGISTRY[assetKey]
  if (!entry) {
    console.warn(`Asset not in registry: ${assetKey}`)
    return { w: 1, h: 1 }
  }
  return entry.dimensions
}

/**
 * Get custom sprite class if one exists for this asset
 * Returns null if asset should use generic sprite
 */
export function getSpriteClass(assetKey) {
  const entry = ASSET_REGISTRY[assetKey]
  if (!entry) return null
  return entry.spriteClass || null
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

/**
 * Get all assets grouped by zone
 */
export function getAssetsByZone(zone) {
  return Object.entries(ASSET_REGISTRY)
    .filter(([, entry]) => entry.zone === zone)
    .map(([key, entry]) => ({ key, ...entry }))
}

/**
 * Get all unique zones
 */
export function getAllZones() {
  const zones = new Set()
  Object.values(ASSET_REGISTRY).forEach(entry => {
    zones.add(entry.zone)
  })
  return Array.from(zones).sort()
}
