import './Page.css'
import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { PageHeader } from '../../components/PageHeader'

/** The page shapes. Three come from the Material 3 canonical layouts, two are ours. */
type Shape = 'single' | 'list-detail' | 'feed' | 'board' | 'canvas'
/** The width scale. The three capped tiers are what the existing templates measured their way to. */
type Width = 'narrow' | 'reading' | 'default' | 'full'
type Align = 'start' | 'center'
/**
 * How much room the aside takes. `rail` is as wide as its own content and never
 * grows, which is what a panel collapsed to a single control needs; anything
 * that stretched it back to a column would be the panel again, without the
 * panel. Geometry, not state: the caller derives it from whatever it knows.
 */
type AsideWidth = 'default' | 'rail'
type Archetype =
  | 'overview' | 'list' | 'worklist' | 'analytical' | 'detail' | 'hub'
  | 'form' | 'wizard' | 'settings' | 'auth' | 'system'

/* The geometry each archetype defaults to. This table is the runtime half of
 * screen-specs/page-rules.json, which is the source of truth: it also records
 * which regions each archetype may and may not have, and why. `check:spec`
 * compares the two and fails on drift, so an archetype cannot mean one thing to
 * the gate and another on screen. One line per archetype, deliberately: the
 * check reads this shape. */
const PRESETS: Record<Archetype, { shape: Shape; width: Width; align?: Align }> = {
  overview: { shape: 'single', width: 'default' },
  list: { shape: 'single', width: 'default' },
  worklist: { shape: 'single', width: 'default' },
  analytical: { shape: 'single', width: 'default' },
  detail: { shape: 'single', width: 'default' },
  hub: { shape: 'single', width: 'default' },
  form: { shape: 'single', width: 'default' },
  wizard: { shape: 'single', width: 'default' },
  settings: { shape: 'single', width: 'reading' },
  auth: { shape: 'single', width: 'narrow', align: 'center' },
  system: { shape: 'single', width: 'narrow' },
}

type Props = {
  /**
   * The page's kind. It supplies the geometry so a screen does not restate what
   * its kind implies, and names the entry in screen-specs/page-rules.json that
   * says which regions this kind may and may not have.
   */
  archetype?: Archetype
  /** Page-level messages above the content: a degraded service, a pending action. */
  notices?: ReactNode
  /**
   * WHAT THE PAGE IS CALLED. Give it and the page builds its own `<PageHeader>`;
   * that is the common case, and eight blocks were each writing the same four
   * lines to do it by hand (2026-08-26). A ReactNode, because a record title
   * routinely carries a <Badge> or a <Tag> beside it.
   */
  title?: ReactNode
  /** What acts on the WHOLE page, in the header: edit, delete, a primary action. */
  actions?: ReactNode
  /** Up one level. Present makes the header carry a back control. */
  onBack?: () => void
  /** Accessible name for that control; PageHeader has a default. */
  backLabel?: string
  /** Tools that belong BESIDE the title rather than at the far end: a search
   *  field, a filter. `actions` is the far end. */
  inline?: ReactNode
  /**
   * A header you build yourself, for the pages the ingredients above do not
   * describe. Ignored when `title` is given: a page has one header — the same
   * rule `actions` and `footer` follow on <Modal>.
   */
  header?: ReactNode
  /** Navigation WITHIN the page: sections of one record, views of one collection. */
  subnav?: ReactNode
  /** What acts on the body as a whole: search, filters, batch actions, a view switcher. */
  toolbar?: ReactNode
  /** The body. */
  children?: ReactNode
  /** The second pane of a `list-detail` body. Ignored by every other shape. */
  detail?: ReactNode
  /** The trail up, for a page more than one level deep. Forwarded to
   *  `<PageHeader breadcrumb>`; an alternative to `onBack`, never both. */
  breadcrumb?: ReactNode
  /** A supporting pane beside the body. Wraps under it when the two stop fitting. */
  aside?: ReactNode
  /** How much room the aside takes: a column that shares the width, or a rail as wide as its content. */
  asideWidth?: AsideWidth
  /** A sticky bar carrying the commitment: submit, next, apply. */
  footerBar?: ReactNode
  /** Overrides the archetype's shape. Required when there is no archetype. */
  shape?: Shape
  /** Overrides the archetype's width. */
  width?: Width
  /** Overrides the archetype's alignment. `center` puts a short column mid-height. */
  align?: Align
  /**
   * The page stops scrolling and the panes scroll inside themselves, so the
   * header and a sticky table head hold still. Desktop only: a full-height
   * scroller on a phone puts the page under it out of reach.
   */
  panels?: boolean
  className?: string
}

/**
 * The PAGE mechanism: the regions a screen is made of and the shape its body
 * takes. Every page archetype is a preset over this one component rather than a
 * component of its own, so a shape the system has not met yet is composed from
 * system parts instead of from divs.
 *
 * Copy: the title is the page's own name in the reader's words. Nothing renders
 * under it — a line explaining the page is content, and content lives in
 * the body (the rule that removed `subtitle` from this system,
 * 2026-08-20).
 */
export function Page({
  archetype,
  notices,
  title,
  actions,
  onBack,
  backLabel,
  breadcrumb,
  inline,
  header,
  subnav,
  toolbar,
  children,
  detail,
  aside,
  asideWidth = 'default',
  footerBar,
  shape: shapeProp,
  width: widthProp,
  align: alignProp,
  panels,
  className,
}: Props) {
  const preset = archetype ? PRESETS[archetype] : undefined
  const shape = shapeProp ?? preset?.shape ?? 'single'
  const width = widthProp ?? preset?.width ?? 'default'
  const align = alignProp ?? preset?.align ?? 'start'
  /* A second pane only exists in the shape that has one. Rendering it anywhere
   * else would put a nameless column beside content that never asked for it. */
  const secondPane = shape === 'list-detail' ? detail : undefined

  return (
    /* The header sits INSIDE the capped column, not above it. At the default
     * width that is the same place it was; at `reading` and `narrow` it is the
     * only correct place, because a title at the page's far edge above a column
     * half that wide reads as two screens. SettingsPageTemplate and
     * WizardTemplate both argued their way to this independently, which is why
     * it is the one structure rather than a variant. */
    <div
      className={cn('page', className)}
      data-archetype={archetype}
      data-shape={shape}
      data-width={width}
      data-align={align}
      data-panels={panels || undefined}
      /* The seam between two panels, and the rules that flatten the corners
         against it, only exist when there IS a second pane. Unconditional, they
         squared off the trailing edge of a single column: a card cut flat
         against nothing. */
      data-has-aside={aside ? '' : undefined}
      data-aside-width={asideWidth}
    >
      {title !== undefined
        ? <PageHeader title={title} actions={actions} onBack={onBack} backLabel={backLabel} breadcrumb={breadcrumb} inline={inline} />
        : header}
      {/* The cap and the padding are separate elements on purpose: PageHeader
        * brings its own inline padding, so a shared wrapper would either double
        * it or leave the content out of line with the title. */}
      <div className="page-inner">
        {notices && <div className="page-notices">{notices}</div>}
        {subnav && <div className="page-subnav">{subnav}</div>}
        {toolbar && <div className="page-toolbar">{toolbar}</div>}
        {/* One wrapping row for the panes, not a grid with a breakpoint: this
          * element never sees the window (the shell's nav takes its width
          * first) and it cannot query itself, so the columns sit side by side
          * while both fit their floors and wrap when they stop. The lesson is
          * DetailPageTemplate's, learned the hard way. */}
        {/* A PANE THAT SCROLLS HAS TO BE REACHABLE FROM THE KEYBOARD.
          * `panels` is what turns these two into their own scroll containers,
          * and a scroll container that holds no focusable element cannot be
          * scrolled by anyone not using a mouse (axe: scrollable-region-
          * focusable, found on the site's own archetypes page, whose detail
          * pane is a paragraph and a frame — 2026-08-24). The tab stop is only
          * added in the arrangement that scrolls. */}
        <div className="page-main">
          {/* jsx-a11y says a tabIndex belongs on interactive elements; axe says
              a scrollable region must be focusable. Both rules are right about
              their own case and they meet here, on a pane that scrolls and
              holds no control. WAI's own guidance settles it: give the scroll
              container the tab stop. */}
          {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex */}
          <div className="page-body" tabIndex={panels ? 0 : undefined}>{children}</div>
          {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex */}
          {secondPane && <div className="page-detail" tabIndex={panels ? 0 : undefined}>{secondPane}</div>}
          {aside && <aside className="page-aside">{aside}</aside>}
        </div>
        {footerBar && <div className="page-footer-bar">{footerBar}</div>}
      </div>
    </div>
  )
}
