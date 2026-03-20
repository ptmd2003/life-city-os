import Phaser from 'phaser'
import Cat from '../sprites/cat.js'

import { depthSort } from '../systems/DepthManager.js'
import { updatePointerFeedback } from '../systems/PointerFeedbackSystem.js'
import { drawGround, updateGroundTileSprite, drawFlatTiles, updateFlatTileSprite } from '../systems/GroundRender.js'
import { spawnPlayer } from '../systems/PlayerSystem.js'

import { setupCamera, updateCamera } from '../systems/CameraController.js'
import { setupBuildingPlacement, spawnBuildings } from '../systems/BuildingPlacementSystem.js'
import { isoToScreen, screenToIso } from '../systems/IsoHelper.js'
import { createBuilding } from '../systems/BuildingFactory.js'

import { WorldHealthSystem } from '../world/WorldHealthSystem.js'
import { WorldState } from '../world/WorldState.js'
import { useCityStore } from '../../stores/useCityStore.js'
import { preloadAssets } from '../preloadAssets.js'

export default class CityScene extends Phaser.Scene {

  constructor() {
    super('CityScene')
  }

  preload() {
    // Automatically preload all assets from the manifest
    preloadAssets(this)
  }

  create() {

    this.setupIsoSystem()

    drawGround(this)
    drawFlatTiles(this)  // ✅ Render flat tile overlays on top

    setupBuildingPlacement(this)

    // Get cityLayout from store
    const storeState = useCityStore.getState()
    const cityLayout = storeState.cityLayout
    
    // ✅ Debug: Log what we're about to spawn
    console.group('🎬 [CityScene.create]')
    console.log('   cityLayout length:', cityLayout.length)
    console.log('   _hydrated flag:', storeState._hydrated)
    console.log('   First 3 objects:', cityLayout.slice(0, 3).map(o => `${o.type}@(${o.x},${o.y})`))
    console.groupEnd()

    spawnBuildings(this, cityLayout)

    // Store cityLayout for updates
    this.cityLayout = cityLayout

    // ✅ Transform panel event listeners
    this.setupTransformEvents()

    spawnPlayer(this)

    this.setupControls()

    setupCamera(this)

    // World state overlay
    this.darknessOverlay = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x000000)
      .setOrigin(0)
      .setDepth(1000)
      .setAlpha(0)

}

  setupIsoSystem() {

    this.tileW = 44
    this.tileH = 32
    this.cols = 36
    this.rows = 36

    this.originX = this.scale.width / 2
    this.originY = 300

    // ✅ Original perfect ratio — flat tiles will layer on top to close gaps
    this.xStep = this.tileW * 0.44  // 19.36
    this.yStep = this.tileH * 0.32  // 10.24

    this.isoGroup = this.add.group()
    
    // Initialize building system
    this.placedBuildings = []

  }


  setupControls() {

    this.keys = {
      up: this.input.keyboard.addKey('UP'),
      down: this.input.keyboard.addKey('DOWN'),
      left: this.input.keyboard.addKey('LEFT'),
      right: this.input.keyboard.addKey('RIGHT'),
      w: this.input.keyboard.addKey('W'),
      a: this.input.keyboard.addKey('A'),
      s: this.input.keyboard.addKey('S'),
      d: this.input.keyboard.addKey('D'),
      h: this.input.keyboard.addKey('H'),
      t: this.input.keyboard.addKey('T'), // T for study
      f: this.input.keyboard.addKey('F')
    }

  }

  setupTransformEvents() {
    // ✅ Handle building selection w/ glow (tint only, no scale change)
    this.events.on('select-building', (building) => {
      console.log(`📥 [CityScene] 'select-building' event received, building=${!!building}`)
      if (!building) {
        console.warn('❌ [CityScene] Building is null/undefined')
        return
      }
      
      // building can be a sprite or a buildingData object
      const sprite = building.sprite ? building.sprite : building
      console.log(`   Sprite type: ${sprite?.texture?.key || 'unknown'}`)
      console.log(`   Has setScale? ${typeof sprite?.setScale === 'function'}`)
      
      // Check if it's a valid Phaser object (has sprite methods)
      if (sprite && typeof sprite.setScale === 'function' && typeof sprite.setTint === 'function') {
        // ✅ VISUAL FEEDBACK: Make object lighter (brighter green tint) + slightly transparent
        sprite.setTint(0xccffcc)  // Lighter green tint
        sprite.setAlpha(0.85)      // Slightly transparent to show it's "active"
        console.log(`   ✅ Applied lighter green tint + transparency`)
      } else {
        console.warn(`❌ Sprite not valid: missing setScale or setTint methods`)
      }
    })

    // ✅ Handle deselect (remove glow)
    this.events.on('deselect-building', () => {
      console.log(`📥 [CityScene] 'deselect-building' event received`)
      this.placedBuildings.forEach(b => {
        if (b.sprite) {
          b.sprite.setTint(0xffffff)  // Remove tint
          b.sprite.setAlpha(1.0)      // Restore full opacity
        }
      })
      console.log(`   ✅ Removed tint and restored opacity for all buildings`)
    })

    // ✅ Handle transform (rotate/resize) — expects sprite
    this.events.on('transform-building', ({ building, mode, value }) => {
      console.log(`📥 [CityScene] 'transform-building' event received: mode=${mode}, value=${value}`)
      console.log(`   Building=${!!building}, has setScale? ${typeof building?.setScale === 'function'}`)
      
      // Check if it's a valid Phaser object (has sprite methods)
      if (!building || typeof building.setScale !== 'function') {
        console.warn(`❌ Invalid building for transform`)
        return
      }
      
      // Find matching buildingData
      const buildingData = this.placedBuildings.find(b => b.sprite === building)
      if (!buildingData) {
        console.warn(`❌ No buildingData found for sprite`)
        return
      }
      
      if (mode === 'rotate') {
        building.setRotation((value * Math.PI) / 180)  // Convert degrees to radians
        console.log(`   ✅ Rotated to ${value.toFixed(1)}°`)
      } else if (mode === 'resize') {
        building.setScale(value)
        console.log(`   ✅ Scaled to ${value.toFixed(2)}x`)
      }
      
      // ✅ Update in memory (user must click Save Layout to persist)
      const newLayout = this.placedBuildings.map(b => ({
        type: b.type,
        x: b.tileX,
        y: b.tileY,
        key: b.key,
        scale: b.sprite.scaleX,
        angle: b.sprite.angle,
        id: b.id
      }))
      useCityStore.getState().updateCityLayoutMemory(newLayout)
      console.log(`   📝 Layout updated in memory (click Save Layout to persist)`)
    })

    // ✅ Handle delete — expects sprite
    this.events.on('delete-building', (building) => {
      console.log(`📥 [CityScene] 'delete-building' event received`)
      console.log(`   Building=${!!building}, has setScale? ${typeof building?.setScale === 'function'}`)
      
      // Check if it's a valid Phaser object
      if (!building || typeof building.setScale !== 'function') {
        console.warn(`❌ Invalid building for delete`)
        return
      }
      
      // Find matching buildingData
      const buildingData = this.placedBuildings.find(b => b.sprite === building)
      if (!buildingData) {
        console.warn(`❌ No buildingData found for sprite`)
        return
      }
      
      console.log(`   ✅ Deleting ${buildingData.type}`)
      // Remove sprite
      building.destroy()
      // Remove from placedBuildings
      this.placedBuildings = this.placedBuildings.filter(b => b !== buildingData)
      // Update store (memory only)
      const newLayout = this.placedBuildings.map(b => ({
        type: b.type,
        x: b.tileX,
        y: b.tileY,
        key: b.key,
        scale: b.sprite.scaleX,
        angle: b.sprite.angle,
        id: b.id
      }))
      useCityStore.getState().updateCityLayoutMemory(newLayout)
      console.log(`   📝 Layout updated in memory (click Save Layout to persist)`)
    })

    // ✅ Handle spawn building (from storage panel)
    this.events.on('spawn-building', (buildingData) => {
      console.log(`📥 [CityScene] 'spawn-building' event received: ${buildingData.type}`)

      // Convert tile coords to screen coords
      const pos = isoToScreen(
        buildingData.x,
        buildingData.y,
        this.originX,
        this.originY,
        this.xStep,
        this.yStep
      )

      // Create the sprite
      const sprite = createBuilding(this, buildingData.type, pos.x, pos.y)
      if (!sprite) {
        console.warn(`❌ Failed to create building sprite for ${buildingData.type}`)
        return
      }

      // Apply transforms
      if (buildingData.scale) sprite.setScale(buildingData.scale)
      if (buildingData.angle) sprite.setAngle(buildingData.angle)

      // ✅ Store tile coordinates on sprite for isometric depth sorting
      sprite.tileX = buildingData.x
      sprite.tileY = buildingData.y

      // Add to isoGroup
      this.isoGroup.add(sprite)

      // Register in placedBuildings
      const placedBuildingData = {
        type: buildingData.type,
        key: buildingData.type,
        tileX: buildingData.x,
        tileY: buildingData.y,
        worldX: pos.x,
        worldY: pos.y,
        sprite: sprite,
        id: buildingData.id
      }

      this.placedBuildings.push(placedBuildingData)

      console.log(`✅ [spawn-building] Created ${buildingData.type} at tile (${buildingData.x}, ${buildingData.y})`)
    })

    // ✅ Ground click to deselect
    this.input.on('pointerdown', (pointer) => {
      // Only deselect if clicking empty ground (not on a building)
      const hitBuilding = this.placedBuildings.some(b => {
        if (!b.sprite) return false
        const dx = pointer.worldX - b.sprite.x
        const dy = pointer.worldY - b.sprite.y
        const radius = Math.min(b.sprite.displayWidth, b.sprite.displayHeight) * 0.25
        return dx*dx + dy*dy < radius*radius
      })
      
      if (!hitBuilding) {
        const { deselectBuilding } = useCityStore.getState()
        deselectBuilding()
        this.events.emit('deselect-building')
        console.log(`🎯 [GROUND-CLICK] Deselected`)
      }
    }, this)

    // ✅ Ground painter system
    this.hoveredGroundTile = null
    this.groundPaintHoverGraphics = this.make.graphics({ x: 0, y: 0 }, false)
    this.groundPaintHoverGraphics.setDepth(5)  // Above ground, below buildings

    // Pointer move — highlight ground tile in paint mode
    this.input.on('pointermove', (pointer) => {
      const state = useCityStore.getState()
      if (!state.groundPaintMode) return

      // Convert screen coords to tile coords
      const tileCoords = screenToIso(
        pointer.worldX,
        pointer.worldY,
        this.originX,
        this.originY,
        this.xStep,
        this.yStep
      )

      const x = Math.round(tileCoords.x)
      const y = Math.round(tileCoords.y)

      // Store current hovered tile
      this.hoveredGroundTile = { x, y }

      // Draw highlight circle at the tile position
      const pos = isoToScreen(x, y, this.originX, this.originY, this.xStep, this.yStep)
      
      this.groundPaintHoverGraphics.clear()
      if (x >= 0 && x < 36 && y >= 0 && y < 36) {
        // ✅ ENHANCED: Larger, brighter glow effect
        // Outer glow (faded)
        this.groundPaintHoverGraphics.fillStyle(0xffff00, 0.15)
        this.groundPaintHoverGraphics.fillCircle(pos.x, pos.y, 50)
        
        // Mid glow
        this.groundPaintHoverGraphics.fillStyle(0xffff00, 0.25)
        this.groundPaintHoverGraphics.fillCircle(pos.x, pos.y, 40)
        
        // Inner bright circle
        this.groundPaintHoverGraphics.fillStyle(0xffff00, 0.45)
        this.groundPaintHoverGraphics.fillCircle(pos.x, pos.y, 30)
        
        // Bright border
        this.groundPaintHoverGraphics.lineStyle(3, 0xffff00, 1.0)
        this.groundPaintHoverGraphics.strokeCircle(pos.x, pos.y, 30)
        
        console.log(`✨ [HOVER] Tile (${x}, ${y}) highlighted`)
      }
    }, this)

    // Pointer down — paint ground tile or flat tile overlay
    this.input.on('pointerdown', () => {
      const state = useCityStore.getState()
      if (!state.groundPaintMode || !this.hoveredGroundTile) return

      const { x, y } = this.hoveredGroundTile
      if (x < 0 || x >= 36 || y < 0 || y >= 36) return

      const tileKey = state.selectedGroundTile

      if (state.groundTileMode === 'flat') {
        // 🎨 Paint flat tile overlay
        state.paintFlatTile(x, y, tileKey)
        updateFlatTileSprite(this, x, y, tileKey)
        console.log(`✨ [FLAT-PAINT] Painted flat overlay (${x}, ${y}) with ${tileKey}`)
      } else {
        // 🎨 Paint full ground tile
        state.paintGroundTile(x, y, tileKey)
        updateGroundTileSprite(this, x, y, tileKey)
        console.log(`🎨 [FULL-PAINT] Painted full tile (${x}, ${y}) with ${tileKey}`)
      }
    }, this)

    // Pointer up — clear hover when exiting paint mode
    this.input.on('pointerout', () => {
      this.groundPaintHoverGraphics.clear()
      this.hoveredGroundTile = null
    }, this)
  }

  update() {

  updateCamera(this)

  // Update world state effects
  const health = WorldHealthSystem.getWorldHealth()
  const darkness = Math.max(0, (9 - health) / 9 * 0.7) // 0 to 0.7 alpha
  this.darknessOverlay.setAlpha(darkness)

  // Update ground based on world health
  const groundTint = health < 5 ? 0x666666 : 0xffffff
  this.groundTiles.forEach(tile => tile.setTint(groundTint))

  // Debug check-ins
  if (Phaser.Input.Keyboard.JustDown(this.keys.h)) {
    WorldState.data.health.lastCheckIn = Date.now()
    console.log('💚 [KEY] Health check-in triggered (H key)')
  }
  if (Phaser.Input.Keyboard.JustDown(this.keys.t)) {
    WorldState.data.study.lastCheckIn = Date.now()
    console.log('📚 [KEY] Study check-in triggered (T key)')
  }
  if (Phaser.Input.Keyboard.JustDown(this.keys.f)) {
    WorldState.data.finance.lastCheckIn = Date.now()
    console.log('💰 [KEY] Finance check-in triggered (F key)')
  }

  // sort all isometric objects first
  depthSort(this.isoGroup)

  // ensure cat always renders above ground and buildings
  if (this.cat) {
    this.cat.setDepth(this.cat.y + this.cat.displayHeight * 0.5)
  }

  updatePointerFeedback(this)

  }

  shutdown() {
    // Clean up event listeners on scene shutdown to prevent memory leaks
    console.log('🔌 [CityScene.shutdown] Cleaning up event listeners')
    this.events.off('select-building')
    this.events.off('deselect-building')
    this.events.off('transform-building')
    this.events.off('delete-building')
    this.events.off('spawn-building')
    this.input.off('pointerdown')
    this.input.off('pointermove')
    this.input.off('pointerup')
    this.input.off('pointerout')
    this.input.off('wheel')
  }

}