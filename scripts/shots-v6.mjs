import { chromium } from 'playwright'
import { execSync, spawn } from 'child_process'
const OUT = process.env.OUT || 'shots'
execSync(`mkdir -p ${OUT}`)
const server = spawn('npx', ['serve', '-p', '4187', 'dist'], { cwd: process.cwd(), stdio: 'ignore' })
for (let i = 0; i < 30; i++) { try { await fetch('http://127.0.0.1:4187/'); break } catch { await new Promise(r => setTimeout(r, 1000)) } }
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=angle', '--enable-unsafe-swiftshader'] })
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
const page = await ctx.newPage()
page.on('pageerror', (e) => console.log('PAGEERROR', String(e).slice(0, 300)))
await page.goto('http://127.0.0.1:4187/#thermostatique', { waitUntil: 'networkidle' })
await page.waitForTimeout(1800)
await page.click('body', { position: { x: 195, y: 422 } })
await page.waitForTimeout(3200)
// Tap sur la GARDE (page de gauche) → zoom 3D
await page.click('body', { position: { x: 100, y: 430 } })
await page.waitForTimeout(2300)
await page.screenshot({ path: `${OUT}/1-garde-zoom3d.png` })
// Re-tap → vue pleine résolution de la garde
await page.click('body', { position: { x: 195, y: 430 } })
await page.waitForTimeout(1400)
await page.screenshot({ path: `${OUT}/2-garde-lightbox.png` })
await browser.close()
server.kill()
console.log('done')
