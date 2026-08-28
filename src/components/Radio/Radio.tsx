import './Radio.css'
import type { InputHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> & {
  /** Visible label beside the dot. */
  label?: string
  /** Dot size: sm / md (default) / lg. */
  size?: 'sm' | 'md' | 'lg'
  /** The form rejected this set. Draws the red circle and the red focus ring —
   *  the VISUAL half only. The announcement belongs to `<RadioGroup invalid>`,
   *  because a single radio cannot carry `aria-invalid`: ARIA does not support
   *  it on `role="radio"`, and "nothing is chosen" is a fact about the set, not
   *  about any one option in it. */
  invalid?: boolean
}

/* Single custom radio, one option in a set where exactly one is chosen. Native <input type="radio"> (so a shared `name` gives
 * arrow-key navigation + form semantics for free), visually themed. 
   *
   * Copy: options are parallel: same part of speech, same length, same grain.
   * "Weekly" beside "Every Monday at 9" reads as two different questions.
   */
export function Radio({ label, size, invalid, className, disabled, ...rest }: Props) {
  return (
    <label
      className={cn('radio', className)}
      data-size={size}
      data-disabled={disabled || undefined}
      data-invalid={invalid || undefined}
    >
      <input type="radio" className="radio-input" disabled={disabled} {...rest} />
      <span className="radio-circle" aria-hidden="true" />
      {label && <span className="radio-label">{label}</span>}
    </label>
  )
}
