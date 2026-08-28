#!/usr/bin/env node
/**
 * The system, published in the format people actually install from.
 *
 * `npx shadcn add <url>` is how a component reaches a project in 2026, and it is
 * one of the five signals the field is measured on (designsystems.one audited 37
 * systems: twenty ship none of them, the leader ships three, nobody ships four).
 * We ship the MCP server, llms.txt and DTCG tokens already. This is the fourth,
 * and unlike the other three it is not for agents — it is the only thing that
 * turns "I saw this" into "it is in my project".
 *
 * WHAT MAKES IT WORK WITHOUT REWRITING THE SYSTEM. Our components import each
 * other relatively (`../Icon`) and that would normally break on install. It does
 * not here, because every item targets `@ui/<Name>/` and ships its `index.ts`:
 * from `ui/Card/Card.tsx`, `../Icon` resolves to `ui/Icon/index.ts`, which is
 * exactly where the Icon item put itself. The folder shape IS the contract, and
 * `component folder shape (Name.tsx + index.ts)` in the linter is what keeps it
 * true. `../../lib/*` becomes `../lib/*` and the lib ships INSIDE the ui folder,
 * for the same reason: a relative path that resolves here resolves there, and
 * nothing has to agree with a project's aliases. Writing `@/lib/cn` instead was
 * tried first and the CLI put the file in `src/@/lib/` and rewrote the import to
 * `@/@/lib/cn` — an alias is a negotiation, a relative path is not.
 *
 * WHAT IT DOES NOT DO. It does not turn this into a copy-paste system. The rules,
 * the gate and the decision layers stay here; what installs is the code and its
 * tokens. Somebody who takes three components gets three components that behave,
 * and the reason to come back for the rest is that they behave together.
 *
 *   npm run gen:shadcn          write r/
 *   npm run gen:shadcn -- --check   fail if r/ is out of step with src/
 */
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync, rmSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'

const ROOT = fileURLToPath(new URL('..', import.meta.url)).replace(/\/$/, '')
const OUT = `${ROOT}/r`
const RED = '\x1b[31m', GREEN = '\x1b[32m', DIM = '\x1b[2m', BOLD = '\x1b[1m', OFF = '\x1b[0m'
const check = process.argv.includes('--check')

const HOME = 'https://github.com/axdes/AI-Design-system'
/* A bare name in `registryDependencies` means a shadcn/ui component, so ours have
   to be absolute URLs — the CLI went looking for `design-tokens` on ui.shadcn.com
   and rightly did not find it. DS_REGISTRY_BASE overrides the published address so
   the install can be tested against a local server rather than against a commit
   that has not happened yet. */
const BASE = process.env.DS_REGISTRY_BASE ?? 'https://raw.githubusercontent.com/axdes/AI-Design-system/main/r'

const registry = JSON.parse(readFileSync(`${ROOT}/component-registry.json`, 'utf8'))

/** shadcn names items in kebab-case; ours are PascalCase folders. */
const slug = (name) => name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').replace(/([A-Z])([A-Z][a-z])/g, '$1-$2').toLowerCase()

/* The npm packages a source file really imports. `react` is a peer of any React
   project and is left out on purpose; the other three are ours to declare. */
const PACKAGES = ['react-i18next', 'lucide-react', 'react-dom']
const packagesIn = (src) => PACKAGES.filter((p) => new RegExp(`from ["']${p}["']`).test(src))

/* One rewrite, and it keeps everything relative: our lib sits two levels up here
   and one level up there, because it installs inside the ui folder beside the
   components. Every `../OtherComponent` is left exactly as written. */
const rewrite = (src) => src.replace(/(from ["'])\.\.\/\.\.\/lib\//g, '$1../lib/')
const libsIn = (src) => [...src.matchAll(/from ["']\.\.\/\.\.\/lib\/([\w.]+)["']/g)].map((m) => m[1])

/* Source only, by extension. A backup left behind by an interrupted run —
   `Badge.tsx.gaterb` — shipped as a component file and put the registry out of
   step with itself (2026-08-28). What belongs to a component is what a consumer
   would import, and that is a closed set. */
const filesOf = (dir) => readdirSync(dir)
  .filter((f) => /\.(tsx?|css)$/.test(f) && !/\.(test|example)\.tsx$/.test(f))

const items = []
const libNeeded = new Set()

/* ── one item per component ─────────────────────────────────────────────── */
for (const [ref, entry] of Object.entries(registry.components)) {
  if (entry.status === 'deprecated') continue
  const dir = `${ROOT}/src/components/${ref}`
  if (!existsSync(dir)) continue

  const files = []
  const deps = new Set()
  for (const f of filesOf(dir)) {
    const src = readFileSync(join(dir, f), 'utf8')
    for (const p of packagesIn(src)) deps.add(p)
    for (const l of libsIn(src)) libNeeded.add(l)
    files.push({ path: `src/components/${ref}/${f}`, content: rewrite(src), type: 'registry:ui', target: `@ui/${ref}/${f}` })
  }
  if (!files.length) continue

  /* What this component IMPORTS, read from its own source — not `entry.uses`,
     which is computed from the golden example too and so says <Layout> composes
     <Button> and <Card> because its example arranges them. Installing Badge
     pulled nine components on that reading (2026-08-27). An install has to bring
     what the code needs and nothing else. The token item is the one addition: a
     component whose custom properties are undefined renders as unstyled markup,
     which is worse than not installing it. */
  const uses = [...new Set(files.flatMap((f) => [...f.content.matchAll(/from ["']\.\.\/([A-Z][\w]*)["']/g)].map((m) => m[1])))]
    .filter((u) => registry.components[u])
  items.push({
    $schema: 'https://ui.shadcn.com/schema/registry-item.json',
    name: slug(ref),
    type: 'registry:ui',
    title: entry.main ?? ref,
    description: String(entry.description ?? '').replace(/\s+/g, ' ').trim().slice(0, 400),
    dependencies: [...deps].sort(),
    registryDependencies: ['design-tokens', ...uses.map(slug)].sort().map((n) => `${BASE}/${n}.json`),
    files,
    docs: `Part of the AI Design System. Its full contract — every prop, its allowed values and what each one means — is at ${HOME}/blob/main/registry/${ref}.json`,
    categories: entry.category ? [entry.category] : undefined,
  })
}

/* ── the lib the components reach for ───────────────────────────────────── */
const libFiles = [...libNeeded].sort().map((l) => {
  for (const ext of ['.ts', '.tsx']) {
    const p = `${ROOT}/src/lib/${l}${ext}`
    if (existsSync(p)) return { path: `src/lib/${l}${ext}`, content: rewrite(readFileSync(p, 'utf8')), type: 'registry:lib', target: `@ui/lib/${l}${ext}` }
  }
  return null
}).filter(Boolean)

/* ── the tokens, which every component needs before it looks like anything ─ */
const tokenFiles = ['settings.css', 'primitives.css', 'semantic.css', 'utilities.css'].map((f) => ({
  path: `styles/${f}`,
  content: readFileSync(`${ROOT}/styles/${f}`, 'utf8'),
  type: 'registry:file',
  target: `~/styles/ds/${f}`,
}))

/* Every component imports its own stylesheet, and TypeScript in a project that
   does not already pull in `vite/client` has no idea what a .css module is: five
   errors on a clean install, before a line of the consumer's own code. Shipping
   the declaration costs four lines and is the difference between "it compiles"
   and "it nearly compiles". */
const cssTypes = {
  path: 'r/css.d.ts',
  content: `/* Design-system components import their own stylesheet. Bundlers handle this;
 * TypeScript needs telling once. Delete this file if your setup already declares it
 * (Vite's \`vite/client\`, Next's \`next-env.d.ts\`). */
declare module '*.css'
`,
  type: 'registry:file',
  target: '@ui/css.d.ts',
}

items.unshift({
  $schema: 'https://ui.shadcn.com/schema/registry-item.json',
  name: 'design-tokens',
  type: 'registry:file',
  title: 'Design tokens',
  description:
    'The three token tiers every component reads: settings (the choices), primitives (the values) ' +
    'and semantic (the roles). Import them once, at the top of your global stylesheet, before any ' +
    'component CSS. Both themes are here — the dark one is not an inversion, it is its own set.',
  files: [...tokenFiles, ...libFiles, cssTypes],
  docs: 'Add `@import "./styles/ds/settings.css";` (then primitives, semantic, utilities) to your global CSS. Every component below reads its colours, spacing and radii from these and from nothing else.',
})

/* ── the index ──────────────────────────────────────────────────────────── */
const index = {
  $schema: 'https://ui.shadcn.com/schema/registry.json',
  name: 'ai-design-system',
  homepage: HOME,
  items: items.map((i) => ({ name: i.name, type: i.type, title: i.title, description: i.description })),
}

const written = new Map()
written.set('registry.json', JSON.stringify(index, null, 2) + '\n')
for (const item of items) {
  for (const k of Object.keys(item)) if (item[k] === undefined || (Array.isArray(item[k]) && !item[k].length)) delete item[k]
  written.set(`${item.name}.json`, JSON.stringify(item, null, 2) + '\n')
}

if (check) {
  const problems = []
  for (const [name, content] of written) {
    const p = `${OUT}/${name}`
    if (!existsSync(p)) { problems.push(`r/${name} is missing`); continue }
    if (readFileSync(p, 'utf8') !== content) problems.push(`r/${name} is out of step with src/`)
  }
  const extra = existsSync(OUT) ? readdirSync(OUT).filter((f) => f.endsWith('.json') && !written.has(f)) : []
  for (const f of extra) problems.push(`r/${f} is for something that no longer exists`)
  if (problems.length) {
    console.error(`${RED}✗ the installable registry is out of date:${OFF}`)
    for (const p of problems.slice(0, 8)) console.error(`    ${p}`)
    if (problems.length > 8) console.error(`    ${DIM}… and ${problems.length - 8} more${OFF}`)
    console.error(`  ${DIM}Run \`npm run gen:shadcn\` and commit r/.${OFF}`)
    process.exit(1)
  }
  console.log(`${GREEN}✓ r/ matches src/${OFF} ${DIM}(${items.length} installable item(s))${OFF}`)
  process.exit(0)
}

rmSync(OUT, { recursive: true, force: true })
mkdirSync(OUT, { recursive: true })
for (const [name, content] of written) writeFileSync(`${OUT}/${name}`, content)

const bytes = [...written.values()].reduce((n, c) => n + c.length, 0)
console.log(`${BOLD}Installable registry${OFF}`)
console.log(`  ${items.length} item(s), ${Math.round(bytes / 1024)} KB in r/`)
console.log(`  ${DIM}npx shadcn@latest add ${BASE}/button.json${OFF}`)
console.log(`${GREEN}✓ wrote r/${OFF}`)
