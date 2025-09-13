import * as THREE from 'three'

export class Starfield {
  private points!: THREE.Points
  private uniforms!: { uTime: { value: number }; uMouse: { value: THREE.Vector3 } }

  constructor(count: number) {
    this.create(count)
  }

  private create(count: number) {
    const geometry = new THREE.BufferGeometry()
    const pos = new Float32Array(count * 3)
    const spd = new Float32Array(count)
    const phi = new Float32Array(count)

    for (let i = 0; i < count; i++) {
      const r = 38 + Math.random() * 44
      const t = Math.acos(2 * Math.random() - 1)
      const p = Math.random() * Math.PI * 2
      
      pos[i * 3] = r * Math.sin(t) * Math.cos(p)
      pos[i * 3 + 1] = r * Math.sin(t) * Math.sin(p)
      pos[i * 3 + 2] = r * Math.cos(t)
      
      spd[i] = .02 + Math.random() * .06
      phi[i] = Math.random() * Math.PI * 2
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    geometry.setAttribute('aSpeed', new THREE.BufferAttribute(spd, 1))
    geometry.setAttribute('aPhi', new THREE.BufferAttribute(phi, 1))

    this.uniforms = {
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector3(0, 0, 0) }
    }

    const material = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      transparent: true,
      depthWrite: false,
      vertexShader: `
        attribute float aSpeed, aPhi;
        uniform float uTime;
        uniform vec3 uMouse;
        varying float vTw;
        
        void main() {
          vec3 p = position;
          float ang = aSpeed * uTime * .15;
          float cs = cos(ang), sn = sin(ang);
          p.xy = mat2(cs, -sn, sn, cs) * p.xy;
          p.x += uMouse.x * .06;
          p.y += uMouse.y * .06;
          vTw = sin(uTime * .8 + aPhi) * .5 + .5;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.);
          gl_PointSize = 1. + 1.6 * vTw;
        }
      `,
      fragmentShader: `
        precision mediump float;
        varying float vTw;
        
        void main() {
          vec2 uv = gl_PointCoord * 2. - 1.;
          float d = dot(uv, uv);
          float a = smoothstep(1., 0., d) * (.16 + .2 * vTw);
          vec3 c = mix(vec3(.72, .82, 1.), vec3(.78, .86, 1.), vTw);
          gl_FragColor = vec4(c, a);
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

  updateMouse(mousePos: THREE.Vector3) {
    this.uniforms.uMouse.value.copy(mousePos)
  }
}