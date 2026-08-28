import './SectionLabel.css'
import type { HTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

/** Which element the label really is. A page of sections needs real headings so
 *  the outline can be walked; a label inside a card usually does not, which is
 *  why the default stays a div. */
type Heading = 'h2' | 'h3' | 'h4'

type Props = HTMLAttributes<HTMLElement> & {
  /**
   * The heading level, and whether this is a heading at all. Give it on a page:
   * a section nobody can reach by walking the outline is a section a screen
   * reader has to scroll for. Pick the level from the page, not from the look —
   * one step under whatever heading contains it, never skipping one.
   *
   * Left off it renders a div, which is right inside a card, where the card's
   * own title is already the heading.
   */
  as?: Heading
}

/**
 * The heading that names a section inside a page or a panel: the voice of a card
 * title, one step larger. Rank comes from size and colour, not from caps.
 *
 * Copy: names what the section holds, in the reader's words. It is a heading and
 * reads like one — not a shouted category.
 */
export function SectionLabel({ as, className, ...rest }: Props) {
  const Tag = as ?? 'div'
  return <Tag className={cn('section-label', className)} {...rest} />
}
