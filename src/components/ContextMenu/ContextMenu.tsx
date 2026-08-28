import './ContextMenu.css'
import { useEffect, useRef, useState, type KeyboardEvent, type MouseEvent, type ReactNode, useId } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../../lib/cn'
import { useDismiss } from '../../lib/useDismiss'
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
  const menuId = useId()

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

  /* Outside press and Escape are `useDismiss`'s, shared with every other layer.
     There is nothing to measure here — the position came from the pointer event
     that opened the menu — which is why this uses the dismissal alone and not
     the whole anchored-layer mechanism. */
  useDismiss({ open: pos !== null, onClose: close, stays: [menuRef] })

  /* Focus the menu so arrow keys work immediately. */
  useEffect(() => {
    if (pos) menuRef.current?.focus()
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
          data-raised="popover"
          role="menu"
          aria-label="Context menu"
          tabIndex={-1}
          /* Focus stays on the menu and the ARROW KEYS move `active`, so the row
           * the eye follows has to be named here or a screen reader announces
           * nothing as the selection moves. The mark on that row (see the
           * ::before in ContextMenu.css) is its visible half. */
          aria-activedescendant={items[active] ? `${menuId}-${items[active].id}` : undefined}
          style={{ insetInlineStart: pos.x, insetBlockStart: pos.y }}
          onKeyDown={onKeyDown}
        >
          {items.map((item, i) => (
            <button
              key={item.id}
              id={`${menuId}-${item.id}`}
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
