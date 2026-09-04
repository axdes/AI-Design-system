#!/usr/bin/env node
/* The token layer, held to itself. Four rules, and none of them is style.
 *
 *   L1  a token nobody takes is deleted, exempted, or published on purpose
 *   L2  a tier only reaches the tier below it
 *   L3  dark redefines roles and invents no names
 *   L4  every stylesheet in styles/ enters through the layer entry
 *   L5  one question, one answer: how many different values answer each
 *       spacing question, against a ceiling that only falls
 *
 * L1 is the one that needed an argument, and the argument is about POPULATION.
 * Asked of this package alone it called 27 tokens dead on 2026-09-02 — and all
 * 27 were wrong in two different ways at once. Eighteen were STEPS OF A LADDER:
 * a palette, the type scale, the space scale are complete on purpose, a brand
 * replaces the whole ramp, and a hole in the steps is what a brand cannot fill.
 * Five were `--bp-*`, unreadable by construction because `@media` cannot read a
 * custom property, so the token stands beside the literal as its source. The
 * rest were taken by products three repositories away.
 *
 * The products are NOT what saves a token here, and that is the owner's rule
 * (2026-09-02): the system and its showcase are the source; an app that does
 * something of its own gets changed in the app. So the population is this
 * package plus apps/showcase, and the two exemptions above are the exemptions —
 * a ladder step and a value the platform cannot read, both derived rather than
 * listed, plus whatever config/token-exemptions.json publishes on purpose with
 * a reason.
 *
 * POPULATION: derived — every declaration in styles/, every reference in
 * styles/, src/, visual/ and apps/showcase/src.
 *
 *   npm run lint:token-layer
 */
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join, relative, basename } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = process.env.DS_LINT_ROOT ?? fileURLToPath(new URL('..', import.meta.url)).replace(/\/$/, '')
const RESET = '\x1b[0m', RED = '\x1b[31m', GREEN = '\x1b[32m', DIM = '\x1b[2m', BOLD = '\x1b[1m'

const walk = (dir, out = []) => {
  if (!existsSync(dir)) return out
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry)
    if (statSync(path).isDirectory()) { if (!/node_modules|dist|\.diff/.test(path)) walk(path, out) }
    else if (entry.endsWith('.css')) out.push(path)
  }
  return out
}
const read = (f) => readFileSync(f, 'utf8')
const strip = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '')

const STYLES = join(ROOT, 'styles')
/* The showcase is the system describing itself, and the owner's rule makes it
 * part of the source rather than a consumer. Everything else in apps/ is a
 * product: it may take a token, and taking it is not a reason to keep it. */
const SHOWCASE = join(ROOT, '../../apps/showcase/src')
const consumers = [...walk(join(ROOT, 'src')), ...walk(join(ROOT, 'visual')), ...walk(SHOWCASE)]
const layerFiles = walk(STYLES)

const declaredIn = new Map()   // token -> file that declares it first
const declaredBy = new Map()   // file -> Set(tokens)
const referenced = new Map()   // token -> Set(files)

const collect = (files, isLayer) => {
  for (const f of files) {
    const css = strip(read(f))
    if (isLayer) {
      const own = new Set()
      for (const m of css.matchAll(/(--[a-zA-Z0-9-]+)\s*:/g)) { own.add(m[1]); if (!declaredIn.has(m[1])) declaredIn.set(m[1], f) }
      declaredBy.set(f, own)
    }
    for (const m of css.matchAll(/var\(\s*(--[a-zA-Z0-9-]+)/g)) {
      if (!referenced.has(m[1])) referenced.set(m[1], new Set())
      referenced.get(m[1]).add(f)
    }
  }
}
collect(layerFiles, true)
collect(consumers, false)

const exemptions = existsSync(`${ROOT}/config/token-exemptions.json`)
  ? JSON.parse(read(`${ROOT}/config/token-exemptions.json`))
  : { unreadable: {}, published: {} }

/* A LADDER STEP IS NEVER DEAD.
 *
 * `--brand-800` is not a token somebody forgot to use, it is the eighth rung of
 * a ramp that exists so a brand can replace the ramp. The test is structural:
 * the name ends in a scale step, its family declares three or more of them, and
 * somebody takes at least one. A lone `--sidebar-width-collapsed` passes none of
 * that, which is exactly the difference. */
const STEP = /^(--[a-z][a-z0-9]*(?:-[a-z][a-z0-9]*)*?)-(\d{1,4}|\d?x{0,2}s|\d?x{0,2}l|xs|sm|md|lg|xl|\d+xl|full|none)$/
const family = (name) => STEP.exec(name)?.[1] ?? null
const familySize = new Map()
const familyTaken = new Map()
for (const name of declaredIn.keys()) {
  const fam = family(name)
  if (!fam) continue
  familySize.set(fam, (familySize.get(fam) ?? 0) + 1)
  if (referenced.has(name)) familyTaken.set(fam, (familyTaken.get(fam) ?? 0) + 1)
}
const isLadderStep = (name) => {
  const fam = family(name)
  return !!fam && (familySize.get(fam) ?? 0) >= 3 && (familyTaken.get(fam) ?? 0) >= 1
}

const problems = []
const say = (rule, where, msg, fix) => problems.push({ rule, where, msg, fix })

/* ── L1 ─────────────────────────────────────────────────────────────────── */
const dead = []
for (const [name, file] of declaredIn) {
  if (referenced.has(name)) continue
  if (isLadderStep(name)) continue
  if (exemptions.unreadable?.[name] || exemptions.published?.[name]) continue
  dead.push({ name, file })
}
for (const { name, file } of dead) {
  say('L1', `${relative(ROOT, file)} · ${name}`, 'is declared and nobody takes it',
    'a scale that offers a step nobody takes is a choice an agent has to make and cannot make well. Delete it, or write it into config/token-exemptions.json with the reason — unreadable by construction, or published outward on purpose. A product using it is NOT a reason: the product gets changed.')
}

/* ── L2 ─────────────────────────────────────────────────────────────────── */
/* SETTINGS IS TWO FILES IN ONE, and the rule has to know it. The top of it is
 * raw knobs — the grid unit, the brand hex — which primitives are computed
 * from. The bottom is FAMILY KNOBS: `--control-radius: var(--radius-full)`,
 * `--card-padding: var(--space-6)`. Those select a step from a scale, so they
 * read downwards from a tier above, in the same file. Splitting the file would
 * make the tiers tidy and the brand surface worse: a person retunes one file.
 * So settings may reach anything and this rule is deliberately silent there;
 * what it holds is the pair that actually costs: a primitive reaching a role
 * (a rebrand stops being one file) and a recipe reaching a raw value (the
 * recipe stops being an answer and becomes an ingredient again). */
const TIER = { 'settings.css': 1, 'primitives.css': 2, 'semantic.css': 3, 'recipes.css': 4 }
const REACHES = { 1: [1, 2, 3, 4], 2: [1, 2], 3: [1, 2, 3], 4: [1, 3, 4] }
const tierOf = (name) => {
  const file = declaredIn.get(name)
  return file ? TIER[basename(file)] ?? null : null
}
for (const f of layerFiles) {
  const tier = TIER[basename(f)]
  if (!tier) continue
  for (const m of strip(read(f)).matchAll(/var\(\s*(--[a-zA-Z0-9-]+)/g)) {
    const reached = tierOf(m[1])
    if (reached === null || REACHES[tier].includes(reached)) continue
    say('L2', `${relative(ROOT, f)} · ${m[1]}`, `is tier ${reached}, and tier ${tier} may not reach it`,
      'the tiers only look downwards. A recipe is written in roles and knobs; a role is written in primitives; a primitive is a value or a knob. Anything else and a rebrand stops being one file.')
  }
}

/* ── L3 ─────────────────────────────────────────────────────────────────── */
/* A role invented inside the dark block exists in one theme only: the light one
 * renders it as nothing, silently, because a missing custom property is not an
 * error anywhere in CSS. */
for (const f of layerFiles) {
  const css = strip(read(f))
  const dark = [...css.matchAll(/(?:\[data-theme=['"]dark['"]\]|prefers-color-scheme:\s*dark)[^{]*\{([\s\S]*?)\n\s*\}/g)]
  if (!dark.length) continue
  const light = new Set()
  for (const m of css.matchAll(/(--[a-zA-Z0-9-]+)\s*:/g)) light.add(m[1])
  for (const block of dark) {
    for (const m of block[1].matchAll(/(--[a-zA-Z0-9-]+)\s*:/g)) {
      /* Declared ONLY inside a dark block: count how many times the name is
         declared in the file at all, and whether any of those sit outside. */
      const all = [...css.matchAll(new RegExp(`${m[1]}\\s*:`, 'g'))].length
      const inDark = dark.reduce((n, b) => n + [...b[1].matchAll(new RegExp(`${m[1]}\\s*:`, 'g'))].length, 0)
      if (all === inDark && light.has(m[1])) {
        say('L3', `${relative(ROOT, f)} · ${m[1]}`, 'is invented in the dark theme and never declared in the light one',
          'dark REDEFINES roles and adds no names. A token that exists only in dark resolves to nothing in light, and CSS reports that as nothing at all.')
      }
    }
  }
}

/* ── L4 ─────────────────────────────────────────────────────────────────── */
const entry = join(STYLES, 'index.css')
if (existsSync(entry)) {
  const imported = new Set([...read(entry).matchAll(/@import\s+["']\.\/([a-z-]+\.css)["']/g)].map((m) => m[1]))
  imported.add('index.css')
  for (const f of layerFiles) {
    const name = basename(f)
    if (imported.has(name) || f.includes('/brands/')) continue
    say('L4', relative(ROOT, f), 'is in styles/ and nothing imports it',
      'a stylesheet nobody imports is either dead or is being pulled in by a path that does not carry the layer. styles/index.css is the one door.')
  }
}

/* ── L5 ─────────────────────────────────────────────────────────────────── */

/* ONE QUESTION, ONE ANSWER.
 *
 * "How many tokens does this product use" is a weak measure: a large product
 * legitimately uses more. The number of different values answering ONE question
 * is not size-dependent, and it is the number a reader feels — two cards a
 * different distance apart is not a token count, it is two answers to "how far
 * apart are two things".
 *
 * Measured 2026-09-02 over the component stylesheets: 16 answers to the gap
 * question, 60 to surface padding, 15 to the space above a section. Held to a
 * ceiling rather than a target, because the right number is not 1 — a dense
 * table and a marketing hero are different questions wearing one property — and
 * nobody can say today what it is. What can be said is that it may not grow. */
const QUESTIONS = {
  'how far apart are two things': /^(gap|row-gap|column-gap)$/,
  'how far is a section from what is above it': /^margin-block-start$/,
}

/* THE SURFACE QUESTION IS ASKED OF SURFACES, and which rules those are is
 * derived rather than listed: a surface is a rule that PAINTS one — a
 * background of a surface role — and gives its content room. Counting every
 * padding in the package instead made the number 57 and useless, because a
 * chip's inline padding and a card's room are not the same question wearing one
 * property. A list of selector words would have been the other mistake: a list
 * cannot know what is missing from it. (2026-09-03) */
const PAINTS_SURFACE = /background(?:-color)?\s*:\s*(?:var\(--(?:card|surface|background|popover|muted)\)|light-dark\()/
const SURFACE_PAD = /(?:^|;|\s)padding(?:-block|-inline)?\s*:\s*([^;]+)/
/* A DISTANCE, NOT A SPELLING.
 *
 * The first version of this counted the value as written, so `var(--space-4)`
 * and `var(--popover-padding)` were two answers to one question while resolving
 * to the same 16px — and naming a family knob, which is the FIX, made the number
 * go up. A reader feels distances; the count has to be of those. Every value is
 * resolved through the token layer before it is counted, and what cannot be
 * resolved (a calc, a clamp, a percentage) stands for itself. (2026-09-03) */
const values = new Map()
for (const f of layerFiles) {
  for (const m of strip(read(f)).matchAll(/(--[a-zA-Z0-9-]+)\s*:\s*([^;]+);/g)) {
    if (!values.has(m[1])) values.set(m[1], m[2].trim())
  }
}
const resolve = (value, depth = 0) => {
  if (depth > 8) return value
  const next = String(value).replace(/var\(\s*(--[a-zA-Z0-9-]+)\s*(?:,[^)]*)?\)/g, (whole, name) =>
    values.has(name) ? values.get(name) : whole)
  return next === String(value) ? next.replace(/\s+/g, ' ').trim() : resolve(next, depth + 1)
}

/* ONE DECLARATION CAN BE TWO DISTANCES, AND THEY ARE NOT NEW ONES.
 *
 * `gap: var(--space-1) var(--space-3)` is a row gap and a column gap: two
 * answers, both of which the ladder already gives. Counting the PAIR as its own
 * answer inflated the number by six on the gap question alone and by four on the
 * surface one — and worse, it made the honest thing (saying both distances in one
 * declaration) look like drift. Split on the spaces that are outside brackets.
 *
 * And a negative distance has three spellings — `calc(-1 * X)`, `calc(X * -1)`,
 * `calc(X / -2)` is its own thing — that resolve to one number. The first two are
 * folded; anything else stands for itself, because a check that guesses at
 * arithmetic is worse than one that over-counts. (2026-09-04) */
const splitOutsideBrackets = (value) => {
  const out = []
  let depth = 0, cur = ''
  for (const c of String(value)) {
    if (c === '(') depth++
    if (c === ')') depth--
    if (c === ' ' && depth === 0) { if (cur.trim()) out.push(cur.trim()); cur = ''; continue }
    cur += c
  }
  if (cur.trim()) out.push(cur.trim())
  return out.length ? out : [String(value).trim()]
}
const negation = (v) => {
  const a = /^calc\(\s*-1\s*\*\s*(.+?)\s*\)$/.exec(v)
  const b = /^calc\(\s*(.+?)\s*\*\s*-1\s*\)$/.exec(v)
  const inner = a?.[1] ?? b?.[1]
  return inner ? `-(${inner})` : v
}
const distancesOf = (value) => splitOutsideBrackets(resolve(value)).map(negation)

const SURFACE_QUESTION = 'how much room does a painted surface give its content'
const answers = Object.fromEntries([...Object.keys(QUESTIONS), SURFACE_QUESTION].map((q) => [q, new Set()]))
for (const f of walk(join(ROOT, 'src'))) {
  const css = strip(read(f))
  for (const m of css.matchAll(/([a-z-]+)\s*:\s*([^;{}]+);/g)) {
    for (const [question, re] of Object.entries(QUESTIONS)) {
      if (re.test(m[1])) for (const d of distancesOf(m[2].trim())) answers[question].add(d)
    }
  }
  for (const rule of css.matchAll(/(?:^|\})([^{}]+)\{([^{}]*)\}/g)) {
    const selector = rule[1].trim()
    if (!selector || selector.startsWith('@')) continue
    const pad = SURFACE_PAD.exec(rule[2])
    if (pad && PAINTS_SURFACE.test(rule[2])) for (const d of distancesOf(pad[1].trim())) answers[SURFACE_QUESTION].add(d)
  }
}
/* `--show` prints the answers themselves. The count says whether the number
 * moved; paying it down needs to know WHICH distances are answering, and reading
 * them out of a red run means breaking something first. (2026-09-04) */
if (process.argv.includes('--show')) {
  for (const [question, set] of Object.entries(answers)) {
    console.log(`\n  ${question} — ${set.size}`)
    console.log(`    ${[...set].sort().join('  ')}`)
  }
  console.log()
}

const CEILING = `${ROOT}/config/token-answers.json`
const ceiling = existsSync(CEILING) ? JSON.parse(read(CEILING)).answers ?? {} : null
if (process.argv.includes('--record')) {
  const next = Object.fromEntries(Object.entries(answers).map(([q, set]) => [q, set.size]))
  writeFileSync(CEILING, `${JSON.stringify({
    _why: 'How many different values answer one spacing question, recorded by npm run lint:token-layer -- --record. A ceiling that only falls: the right number is not 1 (a dense table and a hero are different questions wearing one property), but a question that gains an answer has gained drift somebody has to read.',
    recorded: new Date().toISOString().slice(0, 10),
    answers: next,
  }, null, 2)}\n`)
  console.log(`recorded: ${Object.entries(next).map(([q, n]) => `${n} answers to "${q}"`).join(', ')}`)
  process.exit(0)
}
for (const [question, set] of Object.entries(answers)) {
  const held = ceiling?.[question]
  if (held === undefined) continue
  if (set.size > held) {
    say('L5', question, `now has ${set.size} different answers, up from ${held}`,
      'one question, one answer — or at least not one more. Reach for the value the question already has, or take the whole question down: a new answer here is a distance a reader can see and nobody decided.')
  }
}

/* ── the report ─────────────────────────────────────────────────────────── */
const exempt = [...declaredIn.keys()].filter((n) => !referenced.has(n) && (isLadderStep(n) || exemptions.unreadable?.[n] || exemptions.published?.[n]))
console.log(
  `${BOLD}Token layer${RESET} ${DIM}${declaredIn.size} declared across ${layerFiles.length} stylesheet(s), ` +
    `${[...declaredIn.keys()].filter((n) => referenced.has(n)).length} taken, ${exempt.length} untaken and exempt ` +
    `(ladder steps and what the platform cannot read)${RESET}\n`,
)
if (!problems.length) {
  const spread = Object.entries(answers).map(([q, set]) => `${set.size} to "${q.split(' ').slice(0, 4).join(' ')}…"`).join(', ')
  console.log(`${GREEN}✓${RESET} nothing dead, every tier looks downwards, dark invents no names, every sheet enters through the layer.`)
  console.log(`  ${DIM}answers per question: ${spread}${RESET}`)
  process.exit(0)
}
const byRule = new Map()
for (const p of problems) { if (!byRule.has(p.rule)) byRule.set(p.rule, []); byRule.get(p.rule).push(p) }
const TITLE = { L1: 'a token nobody takes', L2: 'a tier reaching upwards', L3: 'a name invented in the dark', L4: 'a sheet outside the layer', L5: 'a question that gained an answer' }
console.error(`${RED}${problems.length} finding(s)${RESET}\n`)
for (const [rule, list] of [...byRule].sort()) {
  console.error(`${BOLD}${rule}${RESET} ${TITLE[rule]} ${DIM}(${list.length})${RESET}`)
  for (const p of list) console.error(`  ${RED}${p.where}${RESET}  ${p.msg}\n      ${p.fix}\n`)
}
process.exit(1)
