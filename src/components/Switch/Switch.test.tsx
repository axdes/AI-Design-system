import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Switch } from './Switch'

describe('Switch', () => {
  it('is a labelled ARIA switch, not a styled checkbox', () => {
    render(<Switch checked={false} onChange={() => undefined} label="Weekly digest" />)
    const control = screen.getByRole('switch', { name: 'Weekly digest' })
    expect(control).toHaveAttribute('aria-checked', 'false')
    /* type=button: inside a <form> a bare <button> would submit it. */
    expect(control).toHaveAttribute('type', 'button')
  })

  it('reports the next state to onChange without owning it', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Switch checked={false} onChange={onChange} label="Weekly digest" />)

    await user.click(screen.getByRole('switch'))

    expect(onChange).toHaveBeenCalledWith(true)
    /* Controlled: it stays off until the consumer flips the prop. */
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false')
  })

  it('toggles with Space and Enter', async () => {
    const user = userEvent.setup()
    function Host() {
      const [on, setOn] = useState(false)
      return <Switch checked={on} onChange={setOn} label="Weekly digest" />
    }
    render(<Host />)
    const control = screen.getByRole('switch')
    control.focus()

    await user.keyboard(' ')
    expect(control).toHaveAttribute('aria-checked', 'true')
    await user.keyboard('{Enter}')
    expect(control).toHaveAttribute('aria-checked', 'false')
  })

  /* The invalid state reaches assistive tech and nothing else: a switch has no
     message of its own, so aria-invalid is the whole of it. */
  it('marks itself invalid for a screen reader', () => {
    render(<Switch checked={false} onChange={() => undefined} label="Weekly digest" invalid />)
    expect(screen.getByRole('switch')).toHaveAttribute('aria-invalid', 'true')
  })
})
