// Vérification : sélecteur, warp, deux livres, deep links, fallback.
import { chromium } from 'playwright'
import { execSync, spawn } from 'child_process'
const OUT = process.env.OUT || 'shots'
execSync(`mkdir -p ${OUT}`)
const server = spawn('npx', ['serve', '-p', '4181', 'dist'], { cwd: process.cwd(), stdio: 'ignore' })
for (let i = 0; i < 30; i++) { try { await fetch('http://127.0.0.1:4181/'); break } catch { await new Promise(r => setTimeout(r, 1000)) } }
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=angle', '--enable-unsafe-swiftshader'] })

async function ctxPage(mobile) {
  const ctx = await browser.newContext({
    viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 },
    deviceScaleFactor: mobile ? 2 : 1, isMobile: mobile, hasTouch: mobile
  })
  const page = await ctx.newPage()
  page.on('pageerror', (e) => console.log('PAGEERROR', String(e).slice(0, 300)))
  return { ctx, page }
}

// 1. Racine desktop : sélecteur + warp + livre thermostatique
{
  const { ctx, page } = await ctxPage(false)
  await page.goto('http://127.0.0.1:4181/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(2500)
  await page.screenshot({ path: `${OUT}/1-selector-desktop.png` })
  await page.hover('#sel-thermostatique')
  await page.waitForTimeout(900)
  await page.screenshot({ path: `${OUT}/2-selector-hover.png` })
  await page.click('#sel-thermostatique')
  await page.waitForTimeout(500)
  await page.screenshot({ path: `${OUT}/3-warp-mid.png` })
  await page.waitForTimeout(2600)
  await page.screenshot({ path: `${OUT}/4-thermo-open.png` })
  await page.keyboard.press('End')
  await page.waitForTimeout(4000)
  await page.screenshot({ path: `${OUT}/5-thermo-end.png` })
  // Retour au sélecteur
  await page.click('#btn-switch')
  await page.waitForTimeout(2400)
  await page.screenshot({ path: `${OUT}/6-back-to-selector.png` })
  await ctx.close()
}
// 2. Deep link classique mobile : expérience d'origine
{
  const { ctx, page } = await ctxPage(true)
  await page.goto('http://127.0.0.1:4181/#classique', { waitUntil: 'networkidle' })
  await page.waitForTimeout(2000)
  await page.screenshot({ path: `${OUT}/7-deeplink-classique-intro.png` })
  await page.click('body', { position: { x: 195, y: 422 } })
  await page.waitForTimeout(3500)
  await page.screenshot({ path: `${OUT}/8-classique-open.png` })
  await ctx.close()
}
// 3. Deep link thermo mobile + sélecteur mobile
{
  const { ctx, page } = await ctxPage(true)
  await page.goto('http://127.0.0.1:4181/#thermostatique', { waitUntil: 'networkidle' })
  await page.waitForTimeout(2000)
  await page.click('body', { position: { x: 195, y: 422 } })
  await page.waitForTimeout(3200)
  await page.keyboard.press('ArrowRight')
  await page.waitForTimeout(2000)
  await page.screenshot({ path: `${OUT}/9-thermo-mobile-spread.png` })
  await ctx.close()
}
{
  const { ctx, page } = await ctxPage(true)
  await page.goto('http://127.0.0.1:4181/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(2200)
  await page.screenshot({ path: `${OUT}/10-selector-mobile.png` })
  await ctx.close()
}
// 4. Fallback sans WebGL
{
  const { ctx, page } = await ctxPage(false)
  await page.goto('http://127.0.0.1:4181/?no3d', { waitUntil: 'networkidle' })
  await page.waitForTimeout(2000)
  await page.screenshot({ path: `${OUT}/11-fallback-selector.png` })
  await page.click('#sel-classique')
  await page.waitForTimeout(1800)
  await page.screenshot({ path: `${OUT}/12-fallback-book.png` })
  await ctx.close()
}
await browser.close()
server.kill()
console.log('done')
