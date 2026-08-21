import { createContext, useCallback, use, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'

export const ROLES = ['admin', 'brand-manager', 'content-creator', 'editor'] as const
export type Role = (typeof ROLES)[number]

export type User = {
  id: string
  username: string
  fullName: string
  role: Role
  email?: string
  /** Data URL or absolute URL. Optional. */
  avatar?: string
}

type Credential = User & { password: string }

/* Public demo credentials — this is a showcase app with no real backend.
 * The passwords here are intentionally visible in the login screen (DEV) and
 * are not secrets. Do not add real credentials to this list. */
/* eslint-disable sonarjs/no-hardcoded-passwords -- public demo credentials, shown on the login screen of a showcase app with no backend (see the comment above) */
export const DEMO_USERS: Credential[] = [
  { id: 'u1', username: 'mohammed', password: 'password123', fullName: 'Mohammed Al-Khalid', role: 'admin',           email: 'mohammed@example.com' },
  { id: 'u2', username: 'sarah',    password: 'password123', fullName: 'Sarah Al-Mansouri',  role: 'brand-manager',   email: 'sarah@example.com' },
  { id: 'u3', username: 'ahmed',    password: 'password123', fullName: 'Ahmed Al-Saud',      role: 'content-creator', email: 'ahmed@example.com' },
  { id: 'u4', username: 'fatima',   password: 'password123', fullName: 'Fatima Al-Zahra',    role: 'editor',          email: 'fatima@example.com' },
]
/* eslint-enable sonarjs/no-hardcoded-passwords */

type Updatable = Pick<User, 'fullName' | 'username' | 'email' | 'avatar'>

type AuthContextValue = {
  user: User | null
  login: (username: string, password: string) => { success: boolean; error?: string }
  logout: () => void
  updateUser: (patch: Partial<Updatable>) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)
const STORAGE_KEY = 'auth.user'

function isValidUser(x: unknown): x is User {
  if (typeof x !== 'object' || x === null) return false
  const u = x as Partial<User>
  return (
    typeof u.id === 'string' &&
    typeof u.username === 'string' &&
    typeof u.fullName === 'string' &&
    typeof u.role === 'string' &&
    (ROLES as readonly string[]).includes(u.role) &&
    (u.email === undefined || typeof u.email === 'string') &&
    (u.avatar === undefined || typeof u.avatar === 'string')
  )
}

function readPersistedUser(): User | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    return isValidUser(parsed) ? parsed : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(readPersistedUser)
  const isFirstRunRef = useRef(true)

  /* Skip the very first effect run — the initial value came from localStorage
   * already, so re-writing it would be redundant (and noisy under StrictMode). */
  useEffect(() => {
    if (isFirstRunRef.current) { isFirstRunRef.current = false; return }
    if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
    else localStorage.removeItem(STORAGE_KEY)
  }, [user])

  /* Multi-tab sync: logout in one tab logs out the others.
   * Parse e.newValue directly — single source of truth, no race with another
   * tab's write back to localStorage. */
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return
      if (!e.newValue) { setUser(null); return }
      try {
        const parsed: unknown = JSON.parse(e.newValue)
        if (isValidUser(parsed)) setUser(parsed)
      } catch { /* malformed payload — ignore */ }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const login = useCallback<AuthContextValue['login']>((username, password) => {
    const found = DEMO_USERS.find(
      (u) => u.username === username.trim().toLowerCase() && u.password === password,
    )
    if (!found) return { success: false, error: 'Invalid username or password' }
    const { password: _password, ...safe } = found
    setUser(safe)
    return { success: true }
  }, [])

  const logout = useCallback(() => setUser(null), [])

  const updateUser = useCallback<AuthContextValue['updateUser']>((patch) => {
    setUser((prev) => (prev ? { ...prev, ...patch } : prev))
  }, [])

  const value = useMemo(
    () => ({ user, login, logout, updateUser }),
    [user, login, logout, updateUser],
  )

  return <AuthContext value={value}>{children}</AuthContext>
}

export function useAuth() {
  const ctx = use(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
