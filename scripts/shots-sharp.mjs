import { chromium } from 'playwright'
import { execSync, spawn } from 'child_process'
const OUT = process.env.OUT || 'shots'
execSync(`mkdir -p ${OUT}`)
const server = spawn('npx', ['serve', '-p', '4179', 'dist'], { cwd: process.cwd(), stdio: 'ignore' })
for (let i = 0; i < 30; i++) { try { await fetch('http://127.0.0.1:4179/'); break } catch { await new Promise(r => setTimeout(r, 1000)) } }
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=angle', '--enable-unsafe-swiftshader'] })
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
const page = await ctx.newPage()
page.on('pageerror', (e) => console.log('PAGEERROR', String(e).slice(0, 300)))
await page.goto('http://127.0.0.1:4179/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1500)
await page.click('body', { position: { x: 195, y: 422 } })
await page.waitForTimeout(3200)
await page.keyboard.press('ArrowRight')
await page.waitForTimeout(1500)
// Tap page droite → zoom 3D + indication
await page.click('body', { position: { x: 280, y: 422 } })
await page.waitForTimeout(2200)
await page.screenshot({ path: `${OUT}/1-zoom-hint.png` })
// Re-tap sur la page → vue pleine résolution
await page.click('body', { position: { x: 195, y: 422 } })
await page.waitForTimeout(1500)
await page.screenshot({ path: `${OUT}/2-lightbox.png` })
// Fermer → retour au zoom 3D
await page.click('#lb-close')
await page.waitForTimeout(1000)
await page.screenshot({ path: `${OUT}/3-back-to-zoom.png` })
await browser.close()
server.kill()
console.log('done')
