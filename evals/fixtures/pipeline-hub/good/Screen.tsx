/* Workspace hub — the landing screen of a client-project workspace.
 * Spec: workspace-hub (project client-workspace).
 *
 * A hub on ListPageTemplate: five areas, each a DESTINATION rendered as one
 * tile-sized target (R9: entry points are tiles). Deliberately no Table, no
 * search, no sorting — nothing here is read, compared or processed; the
 * screen exists to be left through the right door. See the spec's _why. */
import { useState } from 'react'
import { ListPageTemplate } from '@/blocks/ListPageTemplate'
import { Card, CardTitle } from '@/components/Card'
import { CountBadge } from '@/components/CountBadge'
import { Grid } from '@/components/Layout'

type Area = {
  id: string
  name: string
  /** One line saying what waits inside — the copy that makes a door pickable. */
  whatWaits: string
  count: number
}

/* The workspace's shape, not its content: all five exist from day one. */
const AREAS: Area[] = [
  { id: 'documents', name: 'Documents', whatWaits: 'Contracts, briefs and working files for this client.', count: 42 },
  { id: 'meetings', name: 'Meetings', whatWaits: 'Sessions this month, with notes where they exist.', count: 6 },
  { id: 'decisions', name: 'Decisions', whatWaits: 'Open decisions waiting on someone in this room.', count: 3 },
  { id: 'people', name: 'People', whatWaits: 'Everyone working this account, yours and theirs.', count: 11 },
  { id: 'reports', name: 'Reports', whatWaits: 'Published reports, newest first.', count: 8 },
]

export function Screen() {
  /* No router in this deliverable, so "open" records the chosen door: the
   * whole tile is one press, which is the behaviour the spec pins. */
  const [opened, setOpened] = useState<string | null>(null)

  return (
    <ListPageTemplate title="Acme Industrial workspace">
      <Grid gap={4}>
        {AREAS.map((a) => (
          <Card key={a.id} interactive onClick={() => setOpened(a.id)} data-opened={opened === a.id || undefined}>
            {/* The count rides the tile it describes — never a column, which
              * would invite comparing five numbers nobody compares. */}
            <CountBadge count={a.count} label={`${a.count} in ${a.name}`}>
              <CardTitle>{a.name}</CardTitle>
            </CountBadge>
            <p>{a.whatWaits}</p>
          </Card>
        ))}
      </Grid>
    </ListPageTemplate>
  )
}
