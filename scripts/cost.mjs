#!/usr/bin/env node
/* What one screen costs on this system, in tokens and in money.
 *
 * The harness has measured how WELL agents do here since July and never once
 * measured what it cost. That is a hole in the argument the whole design rests
 * on: discovery reads a 4k index instead of a 100k registry SO THAT a task is
 * cheap, the context budget guards the input side of that with an estimate, and
 * nothing has ever counted what actually got spent on the other side.
 *
 * Without this number a contract change can only be judged on the score. A rule
 * that lifts the score from 96 to 100 and doubles the tokens is a trade, and
 * until now it was an invisible one.
 *
 * Reads `evals/.traces/runs.jsonl`, which `npm run eval` appends to. Runs whose
 * command did not report usage are counted separately and never averaged in as
 * free: a cost this cannot see is not a cost of zero.
 *
 *   npm run cost                    every recorded run
 *   npm run cost -- --last          only the most recent run id
 *   npm run cost -- --task <id>     one task across every run
 */
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { fmtTokens, fmtUsd } from './lib/agent-cost.mjs'

const ROOT = fileURLToPath(new URL('..', import.meta.url)).replace(/\/$/, '')
const FILE = `${ROOT}/evals/.traces/runs.jsonl`
const RESET = '\x1b[0m', GREEN = '\x1b[32m', DIM = '\x1b[2m', BOLD = '\x1b[1m', YELLOW = '\x1b[33m'

const argv = process.argv.slice(2)
const taskFilter = argv.includes('--task') ? argv[argv.indexOf('--task') + 1] : null

if (!existsSync(FILE)) {
  console.log(`${DIM}No traces yet. They are written by \`npm run eval -- --agent "…"\`.${RESET}`)
  process.exit(0)
}

let rows = readFileSync(FILE, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l))
if (argv.includes('--last')) {
  const last = rows[rows.length - 1]?.runId
  rows = rows.filter((r) => r.runId === last)
}
if (taskFilter) rows = rows.filter((r) => r.task === taskFilter)

const priced = rows.filter((r) => r.cost?.totalTokens)
const unpriced = rows.length - priced.length

console.log(`\n${BOLD}Cost${RESET} ${DIM}${rows.length} run(s)${taskFilter ? `, task ${taskFilter}` : ''}${RESET}\n`)

if (!priced.length) {
  console.log(`  ${YELLOW}Not one recorded run carries its own cost.${RESET}\n`)
  console.log(`  ${DIM}The runner reads it out of the agent's transcript, which only carries it when the`)
  console.log(`  agent was asked to emit one. Re-run with a command that does:${RESET}\n`)
  console.log(`    npm run eval -- --agent "claude -p --output-format json --permission-mode acceptEdits"\n`)
  console.log(`  ${DIM}Traces written before this existed have no cost and never will — nothing`)
  console.log(`  reconstructs it after the fact, and a guessed number here would be worse than none.${RESET}\n`)
  process.exit(0)
}

/** The middle run, not the mean: agents are not deterministic and one 9-minute
 *  outlier moves an average by more than it tells you. */
const median = (ns) => {
  const s = [...ns].sort((a, b) => a - b)
  return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2
}

const byTask = new Map()
for (const r of priced) {
  if (!byTask.has(r.task)) byTask.set(r.task, [])
  byTask.get(r.task).push(r)
}

console.log(`  ${DIM}task${RESET}                  ${DIM}runs   median tokens   of which output    median cost   median time${RESET}`)
for (const [task, list] of [...byTask].sort((a, b) => median(b[1].map((r) => r.cost.totalTokens)) - median(a[1].map((r) => r.cost.totalTokens)))) {
  const tokens = median(list.map((r) => r.cost.totalTokens))
  const output = median(list.map((r) => r.cost.outputTokens))
  const usd = list.every((r) => r.cost.usd !== null) ? median(list.map((r) => r.cost.usd)) : null
  const ms = median(list.map((r) => r.ms ?? 0))
  console.log(
    `  ${task.padEnd(22)}${String(list.length).padStart(4)}   ${fmtTokens(tokens).padStart(13)}   ${fmtTokens(output).padStart(15)}   ${fmtUsd(usd).padStart(12)}   ${(`${Math.round(ms / 1000)}s`).padStart(11)}`,
  )
}

const all = priced.map((r) => r.cost.totalTokens)
const usdAll = priced.every((r) => r.cost.usd !== null) ? priced.map((r) => r.cost.usd) : null
console.log(`\n  ${BOLD}One screen on this system${RESET}: ${GREEN}${fmtTokens(median(all))} tokens${RESET}, ${GREEN}${fmtUsd(usdAll ? median(usdAll) : null)}${RESET} ${DIM}median over ${priced.length} run(s)${RESET}`)
console.log(`  ${DIM}spread ${fmtTokens(Math.min(...all))} to ${fmtTokens(Math.max(...all))}${RESET}`)

/* Where the tokens went. Cache reads dominate an agentic run and that is the
 * point of showing them apart: the must-read context is paid once and read back
 * on every turn, so a contract that grows by 1k costs far more than 1k. */
const sum = (f) => priced.reduce((n, r) => n + f(r.cost), 0)
const total = sum((c) => c.totalTokens)
const share = (n) => `${((n / total) * 100).toFixed(0)}%`
console.log(`\n  ${DIM}where they go: ${share(sum((c) => c.cacheReadTokens))} re-read from cache · ${share(sum((c) => c.cacheWriteTokens))} written to it · ${share(sum((c) => c.inputTokens))} fresh input · ${share(sum((c) => c.outputTokens))} output${RESET}`)
console.log(`  ${DIM}The must-read context is paid once and re-read every turn, so a contract that`)
console.log(`  grows by 1k tokens costs a multiple of 1k. \`npm run context\` guards that side.${RESET}`)

if (unpriced) {
  console.log(`\n  ${YELLOW}${unpriced} run(s) carry no cost${RESET} ${DIM}— recorded before this was measured, or run with an agent`)
  console.log(`  command that emits no usage. Not averaged in: an unmeasured run is not a free one.${RESET}`)
}
console.log('')
