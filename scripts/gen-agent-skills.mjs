#!/usr/bin/env node
/**
 * The design system as an Agent Skill, in the one directory every tool reads.
 *
 * This package already publishes itself four ways: an MCP server, `llms.txt`, a
 * shadcn-installable registry and DTCG tokens. All four are outlets for a machine
 * that comes asking. None of them is the format an agent LOADS BY ITSELF at the
 * moment a task starts — that is Agent Skills: a folder with a SKILL.md whose
 * frontmatter description decides when the agent pulls the rest in. The format
 * became an open standard in December 2025 and is read by Codex, Claude Code,
 * Cursor, Gemini CLI, Copilot and, per docs.replit.com/teams/custom-design-system,
 * by Replit Enterprise, which ingests a design system as exactly this shape:
 * SKILL.md at the top, `references/guides/` beside it, `references/components/`
 * with an index. That is the whole reason to generate it rather than admire it:
 * an org that runs a different agent than we do can drop this folder in and get
 * our components, our tokens and our decision rules with nobody re-authoring
 * anything.
 *
 * Two things make this different from the skills in `.claude/skills`, and the
 * difference is the audience, not the syntax. Those are for an agent working ON
 * this package: how to add a component, how to read the gate. This one is for an
 * agent building a screen WITH the package, in some other repository, and it says
 * the four things such an agent gets wrong: it invents components, it invents
 * props, it writes raw px and hex, and it picks the representation by taste.
 *
 * The same argument as AGENTS.md over CLAUDE.md, one directory down: `.claude/`
 * is one vendor's path, `.agents/` is the shared one. One system, every agent.
 *
 * Everything here is DERIVED — the index, the token catalogue and the decision
 * rules all come from files the gate already proves fresh — so the export cannot
 * drift into telling a stranger something this system stopped doing.
 *
 *   npm run gen:skill           write it
 *   npm run gen:skill:check     fail if what is committed is not what this writes
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('..', import.meta.url)).replace(/\/$/, '')
const OUT = `${ROOT}/.agents/skills/design-system`
const read = (p) => readFileSync(`${ROOT}/${p}`, 'utf8')
const json = (p) => JSON.parse(read(p))

if (!existsSync(`${ROOT}/component-registry.json`)) {
  console.error('component-registry.json is missing. Run `npm run gen-registry` first.')
  process.exit(1)
}

/* The skill carries a version of its OWN, and it is not the package's: the package
 * is `0.0.0` and honestly so (it is not on npm), while an installed skill is a copy
 * on a stranger's disk that has to be able to say what it is and when it is behind.
 * It is stated in package.json rather than computed here, because a version that
 * moves by itself tells nobody anything — the minor rises when the contract changes,
 * the patch when only the component list does. The tag `skill-v<version>` and the
 * release are cut from this same string. */
const pkg = json('package.json')
const version = pkg.skillVersion

const registry = json('component-registry.json')
const rules = json('screen-specs/selection-rules.json')
const index = read('component-index.md')
/* The wiring doc, as it already exists. Its links are written from mcp/, one
 * level down from the package root; in the export they sit two levels down in a
 * different tree, so the one relative hop out is flattened and the header says
 * what they are relative to. Nothing else is touched: a second copy of this text
 * that somebody maintains by hand is the failure this whole script avoids. */
const mcpDoc =
  '# Turning on the live tools\n\nPaths below are relative to the design-system package root.\n\n' +
  read('mcp/README.md').replace(/\]\(\.\.\//g, '](')

const components = Object.values(registry.components ?? {})
const blocks = Object.values(registry.blocks ?? {})
const tokens = Array.isArray(registry.tokens) ? registry.tokens : Object.values(registry.tokens ?? {})

/* ── SKILL.md ──────────────────────────────────────────────────────────
 *
 * Short on purpose. The frontmatter description is the only part loaded until the
 * agent decides the skill applies, and the body is what it reads next; the bulk
 * belongs behind the links, which is what progressive disclosure means in this
 * format. Numbers come from the registry, never from a sentence somebody typed. */
const skill = `---
name: design-system
description: The component library, tokens and layout rules this product is built from. Use when the user asks for any UI — a screen, a page, a form, a table, a dialog, a card — in a repository that ships this design system, and before writing any JSX or CSS that renders something a person looks at. Do not use it for backend, data or build work.
metadata:
  version: skill-v${version}
  source: https://github.com/axdes/AI-Design-system
---

# Building UI with this design system

There are ${components.length} components, ${blocks.length} blocks and ${tokens.length} tokens, and they are the whole vocabulary. A component that is not in the index does not exist; writing one anyway is the single most common way an agent's screen fails review here.

## The order of work

1. **Look before you write.** \`references/components/component-index.md\` is every component, one line each. Search it for what the zone needs.
2. **Decide the representation before laying the zone out.** Table or cards is not taste; \`references/guides/decisions.md\` computes it from what the user DOES and the shape of the data.
3. **Read the contract of the two or three you will actually write.** Props, the allowed values of every union, and a compiled example: \`npm run registry -- <Name>\` where this package is installed, or the \`component\` tool if the MCP server is registered.
4. **Check what you wrote.** \`npm run verify\` (or the \`verify\` tool) reads the code and names every invented component, unknown prop, inline style and raw value.

## The rules that get broken

- **Never invent a component.** If nothing fits, say so and ask, rather than hand-rolling the shape in raw JSX. A composition of existing components usually does fit.
- **Never invent a prop or a variant value.** The registry holds the allowed unions. A plausible-sounding prop that does not exist compiles in an agent's head and nowhere else.
- **No raw px, no hex, no inline styles.** Spacing, colour, type, radius and motion all come from tokens: \`references/guides/tokens.md\`. Components take \`className\` and \`data-*\`, never \`style\`.
- **One h1 per screen, and never skip a heading level.** Size comes from the component; the level is the outline.
- **Logical properties, so the layout survives RTL:** \`padding-inline-start\`, not \`padding-left\`.

## What each reference holds

| File | What it answers |
|---|---|
| \`references/components/component-index.md\` | what exists, one line each |
| \`references/guides/decisions.md\` | which representation a zone earns, and the rules behind it |
| \`references/guides/tokens.md\` | every token, with its value |

Deeper than these, in the package itself: \`llms.txt\` for the same knowledge as
prose, \`tokens/design.tokens.json\` for DTCG, and an MCP server that answers all
of it live, including \`verify\` on code that is not on disk yet.
`

/* ── references/guides/tokens.md ─────────────────────────────────────── */
const name = (t) => t.name ?? t.token ?? String(t)
const width = Math.max(...tokens.map((t) => name(t).length))
const tokensDoc = `# Tokens

${tokens.length} tokens. A component uses these; a raw px or hex is a defect the
linters reject. The same values in DTCG form, for a pipeline rather than a prompt,
are in \`tokens/design.tokens.json\`.

Generated from the registry. Never edit this file.

\`\`\`
${tokens.map((t) => `${name(t).padEnd(width)}  ${t.value ?? ''}${t.description ? `   ${t.description}` : ''}`).join('\n')}
\`\`\`
`

/* ── references/guides/decisions.md ──────────────────────────────────────
 *
 * The decision layer is the part of this system a stranger cannot guess and the
 * part most worth carrying to another agent: the same rules `check:spec` enforces
 * and the `decide` tool answers, flattened into text for a tool that has neither.
 * Rendered from the rules file itself, so a rule that changes changes here. */
const line = (s) => String(s ?? '').replace(/\s+/g, ' ').trim()
const cond = (w) =>
  Object.entries(w ?? {})
    .map(([k, v]) => `${k} = ${Array.isArray(v) ? v.join(' | ') : v}`)
    .join(', ')

const decisionsDoc = `# Choosing the representation

Before laying out a zone, answer two questions: what does the user DO here (one
verb), and what shape is the data. Those two answers choose the representation.
This is a computation, not a preference, and it is enforced where this system is
developed: a screen spec naming a representation the rules do not permit is
rejected before any code is written.

Generated from \`screen-specs/selection-rules.json\`. Never edit this file.

## The tasks a collection zone can have

${(rules.collectionTasks ?? []).map((t) => `- ${t}`).join('\n')}

## The representations

${Object.entries(rules.representations ?? {})
  .map(([id, r]) => `### ${id}\n\n${line(r.means)}\n\nBuilt from: ${(r.components ?? []).join(', ')}`)
  .join('\n\n')}

When more than one rule fires, the earlier one in this order wins:
${(rules.precedence ?? []).map((r, i) => `${i + 1}. ${r}`).join('  ')}

## The rules

${(rules.rules ?? [])
  .map(
    (r) =>
      `### ${r.id}. ${r.title}\n\n` +
      `When ${cond(r.when)} → **${(r.choose ?? []).join(' or ')}**\n\n` +
      `${line(r.because)}\n\n` +
      `- right: \`${line(r.good)}\`\n- wrong: ${line(r.bad)}`,
  )
  .join('\n\n')}

## Never, whatever the task

${(rules.hard ?? [])
  .map((h) => `- **${h.id}** — when ${cond(h.when)}, ${(h.forbid ?? []).join(' and ')} ${(h.forbid ?? []).length > 1 ? 'are' : 'is'} forbidden; use ${h.instead}. ${line(h.because)}`)
  .join('\n')}

## Worth saying out loud

${(rules.notes ?? []).map((n) => `- when ${cond(n.when)} and you chose ${n.if}: ${line(n.say)}`).join('\n')}

## Screen archetypes

${Object.entries(rules.archetypes ?? {})
  .map(([id, a]) => `- **${id}** — ${line(a.useWhen)}${a.notWhen ? ` _Not when:_ ${line(a.notWhen)}` : ''}`)
  .join('\n')}
`

const FILES = {
  'SKILL.md': skill,
  'references/components/component-index.md': index,
  'references/guides/tokens.md': tokensDoc,
  'references/guides/decisions.md': decisionsDoc,
  'references/guides/mcp.md': mcpDoc,
}

/* THE BUDGET, and every number in it is about a different moment.
 *
 * The description is the only part that is never free: it sits in the prompt of
 * every session whether or not the skill fires, because that is how the format
 * decides whether to load the rest. SKILL.md is read whole the moment it does
 * fire. The references are pulled by name, one at a time, which is what makes it
 * safe for the token catalogue to be the size it is — and what makes a fourth
 * reference cheaper than four more paragraphs in SKILL.md.
 *
 * The caps are the sizes as built with room to grow, not aspirations (334 / 2.7K
 * / 44K on 2026-09-01). Passing one is not a formatting problem: it means the
 * export started explaining instead of pointing. */
const BUDGET = { description: 1024, skill: 6 * 1024, total: 64 * 1024 }

const overBudget = () => {
  const out = []
  const description = skill.match(/^description:\s*(.+)$/m)?.[1] ?? ''
  const total = Object.values(FILES).reduce((n, t) => n + Buffer.byteLength(t), 0)
  if (description.length > BUDGET.description) out.push(`the description is ${description.length} characters, over ${BUDGET.description} — it is in context in every session, fired or not`)
  if (Buffer.byteLength(skill) > BUDGET.skill) out.push(`SKILL.md is ${Buffer.byteLength(skill)} bytes, over ${BUDGET.skill} — move what a reader needs only sometimes behind a reference`)
  if (total > BUDGET.total) out.push(`the export is ${total} bytes, over ${BUDGET.total}`)
  return out
}

/* Every file that is currently there, so `--check` catches a stray one somebody
 * added by hand: an export with an extra file in it is an export a reader trusts
 * and the gate does not cover. */
const present = (dir, prefix = '') => {
  if (!existsSync(dir)) return []
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? present(`${dir}/${e.name}`, `${prefix}${e.name}/`) : [`${prefix}${e.name}`],
  )
}

if (process.argv.includes('--check')) {
  const problems = overBudget()
  for (const [rel, text] of Object.entries(FILES)) {
    const path = `${OUT}/${rel}`
    if (!existsSync(path)) problems.push(`${rel} is missing`)
    else if (readFileSync(path, 'utf8') !== text) problems.push(`${rel} has drifted from the source it is generated from`)
  }
  for (const rel of present(OUT)) if (!(rel in FILES)) problems.push(`${rel} is not generated by this script — hand-written files in the export cannot be kept true`)
  if (problems.length) {
    console.error('\x1b[31m✗ the .agents/skills export does not check out:\x1b[0m')
    for (const p of problems) console.error(`    ${p}`)
    console.error('  Run `npm run gen:skill` and commit the result.')
    process.exit(1)
  }
  console.log(`✓ .agents/skills/design-system matches the system (${Object.keys(FILES).length} files).`)
} else {
  if (existsSync(OUT)) rmSync(OUT, { recursive: true })
  for (const [rel, text] of Object.entries(FILES)) {
    const path = `${OUT}/${rel}`
    mkdirSync(path.slice(0, path.lastIndexOf('/')), { recursive: true })
    writeFileSync(path, text)
  }
  const over = overBudget()
  if (over.length) {
    console.error('\x1b[31m✗ written, and over budget:\x1b[0m')
    for (const o of over) console.error(`    ${o}`)
    process.exit(1)
  }
  const bytes = Object.values(FILES).reduce((n, t) => n + t.length, 0)
  console.log(
    `.agents/skills/design-system written: ${Object.keys(FILES).length} files, ~${Math.ceil(bytes / 4)} tokens if a reader loads all of it (SKILL.md alone is ~${Math.ceil(skill.length / 4)}).`,
  )
}
