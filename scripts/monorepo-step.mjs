/* Run a MONOREPO-wide check when the monorepo is there, and say so when it is
 * not. The design system publishes standalone (github.com/axdes/AI-Design-system),
 * and a standalone clone has no apps/, no root scripts/ and no checks.json —
 * the same situation airun's archive already handles for lint-rules: a gate
 * step about the monorepo has nothing to check without one, and failing would
 * make the clone's gate a lie in the other direction. */
import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const HERE = fileURLToPath(new URL('.', import.meta.url))
const target = process.argv[2]
const path = new URL(target, new URL('.', import.meta.url)).pathname
if (!existsSync(path)) {
  console.log(`monorepo-step: ${target} is not here (standalone checkout) — nothing to check.`)
  process.exit(0)
}
try {
  execFileSync(process.execPath, [path, ...process.argv.slice(3)], { stdio: 'inherit', cwd: HERE + '..' })
} catch (e) {
  process.exit(e.status ?? 1)
}
