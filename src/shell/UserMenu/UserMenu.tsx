import './UserMenu.css'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../lib/AuthProvider'
import { useToast } from '../../lib/ToastProvider'
import { ROUTES } from '../../lib/routes'
import { Avatar } from '../../components/Avatar'
import { Dropdown, DropdownItem } from '../../components/Dropdown'

export function UserMenu() {
  const { user, logout } = useAuth()
  const { t } = useTranslation()
  const { toast } = useToast()
  const navigate = useNavigate()

  if (!user) return null

  return (
    <Dropdown
      className="user-menu"
      align="start"
      trigger={({ isOpen, ...triggerProps }) => (
        <button
          type="button"
          className="user-menu-trigger"
          data-open={isOpen || undefined}
          aria-label={t('user.menu')}
          {...triggerProps}
        >
          <Avatar name={user.fullName} src={user.avatar} size="md" className="user-menu-avatar" />
          <span className="user-menu-trigger-text">
            <span className="user-menu-trigger-name">{user.fullName}</span>
            <span className="user-menu-trigger-role">
              {t(`role.${user.role}`, { defaultValue: user.role })}
            </span>
          </span>
        </button>
      )}
    >
      <DropdownItem icon="person" onClick={() => navigate(ROUTES.profile)}>
        {t('profile.title')}
      </DropdownItem>

      {/* Operator availability lives with the operator, not in the header row. */}
      <DropdownItem
        icon="mic"
        onClick={() => toast({ tone: 'info', title: t('console.toast.unavailable') })}
      >
        {t('console.setUnavailable')}
      </DropdownItem>

      <DropdownItem icon="logout" onClick={logout}>
        {t('user.signOut')}
      </DropdownItem>
    </Dropdown>
  )
}
