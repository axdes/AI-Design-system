# mcp/ — the design system, served

`server.mjs` is a Model Context Protocol server over stdio. No dependencies, no
build step, no process to keep running: the client starts it, asks, and it exits
with the client.

```
design_system_index   what exists, one line each (filter by term, level, surface)
component             props, allowed values, variants, the golden example
tokens                the token catalogue, by name or by intent
decide                which representation fits this task and data — asked BEFORE writing
verify                does this code use the system — answered on the code
```

## Why it exists when the index already does

`component-index.md` plus `npm run registry` solved this for an agent working
inside this repository. A client working in Cursor or Copilot on their own
codebase has neither: no file to read, no terminal into ours. The system was
therefore something they could copy and not something they could consume, which
is the same gap the DTCG export closes for tokens.

`verify` is the tool that changes behaviour rather than saving tokens. Over 27
measured agent runs, 22 of 39 failures were things the model could have been told
about before a human read the diff (see [../evals/BASELINE.md](../evals/BASELINE.md)).
It takes the code as a string, so nothing has to be written to disk first.

`decide` moves the same idea one step earlier: the representation rules the gate
enforces on screen specs (`screen-specs/selection-rules.json`), served as an
answer instead of a rejection. Task and data shape in; what the rules choose out,
with the reason and a right/wrong pair — and a plan of components checked on the
spot. An agent that asks it never learns "table or cards" by having a spec
bounced.

## Wiring it up

**This repository**: already registered in `.mcp.json` at the root. Claude Code
asks once whether to trust it.

**Cursor** (`.cursor/mcp.json` in the consuming project, or the global one):

```json
{
  "mcpServers": {
    "design-system": {
      "command": "node",
      "args": ["/absolute/path/to/packages/design-system/mcp/server.mjs"]
    }
  }
}
```

**Claude Code, elsewhere**:

```bash
claude mcp add design-system -- node /absolute/path/to/packages/design-system/mcp/server.mjs
```

The path has to be absolute outside this repository, and the checkout has to be
one where `npm run gen-registry` has run: the server reads
`component-registry.json` and refuses to start without it. It does not read
`component-index.md` at all — that file is a rendering for an agent that reads
files, and this server builds the same rows from the registry.

## What it is not

It does not compile or render. Those need the file inside a project and cost
seconds each; `npm run check` is where they belong. This answers one question in
a tenth of a second, which is what makes it usable on every edit.

It is also not a second source of truth. Every answer is generated from the same
files the gate verifies, so a stale answer is impossible without a red gate
first. The protocol test in `src/test/mcp.test.ts` keeps the four tools and the
handshake from drifting.
