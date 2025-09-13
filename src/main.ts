/**
 * Main application orchestration
 * Coordinates all modules and handles the animation loop
 */

import * as THREE from 'three';
import { ThreeSetup } from './three/ThreeSetup';
import { SceneBuilder } from './three/SceneBuilder';
import { Layout } from './canvas/Layout';
import { FieldGrid } from './canvas/FieldGrid';
import { Settings, type QualitySettings } from './components/quality/Settings';
import { CertificationsToggle } from './components/certifications/CertificationsToggle';
import { CardExpand } from './components/cards/CardExpand';
import { PanelClouds } from './components/panel/PanelClouds';
import { Controls } from './controls/Controls';

export class App {
  // Core systems
  private threeSetup: ThreeSetup;
  private sceneBuilder: SceneBuilder;
  private layout: Layout;
  private fieldGrid: FieldGrid;
  private settings: Settings;
  
  // UI Components
  private certToggle: CertificationsToggle;
  private cardExpand: CardExpand;
  private panelClouds: PanelClouds;
  private controls: Controls;
  
  // State
  private running: boolean = true;
  private worldMouse: THREE.Vector2 = new THREE.Vector2(0, 0);
  private baseMass: number = 0.7;
  private currentMass: number = 0.7;
  private spike: number = 0;
  private lastTime: number = 0;
  private last2DTime: number = 0;

  constructor() {
    // Initialize core systems
    this.threeSetup = new ThreeSetup();
    this.sceneBuilder = new SceneBuilder(this.threeSetup);
    this.layout = new Layout();
    this.fieldGrid = new FieldGrid(this.layout);
    this.settings = new Settings();
    
    // Initialize UI components
    this.certToggle = new CertificationsToggle();
    this.cardExpand = new CardExpand();
    this.panelClouds = new PanelClouds();
    this.controls = new Controls();
    
    this.init();
  }

  private init(): void {
    this.threeSetup.init();
    this.setupEventListeners();
    this.setupQualityChangeHandler();
    this.setupControls();
    this.buildInitialScene();
    this.startAnimationLoop();
    
    // Smoke test
    setTimeout(() => {
      console.assert(
        this.threeSetup.scene?.children.length && this.threeSetup.scene.children.length >= 3, 
        'Scene initialized correctly'
      );
    }, 300);
  }

  private setupEventListeners(): void {
    // Resize handler
    this.layout.onResize(() => {
      const { width, height } = this.layout.getViewportSize();
      const settings = this.settings.getQualitySettings();
      this.threeSetup.resize(width, height, settings.pixelRatio);
      this.sceneBuilder.updateHaloAspect(this.layout.getAspectRatio());
    });

    // Visibility change handler
    document.addEventListener('visibilitychange', () => {
      this.running = (document.visibilityState === 'visible');
    });

    // Mouse/pointer events
    addEventListener('pointermove', (e: PointerEvent) => {
      this.handlePointerMove(e);
    }, { passive: true });

    addEventListener('click', () => {
      this.spike = 1;
    });

    // Scroll handler
    addEventListener('scroll', () => {
      this.handleScroll();
    }, { passive: true });
  }

  private handlePointerMove(e: PointerEvent): void {
    const canvas = document.getElementById('gl');
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    
    // Normalized cursor position for halo
    const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const ny = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
    this.sceneBuilder.setCursorPosition(nx, ny);
    
    // World mouse position for galaxy interaction
    this.worldMouse = this.fieldGrid.screenToWorldOnPlane(
      e.clientX - rect.left, 
      e.clientY - rect.top, 
      0
    );
  }

  private handleScroll(): void {
    const scrollHeight = document.documentElement.scrollHeight;
    const windowHeight = window.innerHeight;
    const scrollProgress = Math.max(0, Math.min(1, 
      window.scrollY / (scrollHeight - windowHeight)
    ));
    
    this.sceneBuilder.updateScrollColors(scrollProgress);
  }

  private setupQualityChangeHandler(): void {
    this.settings.onQualityChange((settings: QualitySettings) => {
      this.rebuildScene(settings);
    });
  }

  private setupControls(): void {
    this.controls.updateCallbacks({
      onExposureChange: (value: number) => {
        this.sceneBuilder.setExposure(value);
      },
      onMassChange: (value: number) => {
        this.baseMass = value;
      },
      onSpeedChange: (value: number) => {
        this.sceneBuilder.setSpeed(value);
      }
    });
  }

  private buildInitialScene(): void {
    const settings = this.settings.getQualitySettings();
    this.sceneBuilder.buildScene(settings);
    this.fieldGrid.setCamera(this.threeSetup.camera!);
    this.fieldGrid.seedFlow(settings);
    
    const { width, height } = this.layout.getViewportSize();
    this.layout.size2D(settings.pixelRatio);
    this.threeSetup.resize(width, height, settings.pixelRatio);
    this.sceneBuilder.updateHaloAspect(this.layout.getAspectRatio());
  }

  private rebuildScene(settings: QualitySettings): void {
    this.sceneBuilder.rebuild(settings);
    this.fieldGrid.seedFlow(settings);
    
    const { width, height } = this.layout.getViewportSize();
    this.layout.size2D(settings.pixelRatio);
    this.threeSetup.resize(width, height, settings.pixelRatio);
    this.threeSetup.updateQuality(settings);
  }

  private startAnimationLoop(): void {
    this.lastTime = performance.now();
    this.animate();
  }

  private animate = (): void => {
    if (!this.running) {
      requestAnimationFrame(this.animate);
      return;
    }

    const currentTime = performance.now();
    const deltaTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;

    this.updatePhysics(deltaTime);
    this.updateVisuals(deltaTime, currentTime);
    this.render();

    requestAnimationFrame(this.animate);
  };

  private updatePhysics(deltaTime: number): void {
    const settings = this.settings.getQualitySettings();
    const massBias = (settings.quality === 'high' || settings.quality === 'ultra') ? 0.22 : 0;
    
    // Smooth mass interpolation
    this.currentMass += (this.baseMass + massBias - this.currentMass) * 0.06;
    
    // Handle interaction spike
    if (this.spike > 0) {
      this.currentMass += 0.5 * this.spike;
      this.spike *= 0.88;
    }
    
    this.fieldGrid.setMass(this.currentMass);
  }

  private updateVisuals(deltaTime: number, currentTime: number): void {
    const settings = this.settings.getQualitySettings();
    const deviceInfo = this.settings.getDeviceInfo();
    
    // Calculate time scale
    const timeScale = deviceInfo.prefersReduced ? 0.35 : 
                    settings.quality === 'ultra' ? 0.68 :
                    settings.quality === 'high' ? 0.58 : 0.48;
    
    // Update Three.js objects
    const worldMouse3D = new THREE.Vector3(this.worldMouse.x, this.worldMouse.y, this.currentMass);
    this.sceneBuilder.setMousePosition(worldMouse3D);
    this.sceneBuilder.update(deltaTime, timeScale);
    
    // Update 2D field and grid
    this.fieldGrid.setWorldMouse(this.worldMouse);
    this.fieldGrid.draw(settings, deviceInfo.prefersReduced, currentTime);
  }

  private render(): void {
    this.threeSetup.render();
  }

  public dispose(): void {
    this.running = false;
    this.sceneBuilder.dispose();
    this.threeSetup.dispose();
  }
}

// Initialize the application
let app: App | undefined;

try {
  app = new App();
  console.log('Application initialized successfully');
} catch (error) {
  console.error('Failed to initialize application:', error);
}

// Export for debugging
if (app) {
  (window as any).__app = app;
}