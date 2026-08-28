// Every string a screen renders has words behind it, in every language it ships.
//
// This check exists because of a menu item that read `console.setUnavailable` on
// screen, in the showcase, under a user's own avatar. i18next renders the KEY
// when the key is missing, so the failure looks like a label and never like an
// error: nothing throws, nothing logs, the tests pass, the build is green and the
// screenshot baseline happily records the key as the copy. Twenty-nine gate steps
// ran over that screen and not one of them read the words on it.
//
// It is not one app's slip either. `src/locales/README.md` in this package says
// it in the first paragraph — "an app that does not supply them renders the raw
// key on screen" — and then nothing measured whether an app did. The same run
// that found the showcase item found a product's login screen, also `login.title`.
//
// Four rules, and the third is the one only a design system can ask:
//
//   1. resolvable   every static `t('key')` in this package's own src has a
//                   value in every locale file it ships
//   2. parity       a key translated in one locale exists in all of them, so
//                   "shipped in Arabic" cannot mean "shipped in English twice"
//   3. inherited    the keys of the SYSTEM components an app actually imports
//                   are in that app's locale files. The component asks for
//                   `a11y.close`; the words live in the app; nothing but this
//                   connected the two. Only the components reachable from the
//                   app's own imports count — a package it does not use owes it
//                   nothing.
//
// Keys are resolved the way i18next resolves them: `key_one`/`key_other` (and
// the six Arabic categories) satisfy a `t(key, { count })`, and a call carrying
// its own `defaultValue` cannot render a key, so it is not asked to.
//
//   4. families    t(`status.${x}`) cannot be resolved from source, but its
//                   NAMESPACE can: nothing under `status.` means every value
//                   that key ever takes renders on screen. That is how a
//                   renamed namespace escapes — one prefix, dozens of screens,
//                   and not one of the keys is greppable.
//
// Run: npm run copy   (from any app, or from this package)
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const RESET = '\x1b[0m', RED = '\x1b[31m', GREEN = '\x1b[32m', DIM = '\x1b[2m', BOLD = '\x1b[1m'

const PLURALS = ['zero', 'one', 'two', 'few', 'many', 'other']
const basename = (key) => key.replace(new RegExp(`_(${PLURALS.join('|')})$`), '')

/* ---------- locales ---------------------------------------------------- */

const flatten = (obj) => {
  const keys = new Set()
  const walk = (value, prefix) => {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      for (const key of Object.keys(value)) walk(value[key], prefix ? `${prefix}.${key}` : key)
    } else keys.add(prefix)
  }
  walk(obj, '')
  return keys
}

const localeDir = `${ROOT}/src/locales`
if (!existsSync(localeDir)) {
  console.log(`${DIM}No src/locales here — nothing renders translated copy.${RESET}`)
  process.exit(0)
}

const locales = {}
for (const file of readdirSync(localeDir).filter((f) => f.endsWith('.json'))) {
  locales[file.replace(/\.json$/, '')] = flatten(JSON.parse(readFileSync(`${localeDir}/${file}`, 'utf8')))
}

const resolves = (keys, key) => keys.has(key) || PLURALS.some((p) => keys.has(`${key}_${p}`))

/* ---------- alias resolution ------------------------------------------- */

/* Read the aliases the app already declares rather than hard-coding @ds: a
 * vendored copy maps the same alias somewhere else, and this has to follow the
 * app that is running it, not the layout of this monorepo. */
/* tsconfig is JSONC, and every alias in it contains `/*`. Stripping comments
 * with a regex therefore eats the paths it came to read — `"@ds/*": [...]` opens
 * a block comment that closes somewhere down the file. So: a scanner that knows
 * when it is inside a string. */
function stripJsonComments(raw) {
  let out = '', inString = false, escaped = false
  for (let i = 0; i < raw.length; i++) {
    const char = raw[i]
    if (inString) {
      out += char
      if (escaped) escaped = false
      else if (char === '\\') escaped = true
      else if (char === '"') inString = false
      continue
    }
    if (char === '"') { inString = true; out += char; continue }
    if (char === '/' && raw[i + 1] === '/') { while (i < raw.length && raw[i] !== '\n') i++; out += '\n'; continue }
    if (char === '/' && raw[i + 1] === '*') { i = raw.indexOf('*/', i + 2) + 1; if (i === 0) break; continue }
    out += char
  }
  return out
}

function tsconfigPaths(file, seen = new Set()) {
  if (!existsSync(file) || seen.has(file)) return {}
  seen.add(file)
  const json = JSON.parse(stripJsonComments(readFileSync(file, 'utf8')))
  const dir = path.dirname(file)
  const inherited = json.extends ? tsconfigPaths(path.resolve(dir, json.extends), seen) : {}
  const own = {}
  const baseUrl = path.resolve(dir, json.compilerOptions?.baseUrl ?? '.')
  for (const [pattern, targets] of Object.entries(json.compilerOptions?.paths ?? {})) {
    own[pattern] = targets.map((t) => path.resolve(baseUrl, t))
  }
  return { ...inherited, ...own }
}

const ALIASES = tsconfigPaths(`${ROOT}/tsconfig.json`)

const CANDIDATES = ['', '.ts', '.tsx', '/index.ts', '/index.tsx']

function resolveFile(base) {
  for (const suffix of CANDIDATES) {
    const candidate = base + suffix
    if (existsSync(candidate) && /\.tsx?$/.test(candidate)) return candidate
  }
  return null
}

function resolveImport(specifier, fromFile) {
  if (specifier.startsWith('.')) return resolveFile(path.resolve(path.dirname(fromFile), specifier))
  for (const [pattern, targets] of Object.entries(ALIASES)) {
    if (pattern.endsWith('/*')) {
      const prefix = pattern.slice(0, -1)
      if (!specifier.startsWith(prefix)) continue
      const rest = specifier.slice(prefix.length)
      for (const target of targets) {
        const hit = resolveFile(target.replace(/\*$/, '') + rest)
        if (hit) return hit
      }
    } else if (specifier === pattern) {
      for (const target of targets) {
        const hit = resolveFile(target)
        if (hit) return hit
      }
    }
  }
  return null
}

/* ---------- sources ----------------------------------------------------- */

const SKIP_DIRS = new Set(['node_modules', '__eval__', '__verify__', 'dist', 'test'])

function sourceFiles(dir, acc = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) sourceFiles(full, acc)
    else if (/\.tsx?$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name)) acc.push(full)
  }
  return acc
}

/* Comments carry prose that looks like code — `the app passes t('...') into
 * labels` is a sentence, not a call — so they go before anything is matched. */
const stripComments = (src) => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`\\])\/\/.*$/gm, '$1')

const OWN = `${ROOT}/src`
const own = sourceFiles(OWN)

/* Rule 3: the system files this app actually reaches, transitively. */
const inherited = new Map() // file -> the app import that pulled it in
const queue = own.map((f) => ({ file: f, via: null }))
const seen = new Set(own)
while (queue.length) {
  const { file, via } = queue.shift()
  const src = stripComments(readFileSync(file, 'utf8'))
  for (const match of src.matchAll(/\bfrom\s+['"]([^'"]+)['"]/g)) {
    const target = resolveImport(match[1], file)
    if (!target || seen.has(target) || target.startsWith(OWN + path.sep)) continue
    seen.add(target)
    const chain = via ?? match[1]
    inherited.set(target, chain)
    queue.push({ file: target, via: chain })
  }
}

/* ---------- the calls --------------------------------------------------- */

const calls = []
const families = []
for (const file of [...own, ...inherited.keys()]) {
  const src = stripComments(readFileSync(file, 'utf8'))
  for (const match of src.matchAll(/\bt\(\s*(['"`])([^'"`]*)\1\s*(,\s*\{[^}]*\})?/g)) {
    const [, quote, key, options] = match
    if (options && /defaultValue/.test(options)) continue
    const at = `${path.relative(ROOT, file)}:${src.slice(0, match.index).split('\n').length}`
    const via = inherited.get(file) ?? null
    /* t(`status.${x}`) cannot be resolved from source. Its NAMESPACE can: if
     * nothing under `status.` exists, every value that key ever takes renders
     * the key. That is how a renamed namespace escapes — one prefix, dozens of
     * screens, and the individual keys were never greppable. */
    if (quote === '`' && key.includes('${')) {
      const prefix = key.slice(0, key.indexOf('${'))
      if (prefix.endsWith('.')) families.push({ prefix, at, via })
      continue
    }
    calls.push({ key, at, via })
  }
}

/* ---------- the verdict ------------------------------------------------- */

const problems = []
const reported = new Set()

for (const { key, at, via } of calls) {
  for (const [locale, keys] of Object.entries(locales)) {
    if (resolves(keys, key)) continue
    const line = via
      ? `${locale}.json has no "${key}" — ${via} renders the key on screen (${at})`
      : `${locale}.json has no "${key}" — the key renders on screen (${at})`
    if (reported.has(line)) continue
    reported.add(line)
    problems.push(line)
  }
}

for (const { prefix, at, via } of families) {
  for (const [locale, keys] of Object.entries(locales)) {
    if ([...keys].some((k) => k.startsWith(prefix))) continue
    const line = `${locale}.json has nothing under "${prefix}" — every value of that key renders on screen${via ? ` (${via})` : ''} (${at})`
    if (reported.has(line)) continue
    reported.add(line)
    problems.push(line)
  }
}

const names = Object.keys(locales)
if (names.length > 1) {
  const bases = Object.fromEntries(names.map((n) => [n, new Set([...locales[n]].map(basename))]))
  for (const key of new Set(names.flatMap((n) => [...bases[n]]))) {
    for (const name of names) {
      if (!bases[name].has(key)) problems.push(`${name}.json has no "${key}" — the other locales do`)
    }
  }
}

const pkg = JSON.parse(readFileSync(`${ROOT}/package.json`, 'utf8')).name
console.log(
  `${BOLD}Copy${RESET} ${DIM}${pkg}: ${calls.length} key(s) in ${names.length} locale(s)` +
    `${inherited.size ? `, ${inherited.size} system file(s) reached` : ''}` +
    `${RESET}\n`,
)

if (problems.length) {
  console.error(`${RED}✗ ${problems.length} string(s) with no words behind them:${RESET}`)
  for (const problem of problems) console.error(`    ${problem}`)
  console.error(`\n  ${DIM}i18next renders the key when the key is missing, so this ships as a label.${RESET}\n`)
  process.exit(1)
}

console.log(`  ${GREEN}✓${RESET} every key has words in every locale\n`)
