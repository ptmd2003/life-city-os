import Phaser from 'phaser'

export function setupCamera(scene) {
  const centerX = scene.scale.width / 2
  const centerY = scene.originY + (scene.cols + scene.rows) * (scene.tileH / 4)

  scene.worldCenter = { x: centerX, y: centerY }

  scene.cameraState = {
    targetX: centerX,
    targetY: centerY,
    panSpeed: 8
  }

  scene.cameras.main.setZoom(0.6)

  scene.input.on('wheel', (pointer, gameObjects, deltaX, deltaY) => {
    const zoom = scene.cameras.main.zoom

    scene.cameras.main.setZoom(
      Phaser.Math.Clamp(zoom - deltaY * 0.001, 0.3, 2)
    )
  })
}

export function updateCamera(scene) {
  let panX = 0
  let panY = 0

  if (scene.keys.up.isDown || scene.keys.w.isDown) panY -= scene.cameraState.panSpeed
  if (scene.keys.down.isDown || scene.keys.s.isDown) panY += scene.cameraState.panSpeed
  if (scene.keys.left.isDown || scene.keys.a.isDown) panX -= scene.cameraState.panSpeed
  if (scene.keys.right.isDown || scene.keys.d.isDown) panX += scene.cameraState.panSpeed

  if (panX !== 0 || panY !== 0) {
    scene.cameraState.targetX += panX / scene.cameras.main.zoom
    scene.cameraState.targetY += panY / scene.cameras.main.zoom
  }

  const smooth = 0.1

  scene.cameras.main.scrollX +=
    (scene.cameraState.targetX - scene.cameras.main.scrollX) * smooth

  scene.cameras.main.scrollY +=
    (scene.cameraState.targetY - scene.cameras.main.scrollY) * smooth
} 