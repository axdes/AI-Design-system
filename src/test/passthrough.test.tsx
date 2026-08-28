import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { RENDER } from '@/specimens/render-map'
import registry from '../../component-registry.json'

/* WHAT YOU PASS THROUGH HAS TO ARRIVE.
 *
 * Twenty-eight components declare `inherits` in the registry — they spread
 * `...rest` onto the element they own, and that spread is a published part of
 * their contract: it is why a caller can give any of them a `className`, an
 * `id`, a `data-*` hook for a test, or an `aria-describedby` that ties it to a
 * hint somewhere else on the page.
 *
 * Nothing checked it. A mutation run deleted `{...rest}` from nine components
 * and every one of them survived the whole suite (2026-08-27): className stopped
 * arriving, ids stopped arriving, and 1,578 tests stayed green. It is the widest
 * silent contract in the package, and the failure is quiet in the worst way —
 * the component still renders, still looks right in a screenshot, and the thing
 * the caller attached it to simply never happens.
 *
 * One test for the class rather than twenty-eight for the instances: the list
 * comes from the registry, so a component that starts spreading gets covered
 * without anybody remembering to add it, and one that stops is a failure with
 * its own name in it.
 */

type Entry = { inherits?: string; main?: string }
const components = registry.components as Record<string, Entry>

/* Components that inherit but cannot be rendered from a fixture alone. Each
   needs a reason; the honest ones are those whose element is not theirs to
   own. */
const NO_FIXTURE: Record<string, string> = {
  ListItem: 'no fixture in the render map yet — it takes children that are themselves rows',
  /* These three are in NOT_RENDERABLE for the variant sheet, for the same
     reason they are here: the render map has no fixture that stands alone. */
  Layout: 'a layout needs children to be anything; asserted in its golden example',
  Stat: 'the render map leaves it out — no enumerated variant to photograph',
}

const inheriting = Object.entries(components)
  .filter(([, c]) => c.inherits)
  .map(([name]) => name)
  .filter((name) => !NO_FIXTURE[name])
  .filter((name) => RENDER[name])

describe('a component that spreads the rest of its props', () => {
  it('has a fixture for every one of them, or a written reason', () => {
    const declared = Object.entries(components).filter(([, c]) => c.inherits).map(([n]) => n)
    const uncovered = declared.filter((n) => !RENDER[n] && !NO_FIXTURE[n])
    expect(uncovered, 'add a fixture to render-map.tsx, or a reason to NO_FIXTURE').toEqual([])
    /* The population is worth stating out loud: this test is only as wide as
       the registry says it is. */
    expect(inheriting.length).toBeGreaterThan(20)
  })

  it.each(inheriting)('%s passes className, id and data-* through to its element', (name) => {
    const { container } = render(
      RENDER[name]({ className: 'passthrough-probe', id: 'probe-id', 'data-probe': 'yes' }),
    )
    /* Not `getByTestId`: the point is that an ARBITRARY attribute survives, and
       a component could satisfy a testid by handling that one prop by hand. */
    const byClass = container.querySelector('.passthrough-probe')
    const byId = container.querySelector('#probe-id')
    const byData = container.querySelector('[data-probe="yes"]')

    expect(byClass, `${name} dropped className — a caller cannot style or find it`).not.toBeNull()
    expect(byId, `${name} dropped id — nothing can point at it with aria-labelledby or a label`).not.toBeNull()
    expect(byData, `${name} dropped the rest of its props — {...rest} is not reaching the element`).not.toBeNull()

    /* NOT asserted: that all three land on the SAME element. Six of these are
       wrapped form controls — Checkbox, Radio, NumberInput, PasswordInput,
       SearchInput, Thumbnail — where `className` styles the wrapper and the rest
       goes to the input, and that is the right way round: an `id` has to reach
       the input or a `<label for>` points at nothing. Which element a prop lands
       on is the component's business; that none of them is dropped is the
       contract. */
  })
})
