#!/usr/bin/env node
/* Does the GATE bite? One break per category, and whoever notices.
 *
 * `npm run redteam` asks this of ONE check — the static scorer an agent can run
 * on itself — with nine mutations against sixteen fixtures. Nothing asked it of
 * the other thirty-five steps, and the answer was not free: on 2026-08-26 a
 * hand-run battery found a missing card specimen printed "30/31" in grey and
 * exited 0. Coverage that only counts is not a check.
 *
 * Each break names the step that OUGHT to catch it. When that step stays green
 * the break is not yet a hole: the same battery found that deleting an
 * IconButton's `aria-label` walks past `lint:rules` and dies on the component's
 * own test. So a survivor escalates to the whole gate, and only a break that
 * survives THAT is reported as a hole.
 *
 *   npm run gate-redteam            every break
 *   npm run gate-redteam -- --list  what is tried, and which step should catch it
 *
 * NOT a gate step, deliberately: it runs the gate once per surviving break, and
 * a check that costs ten minutes on every commit is a check somebody deletes.
 * Run it when a check is added or changed — that is when the question is live.
 */
import { readFileSync, writeFileSync, copyFileSync, unlinkSync, existsSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('..', import.meta.url)).replace(/\/$/, '')
const RED = '\x1b[31m', GREEN = '\x1b[32m', DIM = '\x1b[2m', BOLD = '\x1b[1m', YEL = '\x1b[33m', OFF = '\x1b[0m'

/* "a comment in the working language", built from code points so the source
   of this file stays English. */
const WORKING_LANGUAGE = String.fromCharCode(0x44d,0x442,0x43e,0x20,0x43a,0x43e,0x43c,0x43c,0x435,0x43d,0x442,0x430,0x440,0x438,0x439)

/* One client product's name, for the break that proves check:publishable bites.
   Same construction and the same reason: the payload may not be spelled in a
   file that ships. */
const CLIENT_NAME = String.fromCharCode(115,97,108,105,109)

/** Each break is a way this repository has actually been wrong, or could be. */
const BREAKS = [
  { name: 'a11y: an icon button loses its label', step: 'lint:rules',
    file: 'src/components/Pagination/Pagination.tsx', edit: (s) => s.replace(/\n\s+aria-label=\{prevLabel\}/, '') },
  { name: 'spacing: a raw px off the grid', step: 'lint:rules',
    file: 'src/components/Badge/Badge.css', edit: (s) => s.replace('.badge {', '.badge {\n  margin: 7px;') },
  { name: 'colour: a hex decided in a component', step: 'lint:css',
    file: 'src/components/Badge/Badge.css', edit: (s) => s.replace('.badge {', '.badge {\n  color: #ff0000;') },
  { name: 'RTL: a physical property', step: 'lint:rules',
    file: 'src/components/Badge/Badge.css', edit: (s) => s.replace('.badge {', '.badge {\n  padding-left: var(--space-2);') },
  { name: 'contract: a token that does not exist', step: 'lint:css',
    file: 'src/components/Badge/Badge.css', edit: (s) => s.replace('.badge {', '.badge {\n  background: var(--not-a-token);') },
  { name: 'specificity: !important', step: 'lint:css',
    file: 'src/components/Badge/Badge.css', edit: (s) => s.replace('.badge {', '.badge {\n  display: block !important;') },
  { name: 'registry drift: a prop added and not regenerated', step: 'gen-registry:check',
    file: 'src/components/Badge/Badge.tsx', edit: (s) => s.replace(/(type Props =[^{]*\{)/, '$1\n  /** invented */ mutated?: boolean') },
  { name: 'language: working-language text ships', step: 'check:lang',
    /* The payload is assembled from escapes rather than written out: this file
       ships in a package the language check holds to English, and a break that
       has to contain the working language cannot be spelled here. */
    file: 'src/components/Badge/Badge.tsx', edit: (s) => `/* ${WORKING_LANGUAGE} */\n` + s },
  { name: 'decision layer: a card family loses its specimen', step: 'check:spec',
    file: 'src/specimens/cards.tsx', edit: (s) => s.replace(/^ {2}person: \(\) =>/m, '  mutatedPerson: () =>') },
  { name: 'decision layer: a form kind loses its specimen', step: 'check:spec',
    file: 'src/specimens/forms.tsx', edit: (s) => s.replace(/^ {2}'?dialog'?: \(\) =>/m, "  mutatedDialog: () =>") },
  { name: 'states: a control loses its press', step: 'states',
    file: 'src/components/ColorSwatch/ColorSwatch.css', edit: (s) => s.replace(/\.color-swatch:active:not\(:disabled\)[^\n]*\n/, '') },
  { name: 'docs: llms.txt goes stale', step: 'llms:check',
    file: 'llms.txt', edit: (s) => s.replace(/^- /m, '- Mutated ') },
  { name: 'contract: a component publishes no props', step: 'gen-registry:check',
    file: 'src/components/SectionLabel/SectionLabel.tsx', edit: (s) => s.replace('as?: Heading', 'as2?: Heading') },
  /* The break goes into the registry rather than into a component, because the
     registry is what lint:api reads: it is the published API, and a prop that
     changes shape reaches an agent through this file. `label` is on the ceiling
     at two types, so a third is a RISE — which is the thing being proved, not
     the drift the ceiling already carries. */
  { name: 'API: a prop name gains a third type', step: 'lint:api',
    file: 'component-registry.json',
    edit: (s) => s.replace(/"name": "label",(\s*)"type": "string"/, '"name": "label",$1"type": "{ text: string }"') },
  /* A mechanism that stops saying what it is for. Nothing else in the gate reads
     a comment, which is the point: this is the half of discovery-first that is
     about being FINDABLE, and it is invisible to every other check. */
  { name: 'mechanisms: a hook loses the sentence that makes it findable', step: 'lint:mechanisms',
    /* The doc block sits ABOVE THE EXPORT, not at the top of the file: the
       imports come first in TypeScript. This edit read the top of the file until
       2026-09-03, when the hook grew an import and the break began skipping
       itself — a skipped break proves nothing, and it says so in green. */
    file: 'src/lib/useListNavigation.ts', edit: (s) => s.replace(/\/\*\*[\s\S]*?\*\/\n(?=export function)/, '') },
  /* An engine that lets whichever fact it sees first win. It passes every other
     check in the gate, because every other check asks whether the answer is
     allowed and none of them asks whether it is the same answer twice. */
  { name: 'rules: a decision that depends on the order of the facts', step: 'check:determinism',
    file: 'scripts/lib/spec-rules.mjs',
    edit: (s) => s.replace('return rulesDoc.precedence.find((rep) => present.has(rep)) ?? null', 'return [...present][0] ?? null') },
  /* A spacing question gains an answer nobody decided: not a raw px, not an
     undefined token, nothing any other check reads — just one more distance in
     a system that already has sixteen. */
  { name: 'tokens: one more answer to a question that had enough', step: 'lint:token-layer',
    file: 'src/components/Badge/Badge.css', edit: (s) => s.replace('.badge {', '.badge {\n  gap: var(--space-10);') },
  /* A client's name in a file that ships. The break is a comment, which is what
     makes it the right one: nothing else in the gate reads a comment, and a
     comment is exactly where the three real ones were found on 2026-09-02.
     Assembled from code points for the same reason the working-language break
     above is — this file ships too, and check:publishable caught it spelled out
     the first time, which is the check proving itself on the way in. */
  { name: 'publishing: a client product named in a file that ships', step: 'check:publishable',
    file: 'src/lib/isRouteActive.ts',
    edit: (s) => s.replace('three products take it', `three products take it (${CLIENT_NAME} among them)`) },
  /* The manifest is data, and data is edited without anything running it. The
     break is the exact shape the population field exists to stop: a step that
     names its own list instead of walking the code, with no argument for it. */
  { name: 'gate: a step names its own population and does not argue for it', step: 'check:gates',
    file: 'scripts/gates.mjs',
    edit: (s) => s.replace(/population: 'derived — every file git carries'/, "population: 'the usual files'") },
  /* The fourth tier is only a tier while something stops a part rebuilding it:
     the ingredients stay legal in the token layer, so nothing about the CSS
     itself is wrong. (2026-09-02) */
  { name: 'tokens: a component rebuilds a recipe out of its parts', step: 'lint:rules',
    file: 'src/components/Badge/Badge.css', edit: (s) => s.replace('.badge {', '.badge {\n  border: 1px solid var(--border);') },
  /* Written longhand, sharing no line with any existing part, which is the
     point: jscpd cannot see it and lint:mechanism can. */
  { name: 'mechanism: an anchored layer written a sixth time', step: 'lint:mechanism',
    file: 'src/components/Badge/Badge.tsx',
    edit: (s) => `${s}\nexport function probeLayer(anchor: HTMLElement | null) {\n  const box = anchor?.getBoundingClientRect()\n  const room = window.innerHeight - (box?.bottom ?? 0)\n  anchor?.focus()\n  return createPortal(<div data-room={room} />, document.body)\n}\n` },
]

if (process.argv.includes('--list')) {
  console.log(`${BOLD}What the gate red team breaks${OFF}\n`)
  for (const b of BREAKS) console.log(`  ${b.step.padEnd(20)}${DIM}${b.name}${OFF}`)
  process.exit(0)
}

/* Restore whatever is still mutated, however this ends. A break holds a backup
   beside the file it broke, and a run cut short — a piped `head`, a Ctrl-C —
   used to leave both the mutation and the backup in the source tree. The
   backup then shipped as a component file. */
const outstanding = new Set()
const sweep = () => {
  for (const path of outstanding) {
    try { copyFileSync(`${path}.gaterb`, path); unlinkSync(`${path}.gaterb`) } catch { /* already restored */ }
  }
  outstanding.clear()
}
process.on('exit', sweep)
for (const sig of ['SIGINT', 'SIGTERM', 'SIGPIPE']) process.on(sig, () => { sweep(); process.exit(130) })

const run = (cmd) => {
  try { execSync(cmd, { cwd: ROOT, stdio: 'pipe', timeout: 1800000 }); return true }
  catch { return false }
}

console.log(`${BOLD}Gate red team${OFF} ${DIM}${BREAKS.length} break(s)${OFF}\n`)
const holes = []
for (const b of BREAKS) {
  const path = `${ROOT}/${b.file}`
  if (!existsSync(path)) { console.log(`  ${YEL}skip${OFF}  ${b.name} ${DIM}(no ${b.file})${OFF}`); continue }
  const backup = `${path}.gaterb`
  copyFileSync(path, backup)
  const before = readFileSync(path, 'utf8')
  const after = b.edit(before)
  if (after === before) {
    copyFileSync(backup, path); unlinkSync(backup); outstanding.delete(path)
    console.log(`  ${YEL}skip${OFF}  ${b.name} ${DIM}(the edit no longer applies — the file moved under it)${OFF}`)
    continue
  }
  outstanding.add(path)
  writeFileSync(path, after)
  const namedStepCaught = !run(`npm run ${b.step} --silent`)
  /* Its own step missing it is not yet a hole: something else may hold the same
     invariant, and what matters is whether the GATE goes red. */
  const gateCaught = namedStepCaught || !run('npm run check --silent')
  copyFileSync(backup, path); unlinkSync(backup)

  if (!gateCaught) { holes.push(b); console.log(`  ${RED}HOLE${OFF}  ${b.name} ${DIM}— the whole gate stayed green${OFF}`) }
  else if (!namedStepCaught) console.log(`  ${GREEN}caught${OFF} ${b.name} ${DIM}— not by ${b.step}, but the gate went red${OFF}`)
  else console.log(`  ${GREEN}caught${OFF} ${b.name} ${DIM}${b.step}${OFF}`)
}

console.log()
if (holes.length) {
  console.error(`${RED}✗ ${holes.length} break(s) the gate does not notice.${OFF}`)
  console.error(`  ${DIM}Fix the check; never delete the break.${OFF}`)
  process.exit(1)
}
console.log(`${GREEN}✓ every break is noticed by the gate.${OFF}`)
