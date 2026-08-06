// Génère public/og-cover.jpg (1200 × 630) — l'aperçu du lien WhatsApp/réseaux.
// Rendu via Chromium pour bénéficier des vraies typographies.
import { chromium } from 'playwright'
import { fileURLToPath } from 'url'
import path from 'path'
import fs from 'fs'
import os from 'os'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const f = (p) => 'file://' + path.join(root, p)

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
  @font-face { font-family: 'Cormorant Garamond'; font-weight: 600;
    src: url('${f('src/assets/fonts/CormorantGaramond-600.woff2')}') format('woff2'); }
  @font-face { font-family: 'Cormorant Garamond'; font-weight: 500; font-style: italic;
    src: url('${f('src/assets/fonts/CormorantGaramond-500i.woff2')}') format('woff2'); }
  @font-face { font-family: 'Poppins'; font-weight: 300;
    src: url('${f('src/assets/fonts/Poppins-300.woff2')}') format('woff2'); }
  @font-face { font-family: 'Poppins'; font-weight: 400;
    src: url('${f('src/assets/fonts/Poppins-400.woff2')}') format('woff2'); }
  * { margin: 0; box-sizing: border-box; }
  body { width: 1200px; height: 630px; overflow: hidden; position: relative;
    background: linear-gradient(115deg, #12808F 0%, #0F6673 55%, #0A4650 100%);
    font-family: 'Poppins', sans-serif; }
  .sheen { position: absolute; inset: 0;
    background: radial-gradient(80% 90% at 18% 8%, rgba(255,255,255,0.14), transparent 60%); }
  .left { position: absolute; left: 74px; top: 0; height: 100%; width: 560px;
    display: flex; flex-direction: column; justify-content: center; color: #fff; }
  .drop { width: 46px; height: 46px; margin-bottom: 26px; }
  h1 { font-family: 'Cormorant Garamond', serif; font-weight: 600; font-size: 62px;
    letter-spacing: 0.34em; }
  .tag { font-weight: 300; font-size: 19px; letter-spacing: 0.3em; color: #CDEBEF;
    text-transform: uppercase; margin: 14px 0 38px; }
  .sep { width: 68px; height: 2px; background: rgba(255,255,255,0.5); margin-bottom: 38px; }
  h2 { font-family: 'Cormorant Garamond', serif; font-style: italic; font-weight: 500;
    font-size: 64px; margin-bottom: 10px; }
  h3 { font-weight: 400; font-size: 30px; color: #D9F1F4; }
  .sub { font-weight: 300; font-size: 20px; color: rgba(255,255,255,0.75); margin-top: 30px; }
  .page { position: absolute; right: 86px; top: 68px; width: 350px;
    transform: rotate(4deg);
    border-radius: 6px; box-shadow: 0 40px 80px rgba(0, 20, 25, 0.55); }
  .glow { position: absolute; right: 30px; top: 40px; width: 480px; height: 560px;
    background: radial-gradient(50% 50% at 50% 50%, rgba(0,0,0,0.25), transparent 70%); }
</style></head><body>
  <div class="sheen"></div>
  <div class="glow"></div>
  <img class="page" src="${f('src/assets/pages/page-01.jpg')}">
  <div class="left">
    <svg class="drop" viewBox="0 0 32 32"><path d="M16 2c5 8 10 12.5 10 19a10 10 0 1 1-20 0C6 14.5 11 10 16 2z" fill="#fff"/></svg>
    <h1>HYDELIS</h1>
    <div class="tag">L'eau sublimée</div>
    <div class="sep"></div>
    <h2>Guide de pose</h2>
    <h3>Colonne de douche</h3>
    <div class="sub">Guide interactif — 7 étapes, sans plombier.</div>
  </div>
</body></html>`

// Un vrai fichier est nécessaire : Chromium bloque les sous-ressources file://
// depuis une page créée par setContent.
const tmp = path.join(os.tmpdir(), 'hydelis-og.html')
fs.writeFileSync(tmp, html)

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } })
await page.goto('file://' + tmp, { waitUntil: 'networkidle' })
await page.waitForTimeout(600)
await page.screenshot({ path: path.join(root, 'public/og-cover.jpg'), type: 'jpeg', quality: 88 })
await browser.close()
console.log('public/og-cover.jpg généré')
