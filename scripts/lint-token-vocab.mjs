/**
 * One suffix, one meaning, across every semantic token.
 *
 * The sibling of scripts/lint-vocab.mjs, which does this for component props.
 * Tokens had no such check, and the gap cost a near-miss: `-emphasis` looks like
 * a duplicate of the base in the light theme and is a separate role in the dark
 * one, so it was one command away from being deleted out of six products
 * (2026-08-26). A suffix whose meaning lives only in three theme blocks is a
 * suffix nobody can use correctly.
 *
 * It also holds the ALIASES — a semantic token whose value is another semantic
 * token. Those are legitimate and they are the one place in the layer where
 * editing one role silently moves another, so each is declared with the role it
 * follows and the reason. An undeclared one fails; so does a declaration whose
 * target no longer matches, and one for an alias that is gone.
 *
 * Two things it will not do. It will not invent a preferred word: a suffix it
 * does not know is reported, not renamed, and the fix is to use the declared
 * word or to declare the new one with its meaning. And it will not require a
 * family to carry every suffix — a subset is normal, `--secondary` has no
 * `-soft` because it IS the quiet one.
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const BOLD = '\x1b[1m', DIM = '\x1b[2m', RED = '\x1b[31m', GREEN = '\x1b[32m', RESET = '\x1b[0m'

const vocab = JSON.parse(readFileSync(join(ROOT, 'config/token-vocabulary.json'), 'utf8'))
const DECLARED = Object.keys(vocab.suffixes)
const ALIASES = vocab.aliases ?? {}
/* Longest first: `-soft-foreground` must win over `-foreground`. */
const ORDER = [...DECLARED].sort((a, b) => b.length - a.length)

const css = readFileSync(join(ROOT, 'styles/semantic.css'), 'utf8')
/* The light :root block is the vocabulary; the theme blocks restate it. */
const start = css.indexOf('[data-theme-lock="light"] {')
const end = css.indexOf('[data-theme="dark"] {')
const block = css.slice(start, end > start ? end : css.length)

const roles = [...block.matchAll(/^\s*--([\w-]+)\s*:/gm)].map((m) => m[1])

/* Which names are semantic. A reference to a primitive or a setting is the
   normal case and says nothing; a reference to a name declared in THIS file is
   the coupling worth writing down. */
const SEMANTIC = new Set([...css.matchAll(/^\s*(--[\w-]+)\s*:/gm)].map((m) => m[1]))
/* The theme each block speaks for, so a divergence can name one. */
const THEMES = [
  [/\[data-theme="dark"\]/, 'dark'],
  [/prefers-color-scheme:\s*dark/, 'dark'],
  [/data-theme-lock="light"|:root/, 'light'],
]
const heads = [...css.matchAll(/^(\S[^\n{]*)\{/gm)]
const themeAt = (index) => {
  let name = 'light'
  for (const h of heads) {
    if (h.index > index) break
    const hit = THEMES.find(([re]) => re.test(h[0]))
    if (hit) name = hit[1]
  }
  return name
}

const aliasErrors = []
const found = new Map()
for (const m of css.matchAll(/^\s*(--[\w-]+)\s*:\s*var\((--[\w-]+)\)\s*;/gm)) {
  const [, name, target] = m
  if (!SEMANTIC.has(target)) continue
  const theme = themeAt(m.index)
  const decl = ALIASES[name]
  if (!decl) {
    aliasErrors.push([name, `follows ${target} and nothing says why`])
    continue
  }
  found.set(name, (found.get(name) ?? new Set()).add(theme))
  const diverges = decl.diverges ?? []
  if (decl.follows !== target && !diverges.includes(theme)) {
    aliasErrors.push([name, `follows ${target} in the ${theme} theme, but is declared to follow ${decl.follows}`])
  }
  if (decl.follows === target && diverges.includes(theme)) {
    aliasErrors.push([name, `is declared to diverge in the ${theme} theme, and does not`])
  }
  if (!String(decl.why || '').trim()) aliasErrors.push([name, 'is declared with no reason'])
}
for (const name of Object.keys(ALIASES)) {
  if (!found.has(name)) aliasErrors.push([name, 'is declared here and no longer exists in semantic.css'])
}
const seen = new Set()
const unknown = new Map()

for (const role of roles) {
  if (seen.has(role)) continue
  seen.add(role)
  const suffix = ORDER.find((s) => role.endsWith('-' + s))
  if (suffix) continue
  /* No declared suffix: either the role is a bare name (--background, --card),
     which is fine, or it ends in a word nobody has written down. A bare name has
     no hyphen beyond its own family; anything else is a candidate. */
  const parts = role.split('-')
  if (parts.length < 2) continue
  const tail = parts[parts.length - 1]
  /* A numeric tail is a scale step (--chart-1), not a modifier. */
  if (/^\d+$/.test(tail)) continue
  if (!unknown.has(tail)) unknown.set(tail, [])
  unknown.get(tail).push(role)
}

console.log(`${BOLD}Token vocabulary${RESET} ${DIM}${seen.size} semantic role(s), ${DECLARED.length} declared suffix(es)${RESET}\n`)
for (const s of DECLARED) {
  const users = [...seen].filter((r) => r.endsWith('-' + s))
  if (!users.length) continue
  console.log(`  ${s.padEnd(18)}${DIM}${String(users.length).padStart(2)} role(s) — ${vocab.suffixes[s].axis}${RESET}`)
}

/* A tail used by 2+ roles is a word the system is treating as a modifier; one
 * role may simply be a compound name (--nav-active). Only the shared ones
 * are held to the vocabulary, the same threshold lint-vocab.mjs uses for props. */
const shared = [...unknown].filter(([, rs]) => rs.length > 1)
console.log()
if (shared.length) {
  console.log(`${RED}✗ ${shared.length} suffix(es) used by two or more roles with nothing written down:${RESET}`)
  for (const [tail, rs] of shared) console.log(`    -${tail}${DIM} — ${rs.join(', ')}${RESET}`)
  console.log(`\n${DIM}  Declare each in config/token-vocabulary.json: the ONE question it answers,`)
  console.log(`  and what it means. If two families use it for two different questions,`)
  console.log(`  that is two ideas wearing one word — rename one of them.${RESET}`)
  process.exit(1)
}
const solo = [...unknown].filter(([, rs]) => rs.length === 1)
if (solo.length) console.log(`${DIM}  ${solo.length} one-off tail(s), not held to the vocabulary: ${solo.map(([t]) => '-' + t).join(', ')}${RESET}`)
/* One complaint per name and reason: the dark block and the prefers-dark media
   query are two places speaking for ONE theme, and saying it twice reads as two
   faults. */
const reported = [...new Map(aliasErrors.map((e) => [e.join('|'), e])).values()]
if (reported.length) {
  console.log(`\n${RED}✗ ${reported.length} alias(es) the token layer cannot account for:${RESET}`)
  for (const [name, why] of reported) console.log(`    ${name}${DIM} ${why}${RESET}`)
  console.log(`\n${DIM}  A semantic token pointing at another semantic token is fine and is a`)
  console.log(`  DECISION: editing one moves the other. Record it in the "aliases" block of`)
  console.log(`  config/token-vocabulary.json — what it follows, and why that holds.${RESET}`)
  process.exit(1)
}
console.log(`${DIM}  ${Object.keys(ALIASES).length} declared alias(es), each following a role on purpose.${RESET}`)
console.log(`${GREEN}✓ every suffix a semantic token uses is declared, and means one thing.${RESET}`)
