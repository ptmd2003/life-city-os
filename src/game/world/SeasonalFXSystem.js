import { SeasonSystem } from './SeasonSystem.js'

/**
 * SeasonalFXSystem — Particle effects and seasonal visual feedback
 * Handles spawning and updating seasonal particles (petals, leaves, snow, pollen)
 * 
 * Called from CityScene.update() once per frame
 */
export class SeasonalFXSystem {
  constructor(scene) {
    this.scene = scene
    this.particles = []
    this.particleEmitters = []
  }

  /**
   * Initialize seasonal FX for the scene
   * Call once in CityScene.create()
   */
  init() {
    // Create a graphics object for custom particle rendering if needed
    if (!this.scene.seasonalFXLayer) {
      this.scene.seasonalFXLayer = this.scene.add.graphics()
      this.scene.seasonalFXLayer.setDepth(100) // Above game world, below UI
      this.scene.seasonalFXLayer.setScrollFactor(0) // Fixed to camera
    }
  }

  /**
   * Update seasonal FX (call every frame from CityScene.update)
   */
  update() {
    // 🔧 DEBUG: Hardcode Spring particles for testing
    const particleType = 'sakura_petals'
    
    // Uncomment to use real theme:
    // const theme = SeasonSystem.getSeasonTheme()
    // const particleType = theme.particles
    
    // Clean up dead particles
    this.particles = this.particles.filter(p => p.alive)

    // Spawn new particles based on season
    this.spawnSeasonalParticles(particleType)

    // Update existing particles
    this.particles.forEach(p => p.update())
  }

  /**
   * Spawn seasonal particles based on type
   * Spawn multiple particles per frame for full coverage
   */
  spawnSeasonalParticles(particleType) {
    const spawnRate = {
      sakura_petals: 3,    // Increased from 1 (now covers entire isometric map)
      pollen_dust: 2,      // Increased from 1
      falling_leaves: 4,   // Increased from 2
      snowfall: 4,         // Same as before
    }

    const count = spawnRate[particleType] || 0
    for (let i = 0; i < count; i++) {
      this.spawnParticle(particleType)
    }
  }

  /**
   * Spawn a single particle
   */
  spawnParticle(particleType) {
    const particle = this.createParticle(particleType)
    if (particle) {
      this.particles.push(particle)
    }
  }

  /**
   * Create a particle object based on type
   * Particles spawn from edges and above the isometric viewport
   */
  createParticle(particleType) {
    const w = this.scene.scale.width
    const h = this.scene.scale.height

    // Spawn particles from sides and top to cover entire isometric map
    // Extend spawn area beyond visible boundaries for natural flow
    const spawnSide = Math.random()
    let x, y

    if (spawnSide < 0.7) {
      // 70% spawn from top (natural falling/floating particles)
      x = Math.random() * (w + 200) - 100  // Extend 100px left/right
      y = -50 // Above screen
    } else if (spawnSide < 0.85) {
      // 15% spawn from left side
      x = -50
      y = Math.random() * h
    } else {
      // 15% spawn from right side
      x = w + 50
      y = Math.random() * h
    }

    switch (particleType) {
      case 'sakura_petals':
        return this.createSakuraParticle(x, y)
      case 'pollen_dust':
        return this.createPollenParticle(x, y)
      case 'falling_leaves':
        return this.createLeafParticle(x, y)
      case 'snowfall':
        return this.createSnowParticle(x, y)
      default:
        return null
    }
  }

  /**
   * Sakura petal particle
   * Pink, floating diagonal, gentle wobble — flows across entire isometric map
   * Uses soft pink from summer palette
   */
  createSakuraParticle(x, y) {
    const h = this.scene.scale.height
    
    // Vary petal colors for depth and beauty
    const petalColors = [
      0xffb8b8,  // Main soft pink
      0xffc9c9,  // Lighter pink
      0xffa0a0,  // Deeper pink
      0xffe0e0,  // Very light pink (almost white)
    ]
    const petalColor = petalColors[Math.floor(Math.random() * petalColors.length)]
    
    return {
      x,
      y,
      vx: (Math.random() - 0.5) * 1.2,    // More horizontal drift (0.5 → 1.2) for side coverage
      vy: 0.2 + Math.random() * 0.15,     // Slower fall for longer visibility
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.05,
      wobblePhase: Math.random() * Math.PI * 2,
      wobbleSpeed: 0.02,                   // Gentle side-to-side wobble
      size: 3 + Math.random() * 2,
      color: petalColor,
      alpha: 0.6 + Math.random() * 0.3,
      lifetime: 500 + Math.random() * 200, // Increased from 300-400 (time to cross map)
      age: 0,
      alive: true,
      mapHeight: h,
      type: 'sakura',  // ✨ Mark as sakura for special rendering
      scaleVariation: 0.8 + Math.random() * 0.4,  // Elongate some petals
      update() {
        this.wobblePhase += this.wobbleSpeed
        this.x += this.vx + Math.sin(this.wobblePhase) * 0.3  // Gentle wobble oscillation
        this.y += this.vy
        this.rotation += this.rotationSpeed
        this.age++
        this.alpha = (1 - this.age / this.lifetime) * (0.6 + Math.random() * 0.3)
        // Particle alive if within extended bounds and not aged out
        this.alive = this.y < this.mapHeight + 100 && this.age < this.lifetime
      },
    }
  }

  /**
   * Pollen/dust particle
   * Small, floating, slow drift — fills entire isometric viewport
   * Uses warm cream from summer palette
   */
  createPollenParticle(x, y) {
    const h = this.scene.scale.height
    
    return {
      x,
      y,
      vx: (Math.random() - 0.5) * 0.8,   // More horizontal drift
      vy: 0.1 + Math.random() * 0.08,    // Slower fall
      wobblePhase: Math.random() * Math.PI * 2,
      wobbleSpeed: 0.02 + Math.random() * 0.01,
      size: 1.5 + Math.random() * 1,
      color: 0xfffacd, // Warm cream (summer palette)
      alpha: 0.4 + Math.random() * 0.2,
      lifetime: 600 + Math.random() * 200,  // Increased from 400-550
      age: 0,
      alive: true,
      mapHeight: h,
      update() {
        this.wobblePhase += this.wobbleSpeed
        this.x += this.vx + Math.sin(this.wobblePhase) * 0.15
        this.y += this.vy
        this.age++
        this.alpha = (1 - this.age / this.lifetime) * (0.4 + Math.random() * 0.2)
        this.alive = this.y < this.mapHeight + 100 && this.age < this.lifetime
      },
    }
  }

  /**
   * Falling leaf particle
   * Large, tumbling, irregular fall — flows across entire isometric map
   * Uses pastel autumn palette colors
   */
  createLeafParticle(x, y) {
    const h = this.scene.scale.height
    
    // Autumn palette: pastel tones only (cream, tan, peach)
    const leafColors = [0xd4c4b0, 0xa89878, 0xa67860]
    const randomColor = leafColors[Math.floor(Math.random() * leafColors.length)]
    
    return {
      x,
      y,
      vx: (Math.random() - 0.5) * 2.0,   // Wider horizontal swing (0.5 → 2.0) for side coverage
      vy: 0.3 + Math.random() * 0.2,     // Moderate fall
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.15, // Fast spin
      size: 4 + Math.random() * 3,
      color: randomColor, // Pastel autumn palette
      alpha: 0.7 + Math.random() * 0.2,
      lifetime: 500 + Math.random() * 200,  // Increased from 350-450
      age: 0,
      alive: true,
      mapHeight: h,
      update() {
        this.x += this.vx
        this.y += this.vy
        this.rotation += this.rotationSpeed
        // Occasional wind gust
        if (Math.random() < 0.02) {
          this.vx += (Math.random() - 0.5) * 0.5
        }
        this.age++
        this.alpha = (1 - this.age / this.lifetime) * (0.7 + Math.random() * 0.2)
        this.alive = this.y < this.mapHeight + 100 && this.age < this.lifetime
      },
    }
  }

  /**
   * Snowflake particle
   * Small, drifting, slow constant fall — fills entire isometric viewport
   */
  createSnowParticle(x, y) {
    const h = this.scene.scale.height
    const isNearSnow = Math.random() < 0.3 // 30% are tiny far flakes
    
    return {
      x,
      y,
      vx: (Math.random() - 0.5) * (isNearSnow ? 0.4 : 1.0),  // More horizontal drift
      vy: 0.15 + Math.random() * (isNearSnow ? 0.08 : 0.15),
      wobblePhase: Math.random() * Math.PI * 2,
      wobbleSpeed: 0.03 + Math.random() * 0.02,
      size: isNearSnow ? 0.8 + Math.random() * 0.4 : 2 + Math.random() * 1.5,
      color: 0xffffff, // White
      alpha: isNearSnow ? 0.3 + Math.random() * 0.2 : 0.8 + Math.random() * 0.15,
      lifetime: 600 + Math.random() * 300,  // Increased from 500-700
      age: 0,
      alive: true,
      mapHeight: h,
      update() {
        this.wobblePhase += this.wobbleSpeed
        this.x += this.vx + Math.sin(this.wobblePhase) * 0.2
        this.y += this.vy
        this.age++
        this.alive = this.y < this.mapHeight + 100 && this.age < this.lifetime
      },
    }
  }

  /**
   * Render particles to the FX layer (called from CityScene)
   * Uses Phaser graphics for pixel-perfect rendering
   * Sakura petals get special soft-edged gradient rendering
   */
  render() {
    if (!this.scene.seasonalFXLayer) return

    this.scene.seasonalFXLayer.clear()

    this.particles.forEach(p => {
      if (p.type === 'sakura') {
        // ✨ Sakura petals: Soft gradient edges (like real petals)
        // Draw multiple concentric circles with decreasing opacity for soft halo effect
        const baseSize = p.size
        
        // Outer halo (softest, most transparent)
        this.scene.seasonalFXLayer.fillStyle(p.color, p.alpha * 0.15)
        this.scene.seasonalFXLayer.fillCircle(p.x, p.y, baseSize * 2.2)
        
        // Mid halo (medium transparency)
        this.scene.seasonalFXLayer.fillStyle(p.color, p.alpha * 0.35)
        this.scene.seasonalFXLayer.fillCircle(p.x, p.y, baseSize * 1.5)
        
        // Core (solid, opaque)
        this.scene.seasonalFXLayer.fillStyle(p.color, p.alpha * 0.9)
        this.scene.seasonalFXLayer.fillCircle(p.x, p.y, baseSize * 0.8)
        
        // ✨ Add subtle shadow/depth highlight on one edge
        const highlightX = p.x + Math.cos(p.rotation) * baseSize * 0.5
        const highlightY = p.y + Math.sin(p.rotation) * baseSize * 0.5
        this.scene.seasonalFXLayer.fillStyle(0xffffff, p.alpha * 0.2)  // White highlight
        this.scene.seasonalFXLayer.fillCircle(highlightX, highlightY, baseSize * 0.3)
        
      } else {
        // Other particles: Simple circles
        this.scene.seasonalFXLayer.fillStyle(p.color, p.alpha)
        this.scene.seasonalFXLayer.fillCircle(p.x, p.y, p.size)
      }
    })
  }

  /**
   * Get current particle count (for debugging)
   */
  getParticleCount() {
    return this.particles.length
  }

  /**
   * Clear all particles (e.g., when changing scenes)
   */
  clear() {
    this.particles = []
    if (this.scene.seasonalFXLayer) {
      this.scene.seasonalFXLayer.clear()
    }
  }
}
