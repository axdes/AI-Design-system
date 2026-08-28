import './ColorSwatch.css'
import type { CSSProperties } from 'react'
import { cn } from '../../lib/cn'

/** How big the control is. `sm` sits in a dense panel; `md` in a form. */
type Size = 'sm' | 'md'

type Props = {
  /** The colour itself — any CSS colour. It is a VALUE, not a theme token. */
  value: string
  /**
   * What this colour is called. Required, and deliberately: a colour has no
   * accessible name of its own, so a swatch without one is a button that reads
   * as "button" to anyone not looking at it.
   */
  label: string
  /** Whether this is the chosen one. */
  selected?: boolean
  /** Called with the value when it is picked. */
  onSelect?: (value: string) => void
  size?: Size
  disabled?: boolean
  className?: string
}

/**
 * A colour as a control: the value, its name, and a pressed state. Reach for it
 * anywhere a person picks a colour from a set someone curated — a brand, a
 * label, a calendar. For a free choice of any colour at all, this is the wrong
 * part; that is a picker, and the system does not have one.
 *
 * `<input type="color">` is the alternative it replaces, and it is the raw
 * control the linter refuses everywhere else: it cannot be styled, and it hands
 * the person an OS dialog that owes this system nothing.
 *
 * The dot draws its own edge from `--border` rather than from the colour, so a
 * swatch the colour of the surface it sits on is still a visible target — the
 * case a colour-as-background approach gets wrong exactly when it matters, on
 * white and on near-white.
 *
 * Copy: `label` is the colour's NAME in the reader's words — "Indigo", not
 * "#4638d3". A hex code is the value, and it is already the value.
 */
export function ColorSwatch({
  value,
  label,
  selected,
  onSelect,
  size = 'md',
  disabled,
  className,
}: Props) {
  return (
    <button
      type="button"
      className={cn('color-swatch', className)}
      data-size={size}
      data-selected={selected || undefined}
      /* A genuinely dynamic value, which is the one case inline style is for:
         it is data, and it cannot be a token because it is not a decision the
         system made. */
      style={{ '--color-swatch': value } as CSSProperties}
      aria-pressed={selected ?? false}
      disabled={disabled}
      onClick={() => onSelect?.(value)}
    >
      <span className="color-swatch-dot" aria-hidden="true" />
      {label}
    </button>
  )
}
