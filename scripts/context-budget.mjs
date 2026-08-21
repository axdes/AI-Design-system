/* Context budget — the cost side of the harness.
 *
 * Everything an agent must read before it may touch this UI is paid for on EVERY
 * task, by every agent, forever. That makes it a budget like bundle size, not a
 * free resource.
 *
 * 2026-08-13, the change that made this number small: the must-read set used to
 * be AGENTS.md + the WHOLE registry, 48k tokens, 82 components deep, to write a
 * screen out of four of them. Discovery now reads component-index.json (one line
 * per component) and pulls the detail it needs with `npm run registry -- <Name>`.
 * The full registry is still generated, still verified, still what the linters
 * read: it just stopped being context. Must-read went 48k -> about 11k, and the
 * marginal component now costs 30 tokens on every task instead of 460.
 *
 * That is only safe because the guardrails are deterministic. `npm run verify`
 * on every edit, the PostToolUse hook and gen-registry:check reject an invented
 * component or prop whether or not the agent was carrying the full registry. An
 * index buys discovery; the linter enforces the contract.
 *
 * This reports what the must-read context costs, where the weight sits, and
 * fails when it goes over budget.
 *
 * Token counts are an ESTIMATE (chars / 4, the usual rule of thumb for English
 * plus code). We do not ship a tokenizer for this: the number is a trend line
 * and a budget, not billing. Compare runs, do not quote it as exact.
 *
 * Run: npm run context
 */
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('..', import.meta.url)).replace(/\/$/, '')
const tokens = (text) => Math.ceil(text.length / 4)
const fmt = (n) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : `${n}`)

/* The must-read set, in the order an agent meets it. Keep this list honest: if
 * a file becomes required reading, it belongs here. */
const REQUIRED = [
  /* 6500 -> 7000 on 2026-07-26: the 67-component set added a dozen
   * "reach for X when you need Y" rows to the primitives table. Those rows ARE
   * the discovery value (an agent finds reuse here before the registry), so the
   * growth is the point, not bloat. Trim prose elsewhere before raising again. */
  /* 7000 -> 7300 across the two checklist.design passes on 2026-08-08. The
   * primitives table gained nine rows: TableScroll, the presence avatar, menu
   * sections, and the seven new components a screen would otherwise hand-roll
   * (clipboard, timestamp, password reveal, code entry, search highlighting,
   * load-more, carousel). Same argument as the 6500 -> 7000 note above, which is
   * why this file has a budget rather than a ban: an agent that finds the right
   * component HERE never writes the wrong thing, so a row that prevents a
   * hand-rolled clipboard call pays for itself on the first use.
   *
   * Paid for first, three times over: the layout file list went back to being
   * the filesystem's job, four Enforcement bullets lost their war stories and
   * their drifting component lists, and every added row was rewritten twice.
   * About 1.1k characters came out before 1.4k went in. The next raise needs a
   * bigger cut than that, and the honest one left is the table itself: it
   * duplicates a "reach for X when you need Y" line the registry already
   * carries, and the registry is read before any UI work regardless. */
  /* 7300 -> 6300 on 2026-08-13. The 70-row primitives table came out: it was a
   * "reach for X when you need Y" line per component, which is exactly what the
   * index row now carries, generated from the component's own JSDoc instead of
   * hand-maintained here. What stayed is the dozen pairs that get confused
   * (Tooltip vs Popover, Table vs DataGrid), which is guidance no single
   * component's description can carry. */
  /* 6300 -> 6360 on 2026-08-20 for the decision layer: one new MUST bullet in
   * the spec-first section (`archetype`, `primaryQuestion`, per-zone
   * `task`+`data`, enforced against selection-rules.json). Paid for first: the
   * bullet was cut from six lines to three before the raise, and the rules
   * themselves live in screen-specs/ as on-demand data, not here — the contract
   * carries one pointer, not the table. 6350 actual, so the ceiling sits 10
   * tokens above the file, not three kilobytes. */
  /* 6360 -> 6420 on 2026-08-20, second raise of the day and for the second
   * owner rule of the day: the no-subtitle DON'T (subtitle prop removed
   * system-wide). Paid for first: the bullet was compressed from four lines to
   * three before the raise. Two real rules in one day is why the ceiling moved
   * twice; a third raise needs a cut, not a note. */
  { path: 'AGENTS.md', why: 'the system contract, read every session', budget: 6420 },
  /* component-index.md, new on 2026-08-13 as JSON and text since 2026-08-16. One
   * line per component: name, level, surface, the parts of a compound, and one
   * sentence saying what it is for. 2.4k for all 82 components and 7 blocks,
   * against 41k for the registry it replaced in this list.
   *
   * Text rather than JSON because the only thing that reads it reads text: a row
   * spent eight of its thirty-six tokens on quotes, braces and keys. 26% off with
   * nothing dropped, and the runway went from eight more components to
   * forty-four. The tools do not read this file at all — the CLI and the MCP
   * server build the same rows from the registry, so there is one row builder
   * (scripts/lib/index-rows.mjs) and no second data structure to keep in step.
   *
   * When the budget does trip, the answer is not a shorter sentence: cutting the
   * cap to 80 characters elides half the rows mid-phrase, which is measured and
   * recorded in the generator. It is either a deliberate raise, or search becomes
   * the only path and this file stops being must-read. */
  { path: 'component-index.md', why: 'what exists, one line each — discovery reads this', budget: 3600 },
]

/* Read on demand, not on every task: `npm run registry -- <Name>` returns these
 * entries for the four or five components a screen actually uses. The file has a
 * ceiling anyway, because a registry that doubles makes every fetch twice as
 * expensive, and a per-entry ceiling, because that is the number an agent pays
 * when it asks. */
const ON_DEMAND = [
  /* 43000 -> 42000 on 2026-08-08, LOWERED while the system grew by fourteen
   * components and a dozen props, which is worth writing down.
   *
   * The first checklist.design pass pushed this over and took the ceiling to
   * 44000. Then the second pass looked at where the weight actually was, and it
   * was not the contract: `props` was the heaviest field in the file and most of
   * it was indentation, eight lines for what reads fine on one. The generator now
   * emits one line per prop and everything else stays indented, which took the
   * registry from 43.4k to 38.3k with no field removed and, if anything, a better
   * diff. Eight new components then brought it back to 41.0k.
   *
   * So the ceiling comes DOWN to 42000 rather than staying where the panic put
   * it. A budget parked three kilobytes above the file is not a budget. The next
   * component costs about 300 tokens and there is room for three; after that,
   * find the next thing that is formatting rather than contract.
   *
   * 2026-08-13: this stopped being must-read context and became a query target,
   * so the ceiling moves from "what fits in every prompt" to "what keeps a fetch
   * cheap". 60000 total, and 600 per entry — six components fetched for one
   * screen is then about 3k, which is the number that now matters. */
  {
    path: 'component-registry.json',
    why: 'the full contract, fetched per component',
    budget: 60000,
    /* 600 -> 620 on 2026-08-20 for WizardTemplate, the first entry that carries
     * a template plus two sub-components (WizardReview, WizardReviewRow) in one
     * contract. Paid for first: the entry was cut 680 -> 605 (two props removed
     * with an argued reason, the example dieted) before the ceiling moved 20.
     * Six worst-case fetches are now ~3.7k — the number this ceiling guards. */
    perEntry: 620,
  },
]

/* Raised 45k -> 48k on 2026-07-26 with the jump to 56 components (async, forms,
 * data/nav, disclosure, overlay all now covered). A conscious decision, not a
 * reflex: the coverage is worth ~3k more per task. This is the last free raise —
 * the next time it trips, TRIM the per-entry payload (drop `tokensUsed` from the
 * emitted registry, shorten examples) rather than lift the ceiling again. */
/* Raised 48k -> 49k on 2026-07-30 for `RenameDialog`, then 49k -> 50k on
 * 2026-07-31 for `AdaptiveListPage` and `<Field error>`.
 *
 * Both raises were paid for first. Before each one the per-entry payload was cut
 * as this report advises, by moving HISTORY out of the published descriptions
 * into ordinary comments: the registry is read by every agent on every task, so
 * it should carry the contract, not the reason the contract exists. Eight
 * entries were rewritten that way. The fourth round reached the point where the
 * only thing left to cut was contract, which is where trimming stops being a
 * saving and starts being a loss.
 *
 * What the extra kilobyte bought: a list-page shape that existed five times and
 * now exists once, and a field that can finally say WHY it rejected an input.
 * That is the trade this budget exists to make deliberately rather than by
 * accident. The registry is still inside its own 43k line; the total binds. */
/* 50k -> 51k and back to 50k on 2026-08-08: it went up with the registry line
 * and came down again once the props were re-emitted one per line. See the note
 * on component-registry.json above. The total is what actually binds. */
/* 50000 -> 11000 on 2026-08-13, because the registry left the must-read set and
 * the index took its place. This is not a saving anyone found by trimming prose:
 * it is the same information, served at the granularity the task needs. Treat
 * 11000 as the new hard line, and note that the old one funded four rounds of
 * argument about a single kilobyte. */
const TOTAL_BUDGET = 10000 // must-read context, tokens

let failed = 0
console.log('\x1b[1mContext budget (estimated tokens, chars/4)\x1b[0m\n')

let total = 0
for (const { path, why, budget } of REQUIRED) {
  const full = `${ROOT}/${path}`
  if (!existsSync(full)) {
    console.error(`  \x1b[31m✗\x1b[0m ${path} is missing`)
    failed++
    continue
  }
  const t = tokens(readFileSync(full, 'utf8'))
  total += t
  const ok = t <= budget
  if (!ok) failed++
  console.log(`  ${ok ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m'} ${path.padEnd(24)} ${fmt(t).padStart(7)} / ${fmt(budget)}   \x1b[2m${why}\x1b[0m`)
}

const totalOk = total <= TOTAL_BUDGET
if (!totalOk) failed++
console.log(`  ${totalOk ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m'} ${'total must-read'.padEnd(24)} ${fmt(total).padStart(7)} / ${fmt(TOTAL_BUDGET)}\n`)

console.log('  \x1b[2mon demand — npm run registry -- <Name>, not carried into every task\x1b[0m')
for (const { path, why, budget } of ON_DEMAND) {
  const full = `${ROOT}/${path}`
  if (!existsSync(full)) {
    console.error(`  \x1b[31m✗\x1b[0m ${path} is missing`)
    failed++
    continue
  }
  const t = tokens(readFileSync(full, 'utf8'))
  const ok = t <= budget
  if (!ok) failed++
  console.log(`  ${ok ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m'} ${path.padEnd(24)} ${fmt(t).padStart(7)} / ${fmt(budget)}   \x1b[2m${why}\x1b[0m`)
}
console.log('')

/* Where the registry weight actually sits. Per-entry cost is the number that
 * matters both when adding a component and when fetching one: it is the price of
 * one answer from `npm run registry`. */
const registryPath = `${ROOT}/component-registry.json`
if (existsSync(registryPath)) {
  const registry = JSON.parse(readFileSync(registryPath, 'utf8'))
  const entries = [
    ...Object.values(registry.components ?? {}),
    ...Object.values(registry.blocks ?? {}),
  ].map((e) => ({
    ref: e.ref,
    total: tokens(JSON.stringify(e)),
    example: tokens(e.example ?? ''),
    css: tokens(JSON.stringify(e.tokensUsed ?? [])),
  }))
  entries.sort((a, b) => b.total - a.total)
  const sum = entries.reduce((n, e) => n + e.total, 0)
  const avg = Math.round(sum / entries.length)
  const tokenCatalog = tokens(JSON.stringify(registry.tokens ?? []))

  const fileTokens = tokens(readFileSync(registryPath, 'utf8'))
  const overhead = fileTokens - sum - tokenCatalog

  console.log('  \x1b[2mregistry breakdown\x1b[0m')
  console.log(`    ${entries.length} entries, ${fmt(sum)} tokens (avg ${avg}/entry) + ${fmt(tokenCatalog)} for the token catalogue`)
  console.log(`    ${fmt(overhead)} tokens are JSON formatting (indentation, keys, punctuation)`)
  console.log('    \x1b[2mindented on purpose (committed, reviewed in diffs); props are one per line\x1b[0m')
  console.log('    heaviest entries:')
  for (const e of entries.slice(0, 6)) {
    console.log(`      ${String(e.total).padStart(5)}  ${e.ref.padEnd(22)} \x1b[2mexample ${e.example}, tokensUsed ${e.css}\x1b[0m`)
  }
  const perEntry = ON_DEMAND.find((o) => o.path === 'component-registry.json')?.perEntry
  const over = perEntry ? entries.filter((e) => e.total > perEntry) : []
  if (over.length) {
    failed++
    console.log(`\n    \x1b[31m✗ ${over.length} entr${over.length === 1 ? 'y is' : 'ies are'} over the ${perEntry}-token per-entry ceiling:\x1b[0m`)
    for (const e of over) console.log(`      ${String(e.total).padStart(5)}  ${e.ref}`)
    console.log(`    \x1b[2mThat is what an agent pays to look one of them up. Shorten the example or the prop descriptions.\x1b[0m`)
  }

  /* Two marginal costs now, and they are different by a factor of fifteen. The
   * index one is what a new component costs EVERY task; the registry one is what
   * it costs the tasks that actually use it. Splitting them is the whole point of
   * the index, so the report says both.
   *
   * And the RUNWAY, which is the number that turns a budget into a plan: at a
   * known price per row, how many more components fit before this trips? A
   * ceiling you meet on the day it goes red is a ceiling nobody planned for; one
   * that says "room for nine more" is a decision somebody can take a month
   * earlier, and the decision at the end of this runway is not a shorter sentence
   * (tried, and it elides half the rows mid-phrase) but asking the index instead
   * of reading it: `npm run registry -- --search`, or the MCP tool. */
  const indexPath = `${ROOT}/component-index.md`
  const indexBudget = REQUIRED.find((r) => r.path === 'component-index.md')?.budget
  if (existsSync(indexPath)) {
    const raw = readFileSync(indexPath, 'utf8')
    /* A row is a line with the ` · ` separator in it; everything above the first
     * one is the header, which is paid once however many components there are. */
    const rows = raw.split('\n').filter((l) => l.includes(' · '))
    const perRow = rows.reduce((n, l) => n + tokens(l) + 1, 0) / rows.length
    const idxAvg = Math.round(perRow)
    console.log(`\n    \x1b[2mMarginal cost of one more component: ${idxAvg} tokens on every task (its index row),\x1b[0m`)
    console.log(`    \x1b[2mplus about ${avg} tokens on the tasks that fetch it. Before the index it was ${avg} on every task.\x1b[0m`)
    if (indexBudget) {
      const room = Math.floor((indexBudget - tokens(raw)) / perRow)
      const colour = room <= 5 ? '\x1b[31m' : room <= 15 ? '\x1b[33m' : '\x1b[2m'
      console.log(`    ${colour}Runway: room for ${room} more component(s) before the index budget trips.\x1b[0m`)
      if (room <= 15) {
        console.log(`    \x1b[2mAt the end of it: raise the budget deliberately, or make search the primary path.\x1b[0m`)
      }
    }
  }
  console.log(`    \x1b[2mIf this gets tight, cut the per-entry payload (shorter examples, drop tokensUsed) before cutting components.\x1b[0m\n`)
}

if (failed) {
  console.error(`\x1b[31m✗ context over budget.\x1b[0m Either trim the payload, or raise the budget in scripts/context-budget.mjs with a reason.`)
  process.exit(1)
}
console.log('\x1b[32m✓ context within budget.\x1b[0m')
