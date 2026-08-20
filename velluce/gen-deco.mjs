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
  // « ? » : arc ouvert vers le bas + petit jambage + point
  const qMat = laiton().clone()
  qMat.color.set(0xf6efe4); qMat.metalness = 0; qMat.roughness = 0.25
  const q = new THREE.Mesh(new THREE.TorusGeometry(0.0095, 0.0038, 12, 28, Math.PI * 1.3), qMat)
  q.rotation.z = Math.PI * -0.15
  q.position.set(0, 0.009, 0.0295)
  small.add(q)
  const qStem = new THREE.Mesh(new THREE.CylinderGeometry(0.0038, 0.0038, 0.007, 12), qMat)
  qStem.position.set(0, -0.004, 0.0295)
  small.add(qStem)
  const qd = new THREE.Mesh(new THREE.SphereGeometry(0.0042, 16, 12), qMat)
  qd.position.set(0, -0.0165, 0.0295); qd.scale.z = 0.6
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

// ————— Notre histoire : ampoule Edison ST64, filament spirale —————
function edisonHistoire() {
  const g = new THREE.Group()
  // poire ST64 : col 1,35 cm → ventre 3,2 cm → dôme
  const prof = []
  const P = [
    [0.0135, 0], [0.0145, 0.008], [0.019, 0.024], [0.027, 0.048],
    [0.0315, 0.075], [0.032, 0.095], [0.029, 0.115], [0.022, 0.132],
    [0.012, 0.143], [0.0035, 0.1475], [0.0001, 0.148]
  ]
  P.forEach(([x, y]) => prof.push(new THREE.Vector2(x, y)))
  const glass = new THREE.Mesh(new THREE.LatheGeometry(prof, 64), new THREE.MeshPhysicalMaterial({
    color: 0xfff6e6, metalness: 0, roughness: 0.045,
    transmission: 1, ior: 1.5, thickness: 0.0035,
    attenuationColor: new THREE.Color(0xf3dcae), attenuationDistance: 0.35,
    clearcoat: 0.5, clearcoatRoughness: 0.06, side: THREE.DoubleSide
  }))
  glass.name = 'verre'
  g.add(glass)

  const filMat = new THREE.MeshStandardMaterial({
    color: 0xffbe66, emissive: 0xff9e2e, emissiveIntensity: 7,
    metalness: 0, roughness: 0.45
  })
  filMat.name = 'filament'
  // spirale verticale
  const spin = []
  const turns = 5.5
  for (let i = 0; i <= 110; i++) {
    const t = i / 110
    const a = t * Math.PI * 2 * turns
    const r = 0.0105 * (1 - 0.18 * Math.abs(Math.sin(t * Math.PI)))
    spin.push(new THREE.Vector3(Math.cos(a) * r, 0.052 + t * 0.062, Math.sin(a) * r))
  }
  g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(spin), 220, 0.0011, 8, false), filMat))
  // deux fils de support + tige
  const frosted = new THREE.MeshPhysicalMaterial({
    color: 0xf4ede1, metalness: 0, roughness: 0.5, transmission: 0.6, ior: 1.45, transparent: true, opacity: 0.9
  })
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.0042, 0.05, 16), frosted)
  stem.position.y = 0.027
  g.add(stem)
  const wireM = new THREE.MeshStandardMaterial({ color: 0x8a7f6d, metalness: 0.8, roughness: 0.4 })
  ;[-1, 1].forEach((s) => {
    const wire = new THREE.Mesh(new THREE.CylinderGeometry(0.0007, 0.0007, 0.064, 8), wireM)
    wire.position.set(s * 0.0105, 0.083, 0)
    g.add(wire)
  })

  // culot laiton vieilli
  const brass = new THREE.MeshStandardMaterial({ color: 0xb98d3f, metalness: 1, roughness: 0.38 })
  brass.name = 'laiton'
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.0135, 0.0128, 0.011, 32), brass)
  neck.position.y = -0.0045
  g.add(neck)
  for (let i = 0; i < 4; i++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.0127, 0.0015, 10, 36), brass)
    ring.rotation.x = Math.PI / 2
    ring.position.y = -0.0125 - i * 0.005
    g.add(ring)
  }
  const skirt = new THREE.Mesh(new THREE.CylinderGeometry(0.0124, 0.0086, 0.0065, 32), brass)
  skirt.position.y = -0.0355
  g.add(skirt)
  const iso = new THREE.Mesh(new THREE.CylinderGeometry(0.0084, 0.006, 0.0045, 20),
    new THREE.MeshStandardMaterial({ color: 0x14110d, metalness: 0.1, roughness: 0.7 }))
  iso.position.y = -0.0405
  g.add(iso)
  const plot = new THREE.Mesh(new THREE.SphereGeometry(0.005, 18, 12), brass)
  plot.position.y = -0.0435
  plot.scale.y = 0.6
  g.add(plot)

  g.position.y = -0.055 // centre visuel ≈ ventre de la poire
  const root = new THREE.Group()
  root.add(g)
  return root
}

const FILES = {
  'deco-bulles-faq': bullesFaq,
  'deco-bouclier-promesse': bouclierPromesse,
  'deco-edison-histoire': edisonHistoire
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
