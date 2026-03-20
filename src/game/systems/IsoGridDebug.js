import { isoToScreen } from './IsoHelper.js'

export function drawIsoGrid(scene, cols, rows) {

  const style = {
    font: "12px monospace",
    fill: "#ffffff",
    align: "center"
  }

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {

      const pos = isoToScreen(
        x,
        y,
        scene.originX,
        scene.originY,
        scene.xStep,
        scene.yStep
      )

      const label = scene.add.text(
        pos.x,
        pos.y - 10,
        `${x},${y}`,
        style
      )

      label.setOrigin(0.5)
      label.setDepth(9999)
      label.setAlpha(0.5)

    }
  }
}