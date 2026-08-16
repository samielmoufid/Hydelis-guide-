// Velluce — générateur de modèles 3D GLB des luminaires (v2).
// Fidèle aux photos produits, dimensions des fiches, échelle en mètres.
// Chaque modèle intègre sa hauteur de pose complète : le pavillon est à
// MOUNT (2,40 m) et l'objet s'ancre AU SOL en RA → il apparaît suspendu
// à hauteur réelle, comme fixé au plafond (l'ancrage plafond n'existe pas
// dans Quick Look / Scene Viewer).
// Usage : node velluce/gen-models.mjs  → velluce/models/<handle>.glb

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
import { mkdirSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const OUT = join(dirname(fileURLToPath(import.meta.url)), 'models')
mkdirSync(OUT, { recursive: true })

const MOUNT = 2.4 // hauteur de pose simulée (pavillon au « plafond »)

// ————— Matériaux (fidèles aux photos : noir MAT profond) —————
const M = {
  noir: () => new THREE.MeshStandardMaterial({ color: 0x0a0a0a, metalness: 0.2, roughness: 0.55 }),
  blanc: () => new THREE.MeshStandardMaterial({ color: 0xf6f6f3, metalness: 0.15, roughness: 0.5 }),
  chrome: () => new THREE.MeshStandardMaterial({ color: 0xd8d8dc, metalness: 0.95, roughness: 0.15 }),
  beton: () => new THREE.MeshStandardMaterial({ color: 0x5f5f5b, metalness: 0.0, roughness: 0.97 }),
  beige: () => new THREE.MeshStandardMaterial({ color: 0xdccfba, metalness: 0.0, roughness: 0.9, side: THREE.DoubleSide }),
  orMelt: () => new THREE.MeshPhysicalMaterial({ color: 0xd9b258, metalness: 1.0, roughness: 0.07, clearcoat: 0.6, clearcoatRoughness: 0.15 }),
  laiton: () => new THREE.MeshStandardMaterial({ color: 0xcfa14a, metalness: 0.92, roughness: 0.2 }),
  cableNoir: () => new THREE.MeshStandardMaterial({ color: 0x0d0d0d, metalness: 0.1, roughness: 0.65 }),
  cableAcier: () => new THREE.MeshStandardMaterial({ color: 0xc9c9cc, metalness: 0.85, roughness: 0.35 }),
  // Sources lumineuses : émissif fort (KHR_materials_emissive_strength)
  lentille: () => new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff0d2, emissiveIntensity: 6, roughness: 0.25 }),
  opale: () => new THREE.MeshStandardMaterial({ color: 0xfffaf0, emissive: 0xfff3da, emissiveIntensity: 4.5, roughness: 0.35 })
}

const cyl = (rT, rB, h, mat, seg = 40) => new THREE.Mesh(new THREE.CylinderGeometry(rT, rB, h, seg), mat)
const sph = (r, mat, seg = 40) => new THREE.Mesh(new THREE.SphereGeometry(r, seg, Math.round(seg * 0.7)), mat)
const box = (w, h, d, mat) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat)

function cable(x, z, yTop, yBot, mat, r = 0.0016) {
  const c = cyl(r, r, yTop - yBot, mat, 10)
  c.position.set(x, (yTop + yBot) / 2, z)
  return c
}

// Ancre de sol invisible : la RA (Quick Look / Scene Viewer) pose la BOÎTE
// ENGLOBANTE de l'objet au sol. Sans géométrie à y=0, le luminaire
// retomberait par terre (et un plafonnier se poserait tête-bêche). Ce point
// transparent au sol force le respect de toute la hauteur de pose.
function floorAnchor() {
  const m = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0 })
  const dot = new THREE.Mesh(new THREE.CircleGeometry(0.006, 8), m)
  dot.rotation.x = -Math.PI / 2
  dot.position.y = 0.0005
  return dot
}

// ————— Plafonnier barre plate + spots cylindriques (Arvella / Virelia / Orphéane) —————
// Photo : barre très fine plaquée au plafond, petits spots suspendus sous
// la barre par une tige courte, inclinaisons variées.
function railSpotsCylindres({ L, n, couleur }) {
  const g = new THREE.Group()
  const mat = couleur === 'blanc' ? M.blanc() : M.noir()
  const bar = box(L, 0.018, 0.05, mat)
  bar.position.y = MOUNT - 0.009
  g.add(bar)
  for (let i = 0; i < n; i++) {
    const x = -L / 2 + 0.09 + (i * (L - 0.18)) / (n - 1)
    const pin = cyl(0.005, 0.005, 0.03, mat, 12)
    pin.position.set(x, MOUNT - 0.033, 0)
    g.add(pin)
    const head = new THREE.Group()
    const body = cyl(0.0275, 0.0275, 0.1, mat, 32)
    head.add(body)
    const lens = cyl(0.022, 0.022, 0.005, M.lentille(), 24)
    lens.position.y = -0.052
    head.add(lens)
    head.position.set(x, MOUNT - 0.1, 0)
    head.rotation.z = (i % 2 ? 1 : -1) * 0.42
    head.rotation.y = (i % 3) * 0.7
    g.add(head)
  }
  return g
}

// ————— Plafonnier spots CARRÉS (Nerava, photo : boîtes inclinées) —————
function railSpotsCarres({ L, n }) {
  // Photo Nerava : barre plate 30 × 6 cm collée au plafond, spots carrés
  // (~6 × 6 × 10 cm) accrochés près des extrémités par un court pivot,
  // basculés vers l'EXTÉRIEUR en sens opposés, lentille ronde au bout du
  // corps, petite manette de réglage côté intérieur.
  const g = new THREE.Group()
  const mat = M.noir()
  const bar = box(L, 0.025, 0.06, mat)
  bar.position.y = MOUNT - 0.0125
  g.add(bar)
  for (let i = 0; i < n; i++) {
    const x = n === 1 ? 0 : -L / 2 + 0.045 + (i * (L - 0.09)) / (n - 1)
    const out = x >= 0 ? 1 : -1
    const pin = cyl(0.007, 0.007, 0.03, mat, 12)
    pin.position.set(x, MOUNT - 0.025 - 0.015, 0)
    g.add(pin)
    const head = new THREE.Group()
    const body = box(0.062, 0.1, 0.062, mat)
    body.position.y = -0.05
    head.add(body)
    const lens = cyl(0.024, 0.024, 0.004, M.lentille(), 28)
    lens.position.set(0, -0.101, 0)
    head.add(lens)
    // manette de réglage, côté intérieur, vers le haut du corps
    const lever = cyl(0.0032, 0.0032, 0.034, mat, 10)
    lever.rotation.z = Math.PI / 2
    lever.position.set(-out * 0.045, -0.022, 0)
    head.add(lever)
    // pivot au bas du pin, bascule vers l'extérieur (sens opposés)
    head.position.set(x, MOUNT - 0.055, 0)
    head.rotation.z = out * 0.62
    g.add(head)
  }
  return g
}

// ————— Suspensions tubes égaux sur câbles acier (Arothis / Neralis) —————
// Photo : pavillon barre plate au plafond, tubes identiques, œillets chromés.
function suspensionTubes({ railL, n, tubeL, tubeR, drop }) {
  const g = new THREE.Group()
  const mat = M.noir()
  const bar = railL > 0 ? box(railL, 0.02, 0.055, mat) : cyl(0.04, 0.038, 0.025, mat)
  bar.position.y = MOUNT - (railL > 0 ? 0.01 : 0.0125)
  g.add(bar)
  const bottom = MOUNT - drop
  for (let i = 0; i < n; i++) {
    const x = n === 1 ? 0 : -((railL - 0.12) / 2) + (i * (railL - 0.12)) / (n - 1)
    const grommet = cyl(0.006, 0.006, 0.012, M.chrome(), 12)
    grommet.position.set(x, MOUNT - 0.026, 0)
    g.add(grommet)
    g.add(cable(x, 0, MOUNT - 0.03, bottom + tubeL, M.cableAcier()))
    const tube = cyl(tubeR, tubeR, tubeL, mat)
    tube.position.set(x, bottom + tubeL / 2, 0)
    g.add(tube)
    const lens = cyl(tubeR * 0.8, tubeR * 0.8, 0.005, M.lentille(), 24)
    lens.position.set(x, bottom + 0.0025, 0)
    g.add(lens)
  }
  return g
}

// ————— Suspension béton entonnoir (Arkemia, photo : col fin → cône) —————
function suspensionBeton() {
  const g = new THREE.Group()
  const drop = 1.32
  const bodyH = 0.3
  const bottom = MOUNT - drop
  // Profil au tour : col cylindrique fin s'évasant en cône Ø17.
  const pts = []
  const R = (t) => {
    if (t < 0.4) return 0.024 + t * 0.01 // col
    const k = (t - 0.4) / 0.6
    return 0.028 + (0.085 - 0.028) * Math.pow(k, 1.15) // cône plein et doux
  }
  for (let s = 0; s <= 24; s++) {
    const t = 1 - s / 24 // du haut vers le bas
    pts.push(new THREE.Vector2(R(t), bottom + t * bodyH))
  }
  const lathe = new THREE.Mesh(new THREE.LatheGeometry(pts, 48), M.beton())
  lathe.material.side = THREE.DoubleSide
  g.add(lathe)
  const lens = cyl(0.07, 0.07, 0.006, M.lentille(), 40)
  lens.position.y = bottom + 0.004
  g.add(lens)
  const canopy = cyl(0.042, 0.04, 0.022, M.noir())
  canopy.position.y = MOUNT - 0.011
  g.add(canopy)
  g.add(cable(0, 0, MOUNT - 0.022, bottom + bodyH - 0.005, M.cableNoir(), 0.0028))
  return g
}

// ————— Lustre sputnik asymétrique (Neravio, photo : globes opales) —————
function lustreSputnik() {
  const g = new THREE.Group()
  const mat = M.noir()
  const canopy = cyl(0.05, 0.048, 0.022, mat)
  canopy.position.y = MOUNT - 0.011
  g.add(canopy)
  const hubTop = MOUNT - 0.022
  const hubY = MOUNT - 0.42 // centre du corps
  const rod = cyl(0.009, 0.009, hubTop - (hubY + 0.09), mat, 16)
  rod.position.y = (hubTop + hubY + 0.09) / 2
  g.add(rod)
  const hub = cyl(0.028, 0.028, 0.18, mat, 32)
  hub.position.y = hubY
  g.add(hub)
  // 6 bras à hauteurs et inclinaisons variées (asymétrie de la photo)
  const arms = [
    { a: 0.2, dy: 0.06, tilt: 0.28, len: 0.30 },
    { a: 1.25, dy: 0.02, tilt: -0.1, len: 0.27 },
    { a: 2.3, dy: -0.04, tilt: 0.12, len: 0.30 },
    { a: 3.35, dy: 0.05, tilt: -0.25, len: 0.24 },
    { a: 4.4, dy: -0.06, tilt: -0.05, len: 0.29 },
    { a: 5.45, dy: 0.0, tilt: 0.2, len: 0.26 }
  ]
  for (const { a, dy, tilt, len } of arms) {
    const dir = new THREE.Vector3(Math.cos(a), Math.sin(tilt), Math.sin(a)).normalize()
    const start = new THREE.Vector3(0, hubY + dy, 0)
    const end = start.clone().addScaledVector(dir, len)
    const arm = cyl(0.007, 0.007, len, mat, 12)
    arm.position.copy(start.clone().add(end).multiplyScalar(0.5))
    arm.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir)
    g.add(arm)
    const socket = cyl(0.016, 0.016, 0.045, mat, 24)
    socket.position.copy(end.clone().addScaledVector(dir, 0.02))
    socket.quaternion.copy(arm.quaternion)
    g.add(socket)
    const bulb = sph(0.045, M.opale(), 32)
    bulb.position.copy(end.clone().addScaledVector(dir, 0.085))
    g.add(bulb)
  }
  return g
}

// ————— Suspension « melt » dorée (photo : globe fondu réfléchissant) —————
function suspensionMelt({ d }) {
  const g = new THREE.Group()
  const r = d / 2
  const drop = 0.8
  const centerY = MOUNT - drop - r
  const geo = new THREE.SphereGeometry(r, 96, 64)
  const pos = geo.attributes.position
  const v = new THREE.Vector3()
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i)
    const n = v.clone().normalize()
    // Bosses organiques déterministes (style verre fondu)
    const w =
      0.16 * Math.sin(3.1 * n.x + 1.7) * Math.sin(2.6 * n.y - 0.6) +
      0.12 * Math.sin(4.3 * n.y + 2.2) * Math.sin(3.7 * n.z + 0.9) +
      0.09 * Math.sin(5.1 * n.z - 1.3) * Math.sin(2.9 * n.x + 2.8)
    const k = 1 + w * (1 - Math.abs(n.y) * 0.55) // pôles plus lisses
    pos.setXYZ(i, v.x * k, v.y * k, v.z * k)
  }
  geo.computeVertexNormals()
  const blob = new THREE.Mesh(geo, M.orMelt())
  blob.position.y = centerY
  g.add(blob)
  const collar = cyl(0.016, 0.022, 0.03, M.laiton(), 24)
  collar.position.y = centerY + r * 0.98
  g.add(collar)
  const stem = cyl(0.004, 0.004, 0.1, M.laiton(), 12)
  stem.position.y = centerY + r * 0.98 + 0.065
  g.add(stem)
  const canopy = cyl(0.038, 0.036, 0.022, M.laiton())
  canopy.position.y = MOUNT - 0.011
  g.add(canopy)
  g.add(cable(0, 0, MOUNT - 0.022, centerY + r * 0.98 + 0.11, M.cableAcier()))
  return g
}

// ————— Suspension wabi-sabi (photo : large chapeau plat à col central) —————
function suspensionWabi({ L, h }) {
  const g = new THREE.Group()
  const drop = 0.55 // pavillon → sommet du col
  const brimR = L / 2
  const topY = MOUNT - drop
  const bottomY = topY - h
  // Profil : bord fin, plateau très doux, montée en col arrondi au centre.
  const pts = []
  const N = 30
  for (let s = 0; s <= N; s++) {
    const t = s / N // 0 = bord, 1 = centre
    const r = brimR * (1 - t)
    // hauteur : quasi plat sur 70 %, puis montée douce vers le col
    const rise = t < 0.7 ? 0.12 * (t / 0.7) : 0.12 + 0.88 * Math.pow((t - 0.7) / 0.3, 1.7)
    pts.push(new THREE.Vector2(Math.max(r, 0.02), bottomY + rise * h))
  }
  pts.push(new THREE.Vector2(0.02, topY))
  const shade = new THREE.Mesh(new THREE.LatheGeometry(pts, 72), M.beige())
  g.add(shade)
  const bulb = sph(0.03, M.opale(), 24)
  bulb.position.y = bottomY + 0.06
  g.add(bulb)
  const canopy = cyl(0.04, 0.038, 0.022, M.noir())
  canopy.position.y = MOUNT - 0.011
  g.add(canopy)
  g.add(cable(0, 0, MOUNT - 0.022, topY - 0.005, M.cableNoir(), 0.0028))
  return g
}

// ————— Catalogue (dimensions des fiches produits) —————
const MODELS = {
  'plafonnier-blanc-moderne-6-spots-orientables-modele-arvella': () => railSpotsCylindres({ L: 1.18, n: 6, couleur: 'blanc' }),
  'plafonnier-noir-moderne-4-spots-orientables-modele-virelia': () => railSpotsCylindres({ L: 0.8, n: 4, couleur: 'noir' }),
  'plafonnier-moderne-acier-blanc-orientable-sejour-orpheane': () => railSpotsCylindres({ L: 0.8, n: 4, couleur: 'blanc' }),
  'plafonnier-spot-moderne-noir-orientable-modele-nerava': () => railSpotsCarres({ L: 0.3, n: 2 }),
  'suspension-cylindrique-noire-3-lumieres-modele-arothis': () => suspensionTubes({ railL: 0.45, n: 3, tubeL: 0.3, tubeR: 0.0275, drop: 0.9 }),
  'suspension-cylindrique-noire-moderne-modele-neralis': () => suspensionTubes({ railL: 0.3, n: 2, tubeL: 0.3, tubeR: 0.0275, drop: 0.9 }),
  'suspension-cylindre-acier-noir-moderne-modele-neralis': () => suspensionTubes({ railL: 0, n: 1, tubeL: 0.4, tubeR: 0.04, drop: 1.0 }),
  'suspension-beton-gris-style-loft-modele-arkemia': () => suspensionBeton(),
  'lustre-industriel-noir-6-lampes-salon-modele-neravio': () => lustreSputnik(),
  'suspension-acrylique-transparent-en-9-coloris': () => suspensionMelt({ d: 0.3 }),
  'suspension-wabi-sabi-beton': () => suspensionWabi({ L: 0.8, h: 0.22 })
}

const exporter = new GLTFExporter()
for (const [handle, build] of Object.entries(MODELS)) {
  const scene = new THREE.Scene()
  const model = build()
  model.add(floorAnchor())
  model.name = handle
  scene.add(model)
  await new Promise((res, rej) => {
    exporter.parse(scene, (buf) => {
      writeFileSync(join(OUT, handle + '.glb'), Buffer.from(buf))
      console.log(`✓ ${handle}.glb (${Math.round(Buffer.from(buf).length / 1024)} Ko)`)
      res()
    }, rej, { binary: true })
  })
}
console.log('Terminé.')
