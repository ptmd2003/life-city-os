import { SeasonSystem } from './SeasonSystem.js'
import { TimeSystem } from './TimeSystem.js'

/**
 * SeasonalDecorSystem — Seasonal gradient backgrounds
 * Draws smooth gradient backgrounds that change by season and time of day
 */
export class SeasonalDecorSystem {
  constructor(scene) {
    this.scene = scene
    this.initialized = false
    this.lastSeason = null
    this.lastPeriod = null
    this.lastHour = null
    this.currentTheme = null
  }

  init() {
    this.initialized = true
    
    // Create graphics layer for gradient (like ground layer)
    if (!this.scene.gradientLayer) {
      this.scene.gradientLayer = this.scene.add.graphics()
      this.scene.gradientLayer.setDepth(-100)  // Behind ground (depth 0+)
    }
    
    // Set camera pan limits to gradient bounds (2.6x extension)
    const canvasW = this.scene.game.canvas.width
    const canvasH = this.scene.game.canvas.height
    const offsetX = -canvasW * 0.8
    const offsetY = -canvasH * 0.8
    const extendW = canvasW * 2.6
    const extendH = canvasH * 2.6
    
    this.scene.backgroundBounds = {
      left: offsetX,
      right: offsetX + extendW,
      top: offsetY,
      bottom: offsetY + extendH
    }
    
    // Initialize theme and draw
    const season = SeasonSystem.getSeason()
    const timeSystem = TimeSystem.getInstance()
    const hour = timeSystem.getHour()
    const theme = this.getSeasonTheme(season)
    this.currentTheme = this.adjustThemeForTimeOfDay(theme, hour)
    this.drawGradient(this.currentTheme)
  }

  /**
   * Update seasonal decorations every frame
   */
  update() {
    if (!this.initialized) {
      this.init()
    }

    const currentSeason = SeasonSystem.getSeason()
    const timeSystem = TimeSystem.getInstance()
    const currentHour = timeSystem.getHour()

    const getTimePeriod = (hour) => {
      if (hour < 5) return 'night'
      if (hour < 12) return 'morning'
      if (hour < 18) return 'day'
      if (hour < 22) return 'evening'
      return 'night'
    }

    const currentPeriod = getTimePeriod(currentHour)
    const seasonOrTimeChanged = this.lastSeason !== currentSeason || (this.lastPeriod !== currentPeriod)

    if (seasonOrTimeChanged) {
      this.lastSeason = currentSeason
      this.lastPeriod = currentPeriod
      this.lastHour = currentHour
      
      const theme = this.getSeasonTheme(currentSeason)
      this.currentTheme = this.adjustThemeForTimeOfDay(theme, currentHour)
    }

    // Always redraw to handle camera changes
    if (this.currentTheme && this.scene.gradientLayer) {
      this.drawGradient(this.currentTheme)
    }
  }

  /**
   * Draw gradient background as graphics layer with 2.6x extension (centered)
   */
  drawGradient(theme) {
    if (!this.scene.gradientLayer) return

    const canvas = this.scene.game.canvas
    
    // Get full canvas dimensions
    const canvasW = canvas.width
    const canvasH = canvas.height
    
    // 2.6x extension: draw 2.6x the canvas size
    const drawW = canvasW * 2.6
    const drawH = canvasH * 2.6
    
    // Simple center positioning (no offset needed with camera zoom limits 0.5-2x)
    const offsetX = -canvasW * 0.8
    const offsetY = -canvasH * 0.8

    this.scene.gradientLayer.clear()

    // Draw 60 gradient strips to cover full extended area
    const stripHeight = drawH / 60
    for (let i = 0; i < 60; i++) {
      const t = i / 60
      
      let color
      if (t < 0.5) {
        color = this.lerpColor(theme.midColor, theme.midColor, t * 2)
      } else {
        color = this.lerpColor(theme.midColor, theme.groundFadeColor, (t - 0.5) * 2)
      }
      
      this.scene.gradientLayer.fillStyle(color, 1.0)
      this.scene.gradientLayer.fillRect(offsetX, offsetY + i * stripHeight, drawW, stripHeight)
    }
  }

  /**
   * Linear interpolation between two colors
   */
  lerpColor(color1, color2, t) {
    const r1 = (color1 >> 16) & 0xff
    const g1 = (color1 >> 8) & 0xff
    const b1 = color1 & 0xff
    
    const r2 = (color2 >> 16) & 0xff
    const g2 = (color2 >> 8) & 0xff
    const b2 = color2 & 0xff
    
    const r = Math.round(r1 + (r2 - r1) * t)
    const g = Math.round(g1 + (g2 - g1) * t)
    const b = Math.round(b1 + (b2 - b1) * t)
    
    return (r << 16) | (g << 8) | b
  }

  /**
   * Get seasonal color theme
   */
  getSeasonTheme(season) {
    const themes = {
      spring: {
        midColor: 0xf0c8c8,        // soft rose
        groundFadeColor: 0xd8e8e8  // pale mint
      },
      summer: {
        midColor: 0xf4b8a0,        // warm peach
        groundFadeColor: 0xffb8b8  // soft pink
      },
      autumn: {
        midColor: 0xE8A868,        // peachy-golden
        groundFadeColor: 0xFBF3E6  // vanilla cream
      },
      winter: {
        midColor: 0xb8d0e8,        // frost blue
        groundFadeColor: 0xa8b8d8  // lilac mist
      }
    }
    return themes[season] || themes.spring
  }

  /**
   * Adjust theme colors based on time of day (warmth shifts)
   */
  adjustThemeForTimeOfDay(theme, hour) {
    let warmthShift = 0

    // 10 time bands with different warmth
    if (hour >= 5 && hour < 7) {
      warmthShift = 0.15 // peachy morning
    } else if (hour >= 7 && hour < 12) {
      warmthShift = 0.05 // morning glow
    } else if (hour >= 12 && hour < 14) {
      warmthShift = 0 // neutral afternoon
    } else if (hour >= 14 && hour < 17) {
      warmthShift = -0.05 // afternoon coolness
    } else if (hour >= 17 && hour < 18) {
      warmthShift = 0.2 // golden hour
    } else if (hour >= 18 && hour < 22) {
      warmthShift = 0 // evening neutral
    } else if (hour >= 22 && hour < 24) {
      warmthShift = -0.1 // cool night
    } else if (hour >= 0 && hour < 2) {
      warmthShift = -0.15 // deep night
    } else if (hour >= 2 && hour < 5) {
      warmthShift = -0.08 // pre-dawn coolness
    }

    return {
      midColor: this.adjustColor(theme.midColor, 0, warmthShift),
      groundFadeColor: this.adjustColor(theme.groundFadeColor, 0, warmthShift)
    }
  }

  /**
   * Adjust color brightness and warmth
   */
  adjustColor(color, brightness, warmth) {
    let r = (color >> 16) & 0xff
    let g = (color >> 8) & 0xff
    let b = color & 0xff

    // Apply warmth shift: positive = more red/yellow, negative = more blue
    r = Math.max(0, Math.min(255, r + warmth * 30))
    g = Math.max(0, Math.min(255, g + warmth * 15))
    b = Math.max(0, Math.min(255, b - warmth * 20))

    // Apply brightness
    if (brightness !== 0) {
      r = Math.max(0, Math.min(255, r + brightness * 30))
      g = Math.max(0, Math.min(255, g + brightness * 30))
      b = Math.max(0, Math.min(255, b + brightness * 30))
    }

    return (Math.round(r) << 16) | (Math.round(g) << 8) | Math.round(b)
  }

  /**
   * Convert 0xRRGGBB color to #RRGGBB hex string
   */
  colorToHex(color) {
    return '#' + color.toString(16).padStart(6, '0')
  }
}
