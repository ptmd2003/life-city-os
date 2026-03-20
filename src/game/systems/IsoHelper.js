export function isoToScreen(tx, ty, originX, originY, xStep, yStep) {

  return {
    x: originX + (tx - ty) * xStep,
    y: originY + (tx + ty) * yStep
  }

}

export function screenToIso(screenX, screenY, originX, originY, xStep, yStep) {
  const relX = screenX - originX
  const relY = screenY - originY

  const tileX = (relX / xStep + relY / yStep) / 2
  const tileY = (relY / yStep - relX / xStep) / 2

  return { x: tileX, y: tileY }
}