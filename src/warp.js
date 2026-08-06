// Transition « voyage temporel » : tunnel de traînées lumineuses teal/cyan
// étirées radialement, gouttelettes aspirées vers le point de fuite, légère
// aberration chromatique. Canvas 2D plein écran, ~1,15 s.

const TEALS = ['#1795A5', '#2FB8C9', '#7FD4DE', '#CDEBEF']

export class Warp {
  constructor(canvas, { reduced }) {
    this.canvas = canvas
    this.reduced = reduced
    this.ctx = canvas.getContext('2d')
    this.light = window.matchMedia('(pointer: coarse)').matches
  }

  /**
   * Joue la transition. `onCover` est appelé une fois au moment où l'écran
   * est entièrement couvert (c'est là qu'on échange les scènes).
   */
  play({ onCover }) {
    if (this.reduced) return this._playFade(onCover)
    return this._playWarp(onCover)
  }

  _playFade(onCover) {
    // prefers-reduced-motion : simple fondu.
    const el = this.canvas
    el.style.display = 'block'
    el.style.transition = 'opacity 0.25s ease'
    el.style.background = '#05161d'
    el.style.opacity = '0'
    return new Promise((resolve) => {
      requestAnimationFrame(() => {
        el.style.opacity = '1'
        setTimeout(() => {
          onCover && onCover()
          setTimeout(() => {
            el.style.opacity = '0'
            setTimeout(() => {
              el.style.display = 'none'
              el.style.background = 'none'
              resolve()
            }, 260)
          }, 60)
        }, 280)
      })
    })
  }

  _playWarp(onCover) {
    const canvas = this.canvas
    const ctx = this.ctx
    const dpr = Math.min(window.devicePixelRatio || 1, this.light ? 1.5 : 2)
    const w = window.innerWidth
    const h = window.innerHeight
    canvas.width = Math.round(w * dpr)
    canvas.height = Math.round(h * dpr)
    canvas.style.display = 'block'
    canvas.style.opacity = '1'
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    const cx0 = w / 2
    const cy = h * 0.46
    const maxR = Math.hypot(cx0, cy) * 1.15

    const N = this.light ? 54 : 110
    const streaks = []
    for (let i = 0; i < N; i++) {
      streaks.push({
        a: Math.random() * Math.PI * 2,
        r: 0.02 * maxR + Math.random() * maxR,
        len: 0.05 + Math.random() * 0.16,     // fraction de maxR
        w: 0.8 + Math.random() * 2.2,
        c: TEALS[(Math.random() * TEALS.length) | 0],
        chroma: !this.light && Math.random() < 0.3
      })
    }
    const drops = []
    if (!this.light) {
      for (let i = 0; i < 26; i++) {
        drops.push({
          a: Math.random() * Math.PI * 2,
          r: maxR * (0.35 + Math.random() * 0.75),
          s: 0.6 + Math.random() * 1.4,
          size: 1 + Math.random() * 2.2
        })
      }
    }

    const DUR = 1650
    let t0 = performance.now()
    let covered = false

    return new Promise((resolve) => {
      const tick = () => {
        const t = (performance.now() - t0) / DUR
        if (t >= 1) {
          canvas.style.display = 'none'
          resolve()
          return
        }
        // Vitesse : accélération puis freinage doux
        const speed = Math.sin(Math.min(1, t) * Math.PI) ** 1.5
        // Opacité globale : montée rapide, plateau, retombée
        const alpha = t < 0.24 ? t / 0.24 : t > 0.74 ? Math.max(0, (1 - t) / 0.26) : 1
        // Zigzag : le point de fuite fouette de gauche à droite pendant
        // le voyage (secousses du tunnel).
        const cx = cx0 + Math.sin(t * Math.PI * 3.4) * w * 0.085 * Math.sin(Math.PI * Math.min(1, t)) * (this.light ? 0.75 : 1)

        if (!covered && t >= 0.42) {
          covered = true
          // L'échange de scènes peut être coûteux : on décale le chrono du
          // temps qu'il a pris pour que la sortie du tunnel se joue en entier.
          const b0 = performance.now()
          onCover && onCover()
          t0 += performance.now() - b0
        }

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        ctx.globalCompositeOperation = 'source-over'
        ctx.clearRect(0, 0, w, h)
        // Voile pétrole qui couvre la scène
        ctx.fillStyle = `rgba(3, 14, 18, ${0.96 * alpha})`
        ctx.fillRect(0, 0, w, h)
        // Halo au point de fuite
        const halo = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR * 0.5)
        halo.addColorStop(0, `rgba(47, 184, 201, ${0.20 * alpha})`)
        halo.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.fillStyle = halo
        ctx.fillRect(0, 0, w, h)

        ctx.globalCompositeOperation = 'lighter'
        for (const s of streaks) {
          s.r += speed * maxR * 0.055 * (0.5 + s.len * 3)
          if (s.r > maxR) s.r = 0.02 * maxR + Math.random() * 0.1 * maxR
          const r2 = s.r + s.len * maxR * (0.3 + speed * 2.2)
          const x1 = cx + Math.cos(s.a) * s.r
          const y1 = cy + Math.sin(s.a) * s.r
          const x2 = cx + Math.cos(s.a) * r2
          const y2 = cy + Math.sin(s.a) * r2
          const grad = ctx.createLinearGradient(x1, y1, x2, y2)
          grad.addColorStop(0, 'rgba(0,0,0,0)')
          grad.addColorStop(0.6, s.c)
          grad.addColorStop(1, 'rgba(255,255,255,0.9)')
          ctx.globalAlpha = alpha * 0.85
          ctx.strokeStyle = grad
          ctx.lineWidth = s.w
          ctx.beginPath()
          ctx.moveTo(x1, y1)
          ctx.lineTo(x2, y2)
          ctx.stroke()
          if (s.chroma) {
            // Légère aberration chromatique : double trait décalé
            ctx.globalAlpha = alpha * 0.35
            ctx.strokeStyle = '#4FE0F2'
            ctx.lineWidth = s.w * 0.8
            const da = 0.004
            ctx.beginPath()
            ctx.moveTo(cx + Math.cos(s.a + da) * s.r, cy + Math.sin(s.a + da) * s.r)
            ctx.lineTo(cx + Math.cos(s.a + da) * r2, cy + Math.sin(s.a + da) * r2)
            ctx.stroke()
          }
        }
        // Gouttelettes aspirées vers le point de fuite
        ctx.globalAlpha = alpha * 0.7
        ctx.fillStyle = '#9FD8E0'
        for (const d of drops) {
          d.r -= speed * maxR * 0.03 * d.s
          if (d.r < maxR * 0.04) d.r = maxR * (0.6 + Math.random() * 0.5)
          const x = cx + Math.cos(d.a) * d.r
          const y = cy + Math.sin(d.a) * d.r
          ctx.beginPath()
          ctx.arc(x, y, d.size * (0.4 + d.r / maxR), 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.globalAlpha = 1
        requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    })
  }
}
