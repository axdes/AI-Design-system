import './Dropdown.css'
import { readAnchor, computePlacement, type Placement } from '../../lib/placement'
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  type Ref,
} from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../../lib/cn'
import { useListKeys } from '../../lib/useListKeys'
import { useAnchoredLayer } from '../../lib/useAnchoredLayer'
import { Icon, type IconName } from '../Icon'
import { Kbd } from '../Kbd'

type Align = 'start' | 'end'

export type DropdownTriggerProps = {
  isOpen: boolean
  ref: Ref<HTMLButtonElement>
  onClick: (e: MouseEvent) => void
  id: string
  'aria-haspopup': 'menu'
  'aria-expanded': boolean
  'aria-controls': string
}

type DropdownProps = {
  trigger: (props: DropdownTriggerProps) => ReactNode
  children: ReactNode
  /** Which edge the menu lines up with, and it follows where the trigger SITS: the default `end`
   *  for a control at the right, `start` on the left, so the menu opens into the page and not
   *  off its edge.
   */
  align?: Align
  className?: string
  /** Class on the menu element (portaled to body — needed for descendant selectors). */
  menuClassName?: string
  /** Close menu when an item is clicked. Default true. Set false for multi-select. */
  closeOnSelect?: boolean
  /** Menu width: true = exactly the trigger's width (select-style), 'min' =
   *  at least the trigger's width but growing with longer content. Default
   *  false (intrinsic width). */
  matchTriggerWidth?: boolean | 'min'
  /** Name the trigger yourself instead of letting one be generated. Use it when
   *  something outside has to reach the control by id: `<Field htmlFor>`, or an
   *  `ErrorSummary` row that puts focus on the field it names. */
  triggerId?: string
}

/* Position is computed against the viewport (menu uses position: fixed). */
/* The arithmetic lives in placement.ts so it can be tested without a browser;
 * this file only measures the DOM and hands the numbers over. */
type Position = Placement

/**
 * Menu hung on a trigger you supply: keyboard navigation, portal and ARIA are
 * built in, so spread `triggerProps` onto your own button. Items, sections and
 * dividers are the parts.
 *
 * When the trigger is an ordinary labelled button, `<ButtonGroup menu>` is that
 * already assembled — including the split form where a default action sits on
 * its own half. Come here when the trigger is something else: an avatar, a
 * table row, a field.
 */
export function Dropdown({
  trigger, children, align = 'end', className, menuClassName, closeOnSelect = true,
  matchTriggerWidth = false, triggerId: triggerIdProp,
}: DropdownProps) {
  const [open, setOpen] = useState(false)
  const itemsRef = useRef<HTMLElement[]>([])
  const menuId = useId()
  /* The trigger's id is generated UNLESS the caller names it. It has to be one
   * id and not two: the menu points `aria-labelledby` at it, and a field wants
   * to reach the same element by `<Field htmlFor>` or from an `ErrorSummary`
   * row. Select used to set its own `id` on the button and then spread
   * `triggerProps` over the top of it, so the caller's name was silently
   * replaced and a summary row that linked to it led nowhere (2026-08-23). */
  const generatedTriggerId = useId()
  const triggerId = triggerIdProp ?? generatedTriggerId

  /* Single close path: outside-click, ESC, Tab, item-click all funnel here.
   * Returns focus to the actual trigger element saved in triggerRef. */
  const close = useCallback(() => {
    setOpen(false)
    triggerRef.current?.focus()
  }, [])

  /* Measure, then delegate. Everything below is a DOM read; the decisions
   * (flip up, pin right, clamp to the edge) are computePlacement's, and are
   * covered by placement.test.ts. */
  const computePosition = useCallback((): Position | null => {
    const triggerEl = triggerRef.current
    if (!triggerEl) return null
    /* `natural: true` because this menu clamps its own height: measured as
     * rendered it would read as "it fits" for ever and never flip. The read
     * itself is readAnchor's, shared with every other anchored layer. */
    const anchor = readAnchor(triggerEl, menuRef.current, { natural: true })
    if (!anchor) return null
    return computePlacement({ ...anchor, align, matchTriggerWidth })
  }, [align, matchTriggerWidth])

  /* The mechanism — measurement timing, rAF-throttled reflow, outside press and
     Escape — is shared with <Popover>. Only the geometry above is this
     component's. `setLayer` is the menu's ref: it flags the mount so the
     measurement re-runs once the menu has a real size. */
  const { triggerRef, layerRef: menuRef, setLayer: menuRefCallback, position, mounted: menuMounted } =
    useAnchoredLayer<Position>({ open, onClose: close, measure: computePosition })

  /* Cache menuitems on open; focus first */
  useEffect(() => {
    if (!open || !menuMounted) return
    const raf = requestAnimationFrame(() => {
      itemsRef.current = Array.from(
        menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [],
      )
      itemsRef.current[0]?.focus()
    })
    return () => cancelAnimationFrame(raf)
  }, [open, menuMounted])

  const handleTrigger = useCallback((e: MouseEvent) => {
    e.stopPropagation()
    setOpen((v) => !v)
  }, [])

  /* The list and the current row are read WHEN THE KEY ARRIVES: this menu moves
   * real DOM focus between real buttons, so `document.activeElement` is the
   * truth and mirroring it into state would be the bug. */
  const listKeys = useListKeys({
    count: () => itemsRef.current.length,
    index: () => itemsRef.current.findIndex((el) => el === document.activeElement),
    move: (i) => itemsRef.current[i]?.focus(),
  })

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      close()
      return
    }
    if (e.key === 'Tab') {
      /* Tab closes the menu and moves ON, never back into a loop with the
       * trigger. The focused item is about to unmount, and a default Tab from a
       * removed element starts over from <body> — so focus hops to the trigger
       * FIRST (without preventDefault), and the browser's own Tab then advances
       * from there to the next element in the page. */
      triggerRef.current?.focus()
      setOpen(false)
      return
    }

    /* Down, Up, Home and End are the same four keys in every list this system
     * walks, and this menu used to write them out for itself. They come from
     * the shared mechanism now; what stays above is what a MENU answers and a
     * list does not — Escape closes it, and Tab leaves it forwards.
     * (src/lib/useListKeys.ts, 2026-09-02) */
    listKeys(e)
  }

  /* Stable ref callback — assigned once for lifetime of component. */
  const triggerRefCallback = useCallback((el: HTMLButtonElement | null) => {
    triggerRef.current = el
  }, [])

  /* Memoize triggerProps so downstream-memoized triggers don't churn. */
  const triggerProps = useMemo<DropdownTriggerProps>(() => ({
    isOpen: open,
    ref: triggerRefCallback,
    onClick: handleTrigger,
    id: triggerId,
    'aria-haspopup': 'menu',
    'aria-expanded': open,
    'aria-controls': menuId,
  }), [open, handleTrigger, triggerRefCallback, triggerId, menuId])

  return (
    <div className={cn('dropdown', className)} data-open={open || undefined}>
      {/* eslint-disable-next-line react-hooks/refs -- `triggerProps` carries a ref callback for the consumer to spread onto their own element. The compiler cannot see that the render prop only STORES it; React invokes it at commit. Replacing this with a wrapper element would change every trigger's layout. */}
      {trigger(triggerProps)}
      {open && position &&
        createPortal(
          <div
            ref={menuRefCallback}
            id={menuId}
            className={cn('dropdown-menu', menuClassName)}
            data-raised="popover"
            role="menu"
            aria-labelledby={triggerId}
            tabIndex={-1}
            style={position}
            onKeyDown={handleKeyDown}
            onClick={(e) => {
              e.stopPropagation()
              if (closeOnSelect) close()
            }}
          >
            {children}
          </div>,
          document.body,
        )}
    </div>
  )
}

type ItemTone = 'danger'

type ItemProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'disabled'> & {
  icon?: IconName
  /** Marks the current choice in a select-style menu: renders a trailing,
   *  primary-tinted check pinned to the end. The single reusable selection
   *  affordance — don't hand-roll a leading check. */
  selected?: boolean
  /** Danger colouring for an action that cannot be undone. Put those last,
   *  behind a `<DropdownDivider>`. */
  tone?: ItemTone
  /** Keyboard shortcut hint on the trailing edge (e.g. "⌘⌫"). Display only. */
  shortcut?: string
  /** Unavailable, but still visible and still in the arrow-key order. Rendered
   *  as aria-disabled so a Tooltip can explain why; the click is blocked here.
   *  (A natively disabled button fires no pointer events, so its tooltip never
   *  opens — which is why this is not the native attribute.) */
  disabled?: boolean
}

export function DropdownItem({
  icon, selected, tone, shortcut, disabled, children, className, type = 'button', onClick, ...rest
}: ItemProps) {
  return (
    <button
      type={type}
      className={cn('dropdown-item', className)}
      role="menuitem"
      aria-current={selected || undefined}
      aria-disabled={disabled || undefined}
      data-selected={selected || undefined}
      data-tone={tone}
      data-disabled={disabled || undefined}
      onClick={(e) => {
        /* Stop, and stop the bubble too: the menu closes on any click that
         * reaches it, so a dead item would still dismiss the menu. */
        if (disabled) {
          e.preventDefault()
          e.stopPropagation()
          return
        }
        onClick?.(e)
      }}
      {...rest}
    >
      {icon && <Icon name={icon} />}
      {children}
      {/* THE MARK IS <Kbd>'s, and this row drew its own until 2026-08-31: a grey
          span at --font-xs, which is the shape Kbd's own JSDoc names ("a menu
          row") and the reason Kbd had no consumer anywhere in the system. The
          span stays as the LAYOUT (it is what pushes the cap to the trailing
          edge) and no longer paints anything. `aria-hidden` is unchanged: in a
          menu the shortcut is a reminder, and the item's label is its name. */}
      {shortcut && <span className="dropdown-item-shortcut" aria-hidden="true"><Kbd>{shortcut}</Kbd></span>}
      {selected && <Icon name="check" className="dropdown-item-check" />}
    </button>
  )
}

/** A titled group of items, for menus past a handful of actions. `role="group"`
 *  ties the items to the label instead of leaving it as decoration. */
export function DropdownSection({ label, children }: { label: string; children: ReactNode }) {
  const labelId = useId()
  return (
    <div role="group" aria-labelledby={labelId}>
      <div id={labelId} className="dropdown-section-label">{label}</div>
      {children}
    </div>
  )
}

/* A thin separator between groups of dropdown items. */
export function DropdownDivider() {
  return <div className="dropdown-divider" role="separator" />
}
