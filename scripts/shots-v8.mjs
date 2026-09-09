import { chromium } from 'playwright'
import { execSync, spawn } from 'child_process'
const OUT = process.env.OUT || 'shots'
execSync(`mkdir -p ${OUT}`)
const server = spawn('npx', ['serve', '-p', '4188', 'dist'], { cwd: process.cwd(), stdio: 'ignore' })
for (let i = 0; i < 30; i++) { try { await fetch('http://127.0.0.1:4188/'); break } catch { await new Promise(r => setTimeout(r, 1000)) } }
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=angle', '--enable-unsafe-swiftshader'] })
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await ctx.newPage()
page.on('pageerror', (e) => console.log('PAGEERROR', String(e).slice(0, 300)))
await page.goto('http://127.0.0.1:4188/', { waitUntil: 'networkidle' })
await page.waitForTimeout(2200)
// aller
await page.click('#sel-classique')
await page.waitForTimeout(3600)
// retour
await page.click('#btn-switch')
await page.waitForTimeout(700)
await page.screenshot({ path: `${OUT}/1-retour-tunnel.png` })
await page.waitForTimeout(2400)
await page.screenshot({ path: `${OUT}/2-retour-selecteur.png` })
// re-aller (tout doit être instantané depuis les caches)
await page.click('#sel-thermostatique')
await page.waitForTimeout(3600)
await page.screenshot({ path: `${OUT}/3-re-aller-thermo.png` })
await browser.close()
server.kill()
console.log('done')
