import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ListItem } from './ListItem'

/* A row somebody can press. It is a real button, and it defaults to type
 * "button" for the reason every control in this system does: a bare button
 * inside a form submits it, and a list of choices that submits on the first
 * click is the kind of bug nobody reproduces on purpose. */

describe('ListItem', () => {
  it('is a button that does not submit the form it happens to sit in', () => {
    render(<ListItem>Northwind</ListItem>)
    expect(screen.getByRole('button', { name: 'Northwind' })).toHaveAttribute('type', 'button')
  })

  it('presses', async () => {
    const onClick = vi.fn()
    render(<ListItem onClick={onClick}>Northwind</ListItem>)
    await userEvent.click(screen.getByRole('button', { name: 'Northwind' }))
    expect(onClick).toHaveBeenCalledOnce()
  })

  /* With an icon the label is wrapped so the two can be laid out; without one
   * the children are the button's own content and no wrapper is invented. */
  it('wraps its body only when there is a marker to lay out beside it', () => {
    const { container, rerender } = render(<ListItem icon="search">Northwind</ListItem>)
    expect(container.querySelector('.list-item-body')).toHaveTextContent('Northwind')
    expect(container.querySelector('.list-item-marker')).toHaveAttribute('aria-hidden', 'true')

    rerender(<ListItem>Northwind</ListItem>)
    expect(container.querySelector('.list-item-body')).toBeNull()
  })
})
