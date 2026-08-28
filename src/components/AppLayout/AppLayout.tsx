import "./AppLayout.css";
import { type ReactNode } from "react";

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
};

/** The application shell: navigation and a scrolling main, in one of four
 *  arrangements. Routing-agnostic — pass any nav in the `nav` slot. Below the
 *  drawer breakpoint a side arrangement becomes an overlay drawer toggled by
 *  `navOpen`; `top` and `none` have nothing to drawer and stay as they are. */
export function AppLayout({ nav, children, arrangement = 'rail', navOpen, onNavClose }: Props) {
  const showNav = arrangement !== 'none' && !!nav;
  return (
    <div className="app-layout" data-arrangement={arrangement} data-nav-open={(navOpen && showNav) || undefined}>
      {navOpen && showNav && (
        <button type="button" className="app-layout-backdrop" aria-label="Close menu" onClick={onNavClose} />
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
  );
}
