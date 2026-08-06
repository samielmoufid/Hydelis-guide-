import { chromium } from 'playwright'
import { execSync, spawn } from 'child_process'
const OUT = process.env.OUT || 'shots'
execSync(`mkdir -p ${OUT}`)
const server = spawn('npx', ['serve', '-p', '4183', 'dist'], { cwd: process.cwd(), stdio: 'ignore' })
for (let i = 0; i < 30; i++) { try { await fetch('http://127.0.0.1:4183/'); break } catch { await new Promise(r => setTimeout(r, 1000)) } }
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=angle', '--enable-unsafe-swiftshader'] })

// Desktop : sélecteur (2 instants de rotation) + warp + livre
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()
  page.on('pageerror', (e) => console.log('PAGEERROR', String(e).slice(0, 300)))
  await page.goto('http://127.0.0.1:4183/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(2200)
  await page.screenshot({ path: `${OUT}/1-sel-spin-a.png` })
  await page.waitForTimeout(2500)
  await page.screenshot({ path: `${OUT}/2-sel-spin-b.png` })
  await page.click('#sel-classique')
  await page.waitForTimeout(520)
  await page.screenshot({ path: `${OUT}/3-warp-zig-a.png` })
  await page.waitForTimeout(380)
  await page.screenshot({ path: `${OUT}/4-warp-zig-b.png` })
  await page.waitForTimeout(2800)
  await page.screenshot({ path: `${OUT}/5-classique-landed.png` })
  await ctx.close()
}
// Mobile : sélecteur + zoom fluide sur les deux livres
for (const [name, hash] of [['classique', '#classique'], ['thermo', '#thermostatique']]) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
  const page = await ctx.newPage()
  page.on('pageerror', (e) => console.log('PAGEERROR', String(e).slice(0, 300)))
  await page.goto('http://127.0.0.1:4183/' + hash, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1800)
  await page.click('body', { position: { x: 195, y: 422 } })
  await page.waitForTimeout(3200)
  await page.click('body', { position: { x: 280, y: 430 } })
  await page.waitForTimeout(2200)
  await page.click('body', { position: { x: 195, y: 430 } })
  await page.waitForTimeout(1200)
  await page.screenshot({ path: `${OUT}/6-${name}-lightbox.png` })
  await ctx.close()
}
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
  const page = await ctx.newPage()
  await page.goto('http://127.0.0.1:4183/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(2500)
  await page.screenshot({ path: `${OUT}/7-sel-mobile.png` })
  await ctx.close()
}
await browser.close()
server.kill()
console.log('done')
