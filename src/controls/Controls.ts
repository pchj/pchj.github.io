import * as THREE from 'three'
import { SceneObject } from '../types/global.d'

export class Controls {
  private exposureEl: HTMLInputElement
  private massEl: HTMLInputElement
  private speedEl: HTMLInputElement
  private worldMouse = new THREE.Vector2(0, 0)
  private baseMass = 0.7
  private mass = 0.7
  private spike = 0

  constructor(
    private layout: { glCanvas: HTMLCanvasElement; VW: number; VH: number },
    private camera: THREE.PerspectiveCamera,
    private onMassChange: (mass: number) => void
  ) {
    this.exposureEl = document.getElementById('exposure') as HTMLInputElement
    this.massEl = document.getElementById('mass') as HTMLInputElement
    this.speedEl = document.getElementById('speed') as HTMLInputElement
    
    this.initControls()
    this.initMouseEvents()
    this.initScrollEvents()
  }

  private initControls() {
    // Exposure control
    this.exposureEl.addEventListener('input', () => {
      // This will be handled by the main app through getExposure()
    })

    // Mass control
    this.massEl.addEventListener('input', () => {
      this.baseMass = parseFloat(this.massEl.value)
    })

    // Speed control
    this.speedEl.addEventListener('input', () => {
      // This will be handled by the main app through getSpeed()
    })
  }

  private initMouseEvents() {
    addEventListener('pointermove', (e) => {
      const r = this.layout.glCanvas.getBoundingClientRect()
      const nx = ((e.clientX - r.left) / r.width) * 2 - 1
      const ny = -(((e.clientY - r.top) / r.height) * 2 - 1)
      
      // Update cursor position for halo
      // This will be accessed via getCursorPosition()
      
      // Update world mouse position
      this.worldMouse.copy(this.screenToWorldOnPlane(e.clientX - r.left, e.clientY - r.top, 0))
    }, { passive: true })

    addEventListener('click', () => {
      this.spike = 1
    })
  }

  private initScrollEvents() {
    addEventListener('scroll', () => {
      // This will be handled by the main app through getScrollProgress()
    }, { passive: true })
  }

  private screenToWorldOnPlane(sx: number, sy: number, planeZ = 0): THREE.Vector2 {
    const nx = (sx / this.layout.VW) * 2 - 1
    const ny = -(sy / this.layout.VH) * 2 + 1
    const o = this.camera.position.clone()
    const v = new THREE.Vector3(nx, ny, .5).unproject(this.camera)
    const d = v.sub(o).normalize()
    const t = (planeZ - o.z) / d.z
    return new THREE.Vector2(o.x + d.x * t, o.y + d.y * t)
  }

  update(deltaTime: number, quality: string) {
    const massBias = (quality === 'high' || quality === 'ultra') ? .22 : 0
    this.mass += (this.baseMass + massBias - this.mass) * .06
    
    if (this.spike > 0) {
      this.mass += .5 * this.spike
      this.spike *= .88
    }

    this.onMassChange(this.mass)
  }

  getWorldMouse(): THREE.Vector3 {
    return new THREE.Vector3(this.worldMouse.x, this.worldMouse.y, this.mass)
  }

  getCursorPosition(): THREE.Vector2 {
    // This should be updated from pointer events
    const r = this.layout.glCanvas.getBoundingClientRect()
    // Return normalized device coordinates
    return new THREE.Vector2(0, 0) // Will be updated by mouse events
  }

  getScrollProgress(): number {
    return Math.max(0, Math.min(1, scrollY / (document.documentElement.scrollHeight - innerHeight)))
  }

  getExposure(): number {
    return parseFloat(this.exposureEl.value)
  }

  getSpeed(): number {
    return parseFloat(this.speedEl.value)
  }

  updateExposure(objects: SceneObject[]) {
    const nebula = objects.find(o => o.type === 'neb')
    if (nebula && nebula.mat instanceof THREE.ShaderMaterial) {
      nebula.mat.uniforms.uExposure.value = this.getExposure()
    }
  }

  updateSpeed(objects: SceneObject[]) {
    const galaxy = objects.find(o => o.type === 'gal')
    if (galaxy && galaxy.uni) {
      galaxy.uni.uSpeed.value = this.getSpeed()
    }
  }
}