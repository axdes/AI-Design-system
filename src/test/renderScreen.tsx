/* Render a full LAYOUT screen the way the app mounts it: router, auth (signed
 * in as the admin demo user unless told otherwise), toasts, sidebar. The
 * behaviours the screen specs pin are proven through THIS — a screen promise
 * tested without the screen's own providers proves a different screen. */
import { type ReactElement } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { render } from '@testing-library/react'
import { AuthProvider, DEMO_USERS } from '@/lib/AuthProvider'
import { SidebarProvider } from '@/lib/SidebarProvider'
import { ToastProvider } from '@/lib/ToastProvider'

export function renderScreen(ui: ReactElement, { userId = 'u1' }: { userId?: string } = {}) {
  const user = DEMO_USERS.find((u) => u.id === userId)
  if (user) {
    const { password: _pw, ...safe } = user
    localStorage.setItem('auth.user', JSON.stringify(safe))
  } else {
    localStorage.removeItem('auth.user')
  }
  return render(
    <ToastProvider>
      <AuthProvider>
        <SidebarProvider>
          <MemoryRouter>{ui}</MemoryRouter>
        </SidebarProvider>
      </AuthProvider>
    </ToastProvider>,
  )
}
