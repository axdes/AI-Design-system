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
 * So the GROUND is measured. Per case, per theme, two frames from the same DOM:
 *
 *   1  the case as it renders
 *   2  the same case with every glyph made transparent
 *
 * The pixels that differ between them ARE the glyphs, and their colour in frame
 * 2 is what the reader sees the text on — a token, a gradient, a photograph or
 * three nested surfaces, per pixel, whatever is painting it. The INK is not
 * measured: `getComputedStyle(el).color`, converted to sRGB by the browser, is
 * the exact value with no anti-aliasing in it. Floor 4.5:1 for body, 3:1 once
 * the type is large.
 *
 * Run: npm run build && npm run ink
 *
 * IN THE GATE SINCE 2026-09-03, AND IT TOOK ELEVEN DAYS TO EARN IT. Five ways
 * of measuring wrong were found and fixed, and every one of them made the check
 * quieter rather than louder, which is why none of them was noticed by looking
 * at the output:
 *
 *   - the theme read before it landed, so ink was measured in one theme against
 *     a frame carried in the other;
 *   - the ground frame screenshotted before the paint that removes the glyphs,
 *     so the "ground" still had the text in it: 18, 21 and 25 findings on three
 *     consecutive runs of an unchanged tree, all in the 1.0-1.1 band;
 *   - the hide-sheet tagged as "whatever is last in the head", which is not
 *     reliably the sheet just added, so it stayed applied for every case after
 *     the first miss and half the catalogue was skipped in silence (824 runs of
 *     text measured, against 1757 once fixed);
 *   - the ink read from the pixels, where small text under-reads (most of a
 *     13px stroke is blend) and a box whose highest-contrast changed pixel is
 *     not one of its own glyphs reads plain dark text as 1.89;
 *   - and the computed colour read as a string, so anything the browser
 *     answered in `oklch(...)` — everything authored with color-mix — was
 *     skipped rather than measured.
 *
 * The ground is still the median of what is under the glyphs, which is the one
 * place a judgement is made: text half on a photograph and half on a scrim is
 * reported against the middle of the two.
 *
 * What IS wired into a gate, and is stable: `npm run boundary` here, and
 * `npm run controls` in apps/showcase.
 */
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { decodePng, serveDir, FROZEN_NOW, refuseStaleBuild } from './lib/visual.mjs'

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
/* THE INK COMES FROM THE DOM, THE GROUND FROM THE PIXELS.
 *
 * The ground is the half the tokens cannot know: a run of text can sit on a
 * token, a gradient, a photograph or three nested surfaces, and only the frame
 * says which. The INK is not like that — `getComputedStyle(el).color` is the
 * exact value, with no anti-aliasing in it.
 *
 * Taking the ink from the pixels too was the first design and it cost twice.
 * Small text under-read: at 13px most of a stroke is ink blended with ground, so
 * the 99th-percentile pixel is not the colour anybody set, and `.meta-item`
 * (7.4:1 by the tokens) reported 2.63 on some runs and nothing on others. And a
 * box whose highest-contrast changed pixel is not one of its own glyphs read
 * plain dark text on a mid-blue heat cell as 1.89 (PivotTable's "164", 7:1 by
 * the tokens and by its own baseline).
 *
 * The frame still has to show the glyphs CHANGING — that is what says the text
 * is painted at all rather than clipped or covered — but what they are is no
 * longer guessed from them. The one case the DOM cannot answer is text painted
 * through a background (`background-clip: text`), and that is skipped rather
 * than guessed at. (2026-09-03) */
/* THE COLOUR COMES BACK AS BYTES, NOT AS A STRING.
 *
 * `getComputedStyle(el).color` is not always `rgb(...)`: a colour authored with
 * `color-mix(in oklch, …)` comes back as `oklch(0.889606 0.00240303 none)`, and a
 * reader that only understands rgb() skips it — silently, which is the worst way
 * for a check to miss something. The gate red team's own break was invisible for
 * exactly this reason (2026-09-03). So the page converts each colour through a
 * 1x1 canvas, which is the browser answering in sRGB whatever the notation. */
const composite = ([r, g, b, a], over) => (a >= 1 || !over ? [r, g, b] : [r, g, b].map((c, i) => Math.round(c * a + over[i] * (1 - a))))

/** Where the glyphs are: the pixels that changed when the ink was made
 *  transparent. Their colour in the HIDDEN frame is the ground the reader sees
 *  the text on — exactly, and per pixel, whatever is painting it.
 *
 *  Read from the box the element reports, so an element that paints nothing
 *  (clipped, covered, or ink the colour of its own ground) yields nothing and is
 *  left unmeasured rather than guessed at. */
function groundUnderGlyphs(shown, hidden, box, scale) {
  const x0 = Math.max(0, Math.round(box.x * scale)), y0 = Math.max(0, Math.round(box.y * scale))
  const x1 = Math.min(shown.width, Math.round((box.x + box.width) * scale))
  const y1 = Math.min(shown.height, Math.round((box.y + box.height) * scale))
  const px = []
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const i = (y * shown.width + x) * 4
      const d = Math.abs(shown.data[i] - hidden.data[i]) + Math.abs(shown.data[i + 1] - hidden.data[i + 1]) + Math.abs(shown.data[i + 2] - hidden.data[i + 2])
      /* 90 of 765: a real glyph, not a subpixel fringe. */
      if (d > 90) px.push([hidden.data[i], hidden.data[i + 1], hidden.data[i + 2]])
    }
  }
  /* Too few glyph pixels to be sure what is behind them: two characters at the
   * edge of the frame, or a run mostly clipped. */
  if (px.length < 40) return null
  /* THE MEDIAN OF WHAT IS UNDER THE TEXT, not of the element's box. A 16px round
   * badge is mostly the white page in its own bounding box — its corners and the
   * ring around it outnumber the fill — so the box median called it white on
   * white at 1.00:1 while the marker is white on indigo (2026-09-03). Under the
   * glyphs there is only ever the thing the reader is reading them against. */
  px.sort((a, b) => luminance(a) - luminance(b))
  return px[Math.floor(px.length / 2)]
}

/* The same guard `visual` uses: this measures dist and does not produce it. */
refuseStaleBuild(`${ROOT}/src`, `${ROOT}/dist/visual/index.html`)

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
    /* AND WAIT FOR THE CASE ITSELF TO WEAR THE THEME. The root attribute and the
     * custom properties on :root land first; the case subtree resolves its own
     * `color` one commit later, so reading computed colours here returned the
     * PREVIOUS theme's ink — light text measured as dark and dark as light, for
     * whichever cases lost the race. Same failure as the first version of this
     * check, one level down, and it only became visible once the ink stopped
     * being guessed from pixels (2026-09-03). */
    await page.waitForFunction(
      (n) => {
        const el = document.querySelector(`.visual-case[data-case="${n}"]`)
        if (!el) return false
        const hex = getComputedStyle(document.documentElement).getPropertyValue('--foreground').trim()
        const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex)
        if (!m) return true
        const want = [1, 2, 3].map((i) => parseInt(m[i], 16))
        const have = /rgba?\(([^)]+)\)/.exec(getComputedStyle(el).color)
        if (!have) return true
        const got = have[1].split(/[\s,/]+/).filter(Boolean).map(Number)
        return want.every((c, i) => Math.abs(c - got[i]) <= 2)
      },
      name,
    ).catch(() => {})

    /* AND LET THE STYLE RECALC LAND. Two frames are not enough here: with the
     * theme attribute already correct on the root, computed colours came back
     * as the other theme's for whichever cases lost the race — light text read
     * as dark ink and dark as light. Measured: at two frames, 11 to 16 findings
     * over three runs of an unchanged tree, every one of them in the 1.0-1.1
     * band; with this wait, the same set every time. (2026-09-03) */
    await page.waitForTimeout(120)

    /* Every element whose own text is a direct child — the element that owns
     * the glyphs, not its container. */
    const targets = await page.evaluate(() => {
      const out = []
      /* Any CSS colour to sRGB bytes, by painting it: the browser is the only
       * thing that knows what `oklch(...)`, `color-mix(...)` or a system colour
       * resolves to. */
      const canvas = document.createElement('canvas')
      canvas.width = canvas.height = 1
      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      const toRgb = (css) => {
        ctx.clearRect(0, 0, 1, 1)
        ctx.fillStyle = css
        ctx.fillRect(0, 0, 1, 1)
        const d = ctx.getImageData(0, 0, 1, 1).data
        return [d[0], d[1], d[2], d[3] / 255]
      }
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
        /* An open layer dims the page behind it, and the frame composites the
         * two: everything OUTSIDE the overlay is measured through the scrim, and
         * everything inside it is measured against a ground the DOM says is
         * above that scrim. The trigger button standing behind an open Modal read
         * 2.83 for exactly this reason (2026-09-03). While a layer is open, only
         * the layer is measurable. */
        const overlay = document.querySelector('.modal-overlay, .command-overlay')
        if (overlay) continue
        /* Text that is only for a screen reader has no ground: the accessible
         * table a Chart renders beside its bars is clipped to a pixel, so what
         * gets measured is whatever the clip left behind. Skipped by the class
         * that hides it, not by the box, because clipping leaves the layout box
         * its normal size. (2026-09-03) */
        if (el.closest('.sr-only')) continue
        /* Disabled text is exempt from contrast by the standard itself (1.4.3),
         * and this system dims it with opacity, so measuring it reports the
         * dimming rather than a decision anybody made. */
        if (el.closest('[disabled], [data-disabled], [aria-disabled="true"], :disabled')) continue
        const size = parseFloat(cs.fontSize)
        const weight = Number(cs.fontWeight) || 400
        /* Painted through a background, so the computed colour is not what the
         * reader sees. Left out rather than guessed at. */
        if ((cs.webkitBackgroundClip || cs.backgroundClip) === 'text') continue
        /* Painted through a background, so the computed colour is not the ink
         * the reader sees. Left out rather than guessed at. */
        if ((cs.webkitBackgroundClip || cs.backgroundClip) === 'text') continue
        out.push({
          text: text.slice(0, 40), color: cs.color, rgba: toRgb(cs.color),
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

    /* ONE STYLE ELEMENT, ADDRESSED BY ID, written and emptied in place.
     *
     * It used to be `addStyleTag` plus "tag whatever is last in the head", and
     * whatever is last in the head is not reliably the sheet just added — Vite
     * and React both put styles there. When the tag missed, the sheet stayed
     * applied for every case after it: their text was already transparent in
     * BOTH frames, so no pixels changed, so `inkOf` returned null and they were
     * skipped in silence. A check that measures a third of what it names is
     * worse than one that fails. (2026-09-03) */
    await page.evaluate(() => { document.getElementById('ink-hide')?.remove() })
    const shown = decodePng(await page.screenshot({ type: 'png' }))
    await page.evaluate((css) => {
      const el = document.createElement('style')
      el.id = 'ink-hide'
      el.textContent = css
      document.head.append(el)
    }, HIDE_INK)
    /* WAIT FOR THE GROUND FRAME TO BE PAINTED WITHOUT THE GLYPHS. Inserting the
     * stylesheet resolves as soon as the node is in the head; the paint that
     * removes the text happens on a later frame, and screenshotting between the
     * two captures a "ground" that still has the text in it. Ink then equals
     * ground and the ratio comes out at 1.0-1.1 for whichever cases lost the
     * race — which is why this check reported 18, 21 and 25 findings on three
     * consecutive runs of an unchanged tree, all of them in that band
     * (2026-09-03). Two frames, the same wait the theme swap already uses. */
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))))
    const shot = await page.screenshot({ type: 'png' })
    await page.evaluate(() => { document.getElementById('ink-hide')?.remove() })
    const png = decodePng(shot)

    for (const t of targets) {
      const bg = groundUnderGlyphs(shown, png, t.box, 1)
      if (!bg) continue
      if (!t.rgba || t.rgba[3] === 0) continue
      const ink = composite(t.rgba, bg)
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
      (process.env.INK_DEBUG ? `  ${DIM}ink ${f.ink} on ${f.bg} | box ${Math.round(f.box.x)},${Math.round(f.box.y)} ${Math.round(f.box.width)}x${Math.round(f.box.height)} | theme seen "${f.seenTheme}"${RESET}` : ''))
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
