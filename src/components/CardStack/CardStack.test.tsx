import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CardTitle } from '../Card'
import { CardStack } from './CardStack'

describe('CardStack', () => {
  /* Without the controls the pile is one target, and the only way in is the card
   * itself — named for a screen reader by `label`, since the layering is silent. */
  it('opens from the card when it has no controls', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(
      <CardStack count={12} label="12 audits waiting on you" onSelect={onSelect}>
        <CardTitle>Site 14, working at height</CardTitle>
      </CardStack>,
    )
    await user.click(screen.getByLabelText('12 audits waiting on you'))
    expect(onSelect).toHaveBeenCalledTimes(1)
  })

  /* With them the pile is a queue: two named buttons, and the card itself stops
   * being a target so a click on "Skip" cannot also open what it skipped. */
  it('works through the pile with two named controls', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    const onNext = vi.fn()
    render(
      <CardStack
        count={12}
        label="12 audits waiting on you"
        onSelect={onSelect}
        onNext={onNext}
        nextLabel="Skip"
        openLabel="Open"
      >
        <CardTitle>Site 14, working at height</CardTitle>
      </CardStack>,
    )
    await user.click(screen.getByRole('button', { name: 'Skip' }))
    expect(onNext).toHaveBeenCalledTimes(1)
    expect(onSelect).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Open' }))
    expect(onSelect).toHaveBeenCalledTimes(1)
    expect(onNext).toHaveBeenCalledTimes(1)
  })

  /* A mutation test removed this component's aria-label and the whole suite —
     471 tests, axe over every golden example — stayed green (2026-08-26). The
     examples give the control a name another way, so axe is satisfied there and
     the standalone case, which is how a product uses it, went unchecked. The
     name IS the contract for a control whose label is not text beside it. */
  it('names the group it collapses several cards into', () => {
    /* The group only exists in the worked arrangement — two named controls
       rather than one big target — which is what `onNext` + the two labels
       select. In the other arrangement the name belongs to the card itself,
       asserted just below. */
    render(
      <CardStack count={3} label="3 drafts" onSelect={() => {}} onNext={() => {}} nextLabel="Next draft" openLabel="Open draft">
        <CardTitle>Draft</CardTitle>
      </CardStack>,
    )
    expect(screen.getByRole('group', { name: '3 drafts' })).toBeInTheDocument()
  })

  it('names the card itself when the stack is one target', () => {
    render(
      <CardStack count={3} label="3 drafts" onSelect={() => {}}>
        <CardTitle>Draft</CardTitle>
      </CardStack>,
    )
    expect(screen.getByLabelText('3 drafts')).toBeInTheDocument()
  })
})
