// Page composition RULES, asserted in a real browser at three widths.
//
// Why this and not more screenshots: a pixel diff tells you something changed and
// leaves you to work out what. It also happily accepts a broken layout the first
// time it is baselined — which is exactly what happened here: the first run wrote
// a baseline of a tablet screen whose card grid used half the row, and called it
// green. An assertion says what is wrong and cannot be baselined away.
//
// Every rule below exists because it was broken in this repository, on a real
// screen, while every component-level gate was green:
//
//   1. no-overflow        content wider than the viewport (nothing caught this)
//   2. header-aligns      a screen capped its own width a second time, so the
//                         page title sat flush left and the cards floated centre
//   3. grid-fills-row     `minmax(18rem, 24rem)` packs tracks at their MAX, so
//                         between 704 and 792 px it drops to one column and leaves
//                         320 px of the row empty
//   4. nav-reachable      below the drawer breakpoint the sidebar slides off and
//                         nothing opened it again: the navigation was unreachable
//                         on a phone, in the design system and in two apps
//   5. nav-not-doubled    a visible sidebar and a drawer trigger at the same time
//                         means one of the two breakpoints is wrong
//   6. nav-one-leading-control  back AND the drawer trigger at once: two ways out
//                         of one corner, which is not what any platform does
//   7. nav-trigger-hittable  the trigger was PRESENT and unclickable, sitting under
//                         the sticky header with half of it showing
//   8. axe                 accessibility in a REAL browser, so colour contrast is
//                         included: jsdom has no canvas and cannot evaluate it
//
// Screens can also declare `dir: "rtl"`. The system says it is RTL-ready and uses
// logical properties everywhere, Arabic is a shipped locale, and until 2026-07-31
// no screen had ever been rendered mirrored.
//
// Run: npm run build && npm run audit:pages
import { existsSync, readFileSync } from 'node:fs'
import { chromium } from 'playwright'
import { serveDir } from './lib/visual.mjs'
import { installApiMocks } from './lib/apiMocks.mjs'
import { createRequire } from 'node:module'

/* axe-core's browser bundle, injected into the page. It arrives with vitest-axe,
 * so there is no new dependency — and running it HERE rather than only in jsdom
 * is the point: jsdom cannot evaluate colour contrast (no canvas), so the one
 * accessibility rule that depends on what the pixels actually look like has
 * never been checked against a rendered page. The token-level contrast check
 * (`npm run contrast`) proves the palette is sound; this proves the palette is
 * what a screen ended up using. */
const AXE_SOURCE = readFileSync(createRequire(import.meta.url).resolve('axe-core/axe.min.js'), 'utf8')

const ROOT = process.cwd()
/* config/ first, the package root second: this package moved its screen config
 * into config/ when its root became a published front page, and the apps that
 * share this script have not. Same file, same name, either place. */
const CONFIG = [`${ROOT}/config/screens.config.json`, `${ROOT}/screens.config.json`].find((f) => existsSync(f)) ?? `${ROOT}/config/screens.config.json`
const DIST = `${ROOT}/dist`

if (!existsSync(CONFIG)) { console.error(`No config/screens.config.json in ${ROOT}.`); process.exit(1) }
if (!existsSync(`${DIST}/index.html`)) { console.error('No dist/index.html — run `npm run build` first.'); process.exit(1) }

const { screens, seedLocalStorage = {}, widths, auditAllow = {}, apiMocks = {}, contentSelectors, localeStorageKey = 'i18n.lang', rtlLocale = 'ar' } = JSON.parse(readFileSync(CONFIG, 'utf8'))

/* Which element IS the content column. The design system and the apps that
 * follow it use `.page-content`; the page-template blocks own their wrappers
 * (`.list-page`, `.adaptive-list-page`, `.detail-page`), so all four are the
 * default. A package that genuinely named its own container says so here rather
 * than having the header rules quietly skip.
 *
 * The list is not cosmetic: when an app moved onto `<AdaptiveListPage>` this
 * rule dropped straight to zero, because the wrapper it had been measuring no
 * longer existed on those screens. The per-rule tally is the only reason that
 * was visible at all.
 *
 * One app is why this exists and also why no package uses it: its page class and
 * `.vet-page` matched nothing, `header-aligns` sat at zero, and the audit read
 * green because the rule never ran. Widening the selector would have hidden
 * that; it adopted `.page-content` instead, which is the actual fix — the cap
 * and the inline padding that keep header and content aligned now come from one
 * place there, as they always did everywhere else. */
const CONTENT = contentSelectors ?? ['.page-content', '.list-page', '.adaptive-list-page', '.detail-page']

/* The drawer breakpoint, in CSS pixels. One number, read by the two nav rules, so
 * a check can never disagree with the stylesheet by accident. Keep it in step with
 * `@media (max-width: 48rem)` in AppShell.css and PageHeader.css. */
const DRAWER_MAX = 768

/* Sub-pixel slack. Browsers hand back fractional widths from percentage and
 * container-query maths, and a rule that fires on 0.5px is a rule people turn off. */
const SLACK = 2

/* eslint-disable no-undef -- the body below is serialised and executed in the
 * BROWSER by page.evaluate, so document/getComputedStyle are the right globals
 * there; ESLint reads this file as Node and cannot tell the two apart. */

/** Everything measured in one pass, in the page, so the rules read plain values.
 *  `slack` is passed in, not closed over: this body is serialised and run in the
 *  browser, where nothing from this module exists. */
function measure({ slack, contentSelectors }) {
  /* Inner edge, not the border box: `.page-content` carries the page's inline
   * padding, so its border box starts at 0 while what the user sees starts 32px
   * in. Comparing one element's border box with another's content box is how the
   * first version of this rule reported every screen as broken. */
  const box = (sel) => {
    const el = document.querySelector(sel)
    if (!el) return null
    const r = el.getBoundingClientRect()
    const cs = getComputedStyle(el)
    return {
      left: r.left + parseFloat(cs.paddingLeft || '0'),
      right: r.right - parseFloat(cs.paddingRight || '0'),
      width: r.width,
    }
  }
  const doc = document.documentElement

  /* Widest element that sticks out past the viewport, named, so the failure says
   * WHAT overflows instead of just that something does. */
  let worst = null
  for (const el of document.querySelectorAll('body *')) {
    const r = el.getBoundingClientRect()
    if (r.width === 0 || r.height === 0) continue
    const over = Math.max(r.right - doc.clientWidth, -r.left)
    if (over > (worst?.over ?? 0)) {
      worst = { over, tag: el.tagName.toLowerCase(), cls: String(el.className).slice(0, 60) }
    }
  }

  /* Grid rows that leave more than one whole column unused. `auto-fill` with a
   * fixed max does this silently. */
  const grids = []
  for (const el of document.querySelectorAll('*')) {
    const cs = getComputedStyle(el)
    if (cs.display !== 'grid') continue
    const cols = cs.gridTemplateColumns.split(' ').filter(Boolean).map(parseFloat)
    if (cols.length === 0 || cols.some(Number.isNaN)) continue
    const gap = parseFloat(cs.columnGap) || 0
    const used = cols.reduce((a, b) => a + b, 0) + gap * (cols.length - 1)
    const avail = el.getBoundingClientRect().width
    const spare = avail - used
    // One more column would fit: the row is wasting a column's worth of space.
    if (cols.length >= 1 && spare > cols[0] + gap + slack) {
      grids.push({ cls: String(el.className).slice(0, 60), avail: Math.round(avail), used: Math.round(used), spare: Math.round(spare), cols: cols.length })
    }
  }

  return {
    docScrollWidth: doc.scrollWidth,
    docClientWidth: doc.clientWidth,
    worst,
    header: box('.page-header .page-header-row') ?? box('.page-header'),
    headerActions: box('.page-header-actions'),
    /* A card must not inherit centred text from a centred page container: the
     * title would centre while the meta row below it stays left, at some widths
     * and not others. */
    centredCards: [...document.querySelectorAll('.card')]
      .filter((el) => getComputedStyle(el).textAlign === 'center')
      .map((el) => String(el.className).slice(0, 50)),
    content: contentSelectors.reduce((found, sel) => found ?? box(sel), null),
    /* The content wrapper's first visible child, for column-not-centred: the
     * wrapper can align with the header while a capped child centres INSIDE it
     * (For Review, 2026-08-21 — header-aligns was green, the screen was not).
     * Centred-on-purpose blocks announce themselves with text-align: center
     * (EmptyState, a welcome), so their alignment is skipped. */
    contentChild: (() => {
      const wrap = contentSelectors.map((sel) => document.querySelector(sel)).find(Boolean)
      const child = wrap && [...wrap.children].find((el) => el.getBoundingClientRect().height > 0)
      if (!child) return null
      const r = child.getBoundingClientRect()
      return { left: r.left, right: r.right, width: r.width, centredText: getComputedStyle(child).textAlign === 'center' }
    })(),
    /* Controls standing side by side must be the same height.
     *
     * The system has one control scale (sm 32 / md 40 / lg 52) but the components
     * do NOT share a default: a Button with no size is 40 and an IconButton with
     * no size is 32. So the most ordinary composition there is — a primary action
     * with an icon button next to it — comes out ragged, and every screen has to
     * remember to say so. This asks the rendered page instead.
     *
     * Only real siblings on the SAME visual line are compared, found by their
     * vertical centres rather than by DOM order, so a wrapped row is two rows
     * here as well. Link buttons are excluded: `variant="link"` sets height auto
     * on purpose, precisely so it reads as text and not as a pill. */
    controlRows: (() => {
      const SEL = '.btn, .icon-button, .segmented, .select-trigger, .filter-chip, .input, .search-input'
      /* Controls are grouped by the ROW they are painted on, not by their parent.
       * The first version of this rule compared DOM siblings and was a no-op for
       * the very defect it was written for: the icon button sits inside a
       * <Tooltip> wrapper, so it was a nephew of the button beside it, not a
       * sibling. Geometry does not care how the JSX is nested. */
      const controls = [...document.querySelectorAll(SEL)].filter((el) => {
        if (el.matches('.btn') && el.dataset.variant === 'link') return false   // height auto by design
        if (el.parentElement?.closest(SEL)) return false                        // a control inside a control
        const s = getComputedStyle(el)
        if (s.display === 'none' || s.visibility === 'hidden') return false
        const r = el.getBoundingClientRect()
        return r.width > 0 && r.height > 0
      })
      /* The row container: the nearest laying-out ancestor. Two controls only
       * belong to one row if the same box arranges them. */
      const rowOf = (el) => {
        for (let p = el.parentElement; p; p = p.parentElement) {
          const d = getComputedStyle(p).display
          if (d.includes('flex') || d.includes('grid')) return p
        }
        return document.body
      }
      const lines = new Map()
      for (const el of controls) {
        const r = el.getBoundingClientRect()
        const key = `${rowOf(el).className || rowOf(el).tagName}|${Math.round((r.top + r.bottom) / 2 / 8)}`
        if (!lines.has(key)) lines.set(key, [])
        lines.get(key).push({ cls: String(el.className).split(' ')[0], h: Math.round(r.height) })
      }
      const out = []
      for (const [key, line] of lines) {
        if (line.length < 2) continue
        if (new Set(line.map((x) => x.h)).size < 2) continue
        out.push({ where: key.split('|')[0].split(' ')[0], parts: line.map((x) => `${x.cls}:${x.h}`).join(' ') })
      }
      return out
    })(),
    /* The drawer trigger: present, and actually reachable by a finger.
     *
     * "Present" was the whole check for one iteration, and it passed while the
     * button sat underneath the page header with only its bottom half showing.
     * Geometry alone would not have caught that either — the boxes have to be
     * compared against everything that could paint over them. Asking the browser
     * what is topmost at the button's own centre is the direct question. */
    navTrigger: (() => {
      const el = document.querySelector('.nav-drawer-button')
      if (!el || getComputedStyle(el).display === 'none') return null
      const r = el.getBoundingClientRect()
      const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)
      const name = (n) => (n ? `<${n.tagName.toLowerCase()} class="${String(n.className).split(' ')[0]}">` : 'nothing')
      return {
        covered: !(top && (el === top || el.contains(top) || top.contains(el))),
        coveredBy: name(top),
        clipped: r.top < -0.5 || r.left < -0.5 || r.bottom > doc.clientHeight + 0.5,
      }
    })(),
    /* Navigation that belongs to the app CHROME and is on screen right now.
     *
     * This asked for `.side-nav` or `.sidebar` and nothing else, which made it
     * wrong for every product that navigates from a top bar: it reported "the
     * sidebar is off screen" about an app that has no sidebar by design, and
     * four screens in one app were recorded as dead ends because of it.
     *
     * The question is not which component the navigation is. It is whether a
     * navigation landmark OUTSIDE the page content is visible at this width —
     * a rail, a top bar, a tab bar, anything persistent. A <nav> inside <main>
     * is part of the page (a breadcrumb within an article, an in-page index)
     * and is deliberately not counted, or the rule would pass on any screen
     * that happens to contain a list of links. */
    navBox: (() => {
      const main = document.querySelector('main')
      for (const nav of document.querySelectorAll('nav, .side-nav, .sidebar')) {
        if (main && main.contains(nav)) continue
        const s = getComputedStyle(nav)
        if (s.display === 'none' || s.visibility === 'hidden') continue
        const r = nav.getBoundingClientRect()
        if (r.width > 0 && r.height > 0) return { left: r.left, right: r.right, width: r.width }
      }
      return null
    })(),
    /* The other thing the leading slot can hold. On a sub-screen this IS the
     * way out, and no drawer trigger should be there beside it. */
    back: !!document.querySelector('.page-header-back'),
    isRtl: document.documentElement.dir === 'rtl',
    /* The page's name in the document outline. One h1 identifies the screen; two
     * mean two "top" sections and neither is the page; none means a screen
     * reader has nothing to announce it by. Visually hidden counts — the console
     * screen shows no title on purpose and carries one that way. */
    headings: [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map((h) => Number(h.tagName[1])),
    grids,
  }
}
/* eslint-enable no-undef */

const RESET = '\x1b[0m', RED = '\x1b[31m', GREEN = '\x1b[32m', DIM = '\x1b[2m', BOLD = '\x1b[1m'
const allowed = (screen, rule) => (auditAllow[rule] ?? []).includes(screen)

const { server, port } = await serveDir(DIST)
const browser = await chromium.launch()
const failures = []
let checks = 0
/* Per-rule tally. A total on its own cannot tell "93 checks passed" from "93
 * checks passed and four rules never ran because the selector matched nothing",
 * and this repository has already shipped one linter rule that silently checked
 * nothing for weeks. A rule at zero is a coverage gap, not a clean bill. */
const ran = new Map()
const RULES = ['axe', 'no-overflow', 'header-aligns', 'column-not-centred', 'actions-flush-end', 'card-text-aligns', 'one-page-heading', 'heading-order', 'grid-fills-row', 'controls-same-height', 'nav-reachable', 'nav-not-doubled', 'nav-one-leading-control', 'nav-trigger-hittable']
for (const r of RULES) ran.set(r, 0)

console.log(`${BOLD}Page audit${RESET} ${DIM}${screens.length} screen(s) x ${widths.length} width(s)${RESET}\n`)

/* Screens are independent, and almost all of the wall time is waiting for a page
 * to load and settle. Four lanes pull from one queue; the per-screen lines are
 * printed in config order afterwards so a failure is where you expect it. */
const LANES = 4

async function auditScreen({ name, path, theme = 'light', anonymous = false, hasNav = true, dir = 'ltr' }) {
  const notes = []
  for (const { label, width, height } of widths) {
    const page = await browser.newPage({
      viewport: { width, height },
      deviceScaleFactor: 1,
      colorScheme: theme === 'dark' ? 'dark' : 'light',
      reducedMotion: 'reduce',
    })
    /* Right-to-left is a rendering mode, not a translation. The system says it is
     * RTL-ready and uses logical properties everywhere, Arabic is a shipped
     * locale — and no screen had ever been rendered mirrored. Setting `dir` on
     * <html> before the app boots is what the language switch does at runtime. */
    if (dir === 'rtl') {
      /* The app decides `dir` from the stored language at boot, so seeding the
       * language IS the switch — setting the attribute alone gets overwritten a
       * frame later, and the audit then measures an LTR page while reporting on
       * RTL. That is exactly what the first version of this did: 270 checks
       * passed against a page that was never mirrored. */
      await page.addInitScript(
        ([key, lang]) => localStorage.setItem(key, lang),
        [localeStorageKey, rtlLocale],
      )
    }
    if (!anonymous) {
      await page.addInitScript((seed) => {
        for (const [k, v] of Object.entries(seed)) localStorage.setItem(k, v)
      }, seedLocalStorage)
    }
    await installApiMocks(page, apiMocks, ROOT)
    await page.goto(`http://127.0.0.1:${port}${path}`, { waitUntil: 'networkidle' })
    await page.evaluate('document.fonts.ready')
    const m = await page.evaluate(measure, { slack: SLACK, contentSelectors: CONTENT })

    await page.addScriptTag({ content: AXE_SOURCE })
    const axeResult = await page.evaluate(async () =>
      /* eslint-disable-next-line no-undef -- axe is the script injected above; this body runs in the browser. */
      await window.axe.run(document, {
        resultTypes: ['violations'],
        rules: {
          /* Page-level landmark rule. A screen IS a page here, so it applies —
           * unlike the component gallery, where it fires on every component. */
          region: { enabled: true },
        },
      }),
    )
    await page.close()

    const at = `${name} @${label}(${width})${dir === 'rtl' ? ' rtl' : ''}`
    const tally = (rule) => { checks++; ran.set(rule, (ran.get(rule) ?? 0) + 1) }
    const fail = (rule, detail) => {
      tally(rule)
      if (allowed(name, rule)) { notes.push(`${DIM}allowed: ${rule} @${label}${RESET}`); return }
      failures.push(`${at}  ${rule}: ${detail}`)
    }
    const pass = (rule) => { tally(rule) }

    // 1. Nothing may stick out sideways.
    if (m.docScrollWidth > m.docClientWidth + SLACK) {
      fail('no-overflow', `document scrolls ${m.docScrollWidth - m.docClientWidth}px sideways; widest offender <${m.worst?.tag} class="${m.worst?.cls}"> by ${Math.round(m.worst?.over ?? 0)}px`)
    } else pass('no-overflow')

    /* Inline edges, not left and right. In RTL the row starts on the right and
     * ends on the left, so a rule written in physical sides measures the wrong
     * end and reports a mirrored-but-correct screen as broken. The first RTL run
     * did exactly that on four screens. */
    const startEdge = (box) => (m.isRtl ? -box.right : box.left)
    const endEdge = (box) => (m.isRtl ? box.left : -box.right)

    // 2. The header and the content start at the same inline edge.
    if (m.header && m.content) {
      const off = Math.abs(startEdge(m.header) - startEdge(m.content))
      if (off > SLACK) {
        fail('header-aligns', `page title starts ${Math.round(off)}px from the content column (header ${Math.round(m.header.left)}, content ${Math.round(m.content.left)}) — the screen is probably capping its width a second time`)
      } else pass('header-aligns')

      /* 2a. ...and nothing inside the content may cap itself and float centre.
       * A narrow column centred under a left-aligned title reads as two
       * screens (the G2 lesson); the fix is aligning the column with the
       * header, or putting the header inside the column the way
       * SettingsPageTemplate does. */
      if (m.contentChild && !m.contentChild.centredText) {
        const gapStart = Math.abs(startEdge(m.contentChild) - startEdge(m.content))
        const gapEnd = Math.abs(endEdge(m.contentChild) - endEdge(m.content))
        if (gapStart > 48 && Math.abs(gapStart - gapEnd) <= 8) {
          fail('column-not-centred', `the content column caps itself ${Math.round(m.contentChild.width)}px wide and floats centre, ${Math.round(gapStart)}px off the title's edge — align it with the header, or put the header inside the column (SettingsPageTemplate's way)`)
        } else pass('column-not-centred')
      }
    }

    // 2b. Header actions sit flush at the trailing edge of the header row.
    if (m.header && m.headerActions) {
      const gap = endEdge(m.headerActions) - endEdge(m.header)
      if (gap > SLACK) {
        fail('actions-flush-end', `header actions stop ${Math.round(gap)}px short of the row's trailing edge — something is absorbing the space that should push them out`)
      } else pass('actions-flush-end')
    }

    // 2c. Cards keep their own text alignment.
    if (m.centredCards.length) {
      fail('card-text-aligns', `${m.centredCards.length} card(s) inherit text-align: center from a page container (first: .${m.centredCards[0].split(' ')[0]})`)
    } else pass('card-text-aligns')

    // 2d. One h1, and no level skipped on the way down.
    {
      const h1s = m.headings.filter((l) => l === 1).length
      const skip = m.headings.findIndex((l, i) => i > 0 && l - m.headings[i - 1] > 1)
      if (h1s !== 1) {
        fail('one-page-heading', `${h1s} <h1> on the page; exactly one names the screen`)
      } else if (skip > 0) {
        fail('heading-order', `heading level jumps from h${m.headings[skip - 1]} to h${m.headings[skip]} — the outline skips a level, so a section cannot be reached by walking it`)
      } else pass('one-page-heading')
    }

    // 3. A grid row must not waste a whole column.
    if (m.grids.length) {
      for (const g of m.grids) {
        fail('grid-fills-row', `.${g.cls.split(' ')[0]} has ${g.cols} column(s) using ${g.used}px of ${g.avail}px, ${g.spare}px spare — use 1fr as the minmax maximum`)
      }
    } else pass('grid-fills-row')

    // 3b. Controls standing next to each other must be one height.
    if (m.controlRows.length) {
      for (const r of m.controlRows) {
        fail('controls-same-height', `.${r.where} puts controls of different heights on one line (${r.parts}) — the system's scale is sm 32 / md 40 / lg 52, and the components do not share a default`)
      }
    } else pass('controls-same-height')

    // 4-6. The navigation: reachable below the breakpoint, not doubled above it,
    //      and the trigger actually hittable rather than merely present.
    if (hasNav) {
      const navOnScreen = !!m.navBox && m.navBox.right > 0 && m.navBox.width > 0
      if (width <= DRAWER_MAX) {
        /* Either occupant of the leading slot counts. Requiring the drawer
         * trigger specifically was wrong and this rule said so on its first run:
         * a detail screen shows "back", and both Material and the Apple HIG are
         * explicit that a sub-screen offers back INSTEAD of the drawer, not
         * beside it. You reach the navigation by going up first. What must never
         * happen is a screen with neither. */
        if (!navOnScreen && !m.navTrigger && !m.back) {
          fail('nav-reachable', 'the sidebar is off screen and the leading slot is empty: no back button and no drawer trigger, so this screen is a dead end')
        } else pass('nav-reachable')
      } else if (m.navTrigger && navOnScreen) {
        fail('nav-not-doubled', 'the sidebar is visible AND a drawer trigger is showing')
      } else pass('nav-not-doubled')

      if (m.navTrigger && m.back) {
        fail('nav-one-leading-control', 'both a back button and a drawer trigger are showing — the leading slot holds one or the other')
      } else pass('nav-one-leading-control')

      if (m.navTrigger?.covered) {
        fail('nav-trigger-hittable', `the drawer trigger is painted over by ${m.navTrigger.coveredBy} — a click at its centre lands on that instead`)
      } else if (m.navTrigger?.clipped) {
        fail('nav-trigger-hittable', 'the drawer trigger is cut off by the viewport edge')
      } else pass('nav-trigger-hittable')
    }

    // 8. Accessibility, in a real browser: contrast included.
    if (axeResult.violations.length) {
      for (const v of axeResult.violations) {
        const where = v.nodes[0]?.target?.join(' ') ?? '?'
        fail('axe', `${v.id} (${v.impact}) on ${v.nodes.length} node(s), first: ${where}`)
      }
    } else pass('axe')
  }
  const bad = failures.filter((f) => f.startsWith(`${name} `)).length
  return `  ${bad ? RED + '✗' : GREEN + '✓'}${RESET} ${name}${notes.length ? ' ' + notes.join(' ') : ''}`
}

const lines = new Array(screens.length)
let next = 0
const lane = async () => {
  for (;;) {
    const i = next++
    if (i >= screens.length) return
    lines[i] = await auditScreen(screens[i])
  }
}
await Promise.all(Array.from({ length: LANES }, lane))
for (const l of lines) console.log(l)

await browser.close()
server.close()

if (failures.length) {
  console.error(`\n${RED}✗ ${failures.length} rule violation(s):${RESET}`)
  for (const f of failures) console.error(`    ${f}`)
  console.error(`\n  Fix the screen, or record the exception in config/screens.config.json → auditAllow with a reason.`)
  process.exit(1)
}
console.log(`\n${GREEN}✓ ${checks} page-composition check(s) pass.${RESET}`)
const idle = [...ran].filter(([, n]) => n === 0).map(([r]) => r)
console.log(`  ${DIM}${[...ran].filter(([, n]) => n > 0).map(([r, n]) => `${r} ${n}`).join('  ')}${RESET}`)
if (idle.length) {
  console.log(`  ${DIM}never ran here: ${idle.join(', ')} — no screen in this config exercises them${RESET}`)
}
