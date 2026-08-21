import './CommandPalette.css'
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../../lib/cn'
import { Icon, type IconName } from '../Icon'

export type Command = {
  id: string
  label: string
  icon?: IconName
  /** Extra searchable text (aliases, a section) not shown as the label. */
  keywords?: string
  /** Right-aligned hint, e.g. a shortcut. */
  hint?: string
  onRun: () => void
}

type Props = {
  open: boolean
  onClose: () => void
  commands: Command[]
  placeholder?: string
  emptyLabel?: string
  className?: string
}

/* The Cmd+K command palette: a centered search over an action list. Type to
 * filter, Arrow keys to move, Enter to run, Escape to close. The consumer owns
 * `open` (wire it to a global key handler) and what each command does. Portaled,
 * focus goes to the input on open. */
export function CommandPalette({ open, onClose, commands, placeholder = 'Type a command or search…', emptyLabel = 'No results', className }: Props) {
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listId = useId()

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return commands
    return commands.filter((c) => (c.label + ' ' + (c.keywords ?? '')).toLowerCase().includes(q))
  }, [commands, query])

  useEffect(() => {
    if (open) {
      setQuery('')
      setActive(0)
      inputRef.current?.focus()
    }
  }, [open])

  useEffect(() => { setActive(0) }, [query])

  if (!open) return null

  const run = (cmd: Command) => { cmd.onRun(); onClose() }

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => Math.min(i + 1, results.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)) }
    else if (e.key === 'Enter') { if (results[active]) { e.preventDefault(); run(results[active]) } }
    else if (e.key === 'Escape') { e.preventDefault(); onClose() }
  }

  return createPortal(
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions -- backdrop click-to-dismiss; the dialog owns the role
    <div className="command-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className={cn('command', className)} role="dialog" aria-modal="true" aria-label="Command palette" onKeyDown={onKeyDown}>
        <div className="command-search">
          <Icon name="search" className="command-search-icon" />
          <input
            ref={inputRef}
            className="command-input"
            role="combobox"
            aria-expanded="true"
            aria-controls={listId}
            aria-autocomplete="list"
            aria-label="Search commands"
            placeholder={placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <ul className="command-list" id={listId} role="listbox" aria-label="Commands">
          {results.length === 0 && <li className="command-empty" role="presentation">{emptyLabel}</li>}
          {results.map((cmd, i) => (
            <li
              key={cmd.id}
              role="option"
              aria-selected={i === active}
              className="command-item"
              data-active={i === active || undefined}
              onMouseDown={(e) => { e.preventDefault(); run(cmd) }}
              onMouseEnter={() => setActive(i)}
            >
              {cmd.icon && <Icon name={cmd.icon} size="sm" className="command-item-icon" />}
              <span className="command-item-label">{cmd.label}</span>
              {cmd.hint && <span className="command-item-hint">{cmd.hint}</span>}
            </li>
          ))}
        </ul>
      </div>
    </div>,
    document.body,
  )
}
