/**
 * ChromaKeyPipeline — Custom WebGL pipeline for green screen removal
 * Removes specified color (chroma key) using a fragment shader
 */
import Phaser from 'phaser'

export class ChromaKeyPipeline extends Phaser.Renderer.WebGL.Pipelines.SinglePipeline {
  constructor(game) {
    super({
      game,
      name: 'ChromaKey',
      fragShader: `
        precision mediump float;
        
        uniform sampler2D uMainSampler;
        uniform vec3 uKeyColor;
        uniform float uThreshold;
        
        varying vec2 outTexCoord;
        varying vec4 outTint;

        void main() {
          vec4 color = texture2D(uMainSampler, outTexCoord);
          
          // Calculate difference between pixel color and key color
          float diff = length(color.rgb - uKeyColor);
          
          // Discard pixels similar to the key color
          if (diff < uThreshold) {
            discard;
          } else {
            gl_FragColor = color * outTint;
          }
        }
      `
    })
    
    // Default key color (pure green)
    this.keyColor = new Phaser.Math.Vector3(0.0, 1.0, 0.0)
    this.threshold = 0.4
  }

  /**
   * Set the chroma key color
   * @param {number} r Red (0-1)
   * @param {number} g Green (0-1)
   * @param {number} b Blue (0-1)
   */
  setKeyColor(r, g, b) {
    this.keyColor.set(r, g, b)
    return this
  }

  /**
   * Set the threshold for color matching (0.2-0.6 recommended)
   * @param {number} threshold Lower = stricter, Higher = more aggressive
   */
  setThreshold(threshold) {
    this.threshold = threshold
    return this
  }

  /**
   * Apply the pipeline to a game object
   * @param {Phaser.GameObjects.GameObject} gameObject
   */
  applyToGameObject(gameObject) {
    gameObject.setPipeline('ChromaKey')
    this.set3f('uKeyColor', this.keyColor.x, this.keyColor.y, this.keyColor.z)
    this.set1f('uThreshold', this.threshold)
    return this
  }
}
