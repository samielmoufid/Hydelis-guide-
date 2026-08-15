// Velluce — générateur de modèles 3D GLB des luminaires, aux dimensions
// réelles des fiches produits (échelle : mètres, exigée par la RA).
// Usage : node velluce/gen-models.mjs  → velluce/models/<handle>.glb

// Shim Node : GLTFExporter s'appuie sur FileReader (API navigateur).
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

// ————— Matériaux —————
const M = {
  noir: () => new THREE.MeshStandardMaterial({ color: 0x151515, metalness: 0.75, roughness: 0.35 }),
  blanc: () => new THREE.MeshStandardMaterial({ color: 0xf4f4f0, metalness: 0.4, roughness: 0.45 }),
  beton: () => new THREE.MeshStandardMaterial({ color: 0x9a9a96, metalness: 0.0, roughness: 0.95 }),
  beige: () => new THREE.MeshStandardMaterial({ color: 0xe6ddcf, metalness: 0.0, roughness: 0.85 }),
  or: () => new THREE.MeshStandardMaterial({ color: 0xcfa14a, metalness: 0.9, roughness: 0.25 }),
  cableNoir: () => new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.2, roughness: 0.7 }),
  cableTransp: () => new THREE.MeshPhysicalMaterial({ color: 0xdddddd, metalness: 0, roughness: 0.2, transmission: 0.85, transparent: true, opacity: 0.55 }),
  ampoule: () => new THREE.MeshStandardMaterial({ color: 0xfff2d8, emissive: 0xffdf9e, emissiveIntensity: 1.6, roughness: 0.3 }),
  acrylique: (hex) => new THREE.MeshPhysicalMaterial({ color: hex, metalness: 0, roughness: 0.06, transmission: 0.92, thickness: 0.004, transparent: true, opacity: 0.8, ior: 1.45 })
}

const cyl = (rTop, rBot, h, mat, seg = 40) => new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, h, seg), mat)
const sph = (r, mat, seg = 40) => new THREE.Mesh(new THREE.SphereGeometry(r, seg, Math.round(seg * 0.7)), mat)
const box = (w, h, d, mat) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat)

// Câble vertical entre deux hauteurs.
function cable(x, z, yTop, yBot, mat, r = 0.0022) {
  const c = cyl(r, r, yTop - yBot, mat, 12)
  c.position.set(x, (yTop + yBot) / 2, z)
  return c
}

// Pavillon de plafond (garniture) rectangulaire ou rond.
function canopyRect(w, d, mat, yTop) {
  const c = box(w, 0.022, d, mat)
  c.position.y = yTop - 0.011
  return c
}
function canopyRound(rad, mat, yTop) {
  const c = cyl(rad, rad * 0.92, 0.03, mat)
  c.position.y = yTop - 0.015
  return c
}

// Spot orientable : corps cylindrique + tête inclinée, sur un rail.
function spot(mat, matIn, tilt = 0.5, pan = 0) {
  const g = new THREE.Group()
  const arm = cyl(0.006, 0.006, 0.035, mat, 16)
  arm.position.y = -0.0175
  g.add(arm)
  const head = new THREE.Group()
  const body = cyl(0.03, 0.03, 0.085, mat, 32)
  body.position.y = -0.0425
  head.add(body)
  const inner = cyl(0.024, 0.024, 0.004, matIn, 24)
  inner.position.y = -0.086
  head.add(inner)
  head.position.y = -0.035
  head.rotation.x = tilt
  g.rotation.y = pan
  g.add(head)
  return g
}

// ————— Modèles —————
// Chaque fabrique retourne un Group dont l'origine est AU SOL (y=0),
// l'objet s'élève vers le plafond (top = hauteur totale de la scène RA).

// Plafonnier rail à spots (Arvella 118/6, Virelia 80/4, Orphéane 80/4, Nerava 30/2)
function plafonnierSpots({ L, n, couleur }) {
  const g = new THREE.Group()
  const mat = couleur === 'blanc' ? M.blanc() : M.noir()
  const H = 0.16
  const rail = cyl(0.025, 0.025, L, mat, 32)
  rail.rotation.z = Math.PI / 2
  rail.position.y = H - 0.045
  g.add(rail)
  const plate = box(Math.min(L, 0.28), 0.02, 0.05, mat)
  plate.position.y = H - 0.01
  g.add(plate)
  for (let i = 0; i < n; i++) {
    const x = n === 1 ? 0 : -L / 2 + 0.07 + (i * (L - 0.14)) / (n - 1)
    const s = spot(mat, M.ampoule(), 0.55 * (i % 2 ? 1 : -1), (i % 2) * Math.PI)
    s.position.set(x, H - 0.045, 0)
    g.add(s)
  }
  g.userData = { L, H }
  return g
}

// Suspension cylindres noirs (Arothis 3 tubes/45, Neralis 2 tubes/30, Neralis1 1 tube)
function suspensionCylindres({ railL, tubes, H }) {
  const g = new THREE.Group()
  const mat = M.noir()
  const cmat = M.cableTransp()
  if (railL > 0) g.add(canopyRect(railL, 0.05, mat, H))
  else g.add(canopyRound(0.04, mat, H))
  const n = tubes.length
  tubes.forEach((t, i) => {
    const x = n === 1 ? 0 : -((railL - 0.1) / 2) + (i * (railL - 0.1)) / (n - 1)
    const tube = cyl(0.03, 0.03, t.len, mat)
    const yC = t.bottom + t.len / 2
    tube.position.set(x, yC, 0)
    g.add(tube)
    const lens = cyl(0.024, 0.024, 0.004, M.ampoule(), 24)
    lens.position.set(x, t.bottom + 0.002, 0)
    g.add(lens)
    g.add(cable(x, 0, H - 0.03, t.bottom + t.len, cmat))
  })
  return g
}

// Suspension béton conique (Arkemia Ø17, corps ~26 cm, chute totale 132)
function suspensionBeton() {
  const g = new THREE.Group()
  const H = 1.32
  const body = cyl(0.045, 0.085, 0.24, M.beton(), 48)
  body.position.y = 0.12 + 0.02
  g.add(body)
  const lens = cyl(0.06, 0.06, 0.006, M.ampoule(), 32)
  lens.position.y = 0.02
  g.add(lens)
  g.add(canopyRound(0.04, M.beton(), H))
  g.add(cable(0, 0, H - 0.03, 0.26 + 0.02, M.cableNoir()))
  return g
}

// Lustre industriel 6 bras (Neravio, largeur 63, H réglable ~60)
function lustreIndustriel() {
  const g = new THREE.Group()
  const mat = M.noir()
  const H = 0.6 + 0.45 // corps sous pavillon, total ~1.05 au sol
  const hubY = 0.45
  const hub = cyl(0.035, 0.035, 0.1, mat, 32)
  hub.position.y = hubY
  g.add(hub)
  const tige = cyl(0.008, 0.008, H - hubY - 0.05, mat, 16)
  tige.position.y = (H - 0.03 + hubY + 0.05) / 2
  g.add(tige)
  g.add(canopyRound(0.05, mat, H))
  const R = 0.63 / 2 - 0.03
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2
    const arm = cyl(0.007, 0.007, R, mat, 12)
    arm.rotation.z = Math.PI / 2
    arm.position.set(Math.cos(a) * R / 2, hubY, Math.sin(a) * R / 2)
    arm.rotation.y = -a
    g.add(arm)
    const douille = cyl(0.02, 0.02, 0.05, mat, 24)
    douille.position.set(Math.cos(a) * R, hubY + 0.025, Math.sin(a) * R)
    g.add(douille)
    const bulb = sph(0.03, M.ampoule(), 24)
    bulb.position.set(Math.cos(a) * R, hubY + 0.085, Math.sin(a) * R)
    g.add(bulb)
  }
  return g
}

// Suspension globe acrylique (Ø au choix, capuchon doré, câble 150)
function suspensionAcrylique({ d, hex }) {
  const g = new THREE.Group()
  const r = d / 2
  const drop = 1.2
  const globe = sph(r, M.acrylique(hex), 48)
  globe.position.y = r
  g.add(globe)
  const bulb = sph(Math.min(r * 0.4, 0.045), M.ampoule(), 24)
  bulb.position.y = r
  g.add(bulb)
  const cap = cyl(0.022, 0.03, 0.035, M.or(), 32)
  cap.position.y = 2 * r + 0.0135
  g.add(cap)
  const H = 2 * r + drop
  g.add(canopyRound(0.04, M.or(), H))
  g.add(cable(0, 0, H - 0.03, 2 * r + 0.031, M.cableTransp()))
  return g
}

// Suspension wabi-sabi : large dôme organique (L80 l42 H22, beige)
function suspensionWabiSabi({ L, l, h, couleur }) {
  const g = new THREE.Group()
  const mat = couleur === 'marron' ? new THREE.MeshStandardMaterial({ color: 0x8a6b50, roughness: 0.85 }) : M.beige()
  // Demi-sphère aplatie et étirée : forme organique douce.
  const geo = new THREE.SphereGeometry(0.5, 64, 32, 0, Math.PI * 2, 0, Math.PI / 2)
  const dome = new THREE.Mesh(geo, mat)
  mat.side = THREE.DoubleSide
  const drop = 1.0
  dome.scale.set(L, h * 2, l)
  dome.position.y = drop
  g.add(dome)
  const bulb = sph(0.035, M.ampoule(), 24)
  bulb.position.y = drop + 0.02
  g.add(bulb)
  const H = drop + h + 0.9
  g.add(canopyRound(0.04, mat, H))
  g.add(cable(0, 0, H - 0.03, drop + h * 0.96, M.cableNoir()))
  return g
}

// ————— Catalogue —————
const MODELS = {
  'plafonnier-blanc-moderne-6-spots-orientables-modele-arvella': () => plafonnierSpots({ L: 1.18, n: 6, couleur: 'blanc' }),
  'plafonnier-noir-moderne-4-spots-orientables-modele-virelia': () => plafonnierSpots({ L: 0.8, n: 4, couleur: 'noir' }),
  'plafonnier-moderne-acier-blanc-orientable-sejour-orpheane': () => plafonnierSpots({ L: 0.8, n: 4, couleur: 'blanc' }),
  'plafonnier-spot-moderne-noir-orientable-modele-nerava': () => plafonnierSpots({ L: 0.3, n: 2, couleur: 'noir' }),
  'suspension-cylindrique-noire-3-lumieres-modele-arothis': () => suspensionCylindres({
    railL: 0.45, H: 0.9,
    tubes: [{ len: 0.35, bottom: 0.25 }, { len: 0.45, bottom: 0.1 }, { len: 0.3, bottom: 0.35 }]
  }),
  'suspension-cylindrique-noire-moderne-modele-neralis': () => suspensionCylindres({
    railL: 0.3, H: 0.9,
    tubes: [{ len: 0.4, bottom: 0.18 }, { len: 0.32, bottom: 0.32 }]
  }),
  'suspension-cylindre-acier-noir-moderne-modele-neralis': () => suspensionCylindres({
    railL: 0, H: 1.0,
    tubes: [{ len: 0.4, bottom: 0.3 }]
  }),
  'suspension-beton-gris-style-loft-modele-arkemia': () => suspensionBeton(),
  'lustre-industriel-noir-6-lampes-salon-modele-neravio': () => lustreIndustriel(),
  'suspension-acrylique-transparent-en-9-coloris': () => suspensionAcrylique({ d: 0.3, hex: 0xcfa14a }),
  'suspension-wabi-sabi-beton': () => suspensionWabiSabi({ L: 0.8, l: 0.42, h: 0.22, couleur: 'blanc' })
}

// ————— Export —————
const exporter = new GLTFExporter()
for (const [handle, build] of Object.entries(MODELS)) {
  const scene = new THREE.Scene()
  const model = build()
  model.name = handle
  scene.add(model)
  await new Promise((res, rej) => {
    exporter.parse(scene, (buf) => {
      writeFileSync(join(OUT, handle + '.glb'), Buffer.from(buf))
      const kb = Math.round(Buffer.from(buf).length / 1024)
      console.log(`✓ ${handle}.glb (${kb} Ko)`)
      res()
    }, rej, { binary: true })
  })
}
console.log('Terminé.')
