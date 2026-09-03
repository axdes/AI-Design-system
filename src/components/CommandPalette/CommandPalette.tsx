import './CommandPalette.css'
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../../lib/cn'
import { Highlight } from '../Highlight'
import { Icon, type IconName } from '../Icon'
import { Kbd } from '../Kbd'
import { useListNavigation } from '../../lib/useListNavigation'

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
  /** The caller owns it, because the shortcut that opens a palette is the app's to bind. */
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
 * focus goes to the input on open. 
   *
   * Copy: the placeholder names the verbs this palette knows — "Search or jump
   * to…". Command names start with the verb, so a list of them reads as a
   * list of things you can do.
   */
export function CommandPalette({ open, onClose, commands, placeholder = 'Type a command or search…', emptyLabel = 'No results', className }: Props) {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const listId = useId()

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return commands
    return commands.filter((c) => (c.label + ' ' + (c.keywords ?? '')).toLowerCase().includes(q))
  }, [commands, query])

  const run = (cmd: Command) => { cmd.onRun(); onClose() }
  /* Above the effects and above the early return, because a hook may be neither
     conditional nor used before it exists — which is what four seconds of red
     tests said when this sat where it reads most naturally (2026-08-31). */
  const { active, setActive, handleKey } = useListNavigation({
    count: results.length,
    onEnter: (i) => { const cmd = results[i]; if (cmd) run(cmd) },
  })

  useEffect(() => {
    if (open) {
      setQuery('')
      setActive(0)
      inputRef.current?.focus()
    }
  }, [open, setActive])

  useEffect(() => { setActive(0) }, [query, setActive])

  if (!open) return null

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    /* Arrows, Home and End are `useListNavigation`'s, and Enter with them: this
       list had neither Home nor End, and a palette is exactly the list long
       enough to want them. Escape is the palette's own, because it closes the
       dialog rather than moving inside it. */
    if (handleKey(e)) return
    if (e.key === 'Escape') { e.preventDefault(); onClose() }
  }

  return createPortal(
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions -- backdrop click-to-dismiss; the dialog owns the role
    <div className="command-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className={cn('command', className)} data-raised="popover" role="dialog" aria-modal="true" aria-label="Command palette" onKeyDown={onKeyDown}>
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
              {/* WHY THIS ROW IS A HIT, said on the row. A palette filters as you
                  type and then showed the label plain, so a list of nine results
                  did not say which word each one matched on — and <Highlight>,
                  which marks exactly that with a real <mark>, had no consumer
                  anywhere in the system (2026-08-31). The same pass gave the
                  hint the key cap <Kbd> was written for. */}
              <Highlight text={cmd.label} query={query} className="command-item-label" />
              {cmd.hint && <span className="command-item-hint"><Kbd>{cmd.hint}</Kbd></span>}
            </li>
          ))}
        </ul>
      </div>
    </div>,
    document.body,
  )
}
