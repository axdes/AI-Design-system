import './ContentLibraryPage.css'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AppShell } from '../shell/AppShell'
import { Badge } from '../components/Badge'
import { Button } from '../components/Button'
import { Card, CardHeader, CardMeta, CardTitle } from '../components/Card'
import { Dropdown, DropdownItem } from '../components/Dropdown'
import { EmptyState } from '../components/EmptyState'
import { ExpandButton } from '../components/ExpandButton'
import { FilterBar } from '../components/FilterBar'
import { FilterDropdown } from '../components/FilterDropdown'
import { IconButton } from '../components/IconButton'
import { MetaItem } from '../components/MetaItem'
import { PageHeader } from '../components/PageHeader'
import { SearchInput } from '../components/SearchInput'
import { useSimpleFit } from '../lib/useSimpleFit'
import {
  CONTENT_TYPE_ICON, MOCK_CONTENT, STATUS_TONE,
  type ContentItem, type ContentStatus, type ContentType,
} from '../data/mockContent'
import { useAuth } from '../lib/AuthProvider'
import { formatDate } from '../lib/formatDate'
import { ROUTES } from '../lib/routes'
import { useToast } from '../lib/ToastProvider'
import { Icon, type IconName } from '../components/Icon'

const CARD_ACTIONS: readonly { key: string; icon: IconName }[] = [
  { key: 'edit',      icon: 'edit' },
  { key: 'move',      icon: 'drive_file_move' },
  { key: 'rename',    icon: 'drive_file_rename_outline' },
  { key: 'duplicate', icon: 'content_copy' },
  { key: 'delete',    icon: 'delete' },
]

const TYPE_VALUES: ContentType[]   = ['article', 'video', 'document', 'campaign', 'social']
const STATUS_VALUES: ContentStatus[] = ['in-progress', 'in-review', 'reviewed', 'in-use']


export function ContentLibraryPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<ContentType[]>([])
  const [statusFilter, setStatusFilter] = useState<ContentStatus[]>([])
  /* The user's content as LOCAL STATE (seeded from mock) so create/delete really
   * mutate it — you can watch every state: sparse welcome, full grid, and empty. */
  const [content, setContent] = useState<ContentItem[]>(
    () => (user ? MOCK_CONTENT.filter((c) => c.authorId === user.id) : []),
  )

  const items = useMemo<ContentItem[]>(() => {
    let list = content
    if (typeFilter.length) list = list.filter((c) => typeFilter.includes(c.type))
    if (statusFilter.length) list = list.filter((c) => statusFilter.includes(c.status))
    if (query.trim()) {
      const q = query.trim().toLowerCase()
      list = list.filter((c) => c.title.toLowerCase().includes(q))
    }
    return list
  }, [content, query, typeFilter, statusFilter])

  /* Two rules only:
   *   fits  → simple centred welcome (no filters)
   *   !fits → standard layout (header with title + search + filters), as usual
   * "fits" = the simple layout (welcome chrome + cards) fits the content area.
   * Mode-neutral: we measure the grid's intrinsic height (it exists in both
   * layouts) plus the welcome chrome captured live from the DOM — no magic px.
   * The chrome (title + subtitle + buttons + gaps) is stable, so we cache it
   * from the simple render and reuse it to decide whether to leave standard. */
  /* The shared fit rule — this page was its origin and kept an inline copy
   * that had already drifted (it still anchored on a class the shell no
   * longer guarantees; the hook anchors on the semantic <main>). */
  const { fits: gridFits, setGridEl, setClusterEl: setLibraryEl } = useSimpleFit(content.length)

  const simple = content.length === 0 || gridFits

  const addContent = () => {
    if (!user) return
    const type = TYPE_VALUES[content.length % TYPE_VALUES.length]
    setContent((prev) => [
      {
        id: `new-${Date.now()}`,
        title: `${t('library.newContent')} ${prev.length + 1}`,
        type,
        status: 'in-progress',
        updatedAt: new Date().toISOString().slice(0, 10),
        authorId: user.id,
      },
      ...prev,
    ])
    toast({ tone: 'success', title: t('library.newContent'), description: t(`contentType.${type}`) })
  }

  const deleteContent = (item: ContentItem) => {
    setContent((prev) => prev.filter((c) => c.id !== item.id))
    toast({ tone: 'info', title: t('library.delete'), description: item.title })
  }

  const grid = (
    <div className="document-grid" ref={setGridEl}>
      {items.map((item) => (
              <Card
                key={item.id}
                interactive
                fill
                tight
                onClick={() => navigate(ROUTES.contentItem.replace(':id', item.id))}
              >
                <CardHeader>
                  <MetaItem appearance="eyebrow" icon={CONTENT_TYPE_ICON[item.type]}>
                    {t(`contentType.${item.type}`)}
                  </MetaItem>
                  <Dropdown
                    align="end"
                    trigger={({ isOpen, ...triggerProps }) => (
                      <IconButton
                        icon="more_vert"
                        reveal
                        aria-label={t('library.moreActions')}
                        data-open={isOpen || undefined}
                        {...triggerProps}
                      />
                    )}
                  >
                    {CARD_ACTIONS.map((a) => (
                      <DropdownItem
                        key={a.key}
                        icon={a.icon}
                        onClick={() =>
                          a.key === 'delete'
                            ? deleteContent(item)
                            : toast({ tone: 'info', title: t(`library.${a.key}`), description: item.title })
                        }
                      >
                        {t(`library.${a.key}`)}
                      </DropdownItem>
                    ))}
                  </Dropdown>
                </CardHeader>

                <CardTitle>{item.title}</CardTitle>

                <CardMeta>
                  <Badge tone={STATUS_TONE[item.status]}>{t(`status.${item.status}`)}</Badge>
                  <MetaItem icon="schedule">{formatDate(item.updatedAt, i18n.language)}</MetaItem>
                </CardMeta>
              </Card>
      ))}
    </div>
  )

  const createMenu = (
    <Dropdown
      align="end"
      trigger={({ isOpen, ...triggerProps }) => (
        <ExpandButton
          icon="add"
          label={t('library.create')}
          withChevron
          expanded={isOpen}
          {...triggerProps}
        />
      )}
    >
      <DropdownItem icon="description" onClick={addContent}>
        {t('library.newContent')}
      </DropdownItem>
      <DropdownItem icon="create_new_folder" onClick={() => toast({ tone: 'info', title: t('library.newFolder') })}>
        {t('library.newFolder')}
      </DropdownItem>
    </Dropdown>
  )

  /* RULE 0 — no content at all: title on top, EmptyState centred in the area
   * (same shape as the placeholder screens). */
  if (content.length === 0) {
    return (
      <AppShell>
        <PageHeader />
        <div className="page-content" data-center>
          <EmptyState
            size="lg"
            surface="page"
            icon="folder"
            title={t('library.empty.title')}
            description={t('library.empty.desc')}
            action={
              <div className="library-empty-actions">
                <Button size="lg" iconEnd onClick={addContent}>
                  <Icon name="add" />
                  {t('library.newContent')}
                </Button>
                <Button size="lg" iconEnd variant="secondary" onClick={() => toast({ tone: 'info', title: t('library.newFolder') })}>
                  <Icon name="create_new_folder" />
                  {t('library.newFolder')}
                </Button>
              </div>
            }
          />
        </div>
      </AppShell>
    )
  }

  /* RULE 1 — fits the screen: simple centred welcome, no toolbar. */
  if (simple) {
    return (
      <AppShell>
        {/* Empty header — just the mobile menu trigger; title is in the cluster. */}
        <PageHeader />
        <div className="page-content">
          <div className="library" data-cards={items.length > 0 || undefined} ref={setLibraryEl}>
            <header className="library-head">
              <h1 className="library-title">{t('library.welcome.title')}</h1>
              <p className="library-subtitle">{t('library.welcome.desc')}</p>
            </header>
            {items.length > 0 && grid}
            <div className="library-create-cta">
              <Button size="lg" iconEnd onClick={addContent}>
                <Icon name="add" />
                {t('library.newContent')}
              </Button>
              <Button size="lg" iconEnd variant="secondary" onClick={() => toast({ tone: 'info', title: t('library.newFolder') })}>
                <Icon name="create_new_folder" />
                {t('library.newFolder')}
              </Button>
            </div>
          </div>
        </div>
      </AppShell>
    )
  }

  /* RULE 2 — doesn't fit: standard layout (header title + search + filters). */
  return (
    <AppShell>
      <PageHeader
        title={t('library.title')}
        inline={
          <>
            <SearchInput
              placeholder={t('library.search')}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onClear={() => setQuery('')}
            />
            <FilterBar
              activeCount={typeFilter.length + statusFilter.length}
              onClear={() => { setTypeFilter([]); setStatusFilter([]) }}
            >
              <FilterDropdown
                label={t('library.filters.type')}
                allLabel={t('library.filters.allTypes')}
                options={TYPE_VALUES.map((v) => ({ value: v, label: t(`contentType.${v}`) }))}
                value={typeFilter}
                onChange={setTypeFilter}
              />
              <FilterDropdown
                label={t('library.filters.status')}
                allLabel={t('library.filters.allStatuses')}
                options={STATUS_VALUES.map((v) => ({ value: v, label: t(`status.${v}`) }))}
                value={statusFilter}
                onChange={setStatusFilter}
              />
            </FilterBar>
          </>
        }
        actions={createMenu}
      />

      <div className="page-content">
        {items.length > 0 ? (
          grid
        ) : (
          <EmptyState
            surface="page"
            icon="search"
            title={t('library.empty.searchTitle')}
            description={t('library.empty.searchDesc')}
          />
        )}
      </div>
    </AppShell>
  )
}
