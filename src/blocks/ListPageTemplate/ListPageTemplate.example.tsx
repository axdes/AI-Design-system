/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { useState } from 'react'
import { ListPageTemplate } from './ListPageTemplate'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { Icon } from '../../components/Icon'
import { Grid } from '../../components/Layout'
import { SearchInput } from '../../components/SearchInput'

export function Example() {
  const [query, setQuery] = useState('')
  const rows = [{ id: '1', name: 'Onboarding' }, { id: '2', name: 'Payroll' }]
  const shown = rows.filter((r) => r.name.toLowerCase().includes(query.toLowerCase()))

  return (
    <ListPageTemplate
      title="Projects"
      actions={<Button variant="primary">New<Icon name="add" /></Button>}
      /* SEARCH IS HOW A LIST PAGE IS USED, so it stands in the header beside the
         title, not on a row of its own below it — `titleTools` is the slot
         <PageHeader> keeps for exactly this, and `toolbar` is for the controls
         that FILTER what search returns.
         `expanded` because on this page the field is not one control among
         several: it is the way the reader finds a row. Left to its default the
         field collapses to a bare magnifier, and the page's main affordance is
         then hidden behind a click nobody is told about (owner, read off the
         gallery, 2026-08-30). Collapsed is right in a toolbar that already has
         four other controls; it is wrong when search IS the toolbar. */
      titleTools={
        <SearchInput
          expanded
          placeholder="Search projects"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onClear={() => setQuery('')}
        />
      }
      isEmpty={shown.length === 0}
      emptyState={{ icon: 'folder', title: 'No projects match', description: 'Try a different search.' }}
    >
      {/* The block stacks its children; a card grid is one line of <Grid>, and
          leaving that to the caller is what lets a table or a single reading
          column live under the same template. */}
      <Grid gap={4}>
        {shown.map((r) => (
          <Card key={r.id} interactive>{r.name}</Card>
        ))}
      </Grid>
    </ListPageTemplate>
  )
}
