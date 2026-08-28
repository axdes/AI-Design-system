import './Link.css'
import type { AnchorHTMLAttributes, ReactElement, ReactNode } from 'react'
import { Icon } from '../Icon'
import { cn } from '../../lib/cn'

type Props = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
  /** Where it goes. Optional only when `render` is given, because then the link you return carries it. */
  href?: string
  /** `primary` (default) is a link in READING TEXT: brand-coloured and always
   *  underlined, because in a paragraph colour alone is the only thing marking
   *  it and colour alone is not enough (WCAG 1.4.1).
   *  `quiet` is a link in CHROME — a breadcrumb, a row of meta, a footer — where
   *  position already says it is a link, so it sits in secondary ink and
   *  underlines when the pointer or the keyboard arrives.
   *  `bare` paints nothing, ever, because something else is the affordance: the
   *  link wraps a whole SURFACE — a card that lifts under the pointer, a row
   *  that highlights — and underlining the words inside it says a second time
   *  what the surface already said, badly (owner, 2026-08-25). The anchor is
   *  still there, so middle-click, copy-address and the keyboard all work. */
  variant?: 'primary' | 'quiet' | 'bare'
  /** Opens in a new tab, safely, and says so with a trailing glyph. Without the
   *  glyph a new tab is a surprise, and the back button does not undo it. */
  external?: boolean
  /** A trailing arrow, for a link that CONTINUES the thing you are reading:
   *  "Read more", "See all 24", "Next chapter". Not for a link inside a
   *  sentence — there the arrow lands mid-line and reads as punctuation nobody
   *  typed. It mirrors in Arabic, because an arrow that means "onward" points
   *  the way the text runs. */
  arrow?: boolean
  /**
   * Wrap the link in your own router's link. The callback is handed the content
   * (label plus whatever `arrow` or `external` added) and the props the anchor
   * would have carried; return an element that renders both.
   *
   * The same escape `<SideNav>` has, and it exists for the same reason: in a
   * single-page app a plain `href` reloads the whole document, and the way out
   * must not be to stop using links.
   */
  render?: (inner: ReactNode, props: { className: string; 'data-variant': string }) => ReactElement
  children: ReactNode
}

/**
 * A link: text that goes somewhere. Use it for navigation, and `<Button>` for
 * something that happens on this page — the difference is what the browser
 * does, not how it looks, so a link that acts is a button wearing a costume.
 */
export function Link({ variant = 'primary', external, arrow, render, className, children, ...rest }: Props) {
  const outward = external
    ? { target: '_blank', rel: 'noopener noreferrer' as const }
    : {}
  const inner = (
    <>
      {children}
      {external && <Icon name="share" size="sm" className="link-external" aria-hidden="true" />}
      {arrow && !external && <Icon name="chevron_right" size="sm" className="link-arrow" aria-hidden="true" />}
    </>
  )
  if (render) return render(inner, { className: cn('link', className), 'data-variant': variant })
  return (
    <a className={cn('link', className)} data-variant={variant} {...outward} {...rest}>
      {inner}
    </a>
  )
}
