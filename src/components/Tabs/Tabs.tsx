import './Tabs.css'
import { createContext, use, useId, useRef, type KeyboardEvent, type ReactNode } from 'react'
import { cn } from '../../lib/cn'

type TabsContextValue = {
  value: string
  onChange: (v: string) => void
  baseId: string
}
const TabsContext = createContext<TabsContextValue | null>(null)

function useTabsCtx() {
  const ctx = use(TabsContext)
  if (!ctx) throw new Error('Tabs.* must be used within <Tabs>')
  return ctx
}

type Props = {
  value: string
  onChange: (v: string) => void
  /** Default underline strip, or free-standing pills (filter-chip look). */
  appearance?: 'underline' | 'pills'
  className?: string
  children: ReactNode
}

/**
 * One panel at a time behind a labelled list, with full ARIA and arrow keys.
 * SegmentedControl is the compact single choice with no panels.
 *
 * Copy: nouns, not verbs — a tab is a place, not an action. One or two words
 * each, and parallel: "Overview, Findings, People", not "Overview, Show
 * findings, The team".
 */
export function Tabs({ value, onChange, appearance, className, children }: Props) {
  const baseId = useId()
  return (
    <TabsContext value={{ value, onChange, baseId }}>
      <div className={cn('tabs', className)} data-appearance={appearance}>
        {children}
      </div>
    </TabsContext>
  )
}

export function TabList({
  children,
  label,
  justify,
}: {
  children: ReactNode
  label: string
  /** Where the tabs sit on the row. Left by default, which is right on a page;
   *  a card whose content is centred wants its tabs centred too (owner, 23.08). */
  justify?: 'center' | 'end'
}) {
  const ref = useRef<HTMLDivElement>(null)

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return
    const tabs = Array.from(ref.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]') ?? [])
    const i = tabs.findIndex((t) => t === document.activeElement)
    let next = i
    if (e.key === 'ArrowRight') next = (i + 1) % tabs.length
    else if (e.key === 'ArrowLeft') next = (i - 1 + tabs.length) % tabs.length
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = tabs.length - 1
    e.preventDefault()
    tabs[next]?.focus()
    tabs[next]?.click()
  }

  return (
    // eslint-disable-next-line jsx-a11y/interactive-supports-focus -- tablist uses roving tabindex on its tabs; the container is not itself a focus target
    <div
      ref={ref}
      className="tablist"
      role="tablist"
      aria-label={label}
      data-justify={justify}
      onKeyDown={onKeyDown}
    >
      {children}
    </div>
  )
}

export function Tab({ value, children }: { value: string; children: ReactNode }) {
  const { value: active, onChange, baseId } = useTabsCtx()
  const selected = value === active
  return (
    <button
      type="button"
      role="tab"
      id={`${baseId}-tab-${value}`}
      aria-controls={`${baseId}-panel-${value}`}
      aria-selected={selected}
      tabIndex={selected ? 0 : -1}
      className="tab"
      onClick={() => onChange(value)}
    >
      {children}
    </button>
  )
}

export function TabPanel({ value, children }: { value: string; children: ReactNode }) {
  const { value: active, baseId } = useTabsCtx()
  const selected = value === active
  /* Every panel stays in the layout and they share one grid cell, so the tab
   * strip sits over the height of the TALLEST panel and the content below it
   * does not jump when the reader switches (owner, 23.08). The inactive ones
   * are `inert` and aria-hidden, so nothing in them is reachable by pointer,
   * keyboard or screen reader — hidden, not merely invisible. */
  return (
    <div
      role="tabpanel"
      id={`${baseId}-panel-${value}`}
      aria-labelledby={`${baseId}-tab-${value}`}
      className="tabpanel"
      data-selected={selected ? '' : undefined}
      aria-hidden={selected ? undefined : true}
      inert={!selected}
    >
      {children}
    </div>
  )
}
