import './LoginPage.css'
import { type FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AuthTemplate } from '../blocks/AuthTemplate'
import { Field } from '../components/Field'
import { Input } from '../components/Input'
import { PasswordInput } from '@/components/PasswordInput'
import { ListItem } from '../components/ListItem'
import { SectionLabel } from '../components/SectionLabel'
import { Stack } from '../components/Layout'
import { DEMO_USERS, useAuth } from '../lib/AuthProvider'
import { ROUTES } from '../lib/routes'
import { Logo } from '../shell/Logo'

/* Built on `<AuthTemplate>`. It used to hand-roll the same card, and the two
 * drifted the moment they existed: the block had lost this screen's `100dvh`,
 * its fluid padding and its theme lock, and it announced a failed sign-in as a
 * status instead of an alert. Folding those back into the block and rebuilding
 * the screen on it is what a shared layer is for. What stays here is what is
 * genuinely this product's: the brand gradient, the logo, and the demo accounts. */
export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const result = login(username, password)
    if (result.success) {
      navigate(ROUTES.root)
    } else {
      setError(t('login.invalidCredentials'))
    }
  }

  const fillCredentials = (u: string, p: string) => {
    setUsername(u)
    setPassword(p)
    setError(null)
  }

  return (
    <AuthTemplate
      className="login-screen"
      themeLock="light"
      title={t('login.title')}
      brand={
        <span className="login-logo"><Logo size={44} /><span className="login-wordmark">AI Design System</span></span>
      }
      subtitle={t('login.subtitle')}
      error={error}
      submitLabel={t('login.submit')}
      onSubmit={handleSubmit}
      footer={
        import.meta.env.DEV && (
          <Stack gap={2}>
            <SectionLabel>{t('login.demoAccounts')}</SectionLabel>
            <Stack gap={1}>
              {DEMO_USERS.map((u) => (
                <ListItem key={u.username} onClick={() => fillCredentials(u.username, u.password)}>
                  <strong>{u.fullName}</strong>
                  <span> ({u.username} / {u.password})</span>
                </ListItem>
              ))}
            </Stack>
          </Stack>
        )
      }
    >
      <Field label={t('login.username')} htmlFor="username">
        <Input
          id="username"
          type="text"
          autoComplete="username"
          placeholder={t('login.usernamePlaceholder')}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
      </Field>

      <Field label={t('login.password')} htmlFor="password">
        <PasswordInput
          id="password"
          autoComplete="current-password"
          placeholder={t('login.passwordPlaceholder')}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </Field>
    </AuthTemplate>
  )
}
