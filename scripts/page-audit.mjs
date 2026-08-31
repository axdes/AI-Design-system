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
//   1b. shell-covers-the-page  the checkbox's own hidden input is absolutely
//                         positioned with no positioned ancestor, so it resolved
//                         against the PAGE, escaped the shell's overflow and made
//                         the document 33px taller than a shell that is exactly
//                         100dvh: a white strip under the form, on every screen
//                         with a checkbox in an inner scroller
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

const { screens, seedLocalStorage = {}, widths: shotWidths, auditWidths = [], auditAllow = {}, axeRules = {}, apiMocks = {}, contentSelectors, localeStorageKey = 'i18n.lang', rtlLocale = 'ar' } = JSON.parse(readFileSync(CONFIG, 'utf8'))

/* Which element IS the content column. The design system and the apps that
 * follow it use `.page-content`; the page-template blocks own their wrappers
 * (`.list-page`, `.adaptive-list-page`, `.detail-page`), so all four are the
 * default. A package that genuinely named its own container says so here rather
 * than having the header rules quietly skip.
 *
 * `.page-inner` leads the list and is the one that matters now: <Page> splits
 * the cap from the padding across two elements, so the block classes above
 * (`.list-page`, `.adaptive-list-page`) land on the OUTER one, which has no
 * inline padding. Measured against that, every list screen read "title 32px
 * from the content column" while the pixels had not moved at all — the rule was
 * measuring the wrong box, which is exactly the failure the paragraph below
 * describes, one structure later.
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
const CONTENT = contentSelectors ?? ['.page-inner', '.page-content', '.list-page', '.adaptive-list-page', '.detail-page']

/* The drawer breakpoint, in CSS pixels. One number, read by the two nav rules, so
 * a check can never disagree with the stylesheet by accident. Keep it in step with
 * `@media (max-width: 48rem)` in AppShell.css and PageHeader.css. */
const DRAWER_MAX = 768

/* The screenshot widths, plus any this audit adds for itself. A committed PNG
 * costs a baseline per screen, so `widths` stays the set worth LOOKING at; a
 * viewport that only asserts rules costs nothing, and the one it was added for
 * is a SHORT window: every shot height is 844px or more, and a locked shell only
 * shows the white strip under it when the page is taller than the window. */
const widths = [...shotWidths, ...auditWidths]

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
    /* The TRACKS' box, not the element's: a component that is itself a grid
     * carries its own padding, and counting that padding as spare reported a
     * 313px tile as 34px short of another column (23.08). */
    const box = el.getBoundingClientRect().width
    const avail = box
      - (parseFloat(cs.paddingInlineStart) || 0) - (parseFloat(cs.paddingInlineEnd) || 0)
      - (parseFloat(cs.borderInlineStartWidth) || 0) - (parseFloat(cs.borderInlineEndWidth) || 0)
    const spare = avail - used
    /* A single column that the author centred on purpose is a reading measure, not
     * a packing accident: `justify-content: center` is the decision written down.
     * The rule is about auto-fill tracks pinned to a fixed max, which pack at that
     * max and leave a column's worth of nothing beside them. */
    if (cols.length === 1 && cs.justifyContent === 'center') continue
    // One more column would fit: the row is wasting a column's worth of space.
    if (cols.length >= 1 && spare > cols[0] + gap + slack) {
      grids.push({ cls: String(el.className).slice(0, 60), avail: Math.round(avail), used: Math.round(used), spare: Math.round(spare), cols: cols.length })
    }
  }

  /* ── COMPOSITION, not conformance ─────────────────────────────────────────
   * Everything above asks whether an element is CORRECT. These ask whether the
   * page is worth looking at, which had no check at all: a screen using 66% of
   * its column with a dead right rail passed 480 of them (2026-08-21, the tour
   * screen the owner called ugly). Emptiness only exists in a real browser, so
   * this is the only place it can be measured. */
  const compositionOf = () => {
    const contentEl = contentSelectors.map((s) => document.querySelector(s)).find(Boolean)
    if (!contentEl) return null
    const cr = contentEl.getBoundingClientRect()
    /* "Painted" = something a reader can see: a surface, a border, or its own
     * text. A wrapper that only groups children is not content, and counting it
     * would make an empty page look full. */
    const painted = []
    for (const el of contentEl.querySelectorAll('*')) {
      const r = el.getBoundingClientRect()
      if (r.width < 8 || r.height < 8) continue
      const cs = getComputedStyle(el)
      const surface = cs.backgroundColor !== 'rgba(0, 0, 0, 0)' || cs.borderTopWidth !== '0px'
      const ownText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 1)
      if (!surface && !ownText) continue
      painted.push({ top: r.top, bottom: r.bottom, width: r.width, left: r.left, right: r.right, tag: el.tagName.toLowerCase(), cls: String(el.className).slice(0, 24) })
    }
    /* The SPAN the content occupies, not the widest single element. A grid of
     * three cards fills its row while no card is wide, and measuring the widest
     * element called that screen 30% full. What matters is where the content
     * starts and where it ends. */
    let spanL = Infinity, spanR = 0
    for (const b of painted) { spanL = Math.min(spanL, b.left); spanR = Math.max(spanR, b.right) }
    const widest = painted.length ? spanR - spanL : 0
    const widestEl = painted.reduce((a, b) => (b.width > (a?.width ?? 0) ? b : a), null)
    /* The tallest run of pixels with nothing painted in it. Walking a frontier
     * is enough: an element starting inside the previous one cannot open a gap. */
    let frontier = cr.top, dead = 0, deadAt = 0
    for (const b of [...painted].sort((a, b2) => a.top - b2.top)) {
      if (b.top - frontier > dead) { dead = b.top - frontier; deadAt = Math.round(frontier) }
      frontier = Math.max(frontier, b.bottom)
    }
    /* Consecutive paragraphs with nothing between them: a wall of prose is the
     * shape of a page nobody composed. */
    /* SIBLINGS, not document order. A transcript is a dozen paragraphs each in its
     * own row with its own speaker and time — a repeated structure, which is the
     * content doing its job. A wall is paragraphs stacked as siblings under one
     * parent with nothing between them, which is a page that talks instead of
     * showing. Same distinction the icon rule makes. */
    let wall = 0
    for (const parent of [contentEl, ...contentEl.querySelectorAll('*')]) {
      let run = 0
      for (const el of parent.children) {
        if (el.tagName === 'P') { run += 1; wall = Math.max(wall, run) } else run = 0
      }
    }
    /* The same glyph twice inside one row or card: the row saying one thing in
     * two places (For Review shipped exactly that, 2026-08-21). */
    const repeatedIcons = []
    const ITEM = '.content-row, .card, .list-item'
    /* LEAF items only. A card that contains four rows is not an item, it is a
     * container, and counting glyphs across it reports four Approve buttons as a
     * duplicate — which is the rule crying wolf on a correct list. */
    for (const item of [...contentEl.querySelectorAll(ITEM)].filter((el) => !el.querySelector(ITEM))) {
      /* Same glyph, DIFFERENT role. A checklist repeats one tick per row and that
       * is the list working; the defect is one glyph appearing twice in two
       * different places of the same item — a media tile and the eyebrow under
       * it saying the identical thing. The two are told apart by where the icon
       * sits: identical ancestor chains mean a repeated structure, different
       * chains mean the item said it twice. */
      const sig = (el) => {
        const parts = []
        for (let n = el.parentElement; n && n !== item; n = n.parentElement) parts.push(String(n.className).replace(/\s+/g, '.'))
        return parts.join('>')
      }
      const seen = new Map(), dupe = new Set()
      for (const s of item.querySelectorAll('svg')) {
        /* A glyph inside a CONTROL belongs to the control, not to the item's
         * content: a select-all checkbox and the row checkboxes under it are
         * one control at two levels, which is the pattern working, and the
         * same is true of a tick in a checkbox and a chevron in a disclosure.
         * The defect this rule is for is an ITEM saying the same thing twice
         * (a media tile and the eyebrow under it), and neither of those sits
         * in a button or a label. (Caught by the tables gallery, 23.08.) */
        if (s.closest('button, label, [role="button"], [role="checkbox"], [role="switch"]')) continue
        const name = s.getAttribute('data-icon') ?? s.querySelector('path')?.getAttribute('d')?.slice(0, 24) ?? ''
        if (!name) continue
        const where = sig(s)
        const prev = seen.get(name)
        if (prev !== undefined && prev !== where) dupe.add(name)
        else seen.set(name, where)
      }
      if (dupe.size) repeatedIcons.push(`${String(item.className).slice(0, 24)} “${(item.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 40)}”`)
    }
    /* The template's aside, not the app's navigation: <aside> is also what the
     * shell wraps its sidebar in, and measuring that reported a full-height rail
     * on every screen. */
    /* INK vs AIR inside a row.
     *
     * The span measure above is satisfied by the very thing that is wrong: a row
     * stretched to 2400px is "96% of the column" and also a desert with a title at
     * one edge and two buttons at the other. So this measures the row itself —
     * how much of its width carries something. Ink is the sum of what its own
     * children occupy; the rest is nothing. A row that is mostly nothing needs a
     * cap or another column, and no proxy for beauty is involved. */
    const airyRows = []
    for (const item of [...contentEl.querySelectorAll(ITEM)].filter((el) => !el.querySelector(ITEM))) {
      const r = item.getBoundingClientRect()
      if (r.width < 900) continue
      let ink = 0
      for (const kid of item.children) {
        const k = kid.getBoundingClientRect()
        if (k.width < 2 || k.height < 2) continue
        /* A child that fills the row is a wrapper: measure ITS children instead,
         * or the answer is always 100%. */
        if (k.width > r.width * 0.9 && kid.children.length) {
          for (const g of kid.children) {
            const gk = g.getBoundingClientRect()
            if (gk.width >= 2) ink += gk.width
          }
        } else ink += k.width
      }
      const density = ink / r.width
      if (density < 0.55) airyRows.push(`${Math.round(density * 100)}% of ${Math.round(r.width)}px — “${(item.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 32)}”`)
    }
    /* A pill that stretched.
     *
     * Badge, Chip and Button size themselves to their label. Drop one into a flex
     * column or a grid cell and `align-items: stretch` pulls it to the full width,
     * where a badge reads as a text input and a button as a banner. The label sits
     * at one end and the rest is empty pill. Measured, not judged: the element is
     * wider than its own text plus its padding. */
    /* A card that does not hold its content.
     *
     * A name, a role, a meta fact or a title that ends up wider than the card's
     * content box hangs over the edge or gets cut by it — the reader sees
     * "Software Engineering Team Leade". The page audit shoots five widths, and
     * this class of defect only appears at some of them, which is exactly why
     * it survived a green gate and a screenshot review: measured 22.08, the
     * vertical Identity spilled at eighteen widths between 520 and 1400 and
     * nobody's eye was on those. Media is exempt: it bleeds on purpose. */
    /* A NEGATIVE INLINE MARGIN IS A DECLARATION, not an accident: it is how a
     * part says it bleeds into the card's padding on purpose — media does it,
     * and so does a row whose hover band has to reach past the words. The part
     * and everything inside it is exempt; everything else still has to fit. */
    const bleeders = new Set()
    for (const el of contentEl.querySelectorAll('.card *')) {
      const s = getComputedStyle(el)
      if ((parseFloat(s.marginInlineStart) || 0) < 0 || (parseFloat(s.marginInlineEnd) || 0) < 0) bleeders.add(el)
    }
    const bleeds = (el) => {
      for (let n = el; n; n = n.parentElement) if (bleeders.has(n)) return true
      return false
    }
    const spills = []
    for (const card of contentEl.querySelectorAll('.card')) {
      const cr = card.getBoundingClientRect()
      const cs = getComputedStyle(card)
      const left = cr.left + parseFloat(cs.paddingLeft || '0')
      const right = cr.right - parseFloat(cs.paddingRight || '0')
      const label = (card.querySelector('.card-title, .identity-name, h2, h3')?.textContent ?? '').trim().slice(0, 28)
      /* A scroll container is the written statement "what I hold is wider than
       * me, and that is the design": a table inside `TableScroll` is SUPPOSED to
       * run past the card and be dragged. Measuring its descendants against the
       * card's edge reported the admin portal's user table as 1051px of spill on
       * a phone — the one screen in this repository that puts a table in a card,
       * which is why it took a second product to find it. The container itself is
       * still measured; only what it scrolls is exempt. */
      const scrolled = (node) => {
        for (let p = node.parentElement; p && p !== card; p = p.parentElement) {
          const o = getComputedStyle(p).overflowX
          if (o === 'auto' || o === 'scroll') return true
        }
        return false
      }
      for (const el of card.querySelectorAll('*')) {
        const r = el.getBoundingClientRect()
        if (r.width === 0 && r.height === 0) continue
        if (el.closest('.card-media, .card-stack')) continue
        if (bleeds(el) || scrolled(el)) continue
        const over = Math.max(r.right - right, left - r.left)
        if (over > 1.5) {
          spills.push(`“${label}” — ${String(el.className).split(' ')[0] || el.tagName.toLowerCase()} “${(el.textContent ?? '').trim().slice(0, 24)}” ${Math.round(over)}px past the card`)
          break
        }
      }
    }

    /* THE CARD'S RHYTHM IS ONE SET OF STEPS, NOT A NUMBER PER CARD.
     *
     * A card stacks its parts on the card's own gap: 8 between lines that
     * belong together, 16 before a component (a table, a chart, a list), 24
     * after media that bleeds to the edges, 0 between rows of a list that carry
     * their own padding. Anything else is a guest's stylesheet deciding the
     * card's spacing for it, which is how three cards side by side ended up
     * with a table 36px under its title, a timeline at 8 and a list at 12
     * (owner, 23.08: the same distances everywhere, and reusable).
     *
     * The footer is exempt: `.card-meta` floats to the foot of a stretched
     * card, so the space above it belongs to the ROW's height, not to a step. */
    /* THE STEPS ARE THE SYSTEM'S, READ FROM THE SYSTEM. This was the hardcoded
       list [0, 4, 8, 16, 24], which quietly omitted 12 — `--space-3`, a step on
       the same 4px grid as every other one — and so failed real screens for
       using a real token (owner, 2026-08-26: "why is 12 missing, it is on the
       grid"). A rule that restates a scale instead of reading it will drift
       from it, and the drift lands on whoever is unlucky enough to use the
       missing step. */
    /* The scale is the grid unit times the multipliers the token names carry:
       --space-3 IS 3 units. Read the unit and multiply. A `var()` written into
       an inline height does not reliably give a used value back (measured: every
       step came out 4px), and getPropertyValue hands back the calc() as text. */
    const unit = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--grid-unit')) || 4
    const STEPS = [0, ...[1, 2, 3, 4, 5, 6, 8, 12, 16].map((m) => m * unit)]
    const rhythm = []
    for (const card of contentEl.querySelectorAll('.card')) {
      /* The steps are the CARD's own column. A card that a component has re-laid
       * as a grid (a thumbnail beside two rows, at ContentCard's narrowest) is
       * placing its parts by areas, and the distance between two of them is a
       * track height, not a step. */
      if (!getComputedStyle(card).display.includes('flex')) continue
      const kids = [...card.children].filter((k) => {
        const r = k.getBoundingClientRect()
        return getComputedStyle(k).display !== 'none' && r.height > 0
      })
      const label = (card.querySelector('.card-title, .identity-name, h2, h3')?.textContent ?? '').trim().slice(0, 24)
      for (let i = 0; i < kids.length - 1; i += 1) {
        const a = kids[i], b = kids[i + 1]
        /* `margin-block-start: auto` is a part saying it sits at the FOOT of the
         * card. The space above it is the row's height, not a step — and the
         * question has to be put to the TYPED style map, because
         * getComputedStyle resolves an auto margin to the pixels it used (0px
         * here), which is the one answer that cannot be told from a real zero. */
        let pinned = false
        try { pinned = String(b.computedStyleMap().get('margin-block-start')) === 'auto' } catch { pinned = false }
        if (pinned) continue
        if (getComputedStyle(b).position === 'absolute' || getComputedStyle(a).position === 'absolute') continue
        const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect()
        if (rb.top < ra.bottom - 0.5) continue
        const gap = Math.round(rb.top - ra.bottom)
        if (STEPS.some((step) => Math.abs(gap - step) <= 1)) continue
        const name = (el) => String(el.className).split(' ')[0] || el.tagName.toLowerCase()
        rhythm.push(`“${label}” — ${gap}px between ${name(a)} and ${name(b)}`)
      }
    }

    const stretchedPills = []
    for (const el of contentEl.querySelectorAll('.badge, .chip, .btn')) {
      const r = el.getBoundingClientRect()
      if (r.width < 40) continue
      /* A pill is a FILLED shape sized to its label. The link variant has no
       * fill, and when the link is a card's title it is a heading that runs the
       * width of its card on purpose. */
      if (el.dataset.variant === 'link') continue
      const range = document.createRange()
      range.selectNodeContents(el)
      const text = range.getBoundingClientRect().width
      const cs = getComputedStyle(el)
      const pad = parseFloat(cs.paddingInlineStart || '0') + parseFloat(cs.paddingInlineEnd || '0')
      if (text > 0 && r.width > text + pad + 24) {
        stretchedPills.push(`${String(el.className).split(' ')[0]} “${(el.textContent ?? '').trim().slice(0, 18)}” ${Math.round(r.width)}px for ${Math.round(text)}px of text`)
      }
    }
    /* ── One stack, one alignment ──────────────────────────────────────────
     * Parts stacked in a column, one hugging the left edge of the stack and a
     * sibling hugging the right edge. It reads as two clusters that happen to
     * share a container, and it is almost never typed on purpose: it is what a
     * container is left holding when its layout mode changes underneath it.
     * That is exactly how it got here — `align-self: end / center / start`
     * placed three ROWS on the vertical axis of a `1fr auto 1fr` grid, the
     * container became a flex column, the same three words silently became
     * horizontal, and the library's hero title ran to the right edge while its
     * two buttons sat at the left one. Fifteen screens times five widths of
     * geometry rules were green on it, because every one of them measures a
     * part against the COLUMN and each part was inside the column.
     *
     * A child that fills the stack made no alignment decision, so it is not
     * read. Two children of the SAME class on opposite edges are a pattern, not
     * an accident (a chat transcript is the case: the reader's messages right,
     * the assistant's left), so they are not reported. */
    const splitStacks = []
    for (const el of contentEl.querySelectorAll('*')) {
      const cs = getComputedStyle(el)
      const isColumn = (cs.display.includes('flex') && cs.flexDirection.startsWith('column'))
        || (cs.display.includes('grid') && cs.gridTemplateColumns.split(' ').filter(Boolean).length === 1)
      if (!isColumn) continue
      const r = el.getBoundingClientRect()
      const startX = r.left + (parseFloat(cs.paddingInlineStart) || 0)
      const endX = r.right - (parseFloat(cs.paddingInlineEnd) || 0)
      const inner = endX - startX
      /* Under a phone's column width there is no room to be misaligned in. */
      if (inner < 400) continue
      const parts = []
      for (const child of el.children) {
        const cr = child.getBoundingClientRect()
        if (cr.width <= 0 || cr.height <= 0) continue
        const ccs = getComputedStyle(child)
        if (ccs.position === 'absolute' || ccs.position === 'fixed') continue
        /* It fills the stack: there was no edge to choose. */
        if (inner - cr.width < 48) continue
        const gapStart = cr.left - startX
        const gapEnd = endX - cr.right
        const side = gapStart <= 8 ? 'left' : gapEnd <= 8 ? 'right' : null
        if (side) parts.push({ side, cls: String(child.className).split(' ')[0] || child.tagName.toLowerCase() })
      }
      const l = parts.find((p) => p.side === 'left')
      const rt = parts.find((p) => p.side === 'right')
      if (l && rt && l.cls !== rt.cls) {
        splitStacks.push(`.${String(el.className).split(' ')[0] || el.tagName.toLowerCase()} stacks .${l.cls} against its left edge and .${rt.cls} against its right`)
      }
    }

    const aside = contentEl.querySelector('.detail-aside, [class*="-aside"]')
    return {
      columnWidth: Math.round(cr.width),
      widestPainted: Math.round(widest),
      widestTag: widestEl ? `${widestEl.tag}.${widestEl.cls}` : '-',
      contentHeight: Math.round(contentEl.scrollHeight),
      deadBand: Math.round(dead),
      deadAt,
      proseRun: wall,
      repeatedIcons,
      airyRows,
      stretchedPills,
      spills,
      rhythm,
      splitStacks,
      emptyState: !!contentEl.querySelector('.empty-state'),
      /* A pane that is NOT DISPLAYED is absent, not dead. `<SidePanel hideBelow>`
         drops a wide-screen affordance below its width, which is the fix this
         rule asks for — and the rule then read the zero-height element it left
         behind as a 0% column and failed the same screen (2026-08-26). Null
         means "no aside here", and a hidden one is exactly that. */
      asideHeight: aside && aside.getClientRects().length
        ? Math.round(aside.getBoundingClientRect().height)
        : null,
    }
  }
  return {
    composition: compositionOf(),
    docScrollWidth: doc.scrollWidth,
    docClientWidth: doc.clientWidth,
    /* The shell paints the page; the document under it is the BODY colour, which
     * is white. So anything that makes the document taller than the shell opens a
     * white strip at the bottom of a screen whose shell is exactly 100dvh — and
     * the usual cause is invisible: an absolutely positioned box with no
     * positioned ancestor resolves against the page, escapes the shell's
     * `overflow: hidden`, and drags the scroll area down to wherever it sits
     * inside an inner scroller. */
    shellGap: (() => {
      const shell = document.querySelector('.app-shell, .app-layout')
      if (!shell) return null
      const bottom = shell.getBoundingClientRect().bottom + window.scrollY
      const gap = Math.round(doc.scrollHeight - bottom)
      if (gap <= 0) return { gap, offender: null }
      let offender = null, deepest = bottom
      for (const el of document.querySelectorAll('body *')) {
        const pos = getComputedStyle(el).position
        if (pos !== 'absolute' && pos !== 'fixed') continue
        const b = el.getBoundingClientRect().bottom + window.scrollY
        if (b > deepest) { deepest = b; offender = `<${el.tagName.toLowerCase()} class="${String(el.className).slice(0, 40)}">` }
      }
      return { gap, offender }
    })(),
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
const RULES = ['axe', 'no-overflow', 'shell-covers-the-page', 'header-aligns', 'column-not-centred', 'actions-flush-end', 'card-text-aligns', 'one-page-heading', 'heading-order', 'grid-fills-row', 'controls-same-height', 'nav-reachable', 'nav-not-doubled', 'nav-one-leading-control', 'nav-trigger-hittable', 'width-used', 'no-dead-band', 'prose-not-a-wall', 'no-repeated-icon', 'row-carries-something', 'pill-fits-its-label', 'card-holds-its-content', 'card-rhythm', 'stack-one-alignment']
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
    const axeResult = await page.evaluate(async ({ rules }) =>
      /* eslint-disable-next-line no-undef -- axe is the script injected above; this body runs in the browser. */
      await window.axe.run(document, {
        resultTypes: ['violations'],
        rules: {
          /* Page-level landmark rule. A screen IS a page here, so it applies —
           * unlike the component gallery, where it fires on every component. */
          region: { enabled: true },
          /* An app may turn a rule off, and only an app can: a rule fires on a
           * PALETTE as often as on a screen, and `auditAllow` can only waive axe
           * whole on a named screen - every other rule with it. The config carries
           * the reason, and turning one off is a claim that something else measures
           * it (contrast has its own gate step, resolved from the token files). */
          ...rules,
        },
      }),
      /* `_why` and friends are the config's own prose. axe validates the keys it is
       * given and throws on one that is not a rule id, so the notes are dropped
       * here rather than being kept out of the file where the reason belongs. */
      { rules: Object.fromEntries(Object.entries(axeRules).filter(([k]) => !k.startsWith('_'))) },
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

    /* ── COMPOSITION ────────────────────────────────────────────────────────
     * The four above this line ask whether an element is correct. These ask
     * whether the page is worth looking at. Thresholds are set from what the
     * screens MEASURED on 2026-08-21, not from a number that sounded right:
     * the spread ran 30% to 95% of the column, dead bands to 279px, one prose
     * run of four, and eleven rows carrying the same glyph twice. */
    if (m.composition) {
      const c = m.composition
      if (process.env.REPORT_COMPOSITION) {
        console.log(`  ~ ${at}  empty ${c.emptyState}  width ${Math.round((c.widestPainted / c.columnWidth) * 100)}%  dead ${c.deadBand}px  prose ${c.proseRun}  icons ${c.repeatedIcons.length}  aside ${c.asideHeight ?? '-'}/${c.contentHeight}`)
      }
      /* Width is only a question where there is width to waste: at phone and
       * tablet everything is full-bleed by construction. */
      /* A screen showing an empty state has no content to lay out, and its copy
       * is deliberately a narrow centred column. */
      if (width >= 1200 && !c.emptyState) {
        const used = c.widestPainted / c.columnWidth
        if (used < 0.65) {
          fail('width-used', `content uses ${Math.round(used * 100)}% of its ${c.columnWidth}px column (widest: ${c.widestTag}) — the rest is not breathing room, it is unused screen`)
        } else pass('width-used')
      }
      /* A quarter of the viewport with nothing painted in it is a hole, not
       * rhythm. */
      /* An EmptyState is a centred block by design: the gap above it is the
       * pattern, not a hole. Every other screen owes its vertical space. */
      if (!c.emptyState && c.deadBand > height * 0.25) {
        fail('no-dead-band', `${c.deadBand}px of nothing at y=${c.deadAt} (${Math.round((c.deadBand / height) * 100)}% of the viewport)`)
      } else pass('no-dead-band')
      /* Four paragraphs in a row is a document, not a screen. */
      if (c.proseRun > 3) {
        fail('prose-not-a-wall', `${c.proseRun} paragraphs in a row with nothing between them — show it instead of saying it`)
      } else pass('prose-not-a-wall')
      /* The same glyph twice inside one row: the row saying one thing twice. */
      if (c.repeatedIcons.length) {
        fail('no-repeated-icon', `${c.repeatedIcons.length} item(s) render the same icon twice (${c.repeatedIcons.slice(0, 3).join(', ')})`)
      } else pass('no-repeated-icon')
      /* A pill stretched to its container instead of its label. */
      if (c.stretchedPills.length) {
        fail('pill-fits-its-label', `${c.stretchedPills.length}: ${c.stretchedPills.slice(0, 2).join('; ')}`)
      } else pass('pill-fits-its-label')
      /* Nothing hangs over the edge of the card that carries it. */
      if (c.spills.length) {
        fail('card-holds-its-content', `${c.spills.length}: ${c.spills.slice(0, 3).join('; ')}`)
      } else pass('card-holds-its-content')
      /* One card, one set of steps between its parts. */
      if (c.rhythm.length) {
        fail('card-rhythm', `${c.rhythm.length}: ${c.rhythm.slice(0, 3).join('; ')}`)
      } else pass('card-rhythm')
      /* One stack, one alignment. */
      if (c.splitStacks.length) {
        fail('stack-one-alignment', `${c.splitStacks.length}: ${c.splitStacks.slice(0, 3).join('; ')} — parts of one cluster pulled to opposite edges`)
      } else pass('stack-one-alignment')
      /* A wide row that is mostly air. */
      if (c.airyRows.length) {
        fail('row-carries-something', `${c.airyRows.length} row(s) are mostly nothing: ${c.airyRows.slice(0, 2).join('; ')}`)
      } else pass('row-carries-something')
      /* An aside is metadata beside the content. Shorter than a third of it and
       * it is a card that left a dead column behind. */
      if (c.asideHeight !== null && c.contentHeight > 0 && c.asideHeight / c.contentHeight < 0.33) {
        fail('width-used', `the aside covers ${Math.round((c.asideHeight / c.contentHeight) * 100)}% of the content height — that is a dead column, not a sidebar`)
      }
    }

    // 1. Nothing may stick out sideways.
    if (m.docScrollWidth > m.docClientWidth + SLACK) {
      fail('no-overflow', `document scrolls ${m.docScrollWidth - m.docClientWidth}px sideways; widest offender <${m.worst?.tag} class="${m.worst?.cls}"> by ${Math.round(m.worst?.over ?? 0)}px`)
    } else pass('no-overflow')

    /* 1b. ...and nothing may stick out below the shell. Same failure seen from
     * the other side: the strip the shell does not reach is painted in the body
     * colour, so the page ends in a white band nobody put there. */
    if (m.shellGap) {
      if (m.shellGap.gap > SLACK) {
        fail('shell-covers-the-page', `the document is ${m.shellGap.gap}px taller than the shell — that strip is the body colour, not the page${m.shellGap.offender ? `; deepest escapee ${m.shellGap.offender}` : ''}`)
      } else pass('shell-covers-the-page')
    }

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
      } else { pass('one-page-heading'); pass('heading-order') }
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
