import { create } from 'zustand'

/**
 * Editor Store — transient UI state for the city editor.
 *
 * NEVER persisted. Separate from WorldDocument (permanent data).
 *
 * Rule:
 *   "Is this permanent game/map data, or just temporary editor UI?"
 *   - Permanent  → WorldDocument  (useCityStore.world)
 *   - Temporary  → here
 *   - Visual only → Phaser scene
 *
 * @typedef {'select'|'paint-ground'|'paint-overlay'|'place-object'|'erase'} EditorTool
 *
 * @typedef {Object} BrushState
 * @property {string}              tileKey - Active tile to paint
 * @property {1|2|3}              radius  - Paint brush radius in tiles
 * @property {'ground'|'overlay'} layer   - Which layer to paint
 *
 * @typedef {Object} HistoryEntry
 * @property {WorldCommand} command   - The command that was applied
 * @property {WorldDocument} prevWorld - World state BEFORE the command
 */
export const useEditorStore = create((set, get) => ({

  // --- Current tool ---
  /** @type {EditorTool} */
  activeTool: 'select',

  // --- Selection ---
  /** @type {string|null} ID of the selected world object */
  selectedObjectId: null,
  /** @type {{ x: number, y: number }|null} Tile under the pointer */
  hoveredTile: null,

  // --- Placement ---
  /**
   * Partial WorldObject template set when the user picks from the palette.
   * The scene shows a ghost preview; clicking commits a PLACE_OBJECT command.
   * @type {object|null}
   */
  pendingPlacement: null,

  // --- Clipboard ---
  /** @type {{ type: 'object', objectId: string }|null} */
  clipboard: null,

  // --- Ground brush ---
  /** @type {BrushState} */
  brush: {
    tileKey: 'tile_037',
    radius: 1,
    layer: 'ground',
  },

  // --- Undo / redo history ---
  // Each entry: { command, prevWorld }
  // history[last] = most recent action
  // future[last]  = most recent undone action
  /** @type {HistoryEntry[]} */
  history: [],
  /** @type {HistoryEntry[]} */
  future: [],

  // =========================================================================
  // Tool actions
  // =========================================================================

  /** Switch active tool. Clears pending placement automatically. */
  setActiveTool: (tool) => set({ activeTool: tool, pendingPlacement: null }),

  selectObject: (id) => set({ selectedObjectId: id }),
  deselectObject: () => set({ selectedObjectId: null }),

  setHoveredTile: (tile) => set({ hoveredTile: tile }),

  /**
   * Begin a placement flow: show ghost preview in Phaser until user clicks.
   * @param {object} template - Partial WorldObject (without id/x/y)
   */
  setPendingPlacement: (template) =>
    set({ pendingPlacement: template, activeTool: 'place-object' }),

  clearPendingPlacement: () => set({ pendingPlacement: null }),

  /** Update one or more brush properties. */
  setBrush: (updates) =>
    set(state => ({ brush: { ...state.brush, ...updates } })),

  setClipboard: (item) => set({ clipboard: item }),

  // =========================================================================
  // History actions
  // =========================================================================

  /**
   * Record a command in history BEFORE applying it to the world.
   * Clears the redo (future) stack — new action invalidates future.
   *
   * @param {WorldCommand}  command
   * @param {WorldDocument} prevWorld - World state before the command runs
   */
  pushHistory: (command, prevWorld) =>
    set(state => ({
      history: [...state.history.slice(-49), { command, prevWorld }],
      future: [],
    })),

  /**
   * Record a command in history WITHOUT clearing the redo stack.
   * Used internally by redoNextCommand so future entries survive.
   *
   * @param {HistoryEntry} entry
   */
  pushHistoryOnly: (entry) =>
    set(state => ({
      history: [...state.history.slice(-49), entry],
    })),

  /**
   * Pop the most recent history entry (for undo).
   * @returns {HistoryEntry|null}
   */
  popHistory: () => {
    const { history } = get()
    if (!history.length) return null
    const entry = history[history.length - 1]
    set({ history: history.slice(0, -1) })
    return entry
  },

  /**
   * Push an entry onto the future (redo) stack.
   * @param {HistoryEntry} entry
   */
  pushFuture: (entry) =>
    set(state => ({ future: [...state.future, entry] })),

  /**
   * Pop the most recent future entry (for redo).
   * @returns {HistoryEntry|null}
   */
  popFuture: () => {
    const { future } = get()
    if (!future.length) return null
    const entry = future[future.length - 1]
    set({ future: future.slice(0, -1) })
    return entry
  },

  /** Whether there are commands available to undo. */
  canUndo: () => get().history.length > 0,
  /** Whether there are commands available to redo. */
  canRedo: () => get().future.length > 0,
}))
