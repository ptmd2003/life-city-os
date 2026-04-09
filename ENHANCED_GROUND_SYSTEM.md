## Enhanced Ground System — Usage Guide

### Overview
The new `EnhancedGroundSystem` replaces simple string-based tile arrays with rich **tile metadata** including type, elevation, and properties. Inspired by the YouTube tutorial's 3D isometric tiles + virtualord's terrain system.

**Key concepts:**
- **Tile Type**: grass, water, road, sand, forest, stone
- **Elevation**: 0-32px height (affects visual depth)
- **Variation**: 0-3 for subtle color shifts
- **Type Info**: Walkable status, movement cost, biome, animated flag

---

## Quick Start

### Get Tile Info
```javascript
import { getGroundInfo, getGroundType } from '../systems/GroundRender.js'

// Check what's at tile (10, 15)
const info = getGroundInfo(scene, 10, 15)
console.log(info)
// → { type: 'grass', elevation: 0, variation: 1, typeInfo: {...} }

// Just the type
const type = getGroundType(scene, 10, 15)
// → 'grass'
```

### Paint Tiles
```javascript
import { setGroundType } from '../systems/GroundRender.js'

// Paint single tile
setGroundType(scene, 10, 15, 'water')

// Fill region
import { fillGroundRegion } from '../systems/GroundRender.js'
fillGroundRegion(scene, 5, 5, 20, 20, 'sand')  // Fill 5-20 x 5-20 with sand
```

### Set Elevation
```javascript
import { setGroundElevation } from '../systems/GroundRender.js'

// Make tile elevated (affects depth sorting)
setGroundElevation(scene, 10, 15, 12)  // 12px height

// Elevation affects visual depth: taller tiles appear further back
```

---

## Tile Type System

### Available Types
| Type | Walkable | Cost | Biome | Use |
|------|----------|------|-------|-----|
| `grass` | ✅ Yes | 1.0 | meadow | Default terrain |
| `water` | ❌ No | 0 | aquatic | Impassable, animated |
| `road` | ✅ Yes | 0.5 | urban | Fastest travel |
| `sand` | ✅ Yes | 1.2 | desert | Slow travel |
| `forest` | ✅ Yes | 2.0 | forest | Dense, slow travel |
| `stone` | ✅ Yes | 1.5 | mountain | Mountain terrain |

### Access Type Info
```javascript
import { TileTypes } from '../systems/EnhancedGroundSystem.js'

const grassInfo = TileTypes['grass']
console.log(grassInfo)
// → {
//   name: 'Grass',
//   colors: { top: '#4e9a5e', left: '#3d7a4a', right: '#356842' },
//   walkable: true,
//   cost: 1,
//   biome: 'meadow'
// }

// Check if walkable
if (TileTypes[tileType].walkable) {
  // Allow pathfinding
}

// Get movement cost (for stamina drain)
const costPerTile = TileTypes[tileType].cost
```

---

## Metadata Management

### Tile Metadata Object
```javascript
import { getGroundMetadata } from '../systems/GroundRender.js'

const metadata = getGroundMetadata(scene, 10, 15)
// → TileMetadata {
//   type: 'grass',
//   elevation: 0,
//   variation: 1
// }

// Get color scheme
const colors = metadata.getColors()
// → { top: 'rgb(78, 154, 94)', left: '...', right: '...' }

// Get type info
const typeInfo = metadata.getTypeInfo()
// → { name: 'Grass', colors: {...}, walkable: true, ... }
```

---

## Integration Examples

### Example 1: Terrain Painting Tool
```javascript
// Player clicks tile at (x, y) with selected type
function paintTile(scene, x, y, selectedType) {
  setGroundType(scene, x, y, selectedType)
  
  // Optional: Cost stamina based on paintbrush size
  // Apply elevation variation
  const variation = Math.floor(Math.random() * 2)
  scene.groundMetadata.setTileVariation(x, y, variation)
}
```

### Example 2: Pathfinding AI
```javascript
import { getGroundInfo } from '../systems/GroundRender.js'

// Check if tile is walkable for pathfinding
function canWalk(scene, x, y) {
  const info = getGroundInfo(scene, x, y)
  return info?.typeInfo.walkable ?? false
}

// Calculate movement cost for A* algorithm
function getMovementCost(scene, x, y) {
  const info = getGroundInfo(scene, x, y)
  return info?.typeInfo.cost ?? 1
}
```

### Example 3: Stamina Drain Per Tile
```javascript
// When player/cat moves to new tile, drain mood/energy based on terrain
function onPlayerMovedToTile(scene, x, y) {
  const info = getGroundInfo(scene, x, y)
  const staminaCost = info.typeInfo.cost * 10  // Multiply for game balance
  
  // Drain from player mood
  WorldState.data.health.energy -= staminaCost
  console.log(`Stamina cost: ${staminaCost} (tile: ${info.type})`)
}
```

### Example 4: Biome-Based Effects
```javascript
// Apply seasonal effects based on tile biome
function applySeasonalEffect(scene, x, y) {
  const info = getGroundInfo(scene, x, y)
  
  if (info.typeInfo.biome === 'aquatic') {
    // Water freezes in winter
  } else if (info.typeInfo.biome === 'forest') {
    // Forest is lush in spring
  } else if (info.typeInfo.biome === 'desert') {
    // Desert shimmers in summer
  }
}
```

---

## Advanced: Format Migration

### Auto-Migration
When you load the game, old `groundLayout` (array of tile keys) automatically converts to new format:

```javascript
// Old format: ['tile_037', 'tile_water', ...]
// Auto-converts to: [TileMetadata('grass'), TileMetadata('water'), ...]
```

### Manual Migration
```javascript
import { EnhancedGroundLayout } from '../systems/EnhancedGroundSystem.js'

// Convert old groundLayout array
const oldLayout = useCityStore.getState().groundLayout
const newLayout = EnhancedGroundLayout.migrate(oldLayout)
```

### Export/Import Metadata
```javascript
// Save to store
const metadataArray = scene.groundMetadata.toArray()
// → [{ type: 'grass', elevation: 0, variation: 0 }, ...]

// Load from store
const restored = EnhancedGroundLayout.fromArray(metadataArray)
```

---

## Architecture

### Files
- `EnhancedGroundSystem.js` — Tile types, metadata classes, rendering helpers
- `GroundRender.js` — Integration with Phaser, sprite management

### Data Flow
```
Store (groundLayout)
  ↓
GroundRender.drawGround()
  ↓
EnhancedGroundLayout (scene.groundMetadata)
  ↓
TileMetadata objects (36×36 grid)
  ↓
Phaser Image Sprites 
  ↓ (with tint applied based on type)
Rendered on screen
```

---

## Future Features

### Procedural Canvas Rendering (Optional)
For more visual polish, could use Canvas to draw 3D tiles (like the tutorial video):
- Each tile renders as 3D diamond with top/left/right faces
- Elevation creates visible side faces
- Color variations provide visual interest

### Animated Tiles
Add animation for water/lava:
```javascript
if (TileTypes[type].animated) {
  sprite.play(`tile-${type}-anim`)
}
```

### Procedural Generation
Use terrain metadata for Perlin noise-based generation:
```javascript
generateTerrain(scene, {
  scale: 50,
  octaves: 4,
  persistence: 0.5
})
```

---

## Reference

### TileMetadata API
```javascript
class TileMetadata {
  constructor(type, elevation, variation)
  
  getTypeInfo()           // → TileTypes[type]
  getColors()            // → { top, left, right } (with variation applied)
  toJSON()              // → { type, elevation, variation }
  static fromJSON(data) // → TileMetadata
}
```

### GroundRender API
```javascript
// Read
getGroundMetadata(scene, x, y)           // → TileMetadata
getGroundType(scene, x, y)               // → type string
getGroundInfo(scene, x, y)               // → full info object

// Write
setGroundType(scene, x, y, type)         // → boolean
setGroundElevation(scene, x, y, elev)    // → boolean
updateGroundTileSprite(scene, x, y, key) // → void (legacy)
fillGroundRegion(scene, x1, y1, x2, y2, type) // → count
```

### EnhancedGroundLayout API
```javascript
new EnhancedGroundLayout(cols, rows)
  .getTile(x, y)              // → TileMetadata
  .setTile(x, y, metadata)    // → boolean
  .setTileType(x, y, type)    // → boolean
  .setTileElevation(x, y, elev) // → boolean
  .fillRegion(x1, y1, x2, y2, type)
  .toArray()                  // → JSON-serializable
  
EnhancedGroundLayout.fromArray(arr)          // → EnhancedGroundLayout
EnhancedGroundLayout.migrate(oldLayout)      // → EnhancedGroundLayout
```
