import "./AppLayout.css";
import { type ReactNode } from "react";

type Props = {
  /** The navigation rail (e.g. a <SideNav/>). Rendered in a sticky, full-height column. */
  nav: ReactNode;
  children: ReactNode;
  /** Mobile only: whether the nav drawer is open. */
  navOpen?: boolean;
  /** Mobile only: called when the backdrop is clicked. */
  onNavClose?: () => void;
};

/** The application shell: a sticky full-height nav column beside a scrolling main.
 *  Routing-agnostic — pass any nav in the `nav` slot. Below the drawer breakpoint
 *  the nav becomes an overlay drawer toggled by `navOpen`. */
export function AppLayout({ nav, children, navOpen, onNavClose }: Props) {
  return (
    <div className="app-layout" data-nav-open={navOpen || undefined}>
      {navOpen && (
        <button type="button" className="app-layout-backdrop" aria-label="Close menu" onClick={onNavClose} />
      )}
      {/* One control, in the shell, so no screen has to remember it. */}
      <div className="app-layout-nav">{nav}</div>
      <main id="main" className="app-layout-main">{children}</main>
    </div>
  );
}
