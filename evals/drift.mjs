#!/usr/bin/env node
/* Drift — does the agent still know the design system on turn ten?
 *
 * run.mjs answers "given a task, does the agent use this system", one fresh
 * session per task. That is the wrong shape for the failure this harness exists
 * to prevent. Nobody builds one screen and stops. A real session runs long, the
 * contract scrolls further and further up the context, and somewhere around the
 * eighth or tenth turn the model starts writing a plain <button> again. Every
 * linter in this repo is paid for by that failure and none of them measures it.
 *
 * So: the same tasks, in ONE session, scored per turn.
 *
 *   node evals/drift.mjs --agent "claude -p --permission-mode acceptEdits"
 *   node evals/drift.mjs --agent "…" --turns 20        loop the task list
 *   node evals/drift.mjs --agent "…" --no-control      the curve without the control
 *   node evals/drift.mjs --agent "…" --session <uuid>  pin the session id yourself
 *   node evals/drift.mjs --rescore evals/.drift/<id>   score a finished run again
 *
 * The control matters more than the curve. Task ten is not task one, so a lower
 * score on turn ten might be a harder task rather than a forgotten contract. Each
 * task is therefore ALSO run in a fresh session, and what is reported is the
 * difference: same task, same model, same prompt, one carrying nine turns of
 * history and one carrying none. That number is drift and nothing else.
 *
 * The session is pinned by id (`--session-id` on the first turn, `--resume` on
 * the rest), so the thing being measured is one conversation and not "whatever
 * was last written to in this folder" — which, in a repository somebody is
 * working in, is usually their own session.
 *
 * Not in the gate. It costs a real agent, real minutes and real money, and a
 * number that is expensive to take is still worth taking before shipping a change
 * to the contract, the index or the linters. Record it in BASELINE.md.
 */
import { execFileSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { appendFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { staticScore, DIMENSIONS } from './scorers.mjs'
import { deepCheck } from '../scripts/lib/deep-check.mjs'

const ROOT = fileURLToPath(new URL('..', import.meta.url)).replace(/\/$/, '')
const TASKS_DIR = `${ROOT}/evals/tasks`
const GREEN = '\x1b[32m', RED = '\x1b[31m', YEL = '\x1b[33m', DIM = '\x1b[2m', BOLD = '\x1b[1m', OFF = '\x1b[0m'

const argv = process.argv.slice(2)
const flag = (name) => {
  const i = argv.indexOf(`--${name}`)
  return i === -1 ? null : argv[i + 1]
}
const has = (name) => argv.includes(`--${name}`)

const agentCmd = flag('agent')
const rescore = flag('rescore')
/* The session is PINNED, not "the most recent one".
 *
 * The first version used `--continue`, which resumes whatever conversation in
 * this directory was last written to. That is fine in a quiet repository and
 * silently wrong in a real one: the person measuring is usually sitting in their
 * own session in the same folder, and turn two would resume THAT — inheriting a
 * context that has nothing to do with the task and reporting the result as
 * drift. An explicit id makes the session a fact rather than a race. */
const sessionFlag = flag('session-flag') ?? '--session-id'
const resumeFlag = flag('resume-flag') ?? '--resume'
const SESSION = flag('session') ?? randomUUID()
const control = !has('no-control')
const deep = has('deep')
/* How much the score may fall between the first third of the session and the
 * last before this fails. 15 points is not a law of nature: it is the smallest
 * drop that is bigger than the run-to-run noise measured in BASELINE.md, where
 * one run per task scored about 20 points away from the mean of three. Take the
 * number down as the harness gets steadier. */
const maxDrop = Number(flag('max-drop') ?? 15)

const registry = JSON.parse(readFileSync(`${ROOT}/component-registry.json`, 'utf8'))
const allTasks = readdirSync(TASKS_DIR)
  .filter((d) => statSync(`${TASKS_DIR}/${d}`).isDirectory())
  .map((id) => ({
    id,
    prompt: readFileSync(`${TASKS_DIR}/${id}/task.md`, 'utf8'),
    rubric: JSON.parse(readFileSync(`${TASKS_DIR}/${id}/rubric.json`, 'utf8')),
  }))

const turns = Number(flag('turns') ?? allTasks.length)
const plan = Array.from({ length: turns }, (_, i) => allTasks[i % allTasks.length])

const RUN_ID = new Date().toISOString().replace(/[:.]/g, '-')
const RUN_DIR = rescore ?? `${ROOT}/evals/.drift/${RUN_ID}`
const WORK = `${ROOT}/src/__eval__/drift-${process.pid}`

/* ── scoring, shared with run.mjs ───────────────────────────────────── */
function readCandidate(dir, prefix = '') {
  const files = {}
  if (!existsSync(dir)) return files
  for (const name of readdirSync(dir)) {
    const full = `${dir}/${name}`
    if (statSync(full).isDirectory()) {
      Object.assign(files, readCandidate(full, `${prefix}${name}/`))
      continue
    }
    if (!/\.(tsx?|css)$/.test(name)) continue
    files[`${prefix}${name}`] = readFileSync(full, 'utf8')
  }
  return files
}

function score(task, dir) {
  const files = readCandidate(dir)
  if (!Object.keys(files).length) return { score: 0, failed: ['no-output'], findings: {} }
  const result = staticScore(files, { rubric: task.rubric, registry })
  const dyn = deep ? deepCheck({ root: ROOT, files, workDir: `${WORK}/${task.id}`, entry: task.rubric.entry ?? 'Screen.tsx' }) : null
  const all = { ...result.findings, ...(dyn ?? {}) }
  const dims = [...DIMENSIONS, ...(dyn ? ['compiles', 'renders'] : [])]
  const failed = dims.filter((d) => (all[d] ?? []).length > 0)
  return {
    score: (dims.length - failed.length) / dims.length,
    failed,
    findings: Object.fromEntries(Object.entries(all).filter(([, v]) => v.length)),
  }
}

/* ── running the agent ──────────────────────────────────────────────── */
const OUTPUT_RULES =
  `Write the deliverable into \`%DIR%/\` now, using the Write tool. ` +
  `Do not ask for permission and do not describe what you would write: this ` +
  `runs without a human, nobody can answer a question, and a turn that ends ` +
  `with a question leaves the directory empty and scores zero. ` +
  `Change nothing else in the repository.\n`

function runAgent(task, dir, { resume, session }) {
  rmSync(dir, { recursive: true, force: true })
  mkdirSync(dir, { recursive: true })
  const parts = agentCmd.split(' ')
  const cmd = parts[0]
  const sessionArgs = session ? (resume ? [resumeFlag, session] : [sessionFlag, session]) : []
  const args = [...parts.slice(1), ...sessionArgs]
  const prompt = `${task.prompt}\n---\n\n${OUTPUT_RULES.replace('%DIR%', dir)}`
  const started = Date.now()
  try {
    const out = String(execFileSync(cmd, args, { cwd: ROOT, input: prompt, stdio: ['pipe', 'pipe', 'pipe'] }) ?? '')
    writeFileSync(`${dir}.agent.log`, out)
    return { ms: Date.now() - started, ok: true }
  } catch (e) {
    writeFileSync(`${dir}.agent.log`, `${e.stdout ?? ''}\n${e.stderr ?? ''}`)
    return { ms: Date.now() - started, ok: false }
  }
}

/* ── the run ────────────────────────────────────────────────────────── */
if (!agentCmd && !rescore) {
  console.error(`${RED}✗ drift needs an agent to measure.${OFF}\n`)
  console.error(`  node evals/drift.mjs --agent "claude -p --permission-mode acceptEdits"`)
  console.error(`  node evals/drift.mjs --rescore evals/.drift/<run-id>${DIM}   (score a finished run again)${OFF}\n`)
  process.exit(2)
}

if (agentCmd) {
  console.log(`${BOLD}Drift — one session, ${turns} turns${OFF}`)
  console.log(`${DIM}  ${agentCmd}${control ? ', each task also run fresh as a control' : ''}${OFF}`)
  console.log(`${DIM}  session ${SESSION}${OFF}\n`)
  mkdirSync(`${RUN_DIR}/session`, { recursive: true })
  /* Every session turn first, in order and without interruption. */
  for (const [i, task] of plan.entries()) {
    const dir = `${RUN_DIR}/session/turn-${String(i + 1).padStart(2, '0')}-${task.id}`
    const { ms, ok } = runAgent(task, dir, { resume: i > 0, session: SESSION })
    console.log(`  turn ${String(i + 1).padStart(2)}  ${task.id.padEnd(16)} ${ok ? '' : RED + 'agent command failed ' + OFF}${DIM}${(ms / 1000).toFixed(0)}s${OFF}`)
  }
  if (control) {
    console.log('')
    mkdirSync(`${RUN_DIR}/control`, { recursive: true })
    for (const task of allTasks.filter((t) => plan.includes(t))) {
      const dir = `${RUN_DIR}/control/${task.id}`
      /* No session id at all: a control turn is a fresh conversation by
       * definition, and pinning one would make the twelve of them share it. */
      const { ms, ok } = runAgent(task, dir, { resume: false, session: null })
      console.log(`  control  ${task.id.padEnd(16)} ${ok ? '' : RED + 'agent command failed ' + OFF}${DIM}${(ms / 1000).toFixed(0)}s${OFF}`)
    }
  }
  writeFileSync(`${RUN_DIR}/plan.json`, JSON.stringify({ agentCmd, turns, control, session: SESSION, plan: plan.map((t) => t.id) }, null, 2) + '\n')
}

/* ── the curve ──────────────────────────────────────────────────────── */
const meta = JSON.parse(readFileSync(`${RUN_DIR}/plan.json`, 'utf8'))
const byId = new Map(allTasks.map((t) => [t.id, t]))
const rows = meta.plan.map((id, i) => {
  const task = byId.get(id)
  const dir = `${RUN_DIR}/session/turn-${String(i + 1).padStart(2, '0')}-${id}`
  const s = score(task, dir)
  const c = meta.control && existsSync(`${RUN_DIR}/control/${id}`) ? score(task, `${RUN_DIR}/control/${id}`) : null
  return { turn: i + 1, id, session: s, control: c, delta: c ? s.score - c.score : null }
})

console.log(`\n${BOLD}Per turn${OFF} ${DIM}(session score, control score, difference)${OFF}\n`)
for (const r of rows) {
  const pct = (n) => `${(n * 100).toFixed(0).padStart(3)}%`
  const d = r.delta === null ? '' : `${r.delta < 0 ? RED : GREEN}${(r.delta * 100 >= 0 ? '+' : '')}${(r.delta * 100).toFixed(0).padStart(3)}${OFF}`
  console.log(`  ${String(r.turn).padStart(2)}  ${r.id.padEnd(16)} ${pct(r.session.score)}  ${r.control ? DIM + pct(r.control.score) + OFF : '    '}  ${d}   ${DIM}${r.session.failed.join(', ')}${OFF}`)
}

const third = Math.max(1, Math.floor(rows.length / 3))
const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0)
const early = rows.slice(0, third)
const late = rows.slice(-third)
const measure = (set) => (meta.control ? mean(set.map((r) => r.delta ?? 0)) : mean(set.map((r) => r.session.score)))
const drop = (measure(early) - measure(late)) * 100

console.log(`\n${BOLD}Drift${OFF}`)
console.log(`  first ${third} turn(s): ${(measure(early) * 100).toFixed(0)}${meta.control ? ' points against the control' : '%'}`)
console.log(`  last  ${third} turn(s): ${(measure(late) * 100).toFixed(0)}${meta.control ? ' points against the control' : '%'}`)
console.log(`  drop: ${drop > 0 ? RED : GREEN}${drop.toFixed(0)} points${OFF} ${DIM}(fails over ${maxDrop})${OFF}`)

/* WHAT is forgotten, not just how much. A dimension that never fails early and
 * fails three times late is the rule the model stops applying, which is the one
 * to move into a linter, an index row, or a hook. */
const tally = (set) => {
  const t = {}
  for (const r of set) for (const d of r.session.failed) t[d] = (t[d] ?? 0) + 1
  return t
}
const earlyT = tally(early), lateT = tally(late)
const forgotten = [...new Set([...Object.keys(earlyT), ...Object.keys(lateT)])]
  .map((d) => ({ d, early: earlyT[d] ?? 0, late: lateT[d] ?? 0 }))
  .filter((x) => x.late > x.early)
  .sort((a, b) => b.late - a.late)
if (forgotten.length) {
  console.log(`\n${BOLD}Forgotten first${OFF} ${DIM}(fails more in the last third than the first)${OFF}`)
  for (const f of forgotten) console.log(`  ${YEL}${f.d.padEnd(18)}${OFF} ${f.early} early -> ${f.late} late`)
}

mkdirSync(`${ROOT}/evals/.traces`, { recursive: true })
appendFileSync(
  `${ROOT}/evals/.traces/drift.jsonl`,
  JSON.stringify({
    runId: RUN_DIR.split('/').pop(), at: new Date().toISOString(), agent: meta.agentCmd,
    turns: meta.turns, control: meta.control, drop,
    rows: rows.map((r) => ({ turn: r.turn, id: r.id, session: r.session.score, control: r.control?.score ?? null, failed: r.session.failed })),
  }) + '\n',
)

console.log(`\n${DIM}  run: ${RUN_DIR.replace(ROOT + '/', '')}${OFF}`)
if (drop > maxDrop) {
  console.error(`\n${RED}✗ the agent loses ${drop.toFixed(0)} points over a session. The contract is not surviving the context.${OFF}`)
  process.exit(1)
}
console.log(`\n${GREEN}✓ no drift beyond ${maxDrop} points across ${rows.length} turns.${OFF}`)
