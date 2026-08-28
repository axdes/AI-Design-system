// Bundle budget, shared by every package that ships a build.
//
// It existed twice: here and in an app, copied and then drifted — different
// wording, different chunk filter, and in the copy a real bug that made half of
// it dead. `if (total.kb > TOTAL_BUDGET_KB)` reads a property off a number, so
// the comparison was `undefined > 320`, which is false forever: that app's total
// budget had never once been enforced. A check that cannot fail is worse than no
// check, because it is counted as coverage.
//
// A package calls this with its own numbers:
//
//   import { checkBundleSize } from '<ds>/scripts/lib/size-check.mjs'
//   checkBundleSize({ mainKb: 175, totalKb: 320 })
import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { gzipSync } from 'node:zlib'

const RESET = '\x1b[0m', RED = '\x1b[31m', GREEN = '\x1b[32m', DIM = '\x1b[2m'

/**
 * @param {object} budget
 * @param {number} budget.mainKb   largest single JS chunk, gzipped
 * @param {number} budget.totalKb  all shipped JS, gzipped
 * @param {string} [budget.dir]    where the build landed, default dist/assets
 * @param {string[]} [budget.exclude]  filename fragments that are not shipped to
 *   users. The design system's `visual-*` chunk is the screenshot gallery: it
 *   imports the registry and every component, and no app user ever loads it.
 */
export function checkBundleSize({ mainKb, totalKb, dir = 'dist/assets', exclude = [] }) {
  if (!existsSync(dir)) {
    console.error(`No ${dir} — run \`npm run build\` first.`)
    process.exit(1)
  }

  const files = readdirSync(dir)
    .filter((f) => f.endsWith('.js'))
    .filter((f) => !exclude.some((p) => f.includes(p)))
  if (files.length === 0) {
    console.error(`No JS in ${dir} — nothing to measure, which is not a pass.`)
    process.exit(1)
  }

  const sized = files
    .map((f) => ({ f, kb: gzipSync(readFileSync(`${dir}/${f}`)).length / 1024 }))
    .sort((a, b) => b.kb - a.kb)
  const total = sized.reduce((s, x) => s + x.kb, 0)
  const main = sized[0]

  console.log('Bundle (gzipped JS):\n')
  for (const { f, kb } of sized.slice(0, 8)) console.log(`  ${kb.toFixed(1).padStart(7)} KB  ${f}`)
  if (sized.length > 8) console.log(`  ${DIM}${' '.repeat(7)}      … +${sized.length - 8} more chunks${RESET}`)
  console.log(`\n  main:  ${main.kb.toFixed(1)} KB (budget ${mainKb})`)
  console.log(`  total: ${total.toFixed(1)} KB (budget ${totalKb})\n`)

  const over = []
  if (main.kb > mainKb) over.push(`main chunk ${main.kb.toFixed(1)} KB > ${mainKb} KB (${main.f})`)
  if (total > totalKb) over.push(`total ${total.toFixed(1)} KB > ${totalKb} KB`)

  if (over.length) {
    console.error(`${RED}✗ bundle over budget:${RESET}`)
    for (const o of over) console.error(`    ${o}`)
    console.error('\n  Either justify the growth and raise the budget where it is declared,')
    console.error('  or find what got pulled in (a non-tree-shaken import, a mis-split chunk).')
    process.exit(1)
  }
  console.log(`${GREEN}✓ bundle within budget.${RESET}`)
}
