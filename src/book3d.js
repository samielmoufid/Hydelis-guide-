// Livre 3D Hydelis — géométrie réelle, pages qui plient, tranche visible.
// Repère local du livre (groupe « flat ») : x = largeur (dos en x=0),
// y = hauteur de page, z = empilement (devient la verticale monde).

import * as THREE from 'three'

const PW = 1                 // largeur d'une page
const PH = 1491 / 1055       // hauteur d'une page
const TH = 0.0085            // épaisseur visuelle d'une feuille
const SEG = 26               // segments de courbure
const COVER_SCALE = 1.022
const EASE = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

// Clone miroir d'une texture (verso des feuilles), mis en cache sur la
// texture source : un seul envoi GPU même si le livre est reconstruit.
export function mirrorTexture(tex) {
  if (tex.userData.mirrored) return tex.userData.mirrored
  const t = tex.clone()
  t.wrapS = THREE.RepeatWrapping
  t.repeat.x = -1
  t.offset.x = 1
  t.needsUpdate = true
  tex.userData.mirrored = t
  return t
}

export class Book3D {
  /**
   * @param {Object} o
   * @param {HTMLCanvasElement} o.canvas
   * @param {THREE.WebGLRenderer} [o.renderer]  renderer partagé (sinon créé ici)
   * @param {THREE.Texture[]} o.faces      textures recto/verso des feuilles
   * @param {number} o.nPages              nombre de vraies pages du guide
   * @param {THREE.Texture} o.edgeTexture  texture de tranche
   * @param {boolean} o.reduced            prefers-reduced-motion
   * @param {Object} o.on                  callbacks { change, turnStart, doubleTap, pinch, zoom, zoomNav }
   */
  constructor({ canvas, renderer, faces, nPages, edgeTexture, reduced, on = {} }) {
    this.canvas = canvas
    this.on = on
    this.reduced = reduced
    this.nPages = nPages
    this.S = faces.length / 2  // nombre de feuilles
    this.opened = false        // avant le premier « Touchez pour ouvrir »
    this.lightRamp = 0         // 0 = pénombre d'intro, 1 = éclairage lecture

    this.ownRenderer = !renderer
    this.renderer = renderer || new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.06
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap

    this.scene = new THREE.Scene()

    this.rig = new THREE.Group()
    this.scene.add(this.rig)
    this.camera = new THREE.PerspectiveCamera(34, 1, 0.1, 30)
    this.rig.add(this.camera)
    this.camEl = 0.96      // élévation en lecture (rad)
    this.zoomEl = 1.40     // élévation en zoom page : presque à la verticale
    this.fitDist = 3.6
    // État caméra animé : élévation, distance, point visé.
    this.cam = { el: this.camEl, dist: 3.6, tx: 0, ty: 0.02, tz: -0.14 }
    this.zoom = null       // { side: 'left' | 'right' } quand une page est zoomée

    this.parallax = { x: 0, y: 0, tx: 0, ty: 0 }

    this._buildLights()
    this._buildFloor()
    if (!reduced) this._buildParticles()

    // Groupes : tilt (pose + respiration) → flat (couché à plat)
    this.tilt = new THREE.Group()
    this.scene.add(this.tilt)
    this.flat = new THREE.Group()
    this.flat.rotation.x = -Math.PI / 2
    this.flat.position.y = 0.055
    this.tilt.add(this.flat)
    this.flatX = -PW / 2
    this.flat.position.x = this.flatX

    this._buildSheets(faces)
    this._buildBlocks(edgeTexture)

    // Interaction
    this.pointer = null
    this.dragSheet = null
    this.lastTap = null
    this.pinch = null
    this._bindPointer()

    this.clock = new THREE.Clock()
    this._resize()
    this.cam.dist = this.fitDist // cadrage correct dès la première image
    this._onResize = () => this._resize()
    window.addEventListener('resize', this._onResize)
    this.renderer.setAnimationLoop(() => this._frame())
  }

  // ————— Construction —————

  _buildLights() {
    this.hemi = new THREE.HemisphereLight(0xbfe2ea, 0x0a1417, 0.35)
    this.scene.add(this.hemi)

    this.key = new THREE.DirectionalLight(0xfff1df, 1.0)
    this.key.position.set(-1.7, 3.6, 1.6)
    this.key.castShadow = true
    this.key.shadow.mapSize.set(1024, 1024)
    const c = this.key.shadow.camera
    c.left = -1.9; c.right = 1.9; c.top = 1.9; c.bottom = -1.9
    c.near = 0.5; c.far = 8
    this.key.shadow.bias = -0.0004
    this.key.shadow.normalBias = 0.02
    this.key.shadow.radius = 5
    this.scene.add(this.key)
    this.scene.add(this.key.target)

    this.fill = new THREE.DirectionalLight(0x86b8c4, 0.28)
    this.fill.position.set(1.4, 1.8, 2.4)
    this.scene.add(this.fill)

    this.rim = new THREE.PointLight(0x2fb8c9, 3.5, 12, 1.8)
    this.rim.position.set(1.9, 1.1, -1.9)
    this.scene.add(this.rim)
  }

  _buildFloor() {
    const shadowMat = new THREE.ShadowMaterial({ opacity: 0.42 })
    const floor = new THREE.Mesh(new THREE.CircleGeometry(7, 48), shadowMat)
    floor.rotation.x = -Math.PI / 2
    floor.receiveShadow = true
    this.scene.add(floor)

    // Halo lumineux sous le livre
    const c = document.createElement('canvas')
    c.width = c.height = 256
    const ctx = c.getContext('2d')
    const g = ctx.createRadialGradient(128, 128, 8, 128, 128, 128)
    g.addColorStop(0, 'rgba(38, 150, 165, 0.55)')
    g.addColorStop(0.5, 'rgba(24, 96, 108, 0.16)')
    g.addColorStop(1, 'rgba(0, 0, 0, 0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 256, 256)
    const glowTex = new THREE.CanvasTexture(c)
    this.glow = new THREE.Mesh(
      new THREE.PlaneGeometry(4.4, 3.6),
      new THREE.MeshBasicMaterial({
        map: glowTex, transparent: true, depthWrite: false,
        blending: THREE.AdditiveBlending, opacity: 0.5
      })
    )
    this.glow.rotation.x = -Math.PI / 2
    this.glow.position.y = 0.002
    this.scene.add(this.glow)
  }

  _buildParticles() {
    const N = 70
    const pos = new Float32Array(N * 3)
    this.partSpeed = new Float32Array(N)
    for (let i = 0; i < N; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 6
      pos[i * 3 + 1] = Math.random() * 2.6
      pos[i * 3 + 2] = -0.4 - Math.random() * 2.6
      this.partSpeed[i] = 0.02 + Math.random() * 0.05
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    this.particles = new THREE.Points(geo, new THREE.PointsMaterial({
      color: 0x7fd4de, size: 0.014, sizeAttenuation: true,
      transparent: true, opacity: 0.32, depthWrite: false,
      blending: THREE.AdditiveBlending
    }))
    this.scene.add(this.particles)
  }

  _mirrored(tex) {
    return mirrorTexture(tex)
  }

  _buildSheets(faces) {
    this.sheets = []
    const maxAniso = Math.min(8, this.renderer.capabilities.getMaxAnisotropy())
    for (const tx of faces) {
      tx.colorSpace = THREE.SRGBColorSpace
      tx.anisotropy = maxAniso
    }

    for (let i = 0; i < this.S; i++) {
      const stiff = i === 0 || i === this.S - 1
      const w = stiff ? PW * COVER_SCALE : PW
      const h = stiff ? PH * COVER_SCALE : PH
      const geom = new THREE.PlaneGeometry(w, h, SEG, 3)
      geom.translate(w / 2, 0, 0)

      const base = geom.attributes.position.array.slice()

      // Les faces extérieures (couverture, 4e de couverture) sont atténuées
      // pour garder le teal profond du sélecteur sous l'éclairage de lecture
      // (pensé pour des pages blanches). Gardes et pages restent intactes.
      const coverTint = 0xc6cccd
      const tintF = stiff && i === 0
      const tintB = stiff && i === this.S - 1
      const matF = new THREE.MeshStandardMaterial({
        map: faces[2 * i], roughness: stiff ? 0.72 : 0.88, metalness: 0,
        color: tintF ? coverTint : 0xffffff,
        side: THREE.FrontSide
      })
      const matB = new THREE.MeshStandardMaterial({
        map: this._mirrored(faces[2 * i + 1]), roughness: stiff ? 0.72 : 0.88, metalness: 0,
        color: tintB ? coverTint : 0xffffff,
        side: THREE.BackSide
      })
      const meshF = new THREE.Mesh(geom, matF)
      const meshB = new THREE.Mesh(geom, matB)
      meshF.castShadow = true
      meshF.receiveShadow = true
      meshB.receiveShadow = true

      const holder = new THREE.Group()
      holder.add(meshF, meshB)
      this.flat.add(holder)

      this.sheets.push({
        i, geom, base, holder, w, h, stiff,
        bendK: stiff ? 0.09 : 0.45,
        t: 0, target: 0, lagSign: 1,
        anim: null, dragging: false, vel: 0
      })
      this._deform(this.sheets[i])
      this._place(this.sheets[i])
    }
  }

  _buildBlocks(edgeTexture) {
    edgeTexture.wrapS = edgeTexture.wrapT = THREE.RepeatWrapping
    const paperTop = new THREE.MeshStandardMaterial({ color: 0xe9edee, roughness: 0.9 })
    const edge = new THREE.MeshStandardMaterial({ map: edgeTexture, roughness: 0.9 })
    const mats = [edge, edge, edge, edge, paperTop, paperTop]
    const geo = new THREE.BoxGeometry(PW * 0.985, PH * 0.985, 1)
    geo.translate(PW * 0.985 / 2 + 0.004, 0, 0.5)

    this.blockR = new THREE.Mesh(geo, mats)
    this.blockL = new THREE.Mesh(geo.clone().scale(-1, 1, 1), mats)
    this.blockR.castShadow = this.blockL.castShadow = true
    this.blockR.receiveShadow = this.blockL.receiveShadow = true
    this.flat.add(this.blockR, this.blockL)

    // Dos du livre (petite pièce sombre sous la reliure)
    this.spine = new THREE.Mesh(
      new THREE.BoxGeometry(0.055, PH * COVER_SCALE, 1),
      new THREE.MeshStandardMaterial({ color: 0x0b3a44, roughness: 0.6 })
    )
    this.spine.geometry.translate(0, 0, 0.5)
    this.flat.add(this.spine)
  }

  // ————— Géométrie des pages —————

  _deform(s) {
    const pos = s.geom.attributes.position
    const arr = pos.array
    const base = s.base
    const thetaBase = Math.PI * s.t
    const bend = s.bendK * Math.sin(thetaBase) * s.lagSign
    for (let vi = 0; vi < arr.length; vi += 3) {
      const x0 = base[vi]
      const u = x0 / s.w
      const th = thetaBase - bend * Math.sin(u * Math.PI * 0.5)
      arr[vi] = x0 * Math.cos(th)
      arr[vi + 1] = base[vi + 1]
      arr[vi + 2] = x0 * Math.sin(th)
    }
    pos.needsUpdate = true
    s.geom.computeVertexNormals()
  }

  _place(s) {
    // Hauteur d'empilement : pile droite (S-1-i)·TH → pile gauche i·TH, avec
    // un léger soulèvement pendant la rotation.
    const hR = 0.004 + (this.S - 1 - s.i) * TH
    const hL = 0.004 + s.i * TH
    const k = EASE(Math.min(1, Math.max(0, s.t)))
    const lift = Math.sin(Math.PI * Math.min(1, Math.max(0, s.t))) * TH * 2.2
    s.holder.position.z = hR + (hL - hR) * k + lift
  }

  // ————— Animation des feuilles —————

  get turned() {
    return this.sheets.filter((s) => s.target === 1).length
  }

  _animate(s, to, dur, delay = 0) {
    if (s.target === to && !s.dragging && s.anim === null && s.t === to) return
    s.target = to
    s.lagSign = to > s.t ? 1 : -1
    s.dragging = false
    if (this.reduced || dur <= 0) {
      s.anim = { from: s.t, to, start: -1, dur: 0.001, delay: 0 }
    } else {
      s.anim = { from: s.t, to, start: -1, dur, delay }
    }
  }

  next() {
    const T = this.turned
    if (T >= this.S) return false
    const s = this.sheets[T]
    this._animate(s, 1, s.stiff ? 1.15 : 0.95)
    this._notifyTurn(1, s)
    return true
  }

  prev() {
    const T = this.turned
    if (T <= 0) return false
    const s = this.sheets[T - 1]
    this._animate(s, 0, s.stiff ? 1.15 : 0.95)
    this._notifyTurn(-1, s)
    return true
  }

  goTo(T2) {
    this.zoomExit()
    T2 = Math.max(0, Math.min(this.S, T2))
    const T = this.turned
    if (T2 === T) return
    let step = 0
    if (T2 > T) {
      for (let i = T; i < T2; i++) {
        this._animate(this.sheets[i], 1, 0.8, 0.09 * step++)
      }
    } else {
      for (let i = T - 1; i >= T2; i--) {
        this._animate(this.sheets[i], 0, 0.8, 0.09 * step++)
      }
    }
    this._notifyTurn(T2 > T ? 1 : -1, this.sheets[Math.min(T, T2)])
  }

  open() {
    // Première ouverture de la couverture.
    this.opened = true
    this.next()
  }

  _notifyTurn(dir, s) {
    this.on.turnStart && this.on.turnStart(dir, s.stiff)
    this.on.change && this.on.change(this.turned)
  }

  // ————— Pointeur —————

  _localFromEvent(e) {
    const rect = this.canvas.getBoundingClientRect()
    const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1
    const ny = -((e.clientY - rect.top) / rect.height) * 2 + 1
    const ray = new THREE.Raycaster()
    ray.setFromCamera(new THREE.Vector2(nx, ny), this.camera)
    const y = this.flat.position.y + this.tilt.position.y
    const tHit = (y - ray.ray.origin.y) / ray.ray.direction.y
    if (!isFinite(tHit) || tHit < 0) return null
    const p = ray.ray.origin.clone().addScaledVector(ray.ray.direction, tHit)
    return { x: p.x - this.flat.position.x, y: p.z, nx, ny }
  }

  _bindPointer() {
    const el = this.canvas
    this._bound = [
      [el, 'pointerdown', (e) => this._onDown(e)],
      [el, 'pointermove', (e) => this._onMove(e)],
      [el, 'pointerup', (e) => this._onUp(e)],
      [el, 'pointercancel', (e) => this._onUp(e, true)]
    ]
    for (const [t, ev, fn] of this._bound) t.addEventListener(ev, fn)
  }

  _onDown(e) {
    if (!this.opened) return
    this.canvas.setPointerCapture(e.pointerId)

    if (this.pointer && this.pointer.id !== e.pointerId) {
      // Deuxième doigt → pincement
      this.pinch = { d0: 0, fired: false, ids: [this.pointer.id, e.pointerId], pts: {} }
      this.pinch.pts[this.pointer.id] = { x: this.pointer.cx, y: this.pointer.cy }
      this.pinch.pts[e.pointerId] = { x: e.clientX, y: e.clientY }
      this.pinch.d0 = this._pinchDist()
      this._cancelDrag()
      return
    }

    const loc = this._localFromEvent(e)
    if (!loc) return
    this.pointer = {
      id: e.pointerId, x0: e.clientX, y0: e.clientY, cx: e.clientX, cy: e.clientY,
      t0: performance.now(), loc0: loc, moved: false
    }
    const T = this.turned
    const w = PW
    if (this.zoom) {
      this.dragSheet = null // pas de glisser-coin en mode zoom
    } else if (loc.x > w * 0.5 && T < 6) {
      this.dragSheet = this.sheets[T]
      this.dragDir = 1
    } else if (loc.x < -w * 0.5 && T > 0) {
      this.dragSheet = this.sheets[T - 1]
      this.dragDir = -1
    } else {
      this.dragSheet = null
    }
    this.dragActive = false
  }

  _pinchDist() {
    const [a, b] = this.pinch.ids
    const pa = this.pinch.pts[a]
    const pb = this.pinch.pts[b]
    return Math.hypot(pa.x - pb.x, pa.y - pb.y)
  }

  _onMove(e) {
    if (this.pinch) {
      if (this.pinch.pts[e.pointerId]) {
        this.pinch.pts[e.pointerId] = { x: e.clientX, y: e.clientY }
        const d = this._pinchDist()
        if (!this.pinch.fired && d > this.pinch.d0 * 1.06) {
          this.pinch.fired = true
          const [a, b] = this.pinch.ids
          const mx = (this.pinch.pts[a].x + this.pinch.pts[b].x) / 2
          const side = mx > this.canvas.clientWidth / 2 ? 'right' : 'left'
          this.on.pinch && this.on.pinch(side)
        }
      }
      return
    }
    if (!this.pointer || e.pointerId !== this.pointer.id) return
    this.pointer.cx = e.clientX
    this.pointer.cy = e.clientY
    const dx = e.clientX - this.pointer.x0
    const dy = e.clientY - this.pointer.y0
    if (!this.pointer.moved && Math.hypot(dx, dy) > 9) {
      this.pointer.moved = true
      if (this.dragSheet) {
        this.dragActive = true
        this.canvas.classList.add('dragging')
        this.dragSheet.anim = null
        this.dragSheet.dragging = true
        this._notifyDragStart = true
      }
    }
    if (this.dragActive && this.dragSheet) {
      const loc = this._localFromEvent(e)
      if (!loc) return
      const s = this.dragSheet
      const prev = s.t
      const nt = Math.acos(Math.max(-1, Math.min(1, loc.x / s.w))) / Math.PI
      s.lagSign = nt >= prev ? 1 : -1
      s.t = nt
      s.vel = s.vel * 0.6 + (nt - prev) * 0.4
      this._deform(s)
      this._place(s)
    }
  }

  _onUp(e, cancelled = false) {
    if (this.pinch) {
      if (this.pinch.ids.includes(e.pointerId)) this.pinch = null
      this.pointer = null
      return
    }
    if (!this.pointer || e.pointerId !== this.pointer.id) return
    const p = this.pointer
    this.pointer = null
    this.canvas.classList.remove('dragging')
    const dt = performance.now() - p.t0
    const dx = e.clientX - p.x0
    const dy = e.clientY - p.y0

    if (this.dragActive && this.dragSheet) {
      // Fin de glisser-coin : on termine ou on annule.
      const s = this.dragSheet
      s.dragging = false
      const goForward = cancelled ? s.target === 1
        : s.t > 0.5 || s.vel > 0.02 ? true
        : s.t <= 0.5 && s.vel < -0.02 ? false
        : s.t > 0.5
      const to = goForward ? 1 : 0
      const wasTurned = s.target === 1
      const dur = 0.45 + 0.4 * Math.abs(to - s.t)
      this._animate(s, to, dur)
      if ((to === 1) !== wasTurned) this._notifyTurn(to === 1 ? 1 : -1, s)
      else this.on.change && this.on.change(this.turned)
      this.dragSheet = null
      this.dragActive = false
      return
    }
    this.dragSheet = null

    if (cancelled) return

    // Swipe
    if (p.moved && dt < 650 && Math.abs(dx) > 42 && Math.abs(dx) > Math.abs(dy) * 1.4) {
      if (this.zoom) this.on.zoomNav && this.on.zoomNav(dx < 0 ? 1 : -1)
      else dx < 0 ? this.next() : this.prev()
      return
    }
    if (p.moved) return

    // Tap / double tap
    const now = performance.now()
    if (this.lastTap && now - this.lastTap.t < 320 &&
        Math.hypot(e.clientX - this.lastTap.x, e.clientY - this.lastTap.y) < 44) {
      clearTimeout(this.lastTap.timer)
      this.lastTap = null
      const side = this.zoom ? this.zoom.side : p.loc0.x >= 0 ? 'right' : 'left'
      this.on.doubleTap && this.on.doubleTap(side)
      return
    }
    const loc = p.loc0
    const timer = setTimeout(() => {
      this.lastTap = null
      if (this.zoom) {
        // En mode zoom : tap SUR la page → netteté maximale (pleine
        // résolution) ; tap à côté → retour au livre.
        const s = this.zoom.side
        const onPage = (s === 'right'
          ? loc.x > -0.03 && loc.x < PW + 0.03
          : loc.x < 0.03 && loc.x > -PW - 0.03) &&
          Math.abs(loc.y) < PH / 2 + 0.04
        if (onPage) this.on.doubleTap && this.on.doubleTap(s)
        else this.zoomExit()
        return
      }
      const side = loc.x >= 0.05 ? 'right' : loc.x <= -0.05 ? 'left' : null
      if (!side) return
      if (this._isGuidePage(side)) {
        // Une vraie page du guide : on vient la voir de près.
        this.zoomTo(side)
      } else {
        // Couverture, garde, page « Merci »… : on tourne.
        side === 'right' ? this.next() : this.prev()
      }
    }, 300)
    this.lastTap = { t: now, x: e.clientX, y: e.clientY, timer }
  }

  _cancelDrag() {
    if (this.dragActive && this.dragSheet) {
      const s = this.dragSheet
      s.dragging = false
      this._animate(s, s.target, 0.4)
    }
    this.dragSheet = null
    this.dragActive = false
    this.canvas.classList.remove('dragging')
  }

  setParallax(nx, ny) {
    this.parallax.tx = nx
    this.parallax.ty = ny
  }

  // ————— Boucle —————

  _resize() {
    const w = this.canvas.clientWidth || window.innerWidth
    const h = this.canvas.clientHeight || window.innerHeight
    this.renderer.setSize(w, h, false)
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
    this._updateFit()
  }

  _updateFit() {
    const closed = this.turned === 0 || this.turned === this.S
    const halfW = (closed ? 0.72 : 1.14) + 0.06
    const appH = (PH / 2) * Math.sin(this.camEl) + 0.28
    const vHalf = Math.tan((this.camera.fov * Math.PI) / 360)
    const hHalf = vHalf * this.camera.aspect
    // + PH/2 : le bord bas du livre est plus proche de la caméra (perspective),
    // c'est lui qui doit tenir dans le cadre.
    const d = Math.max(halfW / hHalf, appH / vHalf) + 0.9
    this.fitDist = d
  }

  _zoomFitDist() {
    // Distance pour qu'une page seule remplisse le cadre, vue de dessus.
    const halfW = (PW / 2) * 1.1
    const halfH = (PH / 2) * Math.sin(this.zoomEl) * 1.07
    const vHalf = Math.tan((this.camera.fov * Math.PI) / 360)
    const hHalf = vHalf * this.camera.aspect
    return Math.max(halfW / hHalf, halfH / vHalf) + 0.12
  }

  // ————— Zoom page (la caméra vient au-dessus de la page) —————

  zoomTo(side) {
    this.zoom = { side }
    this._cancelDrag()
    this.on.zoom && this.on.zoom(side)
  }

  zoomExit() {
    if (!this.zoom) return
    this.zoom = null
    this.on.zoom && this.on.zoom(null)
  }

  // Face affichée d'un côté du livre ouvert (index dans le tableau des faces).
  _faceIndex(side) {
    const T = this.turned
    return side === 'right' ? (T < this.S ? 2 * T : -1) : (T > 0 ? 2 * T - 1 : -1)
  }

  // Faces zoomables : la garde (mention de compatibilité) et les pages.
  _isGuidePage(side) {
    const i = this._faceIndex(side)
    return i >= 1 && i <= this.nPages + 1
  }

  _frame() {
    const rawDt = Math.min(this.clock.getDelta(), 0.5)
    const dt = Math.min(rawDt, 0.05)
    // Amortissement indépendant du framerate (converge en temps réel,
    // même si l'appareil ne tient pas 60 fps).
    const damp = (rate) => 1 - Math.exp(-rate * rawDt)
    const now = performance.now() / 1000

    // Tweens de feuilles
    for (const s of this.sheets) {
      if (s.anim) {
        const a = s.anim
        if (a.start < 0) a.start = now + a.delay
        const raw = (now - a.start) / a.dur
        if (raw >= 1) {
          s.t = a.to
          s.anim = null
        } else if (raw > 0) {
          s.t = a.from + (a.to - a.from) * EASE(raw)
        }
        this._deform(s)
        this._place(s)
      }
    }

    // Recentrage : livre fermé → couverture au centre.
    const T = this.turned
    const anyAnim = this.sheets.some((s) => s.anim || s.dragging)
    const targetX = T === 0 ? -PW / 2 : T === this.S ? PW / 2 : 0
    this.flatX += (targetX - this.flatX) * damp(3.2)
    this.flat.position.x = this.flatX

    // Blocs de tranche (piles de pages restantes)
    const eff = this.sheets.reduce((a, s) => a + s.t, 0)
    const nR = this.S - eff
    const nL = eff
    const hR = Math.max(0, nR - 1) * TH
    const hL = Math.max(0, nL - 1) * TH
    this.blockR.visible = hR > 0.004
    this.blockL.visible = hL > 0.004
    this.blockR.scale.z = Math.max(hR, 0.001)
    this.blockL.scale.z = Math.max(hL, 0.001)
    this.spine.scale.z = Math.max(hR, hL, TH * 0.5)

    // Lumière : montée en intensité à l'ouverture
    const ramp = this.lightRamp
    this.key.intensity = 0.55 + 2.35 * ramp
    this.hemi.intensity = 0.22 + 0.34 * ramp
    this.fill.intensity = 0.12 + 0.24 * ramp
    this.rim.intensity = 1.4 + 2.4 * ramp
    this.glow.material.opacity = 0.25 + 0.3 * ramp

    // Respiration + parallaxe
    if (!this.reduced) {
      this.tilt.rotation.y = Math.sin(now * 0.32) * 0.014 + (this.opened ? 0 : 0.16)
      this.tilt.position.y = Math.sin(now * 0.55) * 0.007
      this.parallax.x += (this.parallax.tx - this.parallax.x) * damp(2.5)
      this.parallax.y += (this.parallax.ty - this.parallax.y) * damp(2.5)
      this.rig.rotation.y = -this.parallax.x * 0.055
      this.rig.rotation.x = this.parallax.y * 0.03
      if (this.particles) {
        const pos = this.particles.geometry.attributes.position
        for (let i = 0; i < this.partSpeed.length; i++) {
          let y = pos.getY(i) + this.partSpeed[i] * dt
          if (y > 2.7) y = 0
          pos.setY(i, y)
        }
        pos.needsUpdate = true
      }
    } else {
      this.tilt.rotation.y = this.opened ? 0 : 0.16
    }

    // Caméra : vue lecture ou survol d'une page zoomée.
    this._updateFit()
    const goal = this.zoom
      ? {
          el: this.zoomEl,
          dist: this._zoomFitDist(),
          tx: this.flatX + (this.zoom.side === 'right' ? 1 : -1) * (PW / 2),
          ty: this.flat.position.y,
          tz: 0
        }
      : { el: this.camEl, dist: this.fitDist, tx: 0, ty: 0.02, tz: -0.14 }
    const ck = this.reduced ? 1 : damp(2.6)
    const c = this.cam
    c.el += (goal.el - c.el) * ck
    c.dist += (goal.dist - c.dist) * ck
    c.tx += (goal.tx - c.tx) * ck
    c.ty += (goal.ty - c.ty) * ck
    c.tz += (goal.tz - c.tz) * ck
    this.camera.position.set(
      c.tx,
      c.ty + c.dist * Math.sin(c.el),
      c.tz + c.dist * Math.cos(c.el)
    )
    this.camera.lookAt(c.tx, c.ty, c.tz)

    this.renderer.render(this.scene, this.camera)
    void anyAnim
  }

  // Pause du rendu (vue pleine résolution ouverte, phase couverte du warp).
  pause() {
    this.renderer.setAnimationLoop(null)
  }

  renderOnce() {
    this._frame()
  }

  resume() {
    this.clock.getDelta() // purge le temps écoulé pendant la pause
    this.renderer.setAnimationLoop(() => this._frame())
  }

  dispose() {
    this.renderer.setAnimationLoop(null)
    window.removeEventListener('resize', this._onResize)
    for (const [el, ev, fn] of this._bound || []) el.removeEventListener(ev, fn)
    for (const s of this.sheets) s.geom.dispose()
    this.blockR.geometry.dispose()
    this.blockL.geometry.dispose()
    this.spine.geometry.dispose()
    if (this.particles) this.particles.geometry.dispose()
    if (this.ownRenderer) this.renderer.dispose()
  }
}

export { PW, PH }
