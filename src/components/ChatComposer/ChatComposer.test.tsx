import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ChatComposer } from './ChatComposer'

describe('ChatComposer', () => {
  it('sends the trimmed text on Enter and clears itself', async () => {
    const user = userEvent.setup()
    const onSend = vi.fn()
    render(<ChatComposer onSend={onSend} placeholder="Ask anything" />)
    const field = screen.getByLabelText('Ask anything')

    await user.type(field, '  How do I request leave?  {Enter}')

    expect(onSend).toHaveBeenCalledWith('How do I request leave?')
    expect(field).toHaveValue('')
  })

  it('treats Shift+Enter as a newline, not a send', async () => {
    const user = userEvent.setup()
    const onSend = vi.fn()
    render(<ChatComposer onSend={onSend} placeholder="Ask anything" />)
    const field = screen.getByLabelText('Ask anything')

    await user.type(field, 'first{Shift>}{Enter}{/Shift}second')

    expect(onSend).not.toHaveBeenCalled()
    expect(field).toHaveValue('first\nsecond')
  })

  it('never sends an empty message', async () => {
    const user = userEvent.setup()
    const onSend = vi.fn()
    render(<ChatComposer onSend={onSend} placeholder="Ask anything" />)

    await user.type(screen.getByLabelText('Ask anything'), '   {Enter}')

    expect(onSend).not.toHaveBeenCalled()
  })

  it('stays controlled when the consumer owns the value', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<ChatComposer value="fixed" onChange={onChange} placeholder="Ask anything" />)
    const field = screen.getByLabelText('Ask anything')

    await user.type(field, 'x')

    expect(onChange).toHaveBeenCalledWith('fixedx')
    expect(field).toHaveValue('fixed')
  })

  it('swaps send for stop while the assistant is streaming', async () => {
    const user = userEvent.setup()
    const onStop = vi.fn()
    render(<ChatComposer value="hi" streaming onStop={onStop} placeholder="Ask anything" />)

    const stop = screen.getByRole('button', { name: /stop/i })
    await user.click(stop)

    expect(onStop).toHaveBeenCalledOnce()
    expect(screen.queryByRole('button', { name: /send/i })).toBeNull()
  })
})
