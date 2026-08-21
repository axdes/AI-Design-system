import { lazy, Suspense, type ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/AuthProvider'
import { ErrorBoundary } from './lib/ErrorBoundary'
import { SidebarProvider } from './lib/SidebarProvider'
import { ThemeProvider } from './lib/ThemeProvider'
import { ToastProvider } from './lib/ToastProvider'
import { ROUTES } from './lib/routes'

const ContentLibraryPage = lazy(() =>
  import('./layouts/ContentLibraryPage').then((m) => ({ default: m.ContentLibraryPage })),
)
const ContentDetailPage = lazy(() =>
  import('./layouts/ContentDetailPage').then((m) => ({ default: m.ContentDetailPage })),
)
const LoginPage = lazy(() =>
  import('./layouts/LoginPage').then((m) => ({ default: m.LoginPage })),
)
const ProfilePage = lazy(() =>
  import('./layouts/ProfilePage').then((m) => ({ default: m.ProfilePage })),
)
const ContentPatternsPage = lazy(() =>
  import('./layouts/ContentPatternsPage').then((m) => ({ default: m.ContentPatternsPage })),
)
const Playground = lazy(() =>
  import('./layouts/Playground').then((m) => ({ default: m.Playground })),
)
const AssistantPage = lazy(() =>
  import('./layouts/AssistantPage').then((m) => ({ default: m.AssistantPage })),
)
const UsersPage = lazy(() =>
  import('./layouts/UsersPage').then((m) => ({ default: m.UsersPage })),
)
const PlaceholderPage = lazy(() =>
  import('./layouts/PlaceholderPage').then((m) => ({ default: m.PlaceholderPage })),
)
const ForReviewPage = lazy(() =>
  import('./layouts/ForReviewPage').then((m) => ({ default: m.ForReviewPage })),
)

function RequireAuth({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  if (!user) return <Navigate to={ROUTES.login} replace />
  return <>{children}</>
}

function RedirectIfAuth({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  if (user) return <Navigate to={ROUTES.content} replace />
  return <>{children}</>
}

export function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
          <SidebarProvider>
          <BrowserRouter>
            <Suspense fallback={null}>
              <Routes>
                <Route path={ROUTES.login}      element={<RedirectIfAuth><LoginPage /></RedirectIfAuth>} />
                <Route path={ROUTES.content}     element={<RequireAuth><ContentLibraryPage /></RequireAuth>} />
                <Route path={ROUTES.contentItem} element={<RequireAuth><ContentDetailPage /></RequireAuth>} />
                <Route path={ROUTES.profile}    element={<RequireAuth><ProfilePage /></RequireAuth>} />
                <Route path={ROUTES.agent}      element={<Navigate to={ROUTES.assistant} replace />} />
                <Route path={ROUTES.assistant}  element={<RequireAuth><AssistantPage /></RequireAuth>} />
                <Route path={ROUTES.forReview}    element={<RequireAuth><ForReviewPage /></RequireAuth>} />
                <Route path={ROUTES.files}        element={<RequireAuth><PlaceholderPage name="files" icon="insert_drive_file" ctaIcon="add" /></RequireAuth>} />
                <Route path={ROUTES.contentTypes} element={<RequireAuth><PlaceholderPage name="contentTypes" icon="dashboard" ctaIcon="add" /></RequireAuth>} />
                <Route path={ROUTES.users}        element={<RequireAuth><UsersPage /></RequireAuth>} />
                <Route path={ROUTES.patterns}   element={<RequireAuth><ContentPatternsPage /></RequireAuth>} />
                <Route path={ROUTES.playground} element={<Playground />} />
                <Route path={ROUTES.root}       element={<Navigate to={ROUTES.content} replace />} />
                <Route path="*"                 element={<Navigate to={ROUTES.content} replace />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
          </SidebarProvider>
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}
