// Diagnostic du zoom page : appel direct vs tap.
import { chromium } from 'playwright'
import { execSync, spawn } from 'child_process'

const OUT = process.env.OUT || 'shots'
execSync(`mkdir -p ${OUT}`)
const server = spawn('npx', ['serve', '-p', '4177', 'dist'], { cwd: process.cwd(), stdio: 'ignore' })
for (let i = 0; i < 30; i++) {
  try { await fetch('http://127.0.0.1:4177/'); break } catch { await new Promise((r) => setTimeout(r, 1000)) }
}
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=angle', '--enable-unsafe-swiftshader']
})
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await ctx.newPage()
page.on('console', (m) => console.log('CONSOLE', m.type(), m.text().slice(0, 200)))
page.on('pageerror', (e) => console.log('PAGEERROR', String(e).slice(0, 300)))
await page.goto('http://127.0.0.1:4177/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1500)
await page.click('body', { position: { x: 720, y: 450 } })
await page.waitForTimeout(3000)
await page.keyboard.press('ArrowRight')
await page.waitForTimeout(1500)

// 1. Instrumenter les événements pointeur du canvas
await page.evaluate(() => {
  const c = document.querySelector('#scene')
  window.__events = []
  for (const ev of ['pointerdown', 'pointerup']) {
    c.addEventListener(ev, (e) => window.__events.push([ev, e.clientX, e.clientY]))
  }
})

// 2. Tap sur la page de droite
await page.click('body', { position: { x: 893, y: 450 } })
await page.waitForTimeout(800)
const state1 = await page.evaluate(() => ({
  events: window.__events,
  zoom: window.__book.zoom,
  turned: window.__book.turned,
  opened: window.__book.opened,
  lastTap: !!window.__book.lastTap
}))
console.log('après tap :', JSON.stringify(state1))

// 3. Appel direct
await page.evaluate(() => window.__book.zoomTo('right'))
await page.waitForTimeout(2500)
const state2 = await page.evaluate(() => ({
  zoom: window.__book.zoom,
  cam: Object.fromEntries(Object.entries(window.__book.cam).map(([k, v]) => [k, +v.toFixed(3)]))
}))
console.log('après zoomTo direct :', JSON.stringify(state2))
await page.screenshot({ path: `${OUT}/direct-zoom.png` })

await browser.close()
server.kill()
console.log('done')
