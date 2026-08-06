import { chromium } from 'playwright'
import { execSync, spawn } from 'child_process'
const OUT = process.env.OUT || 'shots'
execSync(`mkdir -p ${OUT}`)
const server = spawn('npx', ['serve', '-p', '4182', 'dist'], { cwd: process.cwd(), stdio: 'ignore' })
for (let i = 0; i < 30; i++) { try { await fetch('http://127.0.0.1:4182/'); break } catch { await new Promise(r => setTimeout(r, 1000)) } }
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=angle', '--enable-unsafe-swiftshader'] })
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await ctx.newPage()
page.on('pageerror', (e) => console.log('PAGEERROR', String(e).slice(0, 300)))
await page.goto('http://127.0.0.1:4182/', { waitUntil: 'networkidle' })
await page.waitForTimeout(2500)
await page.click('#sel-thermostatique')
await page.waitForTimeout(300)
await page.screenshot({ path: `${OUT}/w300.png` })
await page.waitForTimeout(320)
await page.screenshot({ path: `${OUT}/w620.png` })
await page.waitForTimeout(300)
await page.screenshot({ path: `${OUT}/w920.png` })
await page.waitForTimeout(2500)
// End pour vérifier le clavier après sélection
await page.keyboard.press('End')
await page.waitForTimeout(4200)
await page.screenshot({ path: `${OUT}/end-state.png` })
await browser.close()
server.kill()
console.log('done')
