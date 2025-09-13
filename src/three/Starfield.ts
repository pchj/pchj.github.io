/**
 * Background starfield with twinkling animation
 * Creates distant stars with orbital motion
 */

import * as THREE from 'three';

export interface StarfieldUniforms {
  uTime: { value: number };
  uMouse: { value: THREE.Vector3 };
  [uniform: string]: { value: any };
}

export class Starfield {
  private points: THREE.Points | null = null;
  private material: THREE.ShaderMaterial | null = null;
  public uniforms: StarfieldUniforms;

  constructor(count: number) {
    this.uniforms = {
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector3(0, 0, 0) }
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
    
    const positions = new Float32Array(count * 3);
    const speeds = new Float32Array(count);
    const phases = new Float32Array(count);
    
    for (let i = 0; i < count; i++) {
      // Spherical distribution
      const radius = 38 + Math.random() * 44;
      const theta = Math.acos(2 * Math.random() - 1);
      const phi = Math.random() * Math.PI * 2;
      
      positions[i * 3] = radius * Math.sin(theta) * Math.cos(phi);
      positions[i * 3 + 1] = radius * Math.sin(theta) * Math.sin(phi);
      positions[i * 3 + 2] = radius * Math.cos(theta);
      
      speeds[i] = 0.02 + Math.random() * 0.06;
      phases[i] = Math.random() * Math.PI * 2;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aSpeed', new THREE.BufferAttribute(speeds, 1));
    geometry.setAttribute('aPhi', new THREE.BufferAttribute(phases, 1));
    
    return geometry;
  }

  private createMaterial(): THREE.ShaderMaterial {
    const vertexShader = `
      attribute float aSpeed;
      attribute float aPhi;
      uniform float uTime;
      uniform vec3 uMouse;
      varying float vTw;
      
      void main() {
        vec3 p = position;
        
        // Orbital rotation
        float ang = aSpeed * uTime * 0.15;
        float cs = cos(ang);
        float sn = sin(ang);
        mat2 rotMatrix = mat2(cs, -sn, sn, cs);
        p.xy = rotMatrix * p.xy;
        
        // Mouse influence
        p.x += uMouse.x * 0.06;
        p.y += uMouse.y * 0.06;
        
        // Twinkling
        vTw = sin(uTime * 0.8 + aPhi) * 0.5 + 0.5;
        
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = 1.0 + 1.6 * vTw;
      }
    `;

    const fragmentShader = `
      precision mediump float;
      varying float vTw;
      
      void main() {
        vec2 uv = gl_PointCoord * 2.0 - 1.0;
        float d = dot(uv, uv);
        float alpha = smoothstep(1.0, 0.0, d) * (0.16 + 0.2 * vTw);
        
        vec3 color = mix(
          vec3(0.72, 0.82, 1.0), 
          vec3(0.78, 0.86, 1.0), 
          vTw
        );
        
        gl_FragColor = vec4(color, alpha);
      }
    `;

    return new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      transparent: true,
      depthWrite: false,
      vertexShader,
      fragmentShader
    });
  }

  public update(deltaTime: number): void {
    if (this.uniforms) {
      this.uniforms.uTime.value += deltaTime;
    }
  }

  public setMousePosition(mousePos: THREE.Vector3): void {
    if (this.uniforms) {
      this.uniforms.uMouse.value.copy(mousePos);
    }
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