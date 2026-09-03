import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { InlineText } from './InlineText'

/* The whole point of this component is that the element the user reads is the
 * element they edit. That makes the contract behavioural, not visual: Enter
 * commits, Escape reverts, blur saves, and an empty value is never a save. */

const setText = (el: HTMLElement, text: string) => { el.textContent = text }

describe('InlineText', () => {
  it('commits on Enter', async () => {
    const onSave = vi.fn()
    const user = userEvent.setup()
    render(<InlineText value="Old" label="Title" onSave={onSave} />)

    const box = screen.getByRole('textbox', { name: 'Title' })
    box.focus()
    setText(box, 'New')
    await user.keyboard('{Enter}')

    expect(onSave).toHaveBeenCalledWith('New')
  })

  it('reverts on Escape and saves nothing', async () => {
    const onSave = vi.fn()
    const user = userEvent.setup()
    render(<InlineText value="Old" label="Title" onSave={onSave} />)

    const box = screen.getByRole('textbox', { name: 'Title' })
    box.focus()
    setText(box, 'Discard me')
    await user.keyboard('{Escape}')

    expect(box.textContent).toBe('Old')
    expect(onSave).not.toHaveBeenCalled()
  })

  it('saves on blur when the text actually changed', async () => {
    const onSave = vi.fn()
    render(<InlineText value="Old" label="Title" onSave={onSave} />)

    const box = screen.getByRole('textbox', { name: 'Title' })
    box.focus()
    setText(box, '  Trimmed  ')
    box.blur()

    expect(onSave).toHaveBeenCalledWith('Trimmed')
  })

  it('treats an emptied value as an abort, not a save', async () => {
    const onSave = vi.fn()
    const onAbort = vi.fn()
    render(<InlineText value="Old" label="Title" onSave={onSave} onAbort={onAbort} />)

    const box = screen.getByRole('textbox', { name: 'Title' })
    box.focus()
    setText(box, '   ')
    box.blur()

    /* Blanking a title is far more often a slip than an intention, so the
     * committed value comes back and the caller hears `onAbort`. */
    expect(onSave).not.toHaveBeenCalled()
    expect(onAbort).toHaveBeenCalled()
    expect(box.textContent).toBe('Old')
  })

  it('aborts rather than saves when the text is unchanged', () => {
    const onSave = vi.fn()
    const onAbort = vi.fn()
    render(<InlineText value="Same" label="Title" onSave={onSave} onAbort={onAbort} />)

    const box = screen.getByRole('textbox', { name: 'Title' })
    box.focus()
    box.blur()

    expect(onSave).not.toHaveBeenCalled()
    expect(onAbort).toHaveBeenCalled()
  })

  it('keeps a heading a heading, with the textbox inside it', () => {
    /* ARIA forbids role=textbox on a heading, and axe fails it. The heading
     * stays semantic and the editable child inherits its font. */
    render(<InlineText as="h2" value="Project" label="Project name" onSave={() => undefined} />)

    const heading = screen.getByRole('heading', { level: 2 })
    const box = screen.getByRole('textbox', { name: 'Project name' })
    expect(heading).toContainElement(box)
    expect(heading.tagName).toBe('H2')
  })

  /* For the value the reader has just created and is expected to name — a new
     document, a new board — the field is already theirs to type in. */
  it('opens straight into the field for a value the reader has just created', () => {
    render(<InlineText value="Untitled" label="Document title" onSave={() => undefined} autoFocus />)
    expect(screen.getByRole('textbox', { name: 'Document title' })).toHaveFocus()
  })
})
