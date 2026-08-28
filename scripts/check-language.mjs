#!/usr/bin/env node
/* One language in the package, and it is English.
 *
 * The working language of this project is Russian and the shipped language is
 * English — code, comments, commits, UI strings, and every file this package
 * carries. The rule held everywhere except one place nobody looked: ten request
 * records quoted the owner's approvals verbatim, so `requests/*.json` shipped
 * Russian to a public repository, and the fact that they were APPROVALS made it
 * private conversation as well as the wrong language (found by the owner reading
 * the published repo, 2026-08-21).
 *
 * A comment saying "write English" cannot fail; this can. It reads what git
 * CARRIES, because that is what gets published.
 *
 * docs/CHANGELOG-REVIEW.md is the one exception: it is the internal working log,
 * written in the working language on purpose, and the publisher swaps it for a
 * stub (scripts/publish-ds.mjs at the monorepo root) rather than shipping it.
 *
 * Run: node scripts/check-language.mjs   (wired into `npm run check`)
 */
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('..', import.meta.url)).replace(/\/$/, '')
const RED = '\x1b[31m', GREEN = '\x1b[32m', DIM = '\x1b[2m', R = '\x1b[0m'

/* Written in the working language on purpose, and never published as itself. */
const EXEMPT = new Set(['docs/CHANGELOG-REVIEW.md'])
/* WebP joined the list the day six demo photographs were converted to it: a
   compressed image is bytes that occasionally look like Cyrillic, and the check
   reported six "published files carrying the working language" that were
   pictures (2026-08-28). An extension list is the wrong shape for this and a
   content sniff would be the right one; until then, keep it complete. */
const BINARY = /\.(png|jpe?g|gif|ico|webp|avif|svgz|woff2?|ttf|otf|mp4|webm|mp3|wav|zip|pdf|xlsx)$/i
/* Cyrillic is the working language here. Other scripts are legitimate content:
 * the ar locale is Arabic BECAUSE the system ships an Arabic translation.
 *
 * Written as escapes, not as the characters themselves — the first version of
 * this file spelled the range out and failed itself, which is a small proof that
 * the check reads what it claims to read. */
const CYRILLIC = /[\u0400-\u04FF\u0500-\u052F]/

let files
try {
  files = execFileSync('git', ['ls-files'], { cwd: ROOT, encoding: 'utf8' }).split('\n').filter(Boolean)
} catch {
  console.log('check-language: not a git checkout — nothing to read.')
  process.exit(0)
}

const hits = []
for (const file of files) {
  if (EXEMPT.has(file) || BINARY.test(file)) continue
  let text
  try { text = readFileSync(`${ROOT}/${file}`, 'utf8') } catch { continue }
  if (!CYRILLIC.test(text)) continue
  const line = text.split('\n').findIndex((l) => CYRILLIC.test(l)) + 1
  const sample = text.split('\n')[line - 1].trim().slice(0, 72)
  hits.push({ file, line, sample })
}

if (hits.length) {
  console.error(`${RED}✗ ${hits.length} published file(s) carry the working language:${R}`)
  for (const h of hits) console.error(`    ${h.file}:${h.line}  ${DIM}${h.sample}${R}`)
  console.error('  This package is published in English. Translate the text, or, if the file is')
  console.error('  genuinely internal, exempt it here AND make the publisher drop it.')
  process.exit(1)
}
console.log(`${GREEN}✓ ${files.length} tracked file(s) are in the shipped language.${R}`)
