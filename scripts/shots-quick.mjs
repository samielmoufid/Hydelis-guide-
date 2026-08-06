// Vérification visuelle rapide (2 contextes, 3 captures).
import { chromium } from 'playwright'
import { execSync, spawn } from 'child_process'

const OUT = process.env.OUT || 'shots'
execSync(`mkdir -p ${OUT}`)
const server = spawn('npx', ['serve', '-p', '4175', 'dist'], { cwd: process.cwd(), stdio: 'ignore' })
for (let i = 0; i < 30; i++) {
  try { await fetch('http://127.0.0.1:4175/'); break } catch { await new Promise((r) => setTimeout(r, 1000)) }
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
  await page.goto('http://127.0.0.1:4175/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1500)
  await page.click('body', { position: { x: vw / 2, y: vh / 2 } })
  await page.waitForTimeout(4000)
  await page.screenshot({ path: `${OUT}/${name}-open.png` })
  console.log(name, 'open ok')
  if (!mobile) {
    await page.keyboard.press('ArrowRight')
    await page.waitForTimeout(350)
    await page.screenshot({ path: `${OUT}/${name}-midturn.png` })
    console.log(name, 'midturn ok')
  }
  await ctx.close()
}
await browser.close()
server.kill()
console.log('done')
