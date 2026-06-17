// ============================================================
// World Commands — command types and reducer for WorldDocument
//
// All map/world mutations should go through runWorldCommand().
// This makes undo/redo, export/import, and Phaser re-rendering
// straightforward: Phaser renders the document, not its own state.
//
// Rule:
//   Permanent data  → WorldDocument  (useCityStore.world)
//   Temporary UI    → EditorState    (useEditorStore)
//   Visual only     → Phaser scene
// ============================================================

/** Default tile key used for unpainted tiles in the sparse ground layer */
export const DEFAULT_TILE = 'tile_037'

/**
 * Create a fresh WorldDocument matching the current 36×36 dimetric grid.
 * Layers are sparse: only tiles/objects that differ from defaults are stored.
 * @returns {WorldDocument}
 */
export function createDefaultWorld() {
  return {
    version: 1,
    meta: {
      name: 'Life City',
      gridWidth: 36,
      gridHeight: 36,
      tileWidth: 44,
      tileHeight: 32,
      projection: 'dimetric-2-1',
    },
    layers: {
      /** Sparse ground tile overrides. Tiles not listed use DEFAULT_TILE. */
      ground: [],   // { x, y, tile, variant? }[]
      /** Sparse flat overlay tiles (painted on top of ground). */
      overlay: [],  // { x, y, tile }[]
      /** Placed world objects (buildings, decorations, trees, props). */
      objects: [],  // WorldObject[]
    },
    unlockState: {}, // { [objectId]: boolean }
    worldState: {
      health: 100,
      darknessLevel: 0,
    },
  }
}

/**
 * Command type constants.
 * Always dispatch one of these via useCityStore.applyCommand().
 */
export const CMD = Object.freeze({
  // Ground layer
  PAINT_GROUND:   'PAINT_GROUND',   // { x, y, tile, variant? }
  ERASE_GROUND:   'ERASE_GROUND',   // { x, y }
  // Overlay layer
  PAINT_OVERLAY:  'PAINT_OVERLAY',  // { x, y, tile }
  ERASE_OVERLAY:  'ERASE_OVERLAY',  // { x, y }
  // Objects
  PLACE_OBJECT:   'PLACE_OBJECT',   // { object: WorldObject }
  MOVE_OBJECT:    'MOVE_OBJECT',    // { id, x, y }
  ROTATE_OBJECT:  'ROTATE_OBJECT',  // { id, rotation }
  SCALE_OBJECT:   'SCALE_OBJECT',   // { id, scale }
  DELETE_OBJECT:  'DELETE_OBJECT',  // { id }
  // World state
  SET_WORLD_HEALTH: 'SET_WORLD_HEALTH', // { health: 0–100 }
  SET_UNLOCK:       'SET_UNLOCK',       // { objectId, unlocked: boolean }
})

// ---- helpers ---------------------------------------------------------------

/** Upsert a tile cell by (x, y) key. Returns new array. */
function upsertTile(tiles, cell) {
  const idx = tiles.findIndex(t => t.x === cell.x && t.y === cell.y)
  if (idx !== -1) {
    const next = [...tiles]
    next[idx] = { ...next[idx], ...cell }
    return next
  }
  return [...tiles, cell]
}

/** Remove a tile cell at (x, y). Returns new array. */
function removeTile(tiles, x, y) {
  return tiles.filter(t => !(t.x === x && t.y === y))
}

// ---- reducer ---------------------------------------------------------------

/**
 * Pure reducer: apply one command to a WorldDocument and return the next state.
 * Does NOT mutate. Safe to call multiple times for undo/redo preview.
 *
 * @param {WorldDocument} world
 * @param {WorldCommand}  command
 * @returns {WorldDocument}
 */
export function runWorldCommand(world, command) {
  switch (command.type) {

    case CMD.PAINT_GROUND:
      return {
        ...world,
        layers: {
          ...world.layers,
          ground: upsertTile(world.layers.ground, {
            x: command.x,
            y: command.y,
            tile: command.tile,
            variant: command.variant ?? 0,
          }),
        },
      }

    case CMD.ERASE_GROUND:
      return {
        ...world,
        layers: {
          ...world.layers,
          ground: removeTile(world.layers.ground, command.x, command.y),
        },
      }

    case CMD.PAINT_OVERLAY:
      return {
        ...world,
        layers: {
          ...world.layers,
          overlay: upsertTile(world.layers.overlay, {
            x: command.x,
            y: command.y,
            tile: command.tile,
          }),
        },
      }

    case CMD.ERASE_OVERLAY:
      return {
        ...world,
        layers: {
          ...world.layers,
          overlay: removeTile(world.layers.overlay, command.x, command.y),
        },
      }

    case CMD.PLACE_OBJECT:
      return {
        ...world,
        layers: {
          ...world.layers,
          objects: [...world.layers.objects, command.object],
        },
      }

    case CMD.MOVE_OBJECT:
      return {
        ...world,
        layers: {
          ...world.layers,
          objects: world.layers.objects.map(obj =>
            obj.id === command.id ? { ...obj, x: command.x, y: command.y } : obj
          ),
        },
      }

    case CMD.ROTATE_OBJECT:
      return {
        ...world,
        layers: {
          ...world.layers,
          objects: world.layers.objects.map(obj =>
            obj.id === command.id ? { ...obj, rotation: command.rotation } : obj
          ),
        },
      }

    case CMD.SCALE_OBJECT:
      return {
        ...world,
        layers: {
          ...world.layers,
          objects: world.layers.objects.map(obj =>
            obj.id === command.id ? { ...obj, scale: command.scale } : obj
          ),
        },
      }

    case CMD.DELETE_OBJECT:
      return {
        ...world,
        layers: {
          ...world.layers,
          objects: world.layers.objects.filter(obj => obj.id !== command.id),
        },
      }

    case CMD.SET_WORLD_HEALTH:
      return {
        ...world,
        worldState: {
          ...world.worldState,
          health: Math.max(0, Math.min(100, command.health)),
        },
      }

    case CMD.SET_UNLOCK:
      return {
        ...world,
        unlockState: {
          ...world.unlockState,
          [command.objectId]: command.unlocked,
        },
      }

    default:
      return world
  }
}

// ---- selectors -------------------------------------------------------------

/**
 * Build an O(1) tile lookup Map from a sparse ground layer.
 * Key: `"x,y"` → tile key string.
 * Missing entries fall back to DEFAULT_TILE.
 *
 * @param {Array} groundLayer - world.layers.ground
 * @returns {Map<string, string>}
 */
export function buildGroundLookup(groundLayer) {
  const map = new Map()
  for (const cell of groundLayer) {
    map.set(`${cell.x},${cell.y}`, cell.tile)
  }
  return map
}

/**
 * Derive a flat 36×36 groundLayout array from the sparse world.layers.ground.
 * Used for backward-compat sync so old systems reading groundLayout still work.
 *
 * @param {Array}  groundLayer
 * @param {number} cols - default 36
 * @param {number} rows - default 36
 * @returns {string[]}
 */
export function worldGroundToFlatLayout(groundLayer, cols = 36, rows = 36) {
  const layout = Array(cols * rows).fill(DEFAULT_TILE)
  for (const cell of groundLayer) {
    if (cell.x >= 0 && cell.x < cols && cell.y >= 0 && cell.y < rows) {
      layout[cell.y * cols + cell.x] = cell.tile
    }
  }
  return layout
}

/**
 * Migrate an old flat groundLayout string array to a sparse world ground layer.
 * Only non-default tiles are stored.
 *
 * @param {string[]} flatLayout
 * @param {number}   cols - default 36
 * @returns {{ x: number, y: number, tile: string, variant: number }[]}
 */
export function flatLayoutToWorldGround(flatLayout, cols = 36) {
  const result = []
  for (let i = 0; i < flatLayout.length; i++) {
    const tile = flatLayout[i]
    if (tile && tile !== DEFAULT_TILE) {
      result.push({ x: i % cols, y: Math.floor(i / cols), tile, variant: 0 })
    }
  }
  return result
}
