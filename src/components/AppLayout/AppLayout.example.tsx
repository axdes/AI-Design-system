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

  /* The app frame: navigation plus the scrolling main column. Below the drawer
   * breakpoint a side arrangement becomes an overlay, which is what
   * navOpen/onNavClose drive.
   *
   * `arrangement` IS A DECISION ABOUT THE PRODUCT, NOT THE PAGE, so it is set
   * once in the shell and never varied screen to screen — a rail that moves
   * between screens is a reader relearning where they are.
   *
   *   `rail`  (default) the nav attached to the content, for a product with
   *           enough places to go that the reader navigates constantly.
   *   `float` the nav detached, for a calmer product where the shell should
   *           read as one card rather than two panes welded together.
   *   `top`   a horizontal bar, for a product with FEW destinations — a rail
   *           holding three items is a wide margin saying very little.
   *   `none`  no navigation at all: sign-in, a status page, a reading view
   *           that must not offer a way out mid-task.
   *
   * The main column carries a REAL page — a header and content under it. It
   * used to hold a bare <PageHeader> and nothing else, so the one thing this
   * component exists to arrange (the relationship between the rail and what is
   * beside it) was an empty grey field (owner: "AppLayout is wrong",
   * 2026-08-24). What goes in `children` is always a page; showing one is what
   * makes the arrangement legible. */
  return (
    <AppLayout
      arrangement="rail"
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

/* The same shell with the nav DETACHED, which is the whole of what `float`
 * changes: the reader's route through the product is identical and the screen
 * reads as one composition rather than two panes. It is a house style, chosen
 * once. */
export function FloatingExample() {
  return (
    <AppLayout
      arrangement="float"
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
      <Card>
        <CardTitle as="h2">Drafts</CardTitle>
        <Prose size="sm">Twelve items, four of them edited this week.</Prose>
      </Card>
    </AppLayout>
  )
}
