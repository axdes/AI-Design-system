import './ProfilePage.css'
import { useMemo, useState, type ChangeEvent } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { AppShell } from '../shell/AppShell'
import { Avatar } from '../components/Avatar'
import { Button } from '../components/Button'
import { Card, CardTitle } from '../components/Card'
import { EditProfileModal } from './ProfilePage.EditModal'
import { Icon } from '../components/Icon'
import { PageHeader } from '../components/PageHeader'
import { Select } from '../components/Select'
import { Stack } from '../components/Layout'
import { Switch } from '../components/Switch'
import { LOCALES, LOCALE_LABELS, type Locale } from '../lib/i18n'
import { ACTIVITY_ICON, ACTIVITY_TONE, MOCK_ACTIVITY, type ActivityEvent } from '../data/activity'
import { ROLE_PERMISSIONS } from '../data/permissions'
import { useAuth } from '../lib/AuthProvider'
import { useTheme } from '../lib/ThemeProvider'
import { useToast } from '../lib/ToastProvider'

const MAX_FEED_ITEMS = 6

export function ProfilePage() {
  const { user, updateUser } = useAuth()
  const { theme, setTheme } = useTheme()
  const { toast } = useToast()
  const { t, i18n } = useTranslation()
  const [editOpen, setEditOpen] = useState(false)

  const activity = useMemo(() => {
    if (!user) return []
    return MOCK_ACTIVITY
      .filter((a) => a.actorId === user.id)
      .sort((a, b) => b.at.localeCompare(a.at))
      .slice(0, MAX_FEED_ITEMS)
  }, [user])

  if (!user) return null

  const permissions = ROLE_PERMISSIONS[user.role]

  const onAvatarFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        updateUser({ avatar: reader.result })
        toast({ tone: 'success', title: t('profile.toasts.saved') })
      }
    }
    reader.readAsDataURL(file)
    e.target.value = ''  /* allow re-selecting the same file */
  }

  return (
    <AppShell>
      <PageHeader
        title={t('profile.title')}
        actions={
          <Button onClick={() => setEditOpen(true)}>
            {t('profile.edit')}
          </Button>
        }
      />

      <div className="page-content">
        <Stack gap={4}>
          {/* === Profile header === */}
          <Card flat>
            <div className="profile-header">
              <div className="profile-avatar-wrap">
                <Avatar
                  name={user.fullName}
                  size="2xl"
                  src={user.avatar}
                />
                {/* The accessible name lives on the INPUT: aria-label is a
                    prohibited attribute on <label> itself (axe 4.13), and a
                    label wrapping a control names that control anyway. */}
                <label className="profile-avatar-upload">
                  <Icon name="edit" />
                  <input
                    type="file"
                    accept="image/*"
                    aria-label={t('profile.edit')}
                    onChange={onAvatarFile}
                  />
                </label>
              </div>
              <div className="profile-header-info">
                <h2 className="profile-header-name">{user.fullName}</h2>
                <div className="profile-header-role">{t(`role.${user.role}`)}</div>
                {user.email && <div className="profile-header-email">{user.email}</div>}
              </div>
            </div>
          </Card>

          {/* === Recent activity === */}
          <Card flat>
            <Stack gap={3}>
              <CardTitle as="h2">{t('profile.activity.title')}</CardTitle>
              {activity.length === 0 ? (
                <p className="activity-empty">{t('profile.activity.empty')}</p>
              ) : (
                <ul className="activity-list">
                  {activity.map((a) => <ActivityItem key={a.id} event={a} />)}
                </ul>
              )}
            </Stack>
          </Card>

          {/* === Permissions === */}
          <Card flat>
            <Stack gap={3}>
              <CardTitle as="h2">{t('profile.permissions.title')}</CardTitle>
              <ul className="permissions-list">
                {permissions.map((p) => (
                  <li key={p} className="permission-item">
                    <Icon name="check" />
                    <span>{t(`profile.permissions.${p}`)}</span>
                  </li>
                ))}
              </ul>
            </Stack>
          </Card>

          {/* === Preferences === */}
          <Card flat>
            <Stack gap={3}>
              <CardTitle as="h2">{t('profile.preferences.title')}</CardTitle>
              <div>
                <div className="preference-row">
                  <div className="preference-row-body">
                    <span className="preference-row-label">{t('profile.preferences.theme')}</span>
                    <span className="preference-row-desc">{t('profile.preferences.themeDesc')}</span>
                  </div>
                  <Switch
                    checked={theme === 'dark'}
                    onChange={(v) => setTheme(v ? 'dark' : 'light')}
                    label={t('profile.preferences.theme')}
                  />
                </div>

                <div className="preference-row">
                  <div className="preference-row-body">
                    <span className="preference-row-label">{t('profile.preferences.language')}</span>
                    <span className="preference-row-desc">{t('profile.preferences.languageDesc')}</span>
                  </div>
                  <Select
                    value={i18n.language as Locale}
                    onChange={(loc) => void i18n.changeLanguage(loc)}
                    options={LOCALES.map((loc) => ({ value: loc, label: LOCALE_LABELS[loc] }))}
                    label={t('profile.preferences.language')}
                  />
                </div>

              </div>
            </Stack>
          </Card>
        </Stack>
      </div>

      <EditProfileModal open={editOpen} onClose={() => setEditOpen(false)} />
    </AppShell>
  )
}

function ActivityItem({ event }: { event: ActivityEvent }) {
  const { t } = useTranslation()
  return (
    <li className="activity-item">
      <span className="activity-icon" data-tone={ACTIVITY_TONE[event.kind]}>
        <Icon name={ACTIVITY_ICON[event.kind]} />
      </span>
      <span className="activity-text">
        <Trans
          i18nKey={`profile.activity.event.${event.kind}`}
          values={{ subject: event.subject }}
          components={[<span key="s" className="activity-subject" />]}
        />
      </span>
      <span className="activity-time">{formatRelative(event.at, t)}</span>
    </li>
  )
}

/* Localized relative time — "just now / Xm / Xh / Xd / Xw ago".
 * Locale comes from the t function itself (i18next picks active language). */
function formatRelative(iso: string, t: (k: string, opts?: Record<string, unknown>) => string): string {
  const now = Date.now()
  const then = new Date(iso).getTime()
  const diffMin = Math.max(0, Math.floor((now - then) / 60_000))
  if (diffMin < 1) return t('profile.activity.time.justNow')
  if (diffMin < 60) return t('profile.activity.time.minutesAgo', { count: diffMin })
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return t('profile.activity.time.hoursAgo', { count: diffH })
  const diffD = Math.floor(diffH / 24)
  if (diffD < 7) return t('profile.activity.time.daysAgo', { count: diffD })
  const diffW = Math.floor(diffD / 7)
  return t('profile.activity.time.weeksAgo', { count: diffW })
}
