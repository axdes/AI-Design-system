import './Input.css'
import type { ComponentPropsWithRef } from 'react'
import { cn } from '../../lib/cn'

/* ComponentPropsWithRef, not InputHTMLAttributes: React 19 passes `ref` as an
 * ordinary prop, but only if the prop type says so. It did not, so no consumer
 * could focus or select the field programmatically, and every dialog that wanted
 * to reached for `autoFocus` instead. `ref` rides along in `...rest`. */
type Props = Omit<ComponentPropsWithRef<'input'>, 'size'> & {
  invalid?: boolean
  /** Which surface the field sits on. On `muted` (a page/PageHeader) the border
   *  is dropped since the white fill separates it; `base` (default, a white card
   *  or form) keeps the border. Invalid + focus stay visible on both. */
  surface?: 'base' | 'muted'
  /** Control height: sm / md (default) / lg — matches the button/control scale. */
  size?: 'sm' | 'md' | 'lg'
}

/**
 * The single-line text field: label, invalid state and the shared control
 * tokens. A screen never renders a bare input.
 */
export function Input({ invalid, size, surface = 'base', className, ...rest }: Props) {
  return (
    <input
      className={cn('input', className)}
      data-size={size}
      aria-invalid={invalid || undefined}
      data-surface={surface}
      {...rest}
    />
  )
}
