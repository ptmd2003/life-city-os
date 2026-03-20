// ============================================================
// Life-City-OS — City Layout
// 36×36 isometric grid, ~40% usage for breathing room
// Iso math: isoX = originX + (tileX - tileY) * xStep
//           isoY = originY + (tileX + tileY) * yStep
// ============================================================
//
// TILE PARAMS (proven working — 44×32 tiles):
//   w=44, h=32
//   xStep = 44 * 0.44 ≈ 19.36
//   yStep = 32 * 0.32 ≈ 10.24
//   Origin: (0.5, 1) — bottom-center anchor
//
// New structure: Use asset keys directly as 'type' (no separate 'key' field)
// Example: { type: 'red-torii-gate', x: 20, y: 8, scale: 0.11, id: 'red-torii-gate-1' }
//
// ZONE MAP (approximate tile regions):
//
//     0         9        18        27       35
//   0 ┌─────────┬─────────┬─────────┬────────┐
//     │  River  │ Sakura  │         │        │
//     │  ~~~~   │  Hill   │  PARK   │        │
//   9 │  ~~~~   │ 🌸🌸   │ ⛩🪷🪑  │        │
//     │         ├─────────┤         │        │
//     │  River  │         │         │ STUDY  │
//  18 │  ~~~~   │ PLAYER  │         │ 📚🎹  │
//     │         │  HOME   │         │        │
//     │         │  🏠🐱  │         │        │
//  24 │         ├─────────┤─────────┤        │
//     │         │  DOJO   │TEAHOUSE │        │
//     │         │ 🥋⚔️   │  ☕🍡  │        │
//  35 └─────────┴─────────┴─────────┴────────┘
//

export const cityLayout = [
  // ═══════════════════════════════════════════
  // PARK ZONE — 3 test objects only
  // ═══════════════════════════════════════════

  // ⛩️ RED TORII GATE
  { type: "red-torii-gate",        x: 20, y: 8,  scale: 0.11, id: "red-torii-gate-1" },

  // 🪷 KOI POND
  { type: "koi-pond",              x: 24, y: 12, scale: 0.095, id: "koi-pond-1" },

  // 🪑 WOODEN BENCH
  { type: "wooden-bench",          x: 22, y: 14, scale: 0.076, id: "bench-1" },

  // 🐱 CAT (will be handled separately in CityScene)
  // Placeholder for now
]