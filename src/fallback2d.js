// Fallback sans WebGL : flipbook CSS 3D double page, même modèle de feuilles
// que le livre 3D (6 feuilles, 12 faces).

import { PAGE_RATIO } from './pages.js'

export class Book2D {
  /**
   * @param {Object} o
   * @param {HTMLElement} o.container
   * @param {string[]} o.faces   12 URLs (recto/verso des 6 feuilles)
   * @param {boolean} o.reduced
   * @param {Object} o.on        { change, turnStart, doubleTap }
   */
  constructor({ container, faces, reduced, on = {} }) {
    this.container = container
    this.faces = faces
    this.on = on
    this.reduced = reduced
    this.T = 0
    this.animating = false
    this.opened = false

    container.innerHTML = `
      <div class="fb-book">
        <div class="fb-page fb-left"><img alt="" draggable="false"></div>
        <div class="fb-page fb-right"><img alt="" draggable="false"></div>
      </div>`
    this.book = container.querySelector('.fb-book')
    this.left = container.querySelector('.fb-left')
    this.right = container.querySelector('.fb-right')
    this.leftImg = this.left.querySelector('img')
    this.rightImg = this.right.querySelector('img')

    this._resize()
    window.addEventListener('resize', () => this._resize())
    this._bind()
    this._render()
  }

  _resize() {
    const vw = window.innerWidth
    const vh = window.innerHeight
    const availW = Math.min(vw - 32, 1150)
    const availH = vh - 150
    let pageH = availH
    let pageW = pageH * PAGE_RATIO
    if (pageW * 2 > availW) {
      pageW = availW / 2
      pageH = pageW / PAGE_RATIO
    }
    this.pageW = Math.floor(pageW)
    this.pageH = Math.floor(pageH)
    for (const el of [this.left, this.right]) {
      el.style.width = this.pageW + 'px'
      el.style.height = this.pageH + 'px'
    }
  }

  _render() {
    const T = this.T
    const leftFace = T > 0 ? this.faces[2 * T - 1] : null
    const rightFace = T < 6 ? this.faces[2 * T] : null
    this.left.style.visibility = leftFace ? 'visible' : 'hidden'
    this.right.style.visibility = rightFace ? 'visible' : 'hidden'
    if (leftFace) this.leftImg.src = leftFace
    if (rightFace) this.rightImg.src = rightFace
    this.book.classList.toggle('fb-closed-cover', T === 0 || T === 6)
  }

  get turned() { return this.T }

  open() { this.opened = true; this.next() }

  next() { return this._turn(1) }
  prev() { return this._turn(-1) }

  goTo(T2) {
    T2 = Math.max(0, Math.min(6, T2))
    if (T2 === this.T || this.animating) return
    // Saut direct (les sauts multi-pages ne sont pas animés dans le fallback).
    const dir = T2 > this.T ? 1 : -1
    this.T = T2
    this.on.turnStart && this.on.turnStart(dir, false)
    this.on.change && this.on.change(this.T)
    this._render()
  }

  _turn(dir) {
    if (this.animating) return false
    const T = this.T
    if (dir > 0 && T >= 6) return false
    if (dir < 0 && T <= 0) return false

    const stiff = (dir > 0 && T === 0) || (dir < 0 && T === 1) ||
                  (dir > 0 && T === 5) || (dir < 0 && T === 6)
    this.on.turnStart && this.on.turnStart(dir, stiff)

    if (this.reduced) {
      this.T += dir
      this._render()
      this.on.change && this.on.change(this.T)
      return true
    }

    this.animating = true
    const sheetIdx = dir > 0 ? T : T - 1
    const front = this.faces[2 * sheetIdx]
    const back = this.faces[2 * sheetIdx + 1]

    const sheet = document.createElement('div')
    sheet.className = 'fb-sheet'
    sheet.style.width = this.pageW + 'px'
    sheet.innerHTML = `
      <div class="fb-face fb-front"><img src="${front}" alt="" draggable="false"></div>
      <div class="fb-face fb-back"><img src="${back}" alt="" draggable="false"></div>
      <div class="fb-shade"></div>`
    this.book.appendChild(sheet)
    const shade = sheet.querySelector('.fb-shade')

    if (dir > 0) {
      // La page de droite se rabat vers la gauche.
      this.rightImg.src = T + 1 < 6 ? this.faces[2 * (T + 1)] : ''
      this.right.style.visibility = T + 1 < 6 ? 'visible' : 'hidden'
      sheet.style.transform = 'rotateY(0deg)'
      requestAnimationFrame(() => requestAnimationFrame(() => {
        sheet.style.transform = 'rotateY(-180deg)'
        shade.style.opacity = '1'
      }))
    } else {
      this.leftImg.src = T - 1 > 0 ? this.faces[2 * (T - 1) - 1] : ''
      this.left.style.visibility = T - 1 > 0 ? 'visible' : 'hidden'
      sheet.style.transform = 'rotateY(-180deg)'
      requestAnimationFrame(() => requestAnimationFrame(() => {
        sheet.style.transform = 'rotateY(0deg)'
        shade.style.opacity = '1'
      }))
    }

    const done = () => {
      sheet.remove()
      this.T += dir
      this.animating = false
      this._render()
      this.on.change && this.on.change(this.T)
    }
    sheet.addEventListener('transitionend', done, { once: true })
    setTimeout(() => { if (this.animating) done() }, 1100)
    return true
  }

  _bind() {
    let last = null
    this.container.addEventListener('pointerdown', (e) => {
      if (!this.opened) return
      this.px = e.clientX
      this.pt = performance.now()
    })
    this.container.addEventListener('pointerup', (e) => {
      if (!this.opened || this.px == null) return
      const dx = e.clientX - this.px
      const dt = performance.now() - this.pt
      this.px = null
      if (Math.abs(dx) > 45 && dt < 650) {
        dx < 0 ? this.next() : this.prev()
        return
      }
      if (Math.abs(dx) > 12) return
      const now = performance.now()
      const mid = window.innerWidth / 2
      if (last && now - last.t < 320 && Math.abs(e.clientX - last.x) < 44) {
        clearTimeout(last.timer)
        last = null
        this.on.doubleTap && this.on.doubleTap(e.clientX >= mid ? 'right' : 'left')
        return
      }
      const cx = e.clientX
      const timer = setTimeout(() => {
        last = null
        const side = cx >= mid ? 'right' : 'left'
        const idx = side === 'right' ? (this.T < 6 ? 2 * this.T : -1)
          : (this.T > 0 ? 2 * this.T - 1 : -1)
        if (idx >= 2 && idx <= 8) {
          // Une vraie page du guide : vue détail.
          this.on.doubleTap && this.on.doubleTap(side)
        } else {
          side === 'right' ? this.next() : this.prev()
        }
      }, 300)
      last = { t: now, x: e.clientX, timer }
    })
  }

  setParallax() {}
  set lightRamp(_) {}
  get lightRamp() { return 1 }
}
