import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SetupGuide } from './SetupGuide'

/* The checklist a product shows until somebody has finished setting it up. Two
 * things decide whether it is honest: the count has to be of the steps actually
 * done, and it may only offer to go away once there is nothing left in it. */

const steps = [
  { id: 'a', label: 'Connect a calendar', done: true },
  { id: 'b', label: 'Invite a colleague' },
  { id: 'c', label: 'Run a session' },
]

describe('SetupGuide', () => {
  it('counts what is done against what there is', () => {
    render(<SetupGuide title="Get started" steps={steps} />)
    expect(screen.getByText('1 of 3 done')).toBeInTheDocument()
  })

  it('will not be dismissed while there is anything left to do', () => {
    render(<SetupGuide title="Get started" steps={steps} onDismiss={vi.fn()} />)
    expect(screen.queryByRole('button', { name: 'Dismiss the guide' })).not.toBeInTheDocument()
  })

  it('offers the way out once every step is done', async () => {
    const onDismiss = vi.fn()
    render(<SetupGuide title="Get started" steps={steps.map((s) => ({ ...s, done: true }))} onDismiss={onDismiss} />)
    await userEvent.click(screen.getByRole('button', { name: 'Dismiss the guide' }))
    expect(onDismiss).toHaveBeenCalledOnce()
  })

  it('marks the steps that are finished, so the list is readable without the count', () => {
    const { container } = render(<SetupGuide title="Get started" steps={steps} />)
    expect(container.querySelectorAll('.setup-guide-step[data-done]')).toHaveLength(1)
  })

  it('names the dismiss control in the caller’s words', () => {
    render(
      <SetupGuide
        title="Finish setting up"
        steps={[{ id: 'one', label: 'Connect a source', done: true }]}
        onDismiss={() => undefined}
        dismissLabel="Hide the checklist"
      />,
    )
    expect(screen.getByRole('button', { name: 'Hide the checklist' })).toBeInTheDocument()
  })
})
