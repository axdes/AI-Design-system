// The design system's gate. The rules themselves live in scripts/lint-rules/,
// shared with every app; this file is only what is TRUE OF THIS PACKAGE: where
// its code is, its accepted debt, and the structural rules that exist nowhere
// else (levels.json, surfaces.json, the atomic ladder, folder shape, golden
// examples). The component layer is FLAT, so a component's level is metadata
// read from src/components/levels.json, the same map the registry reads.
//
// Known, accepted debt is seeded in ALLOW below — each entry is a shrinkable
// marker: the gate stays green today and blocks NEW regressions. Fix the
// underlying issue, then drop its allow-list entry. Never weaken a rule.
//
// Run: node scripts/lint-rules.mjs   (wired into `npm run check` + the hooks)
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { runLintRules } from './lint-rules/run.mjs'

const ROOT = fileURLToPath(new URL('..', import.meta.url)).replace(/\/$/, '')
const read = (f) => readFileSync(f, 'utf8')

const LEVELS = JSON.parse(read(ROOT + '/src/components/levels.json'))
const SURFACES = JSON.parse(read(ROOT + '/src/components/surfaces.json'))
const SURFACE_VALUES = ['page', 'region', 'card']
const componentDirs = readdirSync(ROOT + '/src/components', { withFileTypes: true })
  .filter((d) => d.isDirectory()).map((d) => d.name)
const blockDirs = existsSync(ROOT + '/src/blocks')
  ? readdirSync(ROOT + '/src/blocks', { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name)
  : []

// ---- known, accepted current debt (shrink over time) -----------------------
const ALLOW = {
  // raw form controls live in these primitives / native-only spots (path substring)
  rawControls: [
    'components/Input/', 'components/Textarea/', 'components/Switch/',
    'components/Checkbox/', 'components/Radio/', 'components/Select/',
    'components/SearchInput/', 'components/ChatComposer/', 'components/Combobox/',
    'components/Slider/', 'components/NumberInput/', 'components/FileUpload/',
    'components/RangeSlider/', 'components/TimeInput/', 'components/TagInput/',
    'components/CommandPalette/', 'shell/ChatHistory/', 'layouts/Playground.tsx',
  ],
  // folders that hold a FAMILY of primitives sharing one stylesheet instead of a
  // single <Name>.tsx. Layout = Stack + Row + Grid.
  folderShape: ['Layout'],
  // dangerouslySetInnerHTML / console justified at these paths
  bannedConstructs: ['layouts/ContentDetailPage.tsx', 'lib/ErrorBoundary.tsx'],
  // reaching into a primitive's class+data contract from a page
  primitiveInternals: [],
  // dead value exports — DELETE these, then remove from here.
  //
  // Empty since `byDay` came out of it. That entry was the rule failing to see past the
  // package boundary, not accepted debt: the system exports it and teams-digest imports it
  // through @lib. Its recorded closing condition was "teach the rule to read the apps that
  // consume @lib", and that is what `consumerRoots` below plus the `@public` tag now do.
  deadExports: [],
  // dead CSS classes that are genuinely custom one-offs (NOT scale/series steps)
  deadCss: [],
  // over the size ceiling
  fileSize: [],
  /* @media widths that are deliberately NOT on the --bp-* scale, because the
   * layout breaks where its own content stops fitting rather than where a class
   * of device begins. Both were already carrying that reason in a comment; the
   * scale had no way to know, since a media query cannot read a token.
   *
   * 64rem — DetailPageTemplate goes side-by-side only once 22rem + 20rem columns
   *         and the gap fit, which lands between --bp-lg and --bp-xl.
   * 72rem — ChatShell drops the panel column, and AssistantPage hides the panel
   *         element itself. The two MUST agree, so the width is shared debt, not
   *         two independent choices. */
  breakpointScale: ['64rem', '72rem'],
  // <IconButton> not requiring a <Tooltip> wrapper. Playground is the demo
  // gallery (showing variants), where per-button tooltips would be noise.
  iconButtonTooltip: ['layouts/Playground.tsx'],
  // tonal primitives instead of semantic status roles. Empty: the migration is
  // complete. Re-add a path only with a written reason.
  tonalPrimitive: [],
  // static inline style objects. Playground is the demo gallery: it sizes demo
  // frames inline on purpose rather than inventing page classes for each spec.
  inlineStyle: ['layouts/Playground.tsx'],
  /* Counted strings whose wording does not change with the number: an
   * abbreviated unit ("3d ago"), or a bare figure in brackets. i18next renders
   * the flat key for every count, which is right; declaring six identical forms
   * would be six places to keep in step for nothing. */
  pluralForms: [
    'profile.activity.time.minutesAgo',
    'profile.activity.time.hoursAgo',
    'profile.activity.time.daysAgo',
    'profile.activity.time.weeksAgo',
  ],
  // components without a golden example. Empty: every canonical component and
  // block ships one. Keep it that way — an example is part of the component.
  noExample: [],
}

// ---- rules that only make sense for the design system itself ---------------

/** every component folder is classified in levels.json — without a level the
 *  registry falls back to "component" and the atomic-direction rule goes blind. */
function rLevelsComplete() {
  const out = []
  for (const name of componentDirs) {
    if (!LEVELS[name]) out.push(`src/components/levels.json:1  ${name} has no level — add "${name}": "atom" | "molecule" | "organism"`)
  }
  for (const name of Object.keys(LEVELS)) {
    if (!componentDirs.includes(name)) out.push(`src/components/levels.json:1  ${name} is classified but has no folder — delete the entry`)
  }
  return out
}

/** every component AND block declares its surface context, so the gallery can
 *  frame it and an agent knows WHERE it lives. Without it the entry silently
 *  defaults to card and may render on the wrong background.
 *
 *  Blocks are in scope because the default is worst for them: AdaptiveListPage
 *  shipped without an entry, so the registry told agents a full page template
 *  lives inside a card, and the gallery framed it on a white 44rem card, where
 *  its deliberately empty PageHeader became a grey bar and its borderless cards
 *  disappeared into the background. */
function rSurfacesComplete() {
  const out = []
  const owned = [...componentDirs, ...blockDirs]
  for (const name of owned) {
    const v = SURFACES[name]
    if (!v) out.push(`src/components/surfaces.json:1  ${name} has no surface context — add "${name}": "page" | "region" | "card"`)
    else if (!SURFACE_VALUES.includes(v)) out.push(`src/components/surfaces.json:1  ${name} has invalid context "${v}" — use page | region | card`)
  }
  for (const name of Object.keys(SURFACES)) {
    if (!owned.includes(name)) out.push(`src/components/surfaces.json:1  ${name} has a surface context but no folder — delete the entry`)
  }
  return out
}

/** atomic dependency direction on a FLAT tree: the level comes from levels.json,
 *  not from the path. Importing UP the ladder is forbidden; same-level imports
 *  are fine (IconButton→Icon, Select→Dropdown). */
function rImportDirection(c) {
  const RANK = { atom: 0, molecule: 1, organism: 2, block: 3, shell: 4, layout: 5 }
  const levelOf = (path) => {
    const m = path.match(/src\/components\/([^/]+)\//)
    if (m) return { name: m[1], rank: RANK[LEVELS[m[1]]] ?? RANK.organism }
    const b = path.match(/src\/blocks\/([^/]+)\//)
    if (b) return { name: b[1], rank: RANK.block }
    if (/src\/shell\//.test(path)) return { name: 'shell', rank: RANK.shell }
    if (/src\/layouts\//.test(path)) return { name: 'layouts', rank: RANK.layout }
    return null
  }
  const importedRank = (spec) => {
    const m = spec.match(/(?:^|\/)components\/([^/]+)/) || spec.match(/^\.\.\/([A-Z][^/]*)$/)
    if (m) return { name: m[1], rank: RANK[LEVELS[m[1]]] ?? RANK.organism }
    const b = spec.match(/(?:^|\/)blocks\/([^/]+)/)
    if (b) return { name: b[1], rank: RANK.block }
    if (/(?:^|\/)shell\//.test(spec)) return { name: 'shell', rank: RANK.shell }
    if (/(?:^|\/)layouts\//.test(spec)) return { name: 'layouts', rank: RANK.layout }
    return null
  }
  const out = []
  for (const f of c.usageFiles) {
    /* A golden example sits in the component's folder but speaks from the
     * CONSUMER's side (an IconButton example shows the required <Tooltip>). It is
     * never imported by the component, so the ladder does not apply to it. */
    if (c.exampleFile(f)) continue
    const self = levelOf(c.rel(f))
    if (!self) continue
    c.read(f).split('\n').forEach((ln, i) => {
      const im = ln.match(/^\s*import\b[^'"]*['"]([^'"]+)['"]/)
      if (!im) return
      const dep = importedRank(im[1])
      if (dep && dep.rank > self.rank) {
        out.push(`${c.rel(f)}:${i + 1}  ${self.name} imports "${im[1]}" (${dep.name}) — violates the atomic direction (atom < molecule < organism < block < shell < layout)`)
      }
    })
  }
  return out
}

/** every component/block folder ships the canonical trio: Name.tsx + index.ts.
 *  Without index.ts the import path in the registry is a lie. */
function rFolderShape(c) {
  const out = []
  const checkLayer = (layer, dirs) => {
    for (const name of dirs) {
      const dir = `${ROOT}/src/${layer}/${name}`
      if (!existsSync(`${dir}/${name}.tsx`) && !ALLOW.folderShape.includes(name)) {
        out.push(`src/${layer}/${name}:1  no ${name}.tsx — one component per folder, named after the folder`)
      }
      if (!existsSync(`${dir}/index.ts`)) {
        out.push(`src/${layer}/${name}:1  no index.ts — every folder re-exports through index.ts`)
        continue
      }
      /* Every component the folder defines must leave through index.ts, or the
       * registry advertises an export nobody can import. */
      const barrel = c.read(`${dir}/index.ts`)
      for (const src of readdirSync(dir).filter((n) => n.endsWith('.tsx') && !n.endsWith('.example.tsx'))) {
        for (const m of c.read(`${dir}/${src}`).matchAll(/^export\s+(?:function|const)\s+([A-Z][\w]*)/gm)) {
          if (!new RegExp(`\\b${m[1]}\\b`).test(barrel)) {
            out.push(`src/${layer}/${name}/index.ts:1  ${m[1]} (from ${src}) is not re-exported — consumers cannot import it`)
          }
        }
      }
    }
  }
  checkLayer('components', componentDirs)
  checkLayer('blocks', blockDirs)
  return out
}

/** every component/block ships a golden example. Examples are what the registry
 *  hands an agent, and a component with one is composed correctly far more often
 *  than one described only by its props. */
function rGoldenExample(c) {
  const out = []
  const registryPath = ROOT + '/component-registry.json'
  if (!existsSync(registryPath)) return ['component-registry.json:1  missing — run npm run gen-registry']
  const registry = JSON.parse(c.read(registryPath))
  const entries = { ...registry.components, ...registry.blocks }
  for (const [ref, entry] of Object.entries(entries)) {
    if (entry.status === 'deprecated') continue
    if (ALLOW.noExample.includes(ref)) continue
    if (!entry.example) {
      const layer = entry.level === 'block' ? 'blocks' : 'components'
      out.push(`src/${layer}/${ref}:1  no golden example — add src/${layer}/${ref}/${ref}.example.tsx (or use it in Playground so the registry can extract one)`)
    }
  }
  return out
}

/* The products that consume this package, for the dead-export rule only. They live in their
 * own git repositories and /apps/ is ignored here, so this list is routinely empty (a CI
 * checkout has none of it). That is handled where it matters: an absent consumer means the
 * claim cannot be checked, not that it is false. */
const APPS = `${ROOT}/../../apps`
const consumerRoots = existsSync(APPS)
  ? readdirSync(APPS, { withFileTypes: true })
      .filter((d) => d.isDirectory() && existsSync(`${APPS}/${d.name}/src`))
      .map((d) => `${APPS}/${d.name}/src`)
  : []

runLintRules({
  title: 'DS lint-rules',
  context: { root: ROOT, allow: ALLOW, fileSizeMax: 600, consumerRoots },
  rules: [
    'spacing/radius via tokens (no raw px)',
    'components use semantic status roles (no tonal primitives)',
    'logical properties for RTL (no left/right)',
    ['every component classified in levels.json', rLevelsComplete],
    ['every component and block has a surface context in surfaces.json', rSurfacesComplete],
    ['atomic import direction', rImportDirection],
    'no raw form controls outside primitives',
    'icon-only buttons have aria-label',
    'icon-only buttons wrapped in <Tooltip>',
    'no reaching into primitive class+data contract',
    'no banned runtime constructs',
    'no static inline styles',
    'inner screens offer a way back',
    'destructive actions confirm first',
    'counted strings have every plural form',
    ['component folder shape (Name.tsx + index.ts)', rFolderShape],
    ['every component has a golden example', rGoldenExample],
    'no dead value exports',
    'no dead CSS classes',
    'media queries on the declared breakpoint scale',
    'files within the size ceiling',
  ],
})
