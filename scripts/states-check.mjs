/* ONE CONTROL, ONE SET OF ANSWERS.
 *
 * A control has to answer the same five questions the same way wherever it is,
 * or a form reads as parts from different systems. It had drifted quietly and in
 * every direction: NumberInput answered focus by recolouring a 1px border while
 * every sibling drew a 2px ring; Checkbox, Radio, Switch and Slider did not
 * answer hover at all though Input, Select and DatePicker did; `:active` existed
 * nowhere, so nothing answered a press; Button and Chip blocked pointer events
 * when disabled while Input and DatePicker did not — and Dropdown.css carries a
 * comment explaining why NOT blocking is right, so the system held both.
 *
 * None of that is visible in a screenshot and none of it is a contrast bug.
 * This reads the component CSS and reports, per control, which of the five it
 * answers and how — so a divergence is a diff rather than a discovery.
 *
 *   hover     the surface moves under the pointer
 *   press     :active — one stop further, so a slow action is not a dead button
 *   focus     the ring, at --ring-width / --ring-offset. One shape, everywhere.
 *   disabled  dimmed AND the cursor says so
 *   invalid   value-bearing controls only: --destructive on the border AND ring
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const ROOT = process.env.DS_LINT_ROOT ?? fileURLToPath(new URL('..', import.meta.url)).replace(/\/$/, '')
const R = '\x1b[0m', RED = '\x1b[31m', GREEN = '\x1b[32m', DIM = '\x1b[2m', BOLD = '\x1b[1m', YEL = '\x1b[33m'

/* A control is anything a person operates. Read from the source, not listed:
 * it renders a native control, or claims a widget role. */
const IS_CONTROL = /<button|<input|<textarea|<select|<a\s|role="(button|switch|checkbox|radio|slider|tab|menuitem|option|combobox|link)"/
/* …minus the ones whose interactive part belongs to a component they compose,
 * so the answers are that component's to give. */
const NOT_A_CONTROL = {
  AppLayout: 'the app frame; its skip-link is the only <a> and it is chrome',
  Modal: 'a surface — the close button is an <IconButton> and answers there',
  CommandPalette: 'a surface; its rows are measured as .command-item, its field as .input',
  Field: 'a label and a message around someone else\'s control',
  BarChart: 'a figure; the <button> is a bar with a tooltip, not an operable control',
  Table: 'a surface; the sort button is chrome and the row states are the Table\'s own',
  Carousel: 'a surface; its arrows are <IconButton>',
  Accordion: 'headers are measured, but hover/press on a disclosure header is the panel opening',
}
const DELEGATES = {
  CopyButton: 'renders <Button> / <IconButton>', LoadMore: 'renders <Button>',
  PasswordInput: 'renders <Input> + <IconButton>', CodeInput: 'renders <Input>',
  DateRangePicker: 'wears DatePicker\'s field styling', ExpandButton: 'renders <IconButton>',
  NavDrawerButton: 'renders <IconButton>', FeedbackModal: 'renders <Modal> + <Button>',
  UserMenu: 'renders <Dropdown>', FilterDropdown: 'renders <Dropdown>',
  SessionPill: 'renders <Chip>', Rating: 'stars are <button>, styled here',
  LinkTile: 'layout only — the surface, hover and focus are <Card>\'s',
}
/* Only these are asked about `invalid`: a control that carries a value a form
 * can reject. A Button has no value to be wrong. */
/* A control you TYPE into answers a click with focus, not with a press tint.
 * Asking it for `:active` would put a flash on a text field, which is not a
 * missing state, it is a wrong one. */
const TYPED = new Set(['Input', 'Textarea', 'NumberInput', 'TagInput', 'TimeInput', 'ChatComposer'])
const VALUE_BEARING = new Set([
  'Input', 'Textarea', 'Select', 'NumberInput', 'TimeInput', 'DatePicker',
  'Combobox', 'TagInput', 'Checkbox', 'Radio', 'Switch', 'FileUpload', 'CodeInput',
])

const dirs = readdirSync(`${ROOT}/src/components`).filter((d) =>
  existsSync(`${ROOT}/src/components/${d}/${d}.tsx`))

/* Which component owns which root class, so "wears another's class" resolves. */
const CLASS_OWNER = {}
for (const d of dirs) {
  const f = `${ROOT}/src/components/${d}/${d}.css`
  if (!existsSync(f)) continue
  for (const m of readFileSync(f, 'utf8').matchAll(/^\.([a-z][a-z0-9-]*)\s*[,{]/gm)) {
    if (!(m[1] in CLASS_OWNER)) CLASS_OWNER[m[1]] = d
  }
}

const rows = []
for (const name of dirs) {
  if (DELEGATES[name] || NOT_A_CONTROL[name]) continue
  const tsx = readFileSync(`${ROOT}/src/components/${name}/${name}.tsx`, 'utf8')
  if (!IS_CONTROL.test(tsx)) continue
  const cssPath = `${ROOT}/src/components/${name}/${name}.css`
  let css = existsSync(cssPath) ? readFileSync(cssPath, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '') : ''
  /* A component that WEARS another's class inherits its answers — Textarea and
   * Combobox both render className="input …", and reading their own file alone
   * reports a field with no hover and no focus ring, which is not true and is
   * exactly the kind of false finding that makes a check ignorable. */
  for (const m of tsx.matchAll(/className=\{?(?:cn\()?['"]([a-z][a-z0-9 -]*)['"]/g)) {
    for (const cls of m[1].split(/\s+/)) {
      const owner = CLASS_OWNER[cls]
      if (!owner || owner === name) continue
      const f = `${ROOT}/src/components/${owner}/${owner}.css`
      if (existsSync(f)) css += '\n' + readFileSync(f, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
    }
  }

  const ringRules = [...css.matchAll(/:focus(?:-visible|-within)[^{]*\{([^}]*)\}/g)].map((m) => m[1])
  const anyRing = ringRules.some((b) => /outline:\s*var\(--ring-width\)\s+solid\s+var\(--ring\)/.test(b))
  const ringOffset = ringRules.some((b) => /outline-offset:[^;]*--ring-offset/.test(b))
  /* aria-activedescendant: focus stays on the container and the ACTIVE ROW is
   * what the eye follows, so the mark on that row is the focus indicator. A
   * ring on the row would be wrong — the row is not focused. */
  const activedescendant = /aria-activedescendant/.test(tsx)
  /* A MARK IS ANYTHING THE READER CAN SEE ON THAT ROW, not one shape.
   *
   * This used to accept only a `::before` — a rail down the leading edge — which
   * is one way to mark a row and became the only way this check could recognise.
   * When the owner took the rail out on 2026-08-29 the replacement was a solid
   * `--primary` row at 7.59:1, the same number the focus ring carries, and the
   * check called it "no indicator" because it was looking for the wrong noun.
   *
   * A rule that says "the mark must be a rail" is a rule about a decoration. The
   * question is whether the row carries something, and either a pseudo-element
   * or a background on `[data-active]` answers it. How strong that something is
   * belongs to `boundary` and `invisible`, which measure colour; this file
   * measures whether an answer exists at all. */
  const activeMark = /\[data-active\][^{]*::before\s*\{/.test(css)
    || /\[data-active\][^{]*\{[^}]*background:/.test(css)
  const focus = activedescendant
    ? (activeMark ? 'active-row mark' : 'none (activedescendant)')
    : ringRules.length === 0 ? 'none'
    : anyRing ? (ringOffset ? 'ring' : 'ring, no offset token') : 'not the ring'

  /* `disabled` is only asked of a control that can BE disabled. A breadcrumb and
   * a nav item have no such state, and inventing a dimmed one to satisfy a check
   * is how a system grows styles nobody asked for. */
  const canDisable = /\bdisabled\b|aria-disabled/.test(tsx) ||
    /(?::disabled|\[disabled\]|\[data-disabled\])/.test(css)
  const disabledRules = [...css.matchAll(/(?::disabled|\[disabled\]|\[data-disabled\]|\[aria-disabled)[^{]*\{([^}]*)\}/g)].map((m) => m[1])
  const dim = disabledRules.some((b) => /opacity:/.test(b))
  const cursor = disabledRules.some((b) => /cursor:\s*not-allowed/.test(b))
  const disabled = !canDisable ? '—'
    : disabledRules.length === 0 ? 'none'
    : dim && cursor ? 'dim + cursor' : dim ? 'dim, no cursor' : 'no dim'

  const invalidRules = [...css.matchAll(/(?:\[aria-invalid="true"\]|\[data-invalid\])[^{]*\{([^}]*)\}/g)].map((m) => m[1])
  const invalidRing = invalidRules.some((b) => /outline-color:\s*var\(--destructive\)/.test(b))
  const invalid = !VALUE_BEARING.has(name) ? '—'
    : invalidRules.length === 0 ? 'none'
    : invalidRing ? 'border + ring' : 'border only'

  rows.push({
    name,
    hover: /:hover/.test(css) ? 'yes' : 'none',
    press: TYPED.has(name) ? '—' : /:active/.test(css) ? 'yes' : 'none',
    focus, disabled, invalid,
  })
}

const bad = (v) => v === 'none' || v === 'none (activedescendant)' || v === 'not the ring' || v === 'no dim' || v === 'dim, no cursor' ||
  v === 'ring, no offset token' || v === 'border only'
const paint = (v) => (v === '—' ? DIM + v + R : bad(v) ? RED + v + R : GREEN + v + R)
const pad = (v, n) => v + ' '.repeat(Math.max(0, n - v.length))

console.log(`\n${BOLD}Control states — the same five answers, everywhere${R}\n`)
console.log(`  ${pad('control', 18)}${pad('hover', 8)}${pad('press', 8)}${pad('focus', 24)}${pad('disabled', 16)}invalid`)
let problems = 0
for (const r of rows) {
  const flags = [r.hover, r.press, r.focus, r.disabled, r.invalid].filter(bad).length
  if (flags) problems++
  console.log(`  ${pad(r.name, 18)}${paint(r.hover)}${' '.repeat(8 - r.hover.length)}` +
    `${paint(r.press)}${' '.repeat(8 - r.press.length)}` +
    `${paint(r.focus)}${' '.repeat(Math.max(1, 24 - r.focus.length))}` +
    `${paint(r.disabled)}${' '.repeat(16 - r.disabled.length)}${paint(r.invalid)}`)
}
console.log(`\n  ${DIM}${rows.length} control(s); ${Object.keys(DELEGATES).length} delegate their states to a component they compose.${R}`)
if (problems) {
  console.log(`\n${YEL}${problems} control(s) answer differently from the rest.${R}`)
  console.log(`${DIM}  Not a contrast bug and not visible in one screenshot: it is the same`)
  console.log(`  question getting a different answer depending on which control you`)
  console.log(`  happen to be standing in.${R}\n`)
  process.exit(1)
}
console.log(`\n${GREEN}✓ every control answers the same five the same way.${R}\n`)
