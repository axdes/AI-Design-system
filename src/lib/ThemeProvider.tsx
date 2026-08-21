import { createContext, use, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'

const THEMES = ['light', 'dark', 'system'] as const
type Theme = (typeof THEMES)[number]

function isTheme(v: unknown): v is Theme {
  return typeof v === 'string' && (THEMES as readonly string[]).includes(v)
}

type ThemeContextValue = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)
const STORAGE_KEY = 'theme'

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'system'
    const stored = localStorage.getItem(STORAGE_KEY)
    return isTheme(stored) ? stored : 'system'
  })
  const isFirstRunRef = useRef(true)

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'system') root.removeAttribute('data-theme')
    else root.setAttribute('data-theme', theme)
    /* Skip first-run write — initial value was just read from localStorage. */
    if (isFirstRunRef.current) { isFirstRunRef.current = false; return }
    localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  /* Multi-tab sync — mirror AuthProvider pattern. */
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return
      if (isTheme(e.newValue)) setTheme(e.newValue)
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const value = useMemo(() => ({ theme, setTheme }), [theme])

  return (
    <ThemeContext value={value}>
      {children}
    </ThemeContext>
  )
}

export function useTheme(): ThemeContextValue {
  const ctx = use(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
