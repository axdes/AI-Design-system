import './ListCluster.css'
import type { ReactNode, Ref } from 'react'

/* Centered "welcome" list: big title + subtitle, the tile grid, a large CTA
 * under the cards. Shown while everything fits the viewport (useSimpleFit).
 * ONE component for Workshops, Transcripts and Discovery — the three lists
 * must always look and behave the same.
 *
 * Copy: the hero title welcomes and names the product; the subtitle says in
 * one sentence what a first-time reader can do here. This is the one place a
 * line under a title is allowed, and it earns it by being the whole screen. */
export function ListCluster({
  mark,
  title,
  subtitle,
  cta,
  clusterRef,
  children,
}: {
  /** The app's brand mark, above the title. Optional: the ecosystem symbol pattern (a light
   *  standalone glyph per app) was hand-rolled in a product hero because this block had nowhere
   *  to put one, which is how a page template stops being adopted. */
  mark?: ReactNode
  /** ReactNode, like PageHeader's: a welcome title routinely carries the product name in the brand
   *  gradient ("Welcome to <span class=brand-word>Razmova</span>"), and typing this as a string is
   *  what sent the first product that wanted one off to hand-roll its own hero. */
  title: ReactNode
  /** Optional. A title that already says it needs no line under it, and forcing one produced
   *  screens explaining their own heading back to the reader. */
  subtitle?: string
  cta: ReactNode
  clusterRef?: Ref<HTMLDivElement>
  children: ReactNode
}) {
  return (
    <div className="list-cluster" data-cards ref={clusterRef}>
      {/* A div, not a <header>: outside a sectioning element `<header>` IS the
          page banner landmark, and this sits on a page that already has one in
          `<PageHeader>`. Two banners is an axe violation and, more to the point,
          a screen reader announcing the same landmark twice. Caught by the
          golden example of <AdaptiveListPage>, which renders both together. */}
      <div className="list-cluster-head">
        {mark}
        <h1 className="list-cluster-title">{title}</h1>
        {subtitle && <p className="list-cluster-subtitle">{subtitle}</p>}
      </div>
      {children}
      <div className="list-cluster-cta">{cta}</div>
    </div>
  )
}
