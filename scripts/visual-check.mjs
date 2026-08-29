/* Visual regression — the one class of breakage the rest of the gate cannot see.
 *
 * Everything else here checks structure, ARIA, tokens and behaviour. None of it
 * notices that a card lost its padding or that dark mode turned a surface white.
 * This renders every golden example in a real browser, in both themes, and
 * compares the pixels with a committed baseline.
 *
 * Run: npm run build && npm run visual          compare against the baseline
 *      npm run build && npm run visual:update   accept the current rendering
 *
 * TWO baselines per case, taken from the same rendered frame:
 *
 *   visual/baseline/*.png     the pixels. Sees everything, explains nothing.
 *   visual/structure/*.json   where every box is and what it resolved to
 *                             (scripts/lib/structure.mjs). Blind to antialiasing
 *                             and to the inside of an SVG, identical on every OS.
 *
 * The pixels used to be the whole check, and they conflate two events: a card
 * that lost its padding and a machine that hints text differently are both "3%
 * of pixels changed". That is why this file used to say a diff means "look at
 * this", not "you broke it" - true, and useless as a gate.
 *
 * Now the two are read together, and `visual/environment.json` records where the
 * baselines were taken:
 *
 *   structure differs            a real change. Fails on every machine, always.
 *   pixels differ, same machine  a real change. Fails, exactly as before.
 *   pixels differ, other machine + structure agrees
 *                                the rasteriser. Reported, does not fail.
 *
 * So nothing got weaker on the machine that owns the baselines, and a clone on
 * another OS stops reporting breakage it cannot have caused. Regenerate with
 * :update when a change is intended, never to silence one.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync, unlinkSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { comparePng, serveDir, FROZEN_NOW } from './lib/visual.mjs'
import { measure, compareStructure } from './lib/structure.mjs'

const ROOT = fileURLToPath(new URL('..', import.meta.url)).replace(/\/$/, '')
const DIST = `${ROOT}/dist`
const BASELINE = `${ROOT}/visual/baseline`
const STRUCTURE = `${ROOT}/visual/structure`
const ENVIRONMENT = `${ROOT}/visual/environment.json`
const DIFF_DIR = `${ROOT}/visual/.diff`
const update = process.argv.includes('--update')

/* Anti-aliasing can flip a handful of subpixels between runs on the same
 * machine; anything above this is a real change. */
const TOLERANCE = 0.001 // 0.1% of pixels

if (!existsSync(`${DIST}/visual/index.html`)) {
  console.error('No dist/visual/index.html — run `npm run build` first.')
  process.exit(1)
}

/* A BUILD THIS OLD IS A LIE, NOT A BASELINE.
 *
 * This script photographs `dist`; it does not produce it. In the gate that is
 * right, because `build:gate` runs two lanes ahead of it. Run by hand it is a
 * trap: three edits in a row were photographed against a stale bundle and every
 * one of them came back "baselines match" on a file that had just changed
 * (2026-08-29) — and `--update` would have written that stale rendering INTO
 * the baseline, which is the way a wrong picture becomes the expected one.
 *
 * So the build has to be at least as new as everything it was built from. */
const newestSource = (() => {
  let newest = 0
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      if (name === 'node_modules' || name.startsWith('.')) continue
      const path = `${dir}/${name}`
      const info = statSync(path)
      if (info.isDirectory()) walk(path)
      else if (/\.(tsx?|css|json)$/.test(name)) newest = Math.max(newest, info.mtimeMs)
    }
  }
  walk(`${ROOT}/src`)
  return newest
})()

const builtAt = statSync(`${DIST}/visual/index.html`).mtimeMs
if (newestSource > builtAt) {
  const minutes = Math.round((newestSource - builtAt) / 60000)
  console.error(`dist is ${minutes} minute(s) older than src — this would photograph the previous build.`)
  console.error('Run `npm run build` first. (The gate does; running this script by hand does not.)')
  process.exit(1)
}

/* PNG decode, compare and the static server now live in ./lib/visual.mjs, so the
 * screen-level gate uses the same pixels rather than a second copy. */

const { server, port } = await serveDir(DIST)

/* ── run ──────────────────────────────────────────────────────────── */

const browser = await chromium.launch()

/* Several pages at once, because the wall time here is almost entirely WAITING.
 * Each case needs a fixed settle pause (see below), and 162 cases x 2 themes
 * paying it one after another was 97 seconds of a 110-second step doing nothing.
 * The pause is per case and cannot be shortened without making baselines flaky;
 * it CAN be paid in parallel. Six is a balance: the machine has cores to spare
 * and each page is one small DOM. */
const LANES = 6

async function openPage() {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 1,
    colorScheme: 'light',
    reducedMotion: 'reduce', // no animation mid-screenshot
  })
  /* Freeze the clock before anything renders: a component that prints "5 days
   * ago" is a component whose baseline rots by itself otherwise. Same instant as
   * screens-check, from the same constant, so the two cannot drift. */
  await page.clock.setFixedTime(new Date(FROZEN_NOW))
  await page.goto(`http://127.0.0.1:${port}/visual/`, { waitUntil: 'networkidle' })
  await page.waitForFunction(() => Array.isArray(window.__cases) && window.__cases.length > 0)
  /* Force EVERY declared face to load, then wait. `document.fonts.ready`
   * resolves for the faces requested so far, and a face is only requested when
   * something using it renders — so a heading that arrives after hydration is
   * fetched after the promise has already settled, and the shot catches the
   * fallback. Two awaits with a beat between made it rarer and not rare enough:
   * one product still flaked on 2026-08-16. Loading them explicitly removes the
   * race instead of narrowing it. A face whose file is not there rejects, and one
   * missing font is not a reason to fail a layout check: the shot shows it
   * anyway. */
  await page.evaluate(`(async () => {
    await Promise.all([...document.fonts].map((f) => f.load().catch(() => {})))
    await document.fonts.ready
    /* A second pass, because the first one can ADD faces: a family requested
     * while the page was still laying out lands in document.fonts after the
     * first enumeration and is still unloaded when the shot is taken. */
    await Promise.all([...document.fonts].map((f) => f.load().catch(() => {})))
    await document.fonts.ready
    /* Then WAIT on the state the picture depends on, rather than on a promise
     * that has already resolved: a face is 'unloaded' until something asks for
     * it and 'loading' until it arrives. Two load passes narrowed the race and
     * did not close it — a product still lost about one run in five — because
     * the second pass can itself trigger a fetch. This polls the faces
     * themselves, with a ceiling so a genuinely missing file cannot hang. */
    const deadline = Date.now() + 3000
    while (Date.now() < deadline && [...document.fonts].some((f) => f.status !== 'loaded' && f.status !== 'error')) {
      await new Promise((r) => setTimeout(r, 50))
    }
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
  })()`)

  /* Kill everything that changes between two identical renders: a dialog
   * autofocuses an input, and a blinking caret alone was enough to push a
   * screenshot past the tolerance. Injected here, not in the app's CSS, because
   * it is a property of the measurement, not of the design system. */
  await page.addStyleTag({
    content: `*, *::before, *::after {
      caret-color: transparent !important;
      animation: none !important;
      transition: none !important;
    }`,
  })
  return page
}

const page = await openPage()

mkdirSync(BASELINE, { recursive: true })
mkdirSync(STRUCTURE, { recursive: true })

/* Where the committed baselines were taken. Only the things that decide what a
 * pixel ends up being: the OS rasteriser, the browser that drew it, and the
 * frame it was drawn into. Missing file means the baselines predate this record,
 * so the run is treated as same-machine and nothing gets weaker by accident. */
const environment = {
  platform: process.platform,
  arch: process.arch,
  chromium: browser.version(),
  viewport: '1280x800@1',
}
const recorded = existsSync(ENVIRONMENT) ? JSON.parse(readFileSync(ENVIRONMENT, 'utf8')) : null
const sameMachine =
  !recorded ||
  (recorded.platform === environment.platform &&
    recorded.arch === environment.arch &&
    recorded.chromium === environment.chromium &&
    recorded.viewport === environment.viewport)

let failed = 0
let written = 0
let environmental = 0
const seen = new Set()
const seenStructure = new Set()

function checkPixels(key, shot) {
  const file = `${BASELINE}/${key}.png`
  if (!existsSync(file)) {
    writeFileSync(file, shot)
    return { kind: 'new' }
  }
  const { ratio, note } = comparePng(shot, readFileSync(file))
  if (ratio <= TOLERANCE) return { kind: 'ok', ratio }
  if (update) {
    writeFileSync(file, shot)
    return { kind: 'updated', ratio }
  }
  mkdirSync(DIFF_DIR, { recursive: true })
  writeFileSync(`${DIFF_DIR}/${key}.actual.png`, shot)
  return { kind: 'diff', ratio, note }
}

/* One element per line. The registry is pretty-printed for the same reason: this
 * file is committed, and accepting a change means reading its diff. A single
 * JSON.stringify would put four hundred boxes on one line and make the review
 * impossible; full indentation would triple the file for nothing. */
function serialise({ elements, truncated }) {
  const rows = Object.entries(elements).map(([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v)}`)
  return `{\n "truncated": ${truncated},\n "elements": {\n${rows.join(',\n')}\n }\n}\n`
}

function checkStructure(key, measured) {
  const file = `${STRUCTURE}/${key}.json`
  if (!existsSync(file)) {
    writeFileSync(file, serialise(measured))
    return { kind: 'new', truncated: measured.truncated }
  }
  const diffs = compareStructure(measured, JSON.parse(readFileSync(file, 'utf8')))
  if (!diffs.length) return { kind: 'ok', truncated: measured.truncated }
  if (update) {
    writeFileSync(file, serialise(measured))
    return { kind: 'updated', diffs, truncated: measured.truncated }
  }
  return { kind: 'diff', diffs, truncated: measured.truncated }
}

try {
  const cases = await page.evaluate(() => window.__cases)
  console.log(`\x1b[1mVisual regression\x1b[0m  ${cases.length} cases x 2 themes\n`)

  const jobs = []
  for (const name of cases) for (const theme of ['light', 'dark']) jobs.push([name, theme])
  for (const [name, theme] of jobs) {
    seen.add(`${name}.${theme}.png`)
    seenStructure.add(`${name}.${theme}.json`)
  }

  /* Results are collected first and printed afterwards, in job order: six lanes
   * finishing out of order would otherwise interleave the log and make a failure
   * hard to find. */
  const results = new Array(jobs.length)
  let next = 0
  const lane = async (lanePage) => {
    for (;;) {
      const i = next++
      if (i >= jobs.length) return
      results[i] = await shoot(lanePage, jobs[i][0], jobs[i][1])
    }
  }

  async function shoot(page, name, theme) {
      const key = `${name}.${theme}`
      await page.evaluate(([n, t]) => window.__show(n, t), [name, theme])
      /* Long enough for React to commit, the browser to paint, AND every
       * deferred UI state to land. A dialog focuses its close button, whose
       * Tooltip opens 300ms later: with a shorter wait the tooltip was in some
       * screenshots and not others, which is a flaky baseline, not a diff. */
      await page.waitForTimeout(600)
      const shot = await page.screenshot({ type: 'png' })
      /* Read from the frame that was just photographed, in the same lane, before
       * anything else touches the page. The two baselines have to describe ONE
       * render, or the structure cannot say anything about the pixels. */
      const measured = await measure(page)
      return { key, pixels: checkPixels(key, shot), structure: checkStructure(key, measured) }
  }

  /* One extra page per lane beyond the one already open. */
  const extra = await Promise.all(Array.from({ length: LANES - 1 }, () => openPage()))
  await Promise.all([page, ...extra].map((p) => lane(p)))
  for (const p of extra) await p.close()

  /* How many structural differences to print per case. Enough to see what moved,
   * few enough that one broken flex container does not bury the other 161 cases.
   * The count of the rest is always printed: a truncated report that hides that
   * it truncated is how a check starts being ignored. */
  const SHOWN = 8

  for (const r of results) {
    const { key, pixels: p, structure: s } = r
    if (s.truncated) {
      console.log(`  \x1b[33m!\x1b[0m ${key} \x1b[2mstructure capped: ${s.truncated} element(s) past the limit were not measured\x1b[0m`)
    }

    /* Structure first, and it decides. It is the only one of the two that means
     * the same thing on every machine. */
    if (s.kind === 'diff') {
      failed++
      const pixelNote = p.kind === 'diff' ? `, ${(p.ratio * 100).toFixed(2)}% of pixels` : ', pixels unchanged'
      console.log(`  \x1b[31m✗\x1b[0m ${key} \x1b[2m${s.diffs.length} structural difference(s)${pixelNote}\x1b[0m`)
      for (const d of s.diffs.slice(0, SHOWN)) console.log(`      \x1b[2m${d}\x1b[0m`)
      if (s.diffs.length > SHOWN) console.log(`      \x1b[2m...and ${s.diffs.length - SHOWN} more\x1b[0m`)
      if (p.kind === 'diff') console.log(`      actual: visual/.diff/${key}.actual.png   baseline: visual/baseline/${key}.png`)
      continue
    }

    if (p.kind === 'diff') {
      /* The whole point of the second baseline. Only a structure that MATCHED can
       * vindicate the pixels: one that is new has nothing to compare against and
       * says nothing, so that case stays a failure. */
      if (!sameMachine && s.kind === 'ok') {
        environmental++
        console.log(`  \x1b[33m~\x1b[0m ${key} \x1b[2m${(p.ratio * 100).toFixed(2)}% of pixels differ, structure identical: rasterisation, not breakage\x1b[0m`)
      } else {
        failed++
        console.log(`  \x1b[31m✗\x1b[0m ${key} \x1b[2m${(p.ratio * 100).toFixed(2)}% of pixels changed (${p.note})\x1b[0m`)
        console.log(`      actual: visual/.diff/${key}.actual.png   baseline: visual/baseline/${key}.png`)
      }
      continue
    }

    const fresh = [p.kind === 'new' && 'pixels', s.kind === 'new' && 'structure'].filter(Boolean)
    const accepted = [p.kind === 'updated' && 'pixels', s.kind === 'updated' && 'structure'].filter(Boolean)
    if (fresh.length) {
      written++
      console.log(`  \x1b[36m+\x1b[0m ${key} \x1b[2mnew baseline (${fresh.join(' + ')})\x1b[0m`)
    } else if (accepted.length) {
      written++
      const how = p.kind === 'updated' ? ` ${(p.ratio * 100).toFixed(2)}% of pixels` : ''
      console.log(`  \x1b[36m~\x1b[0m ${key} \x1b[2mbaseline updated (${accepted.join(' + ')})${how}\x1b[0m`)
    } else {
      console.log(`  \x1b[32m✓\x1b[0m ${key}`)
    }
  }

  /* A baseline whose case is gone is dead weight, and worse, it hides that the
   * example was deleted. Both layers, or the two sets drift apart silently. */
  const staleFiles = [
    ...readdirSync(BASELINE).filter((f) => f.endsWith('.png') && !seen.has(f)).map((f) => [BASELINE, f, 'visual/baseline']),
    ...readdirSync(STRUCTURE).filter((f) => f.endsWith('.json') && !seenStructure.has(f)).map((f) => [STRUCTURE, f, 'visual/structure']),
  ]
  for (const [dir, f, label] of staleFiles) {
    const name = f.replace(/\.(png|json)$/, '')
    if (update) {
      unlinkSync(`${dir}/${f}`)
      console.log(`  \x1b[36m-\x1b[0m ${name} \x1b[2mstale baseline removed (${label})\x1b[0m`)
    } else {
      failed++
      console.log(`  \x1b[31m✗\x1b[0m ${name} \x1b[2m${label} baseline has no case any more (run npm run visual:update)\x1b[0m`)
    }
  }
} finally {
  await browser.close()
  server.close()
}

console.log('')

/* Record the machine only when this run has the standing to: an explicit accept,
 * or a run that agreed with every committed baseline (whatever machine that is,
 * it renders what the baselines say). A failing run on an unrecorded checkout
 * must not claim ownership, or the next run inherits a lie. */
if (update || (!recorded && !failed)) {
  writeFileSync(ENVIRONMENT, `${JSON.stringify(environment, null, 2)}\n`)
}

if (!sameMachine) {
  console.log(
    `\x1b[2mBaselines were taken on ${recorded.platform}/${recorded.arch}, Chromium ${recorded.chromium}; this is ${environment.platform}/${environment.arch}, Chromium ${environment.chromium}.\n` +
      `Pixel differences are only reported here; the structure baselines are what fails.\x1b[0m\n`,
  )
}

if (failed) {
  console.error(`\x1b[31m✗ ${failed} visual difference(s).\x1b[0m Structural ones are real on any machine. For a pixel diff, look at the actual/baseline pair; if the change is intended, npm run visual:update.`)
  process.exit(1)
}
const notes = [
  written ? `${written} written` : '',
  environmental ? `${environmental} pixel-only difference(s) attributed to this machine` : '',
].filter(Boolean)
console.log(`\x1b[32m✓ visual baselines match.\x1b[0m${notes.length ? ` (${notes.join(', ')})` : ''}`)
