/**
 * Scene builder and management
 * Orchestrates creation and rebuilding of all Three.js objects
 */

import * as THREE from 'three';
import { ThreeSetup } from './ThreeSetup';
import { Nebula } from './Nebula';
import { Starfield } from './Starfield';
import { Galaxy } from './Galaxy';
import { Halo } from './Halo';
import type { QualitySettings } from '../components/quality/Settings';

export interface SceneObjects {
  nebula: Nebula | null;
  starfield: Starfield | null;
  galaxy: Galaxy | null;
  halo: Halo | null;
}

export class SceneBuilder {
  private threeSetup: ThreeSetup;
  private objects: SceneObjects = {
    nebula: null,
    starfield: null,
    galaxy: null,
    halo: null
  };

  constructor(threeSetup: ThreeSetup) {
    this.threeSetup = threeSetup;
  }

  public buildScene(settings: QualitySettings): void {
    this.clearScene();
    
    if (!this.threeSetup.scene || !this.threeSetup.overlay) {
      console.error('SceneBuilder: Three.js setup not initialized');
      return;
    }

    // Create nebula background
    this.objects.nebula = new Nebula();
    const nebulaMesh = this.objects.nebula.getMesh();
    if (nebulaMesh) {
      this.threeSetup.scene.add(nebulaMesh);
    }

    // Create background starfield
    this.objects.starfield = new Starfield(settings.backgroundStars);
    const starfieldPoints = this.objects.starfield.getPoints();
    if (starfieldPoints) {
      this.threeSetup.scene.add(starfieldPoints);
    }

    // Create main galaxy
    this.objects.galaxy = new Galaxy(settings.starCount);
    const galaxyPoints = this.objects.galaxy.getPoints();
    if (galaxyPoints) {
      this.threeSetup.scene.add(galaxyPoints);
    }

    // Create cursor halo (overlay)
    this.objects.halo = new Halo(settings.haloParticles);
    const haloPoints = this.objects.halo.getPoints();
    if (haloPoints) {
      this.threeSetup.overlay.add(haloPoints);
    }

    console.log(`Scene built with quality: ${settings.quality}`, {
      stars: settings.starCount,
      backgroundStars: settings.backgroundStars,
      haloParticles: settings.haloParticles
    });
  }

  public rebuild(settings: QualitySettings): void {
    this.buildScene(settings);
  }

  private clearScene(): void {
    // Dispose existing objects
    if (this.objects.nebula) {
      this.objects.nebula.dispose();
      this.objects.nebula = null;
    }
    if (this.objects.starfield) {
      this.objects.starfield.dispose();
      this.objects.starfield = null;
    }
    if (this.objects.galaxy) {
      this.objects.galaxy.dispose();
      this.objects.galaxy = null;
    }
    if (this.objects.halo) {
      this.objects.halo.dispose();
      this.objects.halo = null;
    }

    // Clear scenes
    this.threeSetup.clearScenes();
  }

  public update(deltaTime: number, timeScale: number): void {
    if (this.objects.nebula) {
      this.objects.nebula.update(deltaTime);
    }
    if (this.objects.starfield) {
      this.objects.starfield.update(deltaTime);
    }
    if (this.objects.galaxy) {
      this.objects.galaxy.update(deltaTime, timeScale);
    }
    if (this.objects.halo) {
      this.objects.halo.update(deltaTime);
    }
  }

  public setMousePosition(worldMouse: THREE.Vector3): void {
    if (this.objects.starfield) {
      this.objects.starfield.setMousePosition(worldMouse);
    }
    if (this.objects.galaxy) {
      this.objects.galaxy.setMousePosition(worldMouse);
    }
  }

  public setCursorPosition(normalizedX: number, normalizedY: number): void {
    if (this.objects.halo) {
      this.objects.halo.setCursorPosition(normalizedX, normalizedY);
    }
  }

  public updateHaloAspect(aspect: number): void {
    if (this.objects.halo) {
      this.objects.halo.setAspectRatio(aspect);
    }
  }

  public updateScrollColors(scrollProgress: number): void {
    if (this.objects.halo) {
      this.objects.halo.updateScrollColors(scrollProgress);
    }
  }

  public setExposure(exposure: number): void {
    if (this.objects.nebula) {
      this.objects.nebula.setExposure(exposure);
    }
  }

  public setSpeed(speed: number): void {
    if (this.objects.galaxy) {
      this.objects.galaxy.setSpeed(speed);
    }
  }

  public getObjects(): SceneObjects {
    return this.objects;
  }

  public dispose(): void {
    this.clearScene();
  }
}