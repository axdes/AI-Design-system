import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Rating } from './Rating'

describe('Rating', () => {
  it('is read-only (img) without onChange', () => {
    render(<Rating label="Score" value={3} />)
    expect(screen.getByRole('img', { name: '3 out of 5' })).toBeInTheDocument()
    expect(screen.queryByRole('slider')).toBeNull()
  })

  it('is an interactive slider with onChange', () => {
    render(<Rating label="Rate it" value={2} onChange={() => undefined} />)
    const slider = screen.getByRole('slider', { name: 'Rate it' })
    expect(slider).toHaveAttribute('aria-valuenow', '2')
    expect(slider).toHaveAttribute('aria-valuemax', '5')
  })

  it('sets the score by clicking a star', async () => {
    const user = userEvent.setup()
    function Host() {
      const [v, setV] = useState(0)
      return (
        <>
          <Rating label="Rate it" value={v} onChange={setV} />
          <output>{v}</output>
        </>
      )
    }
    render(<Host />)
    /* Stars are presentational spans (the slider owns keyboard); click the 4th. */
    const stars = document.querySelectorAll('.rating-star-button')
    await user.click(stars[3] as HTMLElement)
    expect(screen.getByRole('status')).toHaveTextContent('4')
  })

  it('moves with arrow keys', async () => {
    const user = userEvent.setup()
    function Host() {
      const [v, setV] = useState(3)
      return <Rating label="Rate it" value={v} onChange={setV} />
    }
    render(<Host />)
    screen.getByRole('slider').focus()
    await user.keyboard('{ArrowRight}')
    expect(screen.getByRole('slider')).toHaveAttribute('aria-valuenow', '4')
    await user.keyboard('{ArrowLeft}{ArrowLeft}')
    expect(screen.getByRole('slider')).toHaveAttribute('aria-valuenow', '2')
  })
})
