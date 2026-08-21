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
})
