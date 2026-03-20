/**
 * ✅ Isometric depth sorting based on tile position
 * Objects further down-right (higher tileX + tileY) render behind objects up-left (lower sum)
 * Formula: depth = (tileX + tileY) * 100
 */
export function depthSort(group) {

  group.children.iterate(obj => {

    if (!obj || obj.tileX === undefined || obj.tileY === undefined) return

    obj.setDepth((obj.tileX + obj.tileY) * 100)

  })

}