// A component that DOES something has to be tested doing it.
//
// Every component here already renders and passes axe through its golden
// example, and for a Divider that is the whole truth about it. But an example
// cannot press a key, and it cannot notice that a toggle stopped toggling — so
// for anything with state, a keyboard contract, an effect or an ARIA state, the
// example is a smoke test wearing a coverage badge.
//
// Counting components without a test file gave 47 and was the wrong number: 31
// of them have no behaviour to test. Counting the ones that DO gave 16, which
// was a day of work rather than a quarter of it. This check keeps that number
// at zero by construction — the moment a presentational component grows state,
// it starts asking for a test, on the commit that added the state rather than
// in an audit a year later.
//
// The signals are deliberately crude. A false positive costs one test nobody
// strictly needed; a false negative costs an untested toggle.
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

/* The root is overridable so this linter can be pointed at a broken COPY of the
 * package and proven to bite. Nothing else sets it: `npm run` always lints here.
 * See scripts/linters.test.mjs — a linter with no negative test is a linter that
 * can stop working without anybody finding out. */
const ROOT = process.env.DS_LINT_ROOT ?? fileURLToPath(new URL('..', import.meta.url)).replace(/\/$/, '')
const RESET = '\x1b[0m', RED = '\x1b[31m', GREEN = '\x1b[32m', DIM = '\x1b[2m', BOLD = '\x1b[1m'

const SIGNALS = [
  [/useState|useReducer/, 'holds state'],
  [/onKeyDown|onKeyUp|e\.key ===|key === '/, 'has a keyboard contract'],
  [/useEffect|useLayoutEffect/, 'runs an effect'],
  [/aria-(expanded|selected|checked|current|invalid|pressed|sort|busy)=/, 'carries an ARIA state'],
]

const dirs = readdirSync(`${ROOT}/src/components`).filter((d) =>
  existsSync(`${ROOT}/src/components/${d}/${d}.tsx`),
)

/* Which components a test actually exercises — by what the test imports, not by
 * where the file sits. Textarea is held to its contract inside Input.test.tsx,
 * because the two share it and testing them apart would let them drift. */
const TESTED = new Set()
for (const dir of dirs) {
  for (const f of readdirSync(`${ROOT}/src/components/${dir}`)) {
    if (!f.includes('.test.')) continue
    const src = readFileSync(`${ROOT}/src/components/${dir}/${f}`, 'utf8')
    for (const m of src.matchAll(/import\s*\{([^}]+)\}\s*from\s*'\.[^']*'/g)) {
      for (const n of m[1].split(',')) TESTED.add(n.trim())
    }
  }
}

const missing = []
let behavioural = 0
let presentational = 0

for (const name of dirs) {
  const src = readFileSync(`${ROOT}/src/components/${name}/${name}.tsx`, 'utf8')
  const why = SIGNALS.filter(([re]) => re.test(src)).map(([, label]) => label)
  if (!why.length) { presentational++; continue }
  behavioural++

  if (!TESTED.has(name)) missing.push({ name, why })
}

console.log(
  `${BOLD}Behaviour tests${RESET} ${DIM}${behavioural} component(s) with behaviour, ` +
    `${presentational} presentational${RESET}\n`,
)

if (missing.length) {
  console.error(`${RED}✗ ${missing.length} component(s) do something nobody tests:${RESET}`)
  for (const m of missing) console.error(`    ${m.name.padEnd(20)} ${DIM}${m.why.join(', ')}${RESET}`)
  console.error(
    `\n  The golden example proves it renders and passes axe. It cannot press a key,` +
      `\n  and it will not notice when a toggle stops toggling. Write the test next to` +
      `\n  the component — or, if the signal is wrong and there is genuinely nothing to` +
      `\n  press, simplify the component until this check agrees.\n`,
  )
  process.exit(1)
}
console.log(`${GREEN}✓ everything with behaviour has a test for it.${RESET}`)
