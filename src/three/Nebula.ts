import * as THREE from 'three'

export class Nebula {
  private material!: THREE.ShaderMaterial
  private mesh!: THREE.Mesh

  constructor() {
    this.createMaterial()
    this.createMesh()
  }

  private createMaterial() {
    this.material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uExposure: { value: 0.62 }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        precision mediump float;
        varying vec2 vUv;
        uniform float uTime, uExposure;
        
        float n(vec2 p) {
          return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453);
        }
        
        float sm(vec2 p) {
          vec2 i = floor(p), f = fract(p);
          float a = n(i), b = n(i + vec2(1, 0)), c = n(i + vec2(0, 1)), d = n(i + vec2(1, 1));
          vec2 u = f * f * (3. - 2. * f);
          return mix(a, b, u.x) + (c - a) * u.y * (1. - u.x) + (d - b) * u.x * u.y;
        }
        
        float fbm(vec2 p) {
          float v = 0., a = .5;
          for(int i = 0; i < 6; i++) {
            v += a * sm(p);
            p *= 2.03;
            a *= .56;
          }
          return v;
        }
        
        void main() {
          vec2 uv = vUv * 2.;
          float t = uTime * .03;
          float f = fbm(uv * 3. + vec2(t, -t * .7));
          float g = fbm(uv * 1.2 - vec2(t * .4, t * .2));
          float m = smoothstep(.62, .92, f) * .55 + smoothstep(.68, .94, g) * .45;
          vec3 base = vec3(.015, .06, .12);
          vec3 tint1 = vec3(.12, .75, .62);
          vec3 tint2 = vec3(.62, .52, .95);
          vec3 col = mix(base, mix(tint1, tint2, .35), m);
          gl_FragColor = vec4(col * uExposure * .7, m * .32);
        }
      `
    })
  }

  private createMesh() {
    const geometry = new THREE.PlaneGeometry(40, 22, 1, 1)
    this.mesh = new THREE.Mesh(geometry, this.material)
    this.mesh.position.z = -6
  }

  getMesh() {
    return this.mesh
  }

  getMaterial() {
    return this.material
  }

  update(deltaTime: number) {
    this.material.uniforms.uTime.value += deltaTime
  }
}