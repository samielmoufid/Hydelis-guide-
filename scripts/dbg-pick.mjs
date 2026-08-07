import { chromium } from 'playwright'

const BASE = process.env.BASE || 'http://127.0.0.1:4187'
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=angle', '--enable-unsafe-swiftshader'],
})
const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
page.on('console', (m) => console.log('[con]', m.text()))
page.on('pageerror', (e) => console.log('[pageerr]', e.message))

await page.goto(BASE + '/', { waitUntil: 'load' })
await page.addScriptTag({ content: 'window.__dbg = true' })
await page.waitForSelector('#selector:not([hidden])', { timeout: 30000 })
await page.waitForTimeout(2500)
await page.click('#sel-thermostatique')
await page.waitForTimeout(12000)
const ind = await page.evaluate(() => document.querySelector('#page-indicator')?.textContent)
console.log('indicator:', ind)
await browser.close()
console.log('DONE dbg')
