/* WCAG contrast for every semantic foreground/background pair, in both themes.
 *
 * This file names the design system's own token files; the check itself is shared
 * with every package that has tokens (scripts/lib/contrast-check.mjs). The check itself is shared with every
 * package that has tokens (scripts/lib/contrast-check.mjs); only the files are
 * named here. */
import { fileURLToPath } from 'node:url'
import { checkContrast } from './lib/contrast-check.mjs'

/* Overridable for the same reason the linters' root is: scripts/linters.test.mjs
 * points this at a deliberately broken COPY and requires it to fail. Nothing
 * else sets it; `npm run contrast` always measures this package. */
const ROOT = process.env.DS_LINT_ROOT ?? fileURLToPath(new URL('..', import.meta.url)).replace(/\/$/, '')

checkContrast({
  primitives: [`${ROOT}/styles/primitives.css`],
  semantic: `${ROOT}/styles/semantic.css`,
  /* `sources` is what turns this from a list somebody wrote into a sweep of what
   * the CSS paints. Every rule under here that sets a colour and a background is
   * measured, so a new component is covered by the commit that adds it. */
  sources: [`${ROOT}/src`],
  /* Painted pairs that must not be held to 4.5:1, each with the reason. Same
   * contract as the known-debt map inside the check: an entry is a decision
   * somebody wrote down, and an entry whose pair the CSS no longer paints fails
   * rather than lingering as a blanket excuse for whatever lands there next.
   * `floor: 3` is the WCAG target for a glyph; `floor: null` says the two
   * colours are never on screen at the same time. */
  exempt: {
    '--destructive-emphasis on --destructive-soft': {
      floor: 3,
      why: 'the error-page icon circle (src/lib/ErrorBoundary.css) — a glyph, not text. As TEXT this role sits on --background, which the curated list measures at 4.5.',
    },
    '--primary-foreground on --background': {
      floor: null,
      why: 'the checkbox tick and its unchecked box. The tick is opacity 0 until :checked, and :checked repaints the box to --primary — the two colours are never on screen together.',
    },
  },
})
