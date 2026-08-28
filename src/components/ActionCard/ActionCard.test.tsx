import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from '../Button'
import { ActionCard } from './ActionCard'

/* The part that makes this a family rather than a Card with buttons: once the
 * request is answered the card says so IN PLACE of the actions. A card that
 * keeps its buttons after the answer gets answered twice. */

const answers = (onYes = () => {}) => (
  <>
    <Button onClick={onYes}>Approve</Button>
    <Button variant="secondary">Decline</Button>
  </>
)

describe('ActionCard', () => {
  it('asks the question as a heading and offers the answers', () => {
    render(<ActionCard title="Give access?" actions={answers()} />)
    expect(screen.getByRole('heading', { name: 'Give access?' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Approve' })).toBeInTheDocument()
  })

  it('takes the answer where the question is', async () => {
    const onYes = vi.fn()
    const user = userEvent.setup()
    render(<ActionCard title="Give access?" actions={answers(onYes)} />)

    await user.click(screen.getByRole('button', { name: 'Approve' }))
    expect(onYes).toHaveBeenCalledTimes(1)
  })

  it('replaces the actions with the outcome once it is answered', () => {
    render(
      <ActionCard
        title="Give access?"
        actions={answers()}
        resolved={{ tone: 'success', text: 'Approved by you' }}
      />,
    )
    expect(screen.getByText('Approved by you')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Approve' })).not.toBeInTheDocument()
  })

  it('carries the context the decision needs', () => {
    render(
      <ActionCard title="Give access?" eyebrow="Access request" actions={answers()}>
        <p>Front-end Engineer, Wave 3</p>
      </ActionCard>,
    )
    expect(screen.getByText('Access request')).toBeInTheDocument()
    expect(screen.getByText('Front-end Engineer, Wave 3')).toBeInTheDocument()
  })
})
