import { chromium } from 'playwright'
import { spawn } from 'child_process'
const server = spawn('npx', ['serve', '-p', '4178', 'dist'], { cwd: process.cwd(), stdio: 'ignore' })
for (let i = 0; i < 30; i++) { try { await fetch('http://127.0.0.1:4178/'); break } catch { await new Promise(r => setTimeout(r, 1000)) } }
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=angle', '--enable-unsafe-swiftshader'] })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
await page.goto('http://127.0.0.1:4178/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1500)
await page.click('body', { position: { x: 720, y: 450 } })
await page.waitForTimeout(3000)
const info = await page.evaluate(() => {
  const el = document.elementFromPoint(893, 450)
  const chain = []
  let e = el
  while (e && chain.length < 6) { chain.push(e.id || e.className || e.tagName); e = e.parentElement }
  const cv = document.querySelector('#scene')
  return {
    hit: chain,
    canvasPE: getComputedStyle(cv).pointerEvents,
    canvasRect: cv.getBoundingClientRect().toJSON(),
    introStillThere: !!document.querySelector('#intro')
  }
})
console.log(JSON.stringify(info, null, 1))
await browser.close()
server.kill()
