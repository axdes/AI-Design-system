import './IconDisc.css'
import { Icon } from '../Icon'
import type { IconName } from '../Icon'
import { cn } from '../../lib/cn'

/**
 * The disc. The glyph is not on this scale — it follows, which is the point.
 * There is no `lg`: the third disc the grid offers is 64, a glyph at half of it
 * would be 32, and the icon scale runs 16 / 20 / 24 / 40. Adding a step to a
 * type scale to serve one component is how a scale rots, and rounding to 24 or
 * 40 would put a different proportion on the ladder — which is the one thing
 * this component exists to prevent.
 */
type Size = 'sm' | 'md'
/** The fill. `neutral` is a quiet ground; `primary` is the brand speaking. */
type Tone = 'neutral' | 'primary'

type Props = {
  /** The glyph. */
  icon: IconName
  /** How big the DISC is. */
  size?: Size
  /** What the disc is filled with. */
  tone?: Tone
  className?: string
}

/**
 * An icon in a filled disc, at a proportion nobody has to choose. Use it for a
 * section mark, a tile's badge, a heading's cap — anywhere a glyph needs to read
 * as a thing rather than as punctuation.
 *
 * The glyph size is NOT a prop, and that is the whole component. A 20px icon in
 * a 32px disc fills two thirds of it and reads as cramped; the brand mark in the
 * rail sits at half, and that is the proportion this system already chose
 * (owner, 2026-08-25). A lint rule could only complain after someone had picked
 * a number — the mistake is picking one at all, so the pair is set here once and
 * the caller chooses only the disc.
 *
 * Decorative by default: the disc carries no text and `Icon` is already hidden
 * from the reader, so a mark beside a heading does not say the heading twice. If
 * the glyph is the ONLY thing carrying the meaning, that meaning belongs in
 * words next to it, not in a label on the circle.
 */
export function IconDisc({ icon, size = 'md', tone = 'neutral', className }: Props) {
  return (
    <span className={cn('icon-disc', className)} data-size={size} data-tone={tone}>
      {/* The one place the pair is decided: 32/16 and 48/24, a glyph at exactly
          half its disc on both steps. */}
      <Icon name={icon} size={size === 'md' ? 'lg' : 'sm'} />
    </span>
  )
}
