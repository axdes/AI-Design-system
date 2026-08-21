/* Live design-system knobs — written straight to documentElement so the whole
 * app recalculates from the CSS-variable cascade. Mirrors the source knobs in
 * styles/settings.css. Persisted to localStorage and applied at app bootstrap
 * (see main.tsx) so overrides survive reloads on any route. */

export const SETTINGS_KEY = 'pg-settings'

export type Settings = {
  radius: number        // --radius (px) — base (md) radius
  pill: boolean         // --control-radius full vs md
  primary: string       // --primary / hover / ring / brand-400
}

/* The brand colour is NOT a literal here. One had been, and it disagreed with
 * the token files: the tokens said one colour while this said another, so the page
 * painted a colour every contrast check was blind to — white on it measured
 * 2.89:1 against a target of 4.5, and the token check reported 7.04 and passed.
 * The default is read from the resolved cascade instead, which is the same
 * thing the browser paints. */
const FALLBACK_PRIMARY = '#4638d3'

function tokenPrimary(): string {
  if (typeof document === 'undefined') return FALLBACK_PRIMARY
  const v = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim()
  /* Empty before the stylesheet lands, and still a var() if something upstream
   * is unresolved — neither is a colour a picker can show. */
  return v && !v.startsWith('var(') ? v : FALLBACK_PRIMARY
}

export function defaultSettings(): Settings {
  return { radius: 8, pill: true, primary: tokenPrimary() }
}

/* Defaults the playground persisted in older sessions: stored as though the user
 * had chosen them, they would pin a retired brand colour straight through a
 * rebrand. Retiring a colour means adding it here. */
const LEGACY_PRIMARIES = ['#26a8ab', '#274fc2']

export function loadSettings(): Settings {
  const defaults = defaultSettings()
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) return defaults
    const stored = { ...defaults, ...(JSON.parse(raw) as Partial<Settings>) }
    if (LEGACY_PRIMARIES.includes(stored.primary)) stored.primary = defaults.primary
    return stored
  } catch {
    return defaults
  }
}

const PROPS = ['--radius', '--control-radius', '--primary', '--primary-hover', '--ring', '--brand-400'] as const

export function applySettings(s: Settings) {
  const root = document.documentElement.style
  root.setProperty('--radius', `${s.radius}px`)
  root.setProperty('--control-radius', s.pill ? 'var(--radius-full)' : 'var(--radius-md)')
  root.setProperty('--primary', s.primary)
  // Hover = the picked brand, a touch darker (so buttons keep a visible hover).
  root.setProperty('--primary-hover', `color-mix(in oklch, ${s.primary} 86%, black)`)
  root.setProperty('--ring', s.primary)
  /* Drive the primary brand STOP too, so the Foundation swatch and everything
   * reading --brand-400 directly (--primary-accent, the gradients) follow the
   * picked colour instead of the value it is overriding. */
  root.setProperty('--brand-400', s.primary)
}

export function clearSettings() {
  const root = document.documentElement.style
  for (const p of PROPS) root.removeProperty(p)
}

/* Called once at startup so saved overrides apply on any entry route. Only when
 * the user actually picked something: with nothing stored the app must show the
 * tokens as they are, or the demo page's defaults quietly become the brand. */
export function initSettings() {
  const raw = (() => { try { return localStorage.getItem(SETTINGS_KEY) } catch { return null } })()
  if (raw) applySettings(loadSettings())
}
