/**
 * SeasonSystem — Real-time seasonal themes with manual test override
 * 
 * Seasons are based on real calendar (not game-time).
 * Can be overridden for testing/previewing via testSeason property.
 * 
 * Each season has:
 * - Sky color/effect
 * - Far backdrop silhouettes
 * - Horizon atmosphere band  
 * - World edge decoration
 * - Particle FX
 * - Optional color tint
 */
import logger from '../logger.js'

export class SeasonSystem {
  // Test override (null = use real season)
  static testSeason = null

  /**
   * Get current season as string
   * Respects testSeason override if set
   */
  static getSeason() {
    if (SeasonSystem.testSeason) {
      return SeasonSystem.testSeason
    }

    const month = new Date().getMonth() + 1
    if (month <= 3) return 'spring'
    if (month <= 6) return 'summer'
    if (month <= 9) return 'autumn'
    return 'winter'
  }

  /**
   * Set test season override (for testing/preview)
   * Pass null to return to real-time seasons
   */
  static setTestSeason(season) {
    if (season && !['spring', 'summer', 'autumn', 'winter'].includes(season)) {
      logger.warn(`Invalid season: ${season}`)
      return
    }
    SeasonSystem.testSeason = season
    logger.info(`Season override: ${season || 'CLEARED (real-time)'}`)
  }

  /**
   * Cycle to next season (for testing/preview button)
   */
  static cycleTestSeason() {
    const seasons = ['spring', 'summer', 'autumn', 'winter']
    const currentSeason = SeasonSystem.getSeason()
    const nextIndex = (seasons.indexOf(currentSeason) + 1) % seasons.length
    SeasonSystem.setTestSeason(seasons[nextIndex])
  }

  /**
   * Get full seasonal theme object
   * Includes sky, backdrop, edge decoration, particles, tint
   */
  static getSeasonTheme() {
    const season = SeasonSystem.getSeason()
    return SeasonSystem.THEMES[season]
  }

  /**
   * Seasonal theme definitions
   * Each theme controls:
   * - sky: Sky color effect
   * - backdrop: Far silhouette layer
   * - atmosphereband: Horizon fog/haze
   * - edgeDecor: World-edge decoration (trees, snow, etc)
   * - particles: Particle system type
   * - tint: Optional color overlay (null = none)
   */
  static THEMES = {
    spring: {
      name: '🌸 Spring',
      sky: 'sky_spring',
      backdropColor: 0xb0d8b8, // Soft green
      atmosphereHaze: { color: 0xffffff, alpha: 0.15 }, // Light mist
      edgeDecor: 'edge_blossom_trees',
      particles: 'sakura_petals',
      tint: null,
      groundTint: null,
    },
    summer: {
      name: '☀️ Summer',
      sky: 'sky_summer',
      backdropColor: 0x8fbc8f, // Soft sage green (from palette)
      atmosphereHaze: { color: 0xfffacd, alpha: 0.12 }, // Warm cream haze
      edgeDecor: 'edge_full_canopy',
      particles: 'pollen_dust',
      tint: 'warm',
      groundTint: null,
      // Summer palette accent colors (pastel aesthetic)
      accentColors: {
        pink: 0xffb8b8,     // Soft pink
        blue: 0xa8c8e1,     // Soft blue
        cream: 0xfffacd,    // Warm cream
        peach: 0xf4b8a0,    // Warm peach
      },
    },
    autumn: {
      name: '🍂 Autumn',
      sky: 'sky_autumn',
      backdropColor: 0xa89878, // Warm tan
      atmosphereHaze: { color: 0xd4c4b0, alpha: 0.1 }, // Soft cream haze
      edgeDecor: 'edge_orange_canopy',
      particles: 'falling_leaves',
      tint: 'gold',
      groundTint: 0xb8a880,
      // Autumn palette accent colors (pastel only)
      accentColors: {
        cream: 0xd4c4b0,    // Light cream
        tan: 0xa89878,      // Warm tan
        peach: 0xa67860,    // Peachy-brown
      },
    },
    winter: {
      name: '❄️ Winter',
      sky: 'sky_winter',
      backdropColor: 0x8eb3d4, // Icy blue
      atmosphereHaze: { color: 0xd0d8e8, alpha: 0.25 }, // Cold fog
      edgeDecor: 'edge_snow_capped',
      particles: 'snowfall',
      tint: 'cool',
      groundTint: 0xf5f5f5,
    },
  }
}