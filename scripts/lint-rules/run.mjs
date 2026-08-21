// The runner every package's lint-rules.mjs calls. Prints one line per rule,
// lists violations under the ones that failed, exits non-zero if anything did.
import { createContext, SHARED_RULES } from './rules.mjs'

/**
 * @param {object} opts
 * @param {string} opts.title    banner, e.g. "<package> lint-rules"
 * @param {object} opts.context  config for createContext()
 * @param {Array<string | [string, Function]>} opts.rules
 *        The rule set IN THE ORDER it should be reported. A string names a shared
 *        rule; a pair is a package-specific one, so structural rules can sit next
 *        to the shared rules they belong with instead of being appended at the end.
 *        Defaults to every shared rule.
 */
export function runLintRules({ title, context, rules }) {
  const c = createContext(context)

  const wanted = rules ?? Object.keys(SHARED_RULES)
  const unknown = wanted.filter((r) => typeof r === 'string' && !SHARED_RULES[r])
  if (unknown.length) {
    console.error(`\x1b[31mUnknown rule(s): ${unknown.join(', ')}\x1b[0m`)
    process.exit(1)
  }

  const set = wanted.map((r) =>
    typeof r !== 'string'
      ? r
      // The size ceiling is per package, so its label carries the number.
      : [r === 'files within the size ceiling' ? `files <= ${c.fileSizeMax} lines` : r, SHARED_RULES[r]],
  )

  console.log(`\x1b[1m${title} — deterministic, zero-dep, no AI\x1b[0m\n`)
  let failed = 0, total = 0
  for (const [name, run] of set) {
    const v = run(c)
    total += v.length
    if (!v.length) { console.log(`  \x1b[32m✓\x1b[0m ${name}`); continue }
    failed++
    console.log(`  \x1b[31m✗ ${name}\x1b[0m (${v.length})`)
    v.slice(0, 12).forEach((x) => console.log(`      ${x}`))
    if (v.length > 12) console.log(`      … +${v.length - 12} more`)
  }
  console.log('')
  if (failed) {
    console.error(`\x1b[31m✗ ${failed} rule(s) failed, ${total} violation(s).\x1b[0m`)
    process.exit(1)
  }
  console.log('\x1b[32m✓ all lint-rules pass.\x1b[0m')
}
