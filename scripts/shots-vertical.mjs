import { chromium } from 'playwright'
import { execSync, spawn } from 'child_process'
const OUT = process.env.OUT || 'shots'
execSync(`mkdir -p ${OUT}`)
const server = spawn('npx', ['serve', '-p', '4180', 'dist'], { cwd: process.cwd(), stdio: 'ignore' })
for (let i = 0; i < 30; i++) { try { await fetch('http://127.0.0.1:4180/'); break } catch { await new Promise(r => setTimeout(r, 1000)) } }
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=angle', '--enable-unsafe-swiftshader'] })
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
const page = await ctx.newPage()
page.on('pageerror', (e) => console.log('PAGEERROR', String(e).slice(0, 300)))
await page.goto('http://127.0.0.1:4180/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1500)
await page.click('body', { position: { x: 195, y: 422 } })
await page.waitForTimeout(2600)
await page.screenshot({ path: `${OUT}/1-open-hint.png` })
// Tap page 1 (droite) → zoom : l'indication doit être visible et rester
await page.click('body', { position: { x: 280, y: 430 } })
await page.waitForTimeout(2400)
await page.screenshot({ path: `${OUT}/2-zoom-hint-a.png` })
await page.waitForTimeout(4500)
await page.screenshot({ path: `${OUT}/3-zoom-hint-persiste.png` })
await browser.close()
server.kill()
console.log('done')
