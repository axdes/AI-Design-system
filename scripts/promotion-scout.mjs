// Promotion scout: what belongs in the design system but is sitting in an app.
//
// The whole point of a shared system is that a thing built once is available
// everywhere. The failure mode is quiet: someone needs a pill, a page skeleton,
// a provider, builds it inside their app because that is the shortest path, and
// the next app builds it again. Nothing is red, nothing is broken, and the
// system slowly stops being the place where components live.
//
// Nothing off the shelf catches that. `jscpd` sees copy-paste but not intent;
// `knip` sees dead code but not code that should have been shared. So this asks
// three questions the other tools cannot:
//
//   1. DUPLICATED — the same code exists in two packages. Evidence, not taste:
//      if it was worth copying it was worth promoting.
//   2. PARALLEL — the same component name exists in two or more apps and NEITHER
//      copy delegates to the design system. Two teams solved one problem twice.
//   3. UNCONSUMED — a design-system block or shell part that no app imports.
//      Reported, never failed: a library may ship ahead of demand. But a
//      template nobody uses while apps hand-roll page chrome is the exact
//      inversion this scout exists to surface, so it stays visible.
//
// Same discipline as the linter and the audit gate: every known finding needs a
// written reason and a condition that ends it. Anything unrecorded fails.
// Shrink ACCEPTED; never widen it to clear red.
//
// Run: node scripts/promotion-scout.mjs [--fast]   (--fast skips the clone scan)
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../../..', import.meta.url)).replace(/\/$/, '')
const APPS = join(ROOT, 'apps')
const DS = join(ROOT, 'packages/design-system')

/* Apps carry their own git repositories and the design system also ships as a
 * vendored snapshot inside airun's archive. Both are checkouts with no `apps/`
 * next to them, and there is nothing cross-package to compare there. */
if (!existsSync(APPS)) {
  console.log('promotion-scout: no apps/ next to this checkout — nothing to compare.')
  process.exit(0)
}

/* Reasons live per LAYER, because "salim copied a screen" and "salim copied a
 * provider" are different decisions. The keys below are per PAIR so that a new
 * app copying the same layer still has to be looked at once. Sorted pair name +
 * ':' + first path segment under src/ — exactly what the grouping produces.
 * Reviewed 2026-07-29. */
const LAYOUTS = {
  why:
    'The design system owns these screens as its SHOWCASE (ContentLibraryPage, ' +
    'ContentDetailPage, AssistantPage, ProfilePage, LoginPage, Playground) and the ' +
    'apps were ported from them, then diverged into products. What still matches is ' +
    'page chrome: header, toolbar, empty state, the auth card. That part IS ' +
    'promotable and the blocks already exist (ListPageTemplate, DetailPageTemplate, ' +
    'AuthTemplate) — they are simply not adopted yet. This is the largest open ' +
    'promotion in the repo, ~2000 lines, and it is named rather than hidden.',
  recheck:
    'Shrinks as each app screen is rebuilt on a block. Delete a pair here when its ' +
    'number reaches zero; the "used by no app" section below is the same debt seen ' +
    'from the other end.',
}
const FIXTURES = {
  why:
    'Demo fixtures (mockContent, activity, roster rows). Copying a fixture is ' +
    'correct: a shared one would make one app\'s demo data a dependency of another\'s, ' +
    'and fixtures are supposed to drift towards their product.',
  recheck: 'None. Fixtures are meant to diverge.',
}
const PROVIDERS = {
  why:
    'The identical parts were already consolidated: ThemeProvider, ToastProvider, ' +
    'SidebarProvider, ErrorBoundary, cn and useMediaQuery are three-line re-exports ' +
    'of @lib in every app. What jscpd still matches is AuthProvider and the i18n ' +
    'bootstrap, and those genuinely differ per product (airun has no accounts at ' +
    'all, salim carries demo credentials, workshops reads a server session). The ' +
    'shape repeats because the React context idiom repeats.',
  recheck:
    'Revisit if a second app ever wants the SAME auth model; until then a shared ' +
    'AuthProvider would be a union of three unrelated login stories.',
}
const SHELLS = {
  why:
    'App shells. Each AppShell composes ITS chrome (salim: top bar plus the call ' +
    'affordances; workshops: sidebar plus recording pill; airun: sidebar plus CLI ' +
    'switcher), so the JSX differs. What matches is the grid CSS pinning a shell to ' +
    'the viewport with one scrolling column, which is four short rules.',
  recheck:
    'Promote when a third app needs the same grid unchanged: at that point it is a ' +
    'layout primitive and belongs in the components layer, not copied a fourth time.',
}
const PAGE_WRAPPER = {
  why:
    'The page wrapper rules (width cap, fluid padding, the `content` container ' +
    'query) restated in ListPageTemplate.css. They already existed FOUR times, ' +
    'token-identical, once inside each app\'s own AppShell.css and once in the ' +
    'design system\'s, because `.page-content` is a convention rather than a ' +
    'foundation class. A block cannot borrow it: it would depend on a stylesheet ' +
    'it does not import, and rendered on its own it loses its padding entirely ' +
    '(the visual gallery caught exactly that). So the block owns its wrapper and ' +
    'this is the fifth copy, knowingly.',
  recheck:
    'Closes when `.page-content` moves into the token foundation that every app ' +
    'loads, and the four AppShell copies plus this one all delete. That is a ' +
    'four-repository change, so it is named here rather than smuggled in.',
}
const BOOTSTRAP = {
  why:
    'App.tsx: the route table written as `lazy(() => import(x).then(m => ({default: ' +
    'm.X})))`, once per screen. Every line names a different module, so nothing here ' +
    'is shareable code — it is a language idiom that a token-based detector cannot ' +
    'tell apart from a copy. The provider stack around it is already shared via @lib.',
  recheck: 'None. Extracting this would trade explicit routing for indirection.',
}
const HARNESS = {
  why:
    'Test harness boilerplate (axe wiring, jsdom polyfills). PROMOTED 2026-08-20, ' +
    'in the vendor-ds idiom rather than as an import: the canonical files live in ' +
    'src/test/harness/ and every app carries a byte-identical copy, so each suite ' +
    'still runs standalone in its own clone. check:harness in this gate fails on ' +
    'drift, which was the only real cost of copying.',
  recheck:
    'None — the copies are checked. Reopens only if an app needs a DIFFERENT ' +
    'harness behaviour, which is an argument to add to the canonical one.',
}



const ACCEPTED = {
  'design-system↔salim:layouts': LAYOUTS,
  'design-system↔workshops:layouts': LAYOUTS,
  'airun↔design-system:layouts': LAYOUTS,
  'salim↔workshops:layouts': LAYOUTS,
  'airun↔workshops:layouts': LAYOUTS,
  'salim↔transcript:layouts': LAYOUTS,
  'design-system↔salim:data': FIXTURES,
  'salim↔workshops:data': FIXTURES,
  'design-system↔salim:lib': PROVIDERS,
  'airun↔design-system:lib': PROVIDERS,
  'airun↔salim:lib': PROVIDERS,
  'airun↔workshops:lib': PROVIDERS,
  'salim↔workshops:lib': PROVIDERS,
  /* Surfaced 2026-08-21 when the demo e-mail domains changed in the system's
     AuthProvider: the edit moved jscpd's chunk boundaries and the pair started
     matching on the shared login/logout logic. Same copies, same one decision. */
  'design-system↔workshops:lib': PROVIDERS,
  'design-system↔workshops:components': SHELLS,
  'salim↔workshops:components': SHELLS,
  'airun↔workshops:components': SHELLS,
  /* airun's PAGE_WRAPPER pairs deleted 2026-08-21: the cockpit moved onto
     OverviewPageTemplate (which owns its wrapper), airun's `.page-content`
     shell rule went with it, and jscpd stopped matching those pairs. The same
     restated-wrapper story continues below between the system and salim, where
     the copies are still live — the group merely regrouped when airun's copy
     disappeared. */
  'design-system↔salim:components': PAGE_WRAPPER,
  'design-system↔salim:App': BOOTSTRAP,
  'design-system↔workshops:App': BOOTSTRAP,
  'salim↔workshops:App': BOOTSTRAP,
  /* salim↔workshops/transcript/teams-digest:test entries deleted 2026-08-20:
     jscpd no longer matches those pairs (salim's harness drifted apart), and a
     stale exception hides the next real finding. The HARNESS story continues on
     the admin-portal pairs below, where the clones are still live. */
  /* admin-portal (2026-08-20) carries the same harness for the same reason, plus the
     matchMedia/ResizeObserver stubs FilterBar needs under jsdom. Fifth copy; the
     count is now loud enough that if ONE more app appears, promoting the harness
     into a shared test package beats a sixth copy even at the coupling cost. */
  /* The 2026-08-20 promotion made every copy byte-identical, which is why the
     pair list GREW: jscpd now matches pairs that had drifted apart before. All
     of them are the same one decision. */
  'admin-portal↔airun:test': HARNESS,
  'admin-portal↔design-system:test': HARNESS,
  'admin-portal↔salim:test': HARNESS,
  'admin-portal↔workshops:test': HARNESS,
  'admin-portal↔teams-digest:test': HARNESS,
  'admin-portal↔transcript:test': HARNESS,
  /* handbook (2026-08-20) is the sixth app to carry the harness. The count was
     already called loud at five; one more appeared before anyone promoted it.
     The recheck on HARNESS stands and is now overdue rather than optional. */
  'admin-portal↔handbook:test': HARNESS,
  /* admin-portal↔handbook:lib entry deleted 2026-08-21: the i18n bootstrap
     was promoted as initI18n(resources) in the system lib — exactly what the
     entry's recheck said should happen when handbook landed — and every app's
     shim shrank to its resources object. jscpd stopped matching the pair. */
  /* admin-portal↔teams-digest:app entry deleted 2026-08-21: the railless
     shell contract (.app-bare/.app-bare-main, the panels height release, the
     capped PageHeader) moved into styles/utilities.css — the entry's own
     trigger, admin-portal being the second no-rail app. --page-max-width
     stays per app on purpose: the two products genuinely tune it apart
     (73.75rem vs 118.75rem), which is tuning, not duplication. */
}

/* Component names an app is allowed to own privately even though a sibling app
 * has one too. Key: the component name. */
const ACCEPTED_PARALLEL = {
  LiveCallBar: {
    why:
      'Salim keeps its live-call pill custom NEXT TO the promoted SessionPill, by a ' +
      'review decision written into its CSS: an ongoing emergency call must be ' +
      'impossible to miss — solid destructive fill, top-centre — because the white ' +
      'card version blended into the chrome. SessionPill is a session REMINDER; this ' +
      'is an emergency affordance with two states (active is not dismissible) and a ' +
      'state-dependent action. Flattening it into the quiet pill would undo a review.',
    recheck:
      'A second app needing an unmissable critical session pill is the trigger for ' +
      'SessionPill to grow a critical placement/fill variant; until then this stays.',
  },
  AppShell: {
    why: 'Each app composes its own chrome. See the components entry above.',
    recheck: 'Same condition: a third app needing the same grid.',
  },
  Logo: {
    why:
      'The ecosystem symbol: one bespoke thematic glyph per app, drawn in the brand gradient with ' +
      'no background tile (transcript is a voice waveform, teams-digest a chat condensing into a ' +
      'summary). The DRAWING is the whole point and must differ; what repeats is the contract — ' +
      'a 48x48 box with a ~7px safe area, the gradient, and the `.eco-symbol` class the animation ' +
      'hangs off. A shared component here would be a component with no content.',
    recheck:
      'CLOSED 2026-08-20: admin-portal was the third app, so the contract moved into ' +
      'styles/utilities.css (.eco-symbol: the class, the reduced-motion rule, the safe-area and ' +
      'gradient notes) exactly as this entry said it should. Each app keeps its own <svg>. ' +
      'Reopens only if a product stops following the documented contract.',
  },
}

const RED = '\x1b[31m', GREEN = '\x1b[32m', YELLOW = '\x1b[33m', DIM = '\x1b[2m', B = '\x1b[1m', OFF = '\x1b[0m'
const failures = []

const appNames = readdirSync(APPS, { withFileTypes: true })
  .filter((d) => d.isDirectory() && existsSync(join(APPS, d.name, 'src')))
  .map((d) => d.name)

// ── 1. DUPLICATED ────────────────────────────────────────────────────────────
if (!process.argv.includes('--fast')) {
  const out = mkdtempSync(join(tmpdir(), 'scout-'))
  try {
    const targets = [join(DS, 'src'), ...appNames.map((a) => join(APPS, a, 'src'))]
    execFileSync(
      join(ROOT, 'node_modules/.bin/jscpd'),
      ['--min-tokens', '60', '--absolute', '--reporters', 'json', '--output', out, '--silent',
        '--pattern', '**/*.{ts,tsx,css}', ...targets],
      { stdio: 'ignore' },
    )
  } catch {
    /* jscpd exits non-zero when it finds clones; the report is written either way. */
  }

  const reportPath = join(out, 'jscpd-report.json')
  if (!existsSync(reportPath)) {
    console.error(`${RED}✗ jscpd produced no report${OFF}`)
    process.exit(1)
  }
  const report = JSON.parse(readFileSync(reportPath, 'utf8'))
  rmSync(out, { recursive: true, force: true })

  /* Package + layer, because "salim copied a layout" and "salim copied a
   * provider" are different decisions and deserve separate reasons. */
  const pkgOf = (p) => (p.match(/apps\/([a-z-]+)\//)?.[1] ?? (p.includes('packages/design-system') ? 'design-system' : '?'))
  const layerOf = (p) => (p.split('/src/')[1] ?? '').split('/')[0].replace(/\.[^.]+$/, '') || 'src'

  const groups = new Map()
  for (const d of report.duplicates ?? []) {
    const a = pkgOf(d.firstFile.name), b = pkgOf(d.secondFile.name)
    if (a === b) continue
    const key = `${[a, b].sort().join('↔')}:${layerOf(d.firstFile.name)}`
    const g = groups.get(key) ?? { lines: 0, count: 0, sample: '' }
    g.lines += d.lines; g.count += 1
    if (!g.sample) g.sample = d.firstFile.name.split('/src/')[1]
    groups.set(key, g)
  }

  console.log(`${B}Duplicated across packages${OFF}\n`)
  const sorted = [...groups].sort((x, y) => y[1].lines - x[1].lines)
  for (const [key, g] of sorted) {
    const e = ACCEPTED[key]
    const head = `${String(g.lines).padStart(5)} lines / ${String(g.count).padStart(2)} clones  ${key}`
    if (!e) { console.log(`  ${RED}✗ ${head} — NEW, no decision recorded${OFF}`); failures.push(key); continue }
    console.log(`  ${GREEN}✓${OFF} ${head}  ${DIM}${e.why.slice(0, 74)}…${OFF}`)
  }
  const stale = Object.keys(ACCEPTED).filter((k) => !groups.has(k))
  if (stale.length) {
    console.log(`\n  ${YELLOW}! ${stale.length} accepted group(s) no longer duplicated: ${stale.join(', ')}${OFF}`)
    console.log(`    Delete them — a stale exception hides the next real one.`)
  }
}

// ── 2. PARALLEL ──────────────────────────────────────────────────────────────
/* A copy that delegates is not a copy. An app's own `components/UserMenu` importing
 * `@ds/UserMenu` is the pattern working: the app owns the wiring (who the user
 * is, where entries navigate) and the system owns the look. Only a component
 * that reaches for nothing shared is a second implementation. */
const DELEGATES = /from\s+['"]@(ds|blocks|shell)\//

const owners = new Map()
for (const app of appNames) {
  const dir = join(APPS, app, 'src/components')
  if (!existsSync(dir)) continue
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const name = entry.name.replace(/\.tsx$/, '')
    const file = entry.isDirectory() ? join(dir, name, `${name}.tsx`) : join(dir, entry.name)
    if (!entry.name.endsWith('.tsx') && !existsSync(file)) continue
    const src = existsSync(file) ? readFileSync(file, 'utf8') : ''
    if (DELEGATES.test(src)) continue
    owners.set(name, [...(owners.get(name) ?? []), app])
  }
}

console.log(`\n${B}Built twice, shared nowhere${OFF}\n`)
const parallel = [...owners].filter(([, apps]) => apps.length > 1)
if (!parallel.length) console.log(`  ${GREEN}✓${OFF} no component name is implemented independently in two apps`)
for (const [name, apps] of parallel) {
  const e = ACCEPTED_PARALLEL[name]
  if (!e) { console.log(`  ${RED}✗ ${name} — built in ${apps.join(', ')} with no shared base${OFF}`); failures.push(name); continue }
  console.log(`  ${GREEN}✓${OFF} ${name} (${apps.join(', ')}) — ${DIM}${e.why.slice(0, 80)}${OFF}`)
}

// ── 3. UNCONSUMED ────────────────────────────────────────────────────────────
/* Never a failure. A design system is allowed to ship a component before the
 * first product needs it. But a page template sitting unused while apps
 * hand-roll page chrome is worth reading every time the gate runs. */
const appSrc = appNames.flatMap((a) => walk(join(APPS, a, 'src')))
  .filter((f) => /\.(ts|tsx)$/.test(f))
  .map((f) => readFileSync(f, 'utf8'))
  .join('\n')

console.log(`\n${B}In the system, used by no app${OFF}\n`)
for (const layer of ['blocks', 'shell']) {
  const dir = join(DS, 'src', layer)
  if (!existsSync(dir)) continue
  const unused = readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .filter((n) => !appSrc.includes(`@${layer}/${n}`) && !appSrc.includes(`@${layer === 'blocks' ? 'blocks' : 'shell'}/${n}'`))
  const used = readdirSync(dir).filter((n) => !n.startsWith('.')).length
  console.log(`  ${layer}: ${used - unused.length}/${used} consumed` + (unused.length ? ` ${YELLOW}— idle: ${unused.join(', ')}${OFF}` : ` ${GREEN}✓${OFF}`))
}

function walk(dir) {
  if (!existsSync(dir)) return []
  return readdirSync(dir, { withFileTypes: true }).flatMap((d) =>
    d.isDirectory() ? walk(join(dir, d.name)) : [join(dir, d.name)])
}

if (failures.length) {
  console.error(`\n${RED}✗ ${failures.length} finding(s) with no recorded decision: ${failures.join(', ')}${OFF}`)
  console.error('  Promote it into the system, or add an entry with a reason and a recheck condition.')
  process.exit(1)
}
console.log(`\n${GREEN}✓ every cross-package copy has a written decision.${OFF}`)
