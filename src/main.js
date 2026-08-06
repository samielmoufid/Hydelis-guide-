// Guide de pose Hydelis — orchestration : chargement, livre, interface, zoom.

import './styles.css'
import * as THREE from 'three'
import { PAGES, PAGE_TITLES, spreadForPage, spreadLabel, pagesAtSpread } from './pages.js'
import {
  makeCoverCanvas, makeInnerCoverCanvas, makeThanksCanvas,
  makeInnerBackCanvas, makeBackCoverCanvas, makePaperEdgeCanvas
} from './gen-textures.js'
import { PaperSound } from './audio.js'
import { Book3D } from './book3d.js'
import { Book2D } from './fallback2d.js'

const $ = (s) => document.querySelector(s)
const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches

const loaderFill = $('#loader-fill')
let loadedCount = 0
const TOTAL_STEPS = PAGES.length + 1 // 7 images + polices
function step() {
  loadedCount++
  loaderFill.style.width = Math.round((loadedCount / TOTAL_STEPS) * 100) + '%'
}

function hasWebGL() {
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => { step(); resolve(img) }
    img.onerror = reject
    img.src = url
  })
}

async function loadFonts() {
  if (!document.fonts || !document.fonts.load) return
  await Promise.all([
    document.fonts.load('600 118px "Cormorant Garamond"'),
    document.fonts.load('italic 500 108px "Cormorant Garamond"'),
    document.fonts.load('300 33px "Poppins"'),
    document.fonts.load('400 42px "Poppins"'),
    document.fonts.load('500 30px "Poppins"'),
    document.fonts.load('600 30px "Poppins"')
  ]).catch(() => {})
  step()
}

// ————— Démarrage —————

const sound = new PaperSound()
let book = null
// « ?no3d » force le flipbook CSS (test du fallback ou appareil capricieux).
let webgl = hasWebGL() && !new URLSearchParams(location.search).has('no3d')

init()

async function init() {
  const [images] = await Promise.all([
    Promise.all(PAGES.map(loadImage)),
    loadFonts()
  ])

  // Faces générées (après chargement des polices).
  const genCanvases = {
    cover: makeCoverCanvas(),
    innerCover: makeInnerCoverCanvas(),
    thanks: makeThanksCanvas(),
    innerBack: makeInnerBackCanvas(),
    backCover: makeBackCoverCanvas()
  }

  const on = {
    change: onSpreadChange,
    turnStart: (dir, stiff) => sound.flip(0.7, stiff),
    doubleTap: (side) => zoomFromSide(side),
    pinch: (side) => zoomFromSide(side)
  }

  if (webgl) {
    try {
      book = initBook3D(images, genCanvases, on)
    } catch (err) {
      console.warn('WebGL indisponible, bascule sur le flipbook CSS :', err)
      webgl = false
    }
  }
  if (!webgl) {
    book = initBook2D(images, genCanvases, on)
  }

  buildToc()
  bindUI()
  onSpreadChange(0)
  window.__book = book // aide au débogage

  $('#loader').classList.add('done')
  setTimeout(() => $('#loader').remove(), 800)
}

function initBook3D(images, gen, on) {
  const tex = (img) => {
    const t = new THREE.Texture(img)
    t.needsUpdate = true
    return t
  }
  const ctex = (c) => new THREE.CanvasTexture(c)
  const faces = [
    ctex(gen.cover), ctex(gen.innerCover),
    tex(images[0]), tex(images[1]),
    tex(images[2]), tex(images[3]),
    tex(images[4]), tex(images[5]),
    tex(images[6]), ctex(gen.thanks),
    ctex(gen.innerBack), ctex(gen.backCover)
  ]
  return new Book3D({
    canvas: $('#scene'),
    faces,
    edgeTexture: new THREE.CanvasTexture(makePaperEdgeCanvas()),
    reduced: REDUCED,
    on
  })
}

function initBook2D(images, gen, on) {
  $('#scene').remove()
  const fb = $('#fallback')
  fb.hidden = false
  const url = (c) => c.toDataURL('image/jpeg', 0.88)
  const faces = [
    url(gen.cover), url(gen.innerCover),
    PAGES[0], PAGES[1], PAGES[2], PAGES[3], PAGES[4], PAGES[5], PAGES[6],
    url(gen.thanks), url(gen.innerBack), url(gen.backCover)
  ]
  return new Book2D({ container: fb, faces, reduced: REDUCED, on })
}

// ————— Interface —————

function onSpreadChange(T) {
  $('#page-indicator').textContent = spreadLabel(T)
  $('#sr-live').textContent = spreadLabel(T)
  const visible = pagesAtSpread(T)
  document.querySelectorAll('.toc-item').forEach((el) => {
    const p = el.dataset.page
    const active = p === 'cover' ? T === 0 : visible.includes(Number(p))
    el.classList.toggle('active', active)
  })
  $('#btn-prev').disabled = T <= 0
  $('#btn-next').disabled = T >= 6
}

function buildToc() {
  const list = $('#toc-list')
  const cover = document.createElement('button')
  cover.className = 'toc-item'
  cover.dataset.page = 'cover'
  cover.innerHTML = `
    <span class="toc-cover"><svg viewBox="0 0 32 32"><path d="M16 2c5 8 10 12.5 10 19a10 10 0 1 1-20 0C6 14.5 11 10 16 2z"/></svg></span>
    <span class="toc-label">Couverture</span>`
  cover.addEventListener('click', () => { book.goTo(0); closeToc() })
  list.appendChild(cover)

  PAGES.forEach((src, i) => {
    const b = document.createElement('button')
    b.className = 'toc-item'
    b.dataset.page = String(i + 1)
    b.innerHTML = `
      <img src="${src}" alt="Page ${i + 1} : ${PAGE_TITLES[i]}" loading="lazy">
      <span class="toc-label">${PAGE_TITLES[i]}</span>`
    b.addEventListener('click', () => { book.goTo(spreadForPage(i + 1)); closeToc() })
    list.appendChild(b)
  })
}

function openToc() {
  const toc = $('#toc')
  toc.hidden = false
  requestAnimationFrame(() => toc.classList.add('open'))
}
function closeToc() {
  const toc = $('#toc')
  toc.classList.remove('open')
  setTimeout(() => { toc.hidden = true }, REDUCED ? 0 : 420)
}

function zoomFromSide(side) {
  const visible = pagesAtSpread(book.turned)
  if (!visible.length) return
  const page = side === 'left' ? visible[0] : visible[visible.length - 1]
  lightbox.open(page - 1)
}

function bindUI() {
  const intro = $('#intro')
  const openBook = () => {
    if (book.opened) return
    sound.unlock()
    // Si le navigateur bloque l'audio, on coupe le son par défaut.
    setTimeout(() => { if (sound.blocked) setSoundUI(false, true) }, 300)
    intro.classList.add('leaving')
    setTimeout(() => intro.remove(), 1000)
    rampLight()
    setTimeout(() => book.open(), REDUCED ? 0 : 380)
    setTimeout(() => {
      $('#topbar').classList.remove('ui-hidden')
      $('#bottombar').classList.remove('ui-hidden')
      maybeShowRotateHint()
    }, REDUCED ? 0 : 900)
  }
  intro.addEventListener('click', openBook)
  intro.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') openBook()
  })

  $('#btn-prev').addEventListener('click', () => book.prev())
  $('#btn-next').addEventListener('click', () => book.next())
  $('#page-indicator').addEventListener('click', openToc)
  $('#toc-close').addEventListener('click', closeToc)
  $('#toc .toc-backdrop').addEventListener('click', closeToc)

  // Son
  const soundSaved = sound.enabled
  setSoundUI(soundSaved, false)
  $('#btn-sound').addEventListener('click', () => {
    sound.unlock()
    setSoundUI(!sound.enabled, true)
    if (sound.enabled) sound.flip(0.4)
  })

  // Plein écran
  const fsBtn = $('#btn-fs')
  if (!document.documentElement.requestFullscreen) {
    fsBtn.style.display = 'none'
  } else {
    fsBtn.addEventListener('click', () => {
      if (document.fullscreenElement) document.exitFullscreen()
      else document.documentElement.requestFullscreen().catch(() => {})
    })
  }

  // Clavier
  window.addEventListener('keydown', (e) => {
    if (e.target && /INPUT|TEXTAREA/.test(e.target.tagName)) return
    if (!lightbox.el.hidden) return // géré par la lightbox
    if (!book.opened && (e.key === 'Enter' || e.key === ' ')) { openBook(); return }
    switch (e.key) {
      case 'ArrowRight': case 'PageDown': book.next(); break
      case 'ArrowLeft': case 'PageUp': book.prev(); break
      case 'Home': book.goTo(0); break
      case 'End': book.goTo(6); break
      case 's': case 'S': $('#toc').hidden ? openToc() : closeToc(); break
      case 'Escape': closeToc(); break
      case 'f': case 'F': fsBtn.style.display !== 'none' && fsBtn.click(); break
      case 'm': case 'M': $('#btn-sound').click(); break
    }
  })

  // Parallaxe (desktop uniquement)
  if (window.matchMedia('(pointer: fine)').matches && !REDUCED) {
    window.addEventListener('pointermove', (e) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1
      const ny = (e.clientY / window.innerHeight) * 2 - 1
      book.setParallax && book.setParallax(nx, ny)
    })
  }

  // Molette : tourner les pages
  window.addEventListener('wheel', (e) => {
    if (!book.opened || !lightbox.el.hidden || !$('#toc').hidden) return
    if (Math.abs(e.deltaY) < 18) return
    if (wheelLock) return
    wheelLock = true
    setTimeout(() => { wheelLock = false }, 650)
    e.deltaY > 0 ? book.next() : book.prev()
  }, { passive: true })
}

let wheelLock = false

function setSoundUI(onFlag, save) {
  if (save) sound.setEnabled(onFlag)
  else sound.enabled = onFlag
  const btn = $('#btn-sound')
  btn.setAttribute('aria-pressed', String(onFlag))
  btn.querySelector('.ic-sound-on').hidden = !onFlag
  btn.querySelector('.ic-sound-off').hidden = onFlag
}

function rampLight() {
  if (!('lightRamp' in book)) return
  if (REDUCED) { book.lightRamp = 1; return }
  const t0 = performance.now()
  const dur = 1600
  const tick = () => {
    const k = Math.min(1, (performance.now() - t0) / dur)
    book.lightRamp = k * k * (3 - 2 * k)
    if (k < 1) requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
}

function maybeShowRotateHint() {
  const portrait = window.innerHeight > window.innerWidth
  const coarse = window.matchMedia('(pointer: coarse)').matches
  if (!portrait || !coarse) return
  const hint = $('#rotate-hint')
  hint.hidden = false
  requestAnimationFrame(() => hint.classList.add('show'))
  setTimeout(() => {
    hint.classList.remove('show')
    setTimeout(() => { hint.hidden = true }, 600)
  }, 5200)
}

// ————— Lightbox zoom pleine résolution —————

const lightbox = {
  el: $('#lightbox'),
  img: $('#lb-img'),
  stage: document.querySelector('#lightbox .lb-stage'),
  idx: 0, scale: 1, tx: 0, ty: 0,
  pointers: new Map(), pinch0: null, lastTap: 0,

  open(idx) {
    this.idx = idx
    this.scale = 1; this.tx = 0; this.ty = 0
    this.img.src = PAGES[idx]
    this._apply()
    this.el.hidden = false
    requestAnimationFrame(() => this.el.classList.add('open'))
    $('#lb-counter').textContent = `Page ${idx + 1} / 7 — ${PAGE_TITLES[idx]}`
    $('#sr-live').textContent = `Zoom sur la page ${idx + 1} : ${PAGE_TITLES[idx]}`
  },
  close() {
    this.el.classList.remove('open')
    setTimeout(() => { this.el.hidden = true }, REDUCED ? 0 : 320)
  },
  show(idx) {
    if (idx < 0 || idx > 6) return
    this.open(idx)
  },
  _apply() {
    // Bornes de déplacement pour ne pas perdre l'image.
    const r = this.img.getBoundingClientRect()
    const baseW = r.width / (this.prevScale || 1)
    void baseW
    const maxX = Math.max(0, (this.scale - 1) * (this.img.clientWidth / 2))
    const maxY = Math.max(0, (this.scale - 1) * (this.img.clientHeight / 2))
    this.tx = Math.max(-maxX, Math.min(maxX, this.tx))
    this.ty = Math.max(-maxY, Math.min(maxY, this.ty))
    this.img.style.transform = `translate(${this.tx}px, ${this.ty}px) scale(${this.scale})`
  },
  zoomAt(cx, cy, factor) {
    const ns = Math.max(1, Math.min(4.2, this.scale * factor))
    const k = ns / this.scale
    const rect = this.stage.getBoundingClientRect()
    const ox = cx - rect.left - rect.width / 2
    const oy = cy - rect.top - rect.height / 2
    this.tx = ox - (ox - this.tx) * k
    this.ty = oy - (oy - this.ty) * k
    this.scale = ns
    this._apply()
  }
}

$('#lb-close').addEventListener('click', () => lightbox.close())
$('#lightbox .lb-backdrop').addEventListener('click', () => lightbox.close())
$('#lb-prev').addEventListener('click', () => lightbox.show(lightbox.idx - 1))
$('#lb-next').addEventListener('click', () => lightbox.show(lightbox.idx + 1))

lightbox.stage.addEventListener('pointerdown', (e) => {
  lightbox.stage.setPointerCapture(e.pointerId)
  lightbox.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
  if (lightbox.pointers.size === 2) {
    const [a, b] = [...lightbox.pointers.values()]
    lightbox.pinch0 = { d: Math.hypot(a.x - b.x, a.y - b.y), s: lightbox.scale }
  }
})
lightbox.stage.addEventListener('pointermove', (e) => {
  const p = lightbox.pointers.get(e.pointerId)
  if (!p) return
  const nx = e.clientX
  const ny = e.clientY
  if (lightbox.pointers.size === 2 && lightbox.pinch0) {
    lightbox.pointers.set(e.pointerId, { x: nx, y: ny })
    const [a, b] = [...lightbox.pointers.values()]
    const d = Math.hypot(a.x - b.x, a.y - b.y)
    const mx = (a.x + b.x) / 2
    const my = (a.y + b.y) / 2
    const target = Math.max(1, Math.min(4.2, lightbox.pinch0.s * (d / lightbox.pinch0.d)))
    lightbox.zoomAt(mx, my, target / lightbox.scale)
  } else if (lightbox.pointers.size === 1 && lightbox.scale > 1) {
    lightbox.tx += nx - p.x
    lightbox.ty += ny - p.y
    lightbox.pointers.set(e.pointerId, { x: nx, y: ny })
    lightbox._apply()
  }
})
const lbUp = (e) => {
  const had = lightbox.pointers.has(e.pointerId)
  lightbox.pointers.delete(e.pointerId)
  if (lightbox.pointers.size < 2) lightbox.pinch0 = null
  if (!had) return
  // Double-tap : zoom / dézoom
  const now = performance.now()
  if (now - lightbox.lastTap < 320) {
    if (lightbox.scale > 1.3) {
      lightbox.scale = 1; lightbox.tx = 0; lightbox.ty = 0; lightbox._apply()
    } else {
      lightbox.zoomAt(e.clientX, e.clientY, 2.4)
    }
    lightbox.lastTap = 0
  } else {
    lightbox.lastTap = now
  }
}
lightbox.stage.addEventListener('pointerup', lbUp)
lightbox.stage.addEventListener('pointercancel', (e) => {
  lightbox.pointers.delete(e.pointerId)
  if (lightbox.pointers.size < 2) lightbox.pinch0 = null
})
lightbox.stage.addEventListener('wheel', (e) => {
  e.preventDefault()
  lightbox.zoomAt(e.clientX, e.clientY, e.deltaY < 0 ? 1.18 : 1 / 1.18)
}, { passive: false })

window.addEventListener('keydown', (e) => {
  if (lightbox.el.hidden) return
  switch (e.key) {
    case 'Escape': lightbox.close(); break
    case 'ArrowRight': lightbox.show(lightbox.idx + 1); break
    case 'ArrowLeft': lightbox.show(lightbox.idx - 1); break
    case '+': lightbox.zoomAt(window.innerWidth / 2, window.innerHeight / 2, 1.3); break
    case '-': lightbox.zoomAt(window.innerWidth / 2, window.innerHeight / 2, 1 / 1.3); break
  }
})
