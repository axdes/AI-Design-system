/**
 * Scaffold a new component or block, correct by construction.
 *
 *   npm run new -- Name --level molecule --surface card --category actions \
 *                  --about "One sentence saying what it is for and when to reach for it."
 *
 * WHY THIS EXISTS. Adding one part means landing in eleven places: the folder,
 * Name.tsx, index.ts re-exporting every export, a first JSDoc sentence the
 * registry publishes, a golden example, levels.json, surfaces.json,
 * categories.json, a render-map fixture if it declares variants, a test, and
 * three regenerations. Nothing listed them together, so the way to learn them
 * was to run the 34-step gate, read the one failure it stops on, fix it, and
 * run again — eleven times, at about forty seconds each (measured 2026-08-26).
 * A gate is the wrong teacher: it says what is wrong, never what to do next.
 *
 * So this writes all of it. The point is not typing saved; it is that an agent
 * no longer has to KNOW the eleven, and a part cannot be half-registered.
 *
 * REMOVAL is the same eleven in reverse, and it is not hypothetical: three
 * parts were folded away on 2026-08-26 and each one meant hunting levels.json,
 * surfaces.json, categories.json, the render-map, the registry file and two
 * visual baselines by hand, with the gate finding what was missed one step at a
 * time. `--remove` does that pass.
 *
 *   npm run new -- Name --remove
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync, readdirSync, unlinkSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const argv = process.argv.slice(2)
const name = argv.find((a) => !a.startsWith('--'))
const flag = (k, d) => {
  const i = argv.indexOf('--' + k)
  return i === -1 ? d : argv[i + 1]
}

const LEVELS = ['atom', 'molecule', 'organism']
const SURFACES = ['page', 'region', 'card']
const cats = JSON.parse(readFileSync(join(ROOT, 'src/components/categories.json'), 'utf8'))
const CATEGORIES = Object.keys(cats.categories)

const die = (msg) => { console.error('✗ ' + msg); process.exit(1) }

const drop = (file, key, nested) => {
  const p = join(ROOT, file)
  const d = JSON.parse(readFileSync(p, 'utf8'))
  const target = nested ? d[nested] : d
  if (!(key in target)) return false
  delete target[key]
  writeFileSync(p, JSON.stringify(d, null, 2) + '\n')
  return true
}

if (argv.includes('--remove')) {
  if (!name) die('which part? npm run new -- Name --remove')
  let found = false
  for (const l of ['components', 'blocks']) {
    const d = join(ROOT, 'src', l, name)
    if (existsSync(d)) { rmSync(d, { recursive: true }); console.log(`✓ deleted src/${l}/${name}`); found = true }
  }
  if (!found) die(`no src/components/${name} and no src/blocks/${name}`)
  for (const [f, n] of [['src/components/levels.json'], ['src/components/surfaces.json'], ['src/components/categories.json', 'of']]) {
    if (drop(f, name, n)) console.log(`✓ removed from ${f.split('/').pop()}`)
  }
  const reg = join(ROOT, 'registry', `${name}.json`)
  if (existsSync(reg)) { unlinkSync(reg); console.log('✓ removed registry entry') }
  for (const sub of ['visual/baseline', 'visual/structure']) {
    const dir = join(ROOT, sub)
    if (!existsSync(dir)) continue
    for (const f of readdirSync(dir)) {
      if (f.startsWith(name + '.')) { unlinkSync(join(dir, f)); console.log(`✓ removed ${sub}/${f}`) }
    }
  }
  const agents = join(ROOT, 'AGENTS.md')
  const text = readFileSync(agents, 'utf8')
  const m = text.match(/(\d+) components you will not use/)
  if (m) writeFileSync(agents, text.replace(m[0], `${Number(m[1]) - 1} components you will not use`))
  console.log(`
Left for you, because a machine must not guess at them:
  1. Every caller. \`grep -rn "${name}" src apps\` — the typecheck finds the
     imports, prose mentions it will not.
  2. The render-map fixture, if it had one.
  3. Rules files that name it (screen-specs/*.json), and config/twins.json.
  4. npm run gen-registry && npm run gen:data && npm run llms && npm run check`)
  process.exit(0)
}

if (!name || !/^[A-Z][A-Za-z0-9]+$/.test(name)) {
  die('name must be PascalCase: npm run new -- MyThing --level molecule --surface card --category actions --about "…"')
}
const layer = flag('layer', 'components')
if (!['components', 'blocks'].includes(layer)) die('--layer is components or blocks')
const level = flag('level')
const surface = flag('surface')
const category = flag('category')
const about = flag('about')
if (!LEVELS.includes(level)) die(`--level is one of: ${LEVELS.join(' | ')}`)
if (!SURFACES.includes(surface)) die(`--surface is one of: ${SURFACES.join(' | ')} — what it is allowed to sit on`)
if (!CATEGORIES.includes(category)) die(`--category is one of: ${CATEGORIES.join(' | ')}`)
if (!about || about.length < 25) die('--about is required: one sentence saying what it is FOR and when to reach for it. The registry publishes it and an agent picks parts by it.')

const dir = join(ROOT, 'src', layer, name)
if (existsSync(dir)) die(`src/${layer}/${name} already exists`)

const kebab = name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()

mkdirSync(dir, { recursive: true })

writeFileSync(join(dir, `${name}.tsx`), `import './${name}.css'
import { type ReactNode } from 'react'
import { cn } from '../../lib/cn'

type Props = {
  /** Say what this slot is for, not what type it is. */
  children: ReactNode
  className?: string
}

/** ${about} */
export function ${name}({ children, className }: Props) {
  return <div className={cn('${kebab}', className)}>{children}</div>
}
`)

writeFileSync(join(dir, `${name}.css`), `.${kebab} {
  /* Tokens only — no raw px, no hex. \`npm run lint:css\` holds it. */
}
`)

writeFileSync(join(dir, 'index.ts'), `export { ${name} } from './${name}'\n`)

writeFileSync(join(dir, `${name}.example.tsx`), `/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { ${name} } from './${name}'

/* Say what the example is DEMONSTRATING — the decision a reader has to make,
 * not a restatement of the props. */
export function Example() {
  return <${name}>Replace this with what the part really holds.</${name}>
}
`)

writeFileSync(join(dir, `${name}.test.tsx`), `import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ${name} } from './${name}'

/* Test the PROMISE, not the markup: what would be broken for a reader if this
 * stopped working. A test that asserts a class name proves nothing. */
describe('${name}', () => {
  it('renders what it is given', () => {
    render(<${name}>Ada Meridian</${name}>)
    expect(screen.getByText('Ada Meridian')).toBeInTheDocument()
  })
})
`)

/* The three classification files, kept sorted so a diff shows one line. */
const put = (file, key, value, nested) => {
  const p = join(ROOT, file)
  const d = JSON.parse(readFileSync(p, 'utf8'))
  const target = nested ? d[nested] : d
  target[key] = value
  const sorted = Object.fromEntries(Object.entries(target).sort(([a], [b]) => a.localeCompare(b)))
  if (nested) d[nested] = sorted
  writeFileSync(p, JSON.stringify(nested ? d : sorted, null, 2) + '\n')
}
if (layer === 'components') {
  put('src/components/levels.json', name, level)
  put('src/components/surfaces.json', name, surface)
  put('src/components/categories.json', name, category, 'of')
}

/* The count in AGENTS.md is derived data written in prose, and `check:skills`
   fails on drift. Keeping it by hand is exactly the bookkeeping this script
   exists to remove, so it moves here rather than into a reader's memory. */
if (layer === 'components') {
  const agents = join(ROOT, 'AGENTS.md')
  const text = readFileSync(agents, 'utf8')
  const m = text.match(/(\d+) components you will not use/)
  if (m) writeFileSync(agents, text.replace(m[0], `${Number(m[1]) + 1} components you will not use`))
}

console.log(`✓ src/${layer}/${name} — tsx, css, index, example, test`)
if (layer === 'components') console.log('✓ classified in levels.json, surfaces.json, categories.json')
console.log(`
Next, in this order:
  1. Write the component. The JSDoc first sentence is its contract — it is what
     an agent reads to decide whether to reach for it.
  2. npm run gen-registry && npm run gen:data && npm run llms
  3. If it declares union props, add a fixture to src/specimens/render-map.tsx
     (the variant sheet photographs every value, and a contract test fails
     without it).
  4. npm run visual:update, then look at the picture. A green gate is not
     evidence a part looks right.
  5. npm run check`)
