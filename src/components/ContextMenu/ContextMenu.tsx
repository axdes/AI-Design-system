import './ContextMenu.css'
import { useEffect, useRef, useState, type KeyboardEvent, type MouseEvent, type ReactNode, useId } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../../lib/cn'
import { useDismiss } from '../../lib/useDismiss'
import { useListNavigation } from '../../lib/useListNavigation'
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

  const menuId = useId()
  /* ONE ANSWER TO "RUN THE ACTIVE ITEM", because Enter, Space and a click all
     mean it. It was three copies of the same guard, and a mutation could widen
     any one of them while the other two's tests still passed (2026-08-31). */
  const selectActive = (i: number) => {
    const item = items[i]
    if (item && !item.disabled) { item.onSelect(); setPos(null) }
  }
  const { active, setActive, handleKey } = useListNavigation({ count: items.length, onEnter: selectActive })

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

  /* Arrow keys, Home and End are `useListNavigation`'s — the second mechanism
     this system had in three copies. This one's copy answered neither Home nor
     End, which the ARIA menu pattern asks for; it does now, and so do the other
     two, because the keys live in one place. What stays here is the key this
     menu owns: Space selects, the way a menu does and a listbox does not. */
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (handleKey(e)) return
    if (e.key === ' ') { e.preventDefault(); selectActive(active) }
  }

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
              onClick={() => selectActive(i)}
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
