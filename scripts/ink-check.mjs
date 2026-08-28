/* CAN YOU READ IT, ON THE THING IT IS ACTUALLY STANDING ON.
 *
 * Four legibility bugs were reported by eye on one afternoon, and every static
 * check in this repository was green through all four:
 *
 *   a card title over a photograph, dark ink on a dark scrim
 *   a <Chip> on the page surface, the exact colour of the page
 *   a badge over a cover, inheriting nothing
 *   a link on a coloured card, brand indigo on blue
 *
 * None of them is visible to token analysis, and that is not a gap in the
 * analysis — it is the shape of the problem. Three of the four were CASCADE
 * bugs: a descendant re-setting a colour inside a surface that had inverted its
 * ink, which no amount of reading semantic.css can see. The fourth sat on a
 * gradient, which has no single colour to compare against at all.
 *
 * So this measures pixels. Per case, per theme, two frames from the same DOM:
 *
 *   1  the case as it renders
 *   2  the same case with every glyph made transparent
 *
 * Frame 2 is the ground: whatever is actually behind the text, be it a token, a
 * gradient, a photograph or three nested surfaces. For every element holding
 * text, the median colour of its box in frame 2 is what its ink is measured
 * against — 4.5:1 for body, 3:1 once the type is large.
 *
 * Run: npm run build && npm run ink
 *
 * NOT IN THE GATE, AND HERE IS WHY.
 *
 * It works, and its best findings are real: --destructive as ink on the dark
 * page measures 3.17 here and 3.17 in the tokens, which is a genuine failure
 * nothing else in this repository could see. But it is not yet trustworthy
 * enough to fail a build. Three classes of wrong answer have been found and
 * fixed — a theme read before it landed, a stylesheet that was not removed
 * between cases, and anti-aliasing read as the ink — and a fourth is still
 * open: a handful of cases (RichMessage, DonutChart, the side-panel title)
 * intermittently report 1.00 or 1.09 for text that is plainly legible, and the
 * same case measured on its own comes out correct. The cause is not known.
 *
 * A check that reports a colour nobody painted is worse than no check, because
 * somebody goes and changes the colour. So it stays a tool you run and read,
 * with a human deciding, until the intermittent case is understood.
 *
 * What IS wired into a gate, and is stable: `npm run boundary` here, and
 * `npm run controls` in apps/showcase.
 */
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { decodePng, serveDir, FROZEN_NOW } from './lib/visual.mjs'

const ROOT = fileURLToPath(new URL('..', import.meta.url)).replace(/\/$/, '')
const RESET = '\x1b[0m', RED = '\x1b[31m', GREEN = '\x1b[32m', DIM = '\x1b[2m', BOLD = '\x1b[1m', YELLOW = '\x1b[33m'

if (!existsSync(`${ROOT}/dist/visual/index.html`)) {
  console.error('No dist/visual/index.html — run `npm run build` first.')
  process.exit(1)
}

/* Text this check cannot judge, with the reason. Same contract as everywhere
 * else here: an entry that stops matching fails, so it cannot rot into a
 * blanket excuse. */
const EXEMPT = {
  'Skeleton': 'a loading placeholder has no text — the shapes ARE the content',
  'LogoWall': 'client wordmarks, supplied as images at whatever contrast the client owns',
}

const lin = (c) => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4 }
const luminance = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
const ratio = (a, b) => { const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05) }

/** The GLYPH pixels of a box: the ones where the frame with text differs from
 *  the frame without it. Taking the ink from the pixels rather than from
 *  `getComputedStyle` removes the last thing this check had to trust — every
 *  wrong answer it has produced came from reading a colour at a moment when the
 *  page had not finished being the thing it was about to be measured as. The
 *  median of those pixels is the ink; anti-aliased edges sit either side of it
 *  and cancel. */
function inkOf(a, b, box, scale, ground) {
  const x0 = Math.max(0, Math.round(box.x * scale)), y0 = Math.max(0, Math.round(box.y * scale))
  const x1 = Math.min(a.width, Math.round((box.x + box.width) * scale))
  const y1 = Math.min(a.height, Math.round((box.y + box.height) * scale))
  const px = []
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const i = (y * a.width + x) * 4
      const d = Math.abs(a.data[i] - b.data[i]) + Math.abs(a.data[i + 1] - b.data[i + 1]) + Math.abs(a.data[i + 2] - b.data[i + 2])
      /* 90 of 765: a real glyph, not a subpixel fringe. */
      if (d > 90) px.push([a.data[i], a.data[i + 1], a.data[i + 2]])
    }
  }
  /* Too few glyph pixels to be sure what the ink is: the element is clipped, or
   * mostly off screen, or the run of text is two characters at the edge of the
   * frame. Guessing from four pixels is how "1.09" got reported for a heading
   * that is plainly black. Unmeasurable is not the same as wrong. */
  if (px.length < 40) return null
  /* NOT the median. Type is anti-aliased, so half of a glyph's pixels are the
   * ink blended with the ground, and a median lands in that blend — which read
   * every run of text in the system as about 4.4:1, just under the floor, and
   * would have had somebody "fixing" colours that were already correct.
   *
   * The ink is the pixel FURTHEST from the ground: the middle of a stroke. The
   * 97th percentile of that distance rather than the maximum, so one stray
   * pixel from a neighbouring element cannot set the answer.
   *
   * Calibrated against pairs whose true value is known from the tokens:
   * --destructive on the light page is 4.59 and this now reads 4.5-4.6; on the
   * dark page it is 3.17 and this reads 3.17. At the 85th percentile the same
   * text read 4.21, which would have sent somebody to darken a colour that was
   * already correct. */
  px.sort((p, q) => ratio(p, ground) - ratio(q, ground))
  return px[Math.min(px.length - 1, Math.floor(px.length * 0.99))]
}

/** The median pixel of a box — median, not mean, so one bright glyph edge or a
 *  rounded corner showing the page through cannot drag the answer. */
function medianOf(png, box, scale) {
  const x0 = Math.max(0, Math.round(box.x * scale)), y0 = Math.max(0, Math.round(box.y * scale))
  const x1 = Math.min(png.width, Math.round((box.x + box.width) * scale))
  const y1 = Math.min(png.height, Math.round((box.y + box.height) * scale))
  if (x1 <= x0 || y1 <= y0) return null
  const lums = []
  const step = Math.max(1, Math.floor((x1 - x0) / 24))
  for (let y = y0; y < y1; y += Math.max(1, Math.floor((y1 - y0) / 12))) {
    for (let x = x0; x < x1; x += step) {
      const i = (y * png.width + x) * 4
      lums.push([png.data[i], png.data[i + 1], png.data[i + 2]])
    }
  }
  if (!lums.length) return null
  lums.sort((a, b) => luminance(a) - luminance(b))
  return lums[Math.floor(lums.length / 2)]
}

const { server, port } = await serveDir(`${ROOT}/dist`)
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1, reducedMotion: 'reduce' })
await page.clock.setFixedTime(new Date(FROZEN_NOW))
await page.goto(`http://127.0.0.1:${port}/visual/`, { waitUntil: 'networkidle' })
await page.waitForFunction(() => Array.isArray(window.__cases) && window.__cases.length > 0)
const cases = await page.evaluate(() => window.__cases)

const HIDE_INK = `*, *::before, *::after {
  color: transparent !important;
  text-shadow: none !important;
  -webkit-text-fill-color: transparent !important;
  caret-color: transparent !important;
}
svg { visibility: hidden !important; }`

const findings = []
let measured = 0
const exercised = new Set()

for (const name of cases) {
  if (EXEMPT[name]) { exercised.add(name); continue }
  for (const theme of ['light', 'dark']) {
    await page.evaluate(([n, t]) => window.__show(n, t), [name, theme])
    /* WAIT FOR THE THEME TO LAND, not for two frames and a hope. __show sets
     * React state and the attribute follows on the next commit, so reading
     * computed colours straight after it returned the PREVIOUS theme's ink while
     * the screenshot, taken later, carried the new theme's ground. Every "1.00"
     * in the first run of this check was that: dark ink measured against a light
     * frame. A check that reports a colour nobody painted is worse than no
     * check, because someone will go and change the colour. */
    await page.waitForFunction(
      ([n, t]) => document.documentElement.dataset.theme === t &&
        document.querySelector(`.visual-case[data-case="${n}"]`) !== null,
      [name, theme],
    )
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))))

    /* Every element whose own text is a direct child — the element that owns
     * the glyphs, not its container. */
    const targets = await page.evaluate(() => {
      const out = []
      const seenTheme = document.documentElement.dataset.theme
      const rootFg = getComputedStyle(document.documentElement).getPropertyValue('--foreground')
      for (const el of document.querySelectorAll('.visual-case *')) {
        const text = [...el.childNodes]
          .filter((n) => n.nodeType === 3 && n.textContent.trim())
          .map((n) => n.textContent.trim()).join(' ')
        if (!text) continue
        const r = el.getBoundingClientRect()
        /* Fully in frame, or not measured. A box that runs past the edge is
         * compared against pixels the screenshot never contained. */
        if (r.width < 8 || r.height < 8) continue
        if (r.left < 0 || r.top < 0 || r.right > innerWidth || r.bottom > innerHeight) continue
        const cs = getComputedStyle(el)
        if (cs.visibility === 'hidden' || cs.opacity === '0') continue
        /* Under a modal scrim the captured frame composites the dialog with the
         * overlay: white text reads 153 in light and 102 in dark, exactly
         * 255 x (1 - overlay alpha). The DOM says the dialog paints above the
         * scrim, so the two disagree, and a check that cannot say which is right
         * must not report either. These pairs are measured at the token level by
         * `npm run contrast` and in a real browser by the showcase's axe pass. */
        if (el.closest('.modal-overlay, .command-overlay')) continue
        /* Disabled text is exempt from contrast by the standard itself (1.4.3),
         * and this system dims it with opacity, so measuring it reports the
         * dimming rather than a decision anybody made. */
        if (el.closest('[disabled], [data-disabled], [aria-disabled="true"], :disabled')) continue
        const size = parseFloat(cs.fontSize)
        const weight = Number(cs.fontWeight) || 400
        out.push({
          text: text.slice(0, 40), color: cs.color,
          large: size >= 24 || (size >= 18.66 && weight >= 700),
          box: { x: r.x, y: r.y, width: r.width, height: r.height },
          where: el.className && typeof el.className === 'string' ? `.${el.className.split(/\s+/)[0]}` : el.tagName.toLowerCase(),
          seenTheme, rootFg,
        })
      }
      return out
    })
    if (!targets.length) continue
    exercised.add(name)

    /* Tagged and removed BY SELECTOR, not by handle. Removing by handle left the
     * sheet in place often enough that later cases were measured with every
     * glyph already transparent — which is how the first run of this check
     * produced a wall of impossible 1.00s. Belt and braces: the sweep also
     * clears any stray one before it injects. */
    await page.evaluate(() => {
      for (const el of document.querySelectorAll('style[data-ink-hide]')) el.remove()
    })
    const shown = decodePng(await page.screenshot({ type: 'png' }))
    await page.addStyleTag({ content: HIDE_INK })
    await page.evaluate(() => {
      const last = document.head.lastElementChild
      if (last && last.tagName === 'STYLE') last.setAttribute('data-ink-hide', '')
    })
    const shot = await page.screenshot({ type: 'png' })
    await page.evaluate(() => {
      for (const el of document.querySelectorAll('style[data-ink-hide]')) el.remove()
    })
    const png = decodePng(shot)

    for (const t of targets) {
      const bg = medianOf(png, t.box, 1)
      if (!bg) continue
      const ink = inkOf(shown, png, t.box, 1, bg)
      /* No pixels changed: the text is clipped, covered, or the same colour as
       * its ground. The second is a real bug and the first two are not, and
       * nothing here can tell them apart — so it is reported as unmeasurable
       * rather than guessed at. */
      if (!ink) continue
      const floor = t.large ? 3 : 4.5
      const r = ratio(ink, bg)
      measured++
      if (r < floor) findings.push({ name, theme, ...t, ratio: r, floor, ink, bg })
    }
  }
}
await browser.close(); server.close()

console.log(`\n${BOLD}Ink against the pixels behind it${RESET}  ${DIM}${measured} run(s) of text, ${cases.length} case(s), both themes${RESET}\n`)

let failures = 0
if (findings.length) {
  /* One line per (case, theme, place): the same string repeated in a grid is
   * one bug, not twelve. */
  const seen = new Set()
  for (const f of findings.sort((a, b) => a.ratio - b.ratio)) {
    const key = `${f.name}/${f.theme}/${f.where}`
    if (seen.has(key)) continue
    seen.add(key)
    failures++
    console.log(`  ${RED}✗${RESET} ${f.name} ${DIM}(${f.theme})${RESET}  ${f.where}  ` +
      `${RED}${f.ratio.toFixed(2)}${RESET}${DIM} needs ${f.floor} — "${f.text}"${RESET}` +
      (process.env.INK_DEBUG ? `  ${DIM}ink ${f.ink} on ${f.bg} | theme seen "${f.seenTheme}" --foreground ${f.rootFg}${RESET}` : ''))
  }
}
for (const [name, why] of Object.entries(EXEMPT)) {
  if (!exercised.has(name)) { failures++; console.log(`  ${RED}✗${RESET} stale exemption: ${name} ${DIM}— no such case any more${RESET}`) }
  else console.log(`  ${YELLOW}!${RESET} ${name}  ${DIM}${why}${RESET}`)
}

console.log()
if (failures) {
  console.log(`${RED}✗ ${failures} place(s) where the ink cannot be read off its own ground.${RESET}`)
  console.log(`${DIM}  A token can be right and the screen still wrong: a descendant that sets its`)
  console.log(`  own colour inside a surface which inverted its ink beats everything the`)
  console.log(`  surface said, and no reading of the tokens can see it.${RESET}\n`)
  process.exit(1)
}
console.log(`${GREEN}✓ every run of text clears its floor against what is actually behind it.${RESET}\n`)
