/* Golden example. A news teaser row — the full anatomy: thumbnail tile,
 * eyebrow, title that opens the record (its hit area is the whole row),
 * clamped excerpt, footnote meta, and a trailing decision. */
import { ContentRow } from './ContentRow'
import { Button } from '../Button'
import { Icon } from '../Icon'
import { MetaItem } from '../MetaItem'

export function Example() {
  return (
    <ContentRow
      media={<Icon name="description" size="md" />}
      eyebrow={<MetaItem appearance="eyebrow" icon="description">Article</MetaItem>}
      title="Quarterly safety review, summarised"
      onOpen={() => undefined}
      excerpt="What changed since March, which sites closed their findings, and the two audits still open going into Q4."
      meta={
        <>
          <MetaItem icon="person">Sarah Al-Mansouri</MetaItem>
          <MetaItem icon="schedule">May 12, 2026</MetaItem>
        </>
      }
      actions={<Button size="sm" variant="secondary">Share</Button>}
    />
  )
}
