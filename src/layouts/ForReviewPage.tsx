import './ForReviewPage.css'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AppShell } from '../shell/AppShell'
import { ListPageTemplate } from '../blocks/ListPageTemplate'
import { Card } from '../components/Card'
import { ContentRow } from '../components/ContentRow'
import { Modal } from '../components/Modal'
import { Field } from '../components/Field'
import { Button } from '../components/Button'
import { Icon } from '../components/Icon'
import { MetaItem } from '../components/MetaItem'
import { Textarea } from '../components/Textarea'
import { CONTENT_TYPE_ICON, MOCK_CONTENT, type ContentItem } from '../data/mockContent'
import { DEMO_USERS } from '../lib/AuthProvider'
import { formatDate } from '../lib/formatDate'
import { ROUTES } from '../lib/routes'
import { useToast } from '../lib/ToastProvider'

function authorName(authorId: string) {
  return DEMO_USERS.find((u) => u.id === authorId)?.fullName ?? authorId
}

/* Reviewer's queue: everything with status "in-review", regardless of author.
 * Approve / request-changes mutate local state (seeded from mock) so the
 * queue really drains down to the empty state. */
export function ForReviewPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [queue, setQueue] = useState<ContentItem[]>(
    () => MOCK_CONTENT.filter((c) => c.status === 'in-review'),
  )
  const [feedbackFor, setFeedbackFor] = useState<ContentItem | null>(null)
  const [note, setNote] = useState('')

  const approve = (item: ContentItem) => {
    setQueue((prev) => prev.filter((c) => c.id !== item.id))
    toast({ tone: 'success', title: t('review.approvedToast'), description: item.title })
  }

  const openChanges = (item: ContentItem) => {
    setFeedbackFor(item)
    setNote('')
  }

  const sendChanges = () => {
    if (!feedbackFor) return
    setQueue((prev) => prev.filter((c) => c.id !== feedbackFor.id))
    toast({ tone: 'info', title: t('review.changesToast'), description: feedbackFor.title })
    setFeedbackFor(null)
  }

  /* Built on `<ListPageTemplate>`: header, content, empty state. The queue is a
   * single reading column rather than a card grid, which is exactly the kind of
   * per-screen decision the block hands back through `contentClassName`. */
  return (
    <AppShell>
      <ListPageTemplate
        title={t('review.title')}
        contentClassName="review-queue"
        isEmpty={queue.length === 0}
        empty={{
          icon: 'rate_review',
          title: t('placeholder.forReview.title'),
          description: t('placeholder.forReview.desc'),
          action: (
            <Button size="lg" onClick={() => navigate(ROUTES.content)}>
              <Icon name="folder" />
              {t('placeholder.forReview.cta')}
            </Button>
          ),
        }}
      >
        {/* The queue as ROWS, not tiles: a decision list is read down and
            acted on in place — icon tile, title (the whole row opens the
            record), author and date, the two decisions trailing. The per-row
            "In Review" badge is gone on purpose: every row here is in review,
            and the page title already says so once. */}
        <Card flush>
          {queue.map((item) => (
            <ContentRow
              key={item.id}
              density="compact"
              media={<Icon name={CONTENT_TYPE_ICON[item.type]} size="md" />}
              eyebrow={<MetaItem appearance="eyebrow" icon={CONTENT_TYPE_ICON[item.type]}>{t(`contentType.${item.type}`)}</MetaItem>}
              title={item.title}
              onOpen={() => navigate(ROUTES.contentItem.replace(':id', item.id))}
              meta={
                <>
                  <MetaItem icon="person">{authorName(item.authorId)}</MetaItem>
                  <MetaItem icon="schedule">{formatDate(item.updatedAt, i18n.language)}</MetaItem>
                </>
              }
              actions={
                <>
                  <Button size="sm" onClick={() => approve(item)}>
                    <Icon name="check" />
                    {t('review.approve')}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => openChanges(item)}>
                    {t('review.requestChanges')}
                    <Icon name="edit" />
                  </Button>
                </>
              }
            />
          ))}
        </Card>
      </ListPageTemplate>

      <Modal
        open={feedbackFor !== null}
        onClose={() => setFeedbackFor(null)}
        title={t('review.changesTitle')}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setFeedbackFor(null)}>
              {t('review.cancel')}
            </Button>
            <Button disabled={!note.trim()} onClick={sendChanges}>
              <Icon name="send" />
              {t('review.send')}
            </Button>
          </>
        }
      >
        <Field label={t('review.changesLabel')} htmlFor="review-note">
          <Textarea
            id="review-note"
            rows={4}
            placeholder={t('review.changesPlaceholder')}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </Field>
      </Modal>
    </AppShell>
  )
}
