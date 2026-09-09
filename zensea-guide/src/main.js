// Orchestration : écran d'entrée → déverrouillage du son et du gyroscope →
// voile de brume → descente dans la forêt → interface.

import { Foret } from './foret.js'
import { Ambiance } from './ambiance.js'

const $ = s => document.querySelector(s)
const params = new URLSearchParams(location.search)
const mobile = matchMedia('(pointer: coarse)').matches || /iPhone|iPad|Android/i.test(navigator.userAgent)
const reduit = matchMedia('(prefers-reduced-motion: reduce)').matches

const entry = $('#entry'), hud = $('#hud'), veil = $('#veil'), hint = $('#entry-hint')
const btnSon = $('#enter-sound'), btnSilence = $('#enter-silent'), toggle = $('#sound-toggle')
const lookHint = $('#look-hint'), choose = $('#choose'), walk = $('#walk')

const ambiance = new Ambiance()
let foret = null
let webgl = !params.has('no3d')

// ---- Scène ---------------------------------------------------------------
try {
  if (webgl) foret = new Foret($('#scene'), { mobile })
} catch (e) {
  console.warn('WebGL indisponible, repli 2D :', e)
  webgl = false
}
if (!webgl) {
  $('#scene').hidden = true
  $('#fallback').hidden = false
}

// Le panorama se charge pendant que l'écran d'entrée est affiché. Le bouton
// n'est actif qu'une fois la forêt prête : on n'entre jamais dans le noir.
const pret = (async () => {
  if (foret) {
    // 4K partout (33 Mo en mémoire graphique : dans le budget d'un iPhone),
    // 6K sur les machines qui l'acceptent. Le flou du 2K venait de là : sur
    // un téléphone on ne voit que 82° du panorama, soit un cinquième des
    // pixels étirés sur toute la largeur de l'écran.
    const url = (!mobile && foret.maxTexture >= 6144) ? './foret/vondel-6k.jpg' : './foret/vondel-4k.jpg'
    await foret.charger(url)
  }
  hint.textContent = mobile ? 'Inclinez votre téléphone une fois dans la forêt' : 'La forêt est prête'
  btnSon.disabled = false; btnSilence.disabled = false
})().catch(err => {
  console.error(err)
  hint.textContent = 'La forêt met du temps à charger… vérifiez votre connexion.'
})
btnSon.disabled = true; btnSilence.disabled = true

if (foret) {
  let raf
  const boucle = () => { foret.rendu(); raf = requestAnimationFrame(boucle) }
  boucle()
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) cancelAnimationFrame(raf); else boucle()
  })
}

// ---- Entrée --------------------------------------------------------------
let entre = false
async function entrer(avecSon) {
  if (entre) return
  entre = true
  await pret

  // Tout ce qui exige un geste utilisateur se fait ici, dans le clic.
  if (avecSon && ambiance.unlock()) {
    ambiance.start(6)
    ambiance.rafale(1)
    toggle.setAttribute('aria-pressed', 'true')
  } else {
    toggle.setAttribute('aria-pressed', 'false')
  }
  if (foret && mobile) foret.activerGyro().catch(() => {})

  // 1. Le titre s'enfonce, l'arrière-plan s'approche.
  entry.classList.add('is-leaving')
  // 2. La brume monte et recouvre tout.
  // Appliqué de façon synchrone (lecture forcée de la mise en page entre les
  // deux) : un requestAnimationFrame peut arriver après le minuteur suivant
  // sur une machine qui rame, et le voile resterait alors opaque.
  veil.style.transition = 'opacity 1.4s cubic-bezier(.4,0,.6,1)'
  void veil.offsetHeight
  veil.style.opacity = '1'
  await attendre(1500)
  entry.remove()
  hud.hidden = false

  // 3. La brume se dissipe sur la descente dans la forêt.
  veil.style.transition = 'opacity 3.2s cubic-bezier(.3,0,.2,1)'
  veil.style.opacity = '0'
  const duree = reduit ? 800 : 5200
  const t0 = performance.now()
  await new Promise(res => {
    const step = () => {
      const p = Math.min(1, (performance.now() - t0) / duree)
      foret?.setIntro(p)
      if (p < 1) requestAnimationFrame(step); else res()
    }
    step()
  })

  // 4. L'interface se pose.
  hud.classList.add('is-live')
  lookHint.textContent = foret?.gyroBrut
    ? 'Inclinez le téléphone ou glissez pour regarder · double appui pour recentrer'
    : (mobile ? 'Glissez pour regarder autour de vous' : 'Glissez pour regarder · maintenez ↑ ou Z pour marcher')
  await attendre(4500)
  hud.classList.add('is-settled')
}

btnSon.addEventListener('click', () => entrer(true))
btnSilence.addEventListener('click', () => entrer(false))

// Un glissé dans la forêt fait disparaître l'indication plus tôt.
if (foret) foret.onInteraction = () => { if (hud.classList.contains('is-live')) hud.classList.add('is-settled') }

// ---- Marche --------------------------------------------------------------
// Un appui lance la marche, un autre l'arrête ; si on maintient le bouton
// plus d'un instant, relâcher arrête aussi. Les deux gestes marchent, parce
// que les deux sont naturels. Au clavier : ↑, Z ou W maintenus.
if (foret) {
  foret.onPas = (pan, force) => ambiance.pas(pan, force)
  const va = on => {
    foret.marche = on
    walk.classList.toggle('is-on', on)
    walk.querySelector('span').textContent = on ? 'Stop' : 'Marcher'
    walk.setAttribute('aria-pressed', on ? 'true' : 'false')
  }
  let tAppui = 0
  walk.addEventListener('pointerdown', e => {
    e.preventDefault(); e.stopPropagation()
    tAppui = performance.now()
    va(!foret.marche)
  })
  walk.addEventListener('pointerup', e => {
    e.preventDefault()
    // Maintenu longtemps : c'était une marche « tant que j'appuie ».
    if (foret.marche && performance.now() - tAppui > 450) va(false)
  })
  walk.addEventListener('click', e => e.preventDefault())
  window.addEventListener('keydown', e => { if (['ArrowUp', 'KeyW', 'KeyZ'].includes(e.code) && !e.repeat) { va(true); e.preventDefault() } })
  window.addEventListener('keyup', e => { if (['ArrowUp', 'KeyW', 'KeyZ'].includes(e.code)) va(false) })
  window.addEventListener('blur', () => va(false))
  document.addEventListener('visibilitychange', () => { if (document.hidden) va(false) })
  // Au bout du chemin, la marche s'arrête d'elle-même.
  foret.onArret = () => va(false)
}

// ---- Son -----------------------------------------------------------------
toggle.addEventListener('click', () => {
  const on = toggle.getAttribute('aria-pressed') === 'true'
  if (on) { ambiance.stop(); toggle.setAttribute('aria-pressed', 'false') }
  else {
    if (ambiance.unlock()) { ambiance.start(2.5); toggle.setAttribute('aria-pressed', 'true') }
  }
})
document.addEventListener('visibilitychange', () => {
  if (!ambiance.ctx) return
  if (document.hidden) ambiance.ctx.suspend(); else if (ambiance.enabled) ambiance.ctx.resume()
})

// ---- Étape suivante (à brancher : choix du handpan) ----------------------
// Le bouton est en place ; l'écran de choix sera ajouté quand les visuels et
// les sons des handpans seront livrés.
choose.addEventListener('click', () => {
  toast('Le choix du handpan arrive ici — la suite du voyage.')
})

let toastEl, toastTimer
function toast(msg) {
  if (!toastEl) { toastEl = document.createElement('p'); toastEl.className = 'toast'; document.body.appendChild(toastEl) }
  toastEl.textContent = msg
  requestAnimationFrame(() => toastEl.classList.add('is-on'))
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => toastEl.classList.remove('is-on'), 2800)
}

const attendre = ms => new Promise(r => setTimeout(r, ms))
