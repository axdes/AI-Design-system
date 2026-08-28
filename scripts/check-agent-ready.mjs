#!/usr/bin/env node
/**
 * The five signals the field is measured on, held as a local invariant.
 *
 * designsystems.one audits design systems for agent-readiness on five things a
 * maintainer has to publish first-party: an MCP server, `/llms.txt`, tokens in
 * W3C DTCG form, a registry installable with `npx shadcn add`, and Figma Code
 * Connect mappings. Of 37 systems audited to June 2026, twenty shipped none,
 * the highest score was three, and nobody had four.
 *
 * We have four. That is worth exactly nothing as a fact about today, because
 * every one of them is a file somebody could delete in a refactor with the whole
 * gate staying green: `llms.txt` is generated, `r/` is generated, the MCP server
 * is one folder, and the DTCG export is a build product. An external standard
 * nobody checks locally is a standard you meet until the first Tuesday you do
 * not.
 *
 * So the measure moves inside. This does not check that the artefacts are GOOD —
 * `llms:check`, `gen:shadcn:check` and `tokens:check` do that, each against the
 * source it derives from. It checks that they still EXIST and still say what
 * they are, which is the question an outside auditor asks.
 *
 *   npm run check:agent-ready
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('..', import.meta.url)).replace(/\/$/, '')
const RED = '\x1b[31m', GREEN = '\x1b[32m', DIM = '\x1b[2m', BOLD = '\x1b[1m', YEL = '\x1b[33m', OFF = '\x1b[0m'

const read = (p) => (existsSync(`${ROOT}/${p}`) ? readFileSync(`${ROOT}/${p}`, 'utf8') : null)

const has = (dir, test) => {
  if (!existsSync(`${ROOT}/${dir}`)) return false
  const walk = (d) => readdirSync(d).some((n) => {
    const p = `${d}/${n}`
    return statSync(p).isDirectory() ? walk(p) : test(n)
  })
  return walk(`${ROOT}/${dir}`)
}

const SIGNALS = [
  {
    name: 'MCP server',
    what: 'a stdio or HTTP Model Context Protocol server an agent can register',
    check: () => {
      const src = read('mcp/server.mjs')
      if (!src) return 'mcp/server.mjs is gone'
      if (!/tools\/list|tools\/call/.test(src)) return 'mcp/server.mjs no longer answers the tool protocol'
      return true
    },
  },
  {
    name: 'llms.txt',
    what: 'the same knowledge as text, for tools that cannot call the registry',
    check: () => {
      const src = read('llms.txt')
      if (!src) return 'llms.txt is gone'
      if (src.length < 2000) return `llms.txt is ${src.length} bytes — too small to be the system`
      return true
    },
  },
  {
    name: 'DTCG tokens',
    what: 'tokens in W3C Design Tokens Community Group form ($value / $type)',
    check: () => {
      const src = read('tokens/design.tokens.json')
      if (!src) return 'tokens/design.tokens.json is gone'
      if (!src.includes('"$value"') || !src.includes('"$type"')) return 'the export is no longer DTCG-shaped'
      return true
    },
  },
  {
    name: 'installable registry',
    what: 'items a stranger can install with `npx shadcn add <url>`',
    check: () => {
      const src = read('r/registry.json')
      if (!src) return 'r/registry.json is gone — nothing is installable'
      const index = JSON.parse(src)
      if (!String(index.$schema).includes('ui.shadcn.com')) return 'r/registry.json no longer declares the shadcn schema'
      if (!(index.items ?? []).length) return 'the registry index lists no items'
      return true
    },
  },
  {
    name: 'Figma Code Connect',
    what: 'Code Connect mappings (`*.figma.tsx`) published alongside the components',
    check: () => (has('src', (n) => n.endsWith('.figma.tsx')) ? true : 'not shipped'),
    /* The one we do not have, and it is not an oversight: Code Connect binds a
       component to a Figma node, and these components have no Figma side. It is
       named here rather than dropped, so the score is honest and the gap has a
       place to be filled. */
    optional: true,
  },
]

console.log(`${BOLD}Agent-ready${OFF} ${DIM}the five signals design systems are audited on${OFF}\n`)

const failures = []
let held = 0
for (const s of SIGNALS) {
  const verdict = s.check()
  if (verdict === true) { held++; console.log(`  ${GREEN}✓${OFF} ${s.name.padEnd(22)}${DIM}${s.what}${OFF}`); continue }
  if (s.optional) { console.log(`  ${YEL}—${OFF} ${s.name.padEnd(22)}${DIM}${verdict}${OFF}`); continue }
  failures.push(`${s.name}: ${verdict}`)
  console.log(`  ${RED}✗${OFF} ${s.name.padEnd(22)}${DIM}${verdict}${OFF}`)
}

const required = SIGNALS.filter((s) => !s.optional).length
console.log(`\n  ${held} of ${SIGNALS.length} signal(s) shipped ${DIM}(${required} of them required here)${OFF}`)

if (failures.length) {
  console.error(`\n${RED}✗ a signal this system had has stopped shipping:${OFF}`)
  for (const f of failures) console.error(`    ${f}`)
  console.error(`\n  ${DIM}Each of these is one generated file or one folder, which is exactly why`)
  console.error(`  losing one is silent. Restore it, or take it out of this list on purpose.${OFF}`)
  process.exit(1)
}
console.log(`${GREEN}✓ every signal this system claims is still shipping.${OFF}`)
