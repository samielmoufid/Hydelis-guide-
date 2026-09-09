// La forêt : un panorama photographique 360° (Poly Haven, CC0) projeté sur
// l'intérieur d'une sphère, avec par-dessus des rais de lumière additifs,
// des poussières en suspension, et une caméra qui respire. On regarde
// autour de soi à la souris, au doigt, ou en inclinant le téléphone.

import * as THREE from 'three'

const DEG = Math.PI / 180
const clamp = (v, a, b) => Math.max(a, Math.min(b, v))
const lerp = (a, b, k) => a + (b - a) * k

// Orientation de départ : le point de la photo vers lequel on regarde en
// arrivant. Ajusté pour tomber sur l'allée entre les grands pins.
const YAW0 = 0 * DEG
const PITCH0 = 2 * DEG

export class Foret {
  constructor(canvas, { mobile = false } = {}) {
    this.canvas = canvas
    this.mobile = mobile
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: !mobile, powerPreference: 'high-performance' })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 2 : 1.75))
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.toneMapping = THREE.NoToneMapping

    this.scene = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera(70, 1, 0.1, 200)
    this.camera.position.set(0, 0, 0)

    // Regard : cible (où l'utilisateur veut regarder) et valeur lissée.
    this.yaw = YAW0; this.pitch = PITCH0
    this.yawT = YAW0; this.pitchT = PITCH0
    this.dragYaw = 0; this.dragPitch = 0       // décalage accumulé au doigt / souris
    this.mouseX = 0; this.mouseY = 0            // parallaxe souris, -1..1
    this.gyro = null                            // quaternion de l'appareil
    this.gyroOffset = null
    this.t0 = performance.now()
    this.intro = 0                              // 0 → 1 pendant la descente
    this.fovIntro = 70
    this.actif = false

    this._sphere()
    this._rais()
    this._poussieres()
    this._brume()
    this._controles()
    this.resize()
    window.addEventListener('resize', () => this.resize())
  }

  // ---- Le panorama --------------------------------------------------------
  _sphere() {
    const geo = new THREE.SphereGeometry(60, 72, 48)
    geo.scale(-1, 1, 1)
    this.panoMat = new THREE.MeshBasicMaterial({ color: 0x000000 })
    this.pano = new THREE.Mesh(geo, this.panoMat)
    this.scene.add(this.pano)
  }

  charger(url) {
    return new Promise((res, rej) => {
      new THREE.TextureLoader().load(url, tex => {
        tex.colorSpace = THREE.SRGBColorSpace
        tex.minFilter = THREE.LinearFilter
        tex.generateMipmaps = false
        tex.anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy())
        this.panoMat.map = tex
        this.panoMat.color.set(0xffffff)
        this.panoMat.needsUpdate = true
        res()
      }, undefined, rej)
    })
  }

  // ---- Rais de lumière ----------------------------------------------------
  // Des plans très allongés, dégradé doux, fusion additive, orientés vers un
  // point de lumière haut dans la canopée. Leur opacité ondule lentement.
  _rais() {
    const cv = document.createElement('canvas'); cv.width = 64; cv.height = 512
    const g = cv.getContext('2d')
    const grad = g.createLinearGradient(0, 0, 0, 512)
    grad.addColorStop(0, 'rgba(255,255,255,0.0)')
    grad.addColorStop(0.12, 'rgba(255,255,255,0.55)')
    grad.addColorStop(0.55, 'rgba(255,255,255,0.22)')
    grad.addColorStop(1, 'rgba(255,255,255,0.0)')
    g.fillStyle = grad; g.fillRect(0, 0, 64, 512)
    // Bords adoucis latéralement
    const side = g.createLinearGradient(0, 0, 64, 0)
    side.addColorStop(0, 'rgba(0,0,0,1)'); side.addColorStop(0.3, 'rgba(0,0,0,0)')
    side.addColorStop(0.7, 'rgba(0,0,0,0)'); side.addColorStop(1, 'rgba(0,0,0,1)')
    g.globalCompositeOperation = 'destination-out'; g.fillStyle = side; g.fillRect(0, 0, 64, 512)
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace

    this.rais = new THREE.Group()
    this.raisItems = []
    const n = this.mobile ? 7 : 11
    for (let i = 0; i < n; i++) {
      const mat = new THREE.MeshBasicMaterial({
        map: tex, transparent: true, depthWrite: false, depthTest: false,
        blending: THREE.AdditiveBlending, color: new THREE.Color(0xfff1cf), opacity: 0
      })
      const w = 1.6 + Math.random() * 2.4, h = 26 + Math.random() * 14
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat)
      // Répartis autour de l'axe de regard, un peu en avant et en hauteur.
      const a = (i / n) * Math.PI * 2 + Math.random() * 0.5
      const r = 10 + Math.random() * 12
      m.position.set(Math.cos(a) * r, 8 + Math.random() * 4, Math.sin(a) * r)
      // Le plan fait toujours face à l'observateur (qui ne bouge pas), sinon
      // on le verrait de profil. Une légère inclinaison casse la régularité.
      m.rotation.set(0, Math.atan2(m.position.x, m.position.z), (Math.random() - 0.5) * 0.35)
      m.userData = { base: 0.45 + Math.random() * 0.4, phase: Math.random() * 6.28, vitesse: 0.08 + Math.random() * 0.1, mat }
      this.rais.add(m)
      this.raisItems.push(m)
    }
    this.scene.add(this.rais)
    this.raisOpacite = 0
  }

  // ---- Poussières et pollen ----------------------------------------------
  _poussieres() {
    const cv = document.createElement('canvas'); cv.width = cv.height = 64
    const g = cv.getContext('2d')
    const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32)
    grad.addColorStop(0, 'rgba(255,252,235,1)')
    grad.addColorStop(0.35, 'rgba(255,252,235,0.5)')
    grad.addColorStop(1, 'rgba(255,252,235,0)')
    g.fillStyle = grad; g.fillRect(0, 0, 64, 64)
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace

    const n = this.mobile ? 260 : 620
    this.nP = n
    const pos = new Float32Array(n * 3)
    this.pBase = new Float32Array(n * 3)
    this.pPhase = new Float32Array(n * 2)
    this.pSize = new Float32Array(n)
    for (let i = 0; i < n; i++) {
      // Nuage autour de l'observateur : dense de près, clairsemé de loin.
      const r = 1.2 + Math.pow(Math.random(), 1.6) * 14
      const a = Math.random() * Math.PI * 2
      const y = (Math.random() - 0.35) * 8
      this.pBase[i * 3] = Math.cos(a) * r
      this.pBase[i * 3 + 1] = y
      this.pBase[i * 3 + 2] = Math.sin(a) * r
      this.pPhase[i * 2] = Math.random() * 6.28
      this.pPhase[i * 2 + 1] = 0.3 + Math.random() * 0.9
      this.pSize[i] = 0.035 + Math.random() * 0.1
    }
    pos.set(this.pBase)
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    geo.setAttribute('aSize', new THREE.BufferAttribute(this.pSize, 1))
    const mat = new THREE.ShaderMaterial({
      uniforms: { uTex: { value: tex }, uOpacity: { value: 0 }, uScale: { value: 300 } },
      vertexShader: `
        attribute float aSize; varying float vA;
        uniform float uScale;
        void main(){
          vec4 mv = modelViewMatrix * vec4(position,1.0);
          float d = -mv.z;
          gl_PointSize = aSize * uScale / d;
          vA = smoothstep(0.6, 2.2, d) * (1.0 - smoothstep(9.0, 16.0, d));
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: `
        uniform sampler2D uTex; uniform float uOpacity; varying float vA;
        void main(){
          vec4 c = texture2D(uTex, gl_PointCoord);
          gl_FragColor = vec4(c.rgb, c.a * vA * uOpacity);
        }`,
      transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending
    })
    this.pMat = mat
    this.points = new THREE.Points(geo, mat)
    this.scene.add(this.points)
  }

  // ---- Brume au sol -------------------------------------------------------
  // Un halo très doux, légèrement en dessous de l'horizon, qui voile le bas
  // du champ et fond le plancher de la photo.
  _brume() {
    const cv = document.createElement('canvas'); cv.width = 256; cv.height = 128
    const g = cv.getContext('2d')
    const grad = g.createLinearGradient(0, 0, 0, 128)
    grad.addColorStop(0, 'rgba(223,234,228,0)')
    grad.addColorStop(0.6, 'rgba(223,234,228,0.55)')
    grad.addColorStop(1, 'rgba(223,234,228,0.75)')
    g.fillStyle = grad; g.fillRect(0, 0, 256, 128)
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace
    // Le cylindre descend bien sous le champ de vision le plus bas (-75°) et
    // un disque le ferme : on ne doit jamais voir son bord.
    const geo = new THREE.CylinderGeometry(40, 40, 70, 48, 1, true)
    const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.BackSide, depthWrite: false, opacity: 0 })
    this.brumeMat = mat
    const m = new THREE.Mesh(geo, mat)
    m.position.y = -37
    this.scene.add(m)
    const fond = new THREE.Mesh(new THREE.CircleGeometry(40, 48),
      new THREE.MeshBasicMaterial({ color: 0xdfeae4, transparent: true, depthWrite: false, opacity: 0 }))
    fond.rotation.x = Math.PI / 2
    fond.position.y = -72
    this.brumeFond = fond.material
    this.scene.add(fond)
  }

  // ---- Contrôles ----------------------------------------------------------
  _controles() {
    const el = this.canvas
    let down = false, lx = 0, ly = 0, vx = 0, vy = 0
    const debut = e => { down = true; lx = e.clientX; ly = e.clientY; vx = vy = 0; this.onInteraction?.() }
    const bouge = e => {
      const w = window.innerWidth, h = window.innerHeight
      this.mouseX = (e.clientX / w) * 2 - 1
      this.mouseY = (e.clientY / h) * 2 - 1
      if (!down) return
      const dx = e.clientX - lx, dy = e.clientY - ly
      lx = e.clientX; ly = e.clientY
      const k = (this.camera.fov / 70) * 0.0028
      vx = -dx * k; vy = -dy * k
      this.dragYaw += vx; this.dragPitch = clamp(this.dragPitch + vy, -70 * DEG, 70 * DEG)
    }
    const fin = () => { down = false; this.inertie = { vx, vy } }
    el.addEventListener('pointerdown', debut)
    window.addEventListener('pointermove', bouge, { passive: true })
    window.addEventListener('pointerup', fin)
    window.addEventListener('pointercancel', fin)
  }

  // Gyroscope : à appeler depuis un geste (iOS exige une permission).
  async activerGyro() {
    if (typeof DeviceOrientationEvent === 'undefined') return false
    try {
      if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        const r = await DeviceOrientationEvent.requestPermission()
        if (r !== 'granted') return false
      }
    } catch { return false }
    const zee = new THREE.Vector3(0, 0, 1)
    const euler = new THREE.Euler()
    const q0 = new THREE.Quaternion()
    const q1 = new THREE.Quaternion(-Math.SQRT1_2, 0, 0, Math.SQRT1_2)
    const q = new THREE.Quaternion()
    let vu = false
    window.addEventListener('deviceorientation', e => {
      if (e.alpha == null || e.beta == null || e.gamma == null) return
      const orient = (screen.orientation?.angle ?? window.orientation ?? 0) * DEG
      euler.set(e.beta * DEG, e.alpha * DEG, -e.gamma * DEG, 'YXZ')
      q.setFromEuler(euler).multiply(q1).multiply(q0.setFromAxisAngle(zee, -orient))
      this.gyro = q.clone()
      if (!vu) {
        // On aligne la première mesure sur la vue de départ, quelle que soit
        // la direction réelle du téléphone.
        const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(this.gyro)
        const heading = Math.atan2(dir.x, -dir.z)
        this.gyroOffset = YAW0 - heading
        vu = true
      }
    }, { passive: true })
    return true
  }

  resize() {
    const w = window.innerWidth, h = window.innerHeight
    this.renderer.setSize(w, h, false)
    this.camera.aspect = w / h
    // Sur un écran étroit on ouvre plus l'angle pour ne pas se sentir enfermé.
    this.fovBase = w < h ? 82 : 68
    this.camera.updateProjectionMatrix()
    this.pMat.uniforms.uScale.value = h * 0.42
  }

  // Descente dans la forêt : p va de 0 à 1 sur la durée de l'intro.
  setIntro(p) { this.intro = p }

  // ---- Boucle -------------------------------------------------------------
  rendu() {
    const t = (performance.now() - this.t0) / 1000
    const p = this.intro
    const ease = 1 - Math.pow(1 - p, 3)

    // Inertie après un glissé
    if (this.inertie) {
      this.dragYaw += this.inertie.vx; this.dragPitch = clamp(this.dragPitch + this.inertie.vy, -70 * DEG, 70 * DEG)
      this.inertie.vx *= 0.93; this.inertie.vy *= 0.93
      if (Math.abs(this.inertie.vx) + Math.abs(this.inertie.vy) < 0.00005) this.inertie = null
    }

    // Respiration : très lent balancement de tangage, et un souffle du champ.
    const respire = Math.sin(t * 0.21) * 0.35 * DEG + Math.sin(t * 0.07) * 0.5 * DEG
    const fovResp = Math.sin(t * 0.16) * 0.6

    // Intro : on part le regard levé vers la canopée, champ serré, puis on
    // redescend vers l'allée en ouvrant l'angle. C'est la « descente ».
    const pitchIntro = lerp(52 * DEG, 0, ease)
    const fov = lerp(34, this.fovBase, ease) + fovResp * ease
    const roll = lerp(-3 * DEG, 0, ease)

    if (this.gyro && this.gyroOffset != null) {
      // Téléphone : orientation réelle + décalage au doigt + intro par-dessus.
      const qYaw = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.gyroOffset + this.dragYaw)
      const qIntro = new THREE.Quaternion().setFromEuler(new THREE.Euler(pitchIntro + respire, 0, roll, 'YXZ'))
      this.camera.quaternion.copy(qYaw).multiply(this.gyro).multiply(qIntro)
    } else {
      // Souris : parallaxe douce + glissé + intro.
      const par = this.mobile ? 0 : 1
      this.yawT = YAW0 + this.dragYaw - this.mouseX * 9 * DEG * par
      this.pitchT = clamp(PITCH0 + this.dragPitch - this.mouseY * 5 * DEG * par, -75 * DEG, 75 * DEG)
      this.yaw = lerp(this.yaw, this.yawT, 0.055)
      this.pitch = lerp(this.pitch, this.pitchT, 0.055)
      this.camera.rotation.set(this.pitch + pitchIntro + respire, this.yaw, roll, 'YXZ')
    }
    if (Math.abs(this.camera.fov - fov) > 0.01) { this.camera.fov = fov; this.camera.updateProjectionMatrix() }

    // Rais : apparaissent pendant l'intro, ondulent ensuite.
    const cible = ease
    this.raisOpacite = lerp(this.raisOpacite, cible, 0.03)
    for (const m of this.raisItems) {
      const u = m.userData
      const o = u.base * (0.55 + 0.45 * Math.sin(t * u.vitesse * 6.283 + u.phase))
      u.mat.opacity = o * this.raisOpacite
    }
    // Les rais suivent la caméra sur le lacet seulement : ils restent
    // « dans la lumière », pas collés à l'écran.
    this.rais.rotation.y = Math.sin(t * 0.03) * 0.15

    // Poussières : dérive lente, chacune sur son propre cycle.
    const pos = this.points.geometry.attributes.position.array
    for (let i = 0; i < this.nP; i++) {
      const ph = this.pPhase[i * 2], v = this.pPhase[i * 2 + 1]
      pos[i * 3] = this.pBase[i * 3] + Math.sin(t * 0.13 * v + ph) * 0.6
      pos[i * 3 + 1] = this.pBase[i * 3 + 1] + Math.sin(t * 0.09 * v + ph * 1.3) * 0.5 - (t * 0.02 * v) % 8 + 4
      pos[i * 3 + 2] = this.pBase[i * 3 + 2] + Math.cos(t * 0.11 * v + ph * 0.7) * 0.6
    }
    this.points.geometry.attributes.position.needsUpdate = true
    this.pMat.uniforms.uOpacity.value = lerp(this.pMat.uniforms.uOpacity.value, 0.7 * ease, 0.02)
    this.brumeMat.opacity = lerp(this.brumeMat.opacity, 0.42 * ease, 0.02)
    this.brumeFond.opacity = this.brumeMat.opacity * 0.75

    this.renderer.render(this.scene, this.camera)
  }
}
