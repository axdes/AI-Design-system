import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Thumbnail } from './Thumbnail'

/* A small picture of a thing, or the honest absence of one. The fallback is
 * the component: a column of images with a hole in it reads as broken, and a
 * glyph with no name is a promise of a label that is not there. */

describe('Thumbnail', () => {
  it('shows the picture when there is one, named by its alt', () => {
    render(<Thumbnail src="/cover.png" alt="Report cover" />)
    expect(screen.getByRole('img', { name: 'Report cover' })).toHaveAttribute('src', '/cover.png')
  })

  it('draws a glyph instead of a hole when there is no picture', () => {
    const { container } = render(<Thumbnail alt="Report cover" />)
    expect(container.querySelector('.thumbnail-fallback')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Report cover' })).toBeInTheDocument()
  })

  /* An empty alt is the caller saying "this picture adds nothing a reader
   * needs": the fallback then announces nothing rather than being an image with
   * no name, which is exactly the axe failure role-img-alt exists for. */
  it('is decoration rather than an unnamed image when the alt is empty', () => {
    const { container } = render(<Thumbnail alt="" />)
    const fallback = container.querySelector('.thumbnail-fallback')
    expect(fallback).toHaveAttribute('aria-hidden', 'true')
    expect(fallback).not.toHaveAttribute('role')
  })

  it('loads lazily, because a list of these is a list of requests', () => {
    render(<Thumbnail src="/cover.png" alt="Report cover" />)
    expect(screen.getByRole('img', { name: 'Report cover' })).toHaveAttribute('loading', 'lazy')
  })
})
