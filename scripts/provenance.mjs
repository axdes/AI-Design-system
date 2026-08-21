#!/usr/bin/env node
/* Who wrote this, and with what.
 *
 * The one question this repository could not answer. Every check here says
 * whether the code is right; none of them says where it came from. For a client
 * in a regulated industry that is the question that gets asked first, and
 * "somebody, at some point, possibly with an AI" is not an answer anyone can
 * file. The Dark Factory diagrams put an evidence layer under the whole SDLC for
 * exactly this reason.
 *
 * The data is already here and was already free: a commit made with an agent
 * carries a `Co-Authored-By:` trailer naming the model. This reads it back.
 *
 *   npm run provenance                    the shape of the repository
 *   npm run provenance -- src/components  the same, for one path
 *   npm run provenance -- --file <path>   who last touched one file, and with what
 *   npm run provenance -- --since 2026-07-01
 *
 * It is a report, not a gate. A rule that every commit must name its model can
 * only be true going forward, and a check that fails on history teaches people
 * to pass --no-verify. What makes this real is that the trailer is written by
 * the tool on every agent commit, so the record accumulates whether or not
 * anyone reads it.
 */
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../../..', import.meta.url)).replace(/\/$/, '')
const B = '\x1b[1m', DIM = '\x1b[2m', GREEN = '\x1b[32m', YEL = '\x1b[33m', OFF = '\x1b[0m'

const argv = process.argv.slice(2)
const valueOf = (name) => {
  const i = argv.indexOf(`--${name}`)
  return i === -1 ? null : argv[i + 1]
}
const file = valueOf('file')
const since = valueOf('since')
const paths = argv.filter((a, i) => !a.startsWith('--') && argv[i - 1] !== '--file' && argv[i - 1] !== '--since')

const git = (args) => {
  try {
    return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
  } catch {
    return ''
  }
}

/* A model, not a person. The trailer is written by the agent that made the
 * commit, so this is the closest thing to machine authorship there is. */
const MODEL = /Co-Authored-By:\s*([^<]+?)\s*</i

const SEP = ''
const log = git([
  'log',
  `--format=${SEP}%H%n%an%n%ad%n%s%n%b${SEP}`,
  '--date=short',
  '--name-only',
  ...(since ? [`--since=${since}`] : []),
  ...(file ? ['-1', '--', file] : paths.length ? ['--', ...paths] : []),
])

const commits = log
  .split(SEP)
  .map((chunk) => chunk.trim())
  .filter(Boolean)
  .map((chunk, i, arr) => ({ chunk, files: (arr[i + 1] ?? '').split('\n').filter(Boolean) }))
  .filter((_, i) => i % 2 === 0)
  .map(({ chunk, files }) => {
    const [hash, author, date, subject, ...body] = chunk.split('\n')
    const model = MODEL.exec(body.join('\n'))?.[1]?.trim() ?? null
    return { hash, author, date, subject, model, files }
  })

if (!commits.length) {
  console.log(`${DIM}No commits recorded for that selection.${OFF}`)
  process.exit(0)
}

if (file) {
  const c = commits[0]
  console.log(`\n${B}${file}${OFF}\n`)
  console.log(`  last changed  ${c.date}  ${DIM}${c.hash.slice(0, 7)}${OFF}`)
  console.log(`  by            ${c.author}`)
  console.log(`  with          ${c.model ? `${GREEN}${c.model}${OFF}` : `${YEL}no model recorded${OFF}`}`)
  console.log(`  in            ${c.subject}\n`)
  console.log(`  ${DIM}The full history of this file: git log --follow -- ${file}${OFF}\n`)
  process.exit(0)
}

const withModel = commits.filter((c) => c.model)
const models = new Map()
for (const c of withModel) models.set(c.model, (models.get(c.model) ?? 0) + 1)

const touched = new Map()
for (const c of commits) {
  for (const f of c.files) {
    const area = f.split('/').slice(0, 2).join('/')
    const a = touched.get(area) ?? { total: 0, machine: 0 }
    a.total++
    if (c.model) a.machine++
    touched.set(area, a)
  }
}

const pct = (n, of) => (of ? `${((n / of) * 100).toFixed(0)}%` : '—')

console.log(`\n${B}Provenance${OFF} ${DIM}${commits.length} commit(s)${since ? ` since ${since}` : ''}${paths.length ? ` under ${paths.join(', ')}` : ''}${OFF}\n`)
console.log(`  machine-assisted   ${pct(withModel.length, commits.length)}  ${DIM}${withModel.length}/${commits.length} name a model in the commit${OFF}`)
for (const [model, n] of [...models].sort((a, b) => b[1] - a[1])) {
  console.log(`      ${model.padEnd(34)} ${String(n).padStart(4)} commit(s)`)
}

console.log(`\n${B}By area${OFF} ${DIM}file touches, and how many were machine-assisted${OFF}\n`)
for (const [area, a] of [...touched].sort((x, y) => y[1].total - x[1].total).slice(0, 12)) {
  console.log(`  ${area.padEnd(34)} ${String(a.total).padStart(5)}  ${pct(a.machine, a.total).padStart(4)} machine`)
}

const unattributed = commits.filter((c) => !c.model && /claude|agent|codex|cursor/i.test(c.subject))
if (unattributed.length) {
  console.log(`\n  ${YEL}${unattributed.length} commit(s) read as machine work and name no model${OFF}`)
  for (const c of unattributed.slice(0, 5)) console.log(`      ${c.hash.slice(0, 7)} ${c.subject}`)
}

console.log(`\n  ${DIM}One file: npm run provenance -- --file <path>${OFF}`)
console.log(`  ${DIM}The trailer is written on every agent commit, so this record grows by itself.${OFF}\n`)
