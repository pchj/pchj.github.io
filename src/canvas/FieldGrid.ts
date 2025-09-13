import * as THREE from 'three'
import { Layout } from './Layout'
import { FlowSeed } from '../types/global.d'

export class FieldGrid {
  private seeds: FlowSeed[] = []
  private worldMouse = new THREE.Vector2(0, 0)
  private mass = 0.7

  constructor(
    private layout: Layout,
    private camera: THREE.PerspectiveCamera,
    private prefersReduced: boolean,
    private quality: string
  ) {
    this.seedFlow()
  }

  private seedFlow() {
    this.seeds.length = 0
    const n = this.prefersReduced ? 30 : (
      this.quality === 'ultra' ? 100 :
      this.quality === 'high' ? 80 : 54
    )
    
    for (let i = 0; i < n; i++) {
      const a = i / n * Math.PI * 2
      const r = 1 + (i % 2) * .22
      this.seeds.push({
        x: Math.cos(a) * r,
        y: Math.sin(a) * r
      })
    }
  }

  private fVec(x: number, y: number): [number, number] {
    const r2 = Math.max(x * x + y * y, .0004)
    const inv = 1. / Math.pow(r2, .75)
    let vx = -y * inv
    let vy = x * inv
    
    const dx = x - this.worldMouse.x
    const dy = y - this.worldMouse.y
    const q2 = dx * dx + dy * dy + .02
    const bend = (this.quality === 'high' || this.quality === 'ultra') ? .32 : .26
    const pull = (this.quality === 'high' || this.quality === 'ultra') ? .11 : .08
    const grav = this.mass / q2
    
    vx += (-dy) * grav * bend + (-dx) * grav * pull
    vy += (dx) * grav * bend + (-dy) * grav * pull
    
    return [vx, vy]
  }

  private toScreen(x: number, y: number): [number, number] {
    const v = new THREE.Vector3(x, y, 0).project(this.camera)
    return [(v.x * .5 + .5) * this.layout.VW, (-v.y * .5 + .5) * this.layout.VH]
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

  drawField() {
    if (this.prefersReduced || document.visibilityState !== 'visible') return
    
    const fctx = this.layout.fieldContext
    fctx.clearRect(0, 0, this.layout.VW, this.layout.VH)
    fctx.globalCompositeOperation = 'lighter'
    
    const cols = ['rgba(31,211,191,0.14)', 'rgba(120,180,255,0.12)', 'rgba(229,101,255,0.10)', 'rgba(255,210,96,0.07)']
    const steps = this.quality === 'ultra' ? 80 : this.quality === 'high' ? 64 : 44
    
    for (let k = 0; k < this.seeds.length; k++) {
      let x = this.seeds[k].x * (3.0 + 1.9 * Math.sin((k * 13.1) % 6))
      let y = this.seeds[k].y * (1.9 + 1.3 * Math.cos((k * 7.7) % 6))
      let [sx, sy] = this.toScreen(x, y)
      
      fctx.beginPath()
      fctx.moveTo(sx, sy)
      
      for (let i = 0; i < steps; i++) {
        const [vx, vy] = this.fVec(x, y)
        const [vx2, vy2] = this.fVec(x + vx * .01, y + vy * .01)
        x += vx2 * .02
        y += vy2 * .02
        ;[sx, sy] = this.toScreen(x, y)
        fctx.lineTo(sx, sy)
      }
      
      fctx.strokeStyle = cols[k % cols.length]
      fctx.lineWidth = 1
      fctx.stroke()
    }
    
    fctx.globalCompositeOperation = 'source-over'
  }

  drawGrid() {
    if (document.visibilityState !== 'visible') return
    
    const gctx = this.layout.gridContext
    gctx.clearRect(0, 0, this.layout.VW, this.layout.VH)
    gctx.strokeStyle = 'rgba(255,255,255,0.055)'
    gctx.lineWidth = 1
    
    const step = this.quality === 'ultra' ? 36 : this.quality === 'high' ? 40 : 50
    const cols = Math.ceil(this.layout.VW / step) + 2
    const rows = Math.ceil(this.layout.VH / step) + 2
    
    // Draw horizontal lines
    for (let j = -1; j <= rows; j++) {
      gctx.beginPath()
      for (let i = -1; i <= cols; i++) {
        const sx = i * step
        const sy = j * step
        let p = this.screenToWorldOnPlane(sx, sy, 0)
        const dx = p.x - this.worldMouse.x
        const dy = p.y - this.worldMouse.y
        const r2 = dx * dx + dy * dy + .08
        const k = ((this.quality === 'high' || this.quality === 'ultra') ? .22 : .17) * this.mass / r2
        p.x += dx * k
        p.y += dy * k
        const q = new THREE.Vector3(p.x, p.y, 0).project(this.camera)
        const px = (q.x * .5 + .5) * this.layout.VW
        const py = (-q.y * .5 + .5) * this.layout.VH
        if (i === -1) gctx.moveTo(px, py)
        else gctx.lineTo(px, py)
      }
      gctx.stroke()
    }
    
    // Draw vertical lines
    for (let i = -1; i <= cols; i++) {
      gctx.beginPath()
      for (let j = -1; j <= rows; j++) {
        const sx = i * step
        const sy = j * step
        let p = this.screenToWorldOnPlane(sx, sy, 0)
        const dx = p.x - this.worldMouse.x
        const dy = p.y - this.worldMouse.y
        const r2 = dx * dx + dy * dy + .08
        const k = ((this.quality === 'high' || this.quality === 'ultra') ? .22 : .17) * this.mass / r2
        p.x += dx * k
        p.y += dy * k
        const q = new THREE.Vector3(p.x, p.y, 0).project(this.camera)
        const px = (q.x * .5 + .5) * this.layout.VW
        const py = (-q.y * .5 + .5) * this.layout.VH
        if (j === -1) gctx.moveTo(px, py)
        else gctx.lineTo(px, py)
      }
      gctx.stroke()
    }
  }

  updateMouse(clientX: number, clientY: number) {
    const r = this.layout.glCanvas.getBoundingClientRect()
    this.worldMouse.copy(this.screenToWorldOnPlane(clientX - r.left, clientY - r.top, 0))
  }

  updateMass(mass: number) {
    this.mass = mass
  }

  updateQuality(quality: string, prefersReduced: boolean) {
    this.quality = quality
    this.prefersReduced = prefersReduced
    this.seedFlow()
  }

  getWorldMouse() {
    return this.worldMouse
  }
}