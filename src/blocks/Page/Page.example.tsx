/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { useState } from 'react'
import { Page } from './Page'
import { Button } from '../../components/Button'
import { Card, CardTitle } from '../../components/Card'
import { EmptyState } from '../../components/EmptyState'
import { ListItem } from '../../components/ListItem'

const REQUESTS = [
  { id: 'r-1', title: 'Quarterly access review', owner: 'Ada Meridian' },
  { id: 'r-2', title: 'New vendor onboarding', owner: 'Dmitri Volkov' },
]

/* The list-detail shape: the queue on one side, the selection on the other. The
 * archetype supplies the width and the region rules; `shape` overrides the
 * geometry, which is the one case a worklist earns — items reviewed in place. */
export function Example() {
  const [selected, setSelected] = useState<string | null>('r-1')
  const current = REQUESTS.find((r) => r.id === selected)

  return (
    <Page
      archetype="worklist"
      shape="list-detail"
      title="Approvals"
      detail={current
        ? <Card><CardTitle>{current.title}</CardTitle><p>{current.owner}</p></Card>
        /* The pane says what it waits for rather than sitting blank. `as="h2"`
           because the page header already took the h1. */
        : <EmptyState as="h2" surface="card" icon="list_alt" title="Nothing selected" />}
      footerBar={<Button variant="primary" disabled={!current}>Approve</Button>}
    >
      {/* The queue is a surface of its own: two bare rows on the page background
          read as loose text beside the card they select into. */}
      <Card flush>
        {REQUESTS.map((r) => (
          <ListItem key={r.id} onClick={() => setSelected(r.id)}>{r.title}</ListItem>
        ))}
      </Card>
    </Page>
  )
}
