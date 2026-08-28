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
