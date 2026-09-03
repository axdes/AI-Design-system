/* llms.txt — the design system for agents that do not speak MCP.
 *
 * The MCP server serves the registry to Claude Code, Cursor and friends; v0,
 * Lovable, Bolt and half the generation tools read llms.txt instead (the
 * convention Cloudscape, Nord and Nuxt UI follow). This generates one from the
 * same sources the MCP answers come from — component-registry.json and
 * screen-specs/selection-rules.json — so it cannot say anything the gate does
 * not verify. Same one-row-per-component rendering as component-index.md and
 * the MCP index: one builder, three outlets.
 *
 * Run:  npm run llms          write llms.txt
 *       npm run llms:check    fail if the committed file has drifted (gate)
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { indexRow, renderRow } from './lib/index-rows.mjs'

const ROOT = fileURLToPath(new URL('..', import.meta.url)).replace(/\/$/, '')
const OUT = `${ROOT}/llms.txt`

const registry = JSON.parse(readFileSync(`${ROOT}/component-registry.json`, 'utf8'))
const rules = JSON.parse(readFileSync(`${ROOT}/screen-specs/selection-rules.json`, 'utf8'))

/* The same rule the index follows: an `@internal` part is rendered for you by
   something else, so it is not on the list you choose from. It is still in the
   registry, and `npm run registry -- <Name>` still answers. */
const allComponents = Object.values(registry.components ?? {})
/* The list is what may be PICKED; the count is what the system HAS. An
   `@internal` part is rendered for you by whatever owns it, so it is not on the
   list — and it is still one of the components this package ships, which is the
   number every other document states and `check:claims` holds them all to. */
const components = allComponents.filter((c) => c.status !== 'internal')
const blocks = Object.values(registry.blocks ?? {})
const row = (e) => `- ${renderRow(indexRow(e))}`

const ruleLine = (r) => {
  const reps = r.choose.map((rep) => (rules.representations[rep]?.components ?? []).join('/')).join(' or ')
  return `- ${r.id} ${r.title}: ${reps}. ${r.because}`
}

const text = `# The design system

> A math-driven CSS + React component library built for LLM-assisted development:
> ${allComponents.length} components, ${blocks.length} page blocks, 3-tier tokens, and a check gate that
> rejects invented components, invented props, raw px/hex and wrong
> representations. This file is generated from the same registry the gate
> verifies — if a thing is not listed here, it does not exist.

## Hard rules

- Never invent a component, a prop or a variant value. The lists below are
  complete; a value outside a stated union is a defect.
- Components use semantic design tokens (var(--space-*), var(--font-*), roles
  like var(--primary)); a raw px or hex in component code fails the linter.
- No inline styles except truly dynamic values. No !important. Logical
  properties (padding-inline, text-align: start) — the system is RTL-ready.
- Page structure comes from the blocks (ListPageTemplate, DetailPageTemplate,
  AuthTemplate, WizardTemplate): a screen that hand-rolls its own width, centering
  or header is wrong.
- Icon-only controls take BOTH aria-label and a Tooltip wrapper.
- Every list, table and search has an empty state.
- One primary Button per visible surface: a screen answers once.
- Nothing here is missing on purpose. If a part genuinely does not exist, do not
  hand-roll it and do not hand-build its folder either: \`npm run new -- Name
  --level … --surface … --category … --about "…"\` writes every file and every
  registration a part needs, and \`--remove\` reverses them.

## Choosing a representation (the decision rules)

A zone is judged by the user's task and the shape of the data, not by taste:

${(rules.rules ?? []).map(ruleLine).join('\n')}

Hard limits:

${(rules.hard ?? []).map((h) => `- ${h.id}: never ${h.forbid.join('/')} when ${JSON.stringify(h.when)} — ${h.because} Use ${h.instead}.`).join('\n')}

## Components

One line each: name, atomic level[/surface], +parts of a compound, what it is
for. Import from '@ds/<Name>' in an app, '@/components/<Name>' inside the
design system.

${components.map(row).join('\n')}

## Blocks (page-level compositions)

Import from '@blocks/<Name>' in an app, '@/blocks/<Name>' inside the system.

${blocks.map(row).join('\n')}

## Deeper contracts

- component-registry.json: every prop, union and golden example, machine-readable.
- screen-specs/selection-rules.json: the full decision rules with right/wrong pairs.
- tokens/design.tokens.json: the token set in DTCG format.
- mcp/server.mjs: the same answers as MCP tools (index, component, tokens, decide, verify).
`

if (process.argv.includes('--check')) {
  const current = existsSync(OUT) ? readFileSync(OUT, 'utf8') : ''
  if (current !== text) {
    console.error('✗ llms.txt has drifted from the registry. Run `npm run llms` and commit the result.')
    process.exit(1)
  }
  console.log(`✓ llms.txt matches the registry (${Math.ceil(text.length / 4)} tokens).`)
} else {
  writeFileSync(OUT, text)
  console.log(`llms.txt written: ${components.length} components, ${blocks.length} blocks, ~${Math.ceil(text.length / 4)} tokens.`)
}
