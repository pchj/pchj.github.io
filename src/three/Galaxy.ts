import * as THREE from 'three'

export class Galaxy {
  private points!: THREE.Points
  private uniforms!: {
    uTime: { value: number }
    uMouse: { value: THREE.Vector3 }
    uExposure: { value: number }
    uSpeed: { value: number }
    uColors: { value: THREE.Vector3 }
    uColors2: { value: THREE.Vector3 }
    uColors3: { value: THREE.Vector3 }
    uHue: { value: number }
  }

  constructor(count: number) {
    this.create(count)
  }

  private create(count: number) {
    const geometry = new THREE.InstancedBufferGeometry()
    geometry.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0], 3))
    geometry.instanceCount = count

    const rad = new Float32Array(count)
    const th0 = new Float32Array(count)
    const dir = new Float32Array(count)
    const nz = new Float32Array(count)
    const typ = new Float32Array(count)

    for (let i = 0; i < count; i++) {
      rad[i] = THREE.MathUtils.lerp(.15, 6., Math.pow(Math.random(), .55))
      th0[i] = Math.random() * Math.PI * 2
      dir[i] = (Math.random() < .88) ? 1 : -1
      nz[i] = (Math.random() * 2 - 1)
      typ[i] = (Math.random() < .16) ? 1 : 0
    }

    geometry.setAttribute('i_radius', new THREE.InstancedBufferAttribute(rad, 1))
    geometry.setAttribute('i_theta0', new THREE.InstancedBufferAttribute(th0, 1))
    geometry.setAttribute('i_dir', new THREE.InstancedBufferAttribute(dir, 1))
    geometry.setAttribute('i_noise', new THREE.InstancedBufferAttribute(nz, 1))
    geometry.setAttribute('i_type', new THREE.InstancedBufferAttribute(typ, 1))

    this.uniforms = {
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector3(0, 0, 0) },
      uExposure: { value: .58 },
      uSpeed: { value: .58 },
      uColors: { value: new THREE.Vector3(.45, .86, 1.) },
      uColors2: { value: new THREE.Vector3(.92, .52, 1.) },
      uColors3: { value: new THREE.Vector3(.20, 1., .78) },
      uHue: { value: 0 }
    }

    const vertexShader = `
      attribute float i_radius, i_theta0, i_dir, i_noise, i_type;
      uniform float uTime, uSpeed;
      uniform vec3 uMouse;
      varying float vR, vType, vTw;
      
      vec2 grav(vec2 p, vec2 q, float m) {
        vec2 d = p - q;
        float r2 = max(dot(d, d), .03);
        float inv = m / r2;
        vec2 tang = vec2(-d.y, d.x);
        return normalize(tang) * inv * .30 + normalize(-d) * inv * .09;
      }
      
      void main() {
        float r = i_radius;
        float omega = uSpeed * .58 * inversesqrt(max(r, .0001));
        omega *= mix(1., .55, step(.5, i_type));
        float th = i_theta0 + i_dir * uTime * omega;
        vec2 p = vec2(cos(th), sin(th)) * r;
        p += (.05 + .04 * i_noise) * vec2(cos(2.1 * th + i_noise * 5.0), sin(1.9 * th - i_noise * 4.0));
        vec2 l = grav(p, uMouse.xy, uMouse.z);
        p += l * 1.5;
        float z = (i_type > .5 ? .40 : .16) * (fract(sin(i_noise * 43758.5453) * 1e4) * 2. - 1.);
        vR = r;
        vType = i_type;
        vTw = length(l);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, z, 1.);
        float base = mix(.55, 1.05, 1. / (1. + r * .22));
        gl_PointSize = base * (1. + 3.6 * vTw) * (1. + .28 * float(i_type < .5));
      }
    `

    const fragmentShader = `
      precision mediump float;
      uniform vec3 uColors, uColors2, uColors3;
      uniform float uExposure, uHue;
      varying float vR, vType, vTw;
      
      vec3 hsv2rgb(vec3 c) {
        vec3 p = abs(fract(c.xxx + vec3(0., 2./3., 1./3.)) * 6. - 3.);
        return c.z * mix(vec3(1.), clamp(p - 1., 0., 1.), c.y);
      }
      
      void main() {
        vec2 uv = gl_PointCoord * 2. - 1.;
        float d = dot(uv, uv);
        float core = smoothstep(1., 0., d) * .54;
        float t = clamp(vR / 6., 0., 1.);
        vec3 c = mix(uColors, uColors2, smoothstep(0., .6, t));
        c = mix(c, uColors3, smoothstep(.35, 1., t));
        c = mix(c, vec3(1., .86, .62), step(.5, vType));
        float h = fract(uHue + t * .10 + vTw * .06);
        vec3 wash = hsv2rgb(vec3(h, .55, 1.));
        c = mix(c, wash, .28);
        c *= uExposure;
        float g = clamp(vTw * 3.6, 0., 1.);
        c += g * .3;
        gl_FragColor = vec4(c, core * (.58 + .22 * g));
      }
    `

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: this.uniforms,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    })

    this.points = new THREE.Points(geometry, material)
  }

  getPoints() {
    return this.points
  }

  getUniforms() {
    return this.uniforms
  }

  update(deltaTime: number, timeScale: number) {
    this.uniforms.uTime.value += deltaTime * timeScale
    this.uniforms.uHue.value = (this.uniforms.uHue.value + deltaTime * .025) % 1.
  }

  updateMouse(mousePos: THREE.Vector3) {
    this.uniforms.uMouse.value.copy(mousePos)
  }
}