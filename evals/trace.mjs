// What keeps going wrong, across runs, instead of once on a terminal.
//
// A score says how well an agent did. It does not say which part of the harness
// to fix, and by the time you have read the failures they are gone. This reads
// the accumulated traces and answers the question a single run cannot: which
// dimension fails on the MOST tasks, and which finding repeats verbatim.
//
// A dimension that fails on one task is that task's problem. The same one
// failing on six is a hole in the contract, the registry or the examples — and
// that is a thing to fix once rather than nine times.
//
//   node evals/trace.mjs                 every recorded run
//   node evals/trace.mjs --label <text>  only runs whose conditions match
//   node evals/trace.mjs --last          only the most recent run id
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('..', import.meta.url)).replace(/\/$/, '')
const FILE = `${ROOT}/evals/.traces/runs.jsonl`
const RESET = '\x1b[0m', RED = '\x1b[31m', GREEN = '\x1b[32m', DIM = '\x1b[2m', BOLD = '\x1b[1m'

const argv = process.argv.slice(2)
const labelFilter = argv.includes('--label') ? argv[argv.indexOf('--label') + 1] : null

if (!existsSync(FILE)) {
  console.log(`${DIM}No traces yet. They are written by \`npm run eval -- --agent "…"\`.${RESET}`)
  process.exit(0)
}

let rows = readFileSync(FILE, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l))
if (labelFilter) rows = rows.filter((r) => r.label?.includes(labelFilter))
if (argv.includes('--last')) {
  const last = rows.at(-1)?.runId
  rows = rows.filter((r) => r.runId === last)
}
if (!rows.length) {
  console.log(`${DIM}Nothing matches.${RESET}`)
  process.exit(0)
}

const byRun = new Map()
for (const r of rows) {
  if (!byRun.has(r.runId)) byRun.set(r.runId, [])
  byRun.get(r.runId).push(r)
}

console.log(`${BOLD}Eval traces${RESET} ${DIM}${rows.length} run(s) across ${byRun.size} session(s)${RESET}\n`)

for (const [runId, group] of byRun) {
  const scored = group.filter((r) => r.ok)
  const mean = scored.length ? scored.reduce((a, r) => a + r.score, 0) / scored.length : 0
  const secs = Math.round(group.reduce((a, r) => a + (r.ms ?? 0), 0) / 1000)
  const perfect = scored.filter((r) => r.score === 1).length
  console.log(
    `  ${mean === 1 ? GREEN : RED}${(mean * 100).toFixed(0).padStart(3)}%${RESET} ` +
      `${runId}  ${DIM}${group.length} task-run(s), ${perfect} perfect, ${secs}s total${RESET}`,
  )
  console.log(`        ${DIM}${group[0].label}${RESET}`)
}

/* Grouped BY CONDITIONS. Aggregating across labels put two models' failures in
 * one table, where "style-hygiene 4/9" read as one run getting worse when it was
 * two different runs added together. A comparison table that mixes the things
 * being compared is worse than no table. */
const labels = [...new Set(rows.map((r) => r.label))]

/* Across everything selected: which dimension fails on the most DISTINCT tasks.
 * Counting runs would let one flaky task dominate; counting tasks is the signal
 * that says the harness, not the task, is what is wrong. */
function tableFor(subset) {
  const m = new Map()
  for (const r of subset) {
    for (const d of [...(r.failed ?? []), ...(r.ok ? [] : [`run failed: ${r.why}`])]) {
      if (!m.has(d)) m.set(d, new Set())
      m.get(d).add(r.task)
    }
  }
  return m
}

if (labels.length > 1) {
  console.log(`\n${BOLD}What fails, per condition${RESET}\n`)
  for (const l of labels) {
    const subset = rows.filter((r) => r.label === l)
    const n = new Set(subset.map((r) => r.task)).size
    const m = tableFor(subset)
    const mean = subset.filter((r) => r.ok).reduce((a, r) => a + r.score, 0) / (subset.filter((r) => r.ok).length || 1)
    console.log(`  ${BOLD}${l}${RESET} ${DIM}${(mean * 100).toFixed(0)}% over ${n} task(s)${RESET}`)
    if (!m.size) { console.log(`      ${GREEN}nothing failed${RESET}`); continue }
    for (const [d, set] of [...m].sort((a, b) => b[1].size - a[1].size)) {
      console.log(`      ${RED}${d.padEnd(18)}${RESET} ${set.size}/${n}  ${DIM}${[...set].join(' ')}${RESET}`)
    }
  }
  console.log(`\n  ${DIM}One run per condition cannot separate a real difference from${RESET}`)
  console.log(`  ${DIM}an agent's own variance. Use --repeat before concluding anything.${RESET}`)
}

const dimTasks = new Map()
const findingCounts = new Map()
for (const r of rows) {
  for (const d of r.failed ?? []) {
    if (!dimTasks.has(d)) dimTasks.set(d, new Set())
    dimTasks.get(d).add(r.task)
  }
  for (const lines of Object.values(r.findings ?? {})) {
    for (const line of lines) findingCounts.set(line, (findingCounts.get(line) ?? 0) + 1)
  }
  if (!r.ok) {
    const d = `run failed: ${r.why}`
    if (!dimTasks.has(d)) dimTasks.set(d, new Set())
    dimTasks.get(d).add(r.task)
  }
}

const tasks = new Set(rows.map((r) => r.task)).size

if (dimTasks.size) {
  console.log(`\n${BOLD}What fails, by how many of the ${tasks} task(s)${RESET}\n`)
  for (const [d, set] of [...dimTasks].sort((a, b) => b[1].size - a[1].size)) {
    const bar = '█'.repeat(set.size)
    console.log(`  ${RED}${d.padEnd(18)}${RESET} ${String(set.size).padStart(2)}/${tasks}  ${DIM}${bar}  ${[...set].join(' ')}${RESET}`)
  }
  console.log(`\n  ${DIM}One task is that task's problem. Most tasks is the contract, the registry${RESET}`)
  console.log(`  ${DIM}or the examples — one fix instead of ${tasks}.${RESET}`)
}

const repeated = [...findingCounts].filter(([, n]) => n > 1).sort((a, b) => b[1] - a[1])
if (repeated.length) {
  console.log(`\n${BOLD}Findings that repeat${RESET} ${DIM}the same sentence, more than once${RESET}\n`)
  for (const [line, n] of repeated.slice(0, 12)) console.log(`  ${String(n).padStart(2)}×  ${line}`)
  if (repeated.length > 12) console.log(`  ${DIM}… and ${repeated.length - 12} more${RESET}`)
}

/* ── outcomes ──────────────────────────────────────────────────────────
 * The dimensions above say what is wrong with the code. These three say what is
 * true of the FACTORY, which is the thing the harness is supposed to improve and
 * the thing nothing here measured until now:
 *
 *   success rate        share of runs that came back perfect. Not "did it try".
 *   cycle time          median and slowest run. A check nobody waits for is a
 *                       check nobody runs, and that applies to the loop too.
 *   defect escape rate  share of runs that were clean on everything an agent can
 *                       check itself (npm run verify, the MCP verify tool) and
 *                       still failed to compile or render. That is the exact
 *                       measure of what the fast loop cannot see, and therefore
 *                       of how much a human or a gate still has to catch.
 */
const SELF_CHECKABLE = ['components-exist', 'props-exist', 'props-complete', 'style-hygiene']
const finished = rows.filter((r) => r.ok)
if (finished.length) {
  const perfect = finished.filter((r) => r.score === 1).length
  const times = finished.map((r) => r.ms ?? 0).filter(Boolean).sort((a, b) => a - b)
  const median = times.length ? times[Math.floor(times.length / 2)] : 0
  const slowest = times.length ? times[times.length - 1] : 0
  const escaped = finished.filter((r) => {
    const failed = Object.keys(r.findings ?? {})
    const cleanToItself = failed.every((d) => !SELF_CHECKABLE.includes(d))
    return cleanToItself && failed.some((d) => d === 'compiles' || d === 'renders')
  }).length
  const pct = (n) => `${((n / finished.length) * 100).toFixed(0)}%`

  console.log(`\n${BOLD}Outcomes${RESET} ${DIM}${finished.length} finished run(s); ${rows.length - finished.length} never produced a file${RESET}\n`)
  console.log(`  success rate        ${pct(perfect)}  ${DIM}${perfect}/${finished.length} scored 100%${RESET}`)
  if (times.length) {
    console.log(`  cycle time          ${(median / 1000).toFixed(0)}s median  ${DIM}slowest ${(slowest / 1000).toFixed(0)}s${RESET}`)
  }
  console.log(`  defect escape rate  ${pct(escaped)}  ${DIM}${escaped} run(s) passed every self-check and still did not compile or render${RESET}`)
  console.log(`\n  ${DIM}Escapes are the argument for the slow half of the gate. A rate near zero means${RESET}`)
  console.log(`  ${DIM}the fast loop is doing the work; a rising one means a rule needs to move into it.${RESET}`)
}

if (!dimTasks.size) console.log(`\n${GREEN}✓ nothing failed in the selected runs.${RESET}`)
