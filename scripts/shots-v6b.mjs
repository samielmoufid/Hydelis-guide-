import { chromium } from 'playwright'

const OUT = process.env.OUT || '/tmp/claude-0/-home-user-Hydelis-guide-/57bd8955-ad7c-5c8a-9f71-0de8a6fb5045/scratchpad'
const BASE = 'http://127.0.0.1:4186'

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=angle', '--enable-unsafe-swiftshader'],
})
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
page.on('console', (m) => { if (m.type() === 'error') console.log('CONSOLE ERR:', m.text()) })
page.on('pageerror', (e) => console.log('PAGE ERR:', e.message))

await page.goto(BASE + '/', { waitUntil: 'load' })
await page.waitForSelector('#selector:not([hidden])', { timeout: 30000 })
await page.waitForTimeout(3000)
await page.click('#sel-thermostatique')
await page.waitForTimeout(8000)
await page.screenshot({ path: OUT + '/v6b-01-8s.png' })
await page.waitForTimeout(6000)
await page.screenshot({ path: OUT + '/v6b-02-14s.png' })
const state = await page.evaluate(() => document.querySelector('#page-indicator')?.textContent)
console.log('indicator:', state)
await browser.close()
console.log('DONE v6b')
