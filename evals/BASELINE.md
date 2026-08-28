# Baseline runs

Measured results, kept so a later change can be compared against something real
instead of a memory. Add rows when you run the evals; do not rewrite old ones.

Conditions matter more than the number: same task, same model, different amount
of system context is the comparison that says whether the harness does anything.

## Reference

| Date | Task | What | Score |
|---|---|---|---|
| 2026-07-24 | all three | reference solutions in `fixtures/good`, written by hand against the registry | 100% |

## Agent runs — Claude Code (`claude -p`), Opus 5, 2026-08-14

The first full measurement of the index harness: 12 tasks, 3 runs each, 36 runs,
`cwd` = the repo root, discovery through `component-index.json` (3.3k tokens)
instead of the whole registry (41k).

| | |
|---|---|
| mean score across tasks | **93%** |
| perfect runs | **21/36 (58%)** — against 44% over all 173 runs ever recorded |
| runs that produced no file | **0** — it used to be 17 of 173 |
| cycle time | 103s median, 1246s slowest |
| defect escape rate | 19% — passed every self-checkable dimension and still did not compile or render |

Per task: `data-table`, `form-modal`, `list-screen`, `record-panel`,
`wizard-form` 100/100/100. `file-explorer` and `states-screen` 96. `settings-panel`
92. `action-toolbar`, `detail-screen`, `search-select` 88. `async-form` 71.

### What the failures actually were

The same lesson as the 3x3 matrix above, three years of harness maturity later:
**four of the five failure classes were defects in the harness, not in the work.**

1. **The import specifier was never published.** Three runs out of three on
   `async-form` wrote `@ds/components/Card` inside the design system, where the
   alias is `@/components/Card`, and did not compile. The registry knew the path
   and did not say it; the golden examples import `./Card` because they are
   co-located, which is the most misleading signal available. Entries now carry
   `from`, and `npm run registry` and the MCP `component` tool print both forms.
2. **Numeric unions were invisible.** `type Gap = 1 | 2 | 3 | 4 | 6 | 8 | 12 | 16`
   published as `gap: Gap` with no values, because the union reader accepted
   string literals only. An agent wrote `gap={5}`, which is not a step on the
   scale, and TypeScript was the first thing to notice. The reader takes numeric
   unions now, so `props-exist` catches it in a tenth of a second instead.
3. **A task that punished the right answer.** `detail-screen` demanded
   `<MetaItem>`; all three runs used `<Descriptions>`, which is exactly what the
   registry says Descriptions is for. Rubrics can now name a CHOICE
   (`["MetaItem", "Descriptions"]`), because an eval that fails a defensible
   answer teaches nobody anything.
4. **A task that did not say what it meant.** `action-toolbar` asked for filters
   that "switch on and off" with "the chosen one" reading as chosen, and three
   runs read that as one-of-three and used `<SegmentedControl>`. The task says
   "any number of them can be on at once" now, and the contract gained the pair
   (`Chip` toggles independently, `SegmentedControl` picks one).
5. **Two pairs the contract never disambiguated.** `Select` vs `FilterDropdown`
   above a list, and the Chip/SegmentedControl pair above. Both are now in
   "Choosing between neighbours".

### After the fixes

Same model, same day, 2 runs each on the four tasks the fixes target:

| Task | Before | After |
|---|---|---|
| async-form | 71% | **100%** (2/2) |
| action-toolbar | 88% | **100%** (2/2) |
| detail-screen | 88% | **100%** (2/2) |
| list-screen | 100%, but failed `required-used` in the drift run | **100%** (2/2) |

`search-select`, `settings-panel` and `states-screen` still lose points, and the
remaining failures are all of one kind: the agent did not fetch the component
entry before writing it. `gap="lg"` and `@ds/components/Layout` are both facts
the registry publishes and `npm run verify` reports in a tenth of a second. That
is the trade the index makes — discovery is cheap, detail is one call away, and
an agent that skips the call guesses. What changed is that the guess is now
caught by the fast check instead of by `tsc` two minutes later.

## Contract cut — same eight tasks, 2026-08-28

`AGENTS.md` went from 514 lines to 312 (7.1k tokens to 4.3k) by moving six
reference sections to `docs/contract/`, named in a table the contract still
carries. The question a cut like that has to answer is whether the agent got
worse, and the only way to know is to run the same measurement again.

| | Before the cut | After |
|---|---|---|
| mean over eight tasks | 100% | **100%** |
| perfect runs | 8/8 | **8/8** |

Nothing moved. Read that as "the six sections were not load-bearing for these
eight tasks", not as "the contract can be cut in half again for free": these
tasks build screens from existing parts, and the sections that left were about
diagnosing the gate, the file map, and choosing between neighbours. A task that
needed those would fetch them by path — which is the arrangement, and is not
what this measured.

## 2026-08-28 — the first run this harness ever priced

Every measurement above is about how WELL an agent does here. None of them says
what it cost, and that is a hole in the argument the whole design rests on:
discovery reads a 4.1k index instead of a 100k registry SO THAT a task is cheap,
`npm run context` guards the input side of that with a chars/4 estimate, and
nothing has ever counted what actually got spent.

The runner now reads the agent's own account of it out of the transcript
(`scripts/lib/agent-cost.mjs`, from `--output-format json`) and writes it into
the trace. `npm run cost` reports it. One task, one run, `list-screen`, Opus 5,
`cwd` = repo root — scored 100% on all eight dimensions, as it has since 27.08:

| | |
|---|---|
| tokens | **4,350k** |
| cost | **$3.45** |
| wall clock | **256s** |
| of which output | 16.6k, under 0.4% |
| re-read from cache | **98%** |

Two things in that table are worth more than the headline.

**Output is a rounding error.** 16.6k tokens of the 4,350k are the thing the
agent actually wrote. Everything else is reading — the contract, the index, the
entries it fetched, its own accumulated turns — which means the cost of working
in this system is almost entirely the cost of the context it hands out.

**98% is cache re-reads**, and that is what makes the context budget a real
budget rather than housekeeping. The must-read set is not paid once per task. It
is paid once and then re-read on every turn of that task, so a contract that
grows by 1k tokens costs a multiple of 1k, set by how many turns the task takes.
The budget in `scripts/context-budget.mjs` has said "this is paid on EVERY task,
by every agent, forever" since August; this is the first evidence of the
multiplier on top.

Read it with its limits, and they are large. One task, one run, one model, one
day. The number to watch is not $3.45 — it is whether a change to the contract
moves it, which is the comparison this makes possible for the first time. Every
trace written before today carries no cost and never will: nothing reconstructs
it after the fact, and `npm run cost` counts those runs separately rather than
averaging them in as free.

## Agent runs — Claude Code (`claude -p`), Opus 5, 2026-08-27

Re-measured the day after the registry started publishing prop descriptions
(463 of 782, having published none since the generator was written) and the
contract gained the heading-outline rule. Eight tasks, one run each, `cwd` = the
repo root.

| | |
|---|---|
| mean score | **100%** |
| perfect runs | **8/8** |
| runs that produced no file | 0 |

`list-screen`, `form-modal`, `data-table`, `detail-screen`, `settings-panel`,
`async-form`, `search-select`, `states-screen` — all 100.

The three that moved are the ones worth reading. `detail-screen` was 88 the day
before and failed `renders` on an axe `heading-order`; the contract now states
the outline rule and `SectionLabel` publishes the `as` prop that decides it.
`search-select` was 88 on 2026-08-14 and `settings-panel` 92, and both were lost
to the same thing every time: the agent did not fetch the component entry before
writing it, so it guessed at a prop. The entry it would have fetched now says
what each prop MEANS, not only that it exists.

Read it with its limits. Eight tasks is not twelve, one run each is not three,
and a ceiling tells you less than a middle — the next honest measurement of this
harness needs harder tasks, not another pass at these.

## Agent runs — Claude Code (`claude -p`), Opus 5, 2026-08-26

Re-measured because the number above was twelve days old and the system had
gained four decision layers and about thirty parts since. Six tasks, one run
each, `cwd` = the repo root.

| | |
|---|---|
| mean score | **98%** (5 tasks at 100, one at 88) |
| perfect runs | 5/6 |
| runs that produced no file | 0 |

`list-screen`, `form-modal`, `data-table`, `settings-panel`, `async-form` 100.
`detail-screen` 88 — the only loss, and not a design-system one on its face:
`renders` failed on an axe `heading-order`, an outline that skips a level.

Read it against the 12-task run above rather than as a replacement: six tasks is
not twelve, and the four hardest-scoring tasks of that run (`search-select`,
`states-screen`, `action-toolbar`, `detail-screen`) are exactly the ones this
subset mostly leaves out.

### What the one failure was worth

Chasing it found the defect underneath. `SectionLabel` — the part that names a
section, and the one that decides whether that section is a heading at all —
published `props: []`. Its `as` prop was typed as an INTERSECTION in the
signature (`HTMLAttributes<HTMLElement> & { as?: Heading }`), and the generator's
two fallbacks each miss that shape: one needs `}: {`, the other needs the type to
end the parameter list. So the contract an agent reads said the component takes
nothing, the agent left the default (`div`), and the section never entered the
outline.

Fixed at the root — the main export now falls back to the same signature reader
the PARTS already used, which handles intersections — and guarded: a main export
that destructures named parameters while publishing no props is now an error in
the generator, because that is the shape the failure took and nothing said a
word about it for three days.

## Drift — one session, 12 turns, 2026-08-14

`npm run eval:drift`, Opus 5, session pinned by id, every task also run in a
fresh session as a control.

**Zero drift.** Every one of the twelve turns scored exactly what its fresh
control scored: 83/100/100/83/83/100/83/100/100/100/100/100 in the session,
identical in the control, difference +0 on every turn. First third against last
third: 0 points.

The failure this whole guardrail layer is paid for — the model forgetting the
system by turn ten — did not reproduce at twelve turns. Read it with its limits:
twelve turns is not forty, the scoring here is static (no compile or render),
and Claude Code re-injects the contract on every turn of a resumed session,
which is very likely the reason. It is still the first number anybody here has
had for the question, and it says the linters are currently insurance rather
than a live rescue.

## Agent runs — Claude Code (`claude -p`), Opus 4.8

| Date | Task | Conditions | Score |
|---|---|---|---|
| 2026-07-24 | list-screen | cwd = scratch work dir: the sandbox hid `CLAUDE.md`, the registry and `src/` | **71%** (5/7 dimensions of the time) |
| 2026-07-24 | list-screen | cwd = repo root, full system context | **100%** (8/8) |
| 2026-07-24 | 3 tasks x 3 runs | cwd = repo root, full system context | see below |

### The 3x3 matrix

As first reported: `list-screen` 100/100/100, `form-modal` 88/88/88,
`detail-screen` 88/75/75.

Every one of those deductions turned out to be a defect **in the harness or in
the design system**, not in the agent's work:

1. **The scorer read comments as code.** A file that documents itself with
   "`<DetailPageTemplate>` is rendered as-is" made the tag reader treat every
   following word as an invented prop. That single bug produced the identical
   `props-exist` failure in six of nine runs. Fixed by stripping comments before
   reading (`stripComments` in `scorers.mjs`); the JSX-reader tests cover it.
2. **`DetailPageTemplate.title` was typed `string`** while the `PageHeader` it
   wraps takes a `ReactNode`. Two runs tried to put the status chip beside the
   title, which is what the task asks for, and did not compile. The block's type
   was the thing that was wrong; it is a `ReactNode` now.
3. **`backLabel` had no way through the block.** One run passed it to name the
   back control. `PageHeader` supports it, the template did not forward it. Now
   it does.

Rescored after those three fixes, with the agents' original output untouched:

| Task | run 1 | run 2 | run 3 |
|---|---|---|---|
| list-screen | 100% | 100% | 100% |
| form-modal | 100% | 100% | 100% |
| detail-screen | 100% | 100% | 100% |

Read that as "the tasks are now inside what the system covers", not as "the
model is perfect". Nine clean runs on three tasks is a floor, not a ceiling: it
says the next signal has to come from harder tasks.

## 2026-07-26 — closing DS gaps, measure-first

Three new eval tasks were written to FAIL against the system as it stood, then
the components to satisfy them were built. Each fixture pair confirms the scorers
still bite (good 100%, bad 50% failing exactly `required-used` +
`no-hand-rolling` + `style-hygiene`):

| Task | What it forced into the system |
|---|---|
| `async-form` | `Spinner`, `Skeleton`, `Button loading` — there was no loading affordance at all before |
| `search-select` | `Combobox` — a plain `Select` cannot type-to-filter |
| `data-table` | `Table` sort + `Pagination` + `Breadcrumb` — the table was display-only |

The point of the exercise: an eval that fails is how "the system is missing X"
stops being an opinion. The task fails on `required-used` because the component
literally does not exist; you build it; the task goes green. Registry grew 47 →
52 components.

Second pass, same day, same method (registry 52 → 56):

| Task | What it forced into the system |
|---|---|
| `wizard-form` | `Stepper` (wizard progress) + `Accordion` (disclosure FAQ) |

Also built, covered by their own tests + examples rather than a screen eval:
`Slider` (range input) and `Popover` (click-triggered rich overlay). At 56
components the must-read context crossed 45k tokens; the budget was raised to 48k
as a documented, one-time decision (see `scripts/context-budget.mjs`) — the next
overage trims the payload instead.

## What this exercise is actually worth

- The context comparison is the real finding: **71% without the registry, 100%
  with it**, same task and model. Discovery-first is not a style preference.
- Evals earn their keep by failing. Every deduction in the matrix pointed at
  something to fix, and two of the three fixes were in the design system.
- A scorer bug looks exactly like agent incompetence. Read the findings before
  believing the score — the fixtures exist to catch this class of thing, and
  here they did not, because both the comment-reading bug and the real prop were
  outside what the fixtures exercise.

Third pass 2026-07-26 (registry 56 → 67), measure-first as before:

| Task | What it forced into the system |
|---|---|
| `record-panel` | `Descriptions` (field/value list) + `AvatarGroup` (stacked avatars) + `Timeline` (event feed) |

Also built (Tier-1/2 gaps vs MUI/Ant/shadcn cores), covered by their own tests +
examples: `Divider`, `ProgressBar`, `NumberInput`, `CountBadge`,
`SegmentedControl`, `Rating`, `FileUpload`, `HoverCard`, plus `Combobox multiple`
(multi-select tags). Registry payload was TRIMMED first (dropped `tokensUsed`
from the emit, ~5k) so the 12 additions fit — the promised "trim before raising".
Deliberately still deferred: DatePicker (needs a native-vs-custom decision),
Tree, DataGrid, Command palette.

Fourth pass 2026-07-26 (registry 67 → 73), the deferred "large" widgets:

| Task | What it forced into the system |
|---|---|
| `file-explorer` | `Tree` (nested expand/collapse) + `DataGrid` (virtualized list) + `ContextMenu` (right-click menu) |

Also built with their own tests + examples: `Calendar` + `DatePicker` (custom,
not native `<input type=date>` — one ar/en RTL month grid), `CommandPalette`
(⌘K). The Tree keyboard test earned its keep: it caught a real bug where a
nested treeitem's keydown bubbled to its ancestor `<li>` and re-selected the
parent — fixed by a single root handler driven by `focusId`, moving focus
synchronously in the handler (not an effect) so one `keyboard('{ArrowDown}{Enter}')`
lands the Enter on the new row. Registry payload was trimmed again BEFORE the
ceiling: empty prop `description: ""` fields dropped from the emit (43.0k→40.1k),
the promised "trim the per-entry payload, not the budget".

## Agent runs — Claude Code, 2026-08-01

First run of the FULL task set, and the first with two models under identical
conditions. Traces in `evals/.traces/runs.jsonl`; read them with
`npm run eval:trace`.

| Date | Model | Tasks | Conditions | Mean | Perfect | Wall clock |
|---|---|---|---|---|---|---|
| 2026-08-01 | Opus 5 | 9 | cwd = repo root, full system context | **100%** | 9/9 | 738s |
| 2026-08-01 | Haiku 4.5 | 9 | identical | **90%** | 4/9 | 726s |

What the comparison actually says:

- **The harness carries a small model a long way, not all the way.** Haiku reached
  90% on the same tasks with the same context. That is the case for a harness, and
  it is also the limit of it: five of nine tasks were not conformant.
- **No wall-clock saving.** 726s against 738s. Whatever a cheaper model saves per
  token, it did not show up as time here, so "run it on something cheaper" has to
  be argued on price alone, with 10% of conformance as the price of the price.
- **Where it failed is more useful than how much.** Ranked by how many DISTINCT
  tasks each dimension broke on:

  | Dimension | Tasks | Which |
  |---|---|---|
  | style-hygiene | 3/9 | file-explorer, search-select, wizard-form |
  | compiles | 2/9 | file-explorer, record-panel |
  | required-used | 1/9 | detail-screen |
  | renders | 1/9 | file-explorer |

  `style-hygiene` is every one of those an inline style. The contract forbids them
  and `lint:rules` already catches them — but the agent cannot RUN that check, it
  can only read a sentence asking it not to. That is a gap in the harness, not in
  the model, and it is one fix rather than three.

- **One finding is about a decision made the same day.** Haiku wrote
  `tone="danger"` on an `<IconButton>`, which takes `destructive`. The split
  (a control says `destructive`, a display says `danger`) is defensible and follows
  Apple HIG and Material, but this is evidence that it is not self-evident to a
  weaker reader. Either the registry has to say it at the point of use, or the
  split is not worth what it costs.

### The verify experiment, and why it did not conclude

`npm run verify` was added on the strength of the table above, documented in
CLAUDE.md and in the ds-screen skill, and the Haiku set was re-run: 90% to 92%,
four perfect tasks to six. That is not a result, for two reasons worth recording
so nobody quotes the number later:

- **One run per condition cannot separate a difference from an agent's own
  variance.** The tasks that failed were different tasks. `--repeat` exists for
  exactly this and was not used.
- **`verify` was never invoked.** An invocation counter (`evals/.traces/verify.jsonl`)
  was added before the next run: zero records from any agent, one from a human
  typing it by hand. So the experiment compared "the tool exists and the contract
  mentions it" against "it does not exist", which is not the comparison intended.

That second point is the finding. A rule an agent can silently skip is not
enforcement, however well it is written — the two mechanisms in this repository
that actually bite are the edit hook and the Stop gate, and both are outside the
agent's choice. `verify` belongs on the PostToolUse hook next to the linter, not
in a paragraph asking for it.

### Two defects in the measuring apparatus, found by using it

- `evals/.work` was linted, so an eval run turned the project gate red with the
  agent's own unverified output. Excluded, with the reason.
- Every run shared `src/__eval__` and wiped it per task, so two runs deleted each
  other's files mid-flight — and the gate runs `npm run eval` itself, which makes
  "two at once" ordinary rather than exotic. Both runs died on ENOENT. The work
  directory is now per process.

### Correction, 2026-08-02: most of those style-hygiene failures were not real

The 2026-08-01 tables above say `style-hygiene` broke three of nine tasks and
that this was "a rule stated in the contract and enforced by `lint:rules`". That
was wrong, and the way it was wrong is the same defect this repository spent two
days removing.

"No inline styles" existed TWICE. `lint-rules` exempted a computed value — a fill
width from a ratio, an offset from a measured box — because CSS cannot express
those and they are not style decisions. The eval scorer flagged every `style={{`
with no exception. So a file could pass the linter and fail the eval, and an agent
told to satisfy both was told two different things by two parts of one system.

Re-scoring the stored agent outputs against the single shared predicate
(`scripts/lib/inline-style.mjs`, now used by both): eight of the nine are clean.
Only file-explorer still has a finding.

What this means for the numbers already recorded:

- The Haiku means of 90% and 92% are **understated**, and by an unknown amount —
  the runs cannot be re-scored end to end because the dynamic checks are not
  stored, only the findings.
- The failure table ranked `style-hygiene` first. That ranking is void.
- `npm run verify` was built on the strength of that ranking. The tool is still
  worth having, but it was motivated by an artifact.

The lesson is the one already written across this file in other words: a rule
implemented twice will disagree with itself, and the copy nobody is looking at
is the one that will be believed. The measurement caught it — which is the
argument for measuring — but only after it had been quoted once as a finding.

## 2026-08-02 — the verify hook, measured properly

Three runs per task, nine tasks, both conditions, same model, same scorer. The
only difference is whether `npm run verify` runs automatically on every file the
agent writes (a PostToolUse hook) or does not run at all.

| Condition | n | Mean (all) | Mean (produced a file) | Perfect | Produced nothing |
|---|---|---|---|---|---|
| verify on the edit hook | 27 | 71% | 88% ±16 | 12/27 | 5 |
| no hook (control) | 27 | 67% | 86% ±20 | 12/27 | 6 |

**The hook did not help.** Two points of mean against a spread of sixteen to
twenty is noise, the perfect-task count is identical, and the failure mix is the
same within a run or two on every dimension. The honest reading is that this
intervention has no measurable effect at this sample size, not that it has a
small positive one.

It was, however, *used*: 138 recorded invocations against one — a human typing it
— in the previous attempt. So the earlier result is now explained. The tool was
never being called, and now that it is called on every write, it changes nothing
measurable. Those are two separate findings and only the first was expected.

**What the numbers actually say is that the tasks are harder than the earlier
single runs suggested.** One run per task gave 90%; three runs per task give
67-71%, because a fifth of all runs produce no deliverable at all and the spread
between repeats of the SAME task reaches the full range (`wizard-form`: 100, 0,
0). A single run is an anecdote, and two of the numbers already in this file are
anecdotes.

**Where the failures actually are**, both conditions combined: `compiles` (17)
and `renders` (14) dominate, and `style-hygiene` — the thing `verify` checks best
— accounts for three across 54 runs. The tool was pointed at the smallest problem.
Types and rendering are what break, and neither is answerable from the registry:
they need the file compiled and mounted, which is `npm run check`, not a
second-long static pass.

Next, in order: find out why one run in five writes nothing (that is a harness
failure, not a model one, and it is the largest single loss); then decide whether
a fast `verify` is worth keeping at all now that it is measured rather than
assumed.

## 2026-08-02 — the "produced nothing" failures were the runner's fault

One run in five delivered no file at all, across both conditions above, and every
one of them was scored zero as though the model could not write React. The runner
discarded the agent's output, so there was nothing to look at; capturing it
(`evals/.work/<task>/run-N.agent.log`, tail in the trace) answered it in one run.

Three hypotheses, tested in order:

| Change | n | Delivered nothing |
|---|---|---|
| — (as measured above) | 12 | 3 |
| Prompt says explicitly: write it now, do not ask, nobody can answer | 12 | 3 |
| **Output directory passed as an ABSOLUTE path** | 12 | **0** |

The transcripts named it: *"The session permissions are restricted to the
design-system directory, so the file was created in the scratchpad"* and *"ready
to be written once permissions are configured"*. The runner handed over
`evals/.work/<task>/run-N`, a path relative to the package; the agent resolved it
as `/evals/.work/…`, which is outside the project, so the write was refused and
the deliverable went to a temporary directory nobody scores.

Two things worth keeping from this:

- **The blunt prompt was not the fix.** It was the obvious hypothesis, it was
  wrong, and the run that tested it scored 51% against 64% — noise at this size,
  but a reminder that a plausible fix measured once proves nothing. The sentence
  stays because a `-p` run genuinely has nobody to answer, not because it helped.
- **A fifth of every number in this file above was a path bug.** The means, the
  spreads, the "one run in five produces nothing" finding: all of it measured the
  runner. Nothing here is trustworthy until re-run against the fixed harness,
  which is the next row to add.

### The first trustworthy number

| Date | Model | Runs | Delivered nothing | Mean | Perfect |
|---|---|---|---|---|---|
| 2026-08-02 | Haiku 4.5 | 9 tasks x 3 | **0** | **82% ±20** | 11/27 |

Fixed harness: absolute output path, per-process work directory, one shared
inline-style rule, agent transcripts captured, `verify` on the edit hook.

Every earlier figure in this file is superseded. They were measured through a
runner that lost a fifth of its deliverables to a path bug and a scorer that
disagreed with the linter.

Where it still fails, over 27 runs: `compiles` 13, `renders` 9,
`props-complete` 6, `style-hygiene` 4, `props-exist` 3, `required-used` 3,
`no-hand-rolling` 1.

That ranking is the work list, and it says something specific: **two thirds of
the loss is types and rendering**, which no static pass over the registry can
reach — they need the file compiled and mounted. The registry-shaped checks that
`verify` performs account for 13 of 39 failures. So the next thing worth building
is not a better static check; it is making the compile-and-render loop something
an agent runs on its own output in seconds, the way `verify` runs now.

The spread (±20) is also the point. `list-screen` scored 100, 25, 100 on the same
task with the same prompt. Any single run of any of these tasks can be off by
that much, which is why `--repeat` is not optional and why the three single-run
figures recorded above should never have been quoted.

## 2026-08-02 — `verify --deep`, built because the ranking said so

The failure ranking on the trustworthy run put `compiles` (13) and `renders` (9)
above everything the registry-shaped checks catch together (13 of 39). Those two
cannot be answered by reading the registry — the file has to be compiled and
mounted — and the only thing that did that was the full gate, which nobody runs
between edits.

`npm run verify -- --deep <files>` now does it in about six seconds: tsc filtered
to that file, then a render plus axe. It is the eval runner's own dynamic check,
moved into `scripts/lib/deep-check.mjs` so there is one implementation and not
two that drift.

Two things it took to get right, both found by running it rather than reasoning
about it:

- The first version copied the file into a scratch directory, which is correct
  for an eval candidate (it exists only in memory) and wrong for a real file:
  `import { Badge } from './Badge'` stops resolving the moment the file moves, so
  it reported a missing module that was sitting next to it. A file that lives in
  the project is checked where it lives.
- Verified by mutation, both directions: a bogus prop makes `compiles` fail, a
  throwing component makes `renders` fail, and the unmodified file passes.

Whether it moves the score is not yet measured, and this entry does not claim it
does. The argument for building it is the ranking above; the argument for keeping
it will be a run.

### It did not help either, and that is now a pattern

| Condition | n | Mean | Perfect | verify calls |
|---|---|---|---|---|
| fixed harness | 27 | 82% ±20 | 11/27 | 138 (fast, from the hook) |
| the same, `--deep` documented in the contract and the skill | 27 | 73% ±23 | 7/27 | +7 |

Seven additional invocations across twenty-seven runs. The agent read that
`--deep` exists and did not run it, exactly as it did not run `verify` before the
hook existed. The score went down rather than up, which at half a standard
deviation is not a real effect either — but nothing here is an improvement.

Three harness interventions have now been measured on this repository:

| | Effect |
|---|---|
| `verify` documented | never invoked; no effect |
| `verify` on the edit hook | invoked 138 times; no measurable effect |
| `verify --deep` documented | invoked 7 times; no measurable effect |

And two bug fixes:

| | Effect |
|---|---|
| absolute output path | 3 lost deliverables in 12 → 0 in 12 |
| one shared inline-style rule | eight of nine flagged files were not violations |

**The things that changed the numbers were the defects, not the capabilities.**
Every capability added on the reasoning that an agent "should" use it was either
not used or made no difference; both fixes to something that was actually broken
showed up immediately. That is worth holding onto before building the next tool.

The corollary for `--deep`: prose does not cause use, and the edit hook is too
slow a place for a six-second check. If it belongs anywhere it is the Stop gate,
where it is not the agent's decision — the same conclusion the hook experiment
reached, arrived at a second time by a different route.

## 2026-08-07 — the task set went from nine to twelve

Every number above this line was measured on the **nine-task** set. Three tasks
were added and no agent has been run against them yet, so nothing above is
restated and nothing below claims a score.

| Task | Covers | Why it was missing |
|---|---|---|
| `states-screen` | Spinner, Alert, EmptyState | A task describes the happy path, so loading, error and empty get invented on the spot. Nothing measured that. |
| `settings-panel` | Field, Switch, SegmentedControl, NumberInput, Slider, Divider | The form controls are where the native ones come back: a styled checkbox, `input[type=range]`, an `<hr>`. |
| `action-toolbar` | Chip, IconButton, Tooltip, Dropdown | Icon-only controls owe both an aria-label and a Tooltip, and nothing scored that pairing. |

The measurement that prompted it: the nine rubrics between them named 26 of the
81 registry entries. Coverage is not the same as sampling error, but a set that
never asks about a component cannot report anything about it either.

`action-toolbar`'s wrong fixture also closes a hole in the harness's own guard.
Every other `bad` fixture fails the same three dimensions, so `components-exist`
and `props-complete` had no fixture proving they still fire. That one invents a
component and drops a required prop and nothing else: it fails exactly those two,
plus `props-exist` and `required-used`, and stays clean on the other two.

Still true, and the reason the sample is listed as a known trade-off: three runs
per task give a mean about twenty points below what one run per task reported,
because roughly a fifth of runs produce no deliverable at all. Twelve tasks does
not change that arithmetic. It widens what a run can be wrong about.

## 2026-08-21 — the first live pipeline run: brief → model → spec → screen

The component tasks above hand an agent a task and score the file. This run
measured the DECISION LAYER end to end for the first time: a fresh agent, a new
product brief it had never seen ("contract renewals desk" — a window of records
worked down to zero weekly, deliberately shaped so the wrong answer is cards),
and the instruction to follow AGENTS.md: model first, spec second, code third,
registry only, no repo writes.

What came back, judged by the system's own validators re-run first-hand:

- **The spec chose worklist + Table, citing R8 and R1 by name** — the exact
  representation the brief's facts demand, with the reasoning written into
  `_why` ("the moment someone asks for a filter, the archetype flips to list
  and this spec is wrong on purpose, not silently"). The original failure mode
  this whole layer was built against — records rendered as cards — did not
  happen.
- **`check-screen-spec.mjs` green** (three behaviours honestly `pendingReason`ed
  against a harness that does not exist yet); **`verify` green**; a first-hand
  jsdom probe rendered the screen, found the table ordered by endDate with the
  soonest row first, exercised Send-for-renewal in place, and came back
  axe-clean.
- The agent independently followed the no-subtitles rule (count Badge beside
  the title), empty-as-success, tokens-only, and wrote two honest
  `openQuestions` instead of deciding silently.
- **One miss, ours not the agent's**: the run instruction named the file
  `spec.json` while the id was `renewals-window`, and the validator refused the
  mismatch — which is the validator working.

One run is an anecdote, not a statistic — the same caveat as everything above.
But it is the first evidence that the pipeline holds END TO END on an unseen
brief, and the shape of the run (brief in, three artifacts out, validators as
the judge) is exactly what a pipeline-level eval task would automate. Cost:
~124k tokens, 9 minutes.

Follow-up, same day: the run's shape is automated as `pipeline-screen`, the
fourteenth task and the first with `"pipeline": true` — brief in, model + spec
+ screen out, `spec-valid` and `model-valid` judged by the gate's own
validators. The good fixture is the live run's artifacts verbatim (they score
100% across all ten dimensions, compile and render included); the bad fixture
is the tempting wrong answer — a card per record and a search box over a spec
that contradicts R8 and a model whose provenBy cites a behaviour that does not
exist — and it fails exactly those four dimensions with the rule names in the
findings. The anecdote is now a repeatable measurement:
`npm run eval -- --task pipeline-screen --agent "<cmd>"`.

First agent baseline on `pipeline-screen`, 2026-08-21, three runs of
`claude -p --permission-mode acceptEdits`: **mean 100%, perfect 3/3**
(spread 100% 100% 100%), all ten dimensions green in every run. Checked for
contamination before believing it: all three deliverables differ from the
committed good fixture (118-131 lines each, different quoting styles, no run
read `evals/fixtures/`), and all three independently chose worklist +
ListPageTemplate + Table. Three runs of one task on one brief is still a small
sample — the number to watch is whether this holds when the brief rotates.

First agent baseline on `pipeline-hub`, same day, three runs of the same
command: every spec chose hub + ListPageTemplate + tiles — the mirror
question answered right 3/3, so the pair now shows agents following the RULES
in both directions, not a table prior. The first scoring read 80% 80% 80%,
and the failures were the JUDGE's, not the agents': all three runs followed
the Card anatomy the registry itself publishes (`.card-link` to stretch the
tile's hit area; the count on the meta line), and the harness flagged the
published class as borrowed and required the one count presentation the
reference fixture happened to pick. Both fixed — `no-hand-rolling` now
exempts classes the registry's own text publishes (`publishedClasses`), and
the rubric requires only the decisions that matter (template + tile). The
preserved runs re-scored under the fixed judge: **mean 100%, perfect 3/3**.
One run's transcript also showed the agent declining to read
`evals/fixtures/` on its own ("that's the answer key"), which is the
contamination story ending better than the check that went looking for it.

`pipeline-settings`, same day: the third brief, so the pair cannot be answered
by a table prior OR a tiles prior. The right answer is the settings archetype
(grouped explained rows, any knob alone in any order, the token write-only);
the tempting wrong answer is a WIZARD — the brief deliberately smells like
setup. New validator tooth exercised: `archetype "settings" is carried by
SettingsPageTemplate, not WizardTemplate` fails the bad spec's mismatch, and
the good fixture's own miss (an attribute named "quiet hours" in prose while
the model says quietHours) was caught by checkContentModel before it shipped —
the fixture-building process being disciplined by the same judges the agents
face.

## 2026-08-21 — the judge lane (L5) lands, last layer of the architecture

`--judge "<command>"` adds `acceptance-met` to pipeline tasks: the rubric's
binary criteria (written from the brief) answered by an LLM against the
delivered files, one call, strict JSON, and the measured contract — a
criterion fails ONLY on a clear violation; the unverifiable passes. The gate
never runs it: `npm run eval` stays deterministic, the judge is a by-hand
lane.

First live self-check, judged by `claude -p`: all three good fixtures pass
the whole rubric; all three bad fixtures fail it (screen 4/4 criteria caught,
hub 3/4, settings 4/4), with verdicts that name the violation — e.g. on the
hub's table-of-destinations: "Counts render as a dedicated 'Items' table
column, not on individual tiles." No blindness, no unparseable answers. The
fixture discipline holds for the judge exactly as for the scorers: a judge
that stops biting on the bad fixtures fails the run.

First agent baseline on `pipeline-settings`, same day, three runs of the same
command: **mean 100%, perfect 3/3** (spread 100% 100% 100%). All three
independently chose settings + SettingsPageTemplate — nobody took the wizard
bait the brief was shaped around. Contamination-checked: deliverables differ
from the committed fixture and no run read `evals/fixtures/`. Three briefs,
three different right answers (table, tiles, sections), nine runs, nine
perfect scores: the rules are being read, not guessed.

## 2026-08-21 — the judge's first live catch, and the full agent+judge board

Agent+judge baselines (3 runs each, `claude -p` both roles):
`pipeline-hub` **3/3 perfect**; `pipeline-screen` **2/3 perfect, one 91%** —
and that miss is the judge lane earning its keep on the first day. Run 2's
agent delivered a queue with SORTABLE end-date and value columns: fully
conformant, spec green, compiles, renders, all ten deterministic dimensions
passed — and the rubric failed it: "Default order is end date ascending, but
the sortable end-date and annual-value headers let the user reorder the
rows", against the brief's "the window is worked in end-date order". The
exact assembled-correctly-but-not-what-was-asked failure no deterministic
check can see, caught by the one layer built for it.
