import './Button.css'
import { type ButtonHTMLAttributes, type ReactNode, type Ref } from 'react'
import { cn } from '../../lib/cn'
import { Spinner } from '../Spinner'

type Variant = 'primary' | 'secondary' | 'ghost' | 'destructive' | 'success' | 'dark' | 'link' | 'ai'
type Size = 'sm' | 'md' | 'lg'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  /** Forwarded to the underlying <button>. */
  ref?: Ref<HTMLButtonElement>
  variant?: Variant
  size?: Size
  block?: boolean
  /** Put the icon on the trailing side. Use for "add/create" actions; leave off
   *  (icon leading) for plain/navigational buttons. */
  iconEnd?: boolean
  /** In-flight action: shows a spinner in place of the icon and blocks further
   *  clicks. The label stays so the button keeps its width. Set the accessible
   *  busy text with `loadingLabel`. */
  loading?: boolean
  /** What the spinner announces while `loading` (default "Loading"). */
  loadingLabel?: string
  children?: ReactNode
}

/**
 * The action control: `variant` sets its weight, `loading` swaps the icon for
 * a spinner and disables it, `iconEnd` trails the label on add and create
 * actions.
 */
export function Button({
  variant, size, block, iconEnd, loading, loadingLabel = 'Loading', disabled, className, ref, children, ...rest
}: Props) {
  return (
    <button
      ref={ref}
      className={cn('btn', className)}
      data-variant={variant}
      data-size={size}
      data-block={block || undefined}
      data-icon-end={iconEnd || undefined}
      data-loading={loading || undefined}
      disabled={disabled || loading || undefined}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading && <Spinner size="sm" label={loadingLabel} className="btn-spinner" />}
      {children}
    </button>
  )
}
