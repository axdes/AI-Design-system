import './IconButton.css'
import { type ButtonHTMLAttributes, type Ref } from 'react'
import { cn } from '../../lib/cn'
import { Icon, type IconName } from '../Icon'
import { Spinner } from '../Spinner'

type Size = 'sm' | 'md' | 'lg'
type Variant = 'ghost' | 'filled' | 'quiet'
type Tone = 'primary' | 'destructive'

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  /** Forwarded to the underlying <button>. */
  ref?: Ref<HTMLButtonElement>
  icon: IconName
  /** Square button matching control heights: sm 32 / md 40 / lg 52. Default 'sm'.
   *  NOTE: `Button` defaults to 'md', so a pair of them needs this stated — an
   *  unsized icon button beside an unsized button is 32 next to 40. Three apps
   *  shipped that before `controls-same-height` started asking. */
  size?: Size
  /** ghost = transparent (default, hover = accent fill). filled = solid fill.
   *  quiet = transparent, hover recolors only (no fill) — for inline toolbar icons. */
  variant?: Variant
  /** Fill colour for `filled` (e.g. send = primary, stop = destructive). */
  tone?: Tone
  /** Hidden by default; container's :hover or `data-open` makes it visible. */
  reveal?: boolean
  /** In-flight action: swaps the icon for a spinner and blocks clicks. The
   *  spinner reuses the button's aria-label as its accessible name. */
  loading?: boolean
}

/**
 * A button whose label is an icon, which is why it always takes an aria-label
 * and a Tooltip. `quiet` for inline toolbars, `filled` plus `tone` for send
 * and stop.
 */
export function IconButton({
  icon, size = 'sm', variant, tone, reveal, loading, disabled, className, type = 'button', ref, ...rest
}: Props) {
  const label = rest['aria-label']
  return (
    <button
      ref={ref}
      type={type}
      className={cn('icon-button', className)}
      data-size={size}
      data-variant={variant}
      data-tone={tone}
      data-reveal={reveal || undefined}
      data-loading={loading || undefined}
      disabled={disabled || loading || undefined}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <Spinner size={size} label={label ?? 'Loading'} /> : <Icon name={icon} size={size} />}
    </button>
  )
}
