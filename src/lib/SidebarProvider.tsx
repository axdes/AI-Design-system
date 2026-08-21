import { createContext, useCallback, use, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'

/* Sidebar has TWO independent dimensions of state:
 *   - collapsed (desktop): icon-only rail vs. full-width
 *   - mobileOpen (small screens): drawer hidden vs. overlayed
 * Desktop state is persisted; mobile state is ephemeral (closes on nav). */

type SidebarContextValue = {
  collapsed: boolean
  toggleCollapsed: () => void
  mobileOpen: boolean
  openMobile: () => void
  closeMobile: () => void
}

const SidebarContext = createContext<SidebarContextValue | null>(null)
const STORAGE_KEY = 'sidebar.collapsed'

function readPersisted(): boolean {
  return localStorage.getItem(STORAGE_KEY) === '1'
}

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState<boolean>(readPersisted)
  const [mobileOpen, setMobileOpen] = useState(false)
  const isFirstRunRef = useRef(true)

  useEffect(() => {
    /* Skip first-run write — initial value was just read from localStorage. */
    if (isFirstRunRef.current) { isFirstRunRef.current = false; return }
    localStorage.setItem(STORAGE_KEY, collapsed ? '1' : '0')
  }, [collapsed])

  const toggleCollapsed = useCallback(() => setCollapsed((v) => !v), [])
  const openMobile  = useCallback(() => setMobileOpen(true), [])
  const closeMobile = useCallback(() => setMobileOpen(false), [])

  const value = useMemo(
    () => ({ collapsed, toggleCollapsed, mobileOpen, openMobile, closeMobile }),
    [collapsed, toggleCollapsed, mobileOpen, openMobile, closeMobile],
  )

  return (
    <SidebarContext value={value}>
      {children}
    </SidebarContext>
  )
}

export function useSidebar() {
  const ctx = use(SidebarContext)
  if (!ctx) throw new Error('useSidebar must be used within SidebarProvider')
  return ctx
}

/**
 * The same context, but null outside a provider instead of throwing.
 *
 * For components that live BOTH inside an app shell and on their own: PageHeader
 * renders the mobile menu button when there is a drawer to open, and renders
 * nothing extra in the visual gallery or a golden example, where there is no
 * sidebar at all. Throwing there would make the component unrenderable outside
 * an app, which is exactly what a design system must not require.
 */
export function useSidebarOptional() {
  return use(SidebarContext)
}
