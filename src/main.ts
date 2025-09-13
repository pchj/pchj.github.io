import * as THREE from 'three'
import { Settings } from './components/quality/Settings'
import { Layout } from './canvas/Layout'
import { CertificationsToggle } from './components/certifications/CertificationsToggle'
import { CardExpand } from './components/cards/CardExpand'
import { PanelClouds } from './components/panel/PanelClouds'
import { ThreeSetup } from './three/ThreeSetup'
import { SceneBuilder } from './three/SceneBuilder'
import { FieldGrid } from './canvas/FieldGrid'
import { Controls } from './controls/Controls'

class App {
  private settings: Settings
  private layout: Layout
  private threeSetup: ThreeSetup
  private sceneBuilder: SceneBuilder
  private fieldGrid: FieldGrid
  private controls: Controls
  private running = true
  private t0 = performance.now()
  private last2D = 0

  constructor() {
    // Initialize components
    this.settings = new Settings()
    this.layout = new Layout()
    
    // Initialize UI components
    new CertificationsToggle()
    new CardExpand()
    new PanelClouds()
    
    // Initialize 3D setup
    this.threeSetup = new ThreeSetup(this.layout, () => this.settings.clampRatio())
    this.sceneBuilder = new SceneBuilder(
      this.threeSetup,
      this.settings.prefersReduced,
      this.settings.quality
    )
    
    // Initialize 2D effects
    this.fieldGrid = new FieldGrid(
      this.layout,
      this.threeSetup.camera,
      this.settings.prefersReduced,
      this.settings.quality
    )
    
    // Initialize controls
    this.controls = new Controls(
      this.layout,
      this.threeSetup.camera,
      (mass) => this.fieldGrid.updateMass(mass)
    )
    
    this.init()
  }

  private init() {
    // Build the scene
    this.buildAll()
    
    // Set up resize observer
    new ResizeObserver(() => {
      this.layout.size2D(() => this.settings.clampRatio())
      this.threeSetup.resize()
      if (this.sceneBuilder.getHalo()) {
        this.sceneBuilder.getHalo().updateAspect((this.layout.VW || 1) / (this.layout.VH || 1))
      }
    }).observe(this.layout.glCanvas)
    
    // Set up visibility change handling
    document.addEventListener('visibilitychange', () => {
      this.running = (document.visibilityState === 'visible')
    })
    
    // Set up quality change handling
    this.settings.onQualityChange(() => this.hardReset())
    
    // Set up mouse events
    this.setupMouseEvents()
    
    // Start the animation loop
    requestAnimationFrame(() => this.tick())
    
    // Smoke check
    setTimeout(() => {
      console.assert(this.threeSetup.scene.children.length >= 3, 'scene ok')
    }, 300)
  }

  private setupMouseEvents() {
    addEventListener('pointermove', (e) => {
      const r = this.layout.glCanvas.getBoundingClientRect()
      
      // Update halo cursor position
      const nx = ((e.clientX - r.left) / r.width) * 2 - 1
      const ny = -(((e.clientY - r.top) / r.height) * 2 - 1)
      if (this.sceneBuilder.getHalo()) {
        this.sceneBuilder.getHalo().updateCursor(nx, ny)
      }
      
      // Update field grid mouse position
      this.fieldGrid.updateMouse(e.clientX, e.clientY)
    }, { passive: true })
    
    addEventListener('scroll', () => {
      if (this.sceneBuilder.getHalo()) {
        const scrollProgress = this.controls.getScrollProgress()
        this.sceneBuilder.getHalo().updateScrollColors(scrollProgress)
      }
    }, { passive: true })
  }

  private buildAll() {
    this.sceneBuilder.buildScene()
    this.layout.size2D(() => this.settings.clampRatio())
    
    // Update controls with current objects
    this.controls.updateExposure(this.sceneBuilder.getObjects())
    this.controls.updateSpeed(this.sceneBuilder.getObjects())
  }

  private hardReset() {
    this.sceneBuilder.updateQuality(this.settings.quality, this.settings.prefersReduced)
    this.fieldGrid.updateQuality(this.settings.quality, this.settings.prefersReduced)
    this.buildAll()
  }

  private target2D(): number {
    return (this.settings.quality === 'ultra' || this.settings.quality === 'high') ? 1/60 : 1/30
  }

  private tick() {
    if (!this.running) {
      requestAnimationFrame(() => this.tick())
      return
    }

    const t = performance.now()
    const dt = (t - this.t0) / 1000
    this.t0 = t

    // Update controls and get world mouse
    this.controls.update(dt, this.settings.quality)
    const worldMouse = this.controls.getWorldMouse()

    // Update 3D objects
    if (this.sceneBuilder.getNebula()) {
      this.sceneBuilder.getNebula().update(dt)
    }

    if (this.sceneBuilder.getStarfield()) {
      this.sceneBuilder.getStarfield().updateMouse(worldMouse)
    }

    if (this.sceneBuilder.getGalaxy()) {
      const timeScale = this.settings.prefersReduced ? .35 : (
        this.settings.quality === 'ultra' ? .68 :
        this.settings.quality === 'high' ? .58 : .48
      )
      this.sceneBuilder.getGalaxy().update(dt, timeScale)
      this.sceneBuilder.getGalaxy().updateMouse(worldMouse)
    }

    if (this.sceneBuilder.getHalo()) {
      this.sceneBuilder.getHalo().update(dt)
    }

    // Update controls
    this.controls.updateExposure(this.sceneBuilder.getObjects())
    this.controls.updateSpeed(this.sceneBuilder.getObjects())

    // Render 3D scene
    this.threeSetup.render()

    // Update 2D effects at lower frame rate
    const now = t / 1000
    if (now - this.last2D >= this.target2D()) {
      this.fieldGrid.drawField()
      this.fieldGrid.drawGrid()
      this.last2D = now
    }

    requestAnimationFrame(() => this.tick())
  }
}

// Initialize the app
new App()