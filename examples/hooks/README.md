# Hooks — the three places a rule runs without being remembered

A linter that an agent is *asked* to run is a linter that runs when the agent
feels like it. These three hooks run it whether or not anyone remembers, at the
three moments where a break is still cheap to fix.

They are examples, not machinery: copy them, change the paths, delete the parts
you do not have. Nothing in this package imports them.

| When | What runs | Cost | What it stops |
|---|---|---|---|
| `PostToolUse` — the agent just wrote a file | `verify` on that one file; `lint` + `lint:css` + `lint:rules` for the package | **0.45s** for the file check, **~13s** for the three linters | The agent inventing a component, a prop or a prop value, and finding out at review |
| `Stop` — the agent is about to end its turn | the same three linters, per package | **~13s** per package | A turn ending with the rules broken |
| `pre-commit` — a human or an agent commits | the whole gate, `npm run check` | **37s** (recorded) | A commit that does not compile, has no tests, or drifts from the registry |

Measured on a 138-component package. The per-file check is the cheap connector and
the one worth running on every write; the three linters are worth scoping by path,
which is what the `case` in the config does.

## Why this is the token argument, not the prompt

The saving is not in the prompt. It is in the round trip.

An agent that generates, waits for a human to review, and regenerates pays for
the whole task a second time — and the second attempt carries the first one in
context, so it costs more than the first. A deterministic check that fails in
under a second and names the rule replaces that round trip with a correction the
agent makes to itself, inside the same turn, before anything reaches a person.

Two numbers from this repository, both in `evals/BASELINE.md`:

- **Discovery reads a 3.9k index, not a 105k registry.** Must-read context per
  task is 8.4k tokens. One more component costs 29 tokens on every future task
  instead of 586. That split is only safe because these hooks exist: an index
  buys discovery, the hook enforces the contract. Without the check, splitting
  the file is just hiding information from the agent.
- **`npm run verify` is under half a second** (0.45s measured on one component).
  The full gate is recorded at 37 seconds. The
  measurement that produced `verify`: on a full eval run, three of nine tasks
  failed `style-hygiene`, and every one was an inline style — a rule the
  contract states plainly and `lint:rules` already enforced. The agent could
  read the sentence asking it not to. It could not run the check that would have
  told it that it had. That is a missing connector, not a weaker model.

## `claude-settings.json` — PostToolUse and Stop

Goes at `.claude/settings.json`, at the root of whatever the agent has open.

`PostToolUse` fires after `Edit|Write|MultiEdit`. It reads the edited path out of
the hook payload with `jq`, matches it against a `case`, and does nothing at all
for a file it does not own — a hook that fires on every write in a monorepo is a
hook somebody switches off. **`exit 2` is the whole mechanism**: it feeds stderr
back into the session as a message, so the agent sees the rule it broke and
fixes it in the same turn. Exit 0 with a printed complaint is a hook the agent
never learns about.

`Stop` fires when the agent is about to finish, and blocks finishing. Keep it
cheap — the linters, not the build or the test suite — because it runs on every
turn. This one calls `scripts/claude-stop-gate.mjs`, which walks the packages it
finds rather than a hardcoded list.

Two things that cost real time to discover:

- **Hooks run in a bare non-interactive `/bin/sh`**, which never reads a shell
  profile. An nvm or Homebrew `node` is not on `PATH` there, so every hook dies
  with `npm: command not found` and reads exactly like a hook that is not
  installed. `scripts/node-path.sh` is sourced first by everything that shells
  out to npm.
- **`$CLAUDE_PROJECT_DIR` is the project root, `$PWD` is not.** The fallback
  matters when the agent has been started somewhere else.

## `pre-commit` — the gate

Goes at `.githooks/pre-commit`, enabled once per clone with

```sh
git config core.hooksPath .githooks
chmod +x .githooks/pre-commit
```

`core.hooksPath` rather than `.git/hooks/` on purpose: the hook is then a file
git carries, so a fresh clone has it, and a change to it is reviewed like any
other change. `.git/hooks/` is per-machine and invisible.

It runs the full gate — 43 steps, in three concurrent lanes, recorded at 37
seconds — and
blocks the commit on any failure. `git commit --no-verify` is the escape hatch
and is meant to stay rare. The reason it is worth those seconds rather than being
moved to CI: a rule that fails in CI fails after the context that produced the
break is gone, and somebody else's morning pays for it.

## Landing this green

The first version of any of these over-reports. Record today's violations as
accepted debt — this package does it with an `ALLOW` map at the top of
`scripts/lint-rules.mjs`, one entry per known case, each a comment explaining why
it is allowed and what would close it — and let only a *regression* turn the
build red. A report that opens with four hundred failures is a report the team
stops reading, and a rule everybody has learned to skip past is worse than no
rule, because it looks like coverage.
