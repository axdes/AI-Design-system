import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FormPanel } from './FormPanel'
import { Input } from '../../components/Input'

/* The same form, in the side panel rather than on a page. Two ways out — commit
 * and close — and both have to exist, because a panel that can only be
 * committed is a trap. */

const panel = (props: Partial<Parameters<typeof FormPanel>[0]> = {}) =>
  render(
    <FormPanel title="Edit session" onSubmit={vi.fn()} onClose={vi.fn()} {...props}>
      <Input aria-label="Name" />
    </FormPanel>,
  )

describe('FormPanel', () => {
  it('is a named region, so the panel is findable beside the page', () => {
    panel()
    expect(screen.getByRole('region', { name: 'Edit session' })).toBeInTheDocument()
  })

  it('commits and closes, and both are reachable', async () => {
    const onSubmit = vi.fn()
    const onClose = vi.fn()
    panel({ onSubmit, onClose, submitLabel: 'Save' })

    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(onSubmit).toHaveBeenCalledOnce()

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('shows what is wrong when something is', () => {
    panel({ errors: [{ id: 'name', message: 'Give it a name.' }] })
    expect(screen.getByText('Give it a name.')).toBeInTheDocument()
  })

  /* `busy` is the whole of what a form does while it is saving: the commit
     shows a spinner and the way out is blocked, so a second submit cannot
     happen and a half-saved record cannot be abandoned mid-write. */
  it('blocks the way out and spins the commit while it saves, in the caller’s words', () => {
    render(
      <FormPanel
        title="Edit client"
        onClose={() => undefined}
        onSubmit={() => undefined}
        submitLabel="Save"
        cancelLabel="Not now"
        busy
      >
        <p>fields</p>
      </FormPanel>,
    )
    expect(screen.getByRole('button', { name: 'Not now' })).toBeDisabled()
    expect(screen.getByRole('button', { name: /Save/ })).toHaveAttribute('data-loading')
  })
})
