import * as THREE from 'three'
import { Layout } from '../canvas/Layout'

export class ThreeSetup {
  public renderer!: THREE.WebGLRenderer
  public scene!: THREE.Scene
  public camera!: THREE.PerspectiveCamera
  public overlay!: THREE.Scene
  public cam2!: THREE.OrthographicCamera

  constructor(
    private layout: Layout,
    private clampRatio: () => number
  ) {
    this.init()
  }

  private init() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.layout.glCanvas,
      antialias: false,
      alpha: true,
      powerPreference: 'high-performance'
    })
    
    this.renderer.setClearColor(0x000000, 0)
    this.renderer.setPixelRatio(this.clampRatio())
    
    this.scene = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera(60, 1, 0.1, 400)
    this.camera.position.set(0, 0, 8)
    
    this.overlay = new THREE.Scene()
    this.cam2 = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
    
    this.resize()
  }

  resize() {
    this.renderer.setPixelRatio(this.clampRatio())
    this.renderer.setSize(this.layout.VW, this.layout.VH, true)
    this.camera.aspect = (this.layout.VW || 1) / (this.layout.VH || 1)
    this.camera.updateProjectionMatrix()
  }

  render() {
    this.renderer.render(this.scene, this.camera)
    this.renderer.autoClear = false
    this.renderer.clearDepth()
    this.renderer.render(this.overlay, this.cam2)
    this.renderer.autoClear = true
  }
}