import './SegmentedControl.css'
import { useRef, type KeyboardEvent } from 'react'
import { cn } from '../../lib/cn'
import { type Option } from '../../lib/option'
import { Icon, type IconName } from '../Icon'

/** A segment: the shared <Option> plus the mark this control draws beside the
 *  label (a sun/moon for a light/dark toggle). Named SegmentOption, not
 *  Segment — DonutChart exports that name for a share of a ring. */
export type SegmentOption<V extends string> = Option<V> & { icon?: IconName }

type Props<V extends string> = {
  value: V
  onChange: (value: V) => void
  options: readonly SegmentOption<V>[]
  /** Accessible name for the group. */
  label: string
  /** Follows what it sits beside: `sm` in a toolbar or a card header, `md` when the choice is
   *  the page's own.
   */
  size?: 'sm' | 'md' | 'lg'
  /** Which surface the control sits on, so its fills invert to stay visible.
   *  `base` (default): grey track on a white/card surface, white selected pill.
   *  `muted`: white track on a grey (--muted) surface, grey selected pill. */
  surface?: 'base' | 'muted'
  className?: string
}

/* A single-choice toggle rendered as adjacent segments — a compact radio group
 * for switching a view (List / Board, Day / Week / Month). Uses the radiogroup
 * pattern (Arrow keys move and select); distinct from <Tabs>, which navigates
 * between panels, and from <Select>, which is for longer lists. 
   *
   * Copy: one or two words per segment, parallel with each other. They sit side by
   * side, so a long one makes every other look empty.
   */
export function SegmentedControl<V extends string>({ value, onChange, options, label, size = 'md', surface = 'base', className }: Props<V>) {
  const ref = useRef<HTMLDivElement>(null)

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return
    e.preventDefault()
    const i = options.findIndex((o) => o.value === value)
    let next = i
    if (e.key === 'ArrowRight') next = (i + 1) % options.length
    else if (e.key === 'ArrowLeft') next = (i - 1 + options.length) % options.length
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = options.length - 1
    onChange(options[next].value)
    ref.current?.querySelectorAll<HTMLButtonElement>('[role="radio"]')[next]?.focus()
  }

  return (
    // eslint-disable-next-line jsx-a11y/interactive-supports-focus -- radiogroup uses roving tabindex on its radios; the group is not itself a focus target
    <div ref={ref} className={cn('segmented', className)} role="radiogroup" aria-label={label} data-size={size} data-surface={surface} onKeyDown={onKeyDown}>
      {options.map((opt) => {
        const selected = opt.value === value
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            className="segmented-option"
            data-selected={selected || undefined}
            onClick={() => onChange(opt.value)}
          >
            {opt.icon && <Icon name={opt.icon} size="sm" />}
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
