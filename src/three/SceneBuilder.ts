import * as THREE from 'three'
import { ThreeSetup } from './ThreeSetup'
import { Nebula } from './Nebula'
import { Starfield } from './Starfield'
import { Galaxy } from './Galaxy'
import { Halo } from './Halo'

export interface SceneObject {
  type: 'neb' | 'sf' | 'gal' | 'halo'
  mat: THREE.ShaderMaterial | THREE.Material
  uni?: {
    uTime?: { value: number }
    uMouse?: { value: THREE.Vector3 }
    uCursor?: { value: THREE.Vector2 }
    uScale?: { value: number }
    uAspect?: { value: number }
    uExposure?: { value: number }
    uSpeed?: { value: number }
    uHue?: { value: number }
    [key: string]: any
  }
}

export class SceneBuilder {
  private nebula!: Nebula
  private starfield!: Starfield
  private galaxy!: Galaxy
  private halo!: Halo
  private objects: SceneObject[] = []

  constructor(
    private threeSetup: ThreeSetup,
    private prefersReduced: boolean,
    private quality: string
  ) {}

  buildScene() {
    this.objects.length = 0
    this.threeSetup.scene.clear()
    this.threeSetup.overlay.clear()

    // Create nebula
    this.nebula = new Nebula()
    this.threeSetup.scene.add(this.nebula.getMesh())
    this.objects.push({
      type: 'neb',
      mat: this.nebula.getMaterial()
    })

    // Create starfield
    const BG = this.prefersReduced ? 2800 : (
      this.quality === 'ultra' ? 24000 :
      this.quality === 'high' ? 16000 : 6000
    )
    this.starfield = new Starfield(BG)
    this.threeSetup.scene.add(this.starfield.getPoints())
    this.objects.push({
      type: 'sf',
      mat: this.starfield.getPoints().material as THREE.ShaderMaterial,
      uni: this.starfield.getUniforms()
    })

    // Create galaxy
    const CNT = this.prefersReduced ? 5400 : (
      this.quality === 'ultra' ? 50000 :
      this.quality === 'high' ? 32000 : 13000
    )
    
    // Update star count display
    const starCountEl = document.getElementById('starCount')
    if (starCountEl) {
      starCountEl.textContent = CNT.toLocaleString()
    }

    this.galaxy = new Galaxy(CNT)
    this.threeSetup.scene.add(this.galaxy.getPoints())
    this.objects.push({
      type: 'gal',
      mat: this.galaxy.getPoints().material as THREE.ShaderMaterial,
      uni: this.galaxy.getUniforms()
    })

    // Create halo
    const HALO = this.prefersReduced ? 110 : (
      this.quality === 'ultra' ? 520 :
      this.quality === 'high' ? 320 : 160
    )
    this.halo = new Halo(HALO)
    this.threeSetup.overlay.add(this.halo.getPoints())
    this.objects.push({
      type: 'halo',
      mat: this.halo.getPoints().material as THREE.ShaderMaterial,
      uni: this.halo.getUniforms()
    })
  }

  getObjects() {
    return this.objects
  }

  getNebula() {
    return this.nebula
  }

  getStarfield() {
    return this.starfield
  }

  getGalaxy() {
    return this.galaxy
  }

  getHalo() {
    return this.halo
  }

  updateQuality(quality: string, prefersReduced: boolean) {
    this.quality = quality
    this.prefersReduced = prefersReduced
  }
}