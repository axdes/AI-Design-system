import { useTranslation } from 'react-i18next'
import { useTheme } from '../../lib/ThemeProvider'
import { Button } from '../../components/Button'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const { t } = useTranslation()
  const next = theme === 'dark' ? 'light' : 'dark'
  return (
    <Button variant="secondary" onClick={() => setTheme(next)}>
      {t(`theme.${next}`)}
    </Button>
  )
}
