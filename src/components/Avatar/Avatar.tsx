import './Avatar.css'
import { useState, type HTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

type Size = 'sm' | 'md' | 'lg' | 'xl' | '2xl'
type Shape = 'circle' | 'square'
type Status = 'online' | 'away' | 'busy' | 'offline'

type Props = HTMLAttributes<HTMLSpanElement> & {
  /** Full name — first letter is used as the initial; whole name as aria-label. */
  name: string
  /** Discrete sizes. Omit + use `fill` to size from parent. */
  size?: Size
  /** Fill the parent (width/height 100%). For nesting inside icon buttons. */
  fill?: boolean
  /** Optional image url. If it fails to load, the initial is shown instead. */
  src?: string
  /** Circle by default. `square` is the rounded-rect form, for a team or an
   *  organisation rather than a person. */
  shape?: Shape
  /** Presence dot pinned to the corner. */
  status?: Status
  /** Localised word for the status, folded into the accessible name so the dot
   *  is never colour-only. Without it the raw status value is read. */
  statusLabel?: string
}

/**
 * A person or a team as an image with an initial fallback. `status` adds a
 * presence dot whose meaning lives in `statusLabel`, not in its colour;
 * `shape="square"` reads as a team rather than a person.
 *
 * Copy: the name is the person's own, spelled as they spell it — the initial and
 * the accessible name both come from it. `statusLabel` says what the dot
 * means; a colour on its own says nothing.
 */
export function Avatar({ name, size, fill, src, shape, status, statusLabel, className, ...rest }: Props) {
  /* Remember WHICH src broke rather than a boolean: a new url then renders on
   * its own, with no effect needed to clear the flag. */
  const [brokenSrc, setBrokenSrc] = useState<string | null>(null)
  /* Spread-iterate to handle surrogate pairs / combining marks correctly. */
  const initial = [...name][0]?.toUpperCase() ?? ''
  /* Default to `md` so an Avatar always has an explicit size (a circle) instead
   * of collapsing to the parent's width. `fill` opts out — it sizes from parent. */
  const resolvedSize = fill ? undefined : size ?? 'md'
  const showImage = Boolean(src) && src !== brokenSrc
  return (
    <span
      className={cn('avatar', className)}
      data-size={resolvedSize}
      data-fill={fill || undefined}
      data-shape={shape}
      aria-label={status ? `${name}, ${statusLabel ?? status}` : name}
      role="img"
      {...rest}
    >
      {showImage
        ? <img src={src} alt="" onError={() => setBrokenSrc(src ?? null)} />
        : <span aria-hidden="true">{initial}</span>}
      {status && <span className="avatar-status" data-status={status} aria-hidden="true" />}
    </span>
  )
}
