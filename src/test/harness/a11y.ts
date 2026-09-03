import { axe } from 'vitest-axe'

/* CANONICAL COPY: packages/design-system/src/test/harness/a11y.ts.
 * Every app carries a byte-identical copy at src/test/a11y.ts so its suite runs
 * standalone; `check:harness` in the design-system gate fails on drift. Edit
 * the canonical file, then re-copy — never edit a copy.
 *
 * axe in jsdom cannot evaluate color-contrast (it needs a canvas); contrast is
 * verified separately, from the token values, by each package's contrast gate.
 * Returns the violated rule ids so assertions read
 *   expect(await a11yViolations(el)).toEqual([])
 * and a failure names the rule instead of dumping the whole axe report.
 *
 * `disable` is for rules that judge the PAGE around the element: a component
 * rendered on its own has no landmarks, so a bare render passes ['region'];
 * a full screen rendered inside its shell passes nothing extra. */
/* ONE AXE RUN AT A TIME, PROCESS-WIDE.
 *
 * axe-core keeps a single global lock and throws "Axe is already running" if a
 * second run starts before the first finishes. Nothing here starts two on
 * purpose — but vitest shares one environment between test files in a worker,
 * and how many workers there are depends on the machine. On this laptop the
 * suite passed for months; in a scratch clone with a different core count it
 * failed on the first run of `npm run check:clone` (2026-09-02), in a file that
 * had not changed. A test that passes because of how many cores you have is not
 * a passing test, so the runs are queued rather than hoped about. */
let queue: Promise<unknown> = Promise.resolve()

export function a11yViolations(el: Element, disable: string[] = []): Promise<string[]> {
  const run = async () => {
    const rules: Record<string, { enabled: boolean }> = { 'color-contrast': { enabled: false } }
    for (const id of disable) rules[id] = { enabled: false }
    const results = await axe(el, { rules })
    return results.violations.map((v) => v.id)
  }
  const next = queue.then(run, run)
  queue = next.then(() => undefined, () => undefined)
  return next
}
