import './Sidebar.css'
import { Link, NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { cn } from '../../lib/cn'
import { useAuth, type Role } from '../../lib/AuthProvider'
import { useSidebar } from '../../lib/SidebarProvider'
import { ROUTES } from '../../lib/routes'
import { Logo } from '../Logo'
import { Icon, type IconName } from '../../components/Icon'
import { Tooltip } from '../../components/Tooltip'
import { UserMenu } from '../UserMenu'

type MenuItem = {
  labelKey: string
  icon: IconName
  route: string
  section: 'workspace' | 'admin'
  roles: Role[]
}

const MENU: MenuItem[] = [
  { labelKey: 'sidebar.assistant',    icon: 'message',            route: ROUTES.assistant,     section: 'workspace', roles: ['admin', 'brand-manager', 'content-creator', 'editor'] },
  { labelKey: 'sidebar.myContent',    icon: 'folder',             route: ROUTES.content,       section: 'workspace', roles: ['admin', 'brand-manager', 'content-creator', 'editor'] },
  { labelKey: 'sidebar.forReview',    icon: 'rate_review',        route: ROUTES.forReview,     section: 'workspace', roles: ['admin', 'brand-manager', 'editor'] },
  { labelKey: 'sidebar.files',        icon: 'insert_drive_file',  route: ROUTES.files,         section: 'workspace', roles: ['admin'] },
  { labelKey: 'sidebar.patterns',     icon: 'dashboard',          route: ROUTES.patterns,      section: 'admin',     roles: ['admin', 'brand-manager'] },
  { labelKey: 'sidebar.contentTypes', icon: 'dashboard',          route: ROUTES.contentTypes,  section: 'admin',     roles: ['admin', 'brand-manager'] },
  { labelKey: 'sidebar.users',        icon: 'group',              route: ROUTES.users,         section: 'admin',     roles: ['admin'] },
]

export function Sidebar() {
  const { user } = useAuth()
  const { t } = useTranslation()
  const { collapsed, toggleCollapsed } = useSidebar()
  if (!user) return null

  const items = MENU.filter((m) => m.roles.includes(user.role))

  return (
    <aside className="sidebar" aria-label={t('sidebar.workspace')}>
      {/* Logo sits on its own at the top. Expanded it is the way home;
          collapsed it is the way BACK OUT of collapse — the biggest target on
          the rail opens the rail, and home is one more press away. */}
      <div className="sidebar-header">
        {collapsed ? (
          <Tooltip content={t('sidebar.expand')} placement="end">
            <button
              type="button"
              className="sidebar-logo-link sidebar-logo-mark"
              aria-label={t('sidebar.expand')}
              onClick={toggleCollapsed}
            >
              <Logo size={28} />
            </button>
          </Tooltip>
        ) : (
          <Link to={ROUTES.root} className="sidebar-logo-link" aria-label="Home">
            <span className="sidebar-logo sidebar-logo-full">
              <Logo />
              <span className="sidebar-wordmark">AI Design System</span>
            </span>
          </Link>
        )}
      </div>

      {/* Rail = nav + collapse. Collapsed: this block is the centered pill. */}
      <div className="sidebar-rail">
        <nav className="sidebar-menu">
          {items.map((item) => {
            const labelText = t(item.labelKey)
            return (
              <Tooltip key={item.route} content={labelText} placement="end" enabled={collapsed}>
                <NavLink
                  to={item.route}
                  className={({ isActive }) => cn('sidebar-item', isActive && 'is-active')}
                >
                  <Icon name={item.icon} size="md" />
                  <span className="sidebar-item-label">{labelText}</span>
                </NavLink>
              </Tooltip>
            )
          })}

          {/* Collapse is just another row in the menu list. */}
          <Tooltip
            content={collapsed ? t('sidebar.expand') : t('sidebar.collapse')}
            placement="end"
            enabled={collapsed}
          >
            <button
              type="button"
              className="sidebar-item sidebar-toggle"
              aria-label={collapsed ? t('sidebar.expand') : t('sidebar.collapse')}
              onClick={toggleCollapsed}
            >
              <Icon name={collapsed ? 'arrow_right_to_line' : 'arrow_left_to_line'} size="md" />
              <span className="sidebar-item-label">
                {collapsed ? t('sidebar.expand') : t('sidebar.collapse')}
              </span>
            </button>
          </Tooltip>
        </nav>
      </div>

      {/* Login stays at the very bottom, no pill. */}
      <div className="sidebar-footer">
        <UserMenu />
      </div>
    </aside>
  )
}
