// Objets 3D Zensea pour les heros de pages (Notre histoire, Notre promesse,
// Contactez-nous). Matieres communes : acier nitrure vert, laiton, bois.
// Usage : node zensea/gen-3d.mjs → zensea/models/zensea-*.glb

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

// ————— matieres —————
const acier = () => new THREE.MeshPhysicalMaterial({
  color: 0x4a6a58, metalness: 0.92, roughness: 0.34, clearcoat: 0.35, clearcoatRoughness: 0.4
})
const acierClair = () => new THREE.MeshPhysicalMaterial({
  color: 0x7f9c8c, metalness: 0.88, roughness: 0.28
})
const laiton = () => new THREE.MeshStandardMaterial({ color: 0xb98a2e, metalness: 1, roughness: 0.26 })
const laitonMat = () => new THREE.MeshStandardMaterial({ color: 0x9b7929, metalness: 0.9, roughness: 0.45 })
const bois = () => new THREE.MeshStandardMaterial({ color: 0xa97f3e, metalness: 0, roughness: 0.62 })
const feutre = () => new THREE.MeshStandardMaterial({ color: 0x2e5e46, metalness: 0, roughness: 0.95 })

// ————— geometrie d'une calotte spherique —————
// a : rayon a la base, h : fleche. Renvoie le rayon de la sphere et son centre.
function calotte(a, h) {
  const R = (a * a + h * h) / (2 * h)
  return { R, cy: h - R }
}

// Profil de revolution d'une calotte, du sommet vers le bord.
function profilCalotte(a, h, seg = 48) {
  const { R, cy } = calotte(a, h)
  const pts = []
  for (let i = 0; i <= seg; i++) {
    const d = (i / seg) * a
    pts.push(new THREE.Vector2(d, Math.sqrt(Math.max(0, R * R - d * d)) + cy))
  }
  return pts
}

// ————— HANDPAN : coupole d'acier, ding central, huit champs de notes —————
function handpan() {
  const g = new THREE.Group()
  const a = 0.12, h = 0.036
  const { R, cy } = calotte(a, h)

  // Coque superieure
  const haut = new THREE.Mesh(new THREE.LatheGeometry(profilCalotte(a, h, 30), 64), acier())
  g.add(haut)

  // Coque inferieure, plus profonde, avec l'ouverture du gu
  const bas = new THREE.Mesh(new THREE.LatheGeometry(profilCalotte(a, 0.062, 22), 64), acier())
  bas.rotation.z = Math.PI
  g.add(bas)

  // Couture de laiton a l'equateur
  const couture = new THREE.Mesh(new THREE.TorusGeometry(a - 0.002, 0.0045, 14, 72), laiton())
  couture.rotation.x = Math.PI / 2
  g.add(couture)

  // Ding central
  const ding = new THREE.Mesh(new THREE.LatheGeometry(profilCalotte(0.027, 0.012, 16), 40), acierClair())
  ding.position.y = h - 0.0015
  g.add(ding)
  const cercleDing = new THREE.Mesh(new THREE.TorusGeometry(0.027, 0.0016, 10, 44), laitonMat())
  cercleDing.rotation.x = Math.PI / 2
  cercleDing.position.y = h - 0.001
  g.add(cercleDing)

  // Huit champs de notes, poses sur la courbure et orientes selon la normale
  const d = 0.079
  const y = Math.sqrt(R * R - d * d) + cy
  const tilt = Math.asin(d / R)
  for (let i = 0; i < 8; i++) {
    const ang = (i / 8) * Math.PI * 2 + Math.PI / 8
    const champ = new THREE.Group()

    const bosse = new THREE.Mesh(new THREE.LatheGeometry(profilCalotte(0.0195, 0.0055, 12), 26), acierClair())
    champ.add(bosse)
    const anneau = new THREE.Mesh(new THREE.TorusGeometry(0.0195, 0.0013, 8, 32), laitonMat())
    anneau.rotation.x = Math.PI / 2
    champ.add(anneau)

    champ.position.set(Math.cos(ang) * d, y - 0.001, Math.sin(ang) * d)
    champ.rotation.y = -ang
    champ.rotateZ(-tilt)
    g.add(champ)
  }

  g.rotation.x = -0.34
  g.rotation.y = 0.28
  const root = new THREE.Group(); root.add(g); return root
}

// ————— DIAPASON : la promesse, l'accordage verifie en 440 Hz —————
function diapason() {
  const g = new THREE.Group()
  const fourche = new THREE.Group()

  // Deux branches
  ;[-0.021, 0.021].forEach((x) => {
    const br = new THREE.Mesh(new THREE.CylinderGeometry(0.0058, 0.0058, 0.145, 28), laiton())
    br.position.set(x, 0.0725, 0)
    fourche.add(br)
    const bout = new THREE.Mesh(new THREE.SphereGeometry(0.0058, 24, 16), laiton())
    bout.position.set(x, 0.145, 0)
    fourche.add(bout)
  })

  // Coude en U
  const coude = new THREE.Mesh(new THREE.TorusGeometry(0.021, 0.0058, 20, 48, Math.PI), laiton())
  coude.rotation.z = Math.PI
  fourche.add(coude)

  // Manche et pied
  const manche = new THREE.Mesh(new THREE.CylinderGeometry(0.0072, 0.0062, 0.072, 28), laiton())
  manche.position.y = -0.057
  fourche.add(manche)
  const pied = new THREE.Mesh(new THREE.CylinderGeometry(0.019, 0.021, 0.0085, 40), laitonMat())
  pied.position.y = -0.0975
  fourche.add(pied)

  fourche.position.y = 0.104
  g.add(fourche)

  // Socle d'acier, comme un petit handpan pose
  const socle = new THREE.Mesh(new THREE.LatheGeometry(profilCalotte(0.088, 0.026, 40), 80), acier())
  g.add(socle)
  const bord = new THREE.Mesh(new THREE.TorusGeometry(0.086, 0.0038, 18, 90), laiton())
  bord.rotation.x = Math.PI / 2
  g.add(bord)
  const dessous = new THREE.Mesh(new THREE.LatheGeometry(profilCalotte(0.088, 0.03, 28), 80), acier())
  dessous.rotation.z = Math.PI
  g.add(dessous)

  // Trois ondes de laiton : le son qui part
  for (let i = 0; i < 3; i++) {
    const r = 0.038 + i * 0.019
    const onde = new THREE.Mesh(
      new THREE.TorusGeometry(r, 0.0016 - i * 0.0003, 10, 64, Math.PI * 0.75),
      laitonMat()
    )
    onde.rotation.x = Math.PI / 2
    onde.rotation.z = -Math.PI * 0.375
    onde.position.y = 0.028 + i * 0.004
    g.add(onde)
  }

  g.rotation.y = 0.3
  g.position.y = -0.03
  const root = new THREE.Group(); root.add(g); return root
}

// ————— BOL CHANTANT : l'accueil, le contact —————
function bolChantant() {
  const g = new THREE.Group()

  // Bol : profil de revolution, evase
  const pts = []
  const seg = 40
  for (let i = 0; i <= seg; i++) {
    const t = i / seg
    const r = 0.028 + Math.pow(t, 0.72) * 0.062
    const y = Math.pow(t, 1.35) * 0.072
    pts.push(new THREE.Vector2(r, y))
  }
  const bol = new THREE.Mesh(new THREE.LatheGeometry(pts, 96), laiton())
  g.add(bol)

  // Levre du bol
  const levre = new THREE.Mesh(new THREE.TorusGeometry(0.0895, 0.0038, 18, 96), laitonMat())
  levre.rotation.x = Math.PI / 2
  levre.position.y = 0.072
  g.add(levre)

  // Deux filets graves
  ;[0.028, 0.05].forEach((y, i) => {
    const f = new THREE.Mesh(new THREE.TorusGeometry(0.052 + i * 0.019, 0.0011, 10, 90), laitonMat())
    f.rotation.x = Math.PI / 2
    f.position.y = y
    g.add(f)
  })

  // Coussin
  const coussin = new THREE.Mesh(new THREE.TorusGeometry(0.062, 0.021, 22, 72), feutre())
  coussin.rotation.x = Math.PI / 2
  coussin.position.y = -0.014
  coussin.scale.y = 0.72
  g.add(coussin)

  // Maillet pose contre le bol
  const maillet = new THREE.Group()
  const manche = new THREE.Mesh(new THREE.CylinderGeometry(0.0068, 0.0058, 0.15, 24), bois())
  maillet.add(manche)
  const tete = new THREE.Mesh(new THREE.SphereGeometry(0.019, 28, 20), feutre())
  tete.position.y = 0.084
  maillet.add(tete)
  maillet.rotation.z = -0.58
  maillet.position.set(0.108, 0.026, 0.03)
  g.add(maillet)

  g.rotation.y = 0.34
  g.position.y = -0.012
  const root = new THREE.Group(); root.add(g); return root
}

const FICHIERS = {
  'zensea-handpan': handpan,
  'zensea-diapason': diapason,
  'zensea-bol-chantant': bolChantant
}

const exporter = new GLTFExporter()
for (const [nom, build] of Object.entries(FICHIERS)) {
  const scene = new THREE.Scene()
  const model = build()
  model.name = nom
  scene.add(model)
  await new Promise((res, rej) => {
    exporter.parse(scene, (buf) => {
      writeFileSync(join(OUT, nom + '.glb'), Buffer.from(buf))
      console.log(`✓ ${nom}.glb (${Math.round(Buffer.from(buf).length / 1024)} Ko)`)
      res()
    }, rej, { binary: true })
  })
}
console.log('Termine.')
