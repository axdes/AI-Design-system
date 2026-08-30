import "./AppLayout.css";
import { useMemo, useState, type ReactNode } from "react";
import { SidebarContext } from "../../lib/SidebarProvider";

/**
 * Where the navigation sits, and it is a real choice rather than a skin.
 *
 * `rail` is a column attached to the content: the two read as one composition
 * and the page surface runs behind both. `float` detaches it into a card with
 * air around it, which suits a product whose pages are documents rather than
 * desks. `top` is a horizontal bar and no side column, which is what a shallow
 * navigation earns — a side rail holding four links spends a sixth of the
 * screen saying very little. `none` is a screen with no navigation at all:
 * sign-in, a status page, a focused reading view.
 */
type Arrangement = 'rail' | 'float' | 'top' | 'none';

type Props = {
  /** The navigation (e.g. a <SideNav/>). Ignored when `layout` is "none". */
  nav?: ReactNode;
  children: ReactNode;
  /** How the shell is arranged: where the navigation sits, and whether it is attached to the content or detached from it. */
  arrangement?: Arrangement;
  /** Mobile only: whether the nav drawer is open. */
  navOpen?: boolean;
  /** Mobile only: called when the backdrop is clicked. */
  onNavClose?: () => void;
  /** Mobile only, and REQUIRED when `navOpen` is passed: what the drawer button
   *  in the header calls. A controlled shell with no way to open is a phone with
   *  no navigation, which is the failure <NavDrawerButton> exists to prevent. */
  onNavOpen?: () => void;
};

/** The application shell: navigation and a scrolling main, in one of four
 *  arrangements. Routing-agnostic — pass any nav in the `nav` slot. Below the
 *  drawer breakpoint a side arrangement becomes an overlay drawer toggled by
 *  `navOpen`; `top` and `none` have nothing to drawer and stay as they are. */
export function AppLayout({ nav, children, arrangement = 'rail', navOpen, onNavClose, onNavOpen }: Props) {
  /* THE SHELL PROVIDES THE DRAWER, so the button it ships can open it.
   *
   * <NavDrawerButton> — which <PageHeader> renders on every screen with no back
   * arrow — asks a SidebarProvider to open the drawer, and renders NOTHING when
   * there is none. <AppLayout> moved the rail from its own `navOpen` prop. Two
   * halves of one mechanism, with nothing between them: an app that mounted the
   * shell and never thought about a provider got a phone with no way to reach
   * the navigation, which is the exact failure NavDrawerButton was written to
   * fix. This system's own site was that app (measured 2026-08-30: the button
   * on screen belonged to a rendered EXAMPLE, and the shell had none).
   *
   * The shell owns it now. `navOpen` still wins when it is passed, so a product
   * that drives the drawer from its own state keeps doing so; everything else
   * gets a drawer that opens because the parts arrived together. */
  const [selfOpen, setSelfOpen] = useState(false);
  const controlled = navOpen !== undefined;
  const open = controlled ? !!navOpen : selfOpen;
  const close = () => { if (controlled) onNavClose?.(); else setSelfOpen(false); };
  const sidebar = useMemo(() => ({
    collapsed: false,
    toggleCollapsed: () => undefined,
    mobileOpen: open,
    openMobile: () => { if (controlled) onNavOpen?.(); else setSelfOpen(true); },
    closeMobile: close,
  /* eslint-disable-next-line react-hooks/exhaustive-deps -- `close` is recreated every render by design; the identity that matters is `open`. */
  }), [open, controlled]);

  const showNav = arrangement !== 'none' && !!nav;
  return (
    <SidebarContext value={sidebar}>
    <div className="app-layout" data-arrangement={arrangement} data-nav-open={(open && showNav) || undefined}>
      {open && showNav && (
        <button type="button" className="app-layout-backdrop" aria-label="Close menu" onClick={close} />
      )}
      {/* The cap lives on this inner track, not on the outer element, so the page
        * surface still reaches both screen edges while the composition itself
        * stops growing and centres. Capping the content column alone leaves the
        * nav against the edge and the content reading right of centre. */}
      <div className="app-layout-inner">
        {/* One control, in the shell, so no screen has to remember it. */}
        {showNav && <div className="app-layout-nav">{nav}</div>}
        <main id="main" className="app-layout-main">{children}</main>
      </div>
    </div>
    </SidebarContext>
  );
}
