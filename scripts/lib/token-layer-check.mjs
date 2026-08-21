// A product's token layer may OVERRIDE the design system. It may not restate it.
//
// This is the check that was missing, and its absence is why fixes stopped at
// the package they were made in. Every other check reads the tokens of the
// package it runs in and compares them with themselves — and a copy always
// agrees with itself. Nothing compared a copy with the original.
//
// What that cost, measured on 2026-07-31: airun carried 88 primitive stops and
// 59 semantic roles, of which 143 were character-for-character the design
// system's and 4 were real overrides. Three colour roles fixed in the system
// that morning stayed broken there — status text at 1.54:1 — with a green gate
// above them, because airun's check read airun's copy.
//
// The rule, therefore:
//
//   • a token whose value DIFFERS from the system's is an override — the point
//     of having a layer, and always allowed;
//   • a token whose value is IDENTICAL is a copy — it adds nothing today and
//     silently stops tracking the system tomorrow;
//   • a token the system does not have at all is the product's own, allowed.
//
// And an override has to say WHY. A value that differs from the system with no
// word about it is not an override, it is a divergence nobody decided on: the
// next person cannot tell whether it is the brand, a workaround, or a mistake
// left behind. The reason goes next to the change — a comment on the line, or one
// above the group it covers, which is how apps/workshops/styles/brand.css is
// already written.
//
// Deleting a copy is not a style preference. It is the difference between a fix
// reaching every product and a fix reaching one.
import { readFileSync, existsSync } from 'node:fs'

const RESET = '\x1b[0m', RED = '\x1b[31m', GREEN = '\x1b[32m', DIM = '\x1b[2m', BOLD = '\x1b[1m'

const declarations = (css) => {
  const out = new Map()
  for (const m of css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/g)) {
    out.set(m[1], m[2].trim())
  }
  return out
}

/* Which tokens have a reason written next to them.
 *
 * Walking UP from the declaration: a comment before a blank line covers it. That
 * is how CSS is actually written — one line about a group, then the group — and
 * it means a group comment covers its group without one comment per stop. A
 * blank line ends the group, so the reason cannot drift onto unrelated tokens. */
function explained(css) {
  const lines = css.split('\n')
  const out = new Set()
  for (let i = 0; i < lines.length; i++) {
    const m = /^\s*(--[a-z0-9-]+)\s*:/.exec(lines[i])
    if (!m) continue
    if (/\/\*/.test(lines[i])) { out.add(m[1]); continue }
    for (let j = i - 1; j >= 0; j--) {
      if (/\*\//.test(lines[j]) || /^\s*\/\*/.test(lines[j])) { out.add(m[1]); break }
      if (!lines[j].trim()) break
    }
  }
  return out
}

/**
 * @param {object} cfg
 * @param {{ file: string, base: string }[]} cfg.layers  the product's token file
 *   and the system file it layers over
 * @param {string[]} [cfg.allow]  tokens that are deliberately restated, each with
 *   a reason in the calling script
 * @param {string} [cfg.label]
 */
export function checkTokenLayer({ layers, allow = [], label = '' }) {
  const copies = []
  const unexplained = []
  let overrides = 0
  let own = 0

  console.log(`${BOLD}Token layer${RESET}${label ? ` ${DIM}${label}${RESET}` : ''}\n`)

  for (const { file, base } of layers) {
    if (!existsSync(file)) continue
    if (!existsSync(base)) throw new Error(`token-layer: no system file at ${base}`)
    const raw = readFileSync(file, 'utf8')
    const mine = declarations(raw)
    const withReason = explained(raw)
    const theirs = declarations(readFileSync(base, 'utf8'))
    const short = file.split('/').slice(-2).join('/')

    let same = 0
    for (const [token, value] of mine) {
      if (!theirs.has(token)) { own++; continue }
      if (theirs.get(token) !== value) {
        overrides++
        if (!withReason.has(token)) unexplained.push(`${short}  ${token}: ${value}`)
        continue
      }
      same++
      if (!allow.includes(token)) copies.push(`${short}  ${token}: ${value}`)
    }
    console.log(`  ${short.padEnd(28)} ${DIM}${mine.size} tokens, ${same} identical to the system${RESET}`)
  }

  console.log(`\n  ${DIM}${overrides} override(s), ${own} of the product's own${RESET}\n`)

  if (unexplained.length) {
    console.error(`${RED}✗ ${unexplained.length} override(s) with no reason written next to them:${RESET}`)
    for (const u of unexplained.slice(0, 20)) console.error(`    ${u}`)
    if (unexplained.length > 20) console.error(`    ${DIM}… and ${unexplained.length - 20} more${RESET}`)
    console.error(
      `\n  Say what it is and why the system's value will not do — a comment on the` +
      `\n  line, or one above the group. Without it nobody can tell a brand decision` +
      `\n  from a workaround somebody left behind, and so nobody ever removes it.\n`,
    )
  }

  if (copies.length) {
    console.error(`${RED}✗ ${copies.length} token(s) restate the design system instead of overriding it:${RESET}`)
    for (const c of copies.slice(0, 20)) console.error(`    ${c}`)
    if (copies.length > 20) console.error(`    ${DIM}… and ${copies.length - 20} more${RESET}`)
    console.error(
      `\n  Delete them and let the system's value through. A restated token is a copy` +
      `\n  that stops tracking the original the moment the original changes — which is` +
      `\n  how a colour fixed in the system stays broken in a product.` +
      `\n  A genuinely deliberate restatement goes in this script's allow list, with why.\n`,
    )
    process.exit(1)
  }
  if (unexplained.length) process.exit(1)
  console.log(`${GREEN}✓ the layer only overrides, and every override says why.${RESET}`)
}
