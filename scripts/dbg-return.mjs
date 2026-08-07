import { chromium } from 'playwright'

const OUT = '/tmp/claude-0/-home-user-Hydelis-guide-/57bd8955-ad7c-5c8a-9f71-0de8a6fb5045/scratchpad'
const BASE = 'http://127.0.0.1:4186'
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=angle', '--enable-unsafe-swiftshader'],
})
const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
page.on('pageerror', (e) => console.log('[pageerr]', e.message))

await page.goto(BASE + '/', { waitUntil: 'load' })
await page.waitForSelector('#selector:not([hidden])', { timeout: 30000 })
await page.waitForTimeout(2500)
await page.click('#sel-classique')
await page.waitForTimeout(9000)
console.log('after pick:', await page.evaluate(() => document.querySelector('#page-indicator')?.textContent))
await page.click('#btn-switch')
await page.waitForTimeout(9000)
await page.screenshot({ path: OUT + '/v6c-01-back-selector.png' })
console.log('selector hidden?', await page.evaluate(() => document.querySelector('#selector').hidden))
// re-pick to confirm the loop stays healthy
await page.click('#sel-thermostatique')
await page.waitForTimeout(9000)
await page.screenshot({ path: OUT + '/v6c-02-repick.png' })
console.log('after repick:', await page.evaluate(() => document.querySelector('#page-indicator')?.textContent))
await browser.close()
console.log('DONE v6c')
