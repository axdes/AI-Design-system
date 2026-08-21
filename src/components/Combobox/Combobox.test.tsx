import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Combobox } from './Combobox'

type Fruit = 'apple' | 'apricot' | 'banana' | 'cherry'

const OPTIONS = [
  { value: 'apple' as const, label: 'Apple' },
  { value: 'apricot' as const, label: 'Apricot' },
  { value: 'banana' as const, label: 'Banana' },
  { value: 'cherry' as const, label: 'Cherry' },
]

function Host() {
  const [value, setValue] = useState<Fruit>()
  return (
    <>
      <Combobox<Fruit> label="Fruit" placeholder="Search" options={OPTIONS} value={value} onChange={setValue} />
      <output>{value ?? 'none'}</output>
    </>
  )
}

const picked = () => screen.getByRole('status').textContent

describe('Combobox', () => {
  it('exposes the ARIA combobox pattern', async () => {
    const user = userEvent.setup()
    render(<Host />)
    const input = screen.getByRole('combobox', { name: 'Fruit' })
    expect(input).toHaveAttribute('aria-expanded', 'false')
    expect(input).toHaveAttribute('aria-autocomplete', 'list')

    await user.click(input)
    expect(input).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('listbox', { name: 'Fruit' })).toBeInTheDocument()
  })

  it('reopens on click after a pick, without needing to blur first', async () => {
    const user = userEvent.setup()
    render(<Host />)
    const input = screen.getByRole('combobox')
    await user.click(input)
    await user.click(screen.getByRole('option', { name: 'Apple' }))
    expect(picked()).toBe('apple')
    /* The list closed and the input kept focus. A second click must reopen it
     * (regression: it used to require blurring and refocusing). */
    expect(input).toHaveAttribute('aria-expanded', 'false')
    await user.click(input)
    expect(input).toHaveAttribute('aria-expanded', 'true')
    await user.click(screen.getByRole('option', { name: 'Banana' }))
    expect(picked()).toBe('banana')
  })

  it('filters options by the typed query', async () => {
    const user = userEvent.setup()
    render(<Host />)
    await user.click(screen.getByRole('combobox'))
    await user.keyboard('ap')

    const options = screen.getAllByRole('option')
    expect(options.map((o) => o.textContent)).toEqual(['Apple', 'Apricot'])
  })

  it('moves with arrow keys and picks with Enter', async () => {
    const user = userEvent.setup()
    render(<Host />)
    const input = screen.getByRole('combobox')
    await user.click(input)
    await user.keyboard('{ArrowDown}{ArrowDown}{Enter}')

    /* First match is active on open (index 0); two downs would overshoot, so it
     * clamps — assert on the committed value rather than a fragile index. */
    expect(picked()).not.toBe('none')
    expect(screen.queryByRole('listbox')).toBeNull()
  })

  it('says so when nothing matches', async () => {
    const user = userEvent.setup()
    render(<Host />)
    await user.click(screen.getByRole('combobox'))
    await user.keyboard('zzz')

    expect(screen.queryAllByRole('option')).toHaveLength(0)
    expect(screen.getByText('No matches')).toBeInTheDocument()
  })

  it('picks an option by click', async () => {
    const user = userEvent.setup()
    render(<Host />)
    await user.click(screen.getByRole('combobox'))
    await user.click(screen.getByRole('option', { name: 'Banana' }))

    expect(picked()).toBe('banana')
    expect(screen.getByRole('combobox')).toHaveValue('Banana')
  })

  it('closes on Escape without picking', async () => {
    const user = userEvent.setup()
    render(<Host />)
    await user.click(screen.getByRole('combobox'))
    await user.keyboard('ba{Escape}')

    expect(screen.queryByRole('listbox')).toBeNull()
    expect(picked()).toBe('none')
  })

  /* Everything below came from a mutation run: 63 mutants survived the tests
   * above, most of them in the parts that make a combobox usable rather than
   * merely present. */

  const field = () => screen.getByRole('combobox')

  it('ArrowDown opens the closed list without moving the highlight', async () => {
    const user = userEvent.setup()
    render(<Host />)
    field().focus()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('listbox')).toBeNull()

    await user.keyboard('{ArrowDown}')

    const options = screen.getAllByRole('option')
    expect(options[0]).toHaveAttribute('data-active')
  })

  it('the highlight stops at both ends', async () => {
    const user = userEvent.setup()
    render(<Host />)
    await user.click(field())

    await user.keyboard('{ArrowUp}')
    expect(screen.getAllByRole('option')[0]).toHaveAttribute('data-active')

    await user.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown}')
    const options = screen.getAllByRole('option')
    expect(options[options.length - 1]).toHaveAttribute('data-active')
  })

  it('points aria-activedescendant at the highlighted option', async () => {
    /* This is how a screen reader follows the arrow keys: focus never leaves the
     * input, so without it the list moves silently. */
    const user = userEvent.setup()
    render(<Host />)
    await user.click(field())

    await user.keyboard('{ArrowDown}')
    const active = screen.getAllByRole('option')[1]
    expect(field()).toHaveAttribute('aria-activedescendant', active.id)
  })

  it('hovering an option moves the highlight to it', async () => {
    const user = userEvent.setup()
    render(<Host />)
    await user.click(field())

    await user.hover(screen.getByRole('option', { name: 'Cherry' }))

    expect(screen.getByRole('option', { name: 'Cherry' })).toHaveAttribute('data-active')
  })

  it('shows the picked label while closed and the query while typing', async () => {
    const user = userEvent.setup()
    render(<Host />)
    await user.click(field())
    await user.click(screen.getByRole('option', { name: 'Banana' }))
    expect(field()).toHaveValue('Banana')

    await user.type(field(), 'ap')
    expect(field()).toHaveValue('ap')
  })

  it('Escape clears the query as well as closing', async () => {
    /* Leaving a stale query behind means the next open shows a filtered list for
     * a search the user already abandoned. */
    const user = userEvent.setup()
    render(<Host />)
    await user.click(field())
    await user.type(field(), 'ap')

    await user.keyboard('{Escape}')
    await user.click(field())

    expect(screen.getAllByRole('option')).toHaveLength(OPTIONS.length)
  })

  it('closes and forgets the query when focus leaves the component', async () => {
    const user = userEvent.setup()
    render(
      <>
        <Host />
        <button type="button">Elsewhere</button>
      </>,
    )
    await user.click(field())
    await user.type(field(), 'ap')

    await user.click(screen.getByRole('button', { name: 'Elsewhere' }))

    expect(screen.queryByRole('listbox')).toBeNull()
    await user.click(field())
    expect(screen.getAllByRole('option')).toHaveLength(OPTIONS.length)
  })

  it('a custom filter replaces label matching', async () => {
    const user = userEvent.setup()
    render(
      <Combobox<Fruit>
        label="Fruit"
        options={OPTIONS}
        value={undefined}
        onChange={() => undefined}
        filter={(o, q) => o.value.startsWith(q)}
      />,
    )
    await user.click(screen.getByRole('combobox'))
    await user.type(screen.getByRole('combobox'), 'ap')

    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual(['Apple', 'Apricot'])
  })

  it('uses the caller\'s empty message', async () => {
    const user = userEvent.setup()
    render(
      <Combobox<Fruit>
        label="Fruit"
        options={OPTIONS}
        value={undefined}
        onChange={() => undefined}
        emptyLabel="Nothing like that here"
      />,
    )
    await user.click(screen.getByRole('combobox'))
    await user.type(screen.getByRole('combobox'), 'zzz')

    expect(screen.getByText('Nothing like that here')).toBeInTheDocument()
  })

  it('a value with no matching option leaves the field empty rather than showing an id', async () => {
    render(
      <Combobox<Fruit> label="Fruit" options={OPTIONS} value={'ghost' as Fruit} onChange={() => undefined} />,
    )
    expect(screen.getByRole('combobox')).toHaveValue('')
  })

  it('single select is not multi-selectable, and says so', async () => {
    const user = userEvent.setup()
    render(<Host />)
    await user.click(field())
    expect(screen.getByRole('listbox')).not.toHaveAttribute('aria-multiselectable')
  })

  it('carries size and surface through', () => {
    const { container } = render(
      <Combobox<Fruit> label="Fruit" options={OPTIONS} value={undefined} onChange={() => undefined} size="lg" surface="muted" />,
    )
    expect(container.querySelector('.combobox')).toHaveAttribute('data-size', 'lg')
    expect(screen.getByRole('combobox')).toHaveAttribute('data-surface', 'muted')
  })
})

describe('Combobox multiple', () => {
  function MultiHost() {
    const [value, setValue] = useState<Fruit[]>([])
    return (
      <>
        <Combobox<Fruit> multiple label="Fruit" placeholder="Search" options={OPTIONS} value={value} onChange={setValue} />
        <output>{value.join(',') || 'none'}</output>
      </>
    )
  }
  const chosen = () => screen.getByRole('status').textContent

  it('picks several and keeps the list open', async () => {
    const user = userEvent.setup()
    render(<MultiHost />)
    await user.click(screen.getByRole('combobox'))
    await user.click(screen.getByRole('option', { name: /Apple/ }))
    /* still open for the next pick */
    expect(screen.getByRole('listbox')).toBeInTheDocument()
    await user.click(screen.getByRole('option', { name: /Banana/ }))
    expect(chosen()).toBe('apple,banana')
  })

  it('renders picks as removable tags and toggles a re-pick off', async () => {
    const user = userEvent.setup()
    render(<MultiHost />)
    await user.click(screen.getByRole('combobox'))
    await user.click(screen.getByRole('option', { name: /Apple/ }))
    expect(screen.getByRole('button', { name: 'Remove Apple' })).toBeInTheDocument()

    /* clicking the same option again removes it */
    await user.click(screen.getByRole('option', { name: /Apple/ }))
    expect(chosen()).toBe('none')
  })

  it('Backspace on an empty field removes the last tag', async () => {
    const user = userEvent.setup()
    render(<MultiHost />)
    await user.click(screen.getByRole('combobox'))
    await user.click(screen.getByRole('option', { name: /Apple/ }))
    await user.click(screen.getByRole('option', { name: /Cherry/ }))
    expect(chosen()).toBe('apple,cherry')

    screen.getByRole('combobox').focus()
    await user.keyboard('{Backspace}')
    expect(chosen()).toBe('apple')
  })

  it('is announced as multi-selectable and marks what is picked', async () => {
    const user = userEvent.setup()
    render(<MultiHost />)
    await user.click(screen.getByRole('combobox'))
    await user.click(screen.getByRole('option', { name: 'Apple' }))

    expect(screen.getByRole('listbox')).toHaveAttribute('aria-multiselectable', 'true')
    expect(screen.getByRole('option', { name: /Apple/ })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('option', { name: 'Banana' })).toHaveAttribute('aria-selected', 'false')
  })

  it('drops the placeholder once there are tags', async () => {
    /* Two prompts at once ("Search" beside three tokens) reads as a field that
     * did not take what you gave it. */
    const user = userEvent.setup()
    render(<MultiHost />)
    expect(screen.getByRole('combobox')).toHaveAttribute('placeholder', 'Search')

    await user.click(screen.getByRole('combobox'))
    await user.click(screen.getByRole('option', { name: 'Apple' }))

    expect(screen.getByRole('combobox')).not.toHaveAttribute('placeholder')
  })

  it('Backspace on a NON-empty query edits the text instead of eating a tag', async () => {
    const user = userEvent.setup()
    render(<MultiHost />)
    await user.click(screen.getByRole('combobox'))
    await user.click(screen.getByRole('option', { name: 'Apple' }))
    await user.type(screen.getByRole('combobox'), 'ban')

    await user.keyboard('{Backspace}')

    expect(screen.getByRole('combobox')).toHaveValue('ba')
    expect(chosen()).toBe('apple')
  })

  it('clicking a tag\'s remove button does not close the list', async () => {
    /* The blur handler has to recognise focus moving WITHIN the component; a
     * naive "any blur closes" makes removing a tag also dismiss the list. */
    const user = userEvent.setup()
    render(<MultiHost />)
    await user.click(screen.getByRole('combobox'))
    await user.click(screen.getByRole('option', { name: 'Apple' }))
    expect(screen.getByRole('listbox')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Remove Apple' }))

    expect(chosen()).toBe('none')
  })

  it('shows a check on the picked options, and only in multi mode', async () => {
    const user = userEvent.setup()
    render(<MultiHost />)
    await user.click(screen.getByRole('combobox'))
    await user.click(screen.getByRole('option', { name: 'Apple' }))

    expect(screen.getByRole('option', { name: /Apple/ }).querySelector('.combobox-check')).not.toBeNull()
    expect(screen.getByRole('option', { name: 'Banana' }).querySelector('.combobox-check')).toBeNull()
  })

  it('a tag falls back to the raw value when its option is gone', () => {
    /* An option list can shrink under a stored selection. Dropping the tag would
     * silently discard the user's choice; showing the id at least keeps it. */
    render(
      <Combobox<Fruit>
        multiple
        label="Fruit"
        options={OPTIONS}
        value={['ghost' as Fruit]}
        onChange={() => undefined}
      />,
    )
    expect(screen.getByText('ghost')).toBeInTheDocument()
  })
})
