// Diagnostic du cadrage caméra.
import { chromium } from 'playwright'
import { spawn } from 'child_process'

const server = spawn('npx', ['serve', '-p', '4174', 'dist'], { cwd: process.cwd() })
await new Promise((r) => setTimeout(r, 2500))
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
  await page.goto('http://localhost:4174/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(2000)
  await page.click('body', { position: { x: vw / 2, y: vh / 2 } })
  await page.waitForTimeout(3500)
  const info = await page.evaluate(() => {
    const b = window.__book
    const c = b.camera
    // Projeter quelques points monde à l'écran
    const proj = (x, y, z) => {
      const v = new (Object.getPrototypeOf(c.position).constructor)(x, y, z)
      v.project(c)
      return [((v.x + 1) / 2 * innerWidth).toFixed(0), ((1 - (v.y + 1) / 2) * innerHeight).toFixed(0)]
    }
    return {
      aspect: c.aspect.toFixed(3),
      canvas: [b.canvas.clientWidth, b.canvas.clientHeight],
      camDist: b.camDist.toFixed(3),
      camDistTarget: b.camDistTarget.toFixed(3),
      flatX: b.flat.position.x.toFixed(4),
      turned: b.turned,
      camPos: [c.position.x.toFixed(2), c.position.y.toFixed(2), c.position.z.toFixed(2)],
      rigRot: [b.rig.rotation.x.toFixed(3), b.rig.rotation.y.toFixed(3)],
      tiltRotY: b.tilt.rotation.y.toFixed(4),
      spineTop: proj(0, 0.06, -0.72),
      spineBottom: proj(0, 0.06, 0.72),
      rightEdgeBottom: proj(1.0, 0.06, 0.72),
      leftEdgeBottom: proj(-1.022, 0.06, 0.72)
    }
  })
  console.log(name, JSON.stringify(info, null, 1))
  await ctx.close()
}
await browser.close()
server.kill()
