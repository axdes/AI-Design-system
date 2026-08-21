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
export async function a11yViolations(el: Element, disable: string[] = []): Promise<string[]> {
  const rules: Record<string, { enabled: boolean }> = { 'color-contrast': { enabled: false } }
  for (const id of disable) rules[id] = { enabled: false }
  const results = await axe(el, { rules })
  return results.violations.map((v) => v.id)
}
