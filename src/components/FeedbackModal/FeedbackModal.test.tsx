import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FeedbackModal } from './FeedbackModal'

/* A form that keeps what the last person typed is a privacy problem as much as a
 * bug, so what this holds is mostly about state NOT surviving: the reason and the
 * details are cleared on send and on cancel, both times. */

const labels = {
  title: 'What went wrong?',
  close: 'Cancel',
  send: 'Send',
  desc: 'Tell us what to fix.',
  detailsLabel: 'Details',
  detailsPlaceholder: 'Optional',
  reasons: { wrong: 'Wrong', incomplete: 'Incomplete', unclear: 'Unclear', other: 'Other' },
}

const Dialog = (props: Partial<Parameters<typeof FeedbackModal>[0]> = {}) => (
  <FeedbackModal open onClose={() => undefined} onSubmit={() => undefined} labels={labels} {...props} />
)

describe('FeedbackModal', () => {
  it('is a named dialog offering every reason', () => {
    render(<Dialog />)

    expect(screen.getByRole('dialog', { name: 'What went wrong?' })).toBeInTheDocument()
    for (const label of Object.values(labels.reasons)) {
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument()
    }
  })

  it('sends the reason and the details together', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()
    render(<Dialog onSubmit={onSubmit} />)

    await user.click(screen.getByRole('button', { name: 'Unclear' }))
    await user.type(screen.getByLabelText('Details'), '  it repeated itself  ')
    await user.click(screen.getByRole('button', { name: 'Send' }))

    expect(onSubmit).toHaveBeenCalledWith('unclear', 'it repeated itself')
  })

  it('sends with no reason picked', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()
    render(<Dialog onSubmit={onSubmit} />)

    await user.click(screen.getByRole('button', { name: 'Send' }))

    /* Choosing a reason is not compulsory: an empty send is still a signal. */
    expect(onSubmit).toHaveBeenCalledWith(null, '')
  })

  it('holds one reason at a time and lets it be unpicked', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()
    render(<Dialog onSubmit={onSubmit} />)

    await user.click(screen.getByRole('button', { name: 'Wrong' }))
    await user.click(screen.getByRole('button', { name: 'Other' }))
    await user.click(screen.getByRole('button', { name: 'Other' }))
    await user.click(screen.getByRole('button', { name: 'Send' }))

    expect(onSubmit).toHaveBeenCalledWith(null, '')
  })

  it('forgets what was typed after sending', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()
    render(<Dialog onSubmit={onSubmit} />)

    await user.click(screen.getByRole('button', { name: 'Wrong' }))
    await user.type(screen.getByLabelText('Details'), 'first report')
    await user.click(screen.getByRole('button', { name: 'Send' }))

    expect(screen.getByLabelText('Details')).toHaveValue('')
    await user.click(screen.getByRole('button', { name: 'Send' }))
    expect(onSubmit).toHaveBeenLastCalledWith(null, '')
  })

  it('forgets what was typed after cancelling', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(<Dialog onClose={onClose} />)

    await user.type(screen.getByLabelText('Details'), 'never mind')
    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(onClose).toHaveBeenCalledTimes(1)
    expect(screen.getByLabelText('Details')).toHaveValue('')
  })

  it('renders nothing while closed', () => {
    render(<Dialog open={false} />)
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})
