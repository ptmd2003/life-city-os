/**
 * VideoOverlaySystem — Manages video overlays for seasonal effects
 * Simplified: No pipelines, no unnecessary complexity
 */
import logger from '../logger.js'

export class VideoOverlaySystem {
  constructor(scene) {
    this.scene = scene
    this.videoSprite = null
    this.isPlaying = false
    this.currentVideoKey = null
    this.timeUpdateHandler = null
    this.endedHandler = null
  }

  init() {
    // Ready for video playback
    // Mark video sprites to exclude from hover effects
  }

  /**
   * Play video overlay
   * @param {string} videoKey - Preloaded video key ('sakura', 'winter', etc)
   * @param {Object} options - {alpha, speed, blend, loopStart, loopEnd}
   */
  playSakuraVideo(videoKey = 'sakura', options = {}) {
    const {
      alpha = 1.0,
      speed = 0.8,
      blend = 'SCREEN',
      loopStart = 10,
      loopEnd = 30
    } = options

    // Skip if same video already playing
    if (this.videoSprite && this.currentVideoKey === videoKey) {
      return
    }

    // 🔍 DEBUG: Log when video creation is triggered
    logger.info(`[VideoOverlay] Creating video: ${videoKey} (alpha=${alpha}, speed=${speed}, loopStart=${loopStart}, loopEnd=${loopEnd})`)

    // Destroy old video first
    if (this.videoSprite) {
      this.destroy()
    }

    try {
      // Create video sprite
      this.videoSprite = this.scene.add.video(0, 0, videoKey)
      if (!this.videoSprite) return

      this.videoSprite.setOrigin(0.5, 0.5)
      // ✅ Position at world center (world-fixed like the ground)
      this.videoSprite.setPosition(this.scene.worldCenter.x, this.scene.worldCenter.y)
      this.videoSprite.setDepth(9999)
      this.videoSprite.setBlendMode(blend)
      this.videoSprite.setAlpha(alpha)
      
      // 🔍 DEBUG: Monitor alpha changes (intercept setAlpha calls)
      const originalSetAlpha = this.videoSprite.setAlpha.bind(this.videoSprite)
      this.videoSprite.setAlpha = (value) => {
        if (value !== alpha) {
          console.warn(`⚠️ Video setAlpha called: ${alpha} → ${value}`)
          console.trace('setAlpha call stack:')
        }
        return originalSetAlpha(value)
      }
      
      
      this.videoSprite.setScrollFactor(1, 1)  // ✅ World-fixed (pans with camera like ground)
      
      // Mark as video overlay to exclude from hover effects
      this.videoSprite._isVideoOverlay = true
      
      logger.info(`Loaded video: ${videoKey}`)  

      // ✅ Size to match initial canvas (fixed dimensions, not camera viewport)
      const camera = this.scene.cameras.main
      this.videoSprite.setDisplaySize(camera.width, camera.height)

      // Set playback speed
      if (this.videoSprite.video) {
        this.videoSprite.video.playbackRate = speed
        this.videoSprite.video.loop = false
      }

      // Play video
      this.videoSprite.play()
      
      // 🔍 DEBUG: Log when play() is called
      logger.info(`[VideoOverlay] video.play() called for ${videoKey}`)
      
      if (this.videoSprite.video) {
        this.videoSprite.video.currentTime = loopStart
      }

      // Custom looping handlers
      if (this.videoSprite.video) {
        const video = this.videoSprite.video
        const actualLoopEnd = loopEnd === null ? video.duration : loopEnd
        const loopThreshold = actualLoopEnd - 0.2

        this.timeUpdateHandler = () => {
          if (!this.videoSprite?.video) return
          const vid = this.videoSprite.video
          if (vid.currentTime >= loopThreshold) {
            logger.debug(`Video looping at ${vid.currentTime.toFixed(2)}s (threshold: ${loopThreshold.toFixed(2)}s)`)
            vid.currentTime = loopStart
            vid.play()
          }
        }

        this.endedHandler = () => {
          logger.debug(`Video ended, resetting`)
          if (this.videoSprite?.video) {
            this.videoSprite.video.currentTime = loopStart
            const playPromise = this.videoSprite.video.play()
            if (playPromise) {
              playPromise.catch((err) => {
                logger.warn(`Play error on loop: ${err.message}`)
              })
            }
          }
        }

        video.addEventListener('timeupdate', this.timeUpdateHandler)
        video.addEventListener('ended', this.endedHandler)
        
        // 🔍 DEBUG: Log when video actually starts playing
        video.addEventListener('play', () => {
          logger.info(`[VideoOverlay] HTML5 video 'play' event fired for ${videoKey}`)
        })
        
        video.addEventListener('playing', () => {
          logger.info(`[VideoOverlay] HTML5 video 'playing' event fired for ${videoKey}`)
        })
        
        video.addEventListener('pause', () => {
          logger.warn(`[VideoOverlay] HTML5 video 'pause' event fired for ${videoKey}`)
        })
      }

      this.isPlaying = true
      this.currentVideoKey = videoKey

    } catch {
      // Silently fail on video setup
    }
  }

  stop() {
    if (this.videoSprite) {
      try {
        this.videoSprite.stop()
        this.isPlaying = false
      } catch {
        // Silently fail
      }
    }
  }

  pause() {
    if (this.videoSprite) {
      try {
        this.videoSprite.pause()
      } catch {
        // Silently fail
      }
    }
  }

  resume() {
    if (this.videoSprite) {
      try {
        this.videoSprite.resume()
      } catch {
        // Silently fail
      }
    }
  }

  /**
   * Update video size to match camera (called on window resize)
   */
  updateSize() {
    if (this.videoSprite) {
      const camera = this.scene.cameras.main
      this.videoSprite.setDisplaySize(camera.width, camera.height)
      this.videoSprite.setPosition(camera.centerX, camera.centerY)
    }
  }

  show() {
    if (this.videoSprite) {
      this.videoSprite.setVisible(true)
      this.videoSprite.resume()
    }
  }

  hide() {
    if (this.videoSprite) {
      this.videoSprite.setVisible(false)
      this.videoSprite.pause()
    }
  }

  toggle() {
    if (this.videoSprite) {
      const isVisible = this.videoSprite.visible
      if (isVisible) {
        this.hide()
      } else {
        this.show()
      }
      return !isVisible
    }
    return false
  }

  destroy() {
    if (this.videoSprite) {
      try {
        // Remove event listeners
        if (this.videoSprite.video) {
          if (this.timeUpdateHandler) {
            this.videoSprite.video.removeEventListener('timeupdate', this.timeUpdateHandler)
          }
          if (this.endedHandler) {
            this.videoSprite.video.removeEventListener('ended', this.endedHandler)
          }
        }
        
        // Stop playback
        this.stop()
        
        // Destroy sprite
        this.videoSprite.destroy(true)
        this.videoSprite = null
        this.currentVideoKey = null
        this.timeUpdateHandler = null
        this.endedHandler = null
      } catch {
        // Force cleanup even if error
        this.videoSprite = null
        this.timeUpdateHandler = null
        this.endedHandler = null
      }
    }
  }
}
