import './Radio.css'
import type { InputHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> & {
  /** Visible label beside the dot. */
  label?: string
  /** Dot size: sm / md (default) / lg. */
  size?: 'sm' | 'md' | 'lg'
}

/* Single custom radio, one option in a set where exactly one is chosen. Native <input type="radio"> (so a shared `name` gives
 * arrow-key navigation + form semantics for free), visually themed. */
export function Radio({ label, size, className, disabled, ...rest }: Props) {
  return (
    <label className={cn('radio', className)} data-size={size} data-disabled={disabled || undefined}>
      <input type="radio" className="radio-input" disabled={disabled} {...rest} />
      <span className="radio-circle" aria-hidden="true" />
      {label && <span className="radio-label">{label}</span>}
    </label>
  )
}
