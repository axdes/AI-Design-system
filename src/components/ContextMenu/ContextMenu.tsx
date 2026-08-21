import './ContextMenu.css'
import { useEffect, useRef, useState, type KeyboardEvent, type MouseEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../../lib/cn'
import { Icon, type IconName } from '../Icon'

export type ContextMenuItem = {
  id: string
  label: string
  icon?: IconName
  tone?: 'neutral' | 'destructive'
  disabled?: boolean
  onSelect: () => void
}

type Props = {
  /** The target that opens the menu on right-click. */
  children: ReactNode
  items: ContextMenuItem[]
  className?: string
}

const EDGE = 8

/* A right-click menu positioned at the pointer. Opens on contextmenu over the
 * wrapped target, clamps to the viewport, closes on outside-click, Escape or
 * selection. Arrow keys move between items. Distinct from <Dropdown> (a
 * left-click trigger button). */
export function ContextMenu({ children, items, className }: Props) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)

  const open = (e: MouseEvent) => {
    e.preventDefault()
    const mw = 220
    const mh = items.length * 40 + 16
    setPos({
      x: Math.min(e.clientX, window.innerWidth - mw - EDGE),
      y: Math.min(e.clientY, window.innerHeight - mh - EDGE),
    })
    setActive(0)
  }
  const close = () => setPos(null)

  useEffect(() => {
    if (!pos) return
    const onDown = (e: globalThis.MouseEvent) => { if (!menuRef.current?.contains(e.target as Node)) close() }
    const onKey = (e: globalThis.KeyboardEvent) => { if (e.key === 'Escape') close() }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    /* Focus the menu so arrow keys work immediately. */
    menuRef.current?.focus()
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [pos])

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => Math.min(i + 1, items.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)) }
    else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      const item = items[active]
      if (item && !item.disabled) { item.onSelect(); close() }
    }
  }

  const select = (item: ContextMenuItem) => { if (!item.disabled) { item.onSelect(); close() } }

  return (
    <>
      <div className={cn('context-target', className)} onContextMenu={open}>
        {children}
      </div>
      {pos && createPortal(
        <div
          ref={menuRef}
          className="context-menu"
          role="menu"
          aria-label="Context menu"
          tabIndex={-1}
          style={{ insetInlineStart: pos.x, insetBlockStart: pos.y }}
          onKeyDown={onKeyDown}
        >
          {items.map((item, i) => (
            <button
              key={item.id}
              type="button"
              role="menuitem"
              className="context-item"
              data-tone={item.tone}
              data-active={i === active || undefined}
              disabled={item.disabled}
              onMouseEnter={() => setActive(i)}
              onClick={() => select(item)}
            >
              {item.icon && <Icon name={item.icon} size="sm" className="context-item-icon" />}
              {item.label}
            </button>
          ))}
        </div>,
        document.body,
      )}
    </>
  )
}
