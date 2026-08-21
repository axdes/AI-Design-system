import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SearchInput } from './SearchInput'

/* Two shapes in one component: a collapsible icon that grows into a field, and
 * an always-open field. They differ in what the × does and in what is reachable
 * by Tab, which is exactly the kind of difference that rots without a test. */

const field = () => screen.getByRole('searchbox')

describe('SearchInput', () => {
  it('starts collapsed and keeps the field out of the tab order', () => {
    render(<SearchInput value="" onChange={() => undefined} />)

    expect(field()).toHaveAttribute('tabindex', '-1')
    expect(screen.getByRole('button', { name: /search/i })).toHaveAttribute('tabindex', '0')
  })

  it('expands on the toggle and moves focus into the field', async () => {
    const user = userEvent.setup()
    render(<SearchInput value="" onChange={() => undefined} />)

    await user.click(screen.getByRole('button', { name: /search/i }))

    await waitFor(() => expect(field()).toHaveFocus())
    expect(field()).toHaveAttribute('tabindex', '0')
  })

  it('collapses on blur only while empty', async () => {
    const user = userEvent.setup()
    const { rerender } = render(<SearchInput value="" onChange={() => undefined} />)

    await user.click(screen.getByRole('button', { name: /search/i }))
    await waitFor(() => expect(field()).toHaveFocus())
    await user.tab()
    expect(field()).toHaveAttribute('tabindex', '-1')

    /* With a value it must stay open, or the text the user typed disappears
     * behind an icon the moment they click away. */
    rerender(<SearchInput value="report" onChange={() => undefined} />)
    field().focus()
    await user.tab()
    expect(field()).toHaveAttribute('tabindex', '0')
  })

  it('clears through onClear rather than owning the value', async () => {
    const onClear = vi.fn()
    const user = userEvent.setup()
    render(<SearchInput value="report" onChange={() => undefined} onClear={onClear} />)

    await user.click(screen.getByRole('button', { name: /clear/i }))
    expect(onClear).toHaveBeenCalledTimes(1)
  })

  it('expanded: the field is always reachable and the × appears only with a value', async () => {
    const { rerender } = render(<SearchInput expanded value="" onChange={() => undefined} />)

    expect(field()).toHaveAttribute('tabindex', '0')
    expect(screen.queryByRole('button', { name: /clear/i })).toBeNull()

    rerender(<SearchInput expanded value="q" onChange={() => undefined} />)
    expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument()
  })

  it('expanded: clearing does not collapse the field', async () => {
    const onClear = vi.fn()
    const user = userEvent.setup()
    render(<SearchInput expanded value="q" onChange={() => undefined} onClear={onClear} />)

    await user.click(screen.getByRole('button', { name: /clear/i }))

    expect(onClear).toHaveBeenCalled()
    expect(field()).toHaveAttribute('tabindex', '0')
  })

  it('passes the caller onBlur through', async () => {
    const onBlur = vi.fn()
    const user = userEvent.setup()
    render(<SearchInput expanded value="" onChange={() => undefined} onBlur={onBlur} />)

    field().focus()
    await user.tab()
    expect(onBlur).toHaveBeenCalled()
  })
})
