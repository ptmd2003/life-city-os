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

    // Destroy old video first
    if (this.videoSprite) {
      this.destroy()
    }

    try {
      // Create video sprite
      this.videoSprite = this.scene.add.video(0, 0, videoKey)
      if (!this.videoSprite) return

      this.videoSprite.setOrigin(0.5, 0.5)
      // ✅ Position at camera center (fixed to camera, not world)
      const camera = this.scene.cameras.main
      this.videoSprite.setPosition(camera.centerX, camera.centerY)
      this.videoSprite.setDepth(9999)
      this.videoSprite.setBlendMode(blend)
      this.videoSprite.setAlpha(alpha)
      this.videoSprite.setScrollFactor(0, 0)  // ✅ Fixed to camera (doesn't pan)
      
      // Mark as video overlay to exclude from hover effects
      this.videoSprite._isVideoOverlay = true
      
      logger.info(`Loaded video: ${videoKey}`)  

      // ✅ Size to match camera/canvas (not native dimensions)
      this.videoSprite.setDisplaySize(camera.width, camera.height)

      // Set playback speed
      if (this.videoSprite.video) {
        this.videoSprite.video.playbackRate = speed
        this.videoSprite.video.loop = false
      }

      // Play video
      this.videoSprite.play()
      
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
            logger.debug(`Video looping at ${vid.currentTime.toFixed(2)}s`)
            vid.currentTime = loopStart
            vid.play()
            // ✅ Ensure alpha stays at 1.0 during loop
            if (this.videoSprite.alpha !== 1.0) {
              logger.warn(`Video alpha drift detected during loop, resetting`)
              this.videoSprite.setAlpha(1.0)
            }
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
            // ✅ Ensure alpha stays at 1.0 during loop
            if (this.videoSprite.alpha !== 1.0) {
              logger.warn(`Video alpha drift detected on ended, resetting`)
              this.videoSprite.setAlpha(1.0)
            }
          }
        }

        video.addEventListener('timeupdate', this.timeUpdateHandler)
        video.addEventListener('ended', this.endedHandler)
      }

      this.isPlaying = true
      this.currentVideoKey = videoKey

    } catch (err) {
      logger.error(`VideoOverlay error: ${err.message}`)
    }
  }

  stop() {
    if (this.videoSprite) {
      try {
        this.videoSprite.stop()
        this.isPlaying = false
      } catch (err) {
        // Silently fail
      }
    }
  }

  setAlpha(alpha) {
    // ✅ LOCK ALPHA TO 1.0 ALWAYS - Video overlay should always be fully opaque
    if (this.videoSprite) {
      if (alpha !== 1.0) {
        logger.debug(`Alpha change blocked (locked to 1.0)`)
      }
      this.videoSprite.setAlpha(1.0)  // Always 1.0, never change
    }
  }

  pause() {
    if (this.videoSprite) {
      try {
        this.videoSprite.pause()
      } catch (err) {
        // Silently fail
      }
    }
  }

  resume() {
    if (this.videoSprite) {
      try {
        this.videoSprite.resume()
      } catch (err) {
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
      } catch (err) {
        // Force cleanup even if error
        this.videoSprite = null
        this.timeUpdateHandler = null
        this.endedHandler = null
      }
    }
  }
}
