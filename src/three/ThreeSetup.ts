/**
 * Three.js renderer, camera, and scene setup
 * Handles WebGL initialization and resize management
 */

import * as THREE from 'three';
import type { QualitySettings } from '../components/quality/Settings';

export class ThreeSetup {
  public renderer: THREE.WebGLRenderer | null = null;
  public scene: THREE.Scene | null = null;
  public camera: THREE.PerspectiveCamera | null = null;
  public overlay: THREE.Scene | null = null;
  public overlayCamera: THREE.OrthographicCamera | null = null;
  
  private canvas: HTMLCanvasElement | null = null;

  constructor() {
    this.canvas = document.getElementById('gl') as HTMLCanvasElement;
    if (!this.canvas) {
      throw new Error('ThreeSetup: Canvas element with id "gl" not found');
    }
  }

  public init(): void {
    this.initRenderer();
    this.initScenes();
    this.initCameras();
  }

  private initRenderer(): void {
    if (!this.canvas) return;

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: false,
      alpha: true,
      powerPreference: 'high-performance'
    });

    this.renderer.setClearColor(0x000000, 0);
    this.renderer.setPixelRatio(1); // Will be updated by quality settings
  }

  private initScenes(): void {
    this.scene = new THREE.Scene();
    this.overlay = new THREE.Scene();
  }

  private initCameras(): void {
    // Main perspective camera
    this.camera = new THREE.PerspectiveCamera(60, 1, 0.1, 400);
    this.camera.position.set(0, 0, 8);

    // Orthographic camera for overlay
    this.overlayCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  }

  public updateQuality(settings: QualitySettings): void {
    if (!this.renderer) return;
    this.renderer.setPixelRatio(settings.pixelRatio);
  }

  public resize(width: number, height: number, pixelRatio: number = 1): void {
    if (!this.renderer || !this.camera) return;

    this.renderer.setPixelRatio(pixelRatio);
    this.renderer.setSize(width, height, true);
    
    this.camera.aspect = (width || 1) / (height || 1);
    this.camera.updateProjectionMatrix();
  }

  public render(): void {
    if (!this.renderer || !this.scene || !this.camera || !this.overlay || !this.overlayCamera) {
      return;
    }

    // Render main scene
    this.renderer.render(this.scene, this.camera);
    
    // Render overlay without clearing
    this.renderer.autoClear = false;
    this.renderer.clearDepth();
    this.renderer.render(this.overlay, this.overlayCamera);
    this.renderer.autoClear = true;
  }

  public clearScenes(): void {
    if (this.scene) {
      this.scene.clear();
    }
    if (this.overlay) {
      this.overlay.clear();
    }
  }

  public dispose(): void {
    if (this.renderer) {
      this.renderer.dispose();
    }
  }
}