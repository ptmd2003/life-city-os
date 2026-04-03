# 🏙️ Life City OS

A cozy isometric city life simulation game where your city mirrors your real daily life.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ (check with `node --version`)
- npm or yarn

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Generate asset manifest (CRITICAL — do this first!)
npm run generate-assets

# 3. Start dev server
npm run dev
```

**⚠️ Important:** You MUST run `npm run generate-assets` before starting the dev server for the first time. This scans all images in `src/assets/` and creates the manifest that Phaser uses to load assets.

## 📁 Project Structure

```
src/
├── assets/          # All game sprites (organized by zone + type)
├── components/      # React UI (Sidebar, TransformPanel)
├── game/
│   ├── scenes/      # Phaser scene logic (CityScene)
│   ├── sprites/     # Sprite classes & registry
│   ├── systems/     # Isometric grid, building placement, camera
│   ├── world/       # Game state (health, time, weather)
│   ├── map/         # Layout configs (cityLayout, groundLayout)
│   └── preloadAssets.js
└── stores/          # Zustand store (useCityStore.js)
```

## 🎮 Game Features (Stage 1)

- ✅ **36×36 isometric grid** with full camera pan/zoom
- ✅ **Click to select** buildings (green glow feedback)
- ✅ **Drag to move** buildings on the grid
- ✅ **Transform panel**: Rotate 180°/-180°, Resize 0.05x–3x, Delete
- ✅ **Ground painter**: Paint full ground tiles or flat overlays
- ✅ **Layout persistence**: Auto-save state to localStorage with version history
- ✅ **Storage panel**: Browse & add sprites from asset registry
- ✅ **World health system**: Visual darkness overlay based on check-in activity

## 💻 Development

### Build & Preview
```bash
npm run build      # Production build
npm run preview    # Preview production build locally
```

### Lint & Format
```bash
npm run lint       # Run ESLint
```

### Adding New Assets

1. Create your sprite as a PNG in the appropriate zone folder:
   ```
   src/assets/ZONE/TYPE/my-sprite.png
   ```
   where `ZONE` is: characters, dojo, nature, park, study, teahouse, shared, tiles

2. Run the asset generator:
   ```bash
   npm run generate-assets
   ```

3. Reference the sprite in code by its **base filename** (without .png):
   ```javascript
   scene.add.image(x, y, 'my-sprite')
   ```

## 🏗️ Architecture Overview

### Tech Stack
- **Game Engine**: Phaser 3.90 (isometric rendering)
- **UI Framework**: React 19 + Vite
- **State Management**: Zustand 5
- **Language**: JavaScript ES6+

### Key Systems
- **CityScene**: Main Phaser scene — handles rendering, input, grid
- **BuildingPlacementSystem**: Click-drag-transform logic
- **GroundRender**: Isometric tile grid + ground painter
- **WorldHealthSystem**: Check-in based difficulty/visuals
- **useCityStore**: Persistent state + version history

### Workflow
1. **User interacts** with Phaser canvas (click, drag, paint)
2. **BuildingPlacementSystem** updates local scene state
3. **TransformPanel** (React) reflects state changes
4. **User clicks "Save Layout"** → Persisted to localStorage via Zustand
5. **Reload page** → Data auto-hydrates from localStorage

## 🧪 Testing

After making changes, test the core features:

1. **Place buildings**: Click-drag objects, verify grid snapping
2. **Transform**: Rotate/resize/delete, verify persistence
3. **Ground painter**: Paint tiles, verify refresh
4. **Reload**: Refresh page, verify layout persists
5. **No regressions**: All prior features still work

## 📝 Commits & GitHub

This project uses descriptive commit messages. When pushing to GitHub:

```bash
git add .
git commit -m "feat: add XYZ feature

- What was added/changed
- Why (problem solved)
- Testing notes
"
git push origin main
```

## 🐛 Known Issues & Next Steps

- [ ] Time display in Sidebar (Stage 2)
- [ ] Day/night cycle visuals
- [ ] Population & economy systems
- [ ] NPCs & daily routines

See `memory.md` for development history and pending features.

## 📚 References

- **Phaser API**: https://photonstorm.github.io/phaser3-docs/
- **Isometric Grid Math**: Dimetric 2:1 projection, 44×32 tile size
- **Asset Registry**: `src/game/sprites/assetRegistry.js`

---

**Last Updated:** 2026-03-20  
**Stage:** 1 (Layout Editor + Persistence ✅)
