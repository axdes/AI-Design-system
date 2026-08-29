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
const CATEGORIES = JSON.parse(read(ROOT + '/src/components/categories.json'))
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
    /* Same split as Checkbox and Radio: the tile the reader sees is a card, the
     * control the browser and the screen reader see is a real radio or
     * checkbox. That is what gives it the arrow keys of a radio group and a
     * value in a form, and it is why the input has to be raw here. */
    'components/SelectableTile/',
    /* The cell editor inside a virtualised grid. The reason is the component's
       own, written beside the element: a cell editor has to open, commit and
       hand focus back WITHOUT a portal of its own, which is exactly what
       <Select> brings. Recorded here rather than left to fail, because the
       argument was already made in the code and only the recording was
       missing (2026-08-26). Reopens if DataGrid stops virtualising, or if
       <Select> learns an inline, portal-free mode. */
    'components/DataGrid/',
  ],
  // folders that hold a FAMILY of primitives sharing one stylesheet instead of a
  // single <Name>.tsx. Layout = Stack + Row + Grid.
  folderShape: ['Layout'],
  // dangerouslySetInnerHTML / console justified at these paths
  bannedConstructs: ['layouts/ContentDetailPage.tsx', 'lib/ErrorBoundary.tsx'],
  // reaching into a primitive's class+data contract from a page
  primitiveInternals: [],
  // fields whose purpose the browser knows but autocomplete would be wrong for
  // (a demo credential picker, a code entry that is not a one-time code)
  autocomplete: [],
  // dead value exports — DELETE these, then remove from here.
  //
  // Empty since `byDay` came out of it. That entry was the rule failing to see past the
  // package boundary, not accepted debt: the system exports it and an app imports it
  // through @lib. Its recorded closing condition was "teach the rule to read the apps that
  // consume @lib", and that is what `consumerRoots` below plus the `@public` tag now do.
  deadExports: [],
  // dead CSS classes that are genuinely custom one-offs (NOT scale/series steps)
  /* `.app-shell` is emitted by the shell that composes this menu, and that shell
   * lives in the app now (apps/showcase). The rule reads this package only, so a
   * class this package styles for a context it no longer renders looks dead.
   * Closes when the contextual override moves to whoever owns the shell. */
  deadCss: ['app-shell'],
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
  /* Examples that render one instance and carry no axis to show. This list is
     WORK, not policy: each entry is an example nobody has written yet, and it
     only shrinks. 76 of 131 on 2026-08-27, when the rule was written; 59 by the
     next day. The ones taken off first are the ones an agent and a reader meet
     most: Button, Badge, Select, EmptyState, Tabs, then Icon, Tooltip,
     IconButton, Input, MetaItem, Chip, Spinner, Descriptions. Take a name off this list by rewriting its
     example, never by adding one back. */
  flatExample: [
    'Accordion', 'AppLayout', 'AvatarGroup', 'BarChart', 'BrandMark', 'ButtonGroup',
    'Calendar', 'ChatMessage', 'ColorSwatch', 'Combobox', 'CopyButton', 'CountBadge',
    'DateBlock', 'DatePicker', 'DateRangePicker', 'Divider', 'DonutChart', 'ExpandButton',
    'Identity', 'InlineText', 'InputGroup', 'Kbd', 'Label', 'LineChart', 'Link', 'ListItem',
    'LoadMore', 'LogoWall', 'MenuButton', 'MenuIconButton', 'Meter', 'NumberInput',
    'PasswordInput', 'PivotTable', 'Quote', 'Radio', 'Rating', 'RichMessage', 'SectionLabel',
    'SessionPill', 'SetupGuide', 'SideNav', 'SidePanel', 'Stat', 'Thumbnail', 'Time',
    'TimeInput', 'Truncate', 'AuthTemplate', 'Page', 'SystemPageTemplate', 'WizardTemplate'
  ],
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

/** Every part says what it is FOR, so a person can find it by the question they
 *  arrived with. levels.json and surfaces.json answer build-time questions; this
 *  answers the reader's. Same shape as the two beside it: a missing entry and a
 *  stale one are both failures, because a classification with holes is one
 *  nobody can group by. */
function rCategoriesComplete() {
  const out = []
  const owned = [...componentDirs, ...blockDirs]
  const known = Object.keys(CATEGORIES.categories ?? {})
  for (const name of owned) {
    const v = CATEGORIES.of?.[name]
    if (!v) out.push(`src/components/categories.json:1  ${name} has no category — add "${name}": ${known.join(' | ')}`)
    else if (!known.includes(v)) out.push(`src/components/categories.json:1  ${name} has invalid category "${v}" — use ${known.join(' | ')}`)
  }
  for (const name of Object.keys(CATEGORIES.of ?? {})) {
    if (!owned.includes(name)) out.push(`src/components/categories.json:1  ${name} has a category but no folder — delete the entry`)
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
/**
 * A golden example shows the CHOICE, not just the component.
 *
 * `rGoldenExample` above asks whether an example exists. It always did, for all
 * 131 — and 71 of them rendered the component exactly once and said nothing
 * about when to reach for which variant (measured 2026-08-27). `<Button>Save`
 * is not an example of Button; it is a screenshot of one. The reader — a person
 * scanning the site, or an agent reading `entry.example` in the registry —
 * learns that the component exists and nothing about the decision it carries.
 *
 * So: a component whose contract publishes a UNION prop has an axis, and its
 * example has to show at least two values on some axis. A component with no
 * union (Spinner, Divider, Prose) has nothing to choose and is exempt by
 * construction, not by an entry in a list.
 *
 * The second half is the sentence. A comment above `Example` that names the
 * decision is what turns a variant sheet into teaching; the boilerplate header
 * the scaffold writes does not count.
 */
function rExampleShowsTheChoice(c) {
  const out = []
  const registryPath = ROOT + '/component-registry.json'
  if (!existsSync(registryPath)) return []
  const registry = JSON.parse(c.read(registryPath))
  const entries = { ...registry.components, ...registry.blocks }
  for (const [ref, entry] of Object.entries(entries)) {
    if (entry.status === 'deprecated') continue
    if (ALLOW.flatExample.includes(ref)) continue
    const layer = entry.level === 'block' ? 'blocks' : 'components'
    const file = `${ROOT}/src/${layer}/${ref}/${ref}.example.tsx`
    if (!existsSync(file)) continue
    const src = c.read(file)
    const at = src.indexOf('export function Example')
    if (at === -1) continue

    /* The axes this component actually has, from its own published contract. */
    const unions = (entry.props ?? []).filter((p) => (p.values ?? []).length > 1)
    if (unions.length) {
      const body = src.slice(at)
      /* Any of the entry's EXPORTS, not just its main one. <Layout> ships Grid,
         GridItem, Row and Stack; its example varies `gap` across Stack and Row
         and was read as showing no axis because both <Grid> tags happened to
         agree (2026-08-28). A compound teaches on whichever part carries the
         decision. */
      const tags = [entry.main ?? ref, ...(entry.exports ?? [])].filter(Boolean)
      const shown = unions.some((p) => {
        const used = new Set([
          ...[...body.matchAll(new RegExp(p.name + '="([^"]+)"', 'g'))].map((m) => m[1]),
          ...[...body.matchAll(new RegExp(p.name + '=\\{([^}]+)\\}', 'g'))].map((m) => m[1]),
        ])
        /* A prop left off is its default, which is a second value on that axis. */
        return used.size >= 2 || (used.size === 1 && tags.some((tag) => new RegExp('<' + tag + '\\b(?![^>]*' + p.name + '=)').test(body)))
      })
      if (!shown) {
        out.push(`src/${layer}/${ref}/${ref}.example.tsx:1  shows one instance and no axis — render ${unions[0].name} at two of its values (${(unions[0].values ?? []).slice(0, 3).join(' | ')}…) so the example teaches the choice`)
        continue
      }
    }
    /* ANYWHERE in the file, not only above the function: <Card> teaches its whole
       anatomy in a comment INSIDE Example, which is the right place for it and
       was read as no explanation at all (2026-08-27). */
    const prose = src.replace(/\/\* Golden example[\s\S]*?\*\//, '')
    if (!/\/\*[\s\S]{80,}?\*\//.test(prose)) {
      out.push(`src/${layer}/${ref}/${ref}.example.tsx:1  no sentence saying what the reader has to decide — one comment above Example, about the CHOICE and not the props`)
    }
  }
  return out
}

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
    'a status fill is not a status ink',
    'logical properties for RTL (no left/right)',
    ['every component classified in levels.json', rLevelsComplete],
    ['every component and block has a surface context in surfaces.json', rSurfacesComplete],
    ['every component and block has a category in categories.json', rCategoriesComplete],
    ['atomic import direction', rImportDirection],
    'stacks, rows and grids come from the system',
    'no raw form controls outside primitives',
    'known-purpose fields carry autocomplete',
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
    ['a golden example shows the choice, not just the component', rExampleShowsTheChoice],
    'no dead value exports',
    'no dead CSS classes',
    'a part that takes words says what words',
    'media queries on the declared breakpoint scale',
    'files within the size ceiling',
  ],
})
