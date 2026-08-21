import './Label.css'
import type { LabelHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

type Size = 'sm' | 'md'

type Props = LabelHTMLAttributes<HTMLLabelElement> & {
  /** md (default) = 15px; sm = 13px, matching small-button text. */
  size?: Size
}

/**
 * The text that names a control and is tied to it by htmlFor. Field already
 * composes one; reach for it directly only outside a Field.
 */
export function Label({ size, className, ...rest }: Props) {
  // eslint-disable-next-line jsx-a11y/label-has-associated-control -- reusable Label primitive; the control association (htmlFor) is supplied by the consumer
  return <label className={cn('label', className)} data-size={size} {...rest} />
}
