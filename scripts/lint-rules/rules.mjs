import { staticInlineStyle } from '../lib/inline-style.mjs'
// The project-specific rules, in ONE place, for every package that has a gate.
//
// They used to live twice: once here and once copy-pasted into apps/salim. Nine
// of the twelve shared rules had already drifted apart, and salim's copy of the
// atomic-direction rule was matching `components/atoms|molecules|organisms/`
// paths that stopped existing when the component tree was flattened — a rule
// that silently checked nothing for weeks. One module cannot rot in half.
//
// Everything an off-the-shelf tool already covers stays out: undefined
// var(--token), !important and raw hex belong to Stylelint, correctness and
// hooks to ESLint, types to tsc.
//
// A package builds a context with `createContext(config)` and picks the rules it
// wants by name. Nothing here reads a hardcoded path.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'

const stripComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))

function walk(dir, exts, out = []) {
  let entries
  try { entries = readdirSync(dir) } catch { return out }
  for (const name of entries) {
    // __eval__ holds generated agent output from the eval harness, not source.
    // ESLint already ignores it; linting it would make the gate depend on
    // whatever a past eval run happened to leave behind.
    if (name === 'node_modules' || name === 'dist' || name === '__eval__' || name.startsWith('.')) continue
    const p = dir + '/' + name
    if (statSync(p).isDirectory()) walk(p, exts, out)
    else if (exts.some((e) => name.endsWith(e))) out.push(p)
  }
  return out
}

/**
 * @param {object} cfg
 * @param {string} cfg.root            package directory (absolute, no trailing slash)
 * @param {string} [cfg.srcDir]        where the package's own code lives, default 'src'
 * @param {string[]} [cfg.extraCodeRoots]  more code to READ but never lint. An app's CSS
 *                                     legitimately overrides classes emitted by shared
 *                                     components, so the dead-CSS rule has to see them.
 * @param {string[]} [cfg.consumerRoots]  code outside this package that consumes it through
 *                                     an alias. Used to VERIFY an `@public` export, never to
 *                                     excuse an untagged one (see rDeadExports).
 * @param {number} [cfg.fileSizeMax]
 * @param {object} [cfg.allow]         accepted debt per rule (path substrings or names)
 */
export function createContext(cfg) {
  const root = cfg.root.replace(/\/$/, '')
  const srcDir = cfg.srcDir ?? 'src'
  const rel = (f) => f.replace(root + '/', '')
  const read = (f) => readFileSync(f, 'utf8')
  const lines = (f) => stripComments(read(f)).split('\n')

  const srcCss = walk(`${root}/${srcDir}`, ['.css'])
  const codeFiles = walk(`${root}/${srcDir}`, ['.ts', '.tsx'])

  /* Shared code an app READS but never lints. Restricted to the components it
   * actually imports, and that restriction is the whole point.
   *
   * It used to be every shared component, which made the dead-CSS rule blind in a
   * way that cost two real bugs: workshops' mobile drawer styled `.sidebar`, a
   * class emitted only by the design system's own shell/Sidebar, which workshops
   * does not use (its nav is @ds/SideNav, root class `.side-nav`). The rules
   * matched nothing, the drawer never slid in, and the linter called the class
   * alive because it was alive SOMEWHERE. A class an app cannot render is dead in
   * that app whatever the rest of the monorepo does. */
  const importedShared = new Set(
    codeFiles
      .flatMap((f) => [...readFileSync(f, 'utf8').matchAll(/from ['"]@(?:ds|blocks|shell)\/([A-Za-z]+)/g)])
      .map((m) => m[1]),
  )
  const extraCode = (cfg.extraCodeRoots ?? [])
    .flatMap((d) => walk(d, ['.ts', '.tsx']))
    .filter((f) => importedShared.size === 0 || [...importedShared].some((n) => f.includes(`/${n}/`)))

  const testFile = (f) => /\.(test|spec)\.tsx?$/.test(f) || new RegExp(`/${srcDir}/test/`).test(f)
  const exampleFile = (f) => f.endsWith('.example.tsx')
  /* Golden examples ARE the reference usage an agent copies, so every conformance
   * rule applies to them exactly as to product code. Only tests are exempt: they
   * hand-roll fixtures on purpose. */
  const usageFiles = codeFiles.filter((f) => !testFile(f))

  /* Translations are copy too, and they are where the copy rules drift first:
   * nothing type-checks a sentence. Missing directory is fine, airun has none. */
  const localeFiles = existsSync(`${root}/${srcDir}/locales`)
    ? walk(`${root}/${srcDir}/locales`, ['.json'])
    : []

  const allow = cfg.allow ?? {}
  const allowList = (k) => allow[k] ?? []
  const allowedPath = (f, k) => allowList(k).some((p) => rel(f).includes(p))

  /* Code OUTSIDE this package that consumes it through an alias (@ds, @blocks,
   * @lib). A linter that reads one package cannot tell a dead export from a
   * shared one: both are defined here and used nowhere here.
   *
   * Read lazily and once. It is a few hundred files that no other rule looks at,
   * and this runs on every single edit through the PostToolUse hook.
   *
   * `hasConsumers` is separate on purpose. The apps carry their own git
   * repositories and this repository ignores /apps/, so a CI checkout has none of
   * them on disk. Absent consumers must mean "cannot verify", never "verified
   * absent", or the first clean checkout deletes a function two products use. */
  const consumerDirs = (cfg.consumerRoots ?? []).filter((d) => existsSync(d))
  let consumerCache = null
  const consumerText = () => {
    if (consumerCache === null) {
      consumerCache = consumerDirs.flatMap((d) => walk(d, ['.ts', '.tsx'])).map((f) => readFileSync(f, 'utf8')).join('\n')
    }
    return consumerCache
  }

  return {
    root, srcDir, rel, read, lines, walk, stripComments, existsSync,
    srcCss, codeFiles, extraCode, usageFiles, localeFiles, testFile, exampleFile,
    allowList, allowedPath, consumerText, hasConsumers: consumerDirs.length > 0,
    fileSizeMax: cfg.fileSizeMax ?? 600,
    // Default is the design system's own scope; an app passes its own (see rPrimitiveInternals).
    primitiveInternalsScope: cfg.primitiveInternalsScope ?? /\/(layouts|lib|shell|blocks)\//,
  }
}

// ---------------------------------------------------------------------------
// Rules. Each takes the context and returns a list of human-readable violations.
// ---------------------------------------------------------------------------

/** raw px on a spacing/radius property (not 0/1/2/1.5, not @media) → use a token */
export function rSpacingPx(c) {
  const SPACING = /^\s*(gap|row-gap|column-gap|(margin|padding)(-block|-inline)?(-start|-end)?|border-radius)\s*:/
  const out = []
  for (const f of c.srcCss) c.lines(f).forEach((ln, i) => {
    if (!SPACING.test(ln) || /@media|@container/.test(ln)) return
    for (const m of ln.matchAll(/(?<![\w.#-])(\d*\.?\d+)px/g)) {
      if (!['0', '1', '2', '1.5'].includes(m[1])) out.push(`${c.rel(f)}:${i + 1}  raw ${m[0]} on a spacing/radius property — use var(--space-*) / var(--radius-*)`)
    }
  })
  return out
}

/** physical (LTR-only) properties instead of logical → breaks RTL */
export function rLogicalProps(c) {
  const out = []
  for (const f of c.srcCss) c.lines(f).forEach((ln, i) => {
    if (/^\s*(margin|padding|border|inset)-(left|right)\s*:/.test(ln) || /^\s*(left|right)\s*:/.test(ln)
      || /text-align\s*:\s*(left|right)\b/.test(ln) || /float\s*:\s*(left|right)\b/.test(ln)) {
      out.push(`${c.rel(f)}:${i + 1}  physical property (use the inline-logical equivalent: *-inline-start/end, text-align: start/end)`)
    }
  })
  return out
}

/** components/pages reference SEMANTIC status roles, never the tonal primitives.
 *  Reaching a tonal stop directly silently breaks dark mode: the semantic role
 *  flips per theme, the raw stop does not. */
export function rSemanticOnly(c) {
  const out = []
  for (const f of c.srcCss) {
    if (c.allowedPath(f, 'tonalPrimitive')) continue
    c.lines(f).forEach((ln, i) => {
      const m = ln.match(/var\(--(success|warning|danger|brand)-[0-9]+/)
      if (!m) return
      // Sanctioned exception: a primitive may be referenced ONLY when defining a
      // local severity-scale token (--sev-* / --level-*), a domain ramp the generic
      // status roles do not model. Consumers then read the named token.
      if (/--(?:sev|level)[\w-]*\s*:/.test(ln)) return
      out.push(`${c.rel(f)}:${i + 1}  tonal primitive ${m[0].slice(4)} — use a semantic role (--success[-soft/-emphasis] / --warning[-…] / --destructive[-…] / --primary), or a local --sev-* token for a domain severity scale`)
    })
  }
  return out
}

/** raw <select>/<input>/<textarea> outside their primitive folders */
export function rRawControls(c) {
  const out = []
  for (const f of c.usageFiles) {
    if (c.allowedPath(f, 'rawControls')) continue
    // UI layers only: a bare <input> in a script or a data module is not a screen.
    if (!/\/(layouts|components|blocks|shell|lib)\//.test(c.rel(f))) continue
    const src = c.read(f).split('\n')
    src.forEach((ln, i) => {
      const m = ln.match(/<(select|textarea|input)\b/)
      if (!m) return
      // No primitive covers a file picker: it is a native-only control that must
      // stay a bare <input type="file"> inside its own label.
      if (/type="file"/.test(src.slice(i, i + 4).join(' '))) return
      out.push(`${c.rel(f)}:${i + 1}  raw <${m[1]}> — use the Select/Input/Textarea/Field primitive`)
    })
  }
  return out
}

/** icon-only <button> with no text and no aria-label */
export function rIconButtonA11y(c) {
  const out = []
  for (const f of c.usageFiles) {
    // the button primitives themselves define the real elements
    if (/components\/(Button|IconButton|ExpandButton)\//.test(c.rel(f))) continue
    if (c.allowedPath(f, 'iconButtonA11y')) continue
    const s = c.read(f)
    for (const m of s.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g)) {
      const open = m[1], inner = m[2]
      if (!/<Icon\b/.test(inner)) continue
      if (/aria-label=/.test(open)) continue
      if (/\{/.test(inner)) continue // a JSX expression likely carries a label — stay conservative
      const text = inner.replace(/<[^>]*>/g, '').trim()
      if (!text) { const n = s.slice(0, m.index).split('\n').length; out.push(`${c.rel(f)}:${n}  icon-only <button> without aria-label — add aria-label (+ wrap in <Tooltip>)`) }
    }
  }
  return out
}

/** every standalone icon-only <IconButton> is wrapped in a <Tooltip>. Exempt: the
 *  primitive itself, Dropdown/Select triggers (the render-prop reveals a labelled
 *  menu), and whatever the package allows. */
export function rIconButtonTooltip(c) {
  const out = []
  for (const f of c.usageFiles) {
    if (/components\/IconButton\//.test(c.rel(f))) continue
    if (c.allowedPath(f, 'iconButtonTooltip')) continue
    const src = c.read(f).split('\n')
    src.forEach((ln, i) => {
      if (!/<IconButton[\s/>]/.test(ln)) return
      const window = src.slice(i, i + 14).join('\n')
      const end = window.indexOf('/>')
      const tag = end >= 0 ? window.slice(0, end) : window
      const prev = src.slice(Math.max(0, i - 3), i)
      const isTrigger = /\{\.\.\.(props|triggerProps)\}/.test(tag) || prev.some((l) => /trigger=\{/.test(l))
      if (isTrigger) return
      const prevNonBlank = [...prev].reverse().find((l) => l.trim()) || ''
      if (/<Tooltip\b/.test(prevNonBlank)) return
      out.push(`${c.rel(f)}:${i + 1}  <IconButton> not wrapped in <Tooltip> — icon-only controls need a tooltip (exempt: Dropdown/Select triggers)`)
    })
  }
  return out
}

/** reaching into a primitive's class + data-* contract → use the component.
 *
 *  The scope is per package, because `components/` means opposite things in the
 *  two: in the design system it IS the primitive layer defining these contracts
 *  (CountBadge's own `.count-badge-marker` would read as a violation of itself),
 *  in an app it is a consumer like any page. */
export function rPrimitiveInternals(c) {
  const out = []
  for (const f of c.usageFiles) {
    if (!c.primitiveInternalsScope.test(c.rel(f))) continue
    c.read(f).split('\n').forEach((ln, i) => {
      if (/className="[^"]*\b(chip|badge|btn)\b[^"]*"/.test(ln) && /data-(variant|size|tone)=/.test(ln)
        && !c.allowList('primitiveInternals').some((x) => ln.includes(x))) {
        out.push(`${c.rel(f)}:${i + 1}  hand-rolled primitive class + data-* — use the <Chip>/<Badge>/<Button> component (add a prop if a variant is missing)`)
      }
    })
  }
  return out
}

export function rBannedConstructs(c) {
  const out = []
  const PAT = [[/\beval\(/, 'eval('], [/document\.write\b/, 'document.write'], [/dangerouslySetInnerHTML/, 'dangerouslySetInnerHTML'], [/console\.log\b/, 'console.log'], [/(?<![\w.])debugger\b/, 'debugger']]
  for (const f of c.usageFiles) {
    const allowed = c.allowedPath(f, 'bannedConstructs')
    c.read(f).split('\n').forEach((ln, i) => {
      for (const [re, label] of PAT) {
        if (re.test(ln)) {
          if (allowed && (label === 'dangerouslySetInnerHTML' || label === 'console.log')) continue
          out.push(`${c.rel(f)}:${i + 1}  banned construct ${label}`)
        }
      }
    })
  }
  return out
}

/* CLDR plural categories per language. English has two; Arabic has six, and the
 * two it shares with English are not the common ones — 3..10 and 11..99 each get
 * their own wording. */
const PLURAL_FORMS = { en: ['one', 'other'], ar: ['zero', 'one', 'two', 'few', 'many', 'other'] }

/**
 * A counted string has the plural forms its language needs.
 *
 * `t('x.cards', { count })` with a single flat `"x.cards": "{{count}} cards"`
 * reads "1 cards" and nobody notices, because the screenshot everyone looks at
 * has three of them. This repository had 31 such keys across three packages, and
 * five more where English had both forms while Arabic had two of its six — so
 * Arabic rendered the "other" wording for 3 and for 11, which is wrong in
 * different ways for each.
 *
 * The check is on the CALL: a key passed `count` must resolve to the full set in
 * every locale file the package ships. A key with no count is not plural and is
 * left alone.
 */
export function rPluralForms(c) {
  const out = []
  if (c.localeFiles.length === 0) return out

  const flatten = (obj, pre = '', into = {}) => {
    for (const [k, v] of Object.entries(obj)) {
      const key = pre + k
      if (v && typeof v === 'object' && !Array.isArray(v)) flatten(v, key + '.', into)
      else into[key] = v
    }
    return into
  }

  const locales = new Map()
  for (const f of c.localeFiles) {
    const lang = f.split('/').pop().replace('.json', '')
    if (!PLURAL_FORMS[lang]) continue
    try { locales.set(lang, flatten(JSON.parse(c.read(f)))) } catch { /* another rule owns malformed JSON */ }
  }

  const counted = new Set()
  for (const f of c.usageFiles) {
    for (const m of c.read(f).matchAll(/t\(\s*[`'"]([\w.]+)[`'"]\s*,\s*\{[^}]*\bcount\b/g)) counted.add(m[1])
  }

  for (const key of [...counted].sort()) {
    if (c.allowedPath(key, 'pluralForms')) continue
    for (const [lang, dict] of locales) {
      /* Only complain about keys this locale actually carries: a missing
       * translation is a different rule's business. */
      const present = PLURAL_FORMS[lang].filter((form) => `${key}_${form}` in dict)
      if (present.length === 0 && !(key in dict)) continue
      const missing = PLURAL_FORMS[lang].filter((form) => !present.includes(form))
      if (missing.length === 0) continue
      out.push(`src/locales/${lang}.json  ${key} is used with a count but has no ${missing.join(', ')} form${missing.length > 1 ? 's' : ''}`)
    }
  }
  return out
}

/**
 * Nothing destructive happens without asking first.
 *
 * The system has had `<ConfirmDialog>` for a long time and most screens used it,
 * which is exactly why the gaps survived: three screens deleted on a single
 * click and nobody noticed, one of them with the confirmation text already
 * written in the locale file and wired to nothing.
 *
 * What counts as destructive is what the code already says: `tone="destructive"`
 * or `data-tone="danger"`. Two things are deliberately NOT violations:
 *
 *   - a control that delegates, `onClick={() => onDelete(id)}` — the parent owns
 *     the data and the parent is where the question belongs, so a card, a column
 *     or a banner that only reports the intent upward is doing the right thing;
 *   - anything in `src/components`, since a primitive cannot know whether its
 *     consumer's action is undoable. `ChatComposer`'s stop button is the case
 *     that settled this.
 *
 * The check is coarse: it reads a window around each destructive marker rather
 * than parsing JSX. It is aimed at the failure that actually happens (a screen
 * mutates its own data with no dialog anywhere in the file), and a screen with a
 * real reason records itself in ALLOW.
 */
export function rDestructiveConfirms(c) {
  const out = []
  const DESTRUCTIVE = /tone="destructive"|data-tone="danger"/
  for (const f of c.usageFiles) {
    if (!f.endsWith('.tsx')) continue
    if (c.exampleFile(f)) continue
    if (f.includes('/components/')) continue
    if (c.allowedPath(f, 'destructiveConfirm')) continue
    const text = c.read(f)
    if (!DESTRUCTIVE.test(text)) continue
    // A confirmation anywhere in the file: the dialog, the imperative hook, or a wrapper.
    if (/Confirm|confirm\(/.test(text)) continue

    const lines = text.split('\n')
    lines.forEach((ln, i) => {
      if (!DESTRUCTIVE.test(ln)) return
      const window = lines.slice(Math.max(0, i - 8), i + 9).join('\n')
      const handler = /onClick=\{([^}]*)\}/.exec(window)
      if (!handler) return
      // Delegation upward: the parent owns both the data and the question.
      if (/\bon[A-Z]\w*\s*\(/.test(handler[1])) return
      out.push(`${c.rel(f)}:${i + 1}  destructive action with no confirmation anywhere in this file — use <ConfirmDialog> (or delegate to a parent that does)`)
    })
  }
  return out
}

/**
 * An inner screen owes the user a way back.
 *
 * Reading a route param is what makes a screen "inner": you got here from a list
 * by opening one thing, so there is a place to return to. Every such screen in
 * this repository passed `onBack` except one, which is how this rule got written:
 * `/discovery/:id` offered a breadcrumb link instead, which is a different
 * affordance in a different place, and on a phone it shares a row with the title.
 *
 * The check is deliberately coarse. It asks whether the file mentions `onBack`
 * at all, not whether every branch passes it, because the cheap version already
 * catches the real failure (nobody thought about back) and a precise version
 * would need a JSX parser. A screen that genuinely should not offer back records
 * itself in ALLOW with the reason.
 */
export function rDetailNeedsBack(c) {
  const out = []
  for (const f of c.usageFiles) {
    if (!f.endsWith('.tsx')) continue
    if (c.allowedPath(f, 'detailBack')) continue
    const text = c.read(f)
    if (!text.includes('useParams')) continue
    if (!/<PageHeader|<DetailPageTemplate/.test(text)) continue
    if (text.includes('onBack')) continue
    out.push(`${c.rel(f)}  inner screen (reads a route param) renders a header with no onBack: a breadcrumb or a link is not a back button`)
  }
  return out
}

/**
 * An exported value referenced nowhere else is dead.
 *
 * Except when it is the package's OUTSIDE surface. `byDay` sat in the accepted-debt
 * map for exactly that reason: the design system exports it, teams-digest imports it
 * through `@lib`, and a linter that reads one package sees a function nobody calls.
 * The debt entry recorded the closing condition as "teach the rule to read the apps
 * that consume @lib", and this is that, in two halves:
 *
 *   `@public` in the JSDoc says an export is meant to leave the package. It travels
 *   with the code, so it survives a checkout that has no apps in it, and it is a
 *   claim made where somebody about to delete the function will read it.
 *
 *   `consumerRoots` checks the claim whenever the consumers are actually on disk. A
 *   tag nobody imports is a stale claim, and this says so rather than trusting it.
 *
 * The tag cannot be used to bless an ordinary dead export: an untagged one still
 * fails even when an app happens to mention the same word.
 */
export function rDeadExports(c) {
  const out = []
  const corpus = c.codeFiles.map(c.read).join('\n')
  for (const f of c.codeFiles) {
    if (/\/index\.ts$/.test(c.rel(f))) continue
    // Golden examples export Example(); the test suite collects them through
    // import.meta.glob, so there is no by-name reference to find.
    if (c.exampleFile(f)) continue
    const src = c.read(f).split('\n')
    src.forEach((ln, i) => {
      const m = ln.match(/^export\s+(?:async\s+)?(?:const|function|class)\s+([A-Za-z_$][\w$]*)/)
      if (!m) return
      const name = m[1]
      if (c.allowList('deadExports').includes(name)) return

      /* The comment block immediately above the export, if there is one. */
      let doc = ''
      for (let j = i - 1; j >= 0 && j > i - 25; j--) {
        const above = src[j].trim()
        if (above === '') break
        doc = `${above}\n${doc}`
        if (above.startsWith('/*') || above.startsWith('//')) break
        if (!above.startsWith('*')) break
      }
      const isPublic = /@public\b/.test(doc)
      const refs = (corpus.match(new RegExp('\\b' + name + '\\b', 'g')) || []).length

      if (isPublic) {
        if (refs > 1 || !c.hasConsumers) return
        const used = new RegExp('\\b' + name + '\\b').test(c.consumerText())
        if (!used) out.push(`${c.rel(f)}:${i + 1}  ${name}() is tagged @public but no consumer imports it — drop the tag and delete it, or wire it up`)
        return
      }
      if (refs <= 1) out.push(`${c.rel(f)}:${i + 1}  dead export ${name}() — defined but referenced nowhere (delete it, or tag it @public if a consuming app uses it)`)
    })
  }
  return out
}

/** CSS class defined under src/ but never emitted as a string in any .ts/.tsx.
 *  A complete scale (mb-1..mb-6) is kept WHOLE even if a step is unused: pruning
 *  one step is a gap in the scale, not cruft. */
export function rDeadCss(c) {
  const out = []
  const codeText = c.codeFiles.concat(c.extraCode).map(c.read).join('\n')
  for (const f of c.srcCss) {
    const defs = new Map()
    c.stripComments(c.read(f)).split('\n').forEach((ln, i) => {
      if (ln.indexOf('{') < 0 && !/,\s*$/.test(ln)) return
      for (const chunk of ln.split('}')) {
        const sel = chunk.split('{')[0]
        if (/@keyframes|@media|@container|@supports/.test(sel)) continue
        for (const m of sel.matchAll(/\.([a-z][a-z0-9-]*)/g)) if (!defs.has(m[1])) defs.set(m[1], i + 1)
      }
    })
    for (const [cls, n] of defs) {
      if (c.allowList('deadCss').includes(cls)) continue
      if (codeText.includes(cls)) continue
      const fam = cls.match(/^(.*-)\d+$/)
      if (fam && new RegExp('\\b' + fam[1].replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&') + '\\d+\\b').test(codeText)) continue
      out.push(`${c.rel(f)}:${n}  dead CSS class .${cls} — no tsx emits it (delete it)`)
    }
  }
  return out
}

/** A @media width that is not on the declared breakpoint scale.
 *
 *  The `--bp-*` tokens are the one scale that CANNOT be enforced by using them:
 *  a media query may not read a custom property, so every query duplicates the
 *  number literally and settings.css calls itself "the source of truth" on the
 *  strength of a comment. Nothing checked the duplication, and two widths had
 *  already grown outside the scale.
 *
 *  Off-scale is not automatically wrong — a two-column block breaks where its
 *  columns stop fitting, not where phones end. It has to be a decision somebody
 *  wrote down, which is what the allow list is: the width plus its reason. */
export function rBreakpointScale(c) {
  const out = []
  const file = `${c.root}/styles/settings.css`
  if (!c.existsSync(file)) return out
  const scale = new Map()
  for (const m of c.stripComments(c.read(file)).matchAll(/(--bp-[a-z0-9-]+)\s*:\s*([^;]+);/g)) {
    scale.set(m[2].trim(), m[1])
  }
  if (!scale.size) return out
  const allowed = c.allowList('breakpointScale')
  for (const f of c.srcCss) {
    c.stripComments(c.read(f)).split('\n').forEach((ln, i) => {
      if (!ln.includes('@media')) return
      for (const m of ln.matchAll(/(?:min|max)-width\s*:\s*([\d.]+(?:rem|px|em))/g)) {
        const w = m[1]
        if (scale.has(w) || allowed.includes(w)) continue
        out.push(
          `${c.rel(f)}:${i + 1}  @media at ${w}, which is not on the --bp-* scale ` +
            `(${[...scale].map(([v, t]) => `${t} ${v}`).join(', ')}) — move it onto the scale, ` +
            `or add the width to ALLOW.breakpointScale with the reason it is content-driven`,
        )
      }
    })
  }
  return out
}

export function rFileSize(c) {
  const out = []
  for (const f of c.codeFiles) {
    if (c.allowList('fileSize').includes(c.rel(f))) continue
    const n = c.read(f).split('\n').length
    if (n > c.fileSizeMax) out.push(`${c.rel(f)}:1  ${n} lines > ${c.fileSizeMax} — split into smaller modules`)
  }
  return out
}

/** The rules any package can run. Structural rules that only make sense for the
 *  design system itself (levels.json, surfaces.json, folder shape, golden
 *  examples, the atomic ladder) stay in its own config as local rules. */
/** a STATIC inline style object — the value is fixed, so it belongs in CSS.
 *  Dynamic ones (portal coordinates, a measured height, a grid template built
 *  from data) are the sanctioned exception and are left alone: they cannot be
 *  expressed as a class. */
export function rInlineStyle(c) {
  const out = []
  for (const f of c.usageFiles) {
    if (c.allowedPath(f, 'inlineStyle')) continue
    c.read(f).split('\n').forEach((ln, i) => {
      if (!staticInlineStyle(ln)) return
      out.push(`${c.rel(f)}:${i + 1}  static inline style — move it to the component's CSS`)
    })
  }
  return out
}

export const SHARED_RULES = {
  'spacing/radius via tokens (no raw px)': rSpacingPx,
  'components use semantic status roles (no tonal primitives)': rSemanticOnly,
  'logical properties for RTL (no left/right)': rLogicalProps,
  'no raw form controls outside primitives': rRawControls,
  'icon-only buttons have aria-label': rIconButtonA11y,
  'icon-only buttons wrapped in <Tooltip>': rIconButtonTooltip,
  'no reaching into primitive class+data contract': rPrimitiveInternals,
  'no banned runtime constructs': rBannedConstructs,
  'no static inline styles': rInlineStyle,
  'inner screens offer a way back': rDetailNeedsBack,
  'destructive actions confirm first': rDestructiveConfirms,
  'counted strings have every plural form': rPluralForms,
  'no dead value exports': rDeadExports,
  'no dead CSS classes': rDeadCss,
  'media queries on the declared breakpoint scale': rBreakpointScale,
  'files within the size ceiling': rFileSize,
}
