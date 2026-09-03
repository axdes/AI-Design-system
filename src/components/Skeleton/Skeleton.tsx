import './Skeleton.css'
import { cn } from '../../lib/cn'

type Shape = 'text' | 'block' | 'circle'

type Props = {
  /** text = a line of body text (default). block = a rectangular area (card,
   *  image). circle = an avatar-sized disc. */
  /* `kind`, not `shape`: text, block and circle say WHAT IS MISSING rather than
   * what outline is drawn, and `shape` in this system is the outline — a circle
   * or a square on an avatar, a bar or a ring on a progress. (2026-09-03) */
  kind?: Shape
  /** Number of text lines. Only meaningful for kind="text"; the last line is
   *  rendered short so the block reads as a paragraph, not a bar. Default 1. */
  lines?: number
  /** Width / height overrides for block and circle (a token or length). Text
   *  fills its container. */
  width?: string
  height?: string
  className?: string
}

/* Loading placeholder: the kind of content before it arrives, so the layout
 * does not jump when it does. Decorative by design (aria-hidden) — announce the
 * loading state once, on the region, with a <Spinner> or aria-busy, not on every
 * shimmer. The pulse animation is disabled under prefers-reduced-motion. */
export function Skeleton({ kind = 'text', lines = 1, width, height, className }: Props) {
  if (kind === 'text' && lines > 1) {
    return (
      <span className={cn('skeleton-lines', className)} aria-hidden="true">
        {Array.from({ length: lines }).map((_, i) => (
          // eslint-disable-next-line @eslint-react/no-array-index-key -- fixed-length placeholder list, no identity to key on
          <span key={i} className="skeleton" data-kind="text" data-last={i === lines - 1 || undefined} />
        ))}
      </span>
    )
  }
  return (
    <span
      className={cn('skeleton', className)}
      data-kind={kind}
      aria-hidden="true"
      style={width || height ? { width, height } : undefined}
    />
  )
}
