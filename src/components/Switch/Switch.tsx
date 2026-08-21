import './Switch.css'
import type { ButtonHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'onChange'> & {
  checked: boolean
  onChange: (next: boolean) => void
  label: string
}

/**
 * An on/off setting that applies the moment it is flipped (role="switch"). A
 * checkbox is for something that applies when a form is submitted.
 */
export function Switch({ checked, onChange, label, className, ...rest }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={cn('switch', className)}
      onClick={() => onChange(!checked)}
      {...rest}
    />
  )
}
