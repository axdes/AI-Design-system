import './ChatShell.css'
import { type ReactNode } from 'react'
import { NavDrawerButton } from '../NavDrawerButton'

type Props = {
  /** Icon-rail state of the chat-history column (drives the grid + ChatHistory). */
  collapsed?: boolean
  /** Show the optional right-hand panel column (e.g. a form). */
  panel?: boolean
  /** Drop the history column entirely (e.g. when there are no chats). */
  noSidebar?: boolean
  children: ReactNode
}

/* Shared chrome for chat screens: full-height column → padded region → one
 * rounded card surface that lays its children out in a grid
 * [history | thread | optional panel]. Lives inside <AppShell>. */
export function ChatShell({ collapsed, panel, noSidebar, children }: Props) {
  return (
    <div className="chat-shell" data-chat-collapsed={collapsed || undefined}>
      {/* The chat is the one top-level destination in this system with no
          <PageHeader>, so it carries the leading slot itself. That single
          exception is why the trigger used to float over every OTHER screen:
          one screen's missing bar was solved by putting a fixed button on all of
          them, where it collided with the header. It renders nothing above the
          drawer breakpoint. */}
      <div className="chat-shell-bar">
        <NavDrawerButton />
      </div>
      <div className="chat-shell-content">
        <div className="chat-shell-body" data-with-panel={panel || undefined} data-no-sidebar={noSidebar || undefined}>
          {children}
        </div>
      </div>
    </div>
  )
}
