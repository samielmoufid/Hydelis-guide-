// Ampoule décorative Velluce — globe G125 « Edison » luxueux.
// Verre transparent (KHR transmission/ior/volume), filament LED double
// arche émissif, culot laiton vissé. Sert de visuel 3D interactif dans
// les sections du thème (pas un produit, pas d'ancre de sol).
import * as THREE from 'three'
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js'
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

// GLTFExporter attend FileReader (même shim que gen-models.mjs).
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

const OUT = join(dirname(fileURLToPath(import.meta.url)), 'models')
mkdirSync(OUT, { recursive: true })

const g = new THREE.Group()

// ————— Verre : globe G125 (Ø 12,5 cm), col court fondu dans la sphère —————
const pts = [new THREE.Vector2(0.0135, 0), new THREE.Vector2(0.0135, 0.008)]
const R = 0.0625
const CY = 0.075
for (let i = 0; i <= 40; i++) {
  const a = THREE.MathUtils.lerp(-1.15, Math.PI / 2, i / 40)
  pts.push(new THREE.Vector2(Math.cos(a) * R, CY + Math.sin(a) * R))
}
const glassGeo = new THREE.LatheGeometry(pts, 72)
// Verre en transparence alpha (pas de transmission : model-viewer
// réfracterait l'environnement blanc au lieu de la page → globe laiteux).
const glass = new THREE.Mesh(glassGeo, new THREE.MeshPhysicalMaterial({
  color: 0xfff8ec, metalness: 0, roughness: 0.04,
  transparent: true, opacity: 0.22,
  clearcoat: 1, clearcoatRoughness: 0.05, ior: 1.5
}))
glass.name = 'verre'
g.add(glass)

// ————— Tige interne + coupelle en verre dépoli —————
const frosted = new THREE.MeshPhysicalMaterial({
  color: 0xf4ede1, metalness: 0, roughness: 0.5,
  transparent: true, opacity: 0.5
})
const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.0032, 0.0048, 0.036, 20), frosted)
stem.position.y = 0.026
g.add(stem)
const collerette = new THREE.Mesh(new THREE.SphereGeometry(0.0095, 24, 16), frosted)
collerette.position.y = 0.045
collerette.scale.y = 0.55
g.add(collerette)

// ————— Filament LED : double arche dorée incandescente —————
const filMat = new THREE.MeshStandardMaterial({
  color: 0xffc46a, emissive: 0xffab3d, emissiveIntensity: 3.4,
  metalness: 0, roughness: 0.4
})
filMat.name = 'filament'
function arche(rot) {
  const path = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.048, 0),
    new THREE.Vector3(0.019, 0.06, 0),
    new THREE.Vector3(0.029, 0.079, 0),
    new THREE.Vector3(0.019, 0.099, 0),
    new THREE.Vector3(0, 0.111, 0)
  ])
  const tube = new THREE.Mesh(new THREE.TubeGeometry(path, 48, 0.0014, 10, false), filMat)
  tube.rotation.y = rot
  return tube
}
g.add(arche(0), arche(Math.PI / 2), arche(Math.PI), arche(-Math.PI / 2))
// perle centrale au sommet des arches
const perle = new THREE.Mesh(new THREE.SphereGeometry(0.0035, 16, 12), filMat)
perle.position.y = 0.111
g.add(perle)

// ————— Culot laiton E27 vissé —————
const laiton = new THREE.MeshStandardMaterial({
  color: 0xcfa14a, metalness: 1, roughness: 0.28
})
laiton.name = 'laiton'
const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.0138, 0.0132, 0.012, 36), laiton)
neck.position.y = -0.004
g.add(neck)
for (let i = 0; i < 4; i++) { // filets de vis
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.0131, 0.0016, 10, 40), laiton)
  ring.rotation.x = Math.PI / 2
  ring.position.y = -0.013 - i * 0.0052
  g.add(ring)
}
const skirt = new THREE.Mesh(new THREE.CylinderGeometry(0.0128, 0.009, 0.007, 36), laiton)
skirt.position.y = -0.0375
g.add(skirt)
const isolant = new THREE.Mesh(new THREE.CylinderGeometry(0.0088, 0.0062, 0.005, 24),
  new THREE.MeshStandardMaterial({ color: 0x14110d, metalness: 0.1, roughness: 0.7 }))
isolant.position.y = -0.0435
g.add(isolant)
const plot = new THREE.Mesh(new THREE.SphereGeometry(0.0052, 20, 14), laiton)
plot.position.y = -0.0465
plot.scale.y = 0.6
g.add(plot)

// Léger recentrage : origine au centre visuel du globe.
g.position.y = -0.09
const root = new THREE.Group()
root.add(g)
root.name = 'ampoule-velluce'

const scene = new THREE.Scene()
scene.add(root)
const exporter = new GLTFExporter()
await new Promise((res, rej) => {
  exporter.parse(scene, (buf) => {
    writeFileSync(join(OUT, 'deco-ampoule-velluce.glb'), Buffer.from(buf))
    console.log(`✓ deco-ampoule-velluce.glb (${Math.round(Buffer.from(buf).length / 1024)} Ko)`)
    res()
  }, rej, { binary: true })
})
