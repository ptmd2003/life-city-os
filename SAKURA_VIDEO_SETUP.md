# 🎬 Sakura Video Overlay Setup Guide

## Status: ✅ Code Integration Complete
- VideoOverlaySystem created and integrated
- CityScene now loads sakura video
- Build passes (85 modules, zero errors)

## Next Step: Place Your Video File

### Where to put it:
```
src/assets/videos/sakura-petals.mp4
```

### Video file info:
- **File you uploaded:** `videoplayback.1775129473683.publer.com.mp4`
- **File size:** ~1.5 MB
- **Format:** MP4 (h.264 codec)
- **Duration:** [Will loop automatically]

### How to place the file:

**Option 1: Drag & Drop (Easiest)**
1. In VS Code file explorer, right-click on `src/assets/videos/`
2. Choose "Reveal in Finder"
3. Drag your video file into the `videos/` folder
4. Rename to `sakura-petals.mp4`

**Option 2: Terminal**
```bash
# Copy your video file
cp /path/to/videoplayback.1775129473683.publer.com.mp4 \
   src/assets/videos/sakura-petals.mp4
```

**Option 3: Finder**
1. Open Finder at: `Downloads/DA/HTML/life-city-os/src/assets/videos/`
2. Move your downloaded video there
3. Rename to `sakura-petals.mp4`

---

## What the code does:

1. **VideoOverlaySystem.js** — Creates a video overlay layer
   - Renders video frames to canvas texture
   - Supports looping, alpha blending, playback control
   - Positioned above game world, below UI

2. **CityScene.js** — Initializes video overlay
   - Loads `src/assets/videos/sakura-petals.mp4`
   - Sets alpha to 0.75 (75% opacity)
   - Auto-loops continuously
   - Renders every frame via requestAnimationFrame

3. **Features:**
   - ✅ Seamless looping
   - ✅ Responsive to viewport resizing
   - ✅ Adjustable transparency (0.75 currently)
   - ✅ Graceful fallback to particles if video fails to load
   - ✅ Proper cleanup on scene shutdown

---

## Testing:

1. **Place video file** in `src/assets/videos/sakura-petals.mp4`
2. **Refresh browser** (Ctrl+R or Cmd+R) at http://localhost:4000
3. **Check browser console** for:
   - ✅ `🎬 [VideoOverlay] Playing sakura video: src/assets/videos/sakura-petals.mp4`
   - Or ❌ `Failed to play sakura video: ...` (fallback to particles)

---

## Customization:

Open `src/game/scenes/CityScene.js` line 95-102 to adjust:

```javascript
this.videoOverlaySystem.playSakuraVideo('src/assets/videos/sakura-petals.mp4', {
  loop: true,      // ← Keep looping? true/false
  alpha: 0.75,     // ← Opacity (0.0 = invisible, 1.0 = opaque)
  speed: 1.0,      // ← Playback speed (0.5 = half speed, 2.0 = 2x)
  blend: 'NORMAL'  // ← 'NORMAL', 'ADD', 'MULTIPLY', etc.
})
```

---

## Troubleshooting:

If video doesn't show:

1. **Check file exists:** `ls -la src/assets/videos/sakura-petals.mp4`
2. **Check console for errors:** F12 DevTools → Console
3. **Try higher alpha:** Change `0.75` → `0.9` in CityScene.js
4. **Check video format:** Ensure it's MP4 with h.264 codec
5. **Test video itself:** Download and play locally first

---

Ready to test! 🎬
