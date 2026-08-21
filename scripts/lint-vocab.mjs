// One word per idea across the whole public API.
//
// A shared prop name is a promise. `tone` on Alert and `tone` on ProgressBar
// must accept the same words, or an agent that learned the system from one
// component writes a type error against the next one. Nothing checked that, and
// the system had quietly split in two places: `danger` against `destructive`
// for a bad status, and `neutral` against `default` for no status.
//
// The vocabulary lives in prop-vocabulary.json, one sentence per word. This
// reads every component's public unions and holds them to it.
//
// Two things it will not do. It will not invent a preferred spelling: a word
// outside the vocabulary is a question for a person, and the fix is either to
// use the declared word or to declare the new one with its meaning. And it will
// not require a component to accept every word — a subset is normal, a Table row
// has no use for `ai`.
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

/* The root is overridable so this linter can be pointed at a broken COPY of the
 * package and proven to bite. Nothing else sets it: `npm run` always lints here.
 * See scripts/linters.test.mjs — a linter with no negative test is a linter that
 * can stop working without anybody finding out. */
const ROOT = process.env.DS_LINT_ROOT ?? fileURLToPath(new URL('..', import.meta.url)).replace(/\/$/, '')
const RESET = '\x1b[0m', RED = '\x1b[31m', GREEN = '\x1b[32m', DIM = '\x1b[2m', BOLD = '\x1b[1m'

const vocab = JSON.parse(readFileSync(`${ROOT}/prop-vocabulary.json`, 'utf8'))
const PROPS = Object.keys(vocab).filter((k) => k !== '_')

/* A component is interactive if it renders its own control. `onlyOn` uses this,
 * and it is the difference between a destructive ACTION and a bad STATE. */
const isInteractive = (src) => /<(button|a|input|textarea|select)[\s>]/.test(src)

/** Every string-literal union a component publishes for one of the shared props.
 *  Both spellings the codebase uses: a named `type Tone = ...` alias, and an
 *  inline `tone?: 'a' | 'b'` on the props object. */
function unionsFor(src, prop) {
  const alias = prop[0].toUpperCase() + prop.slice(1)
  const found = []
  const named = new RegExp(`type\\s+${alias}\\s*=\\s*([^;\\n]+)`, 'g')
  const inline = new RegExp(`\\b${prop}\\??\\s*:\\s*((?:'[^']*'|"[^"]*")(?:\\s*\\|\\s*(?:'[^']*'|"[^"]*"))*)`, 'g')
  for (const re of [named, inline]) {
    for (const m of src.matchAll(re)) {
      const words = [...m[1].matchAll(/'([^']+)'|"([^"]+)"/g)].map((w) => w[1] ?? w[2])
      if (words.length) found.push(words)
    }
  }
  return found
}

const problems = []
const axes = new Map(PROPS.map((p) => [p, new Map()]))
let componentsWithProps = 0

const dirs = readdirSync(`${ROOT}/src/components`).filter((d) =>
  existsSync(`${ROOT}/src/components/${d}/${d}.tsx`),
)

console.log(`${BOLD}Prop vocabulary${RESET} ${DIM}${dirs.length} components, ${PROPS.length} shared props${RESET}\n`)

for (const name of dirs) {
  const src = readFileSync(`${ROOT}/src/components/${name}/${name}.tsx`, 'utf8')
  const interactive = isInteractive(src)
  let touched = false

  for (const prop of PROPS) {
    const allowed = vocab[prop].values
    for (const words of unionsFor(src, prop)) {
      touched = true
      axes.get(prop).set(name, words)
      /* A scoped axis is the declared home for a component-local look. Its words
       * mean nothing system-wide, so policing them would be theatre; what matters
       * is that they are HERE and not in a system-wide scale like `variant`. */
      if (vocab[prop].scoped) continue
      for (const w of words) {
        const entry = allowed[w]
        if (entry === undefined) {
          problems.push({
            name,
            line: `${name}: \`${prop}\` accepts '${w}', which the vocabulary does not have`,
            hint: `Use one of: ${Object.keys(allowed).join(', ')} — or add '${w}' to prop-vocabulary.json with a sentence saying what it means.`,
          })
          continue
        }
        if (entry && typeof entry === 'object' && entry.onlyOn === 'interactive' && !interactive) {
          problems.push({
            name,
            line: `${name}: \`${prop}='${w}'\` on a component that renders no control`,
            hint: entry.why,
          })
        }
      }
    }
  }
  if (touched) componentsWithProps++
}

for (const prop of PROPS) {
  const used = axes.get(prop)
  const words = new Set([...used.values()].flat())
  console.log(
    `  ${prop.padEnd(11)} ${DIM}${String(used.size).padStart(2)} component(s), ` +
      `${words.size} word(s) of ${Object.keys(vocab[prop].values).length}${RESET}`,
  )
}

/* ── the names the API publishes that nobody declared ─────────────────── */
//
// Everything above validates the WORDS of the props the vocabulary already
// knows. That is a list checking itself, and it has the failure mode every such
// list has: `surface` was published by nine components — a fifth of everything
// with a public union — and this file was green the whole time, because it only
// ever looked up the names it had been told about. An undeclared name is the one
// case where nobody has written down what the word means, which is exactly the
// case worth failing on.
//
// So the other direction: ask the API what names it uses. The registry is the
// published API and `gen-registry:check` keeps it equal to the source, so the
// union props are already parsed there — no second, worse parser here.
//
// Two components is the threshold, the same one the promotion rule uses: one
// component owning a word is that component's business, a second one makes it a
// promise, and a promise has to be written down.
const SHARED = 2
const registryFile = `${ROOT}/component-registry.json`
const undeclared = []
if (existsSync(registryFile)) {
  const reg = JSON.parse(readFileSync(registryFile, 'utf8'))
  const byName = new Map()
  for (const [name, entry] of Object.entries(reg.components)) {
    for (const p of entry.props ?? []) {
      if (!p.values?.length || PROPS.includes(p.name)) continue
      if (!byName.has(p.name)) byName.set(p.name, [])
      byName.get(p.name).push(`${name} (${p.values.join('|')})`)
    }
  }
  for (const [name, users] of byName) if (users.length >= SHARED) undeclared.push({ name, users })
  console.log(
    `\n  ${DIM}${byName.size} undeclared union prop name(s) in the API, ` +
      `${undeclared.length} of them on ${SHARED}+ components${RESET}`,
  )
}

console.log('')
if (undeclared.length) {
  console.error(`${RED}✗ ${undeclared.length} prop name(s) shared across components with nothing written down:${RESET}`)
  for (const u of undeclared) {
    console.error(`    ${u.name}${DIM} — ${u.users.join(', ')}${RESET}`)
  }
  console.error(
    `\n  Declare each in prop-vocabulary.json: the ONE question it answers, and a` +
      `\n  sentence per value. If two components use the name for two different` +
      `\n  questions, that is two props wearing one name — rename one of them.\n`,
  )
  process.exit(1)
}
if (problems.length) {
  console.error(`${RED}✗ ${problems.length} word(s) outside the vocabulary:${RESET}`)
  for (const p of problems) {
    console.error(`    ${p.line}`)
    console.error(`      ${DIM}${p.hint}${RESET}`)
  }
  console.error(
    `\n  A shared prop name is a promise that the word means the same thing everywhere.` +
      `\n  Two words for one idea is how an agent learns the system wrong.\n`,
  )
  process.exit(1)
}
console.log(`${GREEN}✓ every public word is in the vocabulary, and means one thing.${RESET}`)
console.log(`${DIM}  ${componentsWithProps} component(s) publish at least one shared prop.${RESET}`)
