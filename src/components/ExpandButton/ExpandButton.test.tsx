import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ExpandButton } from './ExpandButton'

/* The floating action that opens something. It is a <Button> underneath, which
 * is the whole point of it: until 2026-08-31 it drew its own pill and forgot
 * the focus ring with it, so the most visible control in the product was the
 * one a keyboard user could not see. */

describe('ExpandButton', () => {
  it('is a real button, named by its label, that does not submit a form', () => {
    render(<ExpandButton icon="add" label="New session" />)
    const button = screen.getByRole('button', { name: 'New session' })
    expect(button).toHaveAttribute('type', 'button')
  })

  it('presses', async () => {
    const onClick = vi.fn()
    render(<ExpandButton icon="add" label="New session" onClick={onClick} />)
    await userEvent.click(screen.getByRole('button', { name: 'New session' }))
    expect(onClick).toHaveBeenCalledOnce()
  })

  /* The label is both the accessible name and the text that appears when the
   * button expands, so it is never absent — a floating glyph with no name is
   * the failure this component started as. */
  it('carries its label as text as well as as a name', () => {
    const { container } = render(<ExpandButton icon="add" label="New session" />)
    expect(container.querySelector('.expand-button-label')).toHaveTextContent('New session')
  })

  it('says whether it is expanded, and draws the chevron only when asked', () => {
    const { container, rerender } = render(<ExpandButton icon="add" label="New" expanded withChevron />)
    expect(screen.getByRole('button', { name: 'New' })).toHaveAttribute('data-expanded')
    expect(container.querySelector('.expand-button-chevron')).toBeInTheDocument()

    rerender(<ExpandButton icon="add" label="New" />)
    expect(screen.getByRole('button', { name: 'New' })).not.toHaveAttribute('data-expanded')
    expect(container.querySelector('.expand-button-chevron')).toBeNull()
  })
})
