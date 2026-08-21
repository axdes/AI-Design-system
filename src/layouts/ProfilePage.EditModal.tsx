import { useEffect, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert } from '../components/Alert'
import { Button } from '../components/Button'
import { Input } from '../components/Input'
import { PasswordInput } from '@/components/PasswordInput'
import { Label } from '../components/Label'
import { Modal } from '../components/Modal'
import { Stack } from '../components/Layout'
import { Tab, TabList, TabPanel, Tabs } from '../components/Tabs'
import { useAuth } from '../lib/AuthProvider'
import { useToast } from '../lib/ToastProvider'

type Props = {
  open: boolean
  onClose: () => void
}

export function EditProfileModal({ open, onClose }: Props) {
  const { user, updateUser } = useAuth()
  const { t } = useTranslation()
  const { toast } = useToast()
  const [tab, setTab] = useState<'personal' | 'password'>('personal')

  /* Form state — re-seeded from user when modal opens. */
  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !user) return
    setFullName(user.fullName)
    setUsername(user.username)
    setEmail(user.email ?? '')
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setError(null)
    setTab('personal')
  }, [open, user])

  if (!user) return null

  const onSubmitPersonal = (e: FormEvent) => {
    e.preventDefault()
    updateUser({ fullName: fullName.trim(), username: username.trim(), email: email.trim() })
    toast({ tone: 'success', title: t('profile.toasts.saved') })
    onClose()
  }

  const onSubmitPassword = (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (newPassword.length < 8) {
      setError(t('profile.toasts.passwordShort'))
      return
    }
    if (newPassword !== confirmPassword) {
      setError(t('profile.toasts.passwordMismatch'))
      return
    }
    /* No real backend — just acknowledge. */
    toast({ tone: 'success', title: t('profile.toasts.passwordChanged') })
    onClose()
  }

  const isPersonal = tab === 'personal'

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('profile.edit')}
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>{t('profile.cancel')}</Button>
          <Button
            type="submit"
            form={isPersonal ? 'edit-personal' : 'edit-password'}
          >
            {t('profile.save')}
          </Button>
        </>
      }
    >
      <Tabs value={tab} onChange={(v) => setTab(v as 'personal' | 'password')}>
        <TabList label={t('profile.edit')}>
          <Tab value="personal">{t('profile.tabs.personal')}</Tab>
          <Tab value="password">{t('profile.tabs.password')}</Tab>
        </TabList>

        <TabPanel value="personal">
          <form id="edit-personal" onSubmit={onSubmitPersonal}>
            <Stack gap={3}>
              <div className="field-group">
                <Label htmlFor="ep-fullname">{t('profile.fields.fullName')}</Label>
                <Input
                  id="ep-fullname"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
              <div className="field-group">
                <Label htmlFor="ep-username">{t('profile.fields.username')}</Label>
                <Input
                  id="ep-username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              <div className="field-group">
                <Label htmlFor="ep-email">{t('profile.fields.email')}</Label>
                <Input
                  id="ep-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </Stack>
          </form>
        </TabPanel>

        <TabPanel value="password">
          <form id="edit-password" onSubmit={onSubmitPassword}>
            <Stack gap={3}>
              {error && <Alert tone="danger" role="alert">{error}</Alert>}
              <div className="field-group">
                <Label htmlFor="ep-current">{t('profile.fields.currentPassword')}</Label>
                <PasswordInput
                  id="ep-current"
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </div>
              <div className="field-group">
                <Label htmlFor="ep-new">{t('profile.fields.newPassword')}</Label>
                <PasswordInput
                  id="ep-new"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
              <div className="field-group">
                <Label htmlFor="ep-confirm">{t('profile.fields.confirmPassword')}</Label>
                <PasswordInput
                  id="ep-confirm"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  invalid={
                    confirmPassword.length > 0 && confirmPassword !== newPassword
                  }
                />
              </div>
            </Stack>
          </form>
        </TabPanel>
      </Tabs>
    </Modal>
  )
}
