// Faces générées du livre : couverture, gardes, page « Merci », quatrième de couverture.
// Dessinées sur canvas avec la charte Hydelis — aucune image à télécharger.

const W = 1024
const H = 1447 // même rapport que les pages scannées (1055 × 1491)

function makeCanvas() {
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  return c
}

// Goutte Hydelis (logo).
function drawDrop(ctx, x, y, s, fill) {
  ctx.save()
  ctx.translate(x, y)
  ctx.beginPath()
  ctx.moveTo(0, -s)
  ctx.bezierCurveTo(0.10 * s, -0.62 * s, 0.62 * s, -0.24 * s, 0.62 * s, 0.28 * s)
  ctx.bezierCurveTo(0.62 * s, 0.72 * s, 0.32 * s, 1.0 * s, 0, 1.0 * s)
  ctx.bezierCurveTo(-0.32 * s, 1.0 * s, -0.62 * s, 0.72 * s, -0.62 * s, 0.28 * s)
  ctx.bezierCurveTo(-0.62 * s, -0.24 * s, -0.10 * s, -0.62 * s, 0, -s)
  ctx.closePath()
  ctx.fillStyle = fill
  ctx.fill()
  // Reflet
  ctx.beginPath()
  ctx.ellipse(-0.22 * s, 0.30 * s, 0.10 * s, 0.22 * s, 0.35, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(255,255,255,0.35)'
  ctx.fill()
  ctx.restore()
}

// Texte centré avec interlettrage manuel (letterSpacing canvas n'est pas universel).
function spacedText(ctx, text, cx, y, spacing) {
  const widths = [...text].map((ch) => ctx.measureText(ch).width)
  const total = widths.reduce((a, b) => a + b, 0) + spacing * (text.length - 1)
  let x = cx - total / 2
  ;[...text].forEach((ch, i) => {
    ctx.fillText(ch, x, y)
    x += widths[i] + spacing
  })
}

function tealBackground(ctx, from, to) {
  const g = ctx.createLinearGradient(0, 0, W * 0.25, H)
  g.addColorStop(0, from)
  g.addColorStop(1, to)
  ctx.fillStyle = g
  ctx.fillRect(0, 0, W, H)
  // Sheen doux en haut
  const sheen = ctx.createRadialGradient(W * 0.3, H * 0.08, 60, W * 0.3, H * 0.08, W * 0.95)
  sheen.addColorStop(0, 'rgba(255,255,255,0.10)')
  sheen.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = sheen
  ctx.fillRect(0, 0, W, H)
  // Grande goutte en filigrane
  ctx.save()
  ctx.globalAlpha = 0.05
  drawDrop(ctx, W * 0.82, H * 0.86, 330, '#ffffff')
  ctx.restore()
}

function frame(ctx, inset, color, width) {
  ctx.strokeStyle = color
  ctx.lineWidth = width
  ctx.strokeRect(inset, inset, W - 2 * inset, H - 2 * inset)
}

// Picto température : goutte accompagnée d'un thermomètre.
function drawThermoPicto(ctx, x, y, s, fill) {
  drawDrop(ctx, x - 0.55 * s, y, 0.85 * s, fill)
  ctx.save()
  ctx.translate(x + 0.55 * s, y)
  ctx.strokeStyle = fill
  ctx.fillStyle = fill
  ctx.lineWidth = 0.16 * s
  ctx.lineCap = 'round'
  // Tube
  ctx.beginPath()
  ctx.moveTo(0, -0.85 * s)
  ctx.lineTo(0, 0.42 * s)
  ctx.stroke()
  // Réservoir
  ctx.beginPath()
  ctx.arc(0, 0.62 * s, 0.3 * s, 0, Math.PI * 2)
  ctx.fill()
  // Graduations
  ctx.lineWidth = 0.09 * s
  for (const gy of [-0.62, -0.3, 0.02]) {
    ctx.beginPath()
    ctx.moveTo(0.18 * s, gy * s)
    ctx.lineTo(0.42 * s, gy * s)
    ctx.stroke()
  }
  ctx.restore()
}

export function makeCoverCanvas({ title, subtitle, picto } = {}) {
  const c = makeCanvas()
  const ctx = c.getContext('2d')
  tealBackground(ctx, '#12717F', '#082F38')
  frame(ctx, 44, 'rgba(255,255,255,0.30)', 2.5)
  frame(ctx, 54, 'rgba(255,255,255,0.12)', 1)

  ctx.textBaseline = 'alphabetic'
  if (picto === 'thermo') {
    drawThermoPicto(ctx, W / 2, 330, 74, 'rgba(255,255,255,0.95)')
  } else {
    drawDrop(ctx, W / 2, 330, 74, 'rgba(255,255,255,0.95)')
  }

  ctx.fillStyle = '#F4FAFB'
  ctx.font = '600 118px "Cormorant Garamond", serif'
  spacedText(ctx, 'HYDELIS', W / 2, 560, 34)

  ctx.fillStyle = 'rgba(214,238,241,0.85)'
  ctx.font = '300 33px "Poppins", sans-serif'
  spacedText(ctx, "L'EAU SUBLIMÉE", W / 2, 632, 13)

  // Séparateur
  ctx.strokeStyle = 'rgba(255,255,255,0.4)'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(W / 2 - 60, 730)
  ctx.lineTo(W / 2 + 60, 730)
  ctx.stroke()

  ctx.fillStyle = '#FFFFFF'
  ctx.font = 'italic 500 108px "Cormorant Garamond", serif'
  ctx.textAlign = 'center'
  ctx.fillText('Guide de pose', W / 2, 880)

  const titleText = title || 'Colonne de douche'
  ctx.font = `400 ${titleText.length > 18 ? 36 : 42}px "Poppins", sans-serif`
  ctx.fillStyle = '#9FD8E0'
  ctx.fillText(titleText, W / 2, 960)

  ctx.font = '300 28px "Poppins", sans-serif'
  ctx.fillStyle = 'rgba(214,238,241,0.55)'
  ctx.fillText(subtitle || 'avec étagère intégrée et jet d’hygiène', W / 2, 1014)

  ctx.textAlign = 'left'
  ctx.fillStyle = 'rgba(214,238,241,0.6)'
  ctx.font = '300 27px "Poppins", sans-serif'
  spacedText(ctx, 'HYDELIS.FR', W / 2, H - 96, 9)
  return c
}

function paperBackground(ctx) {
  const g = ctx.createLinearGradient(0, 0, 0, H)
  g.addColorStop(0, '#FAFCFC')
  g.addColorStop(1, '#EEF3F4')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, W, H)
}

export function makeInnerCoverCanvas() {
  const c = makeCanvas()
  const ctx = c.getContext('2d')
  paperBackground(ctx)
  ctx.save()
  ctx.globalAlpha = 0.055
  drawDrop(ctx, W / 2, H * 0.46, 300, '#0F6673')
  ctx.restore()
  ctx.textAlign = 'center'
  ctx.fillStyle = 'rgba(17,51,59,0.55)'
  ctx.font = '600 44px "Cormorant Garamond", serif'
  spacedText(ctx, 'HYDELIS', W / 2, H * 0.82, 16)
  ctx.font = '300 21px "Poppins", sans-serif'
  ctx.fillStyle = 'rgba(17,51,59,0.4)'
  spacedText(ctx, "L'EAU SUBLIMÉE", W / 2, H * 0.82 + 46, 8)
  return c
}

export function makeInnerBackCanvas() {
  const c = makeCanvas()
  const ctx = c.getContext('2d')
  paperBackground(ctx)
  ctx.textAlign = 'center'
  drawDrop(ctx, W / 2, H * 0.40, 60, 'rgba(15,102,115,0.85)')
  ctx.fillStyle = 'rgba(17,51,59,0.75)'
  ctx.font = '500 46px "Cormorant Garamond", serif'
  ctx.fillText('Garantie 24 mois sur toute la gamme', W / 2, H * 0.52)
  ctx.font = '300 26px "Poppins", sans-serif'
  ctx.fillStyle = 'rgba(17,51,59,0.5)'
  ctx.fillText('Service client français 7j/7 · 9 h – 18 h', W / 2, H * 0.57)
  return c
}

// Page « Merci » (dernière page intérieure) et quatrième de couverture.
function thanksDesign(ctx, withFrame) {
  const g = ctx.createLinearGradient(0, 0, W * 0.3, H)
  g.addColorStop(0, '#12808F')
  g.addColorStop(1, '#0F6673')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, W, H)
  const sheen = ctx.createRadialGradient(W * 0.5, H * 0.1, 50, W * 0.5, H * 0.1, W)
  sheen.addColorStop(0, 'rgba(255,255,255,0.09)')
  sheen.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = sheen
  ctx.fillRect(0, 0, W, H)
  if (withFrame) {
    frame(ctx, 44, 'rgba(255,255,255,0.28)', 2.5)
  }

  ctx.textAlign = 'center'
  drawDrop(ctx, W / 2, 360, 80, 'rgba(255,255,255,0.95)')

  ctx.fillStyle = '#FFFFFF'
  ctx.font = 'italic 500 86px "Cormorant Garamond", serif'
  ctx.fillText('Merci d’avoir choisi', W / 2, 590)
  ctx.font = '600 112px "Cormorant Garamond", serif'
  spacedText(ctx, 'HYDELIS', W / 2, 720, 30)

  ctx.font = '300 30px "Poppins", sans-serif'
  ctx.fillStyle = 'rgba(255,255,255,0.85)'
  ctx.fillText('Nous vous souhaitons une expérience', W / 2, 810)
  ctx.fillText('d’eau sublimée au quotidien.', W / 2, 856)

  // Carte contacts
  const cw = 640
  const ch = 300
  const cx = (W - cw) / 2
  const cy = 950
  ctx.fillStyle = 'rgba(255,255,255,0.10)'
  ctx.strokeStyle = 'rgba(255,255,255,0.30)'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.roundRect(cx, cy, cw, ch, 22)
  ctx.fill()
  ctx.stroke()

  ctx.font = '500 30px "Poppins", sans-serif'
  ctx.fillStyle = '#FFFFFF'
  ctx.fillText('SAV WhatsApp — +33 7 56 88 21 12', W / 2, cy + 84)
  ctx.font = '300 30px "Poppins", sans-serif'
  ctx.fillStyle = 'rgba(255,255,255,0.9)'
  ctx.fillText('contact@hydelis.fr', W / 2, cy + 156)
  ctx.fillText('hydelis.fr', W / 2, cy + 228)

  ctx.font = '300 24px "Poppins", sans-serif'
  ctx.fillStyle = 'rgba(255,255,255,0.55)'
  ctx.fillText('Service client français 7j/7 · 9 h – 18 h', W / 2, H - 110)
}

export function makeThanksCanvas() {
  const c = makeCanvas()
  thanksDesign(c.getContext('2d'), false)
  return c
}

export function makeBackCoverCanvas() {
  const c = makeCanvas()
  thanksDesign(c.getContext('2d'), true)
  return c
}

// Tranche du livre (bords de pages empilées) pour les blocs 3D.
export function makePaperEdgeCanvas() {
  const c = document.createElement('canvas')
  c.width = 128
  c.height = 64
  const ctx = c.getContext('2d')
  ctx.fillStyle = '#E8ECED'
  ctx.fillRect(0, 0, 128, 64)
  for (let y = 2; y < 64; y += 3) {
    ctx.fillStyle = y % 2 ? 'rgba(150,165,168,0.35)' : 'rgba(255,255,255,0.5)'
    ctx.fillRect(0, y, 128, 1)
  }
  return c
}
