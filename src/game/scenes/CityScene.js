import Phaser from 'phaser'
import Cat from '../sprites/cat.js'
import logger from '../logger.js'

import { depthSort } from '../systems/DepthManager.js'
import { updatePointerFeedback } from '../systems/PointerFeedbackSystem.js'
import { drawGround, updateGroundTileSprite, drawFlatTiles, updateFlatTileSprite } from '../systems/GroundRender.js'
import { setupPlayerSystem, spawnPlayer, movePlayerAlongPath } from '../systems/PlayerSystem.js'

import { setupCamera, updateCamera, panCamera } from '../systems/CameraController.js'
import { setupBuildingPlacement, spawnBuildings } from '../systems/BuildingPlacementSystem.js'
import { isoToScreen, screenToIso } from '../systems/IsoHelper.js'
import { createBuilding } from '../systems/buildingFactory.js'

import { WorldHealthSystem } from '../world/WorldHealthSystem.js'
import { WorldState } from '../world/WorldState.js'
import { TimeSystem } from '../world/TimeSystem.js'
import { SeasonSystem } from '../world/SeasonSystem.js'
import { SeasonalFXSystem } from '../world/SeasonalFXSystem.js'
import { SeasonalDecorSystem } from '../world/SeasonalDecorSystem.js'
import { VideoOverlaySystem } from '../world/VideoOverlaySystem.js'
import { useCityStore } from '../../stores/useCityStore.js'
import { preloadAssets } from '../preloadAssets.js'

export default class CityScene extends Phaser.Scene {

  constructor() {
    super('CityScene')
  }

  preload() {
    // Automatically preload all assets from the manifest
    preloadAssets(this)

    // 🎬 Preload seasonal videos for overlay (HD 1280×720)
    logger.info('Loading seasonal videos')
    this.load.video('sakura', '/videos/sakura.mp4', true)
    this.load.video('summer', '/videos/summer.mp4', true)
    this.load.video('winter', '/videos/winter.mp4', true)
    this.load.video('autumn', '/videos/autumn.mp4', true)
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
    logger.debug(`Spawning ${cityLayout.length} buildings, hydrated=${storeState._hydrated}`)

    spawnBuildings(this, cityLayout)

    // Store cityLayout for updates
    this.cityLayout = cityLayout

    // ✅ Transform panel event listeners
    this.setupTransformEvents()

    // 🐱 Initialize Player System
    setupPlayerSystem(this)
    // spawnPlayer(this, 18, 18, Cat)  // TODO: Cat sprite refactor later

    this.setupControls()

    setupCamera(this)

    // ⏱️ Initialize TimeSystem singleton
    this.timeSystem = TimeSystem.getInstance()
    logger.info('TimeSystem initialized')

    // 🌍 Initialize Seasonal Effects Systems
    this.seasonalFXSystem = new SeasonalFXSystem(this)
    this.seasonalFXSystem.init()
    logger.info('SeasonalFXSystem initialized')

    this.seasonalDecorSystem = new SeasonalDecorSystem(this)
    this.seasonalDecorSystem.init()
    logger.info('SeasonalDecorSystem initialized')

    // 🎬 Initialize Video Overlay System (sakura + winter videos)
    this.videoOverlaySystem = new VideoOverlaySystem(this)
    this.videoOverlaySystem.init()
    logger.info('VideoOverlaySystem initialized')

    // ✅ Handle window/canvas resize for video overlay
    this.scale.on('resize', () => {
      if (this.videoOverlaySystem) {
        this.videoOverlaySystem.updateSize()
      }
    })

    // Initialize season tracking
    this.lastSeason = null
    this.lastLoadedVideoKey = null
    
    // 🔍 DEBUG: Log initial season on load
    const initialSeason = SeasonSystem.getSeason()
    logger.info(`Initial season detected on load: ${initialSeason}`)

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

    // ✅ Correct isometric ratio: each tile steps by half its width/height
    // This prevents gaps and ensures proper tile alignment with screenToIso conversion
    this.xStep = this.tileW / 2  // 22 — standard isometric X step
    this.yStep = this.tileH / 2  // 16 — standard isometric Y step

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
      if (!building) {
        logger.warn('Building is null/undefined')
        return
      }
      
      // building can be a sprite or a buildingData object
      const sprite = building.sprite ? building.sprite : building
      
      // Check if it's a valid Phaser object (has sprite methods)
      if (sprite && typeof sprite.setScale === 'function' && typeof sprite.setTint === 'function') {
        // ✅ VISUAL FEEDBACK: Make object lighter (brighter green tint) + slightly transparent
        sprite.setTint(0xccffcc)  // Lighter green tint
        sprite.setAlpha(0.85)      // Slightly transparent to show it's "active"
        logger.debug(`Applied green tint to ${sprite?.texture?.key || 'unknown'}`)
      } else {
        logger.warn('Sprite not valid: missing setScale or setTint methods')
      }
    })

    // ✅ Handle deselect (remove glow)
    this.events.on('deselect-building', () => {
      this.placedBuildings.forEach(b => {
        if (b.sprite) {
          b.sprite.setTint(0xffffff)  // Remove tint
          b.sprite.setAlpha(1.0)      // Restore full opacity
        }
      })
      logger.debug('Removed visual feedback from all buildings')
    })

    // ✅ Handle transform (rotate/resize) — expects sprite
    this.events.on('transform-building', ({ building, mode, value }) => {
      // Check if it's a valid Phaser object (has sprite methods)
      if (!building || typeof building.setScale !== 'function') {
        logger.warn('Invalid building for transform')
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
        logger.debug(`Rotated to ${value.toFixed(1)}°`)
      } else if (mode === 'resize') {
        building.setScale(value)
        logger.debug(`Scaled to ${value.toFixed(2)}x`)
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
      logger.debug('Layout updated in memory')
    })

    // ✅ Handle delete — expects sprite
    this.events.on('delete-building', (building) => {
      // Check if it's a valid Phaser object
      if (!building || typeof building.setScale !== 'function') {
        logger.warn('Invalid building for delete')
        return
      }
      
      // Find matching buildingData
      const buildingData = this.placedBuildings.find(b => b.sprite === building)
      if (!buildingData) {
        logger.warn('No buildingData found for sprite')
        return
      }
      
      logger.debug(`Deleting ${buildingData.type}`)
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
      logger.debug('Layout updated in memory')
    })

    // ✅ Handle spawn building (from storage panel)
    this.events.on('spawn-building', (buildingData) => {
      logger.debug(`Spawning ${buildingData.type}`)

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
        logger.warn(`Failed to create sprite for ${buildingData.type}`)
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
        depthOffset: 0,  // ✅ Initialize layer offset for new buildings
        sprite: sprite,
        id: buildingData.id
      }

      this.placedBuildings.push(placedBuildingData)
      logger.debug(`Created ${buildingData.type} at (${buildingData.x}, ${buildingData.y})`)
    })

    // ✅ Ground click to deselect
    this.input.on('pointerdown', (pointer) => {
      // Only deselect if clicking empty ground (not on a building)
      const hitBuilding = this.placedBuildings.some(b => {
        if (!b.sprite) return false
        const dx = pointer.worldX - b.sprite.x
        // Correct for origin at center-bottom: visual center is at y - displayHeight/2
        const dy = pointer.worldY - (b.sprite.y - b.sprite.displayHeight / 2)
        // Match the 0.25 radius from PointerFeedbackSystem
        const radius = Math.min(b.sprite.displayWidth, b.sprite.displayHeight) * 0.25
        return dx*dx + dy*dy < radius*radius
      })
      
      if (!hitBuilding) {
        const { deselectBuilding } = useCityStore.getState()
        deselectBuilding()
        this.events.emit('deselect-building')
        logger.debug('Deselected via ground click')
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
        
        logger.debug(`Hovered tile (${x}, ${y})`)
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
        logger.debug(`Painted flat overlay (${x}, ${y}) with ${tileKey}`)
      } else {
        // 🎨 Paint full ground tile
        state.paintGroundTile(x, y, tileKey)
        updateGroundTileSprite(this, x, y, tileKey)
        logger.debug(`Painted tile (${x}, ${y}) with ${tileKey}`)
      }
    }, this)

    // Pointer up — clear hover when exiting paint mode
    this.input.on('pointerout', () => {
      this.groundPaintHoverGraphics.clear()
      this.hoveredGroundTile = null
    }, this)
  }

  update() {
    // 🔍 DEBUG: Trace video alpha changes (temporary — remove after diagnosis)
    if (this.videoOverlaySystem?.videoSprite) {
      const currentAlpha = this.videoOverlaySystem.videoSprite.alpha
      if (!this._lastVideoAlpha) {
        this._lastVideoAlpha = currentAlpha
      }
      if (currentAlpha !== this._lastVideoAlpha) {
        console.warn(`⚠️ Video alpha changed: ${this._lastVideoAlpha} → ${currentAlpha}`)
        console.trace('Alpha change call stack:')
        this._lastVideoAlpha = currentAlpha
      }
    }

  updateCamera(this)

  // ✅ Handle camera pan with WASD / Arrow keys
  if (this.keys.w.isDown || this.keys.up.isDown) panCamera(this, 'up')
  if (this.keys.s.isDown || this.keys.down.isDown) panCamera(this, 'down')
  if (this.keys.a.isDown || this.keys.left.isDown) panCamera(this, 'left')
  if (this.keys.d.isDown || this.keys.right.isDown) panCamera(this, 'right')

  // 🎬 Handle video overlay based on current season
  const currentSeason = SeasonSystem.getSeason()
  
  // Only update video if season changed
  if (currentSeason !== this.lastSeason) {
    console.log(`🔄 [CityScene] Season changed: ${this.lastSeason} → ${currentSeason}`)
    this.lastSeason = currentSeason
    
    if (currentSeason === 'spring') {
      // ✅ Spring: Destroy any existing video and play sakura
      if (this.videoOverlaySystem?.videoSprite) {
        this.videoOverlaySystem.destroy()
      }
      
      // Small delay to ensure destroy completes before creating new video
      setTimeout(() => {
        if (this.videoOverlaySystem && !this.videoOverlaySystem.videoSprite) {
          this.videoOverlaySystem.playSakuraVideo('sakura', {
            loop: true,
            alpha: 1.0,
            speed: 0.8,
            blend: 'SCREEN',
            loopStart: 10,    // Start looping at 10s
            loopEnd: 30       // End loop at 30s
          })
        }
      }, 100)
    } else if (currentSeason === 'winter') {
      // ✅ Winter: Destroy any existing video and play winter
      if (this.videoOverlaySystem?.videoSprite) {
        this.videoOverlaySystem.destroy()
      }
      
      // Small delay to ensure destroy completes before creating new video
      setTimeout(() => {
        if (this.videoOverlaySystem && !this.videoOverlaySystem.videoSprite) {
          this.videoOverlaySystem.playSakuraVideo('winter', {
            loop: true,
            alpha: 1.0,
            speed: 0.5,     // ❄️ Slower, serene effect
            blend: 'SCREEN',
            loopStart: 0,     // Loop from beginning
            loopEnd: null     // Loop to end of video
          })
        }
      }, 100)
    } else if (currentSeason === 'summer') {
      // ✅ Summer: Destroy any existing video and play summer
      if (this.videoOverlaySystem?.videoSprite) {
        this.videoOverlaySystem.destroy()
      }
      
      // Small delay to ensure destroy completes before creating new video
      setTimeout(() => {
        if (this.videoOverlaySystem && !this.videoOverlaySystem.videoSprite) {
          this.videoOverlaySystem.playSakuraVideo('summer', {
            loop: true,
            alpha: 1.0,     // ☀️ Maximum opacity
            speed: 0.8,     // ☀️ Gentle, warm effect
            blend: 'SCREEN',  // ✅ SCREEN for original colors
            loopStart: 0,     // Loop from beginning
            loopEnd: 45       // Loop to 0:45 (end before green background)
          })
        }
      }, 100)
    } else if (currentSeason === 'autumn') {
      // ✅ Autumn: Destroy any existing video and play autumn
      if (this.videoOverlaySystem?.videoSprite) {
        this.videoOverlaySystem.destroy()
      }
      
      // Small delay to ensure destroy completes before creating new video
      setTimeout(() => {
        if (this.videoOverlaySystem && !this.videoOverlaySystem.videoSprite) {
          this.videoOverlaySystem.playSakuraVideo('autumn', {
            loop: true,
            alpha: 1.0,     // 🍂 Maximum opacity for full contrast
            speed: 0.7,     // 🍂 Gentle, flowing effect
            blend: 'SCREEN',  // ✅ SCREEN for original colors
            loopStart: 0,     // Loop from beginning
            loopEnd: null     // Loop to end of video
          })
        }
      }, 100)
    }
  }

  // Update world state effects
  const health = WorldHealthSystem.getWorldHealth()
  // ⚠️ DISABLED: darknessOverlay causing color wash with video overlay
  // const darkness = Math.max(0, (9 - health) / 9 * 0.7) // 0 to 0.7 alpha
  // this.darknessOverlay.setAlpha(darkness)
  this.darknessOverlay.setAlpha(0)  // Always invisible

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

  // 🌍 Update seasonal effects and backgrounds
  if (this.seasonalDecorSystem) {
    this.seasonalDecorSystem.update()
  }

  // ✅ Seasonal FX can be re-enabled by uncommenting
  // if (this.seasonalFXSystem) {
  //   this.seasonalFXSystem.update()
  //   this.seasonalFXSystem.render()
  // }

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