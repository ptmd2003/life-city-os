import Cat from '../sprites/cat.js'

export function spawnPlayer(scene) {

  const centerX = scene.scale.width / 2
  const centerY = scene.originY + (scene.cols + scene.rows) * (scene.tileH / 4)

  scene.cat = new Cat(scene, centerX - 100, centerY - 20)
  
  // ✅ Cat depth: use same formula as buildings (y + displayHeight * 0.5 + 1000)
  const catY = centerY - 20
  scene.cat.setDepth(catY + scene.cat.displayHeight * 0.5 + 1000)

  // cat is managed separately from isoGroup so we can control its depth manually
}