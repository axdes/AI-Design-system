import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { CodeInput } from './CodeInput'

/* Paste and backspace are the whole reason this is a component. Typing into six
 * boxes is easy; pasting a code into them, and getting out of an empty one, is
 * what every hand-rolled version gets wrong. */

function Harness({ length = 6 }: { length?: number }) {
  const [code, setCode] = useState('')
  return <CodeInput length={length} value={code} onChange={setCode} label="Code" />
}

const boxes = () => screen.getAllByRole('textbox')

describe('CodeInput', () => {
  it('renders one labelled box per character', () => {
    render(<Harness length={4} />)

    expect(boxes()).toHaveLength(4)
    expect(screen.getByRole('group', { name: 'Code' })).toBeInTheDocument()
    expect(screen.getByLabelText('Code, 1/4')).toBeInTheDocument()
    expect(screen.getByLabelText('Code, 4/4')).toBeInTheDocument()
  })

  it('advances as you type', async () => {
    const user = userEvent.setup()
    render(<Harness length={4} />)

    await user.click(boxes()[0])
    await user.keyboard('12')

    expect(boxes()[0]).toHaveValue('1')
    expect(boxes()[1]).toHaveValue('2')
    expect(boxes()[2]).toHaveFocus()
  })

  it('fills the whole code from one paste', async () => {
    const user = userEvent.setup()
    render(<Harness length={6} />)

    await user.click(boxes()[0])
    await user.paste('123456')

    expect(boxes().map((b) => (b as HTMLInputElement).value)).toEqual(['1', '2', '3', '4', '5', '6'])
  })

  it('drops the separators a pasted code arrives with', async () => {
    const user = userEvent.setup()
    render(<Harness length={6} />)

    await user.click(boxes()[0])
    await user.paste('123 456')

    expect(boxes().map((b) => (b as HTMLInputElement).value)).toEqual(['1', '2', '3', '4', '5', '6'])
  })

  it('walks back out of an empty box on backspace', async () => {
    const user = userEvent.setup()
    render(<Harness length={4} />)

    await user.click(boxes()[0])
    await user.keyboard('12')
    await user.keyboard('{Backspace}')

    expect(boxes()[1]).toHaveFocus()
    expect(boxes()[1]).toHaveValue('')
  })

  it('moves with the arrow keys', async () => {
    const user = userEvent.setup()
    render(<Harness length={4} />)

    await user.click(boxes()[2])
    await user.keyboard('{ArrowLeft}')
    expect(boxes()[1]).toHaveFocus()

    await user.keyboard('{ArrowRight}{ArrowRight}')
    expect(boxes()[3]).toHaveFocus()
  })

  it('offers the one-time code to the first box only', () => {
    render(<Harness length={4} />)
    expect(boxes()[0]).toHaveAttribute('autocomplete', 'one-time-code')
    expect(boxes()[1]).toHaveAttribute('autocomplete', 'off')
  })

  it('reports the code as one string', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<CodeInput length={4} value="" onChange={onChange} label="Code" />)

    await user.click(boxes()[0])
    await user.paste('4821')

    expect(onChange).toHaveBeenLastCalledWith('4821')
  })
})
