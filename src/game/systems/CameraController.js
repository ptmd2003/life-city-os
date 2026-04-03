import Phaser from 'phaser'
import { CAMERA_Y_OFFSET, CAMERA_BOTTOM_PAN_LIMIT, CAMERA_ZOOM_MAX, VIEWPORT_ASPECT_RATIO } from '../constants.js'

export function setupCamera(scene) {
  // Calculate the true center of the isometric world
  // This is where the game world center is, not screen center
  const centerX = scene.scale.width / 2
  const centerY = scene.originY + (scene.cols + scene.rows) * (scene.tileH / 4) + CAMERA_Y_OFFSET

  scene.worldCenter = { x: centerX, y: centerY }

  scene.cameraState = {
    // Camera always looks at this point (ground center)
    centerX: centerX,
    centerY: centerY,
    panSpeed: 8,
    zoomLevel: 0.6
  }

  scene.cameras.main.setZoom(0.6)
  scene.cameras.main.centerOn(centerX, centerY)

  // Mouse wheel for zoom (around screen center)
  scene.input.on('wheel', (pointer, gameObjects, deltaX, deltaY) => {
    const newZoom = Phaser.Math.Clamp(
      scene.cameraState.zoomLevel - deltaY * 0.001,
      0.5,
      CAMERA_ZOOM_MAX
    )
    scene.cameraState.zoomLevel = newZoom
    scene.cameras.main.setZoom(newZoom)
    
    // After zoom, recenter on worldCenter to keep ground fixed
    scene.cameras.main.centerOn(scene.cameraState.centerX, scene.cameraState.centerY)
  })
}

export function updateCamera(scene) {
  // ✅ Camera follows pan offset (A/S/W/D keys move camera around world)
  // Clamp position to background bounds
  if (scene.backgroundBounds) {
    const camera = scene.cameras.main
    const zoomLevel = camera.zoom || 1.0
    const minZoom = 0.5 // Max zoom-out level — viewport / minZoom = background size
    
    // Calculate viewport size at current zoom
    const viewportHalfWidth = scene.scale.width / (2 * zoomLevel)
    const viewportHalfHeight = scene.scale.height / (2 * zoomLevel)
    
    // Clamp camera X and Y to stay within background bounds
    const { left, right, top, bottom } = scene.backgroundBounds
    
    scene.cameraState.centerX = Phaser.Math.Clamp(
      scene.cameraState.centerX,
      left + viewportHalfWidth,
      right - viewportHalfWidth
    )
    
    // ✅ Tighter bottom pan limit — S key can't pan too far down
    const normalMaxY = bottom - viewportHalfHeight
    const minY = top + viewportHalfHeight
    const panRangeDown = normalMaxY - scene.worldCenter.y
    const effectiveMaxY = scene.worldCenter.y + (panRangeDown * CAMERA_BOTTOM_PAN_LIMIT)
    
    scene.cameraState.centerY = Phaser.Math.Clamp(
      scene.cameraState.centerY,
      minY,
      effectiveMaxY  // Reduced bottom limit
    )
  }
  
  // Center camera on clamped position
  scene.cameras.main.centerOn(scene.cameraState.centerX, scene.cameraState.centerY)
}

/**
 * Pan camera with directional movement
 * Call from scene.update() or input handlers
 */
export function panCamera(scene, direction) {
  const panStep = 20 // pixels per pan
  
  switch(direction) {
    case 'up':
      scene.cameraState.centerY -= panStep
      break
    case 'down':
      scene.cameraState.centerY += panStep
      break
    case 'left':
      scene.cameraState.centerX -= panStep
      break
    case 'right':
      scene.cameraState.centerX += panStep
      break
  }
} 