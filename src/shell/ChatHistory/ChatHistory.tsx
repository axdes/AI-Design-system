import './ChatHistory.css'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Icon, type IconName } from '../../components/Icon'
import { IconButton } from '../../components/IconButton'
import { SectionLabel } from '../../components/SectionLabel'
import { Dropdown, DropdownItem } from '../../components/Dropdown'
import { Tooltip } from '../../components/Tooltip'
import { useToast } from '../../lib/ToastProvider'

export type ChatHistoryItem = { id: string; icon: IconName; title: string; active?: boolean }
/** `label` already translated; omit for the implicit "today" group. */
export type ChatHistoryGroup = { label?: string; items: readonly ChatHistoryItem[] }

type Props = {
  groups: readonly ChatHistoryGroup[]
  collapsed: boolean
  onToggleCollapse: () => void
  onNew?: () => void
  onSelect?: (id: string) => void
}

/* Chat history sidebar: All-Chats scope + search/new + grouped list. Collapses
 * to an icon rail via its own `data-collapsed`. Shared by chat surfaces. */
const ROW_ACTIONS: { key: 'pin' | 'rename' | 'archive' | 'delete'; icon: IconName; danger?: boolean }[] = [
  { key: 'pin', icon: 'pin' },
  { key: 'rename', icon: 'edit' },
  { key: 'archive', icon: 'archive' },
  { key: 'delete', icon: 'delete', danger: true },
]

export function ChatHistory({ groups, collapsed, onToggleCollapse, onNew, onSelect }: Props) {
  const { t } = useTranslation()
  const { toast } = useToast()
  const [query, setQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)

  const closeSearch = () => { setSearchOpen(false); setQuery('') }

  const q = query.trim().toLowerCase()
  const visibleGroups = q
    ? groups
        .map((g) => ({ ...g, items: g.items.filter((i) => i.title.toLowerCase().includes(q)) }))
        .filter((g) => g.items.length > 0)
    : groups
  const noResults = q.length > 0 && visibleGroups.length === 0

  return (
    <aside className="chat-sidebar" data-collapsed={collapsed || undefined} aria-label={t('agent.allChats')}>
      <div className="chat-sidebar-header">
        <span className="chat-sidebar-title">{t('agent.allChats')}</span>
        <div className="chat-sidebar-actions">
          <Tooltip content={t('agent.search')}>
            <IconButton icon="search" size="md" className="chat-sidebar-search" aria-label={t('agent.search')} onClick={() => setSearchOpen(true)} />
          </Tooltip>
          <Tooltip content={t('agent.newChat')}>
            <IconButton icon="add" size="md" aria-label={t('agent.newChat')} onClick={onNew} />
          </Tooltip>
          <Tooltip content={t('agent.menu')}>
            <IconButton
              icon="menu"
              size="md"
              className="chat-sidebar-toggle"
              aria-label={t('agent.menu')}
              aria-expanded={!collapsed}
              onClick={onToggleCollapse}
            />
          </Tooltip>
        </div>

        {/* Full-width overlay search: filter + query in one place. */}
        {searchOpen && (
          <div className="chat-search" role="search">
            <Icon name="search" className="chat-search-icon" />
            <input
              className="chat-search-field"
              // eslint-disable-next-line jsx-a11y/no-autofocus -- the search field is opened explicitly by the user; focusing it is expected
              autoFocus
              type="search"
              placeholder={t('agent.search')}
              aria-label={t('agent.search')}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Escape') closeSearch() }}
            />
            <Dropdown
              className="chat-search-filter"
              align="end"
              trigger={({ isOpen, ...props }) => (
                <IconButton icon="tune" size="sm" variant="quiet" aria-label={t('agent.filter')} data-open={isOpen || undefined} {...props} />
              )}
            >
              <DropdownItem selected>{t('agent.allChats')}</DropdownItem>
            </Dropdown>
            <Tooltip content={t('a11y.clear')}>
              <IconButton icon="close" size="sm" variant="quiet" aria-label={t('a11y.clear')} onClick={closeSearch} />
            </Tooltip>
          </div>
        )}
      </div>

      <nav className="chat-list">
        {noResults && <p className="chat-list-empty">{t('agent.noResults')}</p>}
        {visibleGroups.map((grp, i) => (
          // eslint-disable-next-line @eslint-react/no-array-index-key -- static, append-only list; index is a stable key here
          <div key={grp.label ?? `today-${i}`} className="chat-list-group">
            {grp.label && <SectionLabel className="chat-list-label">{grp.label}</SectionLabel>}
            {grp.items.map((item) => (
              <div key={item.id} className="chat-item" data-active={item.active || undefined}>
                <button
                  type="button"
                  className="chat-item-main"
                  title={item.title}
                  onClick={() => onSelect?.(item.id)}
                >
                  <Icon name={item.icon} size="md" />
                  <span className="chat-item-label">{item.title}</span>
                </button>
                <Dropdown
                  className="chat-item-menu"
                  align="end"
                  trigger={({ isOpen, ...props }) => (
                    <IconButton
                      icon="more_vert"
                      size="sm"
                      variant="quiet"
                      aria-label={t('agent.menu')}
                      data-open={isOpen || undefined}
                      {...props}
                    />
                  )}
                >
                  {ROW_ACTIONS.map((a) => (
                    <DropdownItem
                      key={a.key}
                      icon={a.icon}
                      tone={a.danger ? 'danger' : undefined}
                      // eslint-disable-next-line sonarjs/no-nested-functions -- inline handler in a mapped row-action menu
                      onClick={() => toast({ tone: a.danger ? 'danger' : 'info', title: t(`agent.rowMenu.${a.key}`), description: item.title })}
                    >
                      {t(`agent.rowMenu.${a.key}`)}
                    </DropdownItem>
                  ))}
                </Dropdown>
              </div>
            ))}
          </div>
        ))}
      </nav>
    </aside>
  )
}
