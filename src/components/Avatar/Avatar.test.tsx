import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { Avatar } from './Avatar'

/* A photo url that 404s used to leave the browser's broken-image glyph inside a
 * circle, and a presence dot that is only a colour says nothing to a screen
 * reader. Neither shows up in a passing render test unless it is asserted. */

describe('Avatar', () => {
  it('falls back to the initial when the image fails to load', () => {
    render(<Avatar name="Sarah Al-Mansouri" src="/gone.png" />)

    const img = screen.getByRole('img', { name: 'Sarah Al-Mansouri' }).querySelector('img')
    expect(img).not.toBeNull()

    fireEvent.error(img as HTMLImageElement)

    expect(screen.getByRole('img', { name: 'Sarah Al-Mansouri' }).querySelector('img')).toBeNull()
    expect(screen.getByText('S')).toBeInTheDocument()
  })

  it('retries when the src changes after a failure', () => {
    const { rerender } = render(<Avatar name="Omar Haddad" src="/gone.png" />)
    fireEvent.error(screen.getByRole('img').querySelector('img') as HTMLImageElement)
    expect(screen.getByRole('img').querySelector('img')).toBeNull()

    rerender(<Avatar name="Omar Haddad" src="/there.png" />)
    expect(screen.getByRole('img').querySelector('img')).toHaveAttribute('src', '/there.png')
  })

  it('puts the status into the accessible name, not only into the dot colour', () => {
    render(<Avatar name="Omar Haddad" status="online" statusLabel="Online" />)
    expect(screen.getByRole('img', { name: 'Omar Haddad, Online' })).toBeInTheDocument()
  })

  it('reads the raw status when no label is given', () => {
    render(<Avatar name="Omar Haddad" status="busy" />)
    expect(screen.getByRole('img', { name: 'Omar Haddad, busy' })).toBeInTheDocument()
  })

  it('says nothing extra without a status', () => {
    const { container } = render(<Avatar name="Omar Haddad" />)
    expect(screen.getByRole('img', { name: 'Omar Haddad' })).toBeInTheDocument()
    expect(container.querySelector('.avatar-status')).toBeNull()
  })

  it('carries the shape as a data attribute', () => {
    const { container } = render(<Avatar name="Platform Guild" shape="square" />)
    expect(container.querySelector('.avatar')).toHaveAttribute('data-shape', 'square')
  })
})
