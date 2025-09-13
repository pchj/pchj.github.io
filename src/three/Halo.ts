/**
 * Cursor halo effect
 * Creates a particle ring that follows the mouse cursor
 */

import * as THREE from 'three';

export interface HaloUniforms {
  uTime: { value: number };
  uCursor: { value: THREE.Vector2 };
  uScale: { value: number };
  uAspect: { value: number };
  uColorA: { value: THREE.Vector3 };
  uColorB: { value: THREE.Vector3 };
  uColorC: { value: THREE.Vector3 };
  [uniform: string]: { value: any };
}

export class Halo {
  private points: THREE.Points | null = null;
  private material: THREE.ShaderMaterial | null = null;
  public uniforms: HaloUniforms;

  constructor(count: number) {
    this.uniforms = {
      uTime: { value: 0 },
      uCursor: { value: new THREE.Vector2(0, 0) },
      uScale: { value: 1 },
      uAspect: { value: 1 },
      uColorA: { value: new THREE.Vector3(0.12, 0.82, 1.0) },
      uColorB: { value: new THREE.Vector3(0.84, 0.46, 1.0) },
      uColorC: { value: new THREE.Vector3(0.18, 1.0, 0.74) }
    };
    this.init(count);
  }

  private init(count: number): void {
    const geometry = this.createGeometry(count);
    this.material = this.createMaterial();
    this.points = new THREE.Points(geometry, this.material);
  }

  private createGeometry(count: number): THREE.BufferGeometry {
    const geometry = new THREE.BufferGeometry();
    
    const positions = new Float32Array(count * 2);
    const phases = new Float32Array(count);
    const radii = new Float32Array(count);
    
    for (let i = 0; i < count; i++) {
      // Circular distribution
      const angle = Math.random() * Math.PI * 2;
      positions[i * 2] = Math.cos(angle);
      positions[i * 2 + 1] = Math.sin(angle);
      
      phases[i] = Math.random() * Math.PI * 2;
      radii[i] = 0.006 + Math.random() * 0.05;
    }
    
    geometry.setAttribute('aPos', new THREE.BufferAttribute(positions, 2));
    geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
    geometry.setAttribute('aRad', new THREE.BufferAttribute(radii, 1));
    
    return geometry;
  }

  private createMaterial(): THREE.ShaderMaterial {
    const vertexShader = `
      attribute vec2 aPos;
      attribute float aPhase;
      attribute float aRad;
      
      uniform vec2 uCursor;
      uniform float uScale;
      uniform float uAspect;
      uniform float uTime;
      
      varying float vA;
      
      void main() {
        // Twinkling animation
        float tw = sin(uTime * 4.0 + aPhase) * 0.5 + 0.5;
        
        // Base position relative to cursor
        vec2 base = normalize(aPos) * (0.07 + aRad * 0.9);
        base.x *= uAspect;
        
        // Final position in NDC
        vec2 ndc = uCursor + base * uScale;
        
        gl_Position = vec4(ndc, 0.0, 1.0);
        gl_PointSize = 1.6 + 2.8 * tw;
        vA = tw;
      }
    `;

    const fragmentShader = `
      precision mediump float;
      
      varying float vA;
      uniform vec3 uColorA;
      uniform vec3 uColorB;
      uniform vec3 uColorC;
      
      void main() {
        vec2 q = gl_PointCoord * 2.0 - 1.0;
        float d = dot(q, q);
        float alpha = smoothstep(1.0, 0.0, d) * mix(0.25, 0.6, vA);
        
        vec3 col = mix(
          mix(uColorA, uColorB, 0.35),
          uColorC,
          0.25 * vA
        );
        
        gl_FragColor = vec4(col, alpha);
      }
    `;

    return new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader,
      fragmentShader
    });
  }

  public update(deltaTime: number): void {
    if (this.uniforms) {
      this.uniforms.uTime.value += deltaTime;
    }
  }

  public setCursorPosition(x: number, y: number): void {
    if (this.uniforms) {
      this.uniforms.uCursor.value.set(x, y);
    }
  }

  public setAspectRatio(aspect: number): void {
    if (this.uniforms) {
      this.uniforms.uAspect.value = aspect;
    }
  }

  public setScale(scale: number): void {
    if (this.uniforms) {
      this.uniforms.uScale.value = scale;
    }
  }

  public updateScrollColors(scrollProgress: number): void {
    if (!this.uniforms) return;

    const p = Math.max(0, Math.min(1, scrollProgress));
    
    // Color A: Blue to more cyan
    this.uniforms.uColorA.value.set(
      0.12 + 0.35 * p,
      0.82 - 0.2 * p,
      1.0 - 0.18 * p
    );
    
    // Color B: Purple to more magenta
    this.uniforms.uColorB.value.set(
      0.84 - 0.28 * p,
      0.46 + 0.22 * p,
      1.0 - 0.05 * p
    );
    
    // Color C: Teal to more green
    this.uniforms.uColorC.value.set(
      0.18 + 0.14 * p,
      1.0 - 0.18 * p,
      0.74 + 0.06 * p
    );
  }

  public getPoints(): THREE.Points | null {
    return this.points;
  }

  public getMaterial(): THREE.ShaderMaterial | null {
    return this.material;
  }

  public dispose(): void {
    if (this.material) {
      this.material.dispose();
    }
    if (this.points?.geometry) {
      this.points.geometry.dispose();
    }
  }
}