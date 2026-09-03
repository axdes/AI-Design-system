import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Identity } from './Identity'

/* A person: a face, a name, and usually a second line nobody reads until they
 * need it. The avatar's initials come from the name, which is why a ReactNode
 * name — a link, a highlighted match — needs somewhere plain to fall back to. */

describe('Identity', () => {
  it('shows the name and the line under it', () => {
    render(<Identity name="Ada Lovelace" secondary="ada@example.com" />)
    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument()
    expect(screen.getByText('ada@example.com')).toBeInTheDocument()
  })

  it('is a face and a name when there is no second line', () => {
    const { container } = render(<Identity name="Ada Lovelace" />)
    expect(container.querySelector('.identity-secondary')).toBeNull()
  })

  /* A name that is a link or a highlighted match cannot be turned into initials,
   * so the caller says what the person is called in plain words. */
  it('takes a plain name for the face when the visible name is not text', () => {
    render(<Identity name={<a href="/u/1">Ada Lovelace</a>} avatarName="Ada Lovelace" />)
    expect(screen.getByRole('link', { name: 'Ada Lovelace' })).toBeInTheDocument()
    /* The face is named for the person even though the visible name is a link:
     * without avatarName the avatar would be labelled with nothing at all. */
    expect(screen.getByRole('img', { name: 'Ada Lovelace' })).toBeInTheDocument()
  })

  it('names the face from the name itself when the name IS text', () => {
    render(<Identity name="Ada Lovelace" />)
    expect(screen.getByRole('img', { name: 'Ada Lovelace' })).toBeInTheDocument()
  })
})
