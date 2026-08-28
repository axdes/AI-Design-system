/* Not part of the gate: a one-command way to look at the patterns screen's
 * sections at several widths while working on them. */
import { chromium } from 'playwright'
import { serveDir } from './lib/visual.mjs'
const DIST = '/Users/Vitali_Novikau/Downloads/CSS/apps/showcase/dist'
const OUT = process.argv[2] ?? '/tmp'
const { server, port } = await serveDir(DIST)
const browser = await chromium.launch()
const SECTIONS = { structures: 'Card structures', decisions: 'Cards that carry a decision', more: 'The rest of the families', composed: 'Families that are a recipe' }
for (const w of [390, 768, 1440, 2560]) {
  const page = await browser.newPage({ viewport: { width: w, height: 1200 }, deviceScaleFactor: 1 })
  await page.addInitScript(() => {
    localStorage.setItem('auth.user', JSON.stringify({ id: 'u1', username: 'mohammed', fullName: 'Mohammed Al-Khalid', role: 'admin', email: 'mohammed@example.com' }))
  })
  await page.goto(`http://localhost:${port}/patterns`, { waitUntil: 'networkidle' })
  for (const [key, label] of Object.entries(SECTIONS)) {
    const ok = await page.evaluate((l) => {
      // eslint-disable-next-line no-undef
      const el = [...document.querySelectorAll('h2, h3, div, span')].find((n) => n.textContent?.trim() === l)
      if (el) el.scrollIntoView({ block: 'start' })
      return Boolean(el)
    }, label)
    if (!ok) continue
    await page.waitForTimeout(250)
    await page.screenshot({ path: `${OUT}/p-${key}-${w}.png` })
  }
  await page.close()
}
await browser.close(); server.close()
console.log('shot')
