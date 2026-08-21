import '../Input/Input.css'
import './Textarea.css'
import type { TextareaHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

type Props = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'> & {
  invalid?: boolean
  /** sm / md (default) / lg — matches the control scale (font + min-height). */
  size?: 'sm' | 'md' | 'lg'
}

/* Multi-line counterpart to <Input> — reuses the `.input` field styling
 * (border, radius, focus ring, hover, placeholder) and only overrides the
 * height/resize behaviour. */
export function Textarea({ invalid, size, className, rows = 4, ...rest }: Props) {
  return (
    <textarea
      className={cn('input', 'textarea', className)}
      data-size={size}
      aria-invalid={invalid || undefined}
      rows={rows}
      {...rest}
    />
  )
}
