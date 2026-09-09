import { chromium } from 'playwright'

const OUT = process.env.OUT || '/tmp/claude-0/-home-user-Hydelis-guide-/57bd8955-ad7c-5c8a-9f71-0de8a6fb5045/scratchpad'
const BASE = 'http://127.0.0.1:4186'

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=angle', '--enable-unsafe-swiftshader'],
})

// mobile portrait
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
for (let i = 0; i < 40; i++) {
  try { const r = await page.request.get(BASE + '/'); if (r.ok()) break } catch {}
  await new Promise(r => setTimeout(r, 500))
}

// 1) deep link classique : intro → landing (couverture fermée teintée) → auto-open
await page.goto(BASE + '/#classique', { waitUntil: 'load' })
await page.waitForSelector('#intro-open', { state: 'visible', timeout: 30000 })
await page.click('#intro-open')
await page.waitForTimeout(550)
await page.screenshot({ path: OUT + '/v6-01-landing-cover.png' })
await page.waitForTimeout(3200)
await page.screenshot({ path: OUT + '/v6-02-auto-opened.png' })
await page.waitForTimeout(2000)
await page.screenshot({ path: OUT + '/v6-03-spread.png' })

// 2) selecteur → pick thermo → landing cover
await page.goto(BASE + '/', { waitUntil: 'load' })
await page.waitForSelector('#selector:not([hidden])', { timeout: 30000 })
await page.waitForTimeout(2500)
await page.screenshot({ path: OUT + '/v6-04-selector.png' })
await page.click('#sel-thermostatique')
await page.waitForTimeout(2600)
await page.screenshot({ path: OUT + '/v6-05-thermo-landing.png' })
await page.waitForTimeout(2600)
await page.screenshot({ path: OUT + '/v6-06-thermo-opened.png' })

await browser.close()
console.log('DONE v6')
