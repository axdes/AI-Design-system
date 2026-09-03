/* Reference solution — what "used the design system" looks like for this task.
 * Doubles as a regression fixture: the scorers must give it a perfect score. */
import { useState } from 'react'
import { ListPageTemplate } from '@/blocks/ListPageTemplate'
import { Button } from '@/components/Button'
import { Card, CardMeta, CardTitle } from '@/components/Card'
import { FilterDropdown } from '@/components/FilterDropdown'
import { Icon } from '@/components/Icon'
import { Row } from '@/components/Layout'
import { MetaItem } from '@/components/MetaItem'
import { SearchInput } from '@/components/SearchInput'

type Status = 'draft' | 'review' | 'published'

const DOCUMENTS: { id: string; title: string; status: Status; updated: string }[] = [
  { id: '1', title: 'Brand guidelines', status: 'published', updated: '2 days ago' },
  { id: '2', title: 'Q3 campaign brief', status: 'review', updated: 'yesterday' },
  { id: '3', title: 'Tone of voice', status: 'draft', updated: 'today' },
]

export function Screen() {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<Status[]>([])

  const shown = DOCUMENTS.filter(
    (d) =>
      d.title.toLowerCase().includes(query.trim().toLowerCase()) &&
      (status.length === 0 || status.includes(d.status)),
  )

  return (
    <ListPageTemplate
      title="Documents"
      actions={<Button variant="primary" iconEnd>New document<Icon name="add" /></Button>}
      toolbar={
        <Row gap={2}>
          {/* `expanded`: in a list toolbar the field is the point, so it stays
              open instead of collapsing back to a magnifier. */}
          <SearchInput
            expanded
            placeholder="Search documents"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onClear={() => setQuery('')}
          />
          <FilterDropdown<Status>
            label="Status"
            allLabel="All statuses"
            options={[
              { value: 'draft', label: 'Draft' },
              { value: 'review', label: 'In review' },
              { value: 'published', label: 'Published' },
            ]}
            value={status}
            onChange={setStatus}
          />
        </Row>
      }
      isEmpty={shown.length === 0}
      emptyState={{
        icon: 'folder',
        title: 'No documents match',
        description: 'Try a different search or clear the status filter.',
      }}
    >
      {/* Cards go straight in: the template's content area IS the auto-fill
          grid. Wrapping them in another <Grid> nests one grid inside a single
          cell of the other and collapses the whole list to one column. */}
      {shown.map((doc) => (
        <Card key={doc.id} interactive>
          <CardTitle>{doc.title}</CardTitle>
          <CardMeta>
            <MetaItem icon="schedule">Updated {doc.updated}</MetaItem>
          </CardMeta>
        </Card>
      ))}
    </ListPageTemplate>
  )
}
