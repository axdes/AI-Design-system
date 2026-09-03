import './Button.css'
import { type ButtonHTMLAttributes, type ReactNode, type Ref } from 'react'
import { cn } from '../../lib/cn'
import { Spinner } from '../Spinner'

type Variant = 'primary' | 'secondary' | 'ghost' | 'destructive' | 'success' | 'dark' | 'link' | 'ai'
type Size = 'sm' | 'md' | 'lg'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  /** Forwarded to the underlying <button>. */
  ref?: Ref<HTMLButtonElement>
  /** How much weight this action carries ON THE SCREEN — which makes it a
   *  decision about the screen, not about the button. Exactly one action is
   *  `primary`: the thing the reader came to do. Everything beside it is
   *  `secondary`, which is also what a button with no variant gets, and that is
   *  the right default for a control nobody has thought about yet. `ghost` is
   *  for a control that must not compete with the content under it.
   *  `destructive` is reserved for what cannot be undone, where the colour IS
   *  the warning — and it does not remove the need to confirm. */
  variant?: Variant
  /** Control height: sm 32 / md 40 (default) / lg 52. State it whenever the
   *  button sits beside an `<IconButton>`, which defaults to `sm`. */
  size?: Size
  /** Fills the width it is given. For a button that is the whole of a narrow
   *  column — a form's submit on a phone, a card's single action — never as a
   *  way to make one button look important in a row. */
  block?: boolean
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
 * a spinner and disables it while it runs.
 *
 * Copy: the verb the reader is about to perform, with its object when the screen
 * has more than one — "Send invoice", not "Submit", never "OK". The label
 * is a promise about what happens next.
 */
export function Button({
  variant, size, block, loading, loadingLabel = 'Loading', disabled, className, ref, children, ...rest
}: Props) {
  return (
    <button
      ref={ref}
      className={cn('btn', className)}
      data-variant={variant}
      data-size={size}
      data-block={block || undefined}
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
