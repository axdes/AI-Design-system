import './Dropdown.css'
import { computePlacement, type Placement } from './placement'
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
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
import { Icon, type IconName } from '../Icon'

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
}

/* Position is computed against the viewport (menu uses position: fixed). */
/* The arithmetic lives in placement.ts so it can be tested without a browser;
 * this file only measures the DOM and hands the numbers over. */
type Position = Placement

/**
 * Menu hung on a trigger you supply: keyboard navigation, portal and ARIA are
 * built in, so spread `triggerProps` onto your own button. Items, sections and
 * dividers are the parts.
 */
export function Dropdown({
  trigger, children, align = 'end', className, menuClassName, closeOnSelect = true,
  matchTriggerWidth = false,
}: DropdownProps) {
  const [open, setOpen] = useState(false)
  const [menuMounted, setMenuMounted] = useState(false)
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const itemsRef = useRef<HTMLElement[]>([])
  const [position, setPosition] = useState<Position | null>(null)
  const menuId = useId()
  const triggerId = useId()

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
    const rect = triggerEl.getBoundingClientRect()
    return computePlacement({
      trigger: { top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right, width: rect.width },
      /* scrollHeight reports natural content size — offsetHeight would be the
       * already-clamped size after maxHeight is applied, which creates a feedback
       * loop where the menu never flips because it appears to "fit". */
      menu: { height: menuRef.current?.scrollHeight ?? 0, width: menuRef.current?.scrollWidth ?? 0 },
      viewport: { width: window.innerWidth, height: window.innerHeight },
      align,
      isRtl: document.documentElement.dir === 'rtl',
      matchTriggerWidth,
    })
  }, [align, matchTriggerWidth])

  /* Position is computed whenever: menu opens, menu mounts (so dimensions are
   * real), or align changes. Ref callback only updates `menuMounted` flag —
   * stable identity prevents the measurement-via-ref-rerun loop. */
  const menuRefCallback = useCallback((node: HTMLDivElement | null) => {
    menuRef.current = node
    setMenuMounted(Boolean(node))
  }, [])

  useLayoutEffect(() => {
    if (!open) return
    // eslint-disable-next-line @eslint-react/set-state-in-effect -- positions the portal from measured geometry; not derivable during render
    setPosition(computePosition())
  }, [open, menuMounted, computePosition])

  /* Reposition on scroll / resize while open. rAF-throttled, passive. */
  useEffect(() => {
    if (!open) return
    let raf = 0
    const update = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => setPosition(computePosition()))
    }
    window.addEventListener('scroll', update, { capture: true, passive: true })
    window.addEventListener('resize', update, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', update, true)
      window.removeEventListener('resize', update)
    }
  }, [open, computePosition])

  /* Outside click closes (returns focus to trigger via close). */
  useEffect(() => {
    if (!open) return
    const onDocClick = (e: globalThis.MouseEvent) => {
      const target = e.target as Node
      if (triggerRef.current?.contains(target)) return
      if (menuRef.current?.contains(target)) return
      close()
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open, close])

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

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const items = itemsRef.current
    const i = items.findIndex((el) => el === document.activeElement)

    switch (e.key) {
      case 'Escape':
        e.preventDefault()
        close()
        break
      case 'Tab':
        /* Tab closes the menu and moves ON, never back into a loop with the
         * trigger. The focused item is about to unmount, and a default Tab
         * from a removed element starts over from <body> — so focus hops to
         * the trigger FIRST (without preventDefault), and the browser's own
         * Tab then advances from there to the next element in the page. */
        triggerRef.current?.focus()
        setOpen(false)
        break
      case 'ArrowDown':
        e.preventDefault()
        items[Math.min(i + 1, items.length - 1)]?.focus()
        break
      case 'ArrowUp':
        e.preventDefault()
        items[Math.max(i - 1, 0)]?.focus()
        break
      case 'Home':
        e.preventDefault()
        items[0]?.focus()
        break
      case 'End':
        e.preventDefault()
        items[items.length - 1]?.focus()
        break
    }
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
      {shortcut && <span className="dropdown-item-shortcut" aria-hidden="true">{shortcut}</span>}
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
