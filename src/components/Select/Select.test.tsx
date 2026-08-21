import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Select } from './Select'

const OPTIONS = [
  { value: 'editor', label: 'Editor' },
  { value: 'viewer', label: 'Viewer' },
] as const

describe('Select', () => {
  it('shows the selected label and falls back to the placeholder', () => {
    const { rerender } = render(
      <Select label="Role" value="editor" onChange={() => undefined} options={OPTIONS} />,
    )
    expect(screen.getByRole('button', { name: 'Role' })).toHaveTextContent('Editor')

    rerender(
      <Select label="Role" value={undefined} onChange={() => undefined} options={OPTIONS} placeholder="Pick a role" />,
    )
    expect(screen.getByRole('button', { name: 'Role' })).toHaveTextContent('Pick a role')
  })

  it('picks a value and closes', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Select label="Role" value="editor" onChange={onChange} options={OPTIONS} />)

    await user.click(screen.getByRole('button', { name: 'Role' }))
    await user.click(screen.getByRole('menuitem', { name: 'Viewer' }))

    expect(onChange).toHaveBeenCalledWith('viewer')
    await waitFor(() => expect(screen.queryByRole('menu')).toBeNull())
  })

  it('marks the current option so the menu shows what is selected', async () => {
    const user = userEvent.setup()
    function Host() {
      const [role, setRole] = useState<'editor' | 'viewer'>('editor')
      return <Select label="Role" value={role} onChange={setRole} options={OPTIONS} />
    }
    render(<Host />)

    await user.click(screen.getByRole('button', { name: 'Role' }))

    expect(screen.getByRole('menuitem', { name: 'Editor' })).toHaveAttribute('aria-current', 'true')
    expect(screen.getByRole('menuitem', { name: 'Viewer' })).not.toHaveAttribute('aria-current')
  })

  const trigger = () => screen.getByRole('button', { name: 'Role' })

  it('marks invalid for CSS, and deliberately claims no ARIA it cannot back', () => {
    /* `aria-invalid` is not supported on role=button, and this trigger is a
     * button whose popup is a menu rather than a listbox. Setting it would be
     * invalid ARIA, which is worse than none: see the prop's comment for the real
     * gap, which is that <Field> has no error slot to describe the control with. */
    render(<Select label="Role" value="editor" onChange={() => undefined} options={OPTIONS} invalid />)
    expect(trigger()).toHaveAttribute('data-invalid')
    expect(trigger()).not.toHaveAttribute('aria-invalid')
  })

  it('a valid select carries no marker', () => {
    render(<Select label="Role" value="editor" onChange={() => undefined} options={OPTIONS} />)
    expect(trigger()).not.toHaveAttribute('data-invalid')
  })

  it('disabled cannot be opened', async () => {
    const user = userEvent.setup()
    render(<Select label="Role" value="editor" onChange={() => undefined} options={OPTIONS} disabled />)

    expect(trigger()).toBeDisabled()
    await user.click(trigger())
    expect(screen.queryByRole('menu')).toBeNull()
  })

  it('a disabled option is shown but cannot be picked', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <Select
        label="Role"
        value="editor"
        onChange={onChange}
        options={[...OPTIONS, { value: 'admin', label: 'Admin', disabled: true }]}
      />,
    )
    await user.click(trigger())

    /* aria-disabled, not the native attribute: the option keeps its place in
     * the arrow-key order and stays hoverable, so a tooltip can say why it is
     * unavailable. DropdownItem blocks the click instead. */
    const admin = screen.getByRole('menuitem', { name: 'Admin' })
    expect(admin).toHaveAttribute('aria-disabled', 'true')
    await user.click(admin)
    expect(onChange).not.toHaveBeenCalled()
  })

  it('the menu is exactly as wide as the field', async () => {
    /* Documented in the component and in the system contract, implemented in
     * neither: a choice list narrower or wider than the field it belongs to
     * reads as a different control. jsdom measures everything as zero, so the
     * assertion is that a width is set at all rather than left intrinsic. */
    const user = userEvent.setup()
    render(<Select label="Role" value="editor" onChange={() => undefined} options={OPTIONS} />)
    await user.click(trigger())

    expect(screen.getByRole('menu').style.width).not.toBe('')
  })

  it('marks the empty state so the placeholder can look like one', () => {
    const { rerender } = render(
      <Select label="Role" value={undefined} onChange={() => undefined} options={OPTIONS} placeholder="Pick a role" />,
    )
    expect(trigger()).toHaveAttribute('data-placeholder')

    rerender(<Select label="Role" value="editor" onChange={() => undefined} options={OPTIONS} placeholder="Pick a role" />)
    expect(trigger()).not.toHaveAttribute('data-placeholder')
  })

  it('carries size and surface through to the trigger', () => {
    const { rerender } = render(
      <Select label="Role" value="editor" onChange={() => undefined} options={OPTIONS} size="lg" />,
    )
    expect(trigger()).toHaveAttribute('data-size', 'lg')
    /* base is the default: a field on a white card keeps its border. */
    expect(trigger()).toHaveAttribute('data-surface', 'base')

    rerender(<Select label="Role" value="editor" onChange={() => undefined} options={OPTIONS} surface="muted" />)
    expect(trigger()).toHaveAttribute('data-surface', 'muted')
  })

  it('a value with no matching option falls back to the placeholder', () => {
    /* Stale ids happen: a role is removed while a form holds it. Showing the raw
     * value would leak an id into the UI. */
    render(
      <Select label="Role" value={'ghost' as 'editor'} onChange={() => undefined} options={OPTIONS} placeholder="Pick a role" />,
    )
    expect(trigger()).toHaveTextContent('Pick a role')
  })
})
