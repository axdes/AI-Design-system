#!/usr/bin/env node
/* A SURFACE THE SAME COLOUR AS WHAT IT SITS ON IS NOT A SURFACE.
 *
 * `contrast` reads token pairs out of one CSS rule. `boundary` reads edge tokens
 * against surface tokens. Both are static, and both were green all day on
 * 2026-08-29 while four separate parts were invisible in the browser:
 *
 *   <Switch>            the thumb's `background` resolved to `1rem`, because a
 *                       local length shadowed the semantic colour of the same
 *                       name. An invalid value is not a bad colour pair; it is
 *                       no declaration at all, and nothing static sees it.
 *   <SegmentedControl>  the track took `--surface-contrast`, which IS `--card`,
 *                       and the selected pill took `--background`. Two surface
 *                       tokens, both legitimate, 1.00:1 against each other —
 *                       and which one sits on which is only knowable from the
 *                       rendered tree.
 *   <Card> on white     no fill difference and no border, because the rule that
 *                       gives a card its outline was written per container.
 *   <BatchActions>      `--accent-soft` on the page's `--muted`: 1.05:1.
 *
 * So this one renders and looks. For every element that PAINTS — a fill, a
 * border or a ring — it walks up to the nearest painted ancestor and asks
 * whether the reader could tell them apart. It is the cheapest possible version
 * of the thing that actually found all four: opening the gallery and looking.
 *
 * NOT A GATE STEP, AND THAT IS DELIBERATE. Two things stop it being one today,
 * and both are honest rather than fixable in the same hour:
 *
 *   It OVERLAPS `boundary`, which already measures the same question from the
 *   token side and already carries the decisions. `--input` sits at 1.00:1
 *   against `--popover` in dark and that is not a bug: the owner took it on
 *   2026-08-23 with the reason written beside it, because the 3:1 stop reads as
 *   chrome on every form in every product, and what identifies the field is its
 *   text at 4.5:1, its focus ring at 7.59 and its red border when invalid. A
 *   second check that fires on the same pair would be re-litigating a decision
 *   the system has already made and recorded.
 *
 *   And turning it green needs about forty judgements — a page header IS the
 *   page and is meant to be, a card on a card is not — and an allow list written
 *   in a hurry is exactly the kind of recorded reason this system refuses to
 *   fake.
 *
 * It earns its place as a REPORT: run it after a change and read what moved. The
 * work to merge it into `boundary`, so there is one answer to this question
 * instead of two, is the thing to do next.
 *
 *   npm run invisible
 */
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { serveDir } from './lib/visual.mjs'

const ROOT = fileURLToPath(new URL('..', import.meta.url)).replace(/\/$/, '')
const RED = '\x1b[31m', GREEN = '\x1b[32m', DIM = '\x1b[2m', BOLD = '\x1b[1m', OFF = '\x1b[0m'

if (!existsSync(`${ROOT}/dist/visual/index.html`)) {
  console.error('No dist/visual/index.html — run `npm run build` first.')
  process.exit(1)
}

/* Parts that are the same colour as their ground ON PURPOSE, each with the
   reason. A surface that means to be invisible has to say so here. */
const ALLOW = JSON.parse(readFileSync(`${ROOT}/config/invisible-allow.json`, 'utf8'))

/* THE FLOOR IS BELOW THE SYSTEM'S OWN SMALLEST INTENDED STEP, and finding that
   number was the first thing this check taught. A white card on the muted page
   measures 1.09:1 — that is the primary separation in this whole system, made
   on purpose and stated in Card.css. Set the floor above it and the check calls
   139 correct surfaces broken, which is a check nobody will keep.
   
   1.06 sits under every deliberate step and over a true collision: <BatchActions>
   measured 1.05 while claiming to be a wash, and a fill identical to its ground
   measures 1.00. What is caught here is not "low contrast", it is "the same
   colour". */
const FLOOR = 1.06

const { server, port } = await serveDir(`${ROOT}/dist`)
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
await page.goto(`http://127.0.0.1:${port}/visual/`, { waitUntil: 'networkidle' })

const cases = await page.evaluate(() => window.__cases)
console.log(`${BOLD}Invisible surfaces${OFF} ${DIM}${cases.length} examples x 2 themes, measured in the browser${OFF}\n`)

const findings = []
for (const name of cases) {
  for (const theme of ['light', 'dark']) {
    await page.evaluate(([n, t]) => window.__show(n, t), [name, theme])
    await page.waitForTimeout(90)
    const bad = await page.evaluate(([FLOOR]) => {
      const lin = (c) => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4 }
      const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
      const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05) }
      const rgb = (s) => { const m = /rgba?\(([^)]+)\)/.exec(s); if (!m) return null
        const p = m[1].split(/[ ,/]+/).map(Number); return p[3] === 0 ? null : [p[0], p[1], p[2]] }

      const painted = (el) => rgb(getComputedStyle(el).backgroundColor)
      const groundOf = (el) => {
        for (let p = el.parentElement; p; p = p.parentElement) { const c = painted(p); if (c) return c }
        return [255, 255, 255]
      }
      const out = []
      for (const el of document.querySelectorAll('body *')) {
        /* The harness's own chrome is not the system. */
        const cls = typeof el.className === 'string' ? el.className : ''
        if (/\bvisual-/.test(cls)) continue
        const s = getComputedStyle(el)
        const box = el.getBoundingClientRect()
        if (box.width < 8 || box.height < 8) continue
        if (s.visibility === 'hidden' || s.opacity === '0') continue
        const fill = painted(el)
        if (!fill) continue                       /* transparent: nothing claimed */
        const ground = groundOf(el)
        const r = ratio(fill, ground)
        if (r >= FLOOR) continue                  /* a real step */
        /* A border on ANY side, an outline, or a shadow is a separation of its
           own — a table header is divided by its bottom rule, not its top. */
        const sides = [['borderTopWidth', 'borderTopColor'], ['borderBottomWidth', 'borderBottomColor'],
                       ['borderLeftWidth', 'borderLeftColor'], ['borderRightWidth', 'borderRightColor']]
        const hasEdge = sides.some(([w, c]) => {
          const e = rgb(s[c]); return parseFloat(s[w]) > 0 && e && ratio(e, fill) >= FLOOR
        })
        const hasOutline = parseFloat(s.outlineWidth) > 0 && s.outlineStyle !== 'none'
        const hasShadow = s.boxShadow !== 'none'
        if (hasEdge || hasOutline || hasShadow) continue
        out.push({
          cls: (el.className && typeof el.className === 'string' ? el.className.split(' ')[0] : el.tagName.toLowerCase()),
          ratio: Math.round(r * 100) / 100,
          w: Math.round(box.width), h: Math.round(box.height),
        })
      }
      /* One line per class, not per instance. */
      const seen = new Map()
      for (const o of out) if (!seen.has(o.cls)) seen.set(o.cls, o)
      return [...seen.values()]
    }, [FLOOR])
    for (const b of bad) {
      const key = `${name}/${b.cls}`
      if (ALLOW[key] || ALLOW[b.cls]) continue
      findings.push({ name, theme, ...b })
    }
  }
}

await browser.close()
server.close()

if (findings.length) {
  const byName = new Map()
  for (const f of findings) {
    const k = `${f.name}/${f.cls}`
    if (!byName.has(k)) byName.set(k, { ...f, themes: new Set() })
    byName.get(k).themes.add(f.theme)
  }
  console.error(`${RED}✗ ${byName.size} surface(s) the reader cannot tell from what they sit on:${OFF}\n`)
  for (const f of byName.values()) {
    console.error(`  ${RED}✗${OFF} ${f.name.padEnd(20)}${DIM}.${f.cls}${OFF}  ${f.ratio}:1  ${DIM}${f.w}x${f.h}, ${[...f.themes].join(' + ')}${OFF}`)
  }
  console.error(`\n  ${DIM}Give it a step, an edge or a shadow — or, if it means to be the same colour,`)
  console.error(`  record it in config/invisible-allow.json with the reason.${OFF}`)
  process.exit(1)
}
console.log(`${GREEN}✓ every painted surface is a step away from what it sits on.${OFF}`)
