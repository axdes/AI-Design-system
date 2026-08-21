# Evals

The gate answers "is the repo healthy". These answer a different question:

> Given a task, does the code an agent produces actually use this design system?

That number is what turns harness work (the registry, AGENTS.md, golden
examples, the linters) from taste into evidence. Change one of them, re-run the
evals, see whether the score moved.

## Run

```bash
npm run eval                                  # score the reference fixtures (self-check)
npm run eval -- --task list-screen            # one task
npm run eval -- --candidate path/to/dir       # score files that already exist
npm run eval -- --agent "claude -p --permission-mode acceptEdits"
npm run eval:static                           # skip the compile/render pass
```

**Agent contract**: the command runs with `cwd` set to the **repo root**, gets the
task text plus its output directory on **stdin**, and leaves the deliverable
there. Anything that obeys that contract can be measured, not just Claude Code.

The cwd is part of the measurement. An agent sandboxed to a scratch directory
cannot read `AGENTS.md`, the registry or `src/`, so it guesses the API and you
end up measuring an agent *without* the design system. We did that by accident
once: same task, same model, 71% and seven type errors instead of 100%. See
[BASELINE.md](BASELINE.md).

## What is scored

Static (no build, instant):

| Dimension | Question |
|---|---|
| `components-exist` | Is every component tag a real one, or an invented `<DataGrid>`? |
| `props-exist` | Do the props and their values exist in the registry? |
| `props-complete` | Are the required props actually passed? |
| `required-used` | Did the task's must-use components actually get used? |

A task whose rubric carries `"pipeline": true` delivers the DECISIONS with the
code — a content model and a screen spec — and gains two dimensions judged by
the gate's own validators, never a reimplementation: `spec-valid` runs
`check-screen-spec.mjs` on the delivered spec (registry existence, the
selection rules, states, the id-matches-filename discipline) and `model-valid`
runs the shared engine's `checkContentModel` against it (provenBy chains, core
attributes the screen dropped). `pipeline-screen` is that task: brief in,
three artifacts out, and the tempting wrong answer — a card per record with a
search box — fails four dimensions at once with the rule names in the message.

## The judge lane (L5)

`--judge "<command>"` adds one more dimension to pipeline tasks:
`acceptance-met`. The task's rubric carries `acceptance` — binary criteria
written from the brief — and the judge answers each one against the delivered
files, in one call, as strict JSON. The contract follows the measured limits
of LLM judging: a criterion fails ONLY on a clear violation visible in the
code; anything unverifiable is a pass. An unparseable answer fails loudly.

The gate never runs the judge: `npm run eval` stays deterministic. Run it by
hand, the same self-check discipline applying — the reference fixtures must
pass the rubric and the wrong ones must fail it:

```bash
npm run eval -- --task pipeline-settings --static-only --judge "claude -p"
npm run eval -- --task pipeline-settings --agent "claude -p --permission-mode acceptEdits" --judge "claude -p"
```
| `no-hand-rolling` | Native controls or borrowed DS classes instead of the component? |
| `style-hygiene` | Inline styles, raw hex, `!important`, physical properties, raw px? |

Dynamic (reuses the project's own toolchain):

| Dimension | Question |
|---|---|
| `compiles` | Does `tsc` accept it inside this project? |
| `renders` | Does it render, and is it axe-clean? |

Dimensions are binary and equally weighted. Partial credit inside a dimension
would reward code that is "mostly conformant", which is the exact failure mode
evals exist to expose.

## Layout

```
tasks/<id>/task.md      the prompt an agent gets, written like a real ticket
tasks/<id>/rubric.json  required components, task-specific forbidden patterns
fixtures/<id>/good/     reference solution — must score 100%
fixtures/<id>/bad/      deliberately wrong solution + expect.json
scorers.mjs             the deterministic checks (zero dependencies)
run.mjs                 the runner: one fresh session per task
drift.mjs               the same tasks in ONE session, scored per turn
```

## Why the fixtures exist

A scorer that quietly stops reporting makes every future run look green, which
is worse than having no evals at all. So each task ships both a reference
solution (must score 100%) and a wrong one (`expect.json` names the dimensions
it must trip). `npm run eval` verifies both, and `src/test/evals.test.ts` runs
the same check inside the normal test suite.

## Adding a task

1. `tasks/<id>/task.md` — write it like a ticket, not like a prompt. No hints
   about which components to use; discovering them is what is being measured.
2. `tasks/<id>/rubric.json` — the components a correct answer must use, plus any
   task-specific pattern that means "you rebuilt it by hand".
3. `fixtures/<id>/good/Screen.tsx` — write the reference solution yourself and
   make it score 100%. If you cannot, the task is unclear or the system has a
   gap; both are worth knowing before measuring an agent with it.
4. `fixtures/<id>/bad/Screen.tsx` + `expect.json` — the plausible wrong answer.

## Drift: does the agent still know the system on turn ten?

`run.mjs` gives every task a fresh session, which is the wrong shape for the
failure this harness exists to prevent. Nobody builds one screen and stops. In a
real session the contract scrolls further and further up the context, and
somewhere around the eighth or tenth turn a plain `<button>` appears. Every
linter here is paid for by that failure, and until now nothing measured it.

```bash
npm run eval:drift -- --agent "claude -p --permission-mode acceptEdits"
npm run eval:drift -- --agent "…" --turns 20        # loop the task list
npm run eval:drift -- --rescore evals/.drift/<id>   # score a finished run again
```

Every turn runs in one session, in order, without interruption. Then each task is
run AGAIN in a fresh session as a control, and what is reported is the
difference: same task, same model, same prompt, one carrying nine turns of
history and one carrying none. Without that control a low score on turn ten is
indistinguishable from turn ten being a harder task.

Two numbers come out. The **drop** is how many points the last third of the
session loses against the first (over 15 fails, which is the smallest drop bigger
than the run-to-run noise in [BASELINE.md](BASELINE.md)). **Forgotten first**
names the dimensions that fail more late than early, and that list is the useful
one: a rule the model stops applying under context pressure is a rule that
belongs in a linter or a hook rather than in prose.

It is not in the gate. It costs a real agent, real minutes and real money. Run it
before shipping a change to the contract, the index or the linters, and write the
number into BASELINE.md with the conditions it was taken in.
