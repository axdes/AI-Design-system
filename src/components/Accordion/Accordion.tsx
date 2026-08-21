import './Accordion.css'
import { useId, useState, type KeyboardEvent, type ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { Icon } from '../Icon'

export type AccordionItem = {
  /** Stable id used for open state and ARIA wiring. */
  id: string
  title: ReactNode
  content: ReactNode
  /** Shown but not openable. */
  disabled?: boolean
}

type Props = {
  items: AccordionItem[]
  /** true = several panels open at once; false (default) = one at a time. */
  multiple?: boolean
  /** Ids open on first render. */
  defaultOpen?: string[]
  /** Header voice: `md` (default, body size) or `lg` — the section-head size, for a column of
   *  blocks whose titles are the headings of the page beside them. */
  size?: 'md' | 'lg'
  /** Heading level of each header (default 3). Set it to the level the outline is at where the
   *  accordion sits: a stack of blocks straight under the page title is at 2, not 3, and a skipped
   *  level is a section a screen reader cannot walk to. */
  headingLevel?: 2 | 3 | 4
  className?: string
}

/* Disclosure list: a stack of headers that each reveal a panel. The header is a
 * real <button> (Space/Enter toggle it, focus ring, disabled honoured); Arrow
 * Up/Down/Home/End move between headers, matching the WAI-ARIA accordion. State
 * is owned here — pass `multiple` to allow several panels open at once. */
export function Accordion({ items, multiple = false, defaultOpen = [], size = 'md', headingLevel = 3, className }: Props) {
  const [open, setOpen] = useState<string[]>(defaultOpen)
  const baseId = useId()
  const Heading = `h${headingLevel}` as const

  const toggle = (id: string) => {
    setOpen((cur) => {
      const isOpen = cur.includes(id)
      if (multiple) return isOpen ? cur.filter((x) => x !== id) : [...cur, id]
      return isOpen ? [] : [id]
    })
  }

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) return
    const headers = Array.from(e.currentTarget.querySelectorAll<HTMLButtonElement>('.accordion-header:not(:disabled)'))
    const i = headers.findIndex((h) => h === document.activeElement)
    if (i === -1) return
    e.preventDefault()
    let next = i
    if (e.key === 'ArrowDown') next = (i + 1) % headers.length
    else if (e.key === 'ArrowUp') next = (i - 1 + headers.length) % headers.length
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = headers.length - 1
    headers[next]?.focus()
  }

  return (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions -- the container only delegates arrow-key focus to its header buttons; it is not itself interactive
    <div className={cn('accordion', className)} data-size={size} onKeyDown={onKeyDown}>
      {items.map((item) => {
        const isOpen = open.includes(item.id)
        const headerId = `${baseId}-h-${item.id}`
        const panelId = `${baseId}-p-${item.id}`
        return (
          <div className="accordion-item" key={item.id} data-open={isOpen || undefined}>
            <Heading className="accordion-heading">
              <button
                type="button"
                id={headerId}
                className="accordion-header"
                aria-expanded={isOpen}
                aria-controls={panelId}
                disabled={item.disabled}
                onClick={() => toggle(item.id)}
              >
                <span className="accordion-title">{item.title}</span>
                <Icon name="arrow_drop_down" className="accordion-chevron" />
              </button>
            </Heading>
            {isOpen && (
              <div className="accordion-panel" id={panelId} role="region" aria-labelledby={headerId}>
                {item.content}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
