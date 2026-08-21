// Does this app's page geometry match the rest of the monorepo?
//
// Why this exists: an app shipped a screen that every other gate called green and that a
// person called ugly on sight. Nothing was lying — the checks simply had no opinion about the
// things that were wrong:
//
//   * the page was painted with `--background` (the CARD colour) instead of `--muted`, so white
//     cards sat invisible on a white page. axe checks TEXT contrast; a card that vanishes into its
//     page has perfect text contrast.
//   * the page header ran the full window while the content sat in a narrower column. The page
//     audit's `header-aligns` compares their inline edges — and they DID agree, because both were
//     full width. The rule cannot know that full width was wrong for this app.
//   * the reading column was 1400px wide, because the app had no sidebar and kept the 96rem cap
//     that every other product spends its first 260px of on a rail.
//
// Each of those is invisible to a rule that looks at one screen on its own, and obvious the moment
// the screen is put next to the same screen in another app. So that is what this does: it renders
// a screen, measures the boxes that decide whether a page reads as a page, and compares them to a
// recorded reference from an app that already looks right.
//
//   node scripts/layout-parity.mjs                 check against parity.json
//   node scripts/layout-parity.mjs --reference     re-measure the reference from the OTHER app that
//                                                  parity.json points at (it has to be running)
//
// There is deliberately no way to record the reference from THIS app. That was the first version
// and it was worthless: run it before noticing the screen is wrong and it pins the wrong numbers,
// which is the exact failure the pixel baselines already had. The reference can only come from a
// URL in another product, so the check can only ever mean "this looks like that one".
//
// It is deliberately about GEOMETRY and SURFACE, not pixels: a pixel baseline records whatever it
// is first shown, including a broken layout (which is exactly what the AdaptiveListPage baseline
// had been recording for weeks). A number checked against another app's number cannot do that.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { chromium } from "playwright";
import { serveDir } from "./lib/visual.mjs";
import { installApiMocks } from "./lib/apiMocks.mjs";

const ROOT = process.cwd();
/* config/ first, the package root second: this package moved its screen config
 * into config/ when its root became a published front page, and the apps that
 * share this script have not. Same file, same name, either place. */
const CONFIG = [`${ROOT}/config/screens.config.json`, `${ROOT}/screens.config.json`].find((f) => existsSync(f)) ?? `${ROOT}/config/screens.config.json`;
const PARITY = `${ROOT}/parity.json`;
const DIST = `${ROOT}/dist`;
const record = process.argv.includes("--reference");

const RED = "\x1b[31m", GREEN = "\x1b[32m", DIM = "\x1b[2m", B = "\x1b[1m", OFF = "\x1b[0m";

if (!existsSync(CONFIG)) { console.error(`No config/screens.config.json in ${ROOT}.`); process.exit(1); }
if (!existsSync(`${DIST}/index.html`)) { console.error("No dist/index.html — run `npm run build` first."); process.exit(1); }
if (!existsSync(PARITY)) {
  console.log(`${DIM}no parity.json in this package — nothing to compare against.${OFF}`);
  process.exit(0);
}

const { screens, apiMocks = {}, seedLocalStorage = {} } = JSON.parse(readFileSync(CONFIG, "utf8"));
const reference = existsSync(PARITY) ? JSON.parse(readFileSync(PARITY, "utf8")) : { _why: "", widthPx: 1440, screens: {} };
const WIDTH = reference.widthPx ?? 1440;

/* The boxes that decide whether a page reads as a page. Measured in the browser, so what is
 * checked is what the layout resolved to and not what the CSS says. */
const MEASURE = `() => {
  const box = (sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return { x: Math.round(r.x), w: Math.round(r.width), scrolls: cs.overflowY === 'auto' || cs.overflowY === 'scroll' };
  };
  /* The surface a card is actually laid on: the first ancestor that paints one. Reading
     document.body would answer 'white' even when the shell paints muted over it, which is
     precisely the mistake this check exists to catch. */
  const painted = ['.app-layout', '.app-bare', '.app-root', 'body']
    .map((s) => document.querySelector(s))
    .filter(Boolean)
    .map((el) => getComputedStyle(el).backgroundColor)
    .find((c) => c && c !== 'rgba(0, 0, 0, 0)' && c !== 'transparent');
  return {
    pageBg: painted ?? 'rgba(0, 0, 0, 0)',
    header: box('.page-header'),
    content: box('.page-content, .list-page, .adaptive-list-page, .detail-page'),
    main: box('.detail-page-main'),
    aside: box('.detail-page-aside'),
  };
}`;

const browser = await chromium.launch();

/* ── Re-measuring the reference ────────────────────────────────────────────────
 * Each screen names the URL in ANOTHER running product that it is held to. Nothing here reads
 * this app: the whole value of the check is that the numbers came from somewhere else. */
if (record) {
  const out = { ...reference, screens: { ...reference.screens } };
  for (const [name, url] of Object.entries(reference.references ?? {})) {
    const page = await browser.newPage({ viewport: { width: WIDTH, height: 900 } });
    try {
      await page.goto(url, { waitUntil: "networkidle", timeout: 15000 });
      await page.waitForTimeout(1200);
      const got = await page.evaluate(`(${MEASURE})()`);
      if (!got.content) throw new Error("no page content found at that URL");
      out.screens[name] = { ...got, from: url };
      console.log(`  ${GREEN}~${OFF} ${name} ${DIM}from ${url}${OFF}`);
    } catch (e) {
      console.error(`  ${RED}✗${OFF} ${name} ${DIM}${url} — ${e.message.split("\n")[0]}${OFF}`);
      console.error(`      ${DIM}the reference product has to be running for this${OFF}`);
      await browser.close();
      process.exit(1);
    }
    await page.close();
  }
  writeFileSync(PARITY, JSON.stringify(out, null, 2) + "\n");
  await browser.close();
  console.log(`\n${GREEN}✓ parity.json re-measured from the reference product.${OFF}`);
  process.exit(0);
}

const { server, port } = await serveDir(DIST);
const origin = `http://127.0.0.1:${port}`;
const failures = [];

console.log(`\n${B}Layout parity${OFF} ${DIM}${screens.length} screen(s) at ${WIDTH}px${OFF}\n`);

for (const screen of screens) {
  const want = reference.screens?.[screen.name];
  if (!want) { console.log(`  ${DIM}? ${screen.name} — no reference recorded${OFF}`); continue; }

  const page = await browser.newPage({ viewport: { width: WIDTH, height: 900 } });
  await installApiMocks(page, apiMocks, ROOT);
  await page.addInitScript((seed) => {
    for (const [k, v] of Object.entries(seed)) localStorage.setItem(k, typeof v === "string" ? v : JSON.stringify(v));
  }, seedLocalStorage);
  await page.goto(`${origin}${screen.path}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(600);
  const got = await page.evaluate(`(${MEASURE})()`);
  await page.close();

  const problems = [];
  if (want.pageBg && got.pageBg !== want.pageBg) {
    problems.push(`page surface ${got.pageBg}, reference ${want.pageBg} — a white page hides every white card on it`);
  }
  for (const key of ["header", "content", "main", "aside"]) {
    const a = got[key], b = want[key];
    if (!b) continue;
    if (!a) { problems.push(`${key} is missing`); continue; }
    if (Math.abs(a.w - b.w) > 2) problems.push(`${key} is ${a.w}px wide, reference ${b.w}px`);
    if (a.scrolls !== b.scrolls) problems.push(`${key} ${a.scrolls ? "scrolls on its own" : "does not scroll on its own"}, reference says the opposite`);
  }
  // The header and the content must agree with EACH OTHER, whatever the reference width is.
  if (got.header && got.content && Math.abs(got.header.w - got.content.w) > 2) {
    problems.push(`header is ${got.header.w}px and its content ${got.content.w}px — a title that does not sit over its own page`);
  }

  if (problems.length) {
    failures.push(screen.name);
    console.log(`  ${RED}✗${OFF} ${screen.name} ${DIM}(reference: ${want.from ?? "unrecorded"})${OFF}`);
    for (const q of problems) console.log(`      ${DIM}${q}${OFF}`);
  } else {
    console.log(`  ${GREEN}✓${OFF} ${screen.name}`);
  }
}

await browser.close();
server.close();

if (failures.length) {
  console.log(`\n${RED}✗ ${failures.length} screen(s) do not match the reference layout.${OFF}`);
  console.log(`  ${DIM}Fix the screen. If the reference product itself moved, start it and re-measure with --reference.${OFF}`);
  process.exit(1);
}
console.log(`\n${GREEN}✓ every screen matches the reference layout.${OFF}`);
