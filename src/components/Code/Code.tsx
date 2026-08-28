import './Code.css'
import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

type Props = {
  /** The source. Kept verbatim: a code sample that reflows is lying about the code. */
  children: ReactNode
  /** A fragment inside a sentence rather than a block of its own. */
  inline?: boolean
  /**
   * What the block is, for the reader and for the screen reader that lands in
   * it. Required on a block, because a scrollable region with no name is a
   * region a keyboard user arrives in without being told where they are.
   */
  label?: string
  className?: string
}

/**
 * Source code, inline in a sentence or as a block that scrolls inside itself
 * and can be reached by keyboard.
 *
 * Three things a `<pre>` does not do on its own and every product re-does: the
 * monospace face from the token rather than the browser's default, a scroll
 * that is REACHABLE (a scrollable region owes a tab stop and a name — axe's
 * `scrollable-region-focusable`, which this repository's own site failed), and
 * a floor of zero so the sample scrolls inside its container instead of pushing
 * the document sideways.
 *
 * On a phone it wraps rather than scrolls: a page that scrolls sideways is
 * worse than a sample that breaks its lines, and the reader can recover from
 * one of the two.
 *
 * Copy: the label names what the block IS — "vite.config.ts", "The response" —
 * because a reader landing on a wall of source needs to know what they are
 * looking at before they read it.
 */
export function Code({ children, inline, label, className }: Props) {
  if (inline) return <code className={cn('code', className)} data-inline="">{children}</code>
  return (
    <pre className={cn('code', className)} tabIndex={0} role="region" aria-label={label}>
      <code>{children}</code>
    </pre>
  )
}
