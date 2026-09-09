// Vérification du zoom page 3D.
import { chromium } from 'playwright'
import { execSync, spawn } from 'child_process'

const OUT = process.env.OUT || 'shots'
execSync(`mkdir -p ${OUT}`)
const server = spawn('npx', ['serve', '-p', '4176', 'dist'], { cwd: process.cwd(), stdio: 'ignore' })
for (let i = 0; i < 30; i++) {
  try { await fetch('http://127.0.0.1:4176/'); break } catch { await new Promise((r) => setTimeout(r, 1000)) }
}
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=angle', '--enable-unsafe-swiftshader']
})

for (const [name, vw, vh, mobile] of [['desktop', 1440, 900, false], ['portrait', 390, 844, true]]) {
  const ctx = await browser.newContext({
    viewport: { width: vw, height: vh }, deviceScaleFactor: mobile ? 2 : 1,
    isMobile: mobile, hasTouch: mobile
  })
  const page = await ctx.newPage()
  page.on('pageerror', (e) => console.log(`[${name}] PAGEERROR`, String(e).slice(0, 300)))
  await page.goto('http://127.0.0.1:4176/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1500)
  await page.click('body', { position: { x: vw / 2, y: vh / 2 } })
  await page.waitForTimeout(3500)

  // Aller au spread 2-3 puis taper la page de droite
  await page.keyboard.press('ArrowRight')
  await page.waitForTimeout(1600)
  await page.screenshot({ path: `${OUT}/${name}-1-hint.png` })
  await page.click('body', { position: { x: vw * (mobile ? 0.72 : 0.62), y: vh / 2 } })
  await page.waitForTimeout(2600)
  await page.screenshot({ path: `${OUT}/${name}-2-zoomed.png` })
  console.log(name, 'zoom ok')

  // Navigation en zoom : flèche droite = page suivante
  await page.keyboard.press('ArrowRight')
  await page.waitForTimeout(2600)
  await page.screenshot({ path: `${OUT}/${name}-3-zoomnext.png` })

  // Tap pour sortir
  await page.click('body', { position: { x: vw / 2, y: vh / 2 } })
  await page.waitForTimeout(2200)
  await page.screenshot({ path: `${OUT}/${name}-4-exit.png` })
  console.log(name, 'exit ok')
  await ctx.close()
}
await browser.close()
server.kill()
console.log('done')
