/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { useState } from 'react'
import { AppLayout } from './AppLayout'
import { Card, CardTitle } from '../Card'
import { Grid, Stack } from '../Layout'
import { Icon } from '../Icon'
import { PageHeader } from '../PageHeader'
import { Prose } from '../Prose'
import { SideNav } from '../SideNav'

export function Example() {
  const [navOpen, setNavOpen] = useState(false)

  /* The app frame: a nav rail plus the scrolling main column. On narrow screens
   * the rail becomes an overlay, which is what navOpen/onNavClose drive.
   *
   * The main column carries a REAL page — a header and content under it. It
   * used to hold a bare <PageHeader> and nothing else, so the one thing this
   * component exists to arrange (the relationship between the rail and what is
   * beside it) was an empty grey field (owner: "AppLayout is wrong",
   * 2026-08-24). What goes in `children` is always a page; showing one is what
   * makes the arrangement legible. */
  return (
    <AppLayout
      navOpen={navOpen}
      onNavClose={() => setNavOpen(false)}
      nav={
        <SideNav
          aria-label="Primary"
          logo={<><Icon name="auto_awesome" size="md" /><strong>Acme</strong></>}
          logoMark={<Icon name="auto_awesome" size="md" />}
          groups={[
            {
              label: 'Workspace',
              items: [
                { id: 'library', label: 'Library', icon: 'folder', active: true },
                { id: 'review', label: 'For review', icon: 'check_circle' },
              ],
            },
          ]}
        />
      }
    >
      <PageHeader title="Content library" />
      <Stack gap={4}>
        <Grid gap={4} min="md">
          <Card>
            <CardTitle as="h2">Drafts</CardTitle>
            <Prose size="sm">Twelve items, four of them edited this week.</Prose>
          </Card>
          <Card>
            <CardTitle as="h2">Published</CardTitle>
            <Prose size="sm">Ninety items. Nothing is waiting on you here.</Prose>
          </Card>
        </Grid>
      </Stack>
    </AppLayout>
  )
}
