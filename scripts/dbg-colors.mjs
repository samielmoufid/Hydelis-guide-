import { chromium } from 'playwright'

const OUT = '/tmp/claude-0/-home-user-Hydelis-guide-/57bd8955-ad7c-5c8a-9f71-0de8a6fb5045/scratchpad'
const BASE = 'http://127.0.0.1:4186'
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=angle', '--enable-unsafe-swiftshader'],
})
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true })
page.on('pageerror', (e) => console.log('[pageerr]', e.message))

await page.goto(BASE + '/#classique', { waitUntil: 'load' })
await page.waitForSelector('#intro-open', { state: 'visible', timeout: 30000 })
await page.click('#intro-open')
await page.waitForTimeout(6000)
// zoom sur la page de droite (page 1) pour juger les couleurs de près
await page.tap('#scene', { position: { x: 280, y: 430 } })
await page.waitForTimeout(4000)
await page.screenshot({ path: OUT + '/colors-01-zoom-p1.png' })
await browser.close()
console.log('DONE colors')
