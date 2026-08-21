// Whole SCREENS, at three widths, against committed baselines.
//
// The gate this closes: `visual-check.mjs` screenshots golden examples, which is
// one component at a time in a neutral box. All 156 of those were green while a
// real page had its header flush left and its content floating in the middle,
// the left navigation scrolled off the top of the screen, and the mobile drawer
// never opened. Nothing looked at a page.
//
// It is also the only thing in this repository that has ever rendered anything at
// a phone width, despite the whole approach being described as mobile-first. Up
// to now the only proof the media queries worked was somebody dragging a window
// corner.
//
// Scope, stated plainly: screens that come up with no backend. The design system,
// salim, workshops, transcript, teams-digest and teams-tasks all render from mock
// data or committed fixtures and are wired into their own gates.
//
// airun is the one exception and it is a decision, not a gap: its teams come from
// a real coach file, so a committed screenshot would carry client names into git
// and a fresh clone would render onboarding instead of the cockpit. The reason and
// the condition that reopens it (a sample coach fixture) live in its own
// config/screens.config.json. It runs the page audit, which asserts rules and stores
// nothing.
//
// Being wired matters more than it sounds. teams-tasks had this config and twelve
// committed baselines and no script that ran them; when the script was added on
// 2026-08-07, eight of the twelve were red. A baseline nothing executes is not a
// check, it is a picture.
//
// Run (from an app or the design system):
//   npm run build && npm run screens          compare
//   npm run build && npm run screens:update   accept the current rendering
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync, unlinkSync } from 'node:fs'
import { chromium } from 'playwright'
import { comparePng, serveDir, FROZEN_NOW } from './lib/visual.mjs'
import { installApiMocks } from './lib/apiMocks.mjs'

const ROOT = process.cwd()
/* config/ first, the package root second: this package moved its screen config
 * into config/ when its root became a published front page, and the apps that
 * share this script have not. Same file, same name, either place. */
const CONFIG = [`${ROOT}/config/screens.config.json`, `${ROOT}/screens.config.json`].find((f) => existsSync(f)) ?? `${ROOT}/config/screens.config.json`
const DIST = `${ROOT}/dist`
const update = process.argv.includes('--update')

/* The clock the screens are shot under.
 *
 * Fixtures carry absolute timestamps and screens print them relative ("yesterday",
 * "2 days ago"), so with a live clock a baseline decays on its own: teams-tasks was
 * wired into its gate on 2026-08-07 and eight of its twelve committed baselines were
 * already red, entirely because the calendar had moved two days. Nothing about the
 * app had changed.
 *
 * That failure mode is worse than no check at all. A gate that goes red by itself
 * teaches whoever meets it to run :update without looking, and after that it cannot
 * report a real regression to anybody.
 *
 * A config can override with `"now"` when its fixtures need a particular date. The
 * default is far enough ahead of every fixture in the repository that relative
 * labels are stable and, being fixed, stay stable.
 */
const DEFAULT_NOW = FROZEN_NOW

if (!existsSync(CONFIG)) {
  console.error(`No config/screens.config.json in ${ROOT} — nothing to shoot.`)
  process.exit(1)
}
if (!existsSync(`${DIST}/index.html`)) {
  console.error('No dist/index.html — run `npm run build` first.')
  process.exit(1)
}

const { screens, seedLocalStorage = {}, widths, apiMocks = {}, localeStorageKey = 'i18n.lang', rtlLocale = 'ar', now = DEFAULT_NOW } = JSON.parse(readFileSync(CONFIG, 'utf8'))
const BASELINE = `${ROOT}/visual/screens`
const DIFF_DIR = `${ROOT}/visual/.diff-screens`
mkdirSync(BASELINE, { recursive: true })
mkdirSync(DIFF_DIR, { recursive: true })
for (const f of readdirSync(DIFF_DIR)) unlinkSync(`${DIFF_DIR}/${f}`)

/* Deliberately looser than the component gate's 0.1%. A whole screen carries far
 * more text, and text rasterises differently per OS (visual/README.md); at 0.1%
 * a page would report a diff on another machine for no reason at all. Layout
 * breakage is not subtle — the misalignment that started this was 7%. */
const TOLERANCE = 0.005

const { server, port } = await serveDir(DIST)
const browser = await chromium.launch()
let failures = 0
let shot = 0

const RESET = '\x1b[0m', RED = '\x1b[31m', GREEN = '\x1b[32m', DIM = '\x1b[2m', BOLD = '\x1b[1m'
console.log(`${BOLD}Screens${RESET} ${DIM}${screens.length} screen(s) x ${widths.length} width(s)${RESET}\n`)

/* Screens are independent: each opens its own page, waits for fonts and network,
 * and shoots. Doing that one after another meant a full run spent almost all of
 * its wall time waiting for loads that could have overlapped. Four at a time
 * keeps memory sane on a laptop and cuts the step by about three quarters. */
const LANES = 4
const jobs = []
for (const s of screens) for (const w of widths) jobs.push([s, w])

const lines = new Array(jobs.length)
let next = 0

async function runOne([{ name, path, theme = 'light', anonymous = false, dir = 'ltr' }, { label, width, height }]) {
    const page = await browser.newPage({
      viewport: { width, height },
      deviceScaleFactor: 1,
      colorScheme: theme === 'dark' ? 'dark' : 'light',
      reducedMotion: 'reduce',
    })
    /* Freeze the clock before anything runs, so "2 days ago" is a property of the
     * fixture and not of the day the baseline was taken. setFixedTime only pins
     * Date; timers keep firing, which the app needs to finish booting. */
    await page.clock.setFixedTime(new Date(now))

    /* Seed before the app boots: these screens sit behind a login, and the point
     * is to shoot the screen, not the login. `anonymous` opts out, which the login
     * screen needs — with a user in storage it redirects, and the first run of
     * this gate quietly shot the content library twice under two names. Two
     * different screens reporting an identical 139606-pixel diff is what gave it
     * away. */
    if (!anonymous) {
      await page.addInitScript((seed) => {
        for (const [k, v] of Object.entries(seed)) localStorage.setItem(k, v)
      }, seedLocalStorage)
    }

    /* A screen declared `dir: "rtl"` must be SHOT mirrored, or its baseline is a
     * left-to-right picture filed under a right-to-left name. The switch is the
     * stored language, the same as in the page audit: setting the attribute alone
     * is undone by the app a frame later. */
    if (dir === 'rtl') {
      await page.addInitScript(
        ([key, lang]) => localStorage.setItem(key, lang),
        [localeStorageKey, rtlLocale],
      )
    }
    await installApiMocks(page, apiMocks, ROOT)
    await page.goto(`http://127.0.0.1:${port}${path}`, { waitUntil: 'networkidle' })
    /* Force EVERY declared face to load, then wait. `document.fonts.ready`
     * resolves for the faces requested so far, and a face is only requested when
     * something using it renders — so a heading that arrives after hydration is
     * fetched after the promise has already settled, and the shot catches the
     * fallback. Two awaits with a beat between made it rarer and not rare enough:
     * transcript still flaked on 2026-08-16. Loading them explicitly removes the
     * race instead of narrowing it. A face whose file is not there rejects, and
     * one missing font is not a reason to fail a layout check: the shot shows it
     * anyway. */
    await page.evaluate(`(async () => {
      await Promise.all([...document.fonts].map((f) => f.load().catch(() => {})))
      await document.fonts.ready
      /* A second pass, because the first one can ADD faces: a family requested
       * while the page was still laying out arrives in document.fonts after the
       * first enumeration and is still unloaded when the shot is taken. */
      await Promise.all([...document.fonts].map((f) => f.load().catch(() => {})))
      await document.fonts.ready
      /* Then WAIT on the state the picture depends on, rather than on a promise
       * that has already resolved: a face is 'unloaded' until something asks for
       * it and 'loading' until it arrives. Two load passes narrowed the race and
       * did not close it — transcript still lost about one run in five — because
       * the second pass can itself trigger a fetch. This polls the faces
       * themselves, with a ceiling so a genuinely missing file cannot hang. */
      const deadline = Date.now() + 3000
      while (Date.now() < deadline && [...document.fonts].some((f) => f.status !== 'loaded' && f.status !== 'error')) {
        await new Promise((r) => setTimeout(r, 50))
      }
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
    })()`)
    await page.waitForTimeout(250)

    const key = `${name}.${label}${theme === 'dark' ? '.dark' : ''}`
    const actual = await page.screenshot({ fullPage: false })
    await page.close()
    shot++

    const file = `${BASELINE}/${key}.png`
    if (update || !existsSync(file)) {
      const isNew = !existsSync(file)
      writeFileSync(file, actual)
      return `  ${GREEN}✎${RESET} ${key} ${DIM}${isNew ? 'new' : 'written'}${RESET}`
    }
    const { ratio, note } = comparePng(actual, readFileSync(file))
    if (ratio <= TOLERANCE) return `  ${GREEN}✓${RESET} ${key}`

    failures++
    writeFileSync(`${DIFF_DIR}/${key}.actual.png`, actual)
    return (
      `  ${RED}✗${RESET} ${key} ${DIM}${(ratio * 100).toFixed(2)}% of pixels changed (${note})${RESET}\n` +
      `      actual: visual/.diff-screens/${key}.actual.png   baseline: visual/screens/${key}.png`
    )
}

/* A differing screen is shot ONCE more before it is called a difference.
 *
 * Everything deterministic about the wait is already in runOne — every declared
 * face loaded explicitly, then polled until it reports loaded — and a first run
 * after a change still lost about one in six, always on a cold cache. A second
 * shot costs a fraction of a second on the rare failure and turns a check that
 * cried wolf into one worth reading. A real regression differs both times, so
 * nothing is hidden; a rescue is PRINTED, because a rising number of them is the
 * signal that the wait needs work again. */
let retried = 0
async function runTwice(job) {
  const first = await runOne(job)
  if (!first.includes('✗')) return first
  failures--
  retried++
  const second = await runOne(job)
  if (second.includes('✗')) return second
  return `${second} ${DIM}(differed on the first shot, matched on the second)${RESET}`
}

/* Lanes pull from one queue; the log is printed in job order afterwards so a
 * failure is where you expect it rather than wherever a lane happened to finish. */
const lane = async () => {
  for (;;) {
    const i = next++
    if (i >= jobs.length) return
    lines[i] = await runTwice(jobs[i])
  }
}
await Promise.all(Array.from({ length: LANES }, lane))
for (const l of lines) console.log(l)
if (retried) {
  console.log(`  ${DIM}${retried} screen(s) needed a second shot: a first run on a cold cache still loses one now and then. A rising number here means the wait needs work again.${RESET}`)
}

await browser.close()
server.close()

if (failures) {
  console.error(`\n${RED}✗ ${failures} screen difference(s).${RESET} Look at the actual/baseline pair; if the change is intended, npm run screens:update.`)
  process.exit(1)
}
console.log(`\n${GREEN}✓ ${shot} screen shot(s) match.${RESET}`)
