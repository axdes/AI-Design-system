import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { WizardTemplate } from './WizardTemplate'

/* A form split over steps. The arithmetic is the part that breaks: which step
 * is current, whether this is the last one, and what the forward control says
 * when it is — "Next" on the last step is a promise of a step that does not
 * exist. */

const steps = [
  { id: 'who', label: 'Who' },
  { id: 'what', label: 'What' },
  { id: 'confirm', label: 'Confirm' },
]

type WizardProps = Parameters<typeof WizardTemplate>[0]

const wizard = (props: Partial<WizardProps> = {}) =>
  render(
    <MemoryRouter>
      <WizardTemplate
        {...({ title: 'New project', steps, currentId: 'who', submitLabel: 'Create', ...props } as WizardProps)}
      >
        <p>step body</p>
      </WizardTemplate>
    </MemoryRouter>,
  )

describe('WizardTemplate', () => {
  it('offers the way forward, not the way out, before the last step', () => {
    wizard()
    expect(screen.getByRole('button', { name: 'Next' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Create' })).not.toBeInTheDocument()
  })

  it('offers the commit on the last step, and not before', () => {
    wizard({ currentId: 'confirm' })
    expect(screen.getByRole('button', { name: 'Create' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Next' })).not.toBeInTheDocument()
  })

  /* A step id nobody recognises must not leave the wizard between steps: it
   * lands on the first, which is the only state a person can act from. */
  it('falls back to the first step rather than to none', () => {
    wizard({ currentId: 'nonesuch' })
    expect(screen.getByRole('button', { name: 'Next' })).toBeInTheDocument()
  })

  it('moves when the step control is used', async () => {
    const onSelect = vi.fn()
    wizard({ currentId: 'what', onSelect })
    await userEvent.click(screen.getByRole('button', { name: 'Back' }))
    expect(onSelect).toHaveBeenCalledWith('who')
  })

  it('carries the step body it was given', () => {
    wizard()
    expect(screen.getByText('step body')).toBeInTheDocument()
  })
})
