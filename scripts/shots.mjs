// Capture d'écrans du guide pour vérification visuelle.
// Usage : npm run build && node scripts/shots.mjs
import { chromium } from 'playwright'
import { execSync, spawn } from 'child_process'

const OUT = process.env.OUT || 'shots'
execSync(`mkdir -p ${OUT}`)

const server = spawn('npx', ['serve', '-p', '4173', 'dist'], { cwd: process.cwd() })
await new Promise((r) => setTimeout(r, 2500))

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=angle', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']
})

async function scenario(name, vw, vh, mobile, query = '') {
  const ctx = await browser.newContext({
    viewport: { width: vw, height: vh },
    deviceScaleFactor: mobile ? 2 : 1,
    isMobile: mobile,
    hasTouch: mobile
  })
  const page = await ctx.newPage()
  page.on('pageerror', (e) => console.log(`[${name}] PAGEERROR`, String(e).slice(0, 400)))
  await page.goto('http://localhost:4173/' + query, { waitUntil: 'networkidle' })
  await page.waitForTimeout(2200)
  await page.screenshot({ path: `${OUT}/${name}-1-intro.png` })

  await page.click('body', { position: { x: vw / 2, y: vh / 2 } })
  await page.waitForTimeout(3200)
  await page.screenshot({ path: `${OUT}/${name}-2-open.png` })

  await page.keyboard.press('ArrowRight')
  await page.waitForTimeout(280)
  await page.screenshot({ path: `${OUT}/${name}-3-midturn.png` })
  await page.waitForTimeout(1300)
  await page.keyboard.press('ArrowRight')
  await page.waitForTimeout(1800)
  await page.screenshot({ path: `${OUT}/${name}-4-spread45.png` })

  await page.click('#page-indicator')
  await page.waitForTimeout(900)
  await page.screenshot({ path: `${OUT}/${name}-5-toc.png` })
  await page.keyboard.press('Escape')
  await page.waitForTimeout(600)

  await page.keyboard.press('End')
  await page.waitForTimeout(3500)
  await page.screenshot({ path: `${OUT}/${name}-6-end.png` })

  await ctx.close()
}

await scenario('desktop', 1440, 900, false)
await scenario('mobile-portrait', 390, 844, true)
await scenario('mobile-landscape', 844, 390, true)
await scenario('fallback', 1280, 800, false, '?no3d')

await browser.close()
server.kill()
console.log('done')
