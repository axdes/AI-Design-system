import './ContentDetailPage.css'
import { useMemo } from 'react'
import { useNavigate, useParams, Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AppShell } from '../shell/AppShell'
import { Button } from '../components/Button'
import { ContentSidePanel, type SidePanelSection } from '../components/ContentSidePanel'
import { Dropdown, DropdownItem } from '../components/Dropdown'
import { Icon } from '../components/Icon'
import { IconButton } from '../components/IconButton'
import { MetaItem } from '../components/MetaItem'
import { PageHeader } from '../components/PageHeader'
import {
  MOCK_CONTENT,
  type ContentStatus,
} from '../data/mockContent'
import { formatDate } from '../lib/formatDate'
import { ROUTES } from '../lib/routes'
import { useToast } from '../lib/ToastProvider'

const STATUS_VALUES: ContentStatus[] = ['in-progress', 'in-review', 'reviewed', 'in-use']

export function ContentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const { toast } = useToast()

  const item = useMemo(() => MOCK_CONTENT.find((c) => c.id === id), [id])
  if (!item) return <Navigate to={ROUTES.content} replace />

  const wordCount = (item.body ?? '').replace(/<[^>]+>/g, ' ').trim().split(/\s+/).filter(Boolean).length

  const sections: SidePanelSection[] = [
    {
      key: 'comments',
      icon: 'rate_review',
      label: t('detail.panel.comments'),
      content: <p>{t('detail.panel.commentsEmpty')}</p>,
    },
    {
      key: 'versions',
      icon: 'history',
      label: t('detail.panel.versions'),
      content: <p>{t('detail.panel.versionsEmpty')}</p>,
    },
    {
      key: 'settings',
      icon: 'settings',
      label: t('detail.panel.settings'),
      content: (
        <dl className="content-detail-meta">
          <dt>{t('detail.panel.author')}</dt>      <dd>{item.authorId}</dd>
          <dt>{t('detail.panel.type')}</dt>        <dd>{t(`contentType.${item.type}`)}</dd>
          <dt>{t('detail.panel.status')}</dt>      <dd>{t(`status.${item.status}`)}</dd>
          <dt>{t('detail.panel.updatedAt')}</dt>   <dd>{formatDate(item.updatedAt, i18n.language)}</dd>
        </dl>
      ),
    },
    {
      key: 'activity',
      icon: 'list_alt',
      label: t('detail.panel.activity'),
      content: <p>{t('detail.panel.activityEmpty')}</p>,
    },
    {
      key: 'validation',
      icon: 'verified',
      label: t('detail.panel.validation'),
      content: <p>{t('detail.panel.validationPass')}</p>,
    },
  ]

  return (
    <AppShell>
      <PageHeader
        title={item.title}
        onBack={() => navigate(ROUTES.content)}
        backLabel={t('detail.back')}
        actions={
          <>
            <IconButton
              icon="download"
              size="md"
              aria-label={t('detail.export')}
              onClick={() => toast({ tone: 'info', title: t('detail.export') })}
            />
            <Dropdown
              align="end"
              trigger={({ isOpen, ...triggerProps }) => (
                <Button data-open={isOpen || undefined} {...triggerProps}>
                  {t(`status.${item.status}`)}
                  <Icon name="arrow_drop_down" />
                </Button>
              )}
            >
              {STATUS_VALUES.map((s) => (
                <DropdownItem
                  key={s}
                  selected={s === item.status}
                  onClick={() => toast({ tone: 'info', title: t('detail.statusChanged'), description: t(`status.${s}`) })}
                >
                  {t(`status.${s}`)}
                </DropdownItem>
              ))}
            </Dropdown>
          </>
        }
      />

      <div className="page-content content-detail-page">
        <div className="content-detail">
          <div className="content-detail-main">
            <div className="content-surface">
              <div className="content-doc-toolbar">
                <Button
                  variant="secondary"
                  onClick={() => toast({ tone: 'info', title: t('detail.editUnavailable') })}
                >
                  <Icon name="edit" />
                  {t('detail.startEditing')}
                </Button>
              </div>
              <article className="content-article">
                <h2 className="content-doc-title">{item.title}</h2>
                <div dangerouslySetInnerHTML={{ __html: item.body ?? '' }} />
              </article>
              <footer className="content-detail-statusbar">
                <MetaItem icon="text_fields">{t('detail.wordCount', { count: wordCount })}</MetaItem>
                <MetaItem icon="save">{t('detail.saved')} · {formatDate(item.updatedAt, i18n.language)}</MetaItem>
              </footer>
            </div>
          </div>

          <ContentSidePanel sections={sections} />
        </div>
      </div>
    </AppShell>
  )
}
