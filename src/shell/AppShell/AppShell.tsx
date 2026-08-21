import './AppShell.css'
import { useEffect, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { useSidebar } from '../../lib/SidebarProvider'
import { useMediaQuery } from '../../lib/useMediaQuery'
import { Sidebar } from '../Sidebar'

export function AppShell({ children }: { children: ReactNode }) {
  const { collapsed, mobileOpen, closeMobile } = useSidebar()
  const location = useLocation()
  /* Below the drawer breakpoint the sidebar is a full overlay — never apply the
   * collapsed (icon-rail) state there, so none of its styles leak into the drawer. */
  const isMobile = useMediaQuery('(max-width: 48rem)')

  /* Close mobile drawer on navigation. */
  useEffect(() => { closeMobile() }, [location.pathname, closeMobile])

  return (
    <div
      className="app-shell"
      data-sidebar-collapsed={(collapsed && !isMobile) || undefined}
      data-sidebar-mobile-open={mobileOpen || undefined}
    >
      {mobileOpen && (
        <button
          type="button"
          className="app-shell-backdrop"
          aria-label="Close menu"
          onClick={closeMobile}
        />
      )}
      {/* One control, in the shell, so no screen has to remember it. */}
      <Sidebar />
      <main id="main" className="app-main">{children}</main>
    </div>
  )
}
