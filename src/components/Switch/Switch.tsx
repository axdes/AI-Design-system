import './Switch.css'
import type { ButtonHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'onChange'> & {
  /** Controlled: the switch draws what it is told and never its own state, so a flip that the
   *  save rejects must not stay flipped.
   */
  checked: boolean
  /** Called with the NEXT value. It is where the save goes; the switch does not move until
   *  `checked` comes back changed.
   */
  onChange: (next: boolean) => void
  label: string
  /** The form rejected this setting. Red track and a red focus ring; the
   *  message belongs to the `<Field>` around it. */
  invalid?: boolean
}

/**
 * An on/off setting that applies the moment it is flipped (role="switch"). A
 * checkbox is for something that applies when a form is submitted.
 *
 * Copy: the label names the state when ON, and never repeats the word "on":
 * "Weekly digest", not "Weekly digest on/off".
 */
export function Switch({ checked, onChange, label, invalid, className, ...rest }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-invalid={invalid || undefined}
      aria-label={label}
      className={cn('switch', className)}
      onClick={() => onChange(!checked)}
      {...rest}
    />
  )
}
