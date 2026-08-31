// WCAG contrast for the semantic pairs, for ANY package's token layer.
//
// It lived only in the design system and, hand-mirrored, in one app. Other
// products override the brand palette or ship a token layer of their own, and
// neither had ever been measured — which is how a warning badge sat at 1.54:1 in
// two products with a green gate above it.
//
// The caller passes its own files in cascade order:
//
//   checkContrast({
//     primitives: [`${ds}/styles/primitives.css`, `${app}/styles/brand.css`],
//     semantic: `${ds}/styles/semantic.css`,
//   })
import { readFileSync, readdirSync, existsSync } from 'node:fs'

export function checkContrast({
  primitives: PRIMITIVE_FILES,
  semantic: SEMANTIC_FILE,
  semanticOverrides = [],
  /* Directories of CSS to sweep for the pairs the code actually paints. Optional:
   * a caller with no components of its own passes none and gets the curated list.
   * `exempt` belongs to the caller for the same reason `sources` does — an
   * exemption is a claim about a specific line of a specific stylesheet, and the
   * stale-entry check below can only be honest if the two travel together. */
  sources: SOURCES = [],
  exempt: EXEMPT = {},
  /* Accepted debt on the FIXED pairs below, keyed `<theme>/<pair name>` and given
   * as the ratio that must not be dropped below. It belongs to the caller for the
   * same reason `exempt` does: the pairs are the system's, the palette is the
   * product's, and only the product can say which of its own misses were decided
   * rather than missed. Merged over the list this file keeps for itself. */
  known: KNOWN_IN = {},
  label = '',
}) {

  /* Comments are stripped first: the file documents the selectors it defines, and
   * a selector named inside a comment would otherwise be found as the block. */
  const strip = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '')

  /* ── token resolution ────────────────────────────────────────────────── */

  // every `--token: value;` declaration inside one CSS block
  function declarations(css) {
    const out = new Map()
    for (const m of css.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/g)) out.set(m[1], m[2].trim())
    return out
  }

  // the body of the first block whose selector matches `selector`
  function block(css, selector) {
    const i = css.indexOf(selector)
    if (i === -1) throw new Error(`contrast-check: no "${selector}" block in semantic.css`)
    const start = css.indexOf('{', i)
    let depth = 0
    for (let j = start; j < css.length; j++) {
      if (css[j] === '{') depth++
      else if (css[j] === '}' && --depth === 0) return css.slice(start + 1, j)
    }
    throw new Error(`contrast-check: unterminated "${selector}" block`)
  }

  /* Files in CASCADE order, so a product that only overrides the palette can pass
   * the design system's primitives followed by its own brand file and get the
   * values a browser would actually resolve. */
  const primitives = new Map()
  for (const f of PRIMITIVE_FILES) for (const [k, v] of declarations(strip(readFileSync(f, 'utf8')))) primitives.set(k, v)
  const semanticCss = strip(readFileSync(SEMANTIC_FILE, 'utf8'))
  /* A product may override a ROLE, not only a stop: a brighter green ramp is
   * brighter than the system's, so its success ink needs one stop darker to
   * clear its own tint. Those overrides are layered on top of the system's
   * roles, in the order the browser would apply them. */
  const overrideCss = semanticOverrides.map((f) => strip(readFileSync(f, 'utf8')))

  /* Per THEME, the way a browser applies it. A role overridden in the file's
   * top-level `:root` would otherwise be read as overriding dark too, and the
   * first attempt at this did exactly that: a product's green ink went to a deep
   * stop in both themes and dark measured a colour against itself, 1:1. */
  const overridesFor = (selector) => {
    const out = new Map()
    for (const css of overrideCss) {
      let src = css
      if (selector) {
        try { src = block(css, selector) } catch { continue }
      } else {
        /* Everything outside a theme-specific block: the file's own `:root`. */
        src = css.split(/\[data-theme|@media/)[0]
      }
      for (const [k, v] of declarations(src)) out.set(k, v)
    }
    return out
  }
  const layer = (base, selector) => {
    const out = new Map(base)
    for (const [k, v] of overridesFor(selector)) if (out.has(k)) out.set(k, v)
    return out
  }

  const light = layer(declarations(block(semanticCss, '[data-theme-lock="light"]')), null)
  const dark = layer(declarations(block(semanticCss, '[data-theme="dark"]')), '[data-theme="dark"]')
  /* Dark is defined TWICE: once for an explicit choice, once for "no choice, OS
   * says dark" — and the second one is what an unconfigured visitor renders. They
   * drifted in five tokens before this line existed, and the check was measuring
   * the block nobody saw. */
  const darkAuto = layer(declarations(block(semanticCss, '@media (prefers-color-scheme: dark)')), '@media (prefers-color-scheme: dark)')

  /* Roles point at primitive stops (`var(--neutral-900)`) and occasionally at
   * another role, so resolution follows the chain until it lands on a hex. */
  function hex(token, roles, seen = new Set()) {
    if (/^#/.test(token)) return token
    if (seen.has(token)) throw new Error(`contrast-check: circular token ${token}`)
    seen.add(token)
    const value = roles.get(token) ?? primitives.get(token)
    if (!value) throw new Error(`contrast-check: ${token} is not defined`)
    const ref = value.match(/var\((--[a-z0-9-]+)\)/)
    if (ref) return hex(ref[1], roles, seen)
    const literal = value.match(/#[0-9a-f]{3,8}/i)
    if (!literal) throw new Error(`contrast-check: ${token} resolves to "${value}", which is not a colour`)
    return literal[0]
  }

  /* ── contrast maths (WCAG 2.1 relative luminance) ────────────────────── */

  const lin = (c) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  }
  const luminance = (h) => {
    const v = h.length === 4
      ? [h[1] + h[1], h[2] + h[2], h[3] + h[3]]
      : [h.slice(1, 3), h.slice(3, 5), h.slice(5, 7)]
    const [r, g, b] = v.map((x) => lin(parseInt(x, 16)))
    return 0.2126 * r + 0.7152 * g + 0.0722 * b
  }
  const ratio = (a, b) => {
    const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p)
    return (x + 0.05) / (y + 0.05)
  }

  /* ── the pairs that must hold ────────────────────────────────────────── */

  const TEXT = 4.5 // body text
  const UI = 3.0 // large text, icons, UI component boundaries

  const PAIRS = [
    ['body text on page', '--foreground', '--background', TEXT],
    ['body text on card', '--card-foreground', '--card', TEXT],
    ['muted text on page', '--muted-foreground', '--background', TEXT],
    ['muted text on muted surface', '--muted-foreground', '--muted', TEXT],
    ['text on primary fill', '--primary-foreground', '--primary', TEXT],
    ['text on destructive fill', '--destructive-foreground', '--destructive', TEXT],
    ['text on success fill', '--success-foreground', '--success', TEXT],
    ['text on warning fill', '--warning-foreground', '--warning', TEXT],
    ['success soft pair', '--success-soft-foreground', '--success-soft', TEXT],
    ['warning soft pair', '--warning-soft-foreground', '--warning-soft', TEXT],
    ['destructive soft pair', '--destructive-soft-foreground', '--destructive-soft', TEXT],
    /* --primary is the FILL (white text on it, same in both themes); the token for
     * text/icons/borders on a surface is --primary-accent, which is what this
     * pair must measure. */
    ['primary accent on page', '--primary-accent', '--background', UI],
    ['focus ring on page', '--ring', '--background', UI],
    /* The EMPHASIS roles are ink: status text with no fill behind it (the `plain`
     * badge, an inline note). They were never measured, and `--warning-emphasis`
     * pointed at the bright yellow FILL — 1.54:1 on white, invisible. axe in a
     * real browser reported it; these lines are so the tokens say it first. */
    ['success ink on page', '--success-emphasis', '--background', TEXT],
    ['warning ink on page', '--warning-emphasis', '--background', TEXT],
    ['destructive ink on page', '--destructive-emphasis', '--background', TEXT],
    /* The selected nav row. Measured against --accent, which is the surface the
       sidebars actually paint: --nav-active belongs to ChatHistory and is a
       different tint. Measuring a colour against a surface it never lands on is
       how the dark nav sat at 1.39:1 with a green check beside it. */
    ['nav active text', '--nav-active-foreground', '--accent', TEXT],
    /* --primary-accent is the brand as INK, and it lands on more than the page:
       a dropdown item, a selected tree row, a filter trigger. Those sit on --muted
       and --accent, and it had only ever been measured against --background. */
    ['primary accent on muted', '--primary-accent', '--muted', TEXT],
    ['primary accent on accent', '--primary-accent', '--accent', TEXT],
    /* Ink on its OWN tint. The emphasis roles were measured against the page and
       nowhere else, and the page is not where most of them land: the Alert icon,
       the toast icon and the ErrorBoundary circle all put the emphasis colour on
       the matching soft surface. UI, not TEXT, because every one of those uses is
       a glyph — an emphasis role used as body copy sits on `--background` and is
       measured above. Miss this and a rebranded ramp can make a status icon
       vanish into its own tint with every pair above still green. */
    ['success ink on its tint', '--success-emphasis', '--success-soft', UI],
    ['warning ink on its tint', '--warning-emphasis', '--warning-soft', UI],
    ['destructive ink on its tint', '--destructive-emphasis', '--destructive-soft', UI],
    /* Alert keeps its text neutral and tints only the surface, which makes
       `--foreground` on each tone tint a real text pair — five of them, and none
       had ever been resolved. The system's own tints are pale enough that this
       is slack; a product that darkens one tint is exactly who this catches. */
    ['body text on info tint', '--foreground', '--primary-soft', TEXT],
    ['body text on success tint', '--foreground', '--success-soft', TEXT],
    ['body text on warning tint', '--foreground', '--warning-soft', TEXT],
    ['body text on danger tint', '--foreground', '--destructive-soft', TEXT],
    ['body text on ai tint', '--foreground', '--ai-soft', TEXT],
    /* The `ai` family is a tone like any other and had no pair at all. */
    ['text on ai fill', '--ai-foreground', '--ai', TEXT],
    ['ai soft pair', '--ai-soft-foreground', '--ai-soft', TEXT],
  ]

  /* Accepted, non-growing debt: pairs that miss their target today. The gate
   * fails if the ratio drops BELOW the recorded value, so the debt cannot get
   * worse silently. Fixing one means changing the token, then deleting its line. */
  /* Empty on purpose. The last entry (muted text on a muted surface, 4.14:1) was
   * fixed by moving --muted-foreground from neutral-600 to neutral-700 rather than
   * carried as debt. Adding an entry here is a decision, not a shortcut: write
   * down why the token cannot move. */
  const KNOWN = { ...KNOWN_IN }

  const THEMES = [['light', light], ['dark', dark], ['dark (no theme chosen)', darkAuto]]

  let failed = 0
  console.log('\x1b[1mContrast (WCAG 2.1, resolved from the token files)\x1b[0m\n')
  for (const [theme, roles] of THEMES) {
    console.log(`  ${theme}`)
    for (const [name, fg, bg, target] of PAIRS) {
      const fgHex = hex(fg, roles)
      const bgHex = hex(bg, roles)
      const r = ratio(fgHex, bgHex)
      const floor = KNOWN[`${theme}/${name}`]
      const ok = floor !== undefined ? r >= floor : r >= target
      if (!ok) failed++
      const mark = ok ? (floor !== undefined ? '\x1b[33m!\x1b[0m' : '\x1b[32m✓\x1b[0m') : '\x1b[31m✗\x1b[0m'
      const note = floor !== undefined ? ` [known debt, must stay >= ${floor}]` : ''
      console.log(`    ${mark} ${name.padEnd(30)} ${r.toFixed(2)}:1 (needs ${target})  ${fgHex} on ${bgHex}${note}`)
    }
    console.log('')
  }

  /* ── the pairs the CSS actually paints ───────────────────────────────── */
  //
  // Everything above is a list a person wrote, and that is its limit: a pair
  // nobody thought to add is a pair nobody measures. The ErrorBoundary icon put
  // status ink on its own tint for a year with this file green, because those
  // two tokens never appeared on the same line of it.
  //
  // So the second half asks the CSS instead. Every rule that sets `color` AND a
  // `background` is a pair the browser really renders, and it needs no list to
  // be found. The curated pairs above stay: they cover the combinations that
  // happen across rules (Alert tints the box and colours the icon two selectors
  // apart), which this cannot see.
  //
  // Deliberately conservative — one rule, both properties, both resolvable. It
  // finds 34 pairs in this package and it will find whatever the next component
  // adds on the commit that adds it.
  if (SOURCES.length) {
    const cssFiles = []
    const walk = (dir) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        if (entry.isDirectory()) walk(`${dir}/${entry.name}`)
        else if (entry.name.endsWith('.css')) cssFiles.push(`${dir}/${entry.name}`)
      }
    }
    for (const dir of SOURCES) if (existsSync(dir)) walk(dir)

    /* One rule body, both properties. Shorthand `background:` counts, since the
     * colour is its last component and `var(--token)` is how this system writes
     * it; a gradient or an image resolves to no hex and is skipped below. */
    const painted = new Map()
    for (const file of cssFiles) {
      const css = strip(readFileSync(file, 'utf8'))
      for (const rule of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
        const fg = rule[2].match(/(?:^|[\s;])color\s*:\s*var\((--[a-z0-9-]+)\)/)
        const bg = rule[2].match(/(?:^|[\s;])background(?:-color)?\s*:\s*var\((--[a-z0-9-]+)\)/)
        if (!fg || !bg) continue
        const key = `${fg[1]} on ${bg[1]}`
        if (painted.has(key)) continue
        const selector = rule[1].trim().split('\n').pop().trim()
        painted.set(key, `${file.slice(file.lastIndexOf('/src/') + 1)}  ${selector}`)
      }
    }

    console.log(`\x1b[1mPainted pairs\x1b[0m \x1b[2m${painted.size} found in the CSS itself, ${cssFiles.length} file(s)\x1b[0m\n`)
    let swept = 0
    for (const [key, where] of painted) {
      const [fg, bg] = key.split(' on ')
      const exempt = EXEMPT[key]
      if (exempt && exempt.floor === null) continue
      const target = exempt ? exempt.floor : TEXT
      for (const [theme, roles] of THEMES) {
        /* A role a product has not defined is not this check's business — the
         * curated list is where a missing token is an error. */
        let fgHex, bgHex
        try { fgHex = hex(fg, roles); bgHex = hex(bg, roles) } catch { continue }
        swept++
        const r = ratio(fgHex, bgHex)
        if (r >= target) continue
        failed++
        console.error(`  \x1b[31m✗\x1b[0m ${theme} — ${key}  \x1b[2m${r.toFixed(2)}:1 (needs ${target})\x1b[0m`)
        console.error(`      \x1b[2m${where}\x1b[0m`)
      }
    }
    for (const [key, e] of Object.entries(EXEMPT)) {
      if (!painted.has(key)) {
        failed++
        console.error(`  \x1b[31m✗\x1b[0m exemption for a pair the CSS no longer paints: ${key}`)
        console.error(`      \x1b[2mdelete it — a stale exemption waives whatever lands on that pair next.\x1b[0m`)
        continue
      }
      console.log(`  \x1b[33m!\x1b[0m ${key}  \x1b[2m${e.floor === null ? 'not painted together' : `held to ${e.floor}`}\x1b[0m`)
      console.log(`      \x1b[2m${e.why}\x1b[0m`)
    }
    console.log(`\n  \x1b[2m${swept} measurement(s) across ${THEMES.length} themes\x1b[0m\n`)
  }

  if (failed) {
    console.error(`\x1b[31m✗ ${failed} pair(s) below target${label ? ` in ${label}` : ''}.\x1b[0m`)
    process.exit(1)
  }
  console.log(`\x1b[32m✓ all pairs meet their contrast target${label ? ` in ${label}` : ''}.\x1b[0m`)

}
