#!/usr/bin/env node
/* gen-tokens — publish the token layer as DTCG, and prove nothing was lost.
 *
 * The three CSS tiers (settings -> primitives -> semantic, plus styles/brands/*)
 * are where the values are decided, and they stay that way: they carry comments
 * that say WHY a value is what it is, theme selectors, and one @media block, all
 * of which a generator would have to reproduce byte for byte to be an
 * improvement. What they are not is consumable. A CSS custom property cannot be
 * read by Style Dictionary, Terrazzo, Tokens Studio or a Figma round trip, so
 * until now this system could be copied but not consumed.
 *
 * So the CSS is the source and this is the published interchange format, in the
 * Design Tokens Community Group format ($value / $type / $description, aliases
 * as {group.token}, dimensions and colors as typed objects):
 *
 *   tokens/design.tokens.json          settings + primitives + semantic roles
 *   tokens/brands/<name>.tokens.json   one file per brand layer
 *
 * Being generated, it cannot drift: `--check` runs in the gate and fails when a
 * token changed in CSS and the JSON was not regenerated.
 *
 * Being generated is not the same as being complete, so this also proves it:
 *   • every custom property declared in the CSS appears in the JSON (counts)
 *   • every alias resolves to a token that exists
 *   • rendering the JSON back to CSS reproduces every declaration, value for
 *     value (--round-trip, which the gate runs)
 * A number that is proven is the difference between an export and a claim.
 *
 * Run:
 *   npm run tokens             write tokens/
 *   npm run tokens:check       fail if tokens/ is out of date (no writes)
 *   npm run tokens -- --round-trip   render back to CSS and diff every value
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('..', import.meta.url)).replace(/\/$/, '')
const OUT_DIR = `${ROOT}/tokens`
const RED = '\x1b[31m', GREEN = '\x1b[32m', DIM = '\x1b[2m', BOLD = '\x1b[1m', R = '\x1b[0m'

const check = process.argv.includes('--check')
const roundTrip = process.argv.includes('--round-trip') || check

/* ── parse ───────────────────────────────────────────────────────────────
 * Small hand-rolled scanner rather than a CSS parser dependency: it has to
 * survive exactly four files whose shape is known, and it has to keep the
 * trailing comment on a declaration, which is the description an agent reads. */
function parseCss(text, file) {
  /* Blank the comments but keep every offset, so the original text can still be
   * asked what comment followed a declaration. */
  const blanked = text.replace(/\/\*[\s\S]*?\*\//g, (m) => ' '.repeat(m.length))
  const decls = []
  const stack = []
  let i = 0
  let chunkStart = 0

  while (i < blanked.length) {
    const ch = blanked[i]
    if (ch === '{') {
      stack.push(blanked.slice(chunkStart, i).trim().replace(/\s+/g, ' '))
      chunkStart = i + 1
      i++
      continue
    }
    if (ch === '}') {
      collect(blanked.slice(chunkStart, i), stack.join(' >> '))
      stack.pop()
      chunkStart = i + 1
      i++
      continue
    }
    if (ch === ';' && stack.length) {
      collect(blanked.slice(chunkStart, i + 1), stack.join(' >> '))
      chunkStart = i + 1
    }
    i++
  }

  function collect(chunk, context) {
    for (const m of chunk.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
      const name = m[1]
      const value = m[2].replace(/\s+/g, ' ').trim()
      /* The description is the comment that trails the declaration in the
       * ORIGINAL text, on the same line. */
      const at = text.indexOf(`${name}:`, Math.max(0, text.indexOf(name)))
      const lineEnd = text.indexOf('\n', at)
      const line = at === -1 ? '' : text.slice(at, lineEnd === -1 ? undefined : lineEnd)
      const trailing = line.match(/\/\*\s*(.*?)\s*\*\//)
      decls.push({ name, value, context, file, description: trailing?.[1] ?? null })
    }
  }
  return decls
}

const MODE_DARK = /\[data-theme="dark"\]|prefers-color-scheme: dark/
const isDark = (context) => MODE_DARK.test(context)

/* ── name -> DTCG path ───────────────────────────────────────────────── */
const COLOR_FAMILIES = new Set(['brand', 'neutral', 'success', 'warning', 'danger', 'info', 'gray'])

function tokenPath(name, { semantic }) {
  const id = name.replace(/^--/, '')
  const colorStop = id.match(/^([a-z]+)-(\d{1,3})$/)
  if (colorStop && COLOR_FAMILIES.has(colorStop[1])) return ['color', colorStop[1], colorStop[2]]
  if (semantic) return ['semantic', id]
  if (id === 'grid-unit') return ['space', 'grid-unit']
  if (id.startsWith('space-')) return ['space', id.slice(6)]
  if (id === 'font-family') return ['font', 'family', 'default']
  if (id.startsWith('font-family-')) return ['font', 'family', id.slice(12)]
  if (id.startsWith('font-weight-')) return ['font', 'weight', id.slice(12)]
  if (id.startsWith('font-')) return ['font', 'size', id.slice(5)]
  if (id.startsWith('line-height-')) return ['font', 'lineHeight', id.slice(12)]
  if (id === 'radius') return ['radius', 'default']
  if (id.startsWith('radius-')) return ['radius', id.slice(7)]
  if (id.startsWith('shadow-')) return ['shadow', id.slice(7)]
  if (id === 'shadow') return ['shadow', 'default']
  if (id.startsWith('duration-')) return ['motion', 'duration', id.slice(9)]
  if (id.startsWith('ease-')) return ['motion', 'ease', id.slice(5)]
  const [first, ...rest] = id.split('-')
  return [first, rest.join('-') || 'default']
}

/* ── value -> DTCG ───────────────────────────────────────────────────── */
const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i
const DIMENSION = /^(-?\d*\.?\d+)(px|rem)$/
const DURATION = /^(-?\d*\.?\d+)(ms|s)$/
const NUMBER = /^-?\d*\.?\d+$/
const ALIAS_ONLY = /^var\((--[\w-]+)\)$/

function hexToComponents(hex) {
  let h = hex.slice(1)
  if (h.length === 3) h = h.split('').map((c) => c + c).join('')
  const int = (s) => parseInt(s, 16) / 255
  const components = [int(h.slice(0, 2)), int(h.slice(2, 4)), int(h.slice(4, 6))].map(
    (n) => Math.round(n * 10000) / 10000,
  )
  const alpha = h.length === 8 ? Math.round((parseInt(h.slice(6, 8), 16) / 255) * 10000) / 10000 : 1
  return { colorSpace: 'srgb', components, alpha, hex: `#${h.slice(0, 6)}`.toLowerCase() }
}

/* A value is either a DTCG-typed value, an alias to another token, or a CSS
 * expression this format has no type for (calc, clamp, gradients, shadows with
 * four parts). The third kind is kept verbatim rather than dropped or faked:
 * a consumer that cannot evaluate it still receives exactly what the CSS says. */
function toDtcg(value, pathOf) {
  const alias = value.match(ALIAS_ONLY)
  if (alias) {
    const target = pathOf(alias[1])
    if (target) return { $value: `{${target.join('.')}}` }
  }
  if (HEX.test(value)) return { $value: hexToComponents(value), $type: 'color' }
  const dim = value.match(DIMENSION)
  if (dim) return { $value: { value: Number(dim[1]), unit: dim[2] }, $type: 'dimension' }
  const dur = value.match(DURATION)
  if (dur) {
    const unit = dur[2] === 's' ? 'ms' : dur[2]
    const n = dur[2] === 's' ? Number(dur[1]) * 1000 : Number(dur[1])
    return { $value: { value: n, unit }, $type: 'duration' }
  }
  if (NUMBER.test(value)) return { $value: Number(value), $type: 'number' }
  if (value.startsWith('cubic-bezier(')) {
    const nums = value.slice(13, -1).split(',').map((n) => Number(n.trim()))
    if (nums.length === 4 && nums.every((n) => Number.isFinite(n))) {
      return { $value: nums, $type: 'cubicBezier' }
    }
  }
  if (/^["']?[\w -]+["']?(\s*,\s*[^,]+)+$/.test(value) && /serif|system-ui|monospace|ui-/.test(value)) {
    return {
      $value: value.split(',').map((f) => f.trim().replace(/^["']|["']$/g, '')),
      $type: 'fontFamily',
    }
  }
  return { $value: value }
}

/* The inverse, used by the round trip: a DTCG token back to the CSS value it
 * came from. If this cannot reproduce the declaration exactly, the export lost
 * something, and the gate says so. */
function toCssValue(token, cssVarOf) {
  const v = token.$value
  if (typeof v === 'string' && v.startsWith('{') && v.endsWith('}')) {
    return `var(${cssVarOf(v.slice(1, -1))})`
  }
  if (token.$type === 'color') return v.hex
  if (token.$type === 'dimension') return `${v.value}${v.unit}`
  if (token.$type === 'duration') return `${v.value}${v.unit}`
  if (token.$type === 'number') return String(v)
  if (token.$type === 'cubicBezier') return `cubic-bezier(${v.join(', ')})`
  if (token.$type === 'fontFamily') {
    return v.map((f) => (/[^\w-]/.test(f) ? `"${f}"` : f)).join(', ')
  }
  return String(v)
}

/* ── resolve ─────────────────────────────────────────────────────────────
 * `--space-4: calc(var(--grid-unit) * 4)` is exact, self-documenting CSS and
 * completely useless to Style Dictionary, Figma or anything else that needs a
 * number. So an expression keeps its CSS in $value (that is what the round trip
 * checks) and gains a computed value under $extensions.resolved when it can be
 * worked out. The whole space scale is multiples of one 4px unit, which is the
 * scale a consumer reaches for first. */
function resolveExpression(value, literalOf, seen = new Set()) {
  let expanded = value
  for (let pass = 0; pass < 6 && /var\(/.test(expanded); pass++) {
    expanded = expanded.replace(/var\((--[\w-]+)\)/g, (m, name) => {
      if (seen.has(name)) return m
      const literal = literalOf(name)
      return literal ?? m
    })
  }
  if (/var\(|clamp\(|min\(|max\(/.test(expanded)) return null
  const calc = expanded.match(/^calc\(\s*(.+?)\s*\)$/)
  if (!calc) return null
  const mul = calc[1].match(/^(-?\d*\.?\d+)(px|rem)\s*\*\s*(-?\d*\.?\d+)$/)
  if (mul) return { value: round(Number(mul[1]) * Number(mul[3])), unit: mul[2] }
  const add = calc[1].match(/^(-?\d*\.?\d+)(px|rem)\s*([+-])\s*(-?\d*\.?\d+)(px|rem)$/)
  if (add && add[2] === add[5]) {
    const n = add[3] === '+' ? Number(add[1]) + Number(add[4]) : Number(add[1]) - Number(add[4])
    return { value: round(n), unit: add[2] }
  }
  return null
}
const round = (n) => Math.round(n * 10000) / 10000

/* ── build ───────────────────────────────────────────────────────────── */
const EXT = 'org.css-design-system'

/* A token can be declared more than once in the same mode: the light-lock block
 * in semantic.css restates the five shadows, and the @media dark block restates
 * the whole dark set. Restating is fine; disagreeing is not, and it has shipped
 * before (2026-07-31, five dark tokens drifted between the two blocks and the
 * contrast check measured the block nobody saw). So the first declaration wins
 * and any later one that differs is reported rather than silently dropped. */
function collapse(decls, dark, problems) {
  const byName = new Map()
  for (const d of decls) {
    if (isDark(d.context) !== dark) continue
    const prev = byName.get(d.name)
    if (!prev) byName.set(d.name, d)
    else if (prev.value !== d.value) {
      problems.push(
        `${d.name} is declared twice in the ${dark ? 'dark' : 'light'} theme with different values: "${prev.value}" (${prev.context}) and "${d.value}" (${d.context})`,
      )
    }
  }
  return byName
}

function build(decls, { semantic, problems }) {
  const light = collapse(decls, false, problems)
  const darkByName = collapse(decls, true, problems)
  const pathOf = (name) => {
    if (!light.has(name) && !darkByName.has(name)) return null
    return tokenPath(name, { semantic: semantic.has(name) })
  }

  const tree = {}
  const flat = []
  for (const d of light.values()) {
    const path = tokenPath(d.name, { semantic: semantic.has(d.name) })
    const token = toDtcg(d.value, pathOf)
    if (d.description) token.$description = d.description
    const ext = { var: d.name, source: d.file }
    if (token.$value === d.value && !token.$type) {
      ext.cssExpression = true
      /* Expansion is recursive by re-running the pass, so an alias chain
       * (--radius-sm -> --radius -> --radius-md -> 0.5rem) resolves too. */
      const literalOf = (name) => light.get(name)?.value ?? null
      const resolved = resolveExpression(d.value, literalOf)
      if (resolved) {
        ext.resolved = resolved
        ext.resolvedType = 'dimension'
      }
    }
    const dark = darkByName.get(d.name)
    if (dark) {
      const darkToken = toDtcg(dark.value, pathOf)
      ext.dark = darkToken.$value
      if (!darkToken.$type && darkToken.$value === dark.value) ext.darkIsCssExpression = true
    }
    token.$extensions = { [EXT]: ext }

    let node = tree
    for (const seg of path.slice(0, -1)) node = node[seg] ??= {}
    node[path.at(-1)] = token
    flat.push({ path, token, decl: d, dark })
  }
  return { tree, flat, pathOf }
}

function fileHeader(description) {
  return {
    $description: description,
    $extensions: {
      [EXT]: {
        generatedBy: 'npm run tokens (scripts/gen-tokens.mjs)',
        source: 'styles/*.css — edit the CSS, never this file',
        spec: 'Design Tokens Community Group format, colors and dimensions as typed objects',
      },
    },
  }
}

const files = {
  settings: `${ROOT}/styles/settings.css`,
  primitives: `${ROOT}/styles/primitives.css`,
  semantic: `${ROOT}/styles/semantic.css`,
}
const decls = []
for (const [, path] of Object.entries(files)) {
  if (!existsSync(path)) {
    console.error(`${RED}✗ ${path} is missing${R}`)
    process.exit(1)
  }
  decls.push(...parseCss(readFileSync(path, 'utf8'), path.replace(`${ROOT}/`, '')))
}
const semanticNames = new Set(
  decls.filter((d) => d.file.endsWith('semantic.css')).map((d) => d.name),
)

const problems = []
const core = build(decls, { semantic: semanticNames, problems })
const coreJson =
  JSON.stringify(
    {
      ...fileHeader(
        'The design system token layer: settings (the knobs), primitives (the computed scales and the colour ramps) and the semantic roles. Dark-theme values ride on the token they belong to, under $extensions.',
      ),
      ...core.tree,
    },
    null,
    2,
  ) + '\n'

/* Brands: the same shape, one file each, carrying only what that brand
 * overrides. A brand file that restated the whole scale would drift silently.
 * The published package ships no extra brand layers (apps keep theirs in their
 * own repositories), so styles/brands/ usually does not exist here. */
const brandDir = `${ROOT}/styles/brands`
const brands = existsSync(brandDir)
  ? readdirSync(brandDir).filter((f) => f.endsWith('.css'))
  : []
const brandOutputs = []
for (const file of brands) {
  const name = file.replace(/\.css$/, '')
  const bDecls = parseCss(readFileSync(`${brandDir}/${file}`, 'utf8'), `styles/brands/${file}`)
  const built = build(bDecls, { semantic: semanticNames, problems })
  brandOutputs.push({
    name,
    decls: bDecls,
    built,
    path: `${OUT_DIR}/brands/${name}.tokens.json`,
    json:
      JSON.stringify(
        {
          ...fileHeader(
            `The ${name} brand layer: only the tokens this brand overrides. Load it over the core tokens, the same way styles/brands/${file} loads over styles/index.css.`,
          ),
          ...built.tree,
        },
        null,
        2,
      ) + '\n',
  })
}

/* ── prove ───────────────────────────────────────────────────────────── */
const lightCount = decls.filter((d) => !isDark(d.context)).length
const declaredNames = new Set(decls.map((d) => d.name))
const emittedNames = new Set(core.flat.map((f) => f.decl.name))
for (const name of declaredNames) {
  if (!emittedNames.has(name)) problems.push(`${name} is declared in the CSS and missing from the export`)
}

/* Duplicate paths would silently drop a token: two CSS names mapping to one
 * DTCG path means the second overwrote the first. */
const seenPaths = new Map()
for (const { path, decl } of core.flat) {
  const key = path.join('.')
  if (seenPaths.has(key)) problems.push(`${decl.name} and ${seenPaths.get(key)} both map to ${key}`)
  seenPaths.set(key, decl.name)
}

/* Every alias resolves. */
const varByPath = new Map(core.flat.map(({ path, decl }) => [path.join('.'), decl.name]))
for (const { token, decl } of core.flat) {
  const v = token.$value
  if (typeof v === 'string' && v.startsWith('{') && !varByPath.has(v.slice(1, -1))) {
    problems.push(`${decl.name} aliases ${v}, which is not a token`)
  }
}

/* The round trip: render every token back to CSS and compare with what the CSS
 * actually declares. */
let roundTripped = 0
if (roundTrip) {
  const cssVarOf = (p) => varByPath.get(p) ?? `--UNRESOLVED-${p}`
  /* Quoting is CSS syntax, not token value: "Some Face" and 'Some Face' are the
   * same family, and a fontFamily token holds the names, not the quotes. Every
   * other type has to match character for character. */
  const same = (rendered, source, type) =>
    type === 'fontFamily'
      ? rendered.replace(/["']/g, '') === source.replace(/["']/g, '')
      : rendered === source
  for (const { token, decl, dark } of core.flat) {
    const rendered = toCssValue(token, cssVarOf)
    if (!same(rendered, decl.value, token.$type)) {
      problems.push(`round trip: ${decl.name} is "${decl.value}" in CSS and "${rendered}" from the JSON`)
    }
    if (dark) {
      const ext = token.$extensions[EXT]
      const darkToken = { $value: ext.dark, $type: ext.darkIsCssExpression ? undefined : inferType(ext.dark) }
      const renderedDark = toCssValue(darkToken, cssVarOf)
      if (!same(renderedDark, dark.value, darkToken.$type)) {
        problems.push(`round trip (dark): ${decl.name} is "${dark.value}" in CSS and "${renderedDark}" from the JSON`)
      }
    }
    roundTripped++
  }
}

function inferType(value) {
  if (value && typeof value === 'object' && 'colorSpace' in value) return 'color'
  if (value && typeof value === 'object' && 'unit' in value) {
    return value.unit === 'ms' ? 'duration' : 'dimension'
  }
  if (typeof value === 'number') return 'number'
  if (Array.isArray(value)) return value.every((n) => typeof n === 'number') ? 'cubicBezier' : 'fontFamily'
  return undefined
}

/* ── write or check ──────────────────────────────────────────────────── */
const outputs = [{ path: `${OUT_DIR}/design.tokens.json`, json: coreJson }, ...brandOutputs]

console.log(`${BOLD}Design tokens (DTCG)${R}\n`)
console.log(`  ${core.flat.length} tokens from ${lightCount} declarations in 3 files`)
const darkCount = core.flat.filter((f) => f.dark).length
console.log(`  ${darkCount} of them carry a dark-theme value`)
for (const b of brandOutputs) console.log(`  ${b.built.flat.length} overrides in the ${b.name} brand layer`)
if (roundTrip) console.log(`  ${roundTripped} rendered back to CSS and compared${DIM} (value for value)${R}`)

if (problems.length) {
  console.error(`\n${RED}✗ the token export is not faithful:${R}`)
  for (const p of problems.slice(0, 30)) console.error(`    ${p}`)
  if (problems.length > 30) console.error(`    ... and ${problems.length - 30} more`)
  process.exit(1)
}

if (check) {
  let stale = false
  for (const { path, json } of outputs) {
    if (!existsSync(path) || readFileSync(path, 'utf8') !== json) {
      console.error(`  ${RED}✗ ${path.replace(`${ROOT}/`, '')} is out of date${R}`)
      stale = true
    }
  }
  if (stale) {
    console.error(`\n${RED}✗ tokens/ does not match styles/. Run \`npm run tokens\` and commit the result.${R}`)
    process.exit(1)
  }
  console.log(`\n${GREEN}✓ tokens/ is in step with styles/, and every value survives the round trip.${R}`)
  process.exit(0)
}

if (brandOutputs.length) mkdirSync(`${OUT_DIR}/brands`, { recursive: true })
for (const { path, json } of outputs) writeFileSync(path, json)
console.log(`\n${GREEN}✓ wrote ${outputs.length} file(s) to tokens/${R}`)
