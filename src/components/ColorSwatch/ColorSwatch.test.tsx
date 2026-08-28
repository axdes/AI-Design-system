import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ColorSwatch } from './ColorSwatch'

/* Test the PROMISE, not the markup: what would be broken for a reader if this
 * stopped working. A test that asserts a class name proves nothing. */
describe('ColorSwatch', () => {
  it('is a control with a name, not a coloured square', async () => {
    const onSelect = vi.fn()
    render(<ColorSwatch value="#4638d3" label="Indigo" onSelect={onSelect} />)
    /* Found by its NAME. This is the whole reason `label` is required: a colour
       has no accessible name of its own, and without one every swatch in the
       row reads as "button" to anyone not looking at it. */
    await userEvent.click(screen.getByRole('button', { name: 'Indigo' }))
    expect(onSelect).toHaveBeenCalledWith('#4638d3')
  })

  it('announces which one is chosen', () => {
    render(
      <>
        <ColorSwatch value="#4638d3" label="Indigo" selected />
        <ColorSwatch value="#0f766e" label="Teal" />
      </>,
    )
    expect(screen.getByRole('button', { name: 'Indigo' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Teal' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('does not fire when it is dead', async () => {
    const onSelect = vi.fn()
    render(<ColorSwatch value="#4638d3" label="Indigo" disabled onSelect={onSelect} />)
    await userEvent.click(screen.getByRole('button', { name: 'Indigo' }), { pointerEventsCheck: 0 })
    expect(onSelect).not.toHaveBeenCalled()
  })
})
