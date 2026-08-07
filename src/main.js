// Guides de pose Hydelis — orchestration : routage (#classique /
// #thermostatique), sélecteur de modèle, transition warp, livre, zoom.

import './styles.css'
import * as THREE from 'three'
import {
  BOOKS, spreadForPage, spreadLabel, pagesAtSpread, buildFaceList
} from './books.js'
import {
  makeCoverCanvas, makeInnerCoverCanvas, makeThanksCanvas,
  makeInnerBackCanvas, makeBackCoverCanvas, makePaperEdgeCanvas
} from './gen-textures.js'
import { PaperSound } from './audio.js'
import { Book3D, mirrorTexture } from './book3d.js'
import { Book2D } from './fallback2d.js'
import { Selector3D } from './selector3d.js'
import { Warp } from './warp.js'

const $ = (s) => document.querySelector(s)
const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches

function hasWebGL() {
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}

// « ?no3d » force le flipbook CSS (test du fallback ou appareil capricieux).
const WEBGL = hasWebGL() && !new URLSearchParams(location.search).has('no3d')

// ————— État global —————

const sound = new PaperSound()
let CUR = null          // config du livre actif (BOOKS[id])
let N = 0               // nombre de pages du livre actif
let book = null
let selector = null
let renderer = null
let warp = null
let gen = null          // canvases communs (merci, garde arrière, 4e de couverture)
let innerCovers = null  // id -> canvas de garde (mention de compatibilité)
let genUrls = null      // versions dataURL pour le fallback CSS
const covers = {}       // id -> canvas de couverture
let edgeCanvas = null
let edgeTexture = null  // texture de tranche partagée
const imageCache = {}   // id -> { images: [Image], promise }
const faceTexCache = {} // id -> textures THREE des faces (réutilisées)
let selTex = null       // textures du sélecteur (créées une seule fois)
let busy = false        // transition en cours

function selectorTextures() {
  if (selTex) return selTex
  const t = (c) => {
    const x = new THREE.CanvasTexture(c)
    x.colorSpace = THREE.SRGBColorSpace
    return x
  }
  const back = t(gen.backCover)
  selTex = {
    classique: { front: t(covers.classique), back },
    thermostatique: { front: t(covers.thermostatique), back },
    edge: new THREE.CanvasTexture(edgeCanvas)
  }
  return selTex
}

// ————— Loader —————

const loaderFill = $('#loader-fill')
let loadedCount = 0
let totalSteps = 1
function step() {
  loadedCount++
  if (loaderFill) loaderFill.style.width = Math.round((loadedCount / totalSteps) * 100) + '%'
}
function finishLoader() {
  const l = $('#loader')
  if (!l) return
  l.classList.add('done')
  setTimeout(() => l.remove(), 800)
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

function loadBookImages(id) {
  if (imageCache[id]) return imageCache[id].promise
  const images = []
  const promise = Promise.all(BOOKS[id].pages.map((url, i) => new Promise((res, rej) => {
    const img = new Image()
    images[i] = img
    img.addEventListener('load', () => {
      // Décodage asynchrone hors du fil principal : l'envoi GPU et
      // l'affichage ultérieurs ne bloquent plus les animations.
      const done = () => { step(); res(img) }
      if (img.decode) img.decode().then(done, done)
      else done()
    }, { once: true })
    img.addEventListener('error', rej, { once: true })
    img.src = url
  })))
  imageCache[id] = { images, promise }
  return promise
}

// ————— Démarrage —————

init()

async function init() {
  if (!WEBGL) document.body.classList.add('no-webgl')

  const route = location.hash.replace('#', '')
  const deepLink = BOOKS[route] ? route : null
  totalSteps = 1 + (deepLink ? BOOKS[deepLink].pages.length : 0)

  await loadFonts()

  // Faces générées (après chargement des polices). La garde porte la
  // mention de compatibilité propre à chaque gamme.
  gen = {
    thanks: makeThanksCanvas(),
    innerBack: makeInnerBackCanvas(),
    backCover: makeBackCoverCanvas()
  }
  innerCovers = {
    classique: makeInnerCoverCanvas('classique'),
    thermostatique: makeInnerCoverCanvas('thermostatique')
  }
  for (const id of ['classique', 'thermostatique']) {
    const cfg = BOOKS[id]
    covers[id] = makeCoverCanvas({
      title: cfg.coverTitle,
      subtitle: cfg.coverSub,
      picto: cfg.picto
    })
  }
  edgeCanvas = makePaperEdgeCanvas()

  if (WEBGL) {
    renderer = new THREE.WebGLRenderer({
      canvas: $('#scene'), alpha: true, antialias: true,
      powerPreference: 'high-performance'
    })
    warp = new Warp($('#warp'), { reduced: REDUCED })
  } else {
    warp = new Warp($('#warp'), { reduced: true }) // fondu simple sans WebGL
  }

  bindGlobalUI()

  if (deepLink) {
    await loadBookImages(deepLink)
    buildBook(deepLink)
    showIntro()
    finishLoader()
  } else {
    finishLoader()
    showSelector(null)
    // Préchargement des deux livres en arrière-plan.
    setTimeout(() => {
      loadBookImages('classique')
      loadBookImages('thermostatique')
    }, 700)
  }

  window.addEventListener('hashchange', () => {
    const h = location.hash.replace('#', '')
    const target = BOOKS[h] ? h : null
    const current = CUR ? CUR.id : null
    if (target !== current) location.reload()
  })
}

// ————— Construction / destruction d'un livre —————

function texFromImage(img) {
  const t = new THREE.Texture(img)
  const ready = () => {
    t.needsUpdate = true
    // Envoi GPU immédiat, au moment du chargement (généralement hors
    // animation) plutôt qu'au premier rendu en pleine rotation de page.
    if (renderer) { try { renderer.initTexture(t) } catch { /* non bloquant */ } }
  }
  if (img.complete && img.naturalWidth) {
    t.needsUpdate = true
  } else {
    img.addEventListener('load', () => {
      if (img.decode) img.decode().then(ready, ready)
      else ready()
    }, { once: true })
  }
  return t
}

// Textures THREE des faces d'un livre, créées une seule fois puis réutilisées
// (pas de renvoi au GPU quand on rechange de livre).
function facesFor(id) {
  if (faceTexCache[id]) return faceTexCache[id]
  loadBookImages(id)
  const inputs = buildFaceList(
    { cover: covers[id], ...gen, innerCover: innerCovers[id] },
    imageCache[id].images
  )
  faceTexCache[id] = inputs.map((f) => {
    const t = f instanceof HTMLCanvasElement ? new THREE.CanvasTexture(f) : texFromImage(f)
    // Réglages appliqués AVANT tout envoi GPU (initTexture) : une texture
    // partie en linéaire resterait délavée (noirs gris, chromes brûlés).
    t.colorSpace = THREE.SRGBColorSpace
    if (renderer) t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy())
    return t
  })
  return faceTexCache[id]
}

function ensureGenUrls() {
  if (genUrls) return
  const url = (c) => c.toDataURL('image/jpeg', 0.88)
  genUrls = {
    thanks: url(gen.thanks),
    innerBack: url(gen.innerBack), backCover: url(gen.backCover),
    coverClassique: url(covers.classique), coverThermostatique: url(covers.thermostatique),
    innerClassique: url(innerCovers.classique), innerThermostatique: url(innerCovers.thermostatique)
  }
}

function buildBook(id) {
  loadBookImages(id)
  CUR = BOOKS[id]
  N = CUR.pages.length

  const on = {
    change: onSpreadChange,
    turnStart: (dir, stiff) => sound.flip(0.7, stiff),
    doubleTap: (side) => zoomFromSide(side),
    pinch: (side) => zoomFromSide(side),
    zoom: onZoomChange,
    zoomNav
  }

  if (WEBGL) {
    book = new Book3D({
      canvas: $('#scene'),
      renderer,
      faces: facesFor(id),
      nPages: N,
      edgeTexture: edgeTexture || (edgeTexture = new THREE.CanvasTexture(edgeCanvas)),
      reduced: REDUCED,
      on
    })
  } else {
    ensureGenUrls()
    const coverUrl = id === 'classique' ? genUrls.coverClassique : genUrls.coverThermostatique
    const innerUrl = id === 'classique' ? genUrls.innerClassique : genUrls.innerThermostatique
    const faces = buildFaceList({ cover: coverUrl, ...genUrls, innerCover: innerUrl }, CUR.pages)
    const fb = $('#fallback')
    fb.hidden = false
    book = new Book2D({ container: fb, faces, nPages: N, reduced: REDUCED, on })
  }

  buildToc()
  onSpreadChange(0)
  localStorage.setItem('hydelis-last-book', id)
  history.replaceState(null, '', '#' + id)
  $('#btn-switch').hidden = false
  window.__book = book // aide au débogage
}

function destroyBook() {
  if (!book) return
  if (book.dispose) book.dispose()
  book = null
  CUR = null
  if (!WEBGL) {
    const fb = $('#fallback')
    fb.hidden = true
    fb.innerHTML = ''
  }
  $('#bottombar').classList.add('ui-hidden')
  $('#btn-switch').hidden = true
  hideTapHint()
  hideSharpHint()
  const exitBtn = $('#zoom-exit')
  exitBtn.classList.remove('show')
  exitBtn.hidden = true
  closeToc()
  lightbox.close()
}

// ————— Sélecteur de modèle —————

function showSelector(fromId) {
  const intro = $('#intro')
  if (intro) intro.remove()

  const sel = $('#selector')
  sel.hidden = false
  requestAnimationFrame(() => sel.classList.add('show'))
  sel.classList.remove('leaving')
  $('#topbar').classList.remove('ui-hidden')
  history.replaceState(null, '', location.pathname + location.search)

  if (WEBGL) {
    if (selector) {
      // Instance réutilisée : rien à reconstruire, zéro renvoi GPU.
      selector.reset(fromId || null)
    } else {
      const st = selectorTextures()
      selector = new Selector3D({
        canvas: $('#scene'),
        renderer,
        covers: { classique: st.classique, thermostatique: st.thermostatique },
        edgeTexture: st.edge,
        reduced: REDUCED,
        onPick: pickBook
      })
      if (fromId) selector.arriveFrom(fromId)
    }
  } else {
    document.body.classList.add('sel-fallback')
    ensureGenUrls()
    for (const id of ['classique', 'thermostatique']) {
      const img = document.querySelector(`#sel-${id} .sel-cover`)
      img.src = id === 'classique' ? genUrls.coverClassique : genUrls.coverThermostatique
      img.hidden = false
    }
  }
}

function hideSelectorDOM() {
  const sel = $('#selector')
  sel.classList.remove('show')
  sel.hidden = true
  document.body.classList.remove('sel-fallback')
}

async function pickBook(id) {
  if (busy || book) return
  busy = true
  sound.unlock()
  setTimeout(() => { if (sound.blocked) setSoundUI(false, true) }, 300)
  $('#selector').classList.add('leaving')

  loadBookImages(id)
  // Envoi progressif des textures (et de leurs miroirs) au GPU pendant
  // l'accélération du tunnel : plus de blocage à l'échange de scènes.
  if (WEBGL) {
    const faces = facesFor(id)
    const uploads = []
    faces.forEach((t, idx) => {
      uploads.push(t)
      if (idx % 2 === 1) uploads.push(mirrorTexture(t)) // versos des feuilles
    })
    let i = 0
    const upload = () => {
      if (i >= uploads.length || book) return
      const t = uploads[i++]
      const im = t.image
      if (im && (im instanceof HTMLCanvasElement || (im.complete && im.naturalWidth))) {
        renderer.initTexture(t)
      }
      requestAnimationFrame(upload)
    }
    requestAnimationFrame(upload)
  }
  const dive = selector && !REDUCED ? selector.diveTo(id, 0.5) : Promise.resolve()
  void dive
  await warp.play({
    onCover: () => {
      if (selector) selector.pause() // instance conservée pour le retour
      hideSelectorDOM()
      buildBook(id)
      if (book.lightRamp !== undefined) book.lightRamp = 0
      if (WEBGL && book.cam) book.cam.dist = book.fitDist * 1.35 // punch d'atterrissage
      // Une seule image rendue, puis pause : le tunnel garde toute la
      // fluidité pendant la phase couverte.
      if (book.renderOnce) { book.renderOnce(); book.pause() }
    },
    onReveal: () => {
      if (book && book.resume) book.resume()
      landing()
    }
  })
  busy = false
}

function landing() {
  rampLight()
  // L'ouverture automatique attend que la première page soit décodée
  // (au plus 1,4 s) : pas d'envoi GPU en pleine rotation de couverture.
  const first = imageCache[CUR.id] && imageCache[CUR.id].images[0]
  let opened = false
  const open = () => {
    if (opened || !book) return
    opened = true
    book.open()
  }
  if (REDUCED) {
    open()
  } else if (first && first.complete && first.naturalWidth) {
    setTimeout(open, 260)
  } else {
    const fallbackTimer = setTimeout(open, 1400)
    if (first) {
      first.addEventListener('load', () => {
        clearTimeout(fallbackTimer)
        setTimeout(open, 200)
      }, { once: true })
    }
  }
  setTimeout(() => {
    $('#topbar').classList.remove('ui-hidden')
    $('#bottombar').classList.remove('ui-hidden')
    showTapHint()
  }, REDUCED ? 0 : 700)
}

async function switchModel() {
  if (!book || busy) return
  busy = true
  const fromId = CUR.id
  // Pré-envoi des textures du sélecteur au GPU pendant l'accélération
  // (utile surtout à la toute première utilisation du bouton retour).
  if (WEBGL) {
    const st = selectorTextures()
    const list = [st.classique.front, st.classique.back, st.thermostatique.front, st.edge]
    let i = 0
    const up = () => {
      if (i >= list.length) return
      renderer.initTexture(list[i++])
      requestAnimationFrame(up)
    }
    requestAnimationFrame(up)
  }
  await warp.play({
    onCover: () => {
      destroyBook()
      showSelector(WEBGL && !REDUCED ? fromId : null)
      if (selector && selector.renderOnce) { selector.renderOnce(); selector.pause() }
    },
    onReveal: () => {
      if (selector && selector.resume) selector.resume()
    }
  })
  busy = false
}

// ————— Intro (accès direct par lien profond) —————

function showIntro() {
  const intro = $('#intro')
  if (!intro) return
  $('#intro-sub').textContent = `Guide de pose · ${CUR.label}`
  const openBook = () => {
    if (!book || book.opened) return
    sound.unlock()
    setTimeout(() => { if (sound.blocked) setSoundUI(false, true) }, 300)
    intro.classList.add('leaving')
    setTimeout(() => intro.remove(), 1000)
    rampLight()
    setTimeout(() => book.open(), REDUCED ? 0 : 380)
    setTimeout(() => {
      $('#topbar').classList.remove('ui-hidden')
      $('#bottombar').classList.remove('ui-hidden')
      showTapHint()
    }, REDUCED ? 0 : 900)
  }
  intro.addEventListener('click', openBook)
  intro.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') openBook()
  })
  window.__openIntroBook = openBook
}

// ————— Interface du livre —————

// Page réellement affichée d'un côté du spread (1-indexée), ou 0 si la
// face de ce côté n'est pas une page du guide (garde, merci…).
function pageAtSide(side) {
  const f = side === 'right' ? 2 * book.turned : 2 * book.turned - 1
  const p = f - 1
  return p >= 1 && p <= N ? p : 0
}

function onZoomChange(side) {
  const exitBtn = $('#zoom-exit')
  if (side) {
    const page = pageAtSide(side)
    const isGarde = page === 0 && side === 'left' && book.turned === 1
    exitBtn.hidden = false
    requestAnimationFrame(() => exitBtn.classList.add('show'))
    $('#page-indicator').textContent = isGarde ? 'Informations · détail' : `Page ${page} / ${N} · détail`
    $('#sr-live').textContent = isGarde
      ? 'Page d’informations en détail. Touchez la page pour la pleine résolution.'
      : `Page ${page} en détail. Touchez la page pour la pleine résolution, à côté pour revenir au livre.`
    hideTapHint()
    showSharpHint()
  } else {
    exitBtn.classList.remove('show')
    setTimeout(() => { exitBtn.hidden = true }, REDUCED ? 0 : 420)
    hideSharpHint()
    if (book) onSpreadChange(book.turned)
  }
}

// Indication permanente pendant le zoom : « touchez encore la page ».
function showSharpHint() {
  const hint = $('#sharp-hint')
  hint.hidden = false
  requestAnimationFrame(() => hint.classList.add('show'))
}
function hideSharpHint() {
  const hint = $('#sharp-hint')
  hint.classList.remove('show')
  setTimeout(() => { hint.hidden = true }, 600)
}

// Navigation page par page pendant le zoom (swipe, flèches, boutons).
function zoomNav(dir) {
  if (!book || !book.zoom) return
  const cur = pageAtSide(book.zoom.side)
  // Depuis la garde : seule la page 1 est à droite.
  if (!cur && book.zoom.side === 'left' && book.turned === 1) {
    if (dir > 0) book.zoomTo('right')
    return
  }
  if (!cur) return
  const target = cur + dir
  if (target < 1) {
    // Page 1 → retour sur la garde.
    if (cur === 1) book.zoomTo('left')
    return
  }
  if (target > N) return
  const T2 = spreadForPage(target)
  if (T2 > book.turned) book.next()
  else if (T2 < book.turned) book.prev()
  // Page impaire → face paire → côté droit du livre ouvert.
  book.zoomTo(target % 2 === 1 ? 'right' : 'left')
}

function onSpreadChange(T) {
  if (book && book.zoom) return // le libellé « détail » est géré par onZoomChange
  $('#page-indicator').textContent = spreadLabel(T, N)
  $('#sr-live').textContent = spreadLabel(T, N)
  const visible = pagesAtSpread(T, N)
  document.querySelectorAll('.toc-item').forEach((el) => {
    const p = el.dataset.page
    const active = p === 'cover' ? T === 0 : visible.includes(Number(p))
    el.classList.toggle('active', active)
  })
  const S = book ? book.S : 6
  $('#btn-prev').disabled = T <= 0
  $('#btn-next').disabled = T >= S
}

function buildToc() {
  const list = $('#toc-list')
  list.innerHTML = ''
  const cover = document.createElement('button')
  cover.className = 'toc-item'
  cover.dataset.page = 'cover'
  cover.innerHTML = `
    <span class="toc-cover"><svg viewBox="0 0 32 32"><path d="M16 2c5 8 10 12.5 10 19a10 10 0 1 1-20 0C6 14.5 11 10 16 2z"/></svg></span>
    <span class="toc-label">Couverture</span>`
  cover.addEventListener('click', () => { book.goTo(0); closeToc() })
  list.appendChild(cover)

  CUR.pages.forEach((src, i) => {
    const b = document.createElement('button')
    b.className = 'toc-item'
    b.dataset.page = String(i + 1)
    b.innerHTML = `
      <img src="${src}" alt="Page ${i + 1} : ${CUR.titles[i]}" loading="lazy" decoding="async">
      <span class="toc-label">${CUR.titles[i]}</span>`
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
  if (!book) return
  // La garde (mention de compatibilité) est la page de gauche du premier spread.
  if (side === 'left' && book.turned === 1) {
    lightbox.open(-1)
    return
  }
  const visible = pagesAtSpread(book.turned, N)
  if (!visible.length) return
  const page = side === 'left' ? visible[0] : visible[visible.length - 1]
  lightbox.open(page - 1)
}

function innerCoverUrlFor(id) {
  ensureGenUrls()
  return id === 'classique' ? genUrls.innerClassique : genUrls.innerThermostatique
}

function bindGlobalUI() {
  $('#btn-prev').addEventListener('click', () => book && (book.zoom ? zoomNav(-1) : book.prev()))
  $('#btn-next').addEventListener('click', () => book && (book.zoom ? zoomNav(1) : book.next()))
  $('#page-indicator').addEventListener('click', () => book && openToc())
  $('#toc-close').addEventListener('click', closeToc)
  $('#toc .toc-backdrop').addEventListener('click', closeToc)
  $('#zoom-exit').addEventListener('click', () => book && book.zoomExit && book.zoomExit())
  $('#btn-switch').addEventListener('click', switchModel)

  // Cartes du sélecteur
  for (const id of ['classique', 'thermostatique']) {
    const btn = document.querySelector(`#sel-${id}`)
    btn.addEventListener('click', () => pickBook(id))
    btn.addEventListener('mouseenter', () => selector && selector.setHover(id))
    btn.addEventListener('mouseleave', () => selector && selector.setHover(null))
    btn.addEventListener('focus', () => selector && selector.setHover(id))
    btn.addEventListener('blur', () => selector && selector.setHover(null))
  }

  // Son
  setSoundUI(sound.enabled, false)
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
    if (!book) return               // sélecteur : navigation native Tab/Entrée
    if (!book.opened && (e.key === 'Enter' || e.key === ' ')) {
      window.__openIntroBook && window.__openIntroBook()
      return
    }
    switch (e.key) {
      case 'ArrowRight': case 'PageDown': book.zoom ? zoomNav(1) : book.next(); break
      case 'ArrowLeft': case 'PageUp': book.zoom ? zoomNav(-1) : book.prev(); break
      case 'Home': book.goTo(0); break
      case 'End': book.goTo(book.S); break
      case 's': case 'S': $('#toc').hidden ? openToc() : closeToc(); break
      case 'Escape':
        if (book.zoom) book.zoomExit()
        else closeToc()
        break
      case 'f': case 'F': fsBtn.style.display !== 'none' && fsBtn.click(); break
      case 'm': case 'M': $('#btn-sound').click(); break
    }
  })

  // Parallaxe (desktop uniquement)
  if (window.matchMedia('(pointer: fine)').matches && !REDUCED) {
    window.addEventListener('pointermove', (e) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1
      const ny = (e.clientY / window.innerHeight) * 2 - 1
      book && book.setParallax && book.setParallax(nx, ny)
    })
  }

  // Molette : tourner les pages
  window.addEventListener('wheel', (e) => {
    if (!book || !book.opened || !lightbox.el.hidden || !$('#toc').hidden) return
    if (Math.abs(e.deltaY) < 18) return
    if (wheelLock) return
    wheelLock = true
    setTimeout(() => { wheelLock = false }, 650)
    if (book.zoom) zoomNav(e.deltaY > 0 ? 1 : -1)
    else e.deltaY > 0 ? book.next() : book.prev()
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
  if (!book || !('lightRamp' in book)) return
  if (REDUCED) { book.lightRamp = 1; return }
  const t0 = performance.now()
  const dur = 1600
  const tick = () => {
    if (!book) return
    const k = Math.min(1, (performance.now() - t0) / dur)
    book.lightRamp = k * k * (3 - 2 * k)
    if (k < 1) requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
}

let tapHintTimers = []
function showTapHint() {
  const hint = $('#tap-hint')
  tapHintTimers.push(setTimeout(() => {
    if (!book || book.zoom) return
    hint.hidden = false
    requestAnimationFrame(() => hint.classList.add('show'))
    tapHintTimers.push(setTimeout(hideTapHint, 5600))
  }, 1400))
}

function hideTapHint() {
  tapHintTimers.forEach(clearTimeout)
  tapHintTimers = []
  const hint = $('#tap-hint')
  hint.classList.remove('show')
  setTimeout(() => { hint.hidden = true }, 600)
}

// ————— Lightbox zoom pleine résolution —————

const lightbox = {
  el: $('#lightbox'),
  img: $('#lb-img'),
  stage: document.querySelector('#lightbox .lb-stage'),
  idx: 0, scale: 1, tx: 0, ty: 0,
  pointers: new Map(), pinch0: null, lastTap: 0,
  lastMid: null, multi: false,

  open(idx) {
    // idx = -1 : page de garde (mention de compatibilité).
    this.idx = idx
    this.scale = 1; this.tx = 0; this.ty = 0
    if (idx === -1) {
      this.img.src = innerCoverUrlFor(CUR.id)
      $('#lb-counter').textContent = `Informations — ${CUR.label}`
      $('#sr-live').textContent = 'Zoom sur la page d’informations du guide'
    } else {
      this.img.src = CUR.pages[idx]
      $('#lb-counter').textContent = `Page ${idx + 1} / ${N} — ${CUR.titles[idx]}`
      $('#sr-live').textContent = `Zoom sur la page ${idx + 1} : ${CUR.titles[idx]}`
    }
    this._apply()
    this.el.hidden = false
    requestAnimationFrame(() => this.el.classList.add('open'))
    hideSharpHint()
    showLbHint()
    // Rendu 3D en pause pendant la lecture : toute la fluidité va au zoom.
    if (book && book.pause) book.pause()
  },
  close() {
    if (this.el.hidden) return
    this.el.classList.remove('open')
    setTimeout(() => { this.el.hidden = true }, REDUCED ? 0 : 320)
    if (book && book.resume) book.resume()
  },
  show(idx) {
    if (idx < -1 || idx > N - 1) return
    this.open(idx)
  },
  _apply() {
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

// Indication de zoom dans la vue pleine résolution (max 3 fois).
let lbHintShown = 0
let lbHintTimer = null
function showLbHint() {
  if (lbHintShown >= 3) return
  lbHintShown++
  const coarse = window.matchMedia('(pointer: coarse)').matches
  $('#lb-hint-text').textContent = coarse
    ? 'Pincez pour zoomer où vous voulez, glissez pour vous déplacer'
    : 'Molette pour zoomer où vous voulez, cliquez-glissez pour vous déplacer'
  const hint = $('#lb-hint')
  hint.hidden = false
  clearTimeout(lbHintTimer)
  requestAnimationFrame(() => hint.classList.add('show'))
  lbHintTimer = setTimeout(() => {
    hint.classList.remove('show')
    setTimeout(() => { hint.hidden = true }, 600)
  }, 3600)
}

// iOS Safari : empêche le zoom natif de la page entière (le pincement doit
// zoomer la page du guide, pas l'interface). Sans cela, Safari « se bat »
// avec l'app pendant le pincement et peut interrompre le geste.
for (const ev of ['gesturestart', 'gesturechange', 'gestureend']) {
  document.addEventListener(ev, (e) => e.preventDefault(), { passive: false })
}
for (const el of [document.querySelector('#scene'), document.querySelector('#lightbox .lb-stage')]) {
  if (!el) continue
  el.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false })
  el.addEventListener('touchstart', (e) => { if (e.touches.length > 1) e.preventDefault() }, { passive: false })
}

$('#lb-close').addEventListener('click', () => lightbox.close())
$('#lightbox .lb-backdrop').addEventListener('click', () => lightbox.close())
$('#lb-prev').addEventListener('click', () => lightbox.show(lightbox.idx - 1))
$('#lb-next').addEventListener('click', () => lightbox.show(lightbox.idx + 1))

lightbox.stage.addEventListener('pointerdown', (e) => {
  lightbox.stage.setPointerCapture(e.pointerId)
  lightbox.pointers.set(e.pointerId, {
    x: e.clientX, y: e.clientY,
    x0: e.clientX, y0: e.clientY, t0: performance.now()
  })
  if (lightbox.pointers.size === 2) {
    const [a, b] = [...lightbox.pointers.values()]
    lightbox.pinch0 = { d: Math.hypot(a.x - b.x, a.y - b.y), s: lightbox.scale }
    lightbox.lastMid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
    lightbox.multi = true // geste à deux doigts : ne comptera jamais comme un tap
  }
})
lightbox.stage.addEventListener('pointermove', (e) => {
  const p = lightbox.pointers.get(e.pointerId)
  if (!p) return
  const dx = e.clientX - p.x
  const dy = e.clientY - p.y
  p.x = e.clientX
  p.y = e.clientY
  if (lightbox.pointers.size === 2 && lightbox.pinch0) {
    // Pincement : zoom autour du point médian ET suivi du déplacement des
    // doigts (zoomer et se déplacer dans le même geste).
    const [a, b] = [...lightbox.pointers.values()]
    const d = Math.hypot(a.x - b.x, a.y - b.y)
    const mx = (a.x + b.x) / 2
    const my = (a.y + b.y) / 2
    const target = Math.max(1, Math.min(4.2, lightbox.pinch0.s * (d / lightbox.pinch0.d)))
    lightbox.zoomAt(mx, my, target / lightbox.scale)
    lightbox.tx += mx - lightbox.lastMid.x
    lightbox.ty += my - lightbox.lastMid.y
    lightbox.lastMid = { x: mx, y: my }
    lightbox._apply()
  } else if (lightbox.pointers.size === 1 && lightbox.scale > 1) {
    lightbox.tx += dx
    lightbox.ty += dy
    lightbox._apply()
  }
})
const lbUp = (e) => {
  const p = lightbox.pointers.get(e.pointerId)
  lightbox.pointers.delete(e.pointerId)
  if (lightbox.pointers.size < 2) lightbox.pinch0 = null
  if (!p) return
  if (lightbox.pointers.size > 0) return
  // Tous les doigts sont levés.
  const wasMulti = lightbox.multi
  lightbox.multi = false
  if (wasMulti) { lightbox.lastTap = 0; return } // fin de pincement ≠ tap
  const moved = Math.hypot(p.x - p.x0, p.y - p.y0) > 12
  const dur = performance.now() - p.t0
  if (moved || dur > 350) { lightbox.lastTap = 0; return } // fin de glissement ≠ tap
  // Vrai tap : double-tap = zoom / dézoom.
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
  if (lightbox.pointers.size === 0) lightbox.multi = false
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
