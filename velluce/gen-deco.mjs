// Objets 3D décoratifs Velluce pour les héros de pages (F.A.Q, Notre
// promesse, Notre histoire). Style commun : laiton doré, céramique crème,
// verre chaud — assorti à l'ampoule G125 de la page Contact.
// Usage : node velluce/gen-deco.mjs → velluce/models/deco-*.glb

globalThis.FileReader = class {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((b) => { this.result = b; this.onloadend && this.onloadend() })
  }
  readAsDataURL(blob) {
    blob.arrayBuffer().then((b) => {
      this.result = 'data:application/octet-stream;base64,' + Buffer.from(b).toString('base64')
      this.onloadend && this.onloadend()
    })
  }
}

import * as THREE from 'three'
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const OUT = join(dirname(fileURLToPath(import.meta.url)), 'models')
mkdirSync(OUT, { recursive: true })

const laiton = () => new THREE.MeshStandardMaterial({ color: 0xcfa14a, metalness: 1, roughness: 0.26 })
const ceramique = () => new THREE.MeshPhysicalMaterial({
  color: 0xf6efe4, metalness: 0, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.12
})
const encre = () => new THREE.MeshPhysicalMaterial({
  color: 0x2b2620, metalness: 0.15, roughness: 0.35, clearcoat: 0.7, clearcoatRoughness: 0.2
})

function roundedRect(w, h, r) {
  const s = new THREE.Shape()
  const x = -w / 2, y = -h / 2
  s.moveTo(x + r, y)
  s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r)
  s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r)
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y)
  return s
}

// ————— F.A.Q : deux bulles de dialogue (céramique crème + laiton) —————
function bullesFaq() {
  const g = new THREE.Group()
  const opts = { depth: 0.03, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.006, bevelSegments: 5, curveSegments: 24 }

  const big = new THREE.Group()
  const bShape = roundedRect(0.155, 0.105, 0.034)
  const bMesh = new THREE.Mesh(new THREE.ExtrudeGeometry(bShape, opts), ceramique())
  big.add(bMesh)
  const tail = new THREE.Shape()
  tail.moveTo(-0.045, -0.05); tail.lineTo(-0.012, -0.05); tail.lineTo(-0.05, -0.085); tail.closePath()
  const tMesh = new THREE.Mesh(new THREE.ExtrudeGeometry(tail, { ...opts, depth: 0.022, bevelThickness: 0.004, bevelSize: 0.004 }), ceramique())
  tMesh.position.z = 0.004
  big.add(tMesh)
  for (let i = 0; i < 3; i++) { // points de suspension
    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.0085, 24, 16), encre())
    dot.position.set(-0.032 + i * 0.032, 0, 0.0395)
    dot.scale.z = 0.55
    big.add(dot)
  }
  big.rotation.z = 0.06
  big.position.set(-0.012, -0.01, 0)
  g.add(big)

  const small = new THREE.Group()
  const sShape = roundedRect(0.085, 0.06, 0.02)
  small.add(new THREE.Mesh(new THREE.ExtrudeGeometry(sShape, { ...opts, depth: 0.02, bevelThickness: 0.004, bevelSize: 0.004 }), laiton()))
  const sTail = new THREE.Shape()
  sTail.moveTo(0.012, -0.028); sTail.lineTo(0.032, -0.028); sTail.lineTo(0.034, -0.05); sTail.closePath()
  const stM = new THREE.Mesh(new THREE.ExtrudeGeometry(sTail, { ...opts, depth: 0.014, bevelThickness: 0.003, bevelSize: 0.003 }), laiton())
  stM.position.z = 0.003
  small.add(stM)
  // « ? » : un seul trait continu (arc + descente + jambage), puis le point
  const qMat = laiton().clone()
  qMat.color.set(0xf6efe4); qMat.metalness = 0; qMat.roughness = 0.25
  const R = 0.0092
  const d2r = (deg) => (deg * Math.PI) / 180
  const onArc = (deg, y0 = 0.004) =>
    new THREE.Vector3(R * Math.cos(d2r(deg)), y0 + R * Math.sin(d2r(deg)), 0)
  const trace = [
    onArc(212), onArc(180), onArc(140), onArc(100), onArc(60), onArc(20), onArc(-26),
    new THREE.Vector3(0.0042, -0.0075, 0),
    new THREE.Vector3(0.0004, -0.0108, 0),
    new THREE.Vector3(0, -0.0142, 0)
  ]
  const qCurve = new THREE.CatmullRomCurve3(trace, false, 'catmullrom', 0.4)
  const qTube = new THREE.Mesh(new THREE.TubeGeometry(qCurve, 90, 0.0033, 10, false), qMat)
  qTube.position.z = 0.0295
  small.add(qTube)
  const qd = new THREE.Mesh(new THREE.SphereGeometry(0.0041, 18, 14), qMat)
  qd.position.set(0, -0.0208, 0.0295); qd.scale.z = 0.62
  small.add(qd)

  small.rotation.z = -0.1
  small.position.set(0.082, 0.072, 0.035)
  g.add(small)

  g.rotation.x = -0.06
  return g
}

// ————— Notre promesse : bouclier laiton, plastron sombre, coche dorée —————
function bouclierPromesse() {
  const g = new THREE.Group()
  function shieldShape(k) {
    const w = 0.085 * k, top = 0.1 * k, bot = -0.115 * k
    const s = new THREE.Shape()
    s.moveTo(-w, top)
    s.quadraticCurveTo(0, top + 0.018 * k, w, top)
    s.quadraticCurveTo(w + 0.006 * k, 0.02 * k, 0.052 * k, -0.045 * k)
    s.quadraticCurveTo(0.022 * k, -0.085 * k, 0, bot)
    s.quadraticCurveTo(-0.022 * k, -0.085 * k, -0.052 * k, -0.045 * k)
    s.quadraticCurveTo(-w - 0.006 * k, 0.02 * k, -w, top)
    return s
  }
  const back = new THREE.Mesh(new THREE.ExtrudeGeometry(shieldShape(1), {
    depth: 0.02, bevelEnabled: true, bevelThickness: 0.007, bevelSize: 0.007, bevelSegments: 6, curveSegments: 28
  }), laiton())
  g.add(back)
  const front = new THREE.Mesh(new THREE.ExtrudeGeometry(shieldShape(0.8), {
    depth: 0.006, bevelEnabled: true, bevelThickness: 0.003, bevelSize: 0.003, bevelSegments: 4, curveSegments: 28
  }), encre())
  front.position.set(0, -0.002, 0.027)
  g.add(front)
  const tick = new THREE.Shape()
  tick.moveTo(-0.041, 0.002)
  tick.lineTo(-0.016, -0.026)
  tick.lineTo(0.039, 0.041)
  tick.lineTo(0.024, 0.054)
  tick.lineTo(-0.016, 0.001)
  tick.lineTo(-0.028, 0.014)
  tick.closePath()
  const tickM = new THREE.Mesh(new THREE.ExtrudeGeometry(tick, {
    depth: 0.007, bevelEnabled: true, bevelThickness: 0.0025, bevelSize: 0.0025, bevelSegments: 4
  }), laiton())
  tickM.position.set(0, -0.014, 0.034)
  g.add(tickM)
  g.rotation.x = -0.04
  return g
}

// ————— Notre histoire : ampoule Edison ST64, filament cage d'écureuil —————
// L'ampoule qui a tout commencé : verre ambré soufflé, filament en cage
// visible, culot laiton à spires. Symbole de la première lumière.
function edisonHistoire() {
  const g = new THREE.Group()

  // Poire ST64 : col 1,35 cm → ventre 3,2 cm → dôme arrondi
  const P = [
    [0.0136, 0], [0.0140, 0.006], [0.0152, 0.014], [0.0189, 0.026],
    [0.0243, 0.042], [0.0288, 0.060], [0.0313, 0.078], [0.0320, 0.096],
    [0.0308, 0.113], [0.0272, 0.128], [0.0215, 0.140], [0.0140, 0.1475],
    [0.0062, 0.1515], [0.0001, 0.1525]
  ]
  const prof = P.map(([x, y]) => new THREE.Vector2(x, y))
  const verre = new THREE.MeshPhysicalMaterial({
    color: 0xfff4e0, metalness: 0, roughness: 0.02,
    transmission: 0.96, ior: 1.52, thickness: 0.0022,
    attenuationColor: new THREE.Color(0xf0cf92), attenuationDistance: 0.16,
    clearcoat: 1, clearcoatRoughness: 0.02,
    transparent: true, opacity: 0.96, side: THREE.DoubleSide
  })
  verre.name = 'verre'
  const glass = new THREE.Mesh(new THREE.LatheGeometry(prof, 96), verre)
  g.add(glass)

  // Filament chauffé à blanc au cœur, ambre sur les bords
  const filMat = new THREE.MeshStandardMaterial({
    color: 0xffd79a, emissive: 0xffa838, emissiveIntensity: 9,
    metalness: 0, roughness: 0.5
  })
  filMat.name = 'filament'

  // Cage d'écureuil : 8 brins verticaux légèrement bombés entre deux couronnes
  const yBas = 0.058, yHaut = 0.121, rCage = 0.0126
  const BRINS = 8
  for (let i = 0; i < BRINS; i++) {
    const a = (i / BRINS) * Math.PI * 2
    const pts = []
    for (let j = 0; j <= 22; j++) {
      const t = j / 22
      // léger renflement au milieu, comme un vrai filament tendu
      const r = rCage * (0.82 + 0.18 * Math.sin(t * Math.PI))
      const tw = a + t * 0.32 // vrille douce
      pts.push(new THREE.Vector3(Math.cos(tw) * r, yBas + t * (yHaut - yBas), Math.sin(tw) * r))
    }
    const brin = new THREE.CatmullRomCurve3(pts)
    g.add(new THREE.Mesh(new THREE.TubeGeometry(brin, 44, 0.00085, 7, false), filMat))
  }
  // Couronnes haute et basse qui tiennent la cage
  ;[yBas, yHaut].forEach((y) => {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(rCage * 0.86, 0.00075, 8, 44), filMat)
    ring.rotation.x = Math.PI / 2
    ring.position.y = y
    g.add(ring)
  })

  // Tige de verre centrale + petite coupelle
  const depoli = new THREE.MeshPhysicalMaterial({
    color: 0xf7f1e6, metalness: 0, roughness: 0.42,
    transmission: 0.55, ior: 1.46, transparent: true, opacity: 0.88
  })
  const tige = new THREE.Mesh(new THREE.CylinderGeometry(0.0028, 0.0044, 0.062, 20), depoli)
  tige.position.y = 0.031
  g.add(tige)
  const coupelle = new THREE.Mesh(new THREE.SphereGeometry(0.0082, 24, 16), depoli)
  coupelle.position.y = 0.059
  coupelle.scale.y = 0.5
  g.add(coupelle)
  // Tige centrale qui rejoint le haut de la cage
  const axe = new THREE.Mesh(new THREE.CylinderGeometry(0.0016, 0.0016, 0.066, 14), depoli)
  axe.position.y = 0.09
  g.add(axe)

  // Fils d'amenée en métal sombre
  const fil = new THREE.MeshStandardMaterial({ color: 0x6f6555, metalness: 0.9, roughness: 0.42 })
  ;[-1, 1].forEach((sgn) => {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.0006, 0.0006, 0.014, 8), fil)
    w.position.set(sgn * rCage * 0.86, yBas - 0.006, 0)
    g.add(w)
  })

  // Culot E27 laiton vieilli, spires hélicoïdales réelles
  const brass = new THREE.MeshStandardMaterial({ color: 0xb8893c, metalness: 1, roughness: 0.34 })
  brass.name = 'laiton'
  const collerette = new THREE.Mesh(new THREE.CylinderGeometry(0.0138, 0.0132, 0.0085, 40), brass)
  collerette.position.y = -0.0035
  g.add(collerette)
  const spire = []
  for (let i = 0; i <= 190; i++) {
    const t = i / 190
    const a = t * Math.PI * 2 * 3.6
    spire.push(new THREE.Vector3(Math.cos(a) * 0.0129, -0.010 - t * 0.019, Math.sin(a) * 0.0129))
  }
  g.add(new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3(spire), 260, 0.0018, 9, false), brass))
  const jupe = new THREE.Mesh(new THREE.CylinderGeometry(0.0122, 0.0088, 0.0075, 36), brass)
  jupe.position.y = -0.0335
  g.add(jupe)
  const isolant = new THREE.Mesh(new THREE.CylinderGeometry(0.0086, 0.0062, 0.005, 24),
    new THREE.MeshStandardMaterial({ color: 0x17130e, metalness: 0.08, roughness: 0.75 }))
  isolant.position.y = -0.0396
  g.add(isolant)
  const plot = new THREE.Mesh(new THREE.SphereGeometry(0.0052, 20, 14), brass)
  plot.position.y = -0.0428
  plot.scale.y = 0.62
  g.add(plot)

  g.position.y = -0.058 // centre visuel sur le ventre de la poire
  const root = new THREE.Group()
  root.add(g)
  return root
}

// ————— Espace pro : trio de suspensions sur rail laiton —————
// Ce qu'on installe dans un restaurant, un hall d'hôtel, une boutique :
// plusieurs points lumineux alignés. Le symbole du projet, pas de l'objet.
function trioPro() {
  const g = new THREE.Group()
  const brass = new THREE.MeshStandardMaterial({ color: 0xc79a45, metalness: 1, roughness: 0.24 })
  brass.name = 'laiton'
  const verre = new THREE.MeshPhysicalMaterial({
    color: 0xfff3dd, metalness: 0, roughness: 0.03,
    transmission: 0.95, ior: 1.5, thickness: 0.003,
    attenuationColor: new THREE.Color(0xf2d9a6), attenuationDistance: 0.2,
    clearcoat: 1, clearcoatRoughness: 0.03,
    transparent: true, opacity: 0.95, side: THREE.DoubleSide
  })
  verre.name = 'verre'
  const feu = new THREE.MeshStandardMaterial({
    color: 0xffd79a, emissive: 0xffab45, emissiveIntensity: 8, metalness: 0, roughness: 0.5
  })
  feu.name = 'filament'

  // Rail de fixation
  const rail = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.012, 0.026), brass)
  rail.position.y = 0.115
  g.add(rail)
  ;[-0.11, 0.11].forEach((x) => {
    const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.016, 16), brass)
    pin.position.set(x, 0.124, 0)
    g.add(pin)
  })

  // Trois globes en cascade, hauteurs décalées
  const POS = [
    { x: -0.093, drop: 0.072, r: 0.0335 },
    { x: 0, drop: 0.116, r: 0.0405 },
    { x: 0.093, drop: 0.058, r: 0.0305 }
  ]
  POS.forEach(({ x, drop, r }) => {
    const yGlobe = 0.109 - drop - r
    const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.0011, 0.0011, drop, 8), brass)
    cable.position.set(x, 0.109 - drop / 2, 0)
    g.add(cable)
    const douille = new THREE.Mesh(new THREE.CylinderGeometry(0.0072, 0.0088, 0.019, 24), brass)
    douille.position.set(x, yGlobe + r * 0.82, 0)
    g.add(douille)
    const globe = new THREE.Mesh(new THREE.SphereGeometry(r, 48, 36), verre)
    globe.position.set(x, yGlobe, 0)
    g.add(globe)
    // filament court en anneau, visible dans le verre
    const fil = new THREE.Mesh(new THREE.TorusGeometry(r * 0.3, 0.0011, 8, 32), feu)
    fil.rotation.x = Math.PI / 2.6
    fil.position.set(x, yGlobe + r * 0.12, 0)
    g.add(fil)
    const tige = new THREE.Mesh(new THREE.CylinderGeometry(0.0013, 0.0013, r * 0.7, 10), feu)
    tige.position.set(x, yGlobe + r * 0.44, 0)
    g.add(tige)
  })

  g.position.y = -0.02
  const root = new THREE.Group()
  root.add(g)
  return root
}

const FILES = {
  'deco-bulles-faq': bullesFaq,
  'deco-bouclier-promesse': bouclierPromesse,
  'deco-edison-histoire': edisonHistoire,
  'deco-trio-pro': trioPro
}

const exporter = new GLTFExporter()
for (const [name, build] of Object.entries(FILES)) {
  const scene = new THREE.Scene()
  const model = build()
  model.name = name
  scene.add(model)
  await new Promise((res, rej) => {
    exporter.parse(scene, (buf) => {
      writeFileSync(join(OUT, name + '.glb'), Buffer.from(buf))
      console.log(`✓ ${name}.glb (${Math.round(Buffer.from(buf).length / 1024)} Ko)`)
      res()
    }, rej, { binary: true })
  })
}
console.log('Terminé.')
