/**
 * EnhancedGroundSystem — Tile metadata + elevation + 3D rendering
 * 
 * Replaces simple groundLayout with rich tile metadata including:
 * - Tile type (grass, water, road, sand, forest, etc.)
 * - Elevation/height for 3D depth
 * - Color variations (top/left/right faces)
 * - Walkability, biome, and other properties
 * 
 * Adapted from virtualord's terrain system + YouTube tutorial approach
 */

/**
 * Tile type definitions with color schemes and properties
 */
export const TileTypes = {
  grass: {
    name: 'Grass',
    colors: { top: '#4e9a5e', left: '#3d7a4a', right: '#356842' },
    walkable: true,
    cost: 1,
    biome: 'meadow'
  },
  water: {
    name: 'Water',
    colors: { top: '#3579cc', left: '#2a5fa8', right: '#245090' },
    walkable: false,
    cost: 0,
    biome: 'aquatic',
    animated: true
  },
  road: {
    name: 'Road',
    colors: { top: '#4a4a5e', left: '#3a3a4a', right: '#2e2e3e' },
    walkable: true,
    cost: 0.5,
    biome: 'urban'
  },
  sand: {
    name: 'Sand',
    colors: { top: '#a89568', left: '#8a7a55', right: '#76694a' },
    walkable: true,
    cost: 1.2,
    biome: 'desert'
  },
  forest: {
    name: 'Forest',
    colors: { top: '#366640', left: '#2a5a32', right: '#224e2a' },
    walkable: true,
    cost: 2,
    biome: 'forest'
  },
  stone: {
    name: 'Stone',
    colors: { top: '#7a7a8a', left: '#5a5a6a', right: '#4a4a5a' },
    walkable: true,
    cost: 1.5,
    biome: 'mountain'
  }
}

/**
 * Single tile metadata object
 */
export class TileMetadata {
  constructor(type = 'grass', elevation = 0, variation = 0) {
    this.type = type
    this.elevation = elevation  // Height in pixels (0-32+ typical)
    this.variation = variation  // 0-3 for subtle color shifts
  }

  getTypeInfo() {
    return TileTypes[this.type] || TileTypes.grass
  }

  getColors() {
    const info = this.getTypeInfo()
    const colorShift = this.variation * 3  // Subtle brightness shift
    return {
      top: this._lighten(info.colors.top, colorShift),
      left: this._lighten(info.colors.left, colorShift - 5),
      right: this._lighten(info.colors.right, colorShift - 5)
    }
  }

  _lighten(hex, pct) {
    const n = parseInt(hex.replace('#', ''), 16)
    const r = Math.min(255, (n >> 16) + pct)
    const g = Math.min(255, ((n >> 8) & 0xff) + pct)
    const b = Math.min(255, (n & 0xff) + pct)
    return `rgb(${r},${g},${b})`
  }

  toJSON() {
    return {
      type: this.type,
      elevation: this.elevation,
      variation: this.variation
    }
  }

  static fromJSON(data) {
    return new TileMetadata(data.type || 'grass', data.elevation || 0, data.variation || 0)
  }
}

/**
 * Ground layout with rich tile metadata
 * Replaces simple string array with TileMetadata objects
 */
export class EnhancedGroundLayout {
  constructor(cols = 36, rows = 36) {
    this.cols = cols
    this.rows = rows
    this.tiles = []
    
    // Initialize with default grass
    for (let i = 0; i < cols * rows; i++) {
      this.tiles.push(new TileMetadata('grass', 0, 0))
    }
  }

  setTile(x, y, metadata) {
    if (x < 0 || x >= this.cols || y < 0 || y >= this.rows) return false
    const idx = y * this.cols + x
    this.tiles[idx] = metadata instanceof TileMetadata ? metadata : new TileMetadata(metadata)
    return true
  }

  getTile(x, y) {
    if (x < 0 || x >= this.cols || y < 0 || y >= this.rows) return null
    return this.tiles[y * this.cols + x]
  }

  setTileType(x, y, type) {
    const tile = this.getTile(x, y)
    if (!tile) return false
    tile.type = type
    return true
  }

  setTileElevation(x, y, elevation) {
    const tile = this.getTile(x, y)
    if (!tile) return false
    tile.elevation = Math.max(0, Math.min(32, elevation))
    return true
  }

  setTileVariation(x, y, variation) {
    const tile = this.getTile(x, y)
    if (!tile) return false
    tile.variation = Math.max(0, Math.min(3, variation))
    return true
  }

  /**
   * Fill a rectangular region with a tile type
   */
  fillRegion(x1, y1, x2, y2, type) {
    const minX = Math.max(0, Math.min(x1, x2))
    const maxX = Math.min(this.cols - 1, Math.max(x1, x2))
    const minY = Math.max(0, Math.min(y1, y2))
    const maxY = Math.min(this.rows - 1, Math.max(y1, y2))

    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        this.setTileType(x, y, type)
      }
    }
  }

  /**
   * Export to store-compatible format
   */
  toArray() {
    return this.tiles.map(tile => tile.toJSON())
  }

  /**
   * Import from store format
   */
  static fromArray(arr, cols = 36, rows = 36) {
    const layout = new EnhancedGroundLayout(cols, rows)
    layout.tiles = arr.map(data => TileMetadata.fromJSON(data))
    return layout
  }

  /**
   * Convert old string-based groundLayout to new format
   */
  static migrate(oldGroundLayout, cols = 36, rows = 36) {
    const layout = new EnhancedGroundLayout(cols, rows)
    
    // Map old tile keys to new types
    const tileKeyToType = {
      'tile_037': 'grass',  // Default grass
      'tile_water': 'water',
      'tile_road': 'road',
      'tile_sand': 'sand',
      'tile_forest': 'forest'
    }

    for (let i = 0; i < oldGroundLayout.length; i++) {
      const oldKey = oldGroundLayout[i]
      const type = tileKeyToType[oldKey] || 'grass'
      layout.tiles[i] = new TileMetadata(type, 0, Math.floor(Math.random() * 2))
    }

    return layout
  }
}

/**
 * Procedural tile rendering (like the tutorial)
 * Draws 3D isometric tiles with elevation
 */
export function drawTileWithElevation(ctx, x, y, tileW, tileH, elevation, colors, isHovered = false) {
  const halfW = tileW / 2
  const halfH = tileH / 2

  // Top face (diamond)
  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.lineTo(x + halfW, y + halfH)
  ctx.lineTo(x, y + tileH)
  ctx.lineTo(x - halfW, y + halfH)
  ctx.closePath()
  
  ctx.fillStyle = isHovered ? lightenColor(colors.top, 30) : colors.top
  ctx.fill()
  
  // Grid lines
  ctx.strokeStyle = 'rgba(0,0,0,0.15)'
  ctx.lineWidth = 0.5
  ctx.stroke()

  // Left face (if elevation > 0)
  if (elevation > 0) {
    ctx.beginPath()
    ctx.moveTo(x - halfW, y + halfH)
    ctx.lineTo(x, y + tileH)
    ctx.lineTo(x, y + tileH + elevation)
    ctx.lineTo(x - halfW, y + halfH + elevation)
    ctx.closePath()
    ctx.fillStyle = isHovered ? lightenColor(colors.left, 20) : colors.left
    ctx.fill()
    ctx.strokeStyle = 'rgba(0,0,0,0.2)'
    ctx.lineWidth = 0.5
    ctx.stroke()
  }

  // Right face (if elevation > 0)
  if (elevation > 0) {
    ctx.beginPath()
    ctx.moveTo(x + halfW, y + halfH)
    ctx.lineTo(x, y + tileH)
    ctx.lineTo(x, y + tileH + elevation)
    ctx.lineTo(x + halfW, y + halfH + elevation)
    ctx.closePath()
    ctx.fillStyle = isHovered ? lightenColor(colors.right, 20) : colors.right
    ctx.fill()
    ctx.strokeStyle = 'rgba(0,0,0,0.2)'
    ctx.lineWidth = 0.5
    ctx.stroke()
  }
}

/**
 * Draw hover highlight
 */
export function drawTileHover(ctx, x, y, tileW, tileH) {
  const halfW = tileW / 2
  const halfH = tileH / 2

  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.lineTo(x + halfW, y + halfH)
  ctx.lineTo(x, y + tileH)
  ctx.lineTo(x - halfW, y + halfH)
  ctx.closePath()
  
  ctx.fillStyle = 'rgba(126,184,247,0.18)'
  ctx.fill()
  ctx.strokeStyle = 'rgba(126,184,247,0.7)'
  ctx.lineWidth = 1.5
  ctx.stroke()
}

/**
 * Helper: lighten a color by percentage
 */
function lightenColor(hex, pct) {
  // Handle both #RRGGBB and rgb() formats
  let r, g, b

  if (hex.startsWith('#')) {
    const n = parseInt(hex.slice(1), 16)
    r = (n >> 16) & 0xff
    g = (n >> 8) & 0xff
    b = n & 0xff
  } else if (hex.startsWith('rgb')) {
    const match = hex.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
    if (match) {
      r = parseInt(match[1])
      g = parseInt(match[2])
      b = parseInt(match[3])
    } else {
      return hex
    }
  } else {
    return hex
  }

  r = Math.min(255, r + pct)
  g = Math.min(255, g + pct)
  b = Math.min(255, b + pct)

  return `rgb(${r},${g},${b})`
}

export { lightenColor }
