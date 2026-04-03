import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * Asset Auto-Reload Plugin
 * Watches src/assets directory and regenerates manifest when files change
 */
function assetAutoReloadPlugin() {
  let watcher = null
  
  return {
    name: 'asset-auto-reload',
    apply: 'serve', // Only in dev mode
    configResolved(config) {
      // No config needed
    },
    async handleHotUpdate({ file, server }) {
      // If a file in src/assets changed, regenerate manifest
      if (file.includes('src/assets')) {
        console.log(`📝 Asset changed: ${path.basename(file)}`)
        regenerateAssets()
        // Invalidate the preloadAssets module so it reloads
        const moduleId = path.join(__dirname, 'src/game/preloadAssets.js')
        server.moduleGraph.invalidateModule(
          server.moduleGraph.getModuleById(moduleId)
        )
        return [] // Don't do default HMR
      }
    },
  }
}

/**
 * Run generate-assets.js script
 */
function regenerateAssets() {
  return new Promise((resolve, reject) => {
    const child = spawn('node', ['scripts/generate-assets.js'], {
      cwd: __dirname,
      stdio: 'pipe',
    })
    
    let output = ''
    child.stdout.on('data', (data) => {
      output += data.toString()
    })
    child.stderr.on('data', (data) => {
      output += data.toString()
    })
    
    child.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ Assets regenerated (${new Date().toLocaleTimeString()})`)
        resolve()
      } else {
        console.error(`❌ Asset generation failed: ${output}`)
        reject(new Error(output))
      }
    })
  })
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), assetAutoReloadPlugin()],
  server: {
    port: 4000,
    strictPort: true,
  },
})
