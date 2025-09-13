/**
 * Galaxy spiral with instanced particles
 * Main interactive galaxy visualization with orbital dynamics
 */

import * as THREE from 'three';

export interface GalaxyUniforms {
  uTime: { value: number };
  uMouse: { value: THREE.Vector3 };
  uExposure: { value: number };
  uSpeed: { value: number };
  uColors: { value: THREE.Vector3 };
  uColors2: { value: THREE.Vector3 };
  uColors3: { value: THREE.Vector3 };
  uHue: { value: number };
}

export class Galaxy {
  private points: THREE.Points | null = null;
  private material: THREE.ShaderMaterial | null = null;
  public uniforms: GalaxyUniforms;

  constructor(count: number) {
    this.uniforms = {
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector3(0, 0, 0) },
      uExposure: { value: 0.58 },
      uSpeed: { value: 0.58 },
      uColors: { value: new THREE.Vector3(0.45, 0.86, 1.0) },
      uColors2: { value: new THREE.Vector3(0.92, 0.52, 1.0) },
      uColors3: { value: new THREE.Vector3(0.20, 1.0, 0.78) },
      uHue: { value: 0 }
    };
    this.init(count);
  }

  private init(count: number): void {
    const geometry = this.createGeometry(count);
    this.material = this.createMaterial();
    this.points = new THREE.Points(geometry, this.material);
  }

  private createGeometry(count: number): THREE.InstancedBufferGeometry {
    const geometry = new THREE.InstancedBufferGeometry();
    
    // Single vertex for instancing
    geometry.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0], 3));
    geometry.instanceCount = count;
    
    // Instance attributes
    const radius = new Float32Array(count);
    const theta0 = new Float32Array(count);
    const direction = new Float32Array(count);
    const noise = new Float32Array(count);
    const type = new Float32Array(count);
    
    for (let i = 0; i < count; i++) {
      // Spiral distribution with power curve for density
      radius[i] = THREE.MathUtils.lerp(0.15, 6.0, Math.pow(Math.random(), 0.55));
      theta0[i] = Math.random() * Math.PI * 2;
      direction[i] = (Math.random() < 0.88) ? 1 : -1;
      noise[i] = (Math.random() * 2 - 1);
      type[i] = (Math.random() < 0.16) ? 1 : 0; // Bright stars vs normal
    }
    
    geometry.setAttribute('i_radius', new THREE.InstancedBufferAttribute(radius, 1));
    geometry.setAttribute('i_theta0', new THREE.InstancedBufferAttribute(theta0, 1));
    geometry.setAttribute('i_dir', new THREE.InstancedBufferAttribute(direction, 1));
    geometry.setAttribute('i_noise', new THREE.InstancedBufferAttribute(noise, 1));
    geometry.setAttribute('i_type', new THREE.InstancedBufferAttribute(type, 1));
    
    return geometry;
  }

  private createMaterial(): THREE.ShaderMaterial {
    const vertexShader = `
      attribute float i_radius;
      attribute float i_theta0;
      attribute float i_dir;
      attribute float i_noise;
      attribute float i_type;
      
      uniform float uTime;
      uniform float uSpeed;
      uniform vec3 uMouse;
      
      varying float vR;
      varying float vType;
      varying float vTw;
      
      // Gravitational field function
      vec2 grav(vec2 p, vec2 q, float m) {
        vec2 d = p - q;
        float r2 = max(dot(d, d), 0.03);
        float inv = m / r2;
        vec2 tang = vec2(-d.y, d.x);
        return normalize(tang) * inv * 0.30 + normalize(-d) * inv * 0.09;
      }
      
      void main() {
        float r = i_radius;
        
        // Orbital velocity (Keplerian)
        float omega = uSpeed * 0.58 * inversesqrt(max(r, 0.0001));
        omega *= mix(1.0, 0.55, step(0.5, i_type));
        
        // Current angle
        float th = i_theta0 + i_dir * uTime * omega;
        
        // Position on spiral
        vec2 p = vec2(cos(th), sin(th)) * r;
        
        // Add spiral structure noise
        p += (0.05 + 0.04 * i_noise) * vec2(
          cos(2.1 * th + i_noise * 5.0),
          sin(1.9 * th - i_noise * 4.0)
        );
        
        // Mouse gravitational influence
        vec2 gravForce = grav(p, uMouse.xy, uMouse.z);
        p += gravForce * 1.5;
        
        // Z variation
        float z = (i_type > 0.5 ? 0.40 : 0.16) * 
                 (fract(sin(i_noise * 43758.5453) * 1e4) * 2.0 - 1.0);
        
        vR = r;
        vType = i_type;
        vTw = length(gravForce);
        
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, z, 1.0);
        
        // Point size based on distance and interaction
        float base = mix(0.55, 1.05, 1.0 / (1.0 + r * 0.22));
        gl_PointSize = base * (1.0 + 3.6 * vTw) * (1.0 + 0.28 * float(i_type < 0.5));
      }
    `;

    const fragmentShader = `
      precision mediump float;
      
      uniform vec3 uColors;
      uniform vec3 uColors2;
      uniform vec3 uColors3;
      uniform float uExposure;
      uniform float uHue;
      
      varying float vR;
      varying float vType;
      varying float vTw;
      
      // HSV to RGB conversion
      vec3 hsv2rgb(vec3 c) {
        vec3 p = abs(fract(c.xxx + vec3(0.0, 2.0/3.0, 1.0/3.0)) * 6.0 - 3.0);
        return c.z * mix(vec3(1.0), clamp(p - 1.0, 0.0, 1.0), c.y);
      }
      
      void main() {
        vec2 uv = gl_PointCoord * 2.0 - 1.0;
        float d = dot(uv, uv);
        float core = smoothstep(1.0, 0.0, d) * 0.54;
        
        // Color mixing based on radius
        float t = clamp(vR / 6.0, 0.0, 1.0);
        vec3 c = mix(uColors, uColors2, smoothstep(0.0, 0.6, t));
        c = mix(c, uColors3, smoothstep(0.35, 1.0, t));
        
        // Bright star color
        c = mix(c, vec3(1.0, 0.86, 0.62), step(0.5, vType));
        
        // Hue shift wash
        float h = fract(uHue + t * 0.10 + vTw * 0.06);
        vec3 wash = hsv2rgb(vec3(h, 0.55, 1.0));
        c = mix(c, wash, 0.28);
        
        // Apply exposure
        c *= uExposure;
        
        // Interaction glow
        float g = clamp(vTw * 3.6, 0.0, 1.0);
        c += g * 0.3;
        
        gl_FragColor = vec4(c, core * (0.58 + 0.22 * g));
      }
    `;

    return new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: this.uniforms,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
  }

  public update(deltaTime: number, timeScale: number = 1.0): void {
    if (this.uniforms) {
      this.uniforms.uTime.value += deltaTime * timeScale;
      this.uniforms.uHue.value = (this.uniforms.uHue.value + deltaTime * 0.025) % 1.0;
    }
  }

  public setMousePosition(mousePos: THREE.Vector3): void {
    if (this.uniforms) {
      this.uniforms.uMouse.value.copy(mousePos);
    }
  }

  public setSpeed(speed: number): void {
    if (this.uniforms) {
      this.uniforms.uSpeed.value = speed;
    }
  }

  public setExposure(exposure: number): void {
    if (this.uniforms) {
      this.uniforms.uExposure.value = exposure;
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