import './ContentPatternsPage.css'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AppShell } from '../shell/AppShell'
import { ListPageTemplate } from '../blocks/ListPageTemplate'
import { Badge } from '../components/Badge'
import { Button } from '../components/Button'
import { Card, CardMedia, CardMeta, CardTitle } from '../components/Card'
import { ContentRow } from '../components/ContentRow'
import { Grid } from '../components/Layout'
import { Icon } from '../components/Icon'
import { Identity } from '../components/Identity'
import { MetaItem } from '../components/MetaItem'
import { SectionLabel } from '../components/SectionLabel'
import { SegmentedControl } from '../components/SegmentedControl'
import { Table, TableScroll, TBody, Td, Th, THead, Tr } from '../components/Table'
import { CONTENT_TYPE_ICON, MOCK_CONTENT, STATUS_TONE } from '../data/mockContent'
import { DEMO_USERS } from '../lib/AuthProvider'
import { formatDate } from '../lib/formatDate'

/* Content patterns — the reference gallery (spec: content-patterns).
 *
 * Two exhibits: the SAME collection in three views (the switcher earns its
 * place here: the collection is both visual and comparable, and the default
 * is what the selection rules would pick — rows), and the kind presets an
 * agent copies instead of inventing an arrangement. Everything on this screen
 * is registry parts; that is the whole point of it. */

type View = 'rows' | 'cards' | 'table'

function authorName(authorId: string) {
  return DEMO_USERS.find((u) => u.id === authorId)?.fullName ?? authorId
}

export function ContentPatternsPage() {
  const { t, i18n } = useTranslation()
  const [view, setView] = useState<View>('rows')
  /* The field priorities: every view below truncates THIS order, never its
   * own — the acceptance the spec pins. */
  const items = MOCK_CONTENT.slice(0, 5)

  return (
    <AppShell>
      <ListPageTemplate
        title={t('patterns.title')}
        toolbar={
          <div className="patterns-toolbar">
            <SectionLabel>{t('patterns.collection')}</SectionLabel>
            <SegmentedControl
              label={t('patterns.view')}
              value={view}
              onChange={(v) => setView(v as View)}
              options={[
                { value: 'rows', label: t('patterns.viewRows') },
                { value: 'cards', label: t('patterns.viewCards') },
                { value: 'table', label: t('patterns.viewTable') },
              ]}
            />
          </div>
        }
      >
        {view === 'rows' && (
          <Card flush>
            {items.map((c) => (
              <ContentRow
                key={c.id}
                density="compact"
                media={<Icon name={CONTENT_TYPE_ICON[c.type]} size="md" />}
                eyebrow={<MetaItem appearance="eyebrow" icon={CONTENT_TYPE_ICON[c.type]}>{t(`contentType.${c.type}`)}</MetaItem>}
                title={c.title}
                meta={
                  <>
                    <MetaItem icon="person">{authorName(c.authorId)}</MetaItem>
                    <MetaItem icon="schedule">{formatDate(c.updatedAt, i18n.language)}</MetaItem>
                  </>
                }
              />
            ))}
          </Card>
        )}

        {view === 'cards' && (
          <Grid gap={4}>
            {items.map((c) => (
              <Card key={c.id} fill>
                <CardMedia wash={c.type === 'video' ? 'ink' : 'brand'}>
                  <span className="patterns-media-glyph"><Icon name={CONTENT_TYPE_ICON[c.type]} size="lg" /></span>
                </CardMedia>
                <MetaItem appearance="eyebrow" icon={CONTENT_TYPE_ICON[c.type]}>{t(`contentType.${c.type}`)}</MetaItem>
                <CardTitle>{c.title}</CardTitle>
                <CardMeta>
                  <MetaItem icon="person">{authorName(c.authorId)}</MetaItem>
                  <MetaItem icon="schedule">{formatDate(c.updatedAt, i18n.language)}</MetaItem>
                </CardMeta>
              </Card>
            ))}
          </Grid>
        )}

        {view === 'table' && (
          <Card flush>
            <TableScroll label={t('patterns.collection')}>
              <Table nowrap>
                <THead>
                  <Tr>
                    <Th>{t('patterns.colType')}</Th>
                    <Th>{t('patterns.colTitle')}</Th>
                    <Th>{t('patterns.colAuthor')}</Th>
                    <Th>{t('patterns.colUpdated')}</Th>
                    <Th>{t('patterns.colStatus')}</Th>
                  </Tr>
                </THead>
                <TBody>
                  {items.map((c) => (
                    <Tr key={c.id}>
                      <Td><MetaItem icon={CONTENT_TYPE_ICON[c.type]}>{t(`contentType.${c.type}`)}</MetaItem></Td>
                      <Td emphasis>{c.title}</Td>
                      <Td>{authorName(c.authorId)}</Td>
                      <Td>{formatDate(c.updatedAt, i18n.language)}</Td>
                      <Td><Badge tone={STATUS_TONE[c.status]}>{t(`status.${c.status}`)}</Badge></Td>
                    </Tr>
                  ))}
                </TBody>
              </Table>
            </TableScroll>
          </Card>
        )}

        <SectionLabel>{t('patterns.kinds')}</SectionLabel>
        <Grid gap={4}>
          {/* Article: media top, eyebrow, excerpt, byline — the news teaser. */}
          <Card fill>
            <CardMedia wash="brand">
              <span className="patterns-media-glyph"><Icon name="description" size="lg" /></span>
            </CardMedia>
            <MetaItem appearance="eyebrow" icon="description">{t('patterns.kindArticle')}</MetaItem>
            <CardTitle>{t('patterns.articleTitle')}</CardTitle>
            <p className="patterns-excerpt">{t('patterns.articleExcerpt')}</p>
            <CardMeta>
              <MetaItem icon="person">Sarah Al-Mansouri</MetaItem>
              <MetaItem icon="schedule">May 12, 2026</MetaItem>
            </CardMeta>
          </Card>

          {/* Course: the cover — the card's own title ON the wash, scrim doing
              the legibility, category badge riding the media. */}
          <Card fill interactive onClick={() => undefined}>
            <CardMedia placement="cover" wash="brand" />
            <Badge tone="neutral" fill="soft">{t('patterns.kindCourse')}</Badge>
            <CardTitle>{t('patterns.courseTitle')}</CardTitle>
            <CardMeta>
              <MetaItem icon="schedule">{t('patterns.courseMeta')}</MetaItem>
            </CardMeta>
          </Card>

          {/* Person, the list form: face beside name — never a face floating
              a row above it. */}
          <Card fill>
            <MetaItem appearance="eyebrow" icon="person">{t('patterns.kindPerson')}</MetaItem>
            <Identity
              name={<CardTitle>Fatima Al-Zahra</CardTitle>}
              avatarName="Fatima Al-Zahra"
              secondary={t('patterns.personRole')}
              size="lg"
            />
            <CardMeta>
              <Button size="sm" variant="secondary">{t('patterns.personAction')}</Button>
            </CardMeta>
          </Card>

          {/* Person, the profile hero: the ONE place vertical is right. */}
          <Card fill>
            <MetaItem appearance="eyebrow" icon="person">{t('patterns.kindProfile')}</MetaItem>
            <Identity
              vertical
              name={<CardTitle>Khalid Al-Dossari</CardTitle>}
              avatarName="Khalid Al-Dossari"
              secondary={t('patterns.profileRole')}
              size="lg"
            />
          </Card>

          {/* Event: the date IS the identity, so it takes the media slot. */}
          <Card fill>
            <CardMedia placement="side" wash="ink">
              <span className="patterns-date-block">
                <span className="patterns-date-day">26</span>
                <span className="patterns-date-month">{t('patterns.eventMonth')}</span>
              </span>
            </CardMedia>
            <MetaItem appearance="eyebrow" icon="schedule">{t('patterns.kindEvent')}</MetaItem>
            <CardTitle>{t('patterns.eventTitle')}</CardTitle>
            <CardMeta>
              <MetaItem icon="schedule">14:00</MetaItem>
              <MetaItem icon="folder">{t('patterns.eventPlace')}</MetaItem>
            </CardMeta>
          </Card>

          {/* File: a dense row — the icon carries the type, one meta survives. */}
          <Card fill>
            <MetaItem appearance="eyebrow" icon="insert_drive_file">{t('patterns.kindFile')}</MetaItem>
            <div>
              <ContentRow
                density="dense"
                media={<Icon name="insert_drive_file" size="md" />}
                title="Q3-safety-review.pdf"
                meta={<MetaItem icon="schedule">May 8, 2026</MetaItem>}
              />
              <ContentRow
                density="dense"
                media={<Icon name="insert_drive_file" size="md" />}
                title="site-audit-checklist.xlsx"
                meta={<MetaItem icon="schedule">May 2, 2026</MetaItem>}
              />
            </div>
          </Card>
        </Grid>
      </ListPageTemplate>
    </AppShell>
  )
}
