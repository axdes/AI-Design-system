import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CopyButton } from './CopyButton'

/* The failure path is the reason this component exists: five apps wrote the
 * happy path and none of them wrote what happens on an insecure origin, where
 * navigator.clipboard is not there at all.
 *
 * The stub goes in AFTER userEvent.setup(), which installs a clipboard of its
 * own: stubbing first means testing user-event's stub instead of ours. */
function stubClipboard(value: unknown) {
  Object.defineProperty(navigator, 'clipboard', { value, configurable: true })
}

describe('CopyButton', () => {
  it('writes the value and confirms', async () => {
    const user = userEvent.setup()
    const writeText = vi.fn(() => Promise.resolve())
    stubClipboard({ writeText })
    render(<CopyButton value="sk-live-1" label="Copy key" />)

    await user.click(screen.getByRole('button', { name: 'Copy key' }))

    expect(writeText).toHaveBeenCalledWith('sk-live-1')
    expect(await screen.findByRole('button', { name: 'Copied' })).toBeInTheDocument()
  })

  it('says nothing when the write is rejected', async () => {
    const user = userEvent.setup()
    stubClipboard({ writeText: () => Promise.reject(new Error('denied')) })
    render(<CopyButton value="sk-live-1" label="Copy key" />)

    await user.click(screen.getByRole('button', { name: 'Copy key' }))

    expect(screen.getByRole('button', { name: 'Copy key' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Copied' })).toBeNull()
  })

  it('does not fall over where there is no clipboard at all', async () => {
    const user = userEvent.setup()
    stubClipboard(undefined)
    render(<CopyButton value="sk-live-1" label="Copy key" />)

    await user.click(screen.getByRole('button', { name: 'Copy key' }))
    expect(screen.getByRole('button', { name: 'Copy key' })).toBeInTheDocument()
  })

  it('is a labelled control when icon-only', async () => {
    const user = userEvent.setup()
    stubClipboard({ writeText: () => Promise.resolve() })
    render(<CopyButton value="https://example.com/x" />)

    await user.click(screen.getByRole('button', { name: 'Copy' }))
    expect(await screen.findByRole('button', { name: 'Copied' })).toBeInTheDocument()
  })

  it('announces the copy in a live region', async () => {
    const user = userEvent.setup()
    stubClipboard({ writeText: () => Promise.resolve() })
    render(<CopyButton value="x" label="Copy key" />)

    expect(screen.getByRole('status')).toHaveTextContent('')
    await user.click(screen.getByRole('button', { name: 'Copy key' }))
    expect(await screen.findByRole('status')).toHaveTextContent('Copied')
  })
})
