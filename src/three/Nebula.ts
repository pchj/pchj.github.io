/**
 * Nebula background with animated shader material
 * Creates procedural space background using noise functions
 */

import * as THREE from 'three';

export interface NebulaUniforms {
  uTime: { value: number };
  uExposure: { value: number };
  [uniform: string]: { value: any };
}

export class Nebula {
  private mesh: THREE.Mesh | null = null;
  private material: THREE.ShaderMaterial | null = null;
  public uniforms: NebulaUniforms;

  constructor() {
    this.uniforms = {
      uTime: { value: 0 },
      uExposure: { value: 0.62 }
    };
    this.init();
  }

  private init(): void {
    const geometry = new THREE.PlaneGeometry(40, 22, 1, 1);
    this.material = this.createMaterial();
    this.mesh = new THREE.Mesh(geometry, this.material);
    this.mesh.position.z = -6;
  }

  private createMaterial(): THREE.ShaderMaterial {
    const vertexShader = `
      varying vec2 vUv;
      
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      precision mediump float;
      
      varying vec2 vUv;
      uniform float uTime;
      uniform float uExposure;
      
      // Noise function
      float n(vec2 p) {
        return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453);
      }
      
      // Smooth noise
      float sm(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        float a = n(i);
        float b = n(i + vec2(1, 0));
        float c = n(i + vec2(0, 1));
        float d = n(i + vec2(1, 1));
        vec2 u = f * f * (3. - 2. * f);
        return mix(a, b, u.x) + (c - a) * u.y * (1. - u.x) + (d - b) * u.x * u.y;
      }
      
      // Fractal brownian motion
      float fbm(vec2 p) {
        float v = 0.;
        float a = 0.5;
        for(int i = 0; i < 6; i++) {
          v += a * sm(p);
          p *= 2.03;
          a *= 0.56;
        }
        return v;
      }
      
      void main() {
        vec2 uv = vUv * 2.;
        float t = uTime * 0.03;
        
        float f = fbm(uv * 3. + vec2(t, -t * 0.7));
        float g = fbm(uv * 1.2 - vec2(t * 0.4, t * 0.2));
        
        float m = smoothstep(0.62, 0.92, f) * 0.55 + smoothstep(0.68, 0.94, g) * 0.45;
        
        vec3 base = vec3(0.015, 0.06, 0.12);
        vec3 tint1 = vec3(0.12, 0.75, 0.62);
        vec3 tint2 = vec3(0.62, 0.52, 0.95);
        
        vec3 col = mix(base, mix(tint1, tint2, 0.35), m);
        
        gl_FragColor = vec4(col * uExposure * 0.7, m * 0.32);
      }
    `;

    return new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: this.uniforms,
      vertexShader,
      fragmentShader
    });
  }

  public update(deltaTime: number): void {
    if (this.uniforms) {
      this.uniforms.uTime.value += deltaTime;
    }
  }

  public setExposure(exposure: number): void {
    if (this.uniforms) {
      this.uniforms.uExposure.value = exposure;
    }
  }

  public getMesh(): THREE.Mesh | null {
    return this.mesh;
  }

  public getMaterial(): THREE.ShaderMaterial | null {
    return this.material;
  }

  public dispose(): void {
    if (this.material) {
      this.material.dispose();
    }
    if (this.mesh?.geometry) {
      this.mesh.geometry.dispose();
    }
  }
}