import './Prose.css'
import type { HTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

type Props = HTMLAttributes<HTMLElement> & {
  /** `p` by default. `div` when the text wraps other elements. */
  as?: 'p' | 'div'
  /** `md` reads at the body size; `sm` is a hint under a control. */
  size?: 'sm' | 'md'
  /**
   * Which of this component's own looks. `muted` is the default, because prose
   * on a screen is almost always context around the thing the reader came for;
   * `plain` is for the case where the sentence IS the content.
   *
   * Not `tone`: in this system `tone` answers what a thing's STATE is
   * (success, danger, info), and how loud the ink is is a different question.
   */
  appearance?: 'muted' | 'plain'
}

/**
 * A sentence, at a measure.
 *
 * The measure is the whole reason it exists. Text set to whatever width its
 * container happens to be is text the eye loses the start of, and every screen
 * that noticed re-wrote the same `max-inline-size` with a slightly different
 * number: four files in this repository's own site arrived at 62, 68, 70 and
 * "none" before this component did (2026-08-23). One number, once, and it is
 * 68ch — long enough for a real sentence, short enough that the return sweep
 * lands on the right line.
 *
 * Not for a paragraph inside a card that is already narrow: there the card is
 * the measure. For the sentences that sit on a page, under a heading, beside a
 * control — the ones that would otherwise run the width of the screen.
 */
export function Prose({ as: As = 'p', size = 'md', appearance = 'muted', className, ...rest }: Props) {
  return <As className={cn('prose', className)} data-size={size} data-appearance={appearance} {...rest} />
}
