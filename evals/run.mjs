#!/usr/bin/env node
/* Eval runner for the design system.
 *
 * The gate answers "is the repo healthy". This answers a different question:
 * "given a task, does the code an agent produces actually use this design
 * system?" That number is what makes harness work (context, rules, examples,
 * linters) measurable instead of a matter of taste.
 *
 * Modes:
 *   node evals/run.mjs                       score the reference fixtures and
 *                                            verify the scorers still bite
 *   node evals/run.mjs --candidate <dir>     score files someone already wrote
 *   node evals/run.mjs --agent "<command>"   run an agent per task, then score
 *
 * Agent contract: the command runs with cwd = the REPO ROOT, gets the task text
 * plus a line naming its output directory on stdin, and is expected to leave the
 * deliverable there. For Claude Code:
 *   node evals/run.mjs --agent "claude -p --permission-mode acceptEdits"
 *
 * The cwd matters: an agent sandboxed to a scratch directory cannot read
 * CLAUDE.md, component-registry.json or src/, so it guesses the API and the run
 * measures an agent WITHOUT the design system instead of one with it. (Measured:
 * 71% and seven type errors, against 100% for the same task with access.) Run the
 * no-context variant on purpose if you want that number, never by accident.
 *
 * Static checks (registry conformance, reuse, hygiene) always run and need
 * nothing but the files. Dynamic checks (tsc, render, axe) reuse the project's
 * own tooling by copying the candidate into src/__eval__/ and are skipped with
 * --static-only.
 */
import { execFileSync } from 'node:child_process'
import { appendFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { staticScore, DIMENSIONS } from './scorers.mjs'
import { deepCheck, deepCheckMany } from '../scripts/lib/deep-check.mjs'
import { checkContentModel } from '../scripts/lib/spec-rules.mjs'
import { costOf } from '../scripts/lib/agent-cost.mjs'

const ROOT = fileURLToPath(new URL('..', import.meta.url)).replace(/\/$/, '')
const TASKS_DIR = `${ROOT}/evals/tasks`
/* Per PROCESS, not shared.
 *
 * This was one directory for everyone, wiped at the start of each task's dynamic
 * check — so two eval runs on the same checkout deleted each other's files
 * mid-flight, and the second died on ENOENT writing a test into a directory the
 * first had just removed. The gate runs `npm run eval` itself, so "two runs at
 * once" is not exotic: it is what happens the moment anyone measures an agent
 * while the gate is running. */
const RUN_SLUG = `run-${process.pid}`
const WORK = `${ROOT}/src/__eval__/${RUN_SLUG}`

/* Take the work root away on the way out, however the run ends. The compile pass
   deletes the test FILE it wrote and nothing deleted the directory around it, so
   every run since this file was written left one behind: 901 empty directories
   under src/__eval__ by 2026-08-27, in the source tree of a package that is
   published. Litter nobody sees is litter nobody removes. */
const sweepWork = () => { try { rmSync(WORK, { recursive: true, force: true }) } catch { /* the run is over either way */ } }
process.on('exit', sweepWork)
for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => { sweepWork(); process.exit(130) })

const argv = process.argv.slice(2)
const flag = (name) => {
  const i = argv.indexOf(`--${name}`)
  return i === -1 ? null : argv[i + 1]
}
const has = (name) => argv.includes(`--${name}`)

const only = flag('task')
const candidateDir = flag('candidate')
const agentCmd = flag('agent')
/* The judge lane (L5): an LLM answers the task's acceptance criteria against
 * the delivered code, binary per criterion, biased to pass — the audit
 * measured judges reliable only for CLEAR violations, so "met unless clearly
 * violated" is the contract, and the gate stays deterministic because the
 * judge only runs when asked for. */
const judgeCmd = flag('judge')
const staticOnly = has('static-only')
const min = Number(flag('min') ?? 1)
/* One run of one task is an anecdote. --repeat N runs each task N times and
 * reports the spread, because agents are not deterministic and a single 100% can
 * hide a 1-in-3 failure. */
const repeat = Math.max(1, Number(flag('repeat') ?? 1))
/* What conditions produced this run. It goes in the trace, because a score with
 * no conditions attached is the reason BASELINE.md rows have to be read as prose
 * instead of compared. */
const label = flag('label') ?? agentCmd ?? (candidateDir ? `candidate:${candidateDir}` : 'reference fixtures')

/* ── trace ─────────────────────────────────────────────────────────────
 *
 * A score answers "how well". A trace answers "where it went wrong, again".
 * Without one, every run's failures are read once on a terminal and thrown
 * away, so nothing ever accumulates into "this dimension fails on every task"
 * — which is the only signal that says WHICH part of the harness to fix next.
 *
 * One JSON object per run, appended. Reading it back is `node evals/trace.mjs`. */
const TRACE = `${ROOT}/evals/.traces/runs.jsonl`
const runId = `${new Date().toISOString().replace(/[:.]/g, '-')}`
function trace(record) {
  mkdirSync(`${ROOT}/evals/.traces`, { recursive: true })
  appendFileSync(TRACE, JSON.stringify({ runId, label, at: new Date().toISOString(), ...record }) + '\n')
}

const registry = JSON.parse(readFileSync(`${ROOT}/component-registry.json`, 'utf8'))
const tasks = readdirSync(TASKS_DIR)
  .filter((d) => statSync(`${TASKS_DIR}/${d}`).isDirectory())
  .filter((d) => !only || d === only)
  .map((id) => ({
    id,
    prompt: readFileSync(`${TASKS_DIR}/${id}/task.md`, 'utf8'),
    rubric: JSON.parse(readFileSync(`${TASKS_DIR}/${id}/rubric.json`, 'utf8')),
  }))

/* ── helpers ───────────────────────────────────────────────────────── */

const GREEN = '\x1b[32m', RED = '\x1b[31m', DIM = '\x1b[2m', BOLD = '\x1b[1m', OFF = '\x1b[0m'

/* Recursive: an agent asked for "a screen" sometimes puts it in a folder, and
 * scoring that as "produced nothing" blames the model for the reader's
 * assumption. Depth is bounded by the work directory, which we created. */
function readCandidate(dir, prefix = '') {
  const files = {}
  for (const name of readdirSync(dir)) {
    const full = `${dir}/${name}`
    if (statSync(full).isDirectory()) {
      Object.assign(files, readCandidate(full, `${prefix}${name}/`))
      continue
    }
    /* .json rides along for the pipeline tasks (a spec and a model are the
     * deliverable there); expect.json is harness metadata, never a candidate. */
    if (!/\.(tsx?|css|json)$/.test(name) || name === 'expect.json') continue
    files[`${prefix}${name}`] = readFileSync(full, 'utf8')
  }
  return files
}

/* Pipeline tasks deliver the DECISION ARTIFACTS with the code: a content model
 * and a screen spec, judged by the same validators the gate runs — never by a
 * parallel reimplementation that could drift. `spec-valid` shells out to
 * check-screen-spec.mjs in its single-file mode (registry existence, the
 * selection rules, states, the id-matches-filename discipline); `model-valid`
 * runs the shared engine's checkContentModel against the delivered spec, so a
 * provenBy chain that cites a missing behaviour or a core attribute the screen
 * dropped fails here exactly as it would in the gate. Returns null for
 * ordinary tasks, which keeps the twelve component tasks scoring what they
 * always scored. */
function pipelineChecks(task, dir, files) {
  if (!task.rubric.pipeline) return null
  const findings = { 'spec-valid': [], 'model-valid': [] }
  const jsons = {}
  for (const [name, text] of Object.entries(files)) {
    if (!name.endsWith('.json')) continue
    try { jsons[name] = JSON.parse(text) } catch { findings['spec-valid'].push(`${name} is not valid JSON`) }
  }
  const specs = Object.entries(jsons).filter(([, j]) => Array.isArray(j.zones))
  const models = Object.entries(jsons).filter(([, j]) => j && typeof j.objects === 'object')
  if (!specs.length) findings['spec-valid'].push('no screen spec delivered — spec first, code second (a .json with zones)')
  const specsById = {}
  for (const [, spec] of specs) if (spec.id) specsById[spec.id] = spec
  for (const [name] of specs) {
    try {
      execFileSync(process.execPath, [`${ROOT}/scripts/check-screen-spec.mjs`, `${dir}/${name}`], { stdio: ['ignore', 'pipe', 'pipe'] })
    } catch (e) {
      /* The validator prints each problem indented six spaces under its ✗ line;
       * everything else on its output is summary prose. */
      const out = `${e.stdout ?? ''}${e.stderr ?? ''}`
      const problems = String(out).split('\n').filter((l) => /^\s{6}\S/.test(l)).map((l) => l.trim())
      findings['spec-valid'].push(...(problems.length ? problems.slice(0, 8) : [`check-screen-spec failed on ${name}`]))
    }
  }
  if (!models.length) findings['model-valid'].push('no content model delivered — a new project starts with the model')
  for (const [, model] of models) findings['model-valid'].push(...checkContentModel(model, specsById).problems)
  return findings
}

/* acceptance-met: the judge lane. One call per candidate: the task's
 * acceptance criteria, the delivered screen and spec, and a strict JSON
 * answer sheet. A criterion fails ONLY on a clear violation visible in the
 * code — "probably fine" is a pass, per the measured limits of LLM judging.
 * An unparseable answer fails loudly: a judge that cannot be read is worse
 * than none. */
function judgeChecks(task, files) {
  if (!judgeCmd || !task.rubric.pipeline || !(task.rubric.acceptance ?? []).length) return null
  const findings = { 'acceptance-met': [] }
  const code = Object.entries(files).filter(([p]) => /\.(tsx|json)$/.test(p) && p !== 'expect.json')
    .map(([p, src]) => `--- ${p} ---\n${src}`).join('\n\n')
  const criteria = task.rubric.acceptance
  const prompt =
    `You are judging whether delivered UI code meets its acceptance criteria.\n` +
    `Answer with ONLY a JSON object, no prose, no code fences: ` +
    `{"verdicts":[{"n":<criterion number>,"met":<boolean>,"why":"<one short sentence>"}]}.\n` +
    `Rules: judge ONLY what is visible in the code below. A criterion is met=false ONLY when the code ` +
    `clearly violates it; anything unverifiable or merely doubtful is met=true. One verdict per criterion, in order.\n\n` +
    `CRITERIA:\n${criteria.map((c, i) => `${i + 1}. ${c}`).join('\n')}\n\nDELIVERED FILES:\n${code}\n`
  const [cmd, ...args] = judgeCmd.split(' ')
  let raw = ''
  try {
    raw = String(execFileSync(cmd, args, { cwd: ROOT, input: prompt, stdio: ['pipe', 'pipe', 'pipe'] }) ?? '')
  } catch (e) {
    findings['acceptance-met'].push(`the judge command failed: ${String(e.message ?? e).slice(0, 200)}`)
    return findings
  }
  const jsonText = raw.slice(raw.indexOf('{'), raw.lastIndexOf('}') + 1)
  let verdicts
  try {
    verdicts = JSON.parse(jsonText).verdicts
    if (!Array.isArray(verdicts)) throw new Error('no verdicts array')
  } catch {
    findings['acceptance-met'].push(`the judge answered unparseably: ${raw.slice(0, 160)}`)
    return findings
  }
  for (const v of verdicts) {
    if (v && v.met === false) {
      const criterion = criteria[(v.n ?? 0) - 1] ?? `criterion ${v.n}`
      findings['acceptance-met'].push(`${criterion} — ${String(v.why ?? '').slice(0, 160)}`)
    }
  }
  return findings
}

/* Dynamic checks: the candidate is compiled and rendered by the real project
 * toolchain, not a simulation of it. */
function dynamicChecks(task, files) {
  return deepCheck({
    root: ROOT,
    files,
    workDir: `${WORK}/${task.id}`,
    entry: task.rubric.entry ?? 'Screen.tsx',
  })
}

function report(label, result, dyn, pipe) {
  const all = { ...result.findings, ...(pipe ?? {}), ...(dyn ?? {}) }
  const dims = [...DIMENSIONS, ...(pipe ? Object.keys(pipe) : []), ...(dyn ? ['compiles', 'renders'] : [])]
  const passed = dims.filter((d) => (all[d] ?? []).length === 0)
  const score = passed.length / dims.length
  const colour = score === 1 ? GREEN : RED
  console.log(`  ${colour}${(score * 100).toFixed(0).padStart(3)}%${OFF}  ${label}`)
  for (const d of dims) {
    const f = all[d] ?? []
    if (!f.length) { console.log(`         ${GREEN}✓${OFF} ${DIM}${d}${OFF}`); continue }
    console.log(`         ${RED}✗ ${d}${OFF} (${f.length})`)
    for (const line of f.slice(0, 4)) console.log(`             ${line}`)
    if (f.length > 4) console.log(`             ${DIM}… +${f.length - 4} more${OFF}`)
  }
  return { score, failed: dims.filter((d) => (all[d] ?? []).length > 0) }
}

/* ── modes ─────────────────────────────────────────────────────────── */

let exitCode = 0

if (agentCmd) {
  console.log(`${BOLD}Evals — agent run${OFF}\n${DIM}  ${agentCmd}${repeat > 1 ? `, ${repeat} runs per task` : ''}${OFF}\n`)
  const summary = []
  for (const task of tasks) {
    console.log(`\n${BOLD}${task.id}${OFF} ${DIM}${task.rubric.title}${OFF}`)
    const runs = []
    for (let i = 1; i <= repeat; i++) {
      const dir = `${ROOT}/evals/.work/${task.id}/run-${i}`
      rmSync(dir, { recursive: true, force: true })
      mkdirSync(dir, { recursive: true })
      const [cmd, ...args] = agentCmd.split(' ')
      /* ABSOLUTE. It was relative, and the captured transcripts showed the agent
       * reading `evals/.work/…` as `/evals/.work/…` — outside the project, so the
       * write was refused and the file went to a scratchpad instead. Three runs in
       * twelve were lost that way and every one was scored as though the model had
       * failed to write React. A path a reader can misresolve is a harness bug. */
      const outDir = dir
      /* Run from the repo root so the agent has the system it is being measured
       * against (CLAUDE.md, the registry, the existing screens), and tell it where
       * the deliverable goes. */
      const started = Date.now()
      /* The instruction is blunt on purpose. Measured 2026-08-02: a fifth of all
       * runs scored zero, and the captured transcripts showed why — the agent
       * described the file it intended to write and then asked "May I proceed?".
       * There is nobody to answer in a `-p` run, so the turn ended, the directory
       * stayed empty, and a harness failure was recorded against the model's
       * ability to write React. Asking for permission has to be closed off in
       * the prompt, not hoped against. */
      const prompt =
        `${task.prompt}\n---\n\n` +
        `Write the deliverable into \`${outDir}/\` now, using the Write tool. ` +
        `Do not ask for permission and do not describe what you would write: this ` +
        `runs without a human, nobody can answer a question, and a turn that ends ` +
        `with a question leaves the directory empty and scores zero. ` +
        `Change nothing else in the repository.\n`
      let transcript = ''
      try {
        /* The agent's own output is captured, not discarded. The first time a
         * fifth of all runs came back empty there was nothing to look at: the
         * runner had thrown away the only account of what happened. */
        transcript = String(execFileSync(cmd, args, { cwd: ROOT, input: prompt, stdio: ['pipe', 'pipe', 'pipe'] }) ?? '')
        writeFileSync(`${dir}/../run-${i}.agent.log`, transcript)
      } catch (e) {
        transcript = `${e.stdout ?? ''}\n${e.stderr ?? ''}`
        writeFileSync(`${dir}/../run-${i}.agent.log`, transcript)
        console.log(`  ${RED}run ${i}: the agent command failed${OFF}`)
        trace({ task: task.id, run: i, ok: false, why: 'agent-command', ms: Date.now() - started, cost: costOf(transcript), tail: transcript.slice(-1200) })
        runs.push({ score: 0, failed: ['agent-command'] })
        exitCode = 1
        continue
      }
      const files = readCandidate(dir)
      if (!Object.keys(files).length) {
        console.log(`  ${RED}run ${i}: the agent produced no .tsx/.css files in ${outDir}${OFF}`)
        trace({ task: task.id, run: i, ok: false, why: 'no-output', ms: Date.now() - started, cost: costOf(transcript), tail: transcript.slice(-1200) })
        runs.push({ score: 0, failed: ['no-output'] })
        exitCode = 1
        continue
      }
      const result = staticScore(files, { rubric: task.rubric, registry })
      const pipe = { ...(pipelineChecks(task, dir, files) ?? {}), ...(judgeChecks(task, files) ?? {}) }
      const pipeOrNull = Object.keys(pipe).length ? pipe : null
      const dyn = staticOnly ? null : dynamicChecks(task, files)
      const run = report(repeat > 1 ? `run ${i}` : 'agent', result, dyn, pipeOrNull)
      trace({
        task: task.id, run: i, ok: true, ms: Date.now() - started,
        /* What it cost, from the agent's own account. Null when the command was
         * not asked for one — `npm run cost` says so rather than averaging an
         * unmeasured run in as a free one. */
        cost: costOf(transcript),
        score: run.score, failed: run.failed,
        files: Object.keys(files),
        /* The findings, not just the dimension names: "props-exist failed" is a
         * label, "<Skeleton variant>" is a thing to fix. */
        findings: Object.fromEntries(
          Object.entries({ ...result.findings, ...(pipeOrNull ?? {}), ...(dyn ?? {}) }).filter(([, v]) => v.length),
        ),
      })
      runs.push(run)
      if (run.score < min) exitCode = 1
    }
    summary.push({ task: task.id, runs })
  }

  /* Spread, not just an average: agents are not deterministic, and a task that
   * passes twice and fails once is a different fact from one that scores 66%
   * every time. */
  if (repeat > 1) {
    console.log(`\n${BOLD}Summary${OFF} ${DIM}(${repeat} runs per task)${OFF}`)
    for (const { task, runs } of summary) {
      const scores = runs.map((r) => r.score)
      const mean = scores.reduce((a, b) => a + b, 0) / scores.length
      const perfect = scores.filter((s) => s === 1).length
      const dims = {}
      for (const r of runs) for (const d of r.failed) dims[d] = (dims[d] ?? 0) + 1
      const spread = scores.map((s) => `${(s * 100).toFixed(0)}%`).join(' ')
      console.log(`  ${task.padEnd(16)} mean ${(mean * 100).toFixed(0).padStart(3)}%  perfect ${perfect}/${runs.length}  ${DIM}${spread}${OFF}`)
      for (const [d, n] of Object.entries(dims).sort((a, b) => b[1] - a[1])) {
        console.log(`      ${RED}${d}${OFF} failed in ${n}/${runs.length} runs`)
      }
    }
    console.log('')
  }
} else if (candidateDir) {
  console.log(`${BOLD}Evals — candidate${OFF}\n`)
  for (const task of tasks) {
    const dir = `${candidateDir}/${task.id}`
    const from = existsSync(dir) ? dir : candidateDir
    const files = readCandidate(from)
    if (!Object.keys(files).length) continue
    console.log(`${BOLD}${task.id}${OFF} ${DIM}${task.rubric.title}${OFF}`)
    const result = staticScore(files, { rubric: task.rubric, registry })
    const pipeC = { ...(pipelineChecks(task, from, files) ?? {}), ...(judgeChecks(task, files) ?? {}) }
    const dyn = staticOnly ? null : dynamicChecks(task, files)
    const { score } = report(from.replace(ROOT + '/', ''), result, dyn, Object.keys(pipeC).length ? pipeC : null)
    if (score < min) exitCode = 1
  }
} else {
  /* Fixture mode: the harness checking itself. The reference solution must
   * score 100%, and the deliberately-wrong one must fail exactly the dimensions
   * its expect.json names — a scorer that stopped reporting would otherwise make
   * every future eval look green. */
  console.log(`${BOLD}Evals — fixtures (self-check of the scorers)${OFF}\n`)

  /* Every reference solution compiled and rendered in ONE pass.
   *
   * It used to be one `tsc --noEmit` over the whole project and one vitest boot
   * PER fixture: 3.0s and 1.1s each, measured, so twelve fixtures cost 55 seconds
   * of which about 49 were the same work done again. tsc checks the whole project
   * whatever you point it at, so twelve candidates cost what one costs. */
  const good = staticOnly
    ? {}
    : deepCheckMany({
        root: ROOT,
        candidates: tasks
          .filter((t) => existsSync(`${ROOT}/evals/fixtures/${t.id}/good`))
          .map((t) => ({
            id: t.id,
            files: readCandidate(`${ROOT}/evals/fixtures/${t.id}/good`),
            workDir: `${WORK}/${t.id}`,
            entry: t.rubric.entry ?? 'Screen.tsx',
          })),
      })

  for (const task of tasks) {
    console.log(`${BOLD}${task.id}${OFF} ${DIM}${task.rubric.title}${OFF}`)
    for (const kind of ['good', 'bad']) {
      const dir = `${ROOT}/evals/fixtures/${task.id}/${kind}`
      if (!existsSync(dir)) continue
      const files = readCandidate(dir)
      const result = staticScore(files, { rubric: task.rubric, registry })
      const pipeF = { ...(pipelineChecks(task, dir, files) ?? {}), ...(judgeChecks(task, files) ?? {}) }
      const pipeFOrNull = Object.keys(pipeF).length ? pipeF : null
      const dyn = staticOnly || kind === 'bad' ? null : (good[task.id] ?? null)
      const { score, failed } = report(kind, result, dyn, pipeFOrNull)

      if (kind === 'good' && score < 1) {
        console.log(`         ${RED}the reference solution must score 100%${OFF}`)
        exitCode = 1
      }
      if (kind === 'bad') {
        const expected = JSON.parse(readFileSync(`${dir}/expect.json`, 'utf8')).mustFail
        /* Judge the guard only over dimensions that RAN: acceptance-met exists
         * only under --judge, and a dim that never ran cannot have gone blind. */
        const evaluated = new Set([...DIMENSIONS, ...Object.keys(pipeFOrNull ?? {})])
        const blind = expected.filter((d) => evaluated.has(d) && !failed.includes(d))
        if (blind.length) {
          console.log(`         ${RED}scorer went blind on: ${blind.join(', ')}${OFF}`)
          exitCode = 1
        }
      }
    }
    console.log('')
  }
}

if (exitCode) console.error(`${RED}✗ evals failed${OFF}`)
else console.log(`${GREEN}✓ evals passed${OFF}`)
process.exit(exitCode)
