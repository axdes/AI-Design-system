import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SidePanel } from './SidePanel'

/* The column beside the main content. It is a landmark, and a landmark with no
 * name is one more "region" in a list of regions — so the title names it, and a
 * title that is not text needs somewhere plain to take the name from. */

describe('SidePanel', () => {
  it('is a region named by its title', () => {
    render(<SidePanel title="Details">content</SidePanel>)
    expect(screen.getByRole('region', { name: 'Details' })).toBeInTheDocument()
  })

  it('takes a plain name when the title is not text', () => {
    render(<SidePanel title={<span>Details <b>(3)</b></span>} label="Details">content</SidePanel>)
    expect(screen.getByRole('region', { name: 'Details' })).toBeInTheDocument()
  })

  it('offers a close control only when there is something to close to', async () => {
    const onClose = vi.fn()
    const { rerender } = render(<SidePanel title="Details">content</SidePanel>)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()

    rerender(<SidePanel title="Details" onClose={onClose}>content</SidePanel>)
    await userEvent.click(screen.getByRole('button'))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('carries its own heading, so the panel is findable in the outline', () => {
    render(<SidePanel title="Details">content</SidePanel>)
    expect(screen.getByRole('heading', { name: 'Details' })).toBeInTheDocument()
  })
})
