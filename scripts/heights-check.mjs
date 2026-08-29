#!/usr/bin/env node
/* ONE ROW, ONE HEIGHT.
 *
 * A header is a search box, a toggle, an avatar and a button standing side by
 * side. If any of them is two pixels off the rest, the row does not sit on a
 * line — and the owner sees it long before anyone measures it (2026-08-29:
 * nothing in a row is allowed to jump).
 *
 * Nothing else in the gate could catch it. `states` reads stylesheets, `visual`
 * photographs each component ALONE, and the control that is 2px tall than its
 * neighbours is only wrong beside a neighbour. So this renders the real
 * components in a real browser and measures what came out.
 *
 * WHY A BROWSER. The heights are declared as `min-block-size` plus padding plus
 * a border, and what a component ACTUALLY stands at is the sum with its content
 * — <TagInput> declared 40 and rendered 42, because the tag inside it plus its
 * own padding pushed past its floor. A rule that reads the CSS would have
 * agreed with the declaration and missed it.
 *
 *   npm run heights
 */
import { chromium } from 'playwright'
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { serveDir } from './lib/visual.mjs'

const ROOT = fileURLToPath(new URL('..', import.meta.url)).replace(/\/$/, '')
const RED = '\x1b[31m', GREEN = '\x1b[32m', DIM = '\x1b[2m', BOLD = '\x1b[1m', YEL = '\x1b[33m', OFF = '\x1b[0m'

/* The control scale, from settings.css — read rather than repeated, so a token
   that moves moves this too. */
const settings = readFileSync(`${ROOT}/styles/settings.css`, 'utf8')
const rem = (name) => {
  const m = new RegExp(`--${name}:\\s*([\\d.]+)rem`).exec(settings)
  return m ? Math.round(parseFloat(m[1]) * 16) : null
}
const SCALE = { sm: rem('control-height-sm'), md: rem('control-height'), lg: rem('control-height-lg') }

/* Each entry: the example to render, and the selector for the control itself.
   A control that is not on this list is not measured — add it when it ships. */
const CONTROLS = [
  ['Button', '.btn'], ['IconButton', '.icon-button'], ['Input', '.input'],
  ['Select', '.select-trigger'], ['SearchInput', '.search-input'],
  ['DatePicker', '.datepicker-trigger'], ['NumberInput', '.number-input'],
  ['TimeInput', '.time-input'], ['SegmentedControl', '.segmented'],
  ['TagInput', '.taginput'], ['InputGroup', '.input-group'],
  ['ButtonGroup', '.button-group'], ['Chip', '.chip'], ['Tag', '.tag'],
  ['CopyButton', '.btn'], ['MenuButton', '.btn'],
  /* A face in a row stands beside controls, so it is measured with them. */
  ['Avatar', '.avatar'], ['Identity', '.avatar'], ['UserMenu', '.avatar'],
]

/* KNOWN AND ON PURPOSE. Each needs the reason, and the reason has to be about
   the part rather than about the number. Empty today: avatars joined the ladder
   on 2026-08-29 and nothing else asks to stand off it. */
const EXEMPT = {}

const { server, port } = await serveDir(`${ROOT}/dist`)
if (!existsSync(`${ROOT}/dist/visual/index.html`)) {
  console.error('No dist/visual/index.html — run `npm run build` first.')
  process.exit(1)
}

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
await page.goto(`http://127.0.0.1:${port}/visual/`, { waitUntil: 'networkidle' })

console.log(`${BOLD}Control heights${OFF} ${DIM}sm ${SCALE.sm} · md ${SCALE.md} · lg ${SCALE.lg}${OFF}\n`)

const wrong = []
for (const [name, selector] of CONTROLS) {
  await page.evaluate(([n]) => window.__show(n, 'light'), [name])
  await page.waitForTimeout(180)
  const found = await page.evaluate(([s]) => [...document.querySelectorAll(s)].map((el) => ({
    h: Math.round(el.getBoundingClientRect().height),
    size: el.getAttribute('data-size') ?? 'md',
  })), [selector])
  if (!found.length) continue
  /* One line per size actually rendered, not per instance. */
  const seen = new Map()
  for (const f of found) if (!seen.has(f.size)) seen.set(f.size, f.h)
  for (const [size, h] of seen) {
    /* `xl` and `2xl` are hero sizes with no control beside them; the scale does
       not name them and this does not measure them. */
    const want = SCALE[size]
    if (want == null) continue
    const ok = h === want
    if (!ok && !EXEMPT[name]) wrong.push(`${name} at ${size}: ${h}px, and the scale says ${want}`)
    console.log(`  ${ok ? GREEN + '✓' : RED + '✗'}${OFF} ${name.padEnd(18)}${DIM}${size}${OFF}  ${String(h).padStart(3)}px${ok ? '' : `  ${RED}want ${want}${OFF}`}`)
  }
}

for (const [name, why] of Object.entries(EXEMPT)) {
  console.log(`  ${YEL}—${OFF} ${name.padEnd(18)}${DIM}not measured: ${why}${OFF}`)
}

await browser.close()
server.close()

if (wrong.length) {
  console.error(`\n${RED}✗ ${wrong.length} control(s) do not stand on the scale:${OFF}`)
  for (const w of wrong) console.error(`    ${w}`)
  console.error(`\n  ${DIM}A row of controls sits on one line or it does not. Fix the control, or`)
  console.error(`  record it in EXEMPT with a reason about the control and not about the number.${OFF}`)
  process.exit(1)
}
console.log(`\n${GREEN}✓ every measured control stands on the control scale.${OFF}`)
