import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TagInput } from './TagInput'

describe('TagInput', () => {
  it('shows the committed tags and a labelled field', () => {
    render(<TagInput label="Tags" value={['design', 'weekly']} onChange={() => undefined} />)
    expect(screen.getByText('design')).toBeInTheDocument()
    expect(screen.getByText('weekly')).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Tags' })).toBeInTheDocument()
  })

  it('commits the draft on Enter and clears the field', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<TagInput label="Tags" value={['design']} onChange={onChange} />)

    await user.type(screen.getByRole('textbox', { name: 'Tags' }), 'quarterly{Enter}')

    expect(onChange).toHaveBeenCalledWith(['design', 'quarterly'])
    expect(screen.getByRole('textbox', { name: 'Tags' })).toHaveValue('')
  })

  it('treats comma as commit too', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<TagInput label="Tags" value={[]} onChange={onChange} />)

    await user.type(screen.getByRole('textbox', { name: 'Tags' }), 'ops,')

    expect(onChange).toHaveBeenCalledWith(['ops'])
  })

  it('drops duplicates case-insensitively but still clears the draft', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<TagInput label="Tags" value={['Design']} onChange={onChange} />)

    await user.type(screen.getByRole('textbox', { name: 'Tags' }), 'design{Enter}')

    expect(onChange).not.toHaveBeenCalled()
    expect(screen.getByRole('textbox', { name: 'Tags' })).toHaveValue('')
  })

  it('Backspace in the empty field takes the last tag back', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<TagInput label="Tags" value={['design', 'weekly']} onChange={onChange} />)

    await user.type(screen.getByRole('textbox', { name: 'Tags' }), '{Backspace}')

    expect(onChange).toHaveBeenCalledWith(['design'])
  })

  it('each tag removes through its own labelled button', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<TagInput label="Tags" value={['design', 'weekly']} onChange={onChange} />)

    await user.click(screen.getByRole('button', { name: 'Remove design' }))

    expect(onChange).toHaveBeenCalledWith(['weekly'])
  })

  /* BACKSPACE ON AN EMPTY FIELD WITH NO TAGS MUST DO NOTHING. The guard is
     `value.length > 0`; widened to `>= 0` it calls onChange with a slice of an
     empty array on every stray Backspace, so a component that looks idle is
     writing to its caller. A mutation run widened it and nothing failed
     (2026-08-29). */
  it('does not call onChange when Backspace is pressed with no tags', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<TagInput label="Tags" value={[]} onChange={onChange} />)

    await user.click(screen.getByRole('textbox', { name: 'Tags' }))
    await user.keyboard('{Backspace}{Backspace}')

    expect(onChange).not.toHaveBeenCalled()
  })
})
