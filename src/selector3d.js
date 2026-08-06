// Écran de sélection : les deux livres fermés côte à côte dans le décor.
// Survol/focus → le livre s'avance ; sélection → plongée caméra (diveTo).

import * as THREE from 'three'

const PW = 1.022
const PH = (1491 / 1055) * 1.022
const DEPTH = 0.075

export class Selector3D {
  /**
   * @param {Object} o
   * @param {HTMLCanvasElement} o.canvas
   * @param {THREE.WebGLRenderer} o.renderer   renderer partagé
   * @param {Object} o.covers   { classique: {front, back}, thermostatique: {front, back} } (canvas)
   * @param {HTMLCanvasElement} o.edgeCanvas   texture de tranche
   * @param {boolean} o.reduced
   * @param {Function} o.onPick(id)
   */
  constructor({ canvas, renderer, covers, edgeCanvas, reduced, onPick }) {
    this.canvas = canvas
    this.renderer = renderer
    this.reduced = reduced
    this.onPick = onPick
    this.hover = null
    this.diving = null

    this.scene = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera(34, 1, 0.1, 30)
    this.cam = { el: 0.88, dist: 4, tx: 0, ty: 0, tz: 0 }
    this.camGoal = { ...this.cam }

    // Lumières (même ambiance que le livre)
    this.scene.add(new THREE.HemisphereLight(0xbfe2ea, 0x0a1417, 0.5))
    const key = new THREE.DirectionalLight(0xfff1df, 2.2)
    key.position.set(-1.7, 3.6, 1.6)
    key.castShadow = true
    key.shadow.mapSize.set(1024, 1024)
    const kc = key.shadow.camera
    kc.left = -2.4; kc.right = 2.4; kc.top = 2.4; kc.bottom = -2.4
    kc.near = 0.5; kc.far = 8
    key.shadow.bias = -0.0004
    key.shadow.normalBias = 0.02
    this.scene.add(key)
    const rim = new THREE.PointLight(0x2fb8c9, 3.4, 12, 1.8)
    rim.position.set(1.9, 1.1, -1.9)
    this.scene.add(rim)

    // Sol à ombres + halos sous chaque livre
    const floor = new THREE.Mesh(new THREE.CircleGeometry(7, 48), new THREE.ShadowMaterial({ opacity: 0.4 }))
    floor.rotation.x = -Math.PI / 2
    floor.receiveShadow = true
    this.scene.add(floor)

    const glowTex = this._glowTexture()
    this.glows = {}
    for (const [id, x] of [['classique', -0.78], ['thermostatique', 0.78]]) {
      const glow = new THREE.Mesh(
        new THREE.PlaneGeometry(2.3, 2.9),
        new THREE.MeshBasicMaterial({
          map: glowTex, transparent: true, depthWrite: false,
          blending: THREE.AdditiveBlending, opacity: 0.42
        })
      )
      glow.rotation.x = -Math.PI / 2
      glow.position.set(x, 0.002, 0)
      this.scene.add(glow)
      this.glows[id] = glow
    }

    // Les deux livres fermés : ils lévitent et tournent sur eux-mêmes
    // à l'infini, comme des objets de jeu vidéo.
    const edgeTex = new THREE.CanvasTexture(edgeCanvas)
    edgeTex.wrapS = edgeTex.wrapT = THREE.RepeatWrapping
    this.books = {}
    for (const [id, x] of [['classique', -0.78], ['thermostatique', 0.78]]) {
      const mesh = this._makeBook(covers[id], edgeTex)
      const tilt = new THREE.Group()
      tilt.rotation.x = Math.PI / 2 - 0.1 // debout, couverture face caméra
      tilt.add(mesh)
      const spin = new THREE.Group()
      spin.add(tilt)
      spin.position.set(x, 1.0, 0)
      spin.userData = { id, baseX: x, lift: 0, liftTarget: 0, phase: x * 2 }
      this.scene.add(spin)
      this.books[id] = spin
    }

    this.ray = new THREE.Raycaster()
    this._bound = [
      [canvas, 'pointermove', (e) => this._onMove(e)],
      [canvas, 'pointerup', (e) => this._onTap(e)]
    ]
    for (const [t, ev, fn] of this._bound) t.addEventListener(ev, fn)
    this._onResize = () => this._resize()
    window.addEventListener('resize', this._onResize)

    this.clock = new THREE.Clock()
    this._resize()
    this.cam = { ...this.camGoal }
    this.renderer.setAnimationLoop(() => this._frame())
  }

  _glowTexture() {
    const c = document.createElement('canvas')
    c.width = c.height = 256
    const ctx = c.getContext('2d')
    const g = ctx.createRadialGradient(128, 128, 8, 128, 128, 128)
    g.addColorStop(0, 'rgba(38, 150, 165, 0.55)')
    g.addColorStop(0.5, 'rgba(24, 96, 108, 0.16)')
    g.addColorStop(1, 'rgba(0, 0, 0, 0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 256, 256)
    return new THREE.CanvasTexture(c)
  }

  _makeBook(covers, edgeTex) {
    const front = new THREE.CanvasTexture(covers.front)
    front.colorSpace = THREE.SRGBColorSpace
    front.anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy())
    const back = new THREE.CanvasTexture(covers.back)
    back.colorSpace = THREE.SRGBColorSpace
    // La face arrière de la boîte est cartographiée tête-bêche : on remet la
    // 4e de couverture à l'endroit pour la rotation du livre.
    back.center.set(0.5, 0.5)
    back.rotation = Math.PI

    const paper = new THREE.MeshStandardMaterial({ map: edgeTex, roughness: 0.9 })
    const spine = new THREE.MeshStandardMaterial({ color: 0x0b3a44, roughness: 0.6 })
    const coverMat = new THREE.MeshStandardMaterial({ map: front, roughness: 0.55, metalness: 0 })
    const backMat = new THREE.MeshStandardMaterial({ map: back, roughness: 0.55, metalness: 0 })

    // Boîte à plat : x = largeur (dos en -x), y = épaisseur, z = hauteur de page
    const geo = new THREE.BoxGeometry(PW, DEPTH, PH)
    const mesh = new THREE.Mesh(geo, [paper, spine, coverMat, backMat, paper, paper])
    mesh.castShadow = true
    mesh.receiveShadow = true
    const g = new THREE.Group()
    g.add(mesh)
    return g
  }

  setHover(id) {
    if (this.diving) return
    this.hover = id
    for (const [bid, book] of Object.entries(this.books)) {
      book.userData.liftTarget = bid === id ? 1 : 0
    }
  }

  _pickAt(e) {
    const rect = this.canvas.getBoundingClientRect()
    const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1
    const ny = -((e.clientY - rect.top) / rect.height) * 2 + 1
    this.ray.setFromCamera(new THREE.Vector2(nx, ny), this.camera)
    const hits = this.ray.intersectObjects(Object.values(this.books), true)
    if (!hits.length) return null
    let obj = hits[0].object
    while (obj && !obj.userData.id) obj = obj.parent
    return obj ? obj.userData.id : null
  }

  _onMove(e) {
    if (this.diving) return
    if (e.pointerType === 'mouse') this.setHover(this._pickAt(e))
  }

  _onTap(e) {
    if (this.diving) return
    const id = this._pickAt(e)
    if (id && this.onPick) this.onPick(id)
  }

  // Plongée de la caméra vers le livre choisi ; l'autre livre s'estompe.
  diveTo(id, dur = 0.5) {
    this.diving = id
    this.diveStart = performance.now()
    this.diveDur = dur * 1000
    const other = this.books[id === 'classique' ? 'thermostatique' : 'classique']
    other.traverse((o) => {
      if (o.material) {
        const mats = Array.isArray(o.material) ? o.material : [o.material]
        mats.forEach((m) => { m.transparent = true })
        o.userData.fade = true
      }
    })
    this.glows[id === 'classique' ? 'thermostatique' : 'classique'].userData = { fade: true }
    return new Promise((resolve) => { this.diveResolve = resolve })
  }

  // Arrivée depuis un livre (transition retour) : caméra proche, puis recul.
  arriveFrom(id) {
    const book = this.books[id]
    this.cam.el = 0.35
    this.cam.dist = 1.5
    this.cam.tx = book.position.x
    this.cam.ty = 1.0
    this.cam.tz = 0
  }

  _resize() {
    const w = this.canvas.clientWidth || window.innerWidth
    const h = this.canvas.clientHeight || window.innerHeight
    this.renderer.setSize(w, h, false)
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
    // Cadrage : les deux livres debout (largeur ~2.9, hauteur ~1.5)
    // tiennent dans le champ, vue frontale légèrement plongeante.
    const vHalf = Math.tan((this.camera.fov * Math.PI) / 360)
    const hHalf = vHalf * this.camera.aspect
    const portrait = this.camera.aspect < 0.9
    const halfW = portrait ? 1.30 : 1.55
    const halfH = PH / 2 + 0.42
    this.camGoal.dist = Math.max(halfW / hHalf, halfH / vHalf) + (portrait ? 0.5 : 0.8)
    this.camGoal.el = 0.32
    this.camGoal.tx = 0
    this.camGoal.ty = 1.0
    this.camGoal.tz = 0
  }

  _frame() {
    const dt = Math.min(this.clock.getDelta(), 0.5)
    const damp = (r) => (this.reduced ? 1 : 1 - Math.exp(-r * dt))
    const now = performance.now() / 1000

    // Livres : lévitation + rotation infinie sur eux-mêmes, avancée au survol
    for (const book of Object.values(this.books)) {
      const u = book.userData
      u.lift += (u.liftTarget - u.lift) * damp(6)
      if (this.reduced) {
        book.rotation.y = 0.12 * Math.sign(u.baseX) * -1
        book.position.y = 1.0
      } else {
        book.rotation.y += dt * 0.55 * (1 + u.lift * 0.6) // tour complet ~11 s
        book.position.y = 1.0 + Math.sin(now * 0.9 + u.phase) * 0.035 + u.lift * 0.05
      }
      book.position.z = u.lift * 0.16
      const sc = 1 + u.lift * 0.07
      book.scale.set(sc, sc, sc)
      // Estompage pendant la plongée
      book.traverse((o) => {
        if (o.userData && o.userData.fade && o.material) {
          const mats = Array.isArray(o.material) ? o.material : [o.material]
          mats.forEach((m) => { m.opacity += (0 - m.opacity) * damp(7) })
        }
      })
    }
    for (const glow of Object.values(this.glows)) {
      if (glow.userData && glow.userData.fade) {
        glow.material.opacity += (0 - glow.material.opacity) * damp(7)
      } else if (!this.reduced) {
        glow.material.opacity = 0.38 + Math.sin(now * 0.8 + glow.position.x) * 0.05
      }
    }

    // Caméra : cadrage normal ou plongée vers le livre choisi
    if (this.diving) {
      const k = Math.min(1, (performance.now() - this.diveStart) / this.diveDur)
      const e = k * k * (3 - 2 * k)
      const book = this.books[this.diving]
      this.cam.el += (0.3 - this.cam.el) * e * 0.35
      this.cam.dist += (1.05 - this.cam.dist) * e * 0.35
      this.cam.tx += (book.position.x - this.cam.tx) * e * 0.4
      this.cam.ty += (1.0 - this.cam.ty) * e * 0.4
      this.cam.tz += (0 - this.cam.tz) * e * 0.4
      if (k >= 1 && this.diveResolve) {
        this.diveResolve()
        this.diveResolve = null
      }
    } else {
      const g = this.camGoal
      this.cam.el += (g.el - this.cam.el) * damp(2.4)
      this.cam.dist += (g.dist - this.cam.dist) * damp(2.4)
      this.cam.tx += (g.tx - this.cam.tx) * damp(2.4)
      this.cam.ty += (g.ty - this.cam.ty) * damp(2.4)
      this.cam.tz += (g.tz - this.cam.tz) * damp(2.4)
    }
    const c = this.cam
    this.camera.position.set(c.tx, c.ty + c.dist * Math.sin(c.el), c.tz + c.dist * Math.cos(c.el))
    this.camera.lookAt(c.tx, c.ty, c.tz)

    this.renderer.render(this.scene, this.camera)
  }

  dispose() {
    this.renderer.setAnimationLoop(null)
    window.removeEventListener('resize', this._onResize)
    for (const [t, ev, fn] of this._bound) t.removeEventListener(ev, fn)
    this.scene.traverse((o) => { if (o.geometry) o.geometry.dispose() })
  }
}
