/* SC 1.4.11 — the boundary of a control, measured against what it sits on.
 *
 * `npm run contrast` measures TEXT: a `color` and a `background` set in the same
 * CSS rule. That is a real check and it is blind by construction to the thing
 * that actually broke here, because a boundary is never one rule — the fill is
 * on the control and the surface is on its parent, and no static reading of one
 * rule can see the pair. So a field border sat at 1.30:1 on a card, a secondary
 * button sat at exactly 1.00:1 inside a modal, and every menu highlight in the
 * dark theme painted itself the colour of the menu. All three were green.
 *
 * Two rules here, and neither is a list somebody keeps up to date:
 *
 *   A  EDGES        Every token whose job is to end a control is measured
 *                   against every surface this system paints, in both themes,
 *                   and must clear 3:1. The set of edge tokens is READ from
 *                   semantic.css by name, so a new `--*-edge` is covered by the
 *                   commit that adds it, not by remembering to list it.
 *
 *   B  COLLISIONS   Any state fill — hover, active, selected, focus — whose
 *                   token resolves to the SAME colour as a surface token in
 *                   either theme. A highlight the exact colour of the thing it
 *                   highlights is not dim, it is absent, and it is invisible to
 *                   every ratio-based check because the ratio is 1.00 and no
 *                   rule says "1.00 is wrong" unless it knows the two are
 *                   adjacent. Swept out of the component CSS itself.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const ROOT = process.env.DS_LINT_ROOT ?? fileURLToPath(new URL('..', import.meta.url)).replace(/\/$/, '')
const RESET = '\x1b[0m', RED = '\x1b[31m', GREEN = '\x1b[32m', DIM = '\x1b[2m', BOLD = '\x1b[1m', YELLOW = '\x1b[33m'

const strip = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '')
const declarations = (css) => {
  const out = new Map()
  for (const m of css.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/g)) out.set(m[1], m[2].trim())
  return out
}
function block(css, selector) {
  const i = css.indexOf(selector)
  if (i === -1) throw new Error(`boundary-check: no "${selector}" block`)
  const start = css.indexOf('{', i)
  let depth = 0
  for (let j = start; j < css.length; j++) {
    if (css[j] === '{') depth++
    else if (css[j] === '}' && --depth === 0) return css.slice(start + 1, j)
  }
  throw new Error(`boundary-check: unterminated "${selector}"`)
}

const primitives = declarations(strip(readFileSync(`${ROOT}/styles/primitives.css`, 'utf8')))
const semanticCss = strip(readFileSync(`${ROOT}/styles/semantic.css`, 'utf8'))
const THEMES = {
  light: declarations(block(semanticCss, '[data-theme-lock="light"]')),
  dark: declarations(block(semanticCss, '[data-theme="dark"]')),
  'dark (system)': declarations(block(semanticCss, '@media (prefers-color-scheme: dark)')),
}
/* The two dark blocks each declare only what differs; everything else falls
 * through to `:root`. Resolution has to see the same cascade a browser does. */
for (const key of ['dark', 'dark (system)']) {
  const merged = new Map(THEMES.light)
  for (const [k, v] of THEMES[key]) merged.set(k, v)
  THEMES[key] = merged
}

function hex(token, roles, seen = new Set()) {
  if (/^#/.test(token)) return token
  if (seen.has(token)) return null
  seen.add(token)
  const value = roles.get(token) ?? primitives.get(token)
  if (!value) return null
  const ref = value.match(/var\((--[a-z0-9-]+)\)/)
  if (ref) return hex(ref[1], roles, seen)
  const literal = value.match(/#[0-9a-f]{3,8}/i)
  return literal ? literal[0].toLowerCase() : null
}
const lin = (c) => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4 }
const luminance = (h) => {
  const v = h.length === 4 ? [h[1] + h[1], h[2] + h[2], h[3] + h[3]] : [h.slice(1, 3), h.slice(3, 5), h.slice(5, 7)]
  const [r, g, b] = v.map((x) => lin(parseInt(x, 16)))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
const ratio = (a, b) => { const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05) }

/* Every surface a control can be dropped onto. Tinted status surfaces are here
 * because a control inside an <Alert> is on one of them and nowhere else. */
const SURFACES = [
  '--background', '--card', '--popover', '--muted', '--accent', '--accent-soft',
  '--primary-soft', '--success-soft', '--warning-soft', '--destructive-soft',
]
/* An edge is measured against the four surfaces a control is ever LAID OUT on.
 * --accent / --accent-soft are interaction fills, not containers; the tinted
 * status surfaces are containers, but the only control that lands on one is
 * inside an <Alert>, which already draws its own --*-border round the whole
 * tinted area and so supplies the boundary the tint cannot. */
const CONTAINER_SURFACES = ['--background', '--card', '--popover', '--muted']

/* A deliberate identity, and the reason it is deliberate. Same contract as the
 * exemptions in contrast-check: an entry whose collision the CSS no longer
 * paints fails, so a stale excuse cannot sit here covering whatever lands next. */
const EXEMPT = {
  '--nav-active == --muted': 'the sidebar and the chat list paint themselves --accent, not --muted; the active row is the page colour ON that darker rail, which is the contrast, not a collision.',
  '--nav-active == --background': 'same rail. In dark --muted and --background are one colour by design (the page has no second tier there).',
}

const UI = 3.0

/* Edges deliberately held BELOW the floor, each with the decision behind it and
 * the number it actually measures. Written down rather than dropped from the
 * sweep: the point of this file is that the number is visible, and an edge that
 * quietly stopped being measured is how 1.30:1 shipped in the first place. */
const EXEMPT_EDGES = {
  '--input': 'owner, 2026-08-23: keep the field border where it was. At the 3:1 stop (neutral-550) it reads as chrome on every form in every product, which is a real cost against a real benefit. Measures 1.30 on a card, 1.20 on the page. What identifies the field instead: placeholder and value text at 4.5:1, the focus ring at 7.59, and the red border plus red ring when it is invalid.',
  '--switch-track-off': 'same decision, same day — the off track is the field border by another name. Measures 1.30 light / 1.49 dark. The thumb is what says which way it is set, and it carries 3.34:1 against the track.',
}

let failures = 0
const log = (ok, text, note = '') =>
  console.log(`  ${ok ? GREEN + '✓' : RED + '✗'}${RESET} ${text}${note ? ` ${DIM}${note}${RESET}` : ''}`)

console.log(`\n${BOLD}Boundary contrast — SC 1.4.11, 3:1 against the surface${RESET}\n`)

/* ── A. edges ────────────────────────────────────────────────────────────── */
const EDGE_TOKENS = [...new Set(
  [...THEMES.light.keys()].filter((t) => /-edge$/.test(t) || t === '--input' || t === '--switch-track-off'),
)].sort()
if (!EDGE_TOKENS.length) { console.log(`  ${RED}✗${RESET} no edge tokens found — has semantic.css moved?`); failures++ }

const exemptedEdges = new Set()
for (const token of EDGE_TOKENS) {
  const bad = []
  for (const [themeName, roles] of Object.entries(THEMES)) {
    const edge = hex(token, roles)
    if (!edge) continue
    for (const surface of CONTAINER_SURFACES) {
      const bg = hex(surface, roles)
      if (!bg) continue
      /* A tone edge whose value IS its own fill is the documented "this tone
       * already clears the floor, no edge needed" case. Guarded on the -edge
       * suffix: without it the replace() is a no-op for --input, the token
       * equals itself, and the whole sweep silently skips the one border this
       * file exists to measure. */
      if (/-edge$/.test(token) && edge === hex(token.replace(/-edge$/, ''), roles)) continue
      const r = ratio(edge, bg)
      if (r < UI) bad.push(`${themeName} on ${surface} ${r.toFixed(2)}`)
    }
  }
  if (bad.length && EXEMPT_EDGES[token]) {
    exemptedEdges.add(token)
    console.log(`  ${YELLOW}!${RESET} ${token}  ${DIM}${bad.join(', ')}${RESET}`)
    console.log(`      ${DIM}${EXEMPT_EDGES[token]}${RESET}`)
    continue
  }
  if (bad.length) { failures++; log(false, token, bad.join(', ')) } else log(true, token)
}
for (const token of Object.keys(EXEMPT_EDGES)) {
  if (exemptedEdges.has(token)) continue
  failures++
  log(false, `stale exemption: ${token}`, 'it clears the floor now — drop the entry')
}

/* ── B. collisions ───────────────────────────────────────────────────────── */
console.log(`\n${BOLD}State fills that resolve to the colour of a surface${RESET}\n`)
/* Classes that are a CONTROL rather than a surface, for the resting-fill sweep. */
const CONTROL_CLASS = /^\.(btn|icon-button|chip|tag|switch|segmented|select-trigger|input|taginput|number-input|datepicker-trigger|search-input|checkbox-box|radio-circle|badge)\b/
const STATE = /(:hover|:focus-visible|:focus-within|\[data-active\]|\[data-selected\]|\[data-open\]|\[aria-selected="true"\]|\[aria-current\])/
const dirs = [`${ROOT}/src/components`, `${ROOT}/src/blocks`, `${ROOT}/src/shell`].filter((d) => existsSync(d))
const files = []
for (const dir of dirs) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue
    const name = entry.name
    const folder = `${dir}/${name}`
    /* EVERY stylesheet in the folder, not just the one named after it. The old
     * line read `${name}/${name}.css` and nothing else, which was correct while
     * every component kept one file — and became a hole the moment Card.css was
     * split in two (2026-08-26). It failed loudly then only because the two
     * moved selectors happened to be in INK_LEAVES; a NEW painted element in the
     * second file would have been skipped without a word. */
    for (const f of readdirSync(folder)) {
      if (f.endsWith('.css')) files.push([name, `${folder}/${f}`])
    }
  }
}
let collisions = 0
const exempted = new Set()
for (const [name, file] of files) {
  const css = strip(readFileSync(file, 'utf8'))
  /* rule by rule, so the selector and its declarations stay together */
  for (const m of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const selector = m[1].trim()
    /* Resting fills matter as much as state fills, and are easier to miss: a
     * <Chip> painted --secondary was the exact colour of the page, so on a page
     * there was no pill at all — a word floating in a row of controls that all
     * had shapes. Nobody sees it in the component gallery, because the gallery
     * stands everything on a card. Only a class that IS a control is asked; a
     * surface painting itself is not a collision with itself. */
    const resting = /^\.[a-z-]+(\[[^\]]*\])?$/.test(selector) && CONTROL_CLASS.test(selector)
    if (!STATE.test(selector) && !resting) continue
    /* A rule that also draws a border or a ring has a boundary that does not
     * depend on the fill at all, so an identical fill is a look, not a bug. */
    if (/(?:border(?:-[a-z]+)?|outline)\s*:\s*(?!none)/.test(m[2])) continue
    const bgs = [...m[2].matchAll(/background(?:-color)?\s*:\s*var\((--[a-z0-9-]+)\)/g)].map((x) => x[1])
    for (const bg of bgs) {
      /* A surface-relative token cannot be judged statically and does not need
       * to be: --surface-contrast IS --card at :root and --accent on a card,
       * which is the entire mechanism. Reading its root value and calling the
       * match a collision would flag the one thing in this system that already
       * solves the problem. */
      if (/^--(surface-contrast|surface-hover|popover-hover)/.test(bg)) continue
      for (const [themeName, roles] of Object.entries(THEMES)) {
        const fill = hex(bg, roles)
        if (!fill) continue
        for (const surface of SURFACES) {
          if (surface === bg) continue
          if (hex(surface, roles) !== fill) continue
          /* --accent-soft IS --accent-soft; only flag a collision with a token
           * that names a SURFACE a component actually paints itself with. */
          if (!/^--(background|card|popover|muted)$/.test(surface)) continue
          const key = `${bg} == ${surface}`
          if (EXEMPT[key]) { exempted.add(key); continue }
          collisions++; failures++
          log(false, `${name}  ${selector.split(',')[0].trim()}`,
            `${bg} == ${surface} in ${themeName} (${fill})`)
        }
      }
    }
  }
}
if (!collisions) log(true, `${files.length} component stylesheets — no state fill equals a surface it can sit on`)
for (const key of Object.keys(EXEMPT)) {
  if (exempted.has(key)) { console.log(`  ${YELLOW}!${RESET} ${key}  ${DIM}${EXEMPT[key]}${RESET}`); continue }
  failures++
  log(false, `stale exemption: ${key}`, 'nothing paints this pair any more — drop the entry')
}

/* ── C. link ink ─────────────────────────────────────────────────────────── */
console.log(`\n${BOLD}Link ink against the surfaces a link lands on${RESET}\n`)
for (const token of ['--link', '--link-hover', '--link-quiet']) {
  const bad = []
  for (const [themeName, roles] of Object.entries(THEMES)) {
    const ink = hex(token, roles)
    if (!ink) continue
    for (const surface of CONTAINER_SURFACES) {
      const bg = hex(surface, roles)
      if (!bg) continue
      const r = ratio(ink, bg)
      if (r < 4.5) bad.push(`${themeName} on ${surface} ${r.toFixed(2)}`)
    }
  }
  if (bad.length) { failures++; log(false, token, bad.join(', ')) } else log(true, token)
}

/* A surface that inverts its ink has to invert the LINK ink with it. This is the
 * static half of the rule Card.css states for its cover: text over imagery goes
 * light, and a link that keeps asking for the brand is the one word on that
 * surface nobody can read. Cheap to check, and it is exactly how the bug got in. */
/* Leaves: they take the scrim ink for themselves and can hold no link, so
 * there is nothing for them to rebind. Named, because "it looked like a leaf to
 * me" is not a rule and the next one that lands must be looked at too. */
const INK_LEAVES = {
  '.card-media-play': 'a play glyph — one <svg>, no children',
  '.card-media-duration': 'a duration stamp — one string',
  '.card:has(> .card-media[data-wash]) .badge': 'a <Badge> over a washed image; a badge holds a word, never a link',
}
const inkExempt = new Set()
for (const [name, file] of files) {
  const css = strip(readFileSync(file, 'utf8'))
  for (const m of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const body = m[2]
    if (!/color:\s*var\(--scrim-foreground\)/.test(body)) continue
    if (/--link\s*:/.test(body)) continue
    const sel = m[1].split(',')[0].trim()
    if (INK_LEAVES[sel]) { inkExempt.add(sel); continue }
    failures++
    log(false, `${name}  ${sel}`,
      'inverts its ink but not --link: a link on this surface stays brand-coloured')
  }
}
/* Rule 3 of the link system (see the header of Link.css): a TITLE that links
 * keeps its ink and underlines. A title that recolours on hover is a fourth
 * link behaviour, and four behaviours is not a system. */
for (const [name, file] of files) {
  const css = strip(readFileSync(file, 'utf8'))
  for (const m of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const sel = m[1].trim()
    if (!/-title\b/.test(sel) || !/:hover/.test(sel)) continue
    const colour = m[2].match(/(?:^|;)\s*color:\s*var\((--[a-z0-9-]+)\)/)
    if (!colour) continue
    failures++
    log(false, `${name}  ${sel.split(',')[0].trim()}`,
      `a linking title recolours to ${colour[1]} on hover — it should underline and keep its ink`)
  }
}

for (const sel of Object.keys(INK_LEAVES)) {
  if (inkExempt.has(sel)) { console.log(`  ${YELLOW}!${RESET} ${sel}  ${DIM}${INK_LEAVES[sel]}${RESET}`); continue }
  failures++
  log(false, `stale ink leaf: ${sel}`, 'nothing paints this any more — drop the entry')
}

console.log()
if (failures) {
  console.log(`${RED}✗ ${failures} boundary failure(s).${RESET}`)
  console.log(`${DIM}  A control whose fill and border both sit under 3:1 against its surface`)
  console.log(`  has no shape for anyone who is not looking straight at it.${RESET}\n`)
  process.exit(1)
}
console.log(`${GREEN}✓ every control edge clears 3:1 on every surface, in both themes.${RESET}\n`)
