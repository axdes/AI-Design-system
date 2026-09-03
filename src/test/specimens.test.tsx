import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { a11yViolations } from './a11y'
import { CARD_SPECIMENS } from '../specimens/cards'
import { FORM_SPECIMENS } from '../specimens/forms'
import { TABLE_SPECIMENS } from '../specimens/tables'
import { CELL_SPECIMENS } from '../specimens/cells'
import { CONTROL_SPECIMENS } from '../specimens/controls'
import rules from '../../screen-specs/card-rules.json'
import formRules from '../../screen-specs/form-rules.json'
import tableRules from '../../screen-specs/table-rules.json'
import cellRules from '../../screen-specs/cell-rules.json'
import controlRules from '../../screen-specs/control-rules.json'

/* The 31 card families, rendered.
 *
 * `check:spec` counts how many families HAVE a specimen; nothing rendered one
 * until this file (2026-08-26). A specimen that compiles and throws at runtime
 * is worse than none: the patterns page shows it to whoever is deciding which
 * card to build, and a family nobody can see is the thing these were written to
 * fix in the first place.
 */
const families = (rules.families ?? []).map((f: { id: string }) => f.id)

describe('card specimens', () => {
  it('covers every family the rules name, and invents none', () => {
    expect(Object.keys(CARD_SPECIMENS).sort()).toEqual([...families].sort())
  })

  for (const [id, Specimen] of Object.entries(CARD_SPECIMENS)) {
    it(`${id} renders something a reader can read`, () => {
      const { unmount } = render(<Specimen />)
      /* Not "does not throw": a specimen that renders an empty box passes that
         and teaches nothing. It has to carry INFORMATION — words, named marks
         for `logos` whose whole subject is images carrying it, or a control
         that names itself. Read from document.body, because a dialog portals
         out of the container. */
      const words = (document.body.textContent ?? '').trim().length
      const named = [...document.body.querySelectorAll('img[alt]')].filter((i) => i.getAttribute('alt')).length
      const namedControls = [...document.body.querySelectorAll('[placeholder], [aria-label]')].length
      expect(words > 8 || named > 0 || namedControls > 0, `${id} renders nothing a reader can use`).toBe(true)
      unmount()
    })
  }

  /* One sweep rather than one test each: these are compositions of parts that
     are already audited alone, so what is new here is how they combine. */
  /* 30s, not the 5s default: axe holds one global lock, so the harness queues
   * its runs (src/test/harness/a11y.ts, 2026-09-02) and a test that checks
   * thirty specimens now waits for every other file's axe as well. The work is
   * real; the old number was measuring a race. */
  it('has no accessibility violations in any family', { timeout: 30_000 }, async () => {
    for (const [id, Specimen] of Object.entries(CARD_SPECIMENS)) {
      const { container, unmount } = render(<Specimen />)
      const violations = await a11yViolations(container)
      expect(violations, `${id}: ${violations.join(', ')}`).toHaveLength(0)
      unmount()
    }
  })
})

/* The same three questions for the other three layers. A kind the rules can
   choose and nobody has ever rendered is a rule taught blind, and the fastest
   way for one to break is a part it composes changing under it. */
for (const [layer, specimens, ids] of [
  ['form', FORM_SPECIMENS, Object.keys(formRules.formKinds ?? {})],
  ['table', TABLE_SPECIMENS, Object.keys(tableRules.tableKinds ?? {})],
  ['cell', CELL_SPECIMENS, Object.keys(cellRules.cellKinds ?? {})],
  ['control', CONTROL_SPECIMENS, Object.keys(controlRules.controlKinds ?? {})],
] as const) {
  describe(`${layer} specimens`, () => {
    it('covers every kind the rules name, and invents none', () => {
      expect(Object.keys(specimens).sort()).toEqual([...ids].sort())
    })

    for (const [id, Specimen] of Object.entries(specimens)) {
      it(`${id} renders something a reader can read`, () => {
        const { unmount } = render(<Specimen />)
        /* document.body, not the container: a dialog PORTALS out of it, and a
           check that only looks in the container calls a rendered modal empty.
           Information counts as words, named marks, or a control that names
           itself — a search field carries its whole meaning in a placeholder. */
        const words = (document.body.textContent ?? '').trim().length
        const named = [...document.body.querySelectorAll('img[alt]')].filter((i) => i.getAttribute('alt')).length
        const namedControls = [...document.body.querySelectorAll('[placeholder], [aria-label]')].length
        expect(words > 8 || named > 0 || namedControls > 0, `${id} renders neither words, named marks nor a named control`).toBe(true)
        unmount()
      })
    }

    it('has no accessibility violations in any kind', { timeout: 30_000 }, async () => {
      for (const [id, Specimen] of Object.entries(specimens)) {
        const { container, unmount } = render(<Specimen />)
        const violations = await a11yViolations(container)
        expect(violations, `${id}: ${violations.join(', ')}`).toHaveLength(0)
        unmount()
      }
    })
  })
}
