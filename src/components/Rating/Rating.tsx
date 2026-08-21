import './Rating.css'
import { useState, type KeyboardEvent } from 'react'
import { cn } from '../../lib/cn'
import { Icon } from '../Icon'

type Props = {
  value: number
  /** Omit to render read-only (display of an existing score). */
  onChange?: (value: number) => void
  max?: number
  /** Accessible name, e.g. "Rate this article". */
  label: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

/* A star rating, a score out of `max` stars. Interactive when `onChange` is given (a radiogroup: click or
 * Arrow keys set the score), read-only otherwise (an img with the score as its
 * name). Half values render a half-filled star. */
export function Rating({ value, onChange, max = 5, label, size = 'md', className }: Props) {
  const [hover, setHover] = useState<number | null>(null)
  const shown = hover ?? value
  const readOnly = !onChange

  if (readOnly) {
    return (
      <span className={cn('rating', className)} data-size={size} role="img" aria-label={`${value} out of ${max}`}>
        {Array.from({ length: max }).map((_, i) => (
          // eslint-disable-next-line @eslint-react/no-array-index-key -- a fixed row of identical stars; position IS the identity, there is nothing else to key on
          <Star key={i} fill={Math.max(0, Math.min(1, shown - i))} />
        ))}
      </span>
    )
  }

  const onKeyDown = (e: KeyboardEvent<HTMLSpanElement>) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { e.preventDefault(); onChange(Math.min(max, value + 1)) }
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { e.preventDefault(); onChange(Math.max(0, value - 1)) }
  }

  return (
    <span
      className={cn('rating', 'rating-interactive', className)}
      data-size={size}
      role="slider"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-valuetext={`${value} out of ${max}`}
      tabIndex={0}
      onKeyDown={onKeyDown}
      onMouseLeave={() => setHover(null)}
    >
      {/* The slider wrapper owns the keyboard contract; each star is a redundant
          pointer target, presentational so it does not nest an interactive
          control inside the slider role (axe: nested-interactive). */}
      {/* One directive listing all three rules, not three stacked ones:
          `disable-next-line` applies to the line that follows it, so a second
          directive under the first only silences the first and neither reaches
          the code. Inside the arrow body a `//` comment is fine; it is only in
          JSX *children* that it would render as text. */}
      {Array.from({ length: max }).map((_, i) => (
        // eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events, @eslint-react/no-array-index-key -- redundant pointer target (the parent slider owns the keyboard), and a fixed row of identical stars where position IS the identity
        <span key={i}
          className="rating-star-button"
          onClick={() => onChange(i + 1)}
          onMouseEnter={() => setHover(i + 1)}
        >
          <Star fill={Math.max(0, Math.min(1, shown - i))} />
        </span>
      ))}
    </span>
  )
}

function Star({ fill }: { fill: number }) {
  /* One star icon; the fill level (full / half / empty) is driven by CSS via
   * data-fill rather than swapping icons (Lucide has no half-star in our map). */
  const state = fill >= 1 ? 'full' : fill > 0 ? 'half' : 'empty'
  return <Icon name="star" className="rating-star" data-fill={state} />
}
