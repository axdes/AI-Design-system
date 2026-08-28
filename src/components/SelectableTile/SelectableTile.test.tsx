import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SelectableTile } from './SelectableTile'

/* The tile the user sees is a card; the control the browser and the screen
 * reader see is a real radio or checkbox. That split is the whole design: a
 * clickable card would look identical and lose the choice on the next click,
 * which is why Carbon separates the two and why these tests are about the
 * INPUT rather than about the surface. */

describe('SelectableTile', () => {
  it('is a radio when one option can be chosen, named by its title', () => {
    render(<SelectableTile name="region" title="Europe" selected onSelect={() => {}} />)
    expect(screen.getByRole('radio', { name: /Europe/ })).toBeChecked()
  })

  it('is a checkbox when several can be', () => {
    render(<SelectableTile multiple title="Logs" selected={false} onSelect={() => {}} />)
    expect(screen.getByRole('checkbox', { name: /Logs/ })).not.toBeChecked()
  })

  it('picks by clicking anywhere on the tile, description included', async () => {
    const onSelect = vi.fn()
    const user = userEvent.setup()
    render(
      <SelectableTile
        name="region"
        title="Europe"
        description="Frankfurt, Warsaw"
        selected={false}
        onSelect={onSelect}
      />,
    )

    await user.click(screen.getByText('Frankfurt, Warsaw'))
    expect(onSelect).toHaveBeenCalledWith(true)
  })

  it('says what the state BECOMES, so multi-select can unpick', async () => {
    const onSelect = vi.fn()
    const user = userEvent.setup()
    render(<SelectableTile multiple title="Logs" selected onSelect={onSelect} />)

    await user.click(screen.getByRole('checkbox'))
    expect(onSelect).toHaveBeenCalledWith(false)
  })

  it('keeps the arrow keys of a real radio group', async () => {
    const onSelect = vi.fn()
    const user = userEvent.setup()
    render(
      <>
        <SelectableTile name="region" title="Europe" selected onSelect={() => {}} />
        <SelectableTile name="region" title="North America" selected={false} onSelect={onSelect} />
      </>,
    )

    screen.getByRole('radio', { name: /Europe/ }).focus()
    await user.keyboard('{ArrowDown}')
    expect(onSelect).toHaveBeenCalledWith(true)
  })

  it('honours disabled', async () => {
    const onSelect = vi.fn()
    const user = userEvent.setup()
    render(<SelectableTile name="region" title="Europe" disabled selected={false} onSelect={onSelect} />)

    await user.click(screen.getByText('Europe'))
    expect(screen.getByRole('radio')).toBeDisabled()
    expect(onSelect).not.toHaveBeenCalled()
  })
})
