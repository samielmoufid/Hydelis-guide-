import { chromium } from 'playwright'

const OUT = '/tmp/claude-0/-home-user-Hydelis-guide-/57bd8955-ad7c-5c8a-9f71-0de8a6fb5045/scratchpad'
const BASE = 'http://127.0.0.1:4186'
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=angle', '--enable-unsafe-swiftshader'] })
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true })
page.on('pageerror', (e) => console.log('[pageerr]', e.message))

await page.goto(BASE + '/', { waitUntil: 'load' })
await page.waitForSelector('#selector:not([hidden])', { timeout: 30000 })
await page.waitForTimeout(2500)
await page.click('#sel-thermostatique')
await page.waitForTimeout(7000)
await page.screenshot({ path: OUT + '/cta-01-levitate-a.png' })
await page.waitForTimeout(1200)
await page.screenshot({ path: OUT + '/cta-02-levitate-b.png' })
console.log('cta visible:', await page.evaluate(() => !document.querySelector('#btn-open').hidden))
await page.click('#btn-open')
await page.waitForTimeout(6000)
await page.screenshot({ path: OUT + '/cta-03-opened.png' })
console.log('indicator:', await page.evaluate(() => document.querySelector('#page-indicator')?.textContent))
console.log('cta hidden after open:', await page.evaluate(() => document.querySelector('#btn-open').hidden))
// tap sur le livre fermé : autre session pour tester coverTap
const p2 = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true })
await p2.goto(BASE + '/', { waitUntil: 'load' })
await p2.waitForSelector('#selector:not([hidden])', { timeout: 30000 })
await p2.waitForTimeout(2500)
await p2.click('#sel-classique')
await p2.waitForTimeout(7000)
await p2.tap('#scene', { position: { x: 195, y: 420 } })
await p2.waitForTimeout(5000)
console.log('indicator after cover tap:', await p2.evaluate(() => document.querySelector('#page-indicator')?.textContent))
await browser.close()
console.log('DONE cta')
