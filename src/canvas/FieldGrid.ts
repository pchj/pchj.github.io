/**
 * 2D field and grid rendering for background effects
 * Handles flow field visualization and distorted grid
 */

import * as THREE from 'three';
import type { Layout } from './Layout';
import type { QualitySettings } from '../components/quality/Settings';

export interface Seed {
  x: number;
  y: number;
}

export class FieldGrid {
  private layout: Layout;
  private seeds: Seed[] = [];
  private worldMouse: THREE.Vector2 = new THREE.Vector2(0, 0);
  private camera: THREE.PerspectiveCamera | null = null;
  private mass: number = 0.7;
  private lastDrawTime: number = 0;
  
  private readonly colors = [
    'rgba(31,211,191,0.14)',
    'rgba(120,180,255,0.12)',
    'rgba(229,101,255,0.10)',
    'rgba(255,210,96,0.07)'
  ];

  constructor(layout: Layout) {
    this.layout = layout;
  }

  public setCamera(camera: THREE.PerspectiveCamera): void {
    this.camera = camera;
  }

  public seedFlow(settings: QualitySettings): void {
    this.seeds.length = 0;
    
    const seedCount = settings.seedCount;
    for (let i = 0; i < seedCount; i++) {
      const angle = i / seedCount * Math.PI * 2;
      const radius = 1 + (i % 2) * 0.22;
      this.seeds.push({
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius
      });
    }
  }

  public setWorldMouse(worldMouse: THREE.Vector2): void {
    this.worldMouse.copy(worldMouse);
  }

  public setMass(mass: number): void {
    this.mass = mass;
  }

  public fVec(x: number, y: number, quality: string): [number, number] {
    const r2 = Math.max(x * x + y * y, 0.0004);
    const inv = 1.0 / Math.pow(r2, 0.75);
    
    let vx = -y * inv;
    let vy = x * inv;
    
    const dx = x - this.worldMouse.x;
    const dy = y - this.worldMouse.y;
    const q2 = dx * dx + dy * dy + 0.02;
    
    const bend = (quality === 'high' || quality === 'ultra') ? 0.32 : 0.26;
    const pull = (quality === 'high' || quality === 'ultra') ? 0.11 : 0.08;
    const grav = this.mass / q2;
    
    vx += (-dy) * grav * bend + (-dx) * grav * pull;
    vy += (dx) * grav * bend + (-dy) * grav * pull;
    
    return [vx, vy];
  }

  private toScreen(x: number, y: number): [number, number] {
    if (!this.camera) return [0, 0];
    
    const vector = new THREE.Vector3(x, y, 0).project(this.camera);
    const { width, height } = this.layout.getViewportSize();
    
    return [
      (vector.x * 0.5 + 0.5) * width,
      (-vector.y * 0.5 + 0.5) * height
    ];
  }

  public screenToWorldOnPlane(sx: number, sy: number, planeZ: number = 0): THREE.Vector2 {
    if (!this.camera) return new THREE.Vector2(0, 0);
    
    const { width, height } = this.layout.getViewportSize();
    const nx = (sx / width) * 2 - 1;
    const ny = -(sy / height) * 2 + 1;
    
    const origin = this.camera.position.clone();
    const direction = new THREE.Vector3(nx, ny, 0.5).unproject(this.camera);
    direction.sub(origin).normalize();
    
    const t = (planeZ - origin.z) / direction.z;
    return new THREE.Vector2(origin.x + direction.x * t, origin.y + direction.y * t);
  }

  public drawField(settings: QualitySettings, prefersReduced: boolean): void {
    if (prefersReduced || document.visibilityState !== 'visible') return;
    
    const fieldContext = this.layout.getFieldContext();
    if (!fieldContext) return;
    
    const { width, height } = this.layout.getViewportSize();
    fieldContext.clearRect(0, 0, width, height);
    fieldContext.globalCompositeOperation = 'lighter';
    
    const steps = settings.flowSteps;
    
    for (let k = 0; k < this.seeds.length; k++) {
      let x = this.seeds[k]!.x * (3.0 + 1.9 * Math.sin((k * 13.1) % 6));
      let y = this.seeds[k]!.y * (1.9 + 1.3 * Math.cos((k * 7.7) % 6));
      
      let [sx, sy] = this.toScreen(x, y);
      
      fieldContext.beginPath();
      fieldContext.moveTo(sx, sy);
      
      for (let i = 0; i < steps; i++) {
        const [vx, vy] = this.fVec(x, y, settings.quality);
        const [vx2, vy2] = this.fVec(x + vx * 0.01, y + vy * 0.01, settings.quality);
        
        x += vx2 * 0.02;
        y += vy2 * 0.02;
        
        [sx, sy] = this.toScreen(x, y);
        fieldContext.lineTo(sx, sy);
      }
      
      fieldContext.strokeStyle = this.colors[k % this.colors.length]!;
      fieldContext.lineWidth = 1;
      fieldContext.stroke();
    }
    
    fieldContext.globalCompositeOperation = 'source-over';
  }

  public drawGrid(settings: QualitySettings): void {
    if (document.visibilityState !== 'visible') return;
    
    const gridContext = this.layout.getGridContext();
    if (!gridContext) return;
    
    const { width, height } = this.layout.getViewportSize();
    gridContext.clearRect(0, 0, width, height);
    gridContext.strokeStyle = 'rgba(255,255,255,0.055)';
    gridContext.lineWidth = 1;
    
    const step = settings.gridStep;
    const cols = Math.ceil(width / step) + 2;
    const rows = Math.ceil(height / step) + 2;
    
    const bendFactor = (settings.quality === 'high' || settings.quality === 'ultra') ? 0.22 : 0.17;
    
    // Draw horizontal lines
    for (let j = -1; j <= rows; j++) {
      gridContext.beginPath();
      for (let i = -1; i <= cols; i++) {
        const sx = i * step;
        const sy = j * step;
        
        let p = this.screenToWorldOnPlane(sx, sy, 0);
        const dx = p.x - this.worldMouse.x;
        const dy = p.y - this.worldMouse.y;
        const r2 = dx * dx + dy * dy + 0.08;
        const k = bendFactor * this.mass / r2;
        
        p.x += dx * k;
        p.y += dy * k;
        
        const projected = new THREE.Vector3(p.x, p.y, 0).project(this.camera!);
        const px = (projected.x * 0.5 + 0.5) * width;
        const py = (-projected.y * 0.5 + 0.5) * height;
        
        if (i === -1) {
          gridContext.moveTo(px, py);
        } else {
          gridContext.lineTo(px, py);
        }
      }
      gridContext.stroke();
    }
    
    // Draw vertical lines
    for (let i = -1; i <= cols; i++) {
      gridContext.beginPath();
      for (let j = -1; j <= rows; j++) {
        const sx = i * step;
        const sy = j * step;
        
        let p = this.screenToWorldOnPlane(sx, sy, 0);
        const dx = p.x - this.worldMouse.x;
        const dy = p.y - this.worldMouse.y;
        const r2 = dx * dx + dy * dy + 0.08;
        const k = bendFactor * this.mass / r2;
        
        p.x += dx * k;
        p.y += dy * k;
        
        const projected = new THREE.Vector3(p.x, p.y, 0).project(this.camera!);
        const px = (projected.x * 0.5 + 0.5) * width;
        const py = (-projected.y * 0.5 + 0.5) * height;
        
        if (j === -1) {
          gridContext.moveTo(px, py);
        } else {
          gridContext.lineTo(px, py);
        }
      }
      gridContext.stroke();
    }
  }

  public draw(settings: QualitySettings, prefersReduced: boolean, currentTime: number): void {
    const targetInterval = this.getTargetDrawInterval(settings.quality);
    
    if (currentTime - this.lastDrawTime >= targetInterval) {
      this.drawField(settings, prefersReduced);
      this.drawGrid(settings);
      this.lastDrawTime = currentTime;
    }
  }

  private getTargetDrawInterval(quality: string): number {
    return (quality === 'ultra' || quality === 'high') ? 1/60 : 1/30;
  }
}