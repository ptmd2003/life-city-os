import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { cityLayout as defaultCityLayout } from '../game/map/cityLayout.js'
import { createDefaultGroundLayout, setGroundTileAt } from '../game/map/groundLayout.js'
import { TimeSystem } from '../game/world/TimeSystem.js'
import logger from '../game/logger.js'

// bump this whenever the default layout file changes so that
// persisted copies (from localStorage) can be migrated or reset
const LAYOUT_VERSION = 1

/**
 * City Store — Game state management for the city simulation
 * Handles city layout, building placement, ground editing, time sync, and UI state.
 * 
 * State Shape:
 * @typedef {Object} CityStoreState
 * @property {Phaser.Game|null} phaserGame - Reference to the Phaser game instance
 * @property {boolean} _hydrated - Track if localStorage rehydration is complete
 * @property {Object} districts - District progression tracking (health, knowledge, garden)
 * @property {number} districts[key].xp - Experience points for the district
 * @property {number} districts[key].level - Current level (calculated from XP)
 * @property {number} districts[key].streak - Completion streak count
 * @property {Array<Object>} cityLayout - Array of building objects on the map
 * @property {number} layoutVersion - Current layout schema version
 * @property {Array<Object>} layoutVersions - Version history for reverting layouts
 * @property {Array<string>} groundLayout - 36×36 grid of ground tile keys
 * @property {Array<string|null>} flatTileLayout - 36×36 grid for flat overlay tiles
 * @property {string} selectedGroundTile - Currently selected tile for painting
 * @property {boolean} groundPaintMode - Are we in ground paint mode?

 * @property {Object} currentTime - Current time {hour, minute}
 * @property {string} timePeriod - Formatted time period emoji (e.g. '🌙 Night')
 * @property {string} seasonName - Current season emoji + name (e.g. '🌸 Spring')
 * @property {Object|null} selectedBuilding - Currently selected building or null
 * @property {string|null} transformMode - 'rotate' | 'resize' | null
 * @property {Object} transformValue - {rotate: number, scale: number}
 * @property {boolean} showStoragePanel - Toggle storage view visibility
 * @property {boolean} showAnalyticsPanel - Toggle analytics insights panel visibility
 * 
 * @hook
 * @returns {CityStoreState & Object<string, Function>} Store state + actions
 */
export const useCityStore = create(
  persist(
    (set, get) => ({
      phaserGame: null,               // will hold the Phaser game instance
      _hydrated: false,               // ✅ Track if rehydration is complete
      districts: {
        health:    { xp: 0, level: 1, streak: 0 },
        knowledge: { xp: 0, level: 1, streak: 0 },
        garden:    { xp: 0, level: 1, streak: 0 },
      },
      cityLayout: defaultCityLayout,  // current city layout
      layoutVersion: LAYOUT_VERSION,
      layoutVersions: [],             // ✅ Version history: [{ id, timestamp, note, layout }, ...]

      // ✅ Ground editing state
      groundLayout: createDefaultGroundLayout(), // 36×36 grid of tile keys
      flatTileLayout: Array(36 * 36).fill(null), // 36×36 grid for flat overlay tiles (empty by default)
      selectedGroundTile: 'tile_037',  // currently selected tile for painting
      groundPaintMode: false,          // are we in ground paint mode?


      // ⏱️ Time state (synced from TimeSystem)
      currentTime: { hour: 0, minute: 0 },
      timePeriod: '🌙 Night',
      seasonName: '🌸 Spring',

      // ✅ Transform UI state
      selectedBuilding: null,         // { type, id, sprite, tileX, tileY, ... }
      transformMode: null,            // 'rotate' | 'resize' | null
      transformValue: { rotate: 0, scale: 1.0 },
      showStoragePanel: false,        // ✅ Toggle storage view
      showAnalyticsPanel: false,      // ✅ Toggle analytics insights panel
      buildMode: true,                // ✅ 'true' = build mode (can change), 'false' = view mode (read-only)

      /**
       * Set the Phaser game instance reference
       * @param {Phaser.Game} game - The game instance
       */
      setPhaserGame: (game) => set({ phaserGame: game }),

      /**
       * Sync time state from TimeSystem singleton
       * Updates currentTime, timePeriod, and seasonName from the game time system
       */
      updateTime: () => {
        const timeSystem = TimeSystem.getInstance()
        set({
          currentTime: {
            hour: timeSystem.getHour(),
            minute: timeSystem.getMinute(),
          },
          timePeriod: timeSystem.getTimePeriod(),
          seasonName: timeSystem.getSeasonName(),
        })
      },

      /**
       * Select a building and reset transform mode
       * @param {Object|null} building - The building object to select (or null to deselect)
       */
      setSelectedBuilding: (building) => {
        set({ 
          selectedBuilding: building,
          transformMode: null,
          transformValue: { rotate: 0, scale: 1.0 }
        })
      },

      /**
       * Set the transform mode for selected building
       * @param {string|null} mode - 'rotate' | 'resize' | null
       */
      setTransformMode: (mode) => set({ transformMode: mode }),

      /**
       * Set transform values for selected building
       * @param {Object} value - {rotate: number (degrees), scale: number (0.5-2.0)}
       */
      setTransformValue: (value) => set({ transformValue: value }),

      /**
       * Deselect the current building and reset transform state
       */
      deselectBuilding: () => set({ 
        selectedBuilding: null,
        transformMode: null,
        transformValue: { rotate: 0, scale: 1.0 }
      }),

      /**
       * Toggle the storage panel visibility
       * @param {boolean} show - Show or hide the panel
       */
      setShowStoragePanel: (show) => set({ showStoragePanel: show }),

      /**
       * Toggle build mode (true = can modify, false = view only)
       * @param {boolean} enabled - Enable or disable build mode
       */
      setBuildMode: (enabled) => set({ buildMode: enabled }),

      /**
       * Toggle the analytics panel visibility
       * @param {boolean} show - Show or hide the panel
       */
      setShowAnalyticsPanel: (show) => set({ showAnalyticsPanel: show }),

      /**
       * Add a new sprite/building to the layout at canvas center (18, 18)
       * Emits 'spawn-building' event to CityScene to render the sprite
       * @param {string} assetKey - The asset key for the building (e.g. 'building_house')
       */
      addSpriteToLayout: (assetKey) => {
        // ✅ Add new sprite at canvas center (18, 18)
        const state = get()
        if (!state.phaserGame) {
          logger.warn('No phaserGame instance')
          return
        }

        const scene = state.phaserGame.scene.getScene('CityScene')
        if (!scene) {
          logger.warn('CityScene not found')
          return
        }

        // Canvas center: (18, 18) on 36x36 grid
        const centerTileX = 18
        const centerTileY = 18
        logger.debug(`Adding sprite at canvas center (${centerTileX}, ${centerTileY})`)

        // Create new building object
        // ✅ Consistent ID format: type-x-y (no timestamps)
        const newBuilding = {
          type: assetKey,
          x: centerTileX,
          y: centerTileY,
          scale: 1.0,
          angle: 0,
          locked: false,  // 🔓 Initialize lock state
          id: assetKey + '-' + centerTileX + '-' + centerTileY
        }

        // Add to layout
        const newLayout = [...state.cityLayout, newBuilding]
        state.updateCityLayoutMemory(newLayout)

        // Emit event to spawn the sprite in scene
        logger.debug(`Emitting spawn-building event`)
        scene.events.emit('spawn-building', newBuilding)

        logger.info(`Added ${assetKey}`)
      },

      /**
       * Update a single building in the layout by ID (atomic, prevents data loss)
       * All mutation paths (drag, transform, delete) should use this single function
       * @param {string} buildingId - Building ID in format 'type-x-y'
       * @param {Object} changes - Properties to update {scale, angle, depthOffset, x, y, ...}
       * @returns {boolean} True if building found and updated, false otherwise
       */
      updateBuildingInLayout: (buildingId, changes) => {
        const state = get()
        const buildingIndex = state.cityLayout.findIndex(b => b.id === buildingId)
        
        if (buildingIndex === -1) {
          logger.warn(`Building ${buildingId} not found in layout`)
          return false
        }
        
        // Atomic update: merge changes into found building
        const updatedLayout = state.cityLayout.map((b, idx) => 
          idx === buildingIndex ? { ...b, ...changes } : b
        )
        
        set({ cityLayout: updatedLayout })
        logger.debug(`Updated ${buildingId}`, changes)
        return true
      },

      /**
       * Update city layout in-memory (not persisted yet — use saveLayout to persist)
       * @param {Array<Object>} newLayout - New building array
       */
      updateCityLayoutMemory: (newLayout) => {
        set({ cityLayout: newLayout })
        logger.debug('State updated (not persisted yet)')
      },

      /**
       * Update city layout (wrapper around updateCityLayoutMemory)
       * @param {Array<Object>} newLayout - New building array
       */
      updateCityLayout: (newLayout) => {
        get().updateCityLayoutMemory(newLayout)
      },

      /**
       * Log activity for a district and update XP/streak
       * Emits 'update-district' event to Phaser for visual feedback
       * @param {string} district - District name ('health', 'knowledge', 'garden')
       */
      logActivity: (district) => set((state) => {
        const current = state.districts[district]
        const newXp = current.xp + 10

        // 🎮 Tell Phaser to flash the building
        if (state.phaserGame) {
          state.phaserGame.events.emit('update-district', { district, xp: newXp })
        }

        return {
          districts: {
            ...state.districts,
            [district]: {
              xp: newXp,
              level: Math.floor(newXp / 100) + 1,
              streak: current.streak + 1,
            }
          }
        }
      }),

      /**
       * Reset city layout to default (from cityLayout.js)
       */
      resetToDefaultLayout: () => {
        logger.info('Resetting to default layout')
        set({ cityLayout: defaultCityLayout, layoutVersion: LAYOUT_VERSION })
      },

      /**
       * Save current city layout as timestamped version snapshot
       * Keeps last 10 versions in history, persists to localStorage
       * @param {string} [note=''] - Optional description of the version
       */
      saveLayout: (note = '') => {
        // ✅ Create timestamped snapshot with optional note
        const state = get()
        const versionId = Date.now()
        const timestamp = new Date().toLocaleString()
        
        const snapshot = {
          id: versionId,
          timestamp,
          note: note || '',
          layout: JSON.parse(JSON.stringify(state.cityLayout)) // Deep copy
        }
        
        // Add to history (keep last 10 versions)
        const newVersions = [snapshot, ...state.layoutVersions].slice(0, 10)
        set({ layoutVersions: newVersions })
        
        // Persist to localStorage
        const saveData = {
          districts: state.districts,
          cityLayout: state.cityLayout,
          layoutVersion: LAYOUT_VERSION,
          layoutVersions: newVersions
        }
        localStorage.setItem('life-city-os-save', JSON.stringify(saveData))
        logger.info(`Saved ${state.cityLayout.length} objects`)
      },

      /**
       * Restore a previous layout version by ID
       * Updates cityLayout and persists the change
       * @param {number} versionId - Timestamp ID of the version to restore
       */
      revertToVersion: (versionId) => {
        // ✅ Restore a previous layout snapshot
        const state = get()
        const version = state.layoutVersions.find(v => v.id === versionId)
        
        if (!version) {
          logger.warn(`Version ${versionId} not found`)
          return
        }
        
        set({ cityLayout: JSON.parse(JSON.stringify(version.layout)) })
        logger.info(`Reverted to version from ${version.timestamp}`)
        
        // Persist the reverted layout
        const saveData = {
          districts: state.districts,
          cityLayout: version.layout,
          layoutVersion: LAYOUT_VERSION,
          layoutVersions: state.layoutVersions
        }
        localStorage.setItem('life-city-os-save', JSON.stringify(saveData))
      },

      /**
       * Toggle lock state for the currently selected building
       * Prevents locked buildings from being moved or edited
       */
      toggleBuildingLock: () => {
        // ✅ Toggle lock state for selected building
        const state = get()
        if (!state.selectedBuilding) {
          logger.warn('No building selected')
          return
        }

        const newLockedState = !state.selectedBuilding.locked
        logger.info(`${state.selectedBuilding.type} is now ${newLockedState ? 'LOCKED' : 'UNLOCKED'}`)

        // Update cityLayout with new lock state
        const updatedLayout = state.cityLayout.map(b => {
          if (b.type === state.selectedBuilding.type && 
              b.x === state.selectedBuilding.x && 
              b.y === state.selectedBuilding.y) {
            return { ...b, locked: newLockedState }
          }
          return b
        })
        state.updateCityLayoutMemory(updatedLayout)

        // ✅ Also update scene.placedBuildings so it stays in sync
        if (state.phaserGame) {
          const scene = state.phaserGame.scene.getScene('CityScene')
          if (scene?.placedBuildings) {
            scene.placedBuildings.forEach(building => {
              if (building.type === state.selectedBuilding.type &&
                  building.x === state.selectedBuilding.x &&
                  building.y === state.selectedBuilding.y) {
                building.locked = newLockedState
              }
            })
          }
        }

        // ✅ Preserve all selectedBuilding properties (sprite, tileX, tileY, etc) and just toggle locked
        set({ selectedBuilding: { ...state.selectedBuilding, locked: newLockedState } })
      },

      /**
       * Set the currently selected ground tile for painting
       * @param {string} tileKey - Asset key of the tile (e.g. 'tile_037')
       */
      setSelectedGroundTile: (tileKey) => {
        set({ selectedGroundTile: tileKey })
        logger.debug(`Selected tile: ${tileKey}`)
      },

      /**
       * Toggle ground paint mode on/off
       * @param {boolean} enabled - Enable or disable paint mode
       */
      setGroundPaintMode: (enabled) => {
        set({ groundPaintMode: enabled })
        logger.debug(`Paint mode: ${enabled ? 'ON' : 'OFF'}`)
      },

      /**
       * Paint a ground tile at grid position
       * @param {number} x - Grid X coordinate (0-35)
       * @param {number} y - Grid Y coordinate (0-35)
       * @param {string} tileKey - Tile asset key to paint
       */
      paintGroundTile: (x, y, tileKey) => {
        // ✅ Paint a single ground tile at (x, y)
        const state = get()
        const newGroundLayout = setGroundTileAt(state.groundLayout, x, y, tileKey)
        set({ groundLayout: newGroundLayout })
        logger.debug(`Painted (${x}, ${y}) with ${tileKey}`)
      },

      /**
       * Set which ground tile layer to paint on
       * @param {string} mode - 'full' (base tiles) | 'flat' (overlay tiles)
       */


      /**
       * Paint a flat overlay tile at grid position
       * @param {number} x - Grid X coordinate (0-35)
       * @param {number} y - Grid Y coordinate (0-35)
       * @param {string|null} tileKey - Tile asset key to paint (or null to clear)
       */
      paintFlatTile: (x, y, tileKey) => {
        // ✅ Paint a flat tile overlay at (x, y)
        if (x < 0 || x >= 36 || y < 0 || y >= 36) return
        const state = get()
        const tileIndex = y * 36 + x
        const newFlatLayout = [...state.flatTileLayout]
        newFlatLayout[tileIndex] = tileKey
        set({ flatTileLayout: newFlatLayout })
        console.log(`✨ [paintFlatTile] Painted flat overlay (${x}, ${y}) with ${tileKey}`)
      },

      /**
       * Update ground layout in-memory (not persisted yet)
       * @param {Array<string>} newGroundLayout - New 36×36 grid of tile keys
       */
      updateGroundLayoutMemory: (newGroundLayout) => {
        set({ groundLayout: newGroundLayout })
        console.log('🗺️ [updateGroundLayoutMemory] Ground state updated (not persisted yet)')
      },
    }),
    {
      name: 'life-city-os-save',
      // ✅ CRITICAL: Only persist data, NOT the _hydrated flag to avoid race conditions
      partialize: (state) => ({
        districts: state.districts,
        cityLayout: state.cityLayout,
        groundLayout: state.groundLayout,
        layoutVersion: state.layoutVersion,
        layoutVersions: state.layoutVersions
      }),
      // ✅ Callback runs AFTER persisted data is loaded from localStorage
      onRehydrateStorage: () => (state) => {
        logger.debug('Hydrating from localStorage')
        
        // Validate version matches
        if (state && state.layoutVersion !== LAYOUT_VERSION) {
          logger.warn(`Version mismatch. Saved: ${state.layoutVersion}, Expected: ${LAYOUT_VERSION}`)
          logger.info('Resetting to default')
          state.cityLayout = defaultCityLayout
          state.layoutVersion = LAYOUT_VERSION
        } else if (state?.cityLayout?.length > 0) {
          logger.info(`Loaded ${state.cityLayout.length} objects from saved layout`)
        } else {
          logger.info('Using default layout')
        }
        
        // 🔓 Migration: Ensure all buildings have locked property (for backward compatibility)
        if (state?.cityLayout) {
          state.cityLayout = state.cityLayout.map(building => ({
            ...building,
            locked: building.locked ?? false  // Default to unlocked if missing
          }))
          logger.debug('Ensured all buildings have locked property')
        }
        
        // ✅ NOW mark hydration complete (AFTER data is loaded)
        state._hydrated = true
      }
    }
  )
)

