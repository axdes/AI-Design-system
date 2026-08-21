import { describe, expect, it } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import { renderScreen } from '@/test/renderScreen'
import { ForReviewPage } from './ForReviewPage'

/* The for-review spec's behaviours, by name. The queue is seeded from the
 * mock fixtures (four items in review), so the decisions really drain it. */
describe('for-review behaviours', () => {
  it('for-review#approve-clears-in-place — approving removes the row where it stands, no navigation', () => {
    renderScreen(<ForReviewPage />)
    const rows = screen.getAllByRole('button', { name: /approve/i })
    const before = rows.length
    expect(before).toBeGreaterThan(1)
    fireEvent.click(rows[0])
    expect(screen.getAllByRole('button', { name: /approve/i })).toHaveLength(before - 1)
  })

  it('for-review#request-changes-collects-a-note — the dialog opens, and sending returns the item to its author', () => {
    renderScreen(<ForReviewPage />)
    fireEvent.click(screen.getAllByRole('button', { name: /request changes/i })[0])
    const dialog = screen.getByRole('dialog')
    expect(dialog).toBeInTheDocument()
    /* An empty note cannot be sent — the note IS what makes it a review. */
    expect(screen.getByRole('button', { name: /send feedback/i })).toBeDisabled()
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Second section needs sources.' } })
    fireEvent.click(screen.getByRole('button', { name: /send feedback/i }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('for-review#drained-queue-is-done — deciding the last item shows the empty state, not a blank page', () => {
    renderScreen(<ForReviewPage />)
    /* Approve everything. */
    for (;;) {
      const buttons = screen.queryAllByRole('button', { name: /approve/i })
      if (!buttons.length) break
      fireEvent.click(buttons[0])
    }
    expect(screen.getByText(/inbox zero, reviewer style/i)).toBeInTheDocument()
  })
})
