import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { cityLayout as defaultCityLayout } from '../game/map/cityLayout.js'
import { createDefaultGroundLayout, setGroundTileAt } from '../game/map/groundLayout.js'

// bump this whenever the default layout file changes so that
// persisted copies (from localStorage) can be migrated or reset
const LAYOUT_VERSION = 1

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
      groundTileMode: 'full',          // 'full' | 'flat' — which layer to paint

      // ✅ Transform UI state
      selectedBuilding: null,         // { type, id, sprite, tileX, tileY, ... }
      transformMode: null,            // 'rotate' | 'resize' | null
      transformValue: { rotate: 0, scale: 1.0 },
      showStoragePanel: false,        // ✅ Toggle storage view

      setPhaserGame: (game) => set({ phaserGame: game }),

      setSelectedBuilding: (building) => {
        set({ 
          selectedBuilding: building,
          transformMode: null,
          transformValue: { rotate: 0, scale: 1.0 }
        })
      },

      setTransformMode: (mode) => set({ transformMode: mode }),

      setTransformValue: (value) => set({ transformValue: value }),

      deselectBuilding: () => set({ 
        selectedBuilding: null,
        transformMode: null,
        transformValue: { rotate: 0, scale: 1.0 }
      }),

      setShowStoragePanel: (show) => set({ showStoragePanel: show }),

      addSpriteToLayout: (assetKey) => {
        // ✅ Add new sprite at canvas center (18, 18)
        const state = get()
        if (!state.phaserGame) {
          console.warn('❌ [addSpriteToLayout] No phaserGame instance')
          return
        }

        const scene = state.phaserGame.scene.getScene('CityScene')
        if (!scene) {
          console.warn('❌ [addSpriteToLayout] CityScene not found')
          return
        }

        // Canvas center: (18, 18) on 36x36 grid
        const centerTileX = 18
        const centerTileY = 18
        console.log(`📍 [addSpriteToLayout] Canvas center tile: (${centerTileX}, ${centerTileY})`)

        // Create new building object
        const newBuilding = {
          type: assetKey,
          x: centerTileX,
          y: centerTileY,
          scale: 1.0,
          angle: 0,
          id: assetKey + '-' + centerTileX + '-' + centerTileY + '-' + Date.now()
        }

        // Add to layout
        const newLayout = [...state.cityLayout, newBuilding]
        state.updateCityLayoutMemory(newLayout)

        // Emit event to spawn the sprite in scene
        console.log(`📤 [addSpriteToLayout] Emitting 'spawn-building' event`)
        scene.events.emit('spawn-building', newBuilding)

        console.log(`✅ [addSpriteToLayout] Added ${assetKey}`)
      },

      updateCityLayoutMemory: (newLayout) => {
        set({ cityLayout: newLayout })
        console.log('📝 [updateCityLayoutMemory] State updated (not persisted yet)')
      },

      updateCityLayout: (newLayout) => {
        get().updateCityLayoutMemory(newLayout)
      },

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

      resetToDefaultLayout: () => {
        console.log('🔄 Resetting to default layout')
        set({ cityLayout: defaultCityLayout, layoutVersion: LAYOUT_VERSION })
      },

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
        console.log(`💾 [saveLayout] Saved ${state.cityLayout.length} objects with note: "${note}"`)
      },

      revertToVersion: (versionId) => {
        // ✅ Restore a previous layout snapshot
        const state = get()
        const version = state.layoutVersions.find(v => v.id === versionId)
        
        if (!version) {
          console.warn(`❌ [revertToVersion] Version ${versionId} not found`)
          return
        }
        
        set({ cityLayout: JSON.parse(JSON.stringify(version.layout)) })
        console.log(`⏮️ [revertToVersion] Reverted to version from ${version.timestamp}`)
        
        // Persist the reverted layout
        const saveData = {
          districts: state.districts,
          cityLayout: version.layout,
          layoutVersion: LAYOUT_VERSION,
          layoutVersions: state.layoutVersions
        }
        localStorage.setItem('life-city-os-save', JSON.stringify(saveData))
      },

      toggleBuildingLock: () => {
        // ✅ Toggle lock state for selected building
        const state = get()
        if (!state.selectedBuilding) {
          console.warn('❌ [toggleBuildingLock] No building selected')
          return
        }

        // Find the building in the layout
        const updatedLayout = state.cityLayout.map(b => {
          if (b === state.selectedBuilding) {
            const isNowLocked = !b.locked
            console.log(`🔒 [toggleBuildingLock] ${b.type} is now ${isNowLocked ? 'LOCKED' : 'UNLOCKED'}`)
            return { ...b, locked: isNowLocked }
          }
          return b
        })

        // Update layout in memory
        state.updateCityLayoutMemory(updatedLayout)

        // Update selected building with new locked state
        const updatedBuilding = updatedLayout.find(b => b === state.selectedBuilding)
        set({ selectedBuilding: updatedBuilding })
      },

      setSelectedGroundTile: (tileKey) => {
        set({ selectedGroundTile: tileKey })
        console.log(`🎨 [setSelectedGroundTile] Selected tile: ${tileKey}`)
      },

      setGroundPaintMode: (enabled) => {
        set({ groundPaintMode: enabled })
        console.log(`🖌️ [setGroundPaintMode] Paint mode: ${enabled ? 'ON' : 'OFF'}`)
      },

      paintGroundTile: (x, y, tileKey) => {
        // ✅ Paint a single ground tile at (x, y)
        const state = get()
        const newGroundLayout = setGroundTileAt(state.groundLayout, x, y, tileKey)
        set({ groundLayout: newGroundLayout })
        console.log(`🎨 [paintGroundTile] Painted (${x}, ${y}) with ${tileKey}`)
      },

      setGroundTileMode: (mode) => {
        set({ groundTileMode: mode })
        console.log(`🎨 [setGroundTileMode] Switched to ${mode} tile layer`)
      },

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
        console.group('🔄 [REHYDRATE] Hydrating from localStorage')
        
        // Validate version matches
        if (state && state.layoutVersion !== LAYOUT_VERSION) {
          console.warn('⚠️  Version mismatch. Saved:', state.layoutVersion, 'Expected:', LAYOUT_VERSION)
          console.log('   → Resetting to default (version changed)')
          state.cityLayout = defaultCityLayout
          state.layoutVersion = LAYOUT_VERSION
        } else if (state?.cityLayout?.length > 0) {
          console.log('✅ Loaded', state.cityLayout.length, 'objects from saved layout')
        } else {
          console.log('ℹ️  No saved layout, using default')
        }
        
        // ✅ NOW mark hydration complete (AFTER data is loaded)
        state._hydrated = true
        console.groupEnd()
      }
    }
  )
)

