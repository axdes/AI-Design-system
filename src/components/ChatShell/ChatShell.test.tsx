import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ChatShell } from './ChatShell'
import { SidebarProvider } from '../../lib/SidebarProvider'

/* The one top-level destination in this system with no page header, which is
 * why it carries the drawer trigger itself. That single exception is the whole
 * reason the trigger is not fixed over every other screen. */

describe('ChatShell', () => {
  it('carries the drawer trigger itself, since it has no page header to hold it', () => {
    render(
      <SidebarProvider>
        <ChatShell>conversation</ChatShell>
      </SidebarProvider>,
    )
    expect(screen.getByRole('button', { name: /menu/i })).toBeInTheDocument()
  })

  it('holds the conversation it was given', () => {
    render(<SidebarProvider><ChatShell>conversation</ChatShell></SidebarProvider>)
    expect(screen.getByText('conversation')).toBeInTheDocument()
  })

  it('says what shape it is in, so the layout does not have to guess', () => {
    const { container, rerender } = render(
      <SidebarProvider><ChatShell>conversation</ChatShell></SidebarProvider>,
    )
    const shell = container.querySelector('.chat-shell')
    expect(shell).not.toHaveAttribute('data-chat-collapsed')

    rerender(<SidebarProvider><ChatShell collapsed panel>conversation</ChatShell></SidebarProvider>)
    expect(container.querySelector('.chat-shell')).toHaveAttribute('data-chat-collapsed')
    expect(container.querySelector('.chat-shell-body')).toHaveAttribute('data-with-panel')
  })
})
