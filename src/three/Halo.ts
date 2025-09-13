import * as THREE from 'three'

export class Halo {
  private points!: THREE.Points
  private uniforms!: {
    uTime: { value: number }
    uCursor: { value: THREE.Vector2 }
    uScale: { value: number }
    uAspect: { value: number }
    uColorA: { value: THREE.Vector3 }
    uColorB: { value: THREE.Vector3 }
    uColorC: { value: THREE.Vector3 }
  }

  constructor(count: number) {
    this.create(count)
  }

  private create(count: number) {
    const geometry = new THREE.BufferGeometry()
    const hPos = new Float32Array(count * 2)
    const hPhase = new Float32Array(count)
    const hRad = new Float32Array(count)

    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2
      hPos[i * 2] = Math.cos(a)
      hPos[i * 2 + 1] = Math.sin(a)
      hPhase[i] = Math.random() * Math.PI * 2
      hRad[i] = .006 + Math.random() * .05
    }

    geometry.setAttribute('aPos', new THREE.BufferAttribute(hPos, 2))
    geometry.setAttribute('aPhase', new THREE.BufferAttribute(hPhase, 1))
    geometry.setAttribute('aRad', new THREE.BufferAttribute(hRad, 1))

    this.uniforms = {
      uTime: { value: 0 },
      uCursor: { value: new THREE.Vector2(0, 0) },
      uScale: { value: 1 },
      uAspect: { value: 1 },
      uColorA: { value: new THREE.Vector3(.12, .82, 1.) },
      uColorB: { value: new THREE.Vector3(.84, .46, 1.) },
      uColorC: { value: new THREE.Vector3(.18, 1., .74) }
    }

    const material = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: `
        attribute vec2 aPos;
        attribute float aPhase, aRad;
        uniform vec2 uCursor;
        uniform float uScale, uAspect, uTime;
        varying float vA;
        
        void main() {
          float tw = sin(uTime * 4. + aPhase) * .5 + .5;
          vec2 base = normalize(aPos) * (0.07 + aRad * .9);
          base.x *= uAspect;
          vec2 ndc = uCursor + base * uScale;
          gl_Position = vec4(ndc, 0., 1.);
          gl_PointSize = 1.6 + 2.8 * tw;
          vA = tw;
        }
      `,
      fragmentShader: `
        precision mediump float;
        varying float vA;
        uniform vec3 uColorA, uColorB, uColorC;
        
        void main() {
          vec2 q = gl_PointCoord * 2. - 1.;
          float d = dot(q, q);
          float a = smoothstep(1., 0., d) * mix(.25, .6, vA);
          vec3 col = mix(mix(uColorA, uColorB, .35), uColorC, .25 * vA);
          gl_FragColor = vec4(col, a);
        }
      `
    })

    this.points = new THREE.Points(geometry, material)
  }

  getPoints() {
    return this.points
  }

  getUniforms() {
    return this.uniforms
  }

  update(deltaTime: number) {
    this.uniforms.uTime.value += deltaTime
  }

  updateAspect(aspect: number) {
    this.uniforms.uAspect.value = aspect
  }

  updateCursor(x: number, y: number) {
    this.uniforms.uCursor.value.set(x, y)
  }

  updateScrollColors(scrollProgress: number) {
    const a = this.uniforms.uColorA.value
    const b = this.uniforms.uColorB.value
    const c = this.uniforms.uColorC.value
    
    a.set(.12 + .35 * scrollProgress, .82 - .2 * scrollProgress, 1. - .18 * scrollProgress)
    b.set(.84 - .28 * scrollProgress, .46 + .22 * scrollProgress, 1. - .05 * scrollProgress)
    c.set(.18 + .14 * scrollProgress, 1. - .18 * scrollProgress, .74 + .06 * scrollProgress)
  }
}