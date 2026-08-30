/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { useState } from 'react'
import { Page } from './Page'
import { Button } from '../../components/Button'
import { Card, CardTitle } from '../../components/Card'
import { EmptyState } from '../../components/EmptyState'
import { Breadcrumb } from '../../components/Breadcrumb'
import { ListItem } from '../../components/ListItem'

const REQUESTS = [
  { id: 'r-1', title: 'Quarterly access review', owner: 'Ada Meridian' },
  { id: 'r-2', title: 'New vendor onboarding', owner: 'Dmitri Volkov' },
]

/* THE ARCHETYPE IS THE DECISION; EVERYTHING ELSE ON THIS COMPONENT IS AN
 * OVERRIDE OF IT. Name what KIND of page this is and the geometry follows: the
 * width, the shape of the body, and which regions the page may and may not
 * have. Say `archetype="worklist"` and a screen stops restating what its own
 * kind already implies.
 *
 * The eleven kinds are not a style menu. They are answers to what the reader
 * came to do — read the state of things (`overview`), find one row (`list`),
 * work a queue (`worklist`), interrogate numbers (`analytical`), read one
 * record (`detail`), choose where to go (`hub`), give us something (`form`,
 * `wizard`), change how it behaves (`settings`), get in (`auth`), or be told
 * something went wrong (`system`).
 *
 * The table of defaults lives beside `screen-specs/page-rules.json`, which is
 * the source of truth, and `check:spec` fails on drift — so an archetype
 * cannot mean one thing to the gate and another on screen.
 *
 * `shape`, `width` and `align` OVERRIDE the archetype, and each one is a claim
 * that this screen is the exception. `shape="list-detail"` below is the case a
 * worklist earns: the items are reviewed in place, so the queue and the
 * selection are on screen together. An override with no such reason is a page
 * disagreeing with its own kind.
 */
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

/* The same mechanism with NO override: a `list` takes its shape, its width and
 * its regions from its kind, and the screen says nothing about geometry at all.
 * This is what most pages should look like. */
export function ListExample() {
  return (
    <Page archetype="list" title="Requests">
      <Card flush>
        {REQUESTS.map((r) => (
          <ListItem key={r.id}>{r.title}</ListItem>
        ))}
      </Card>
    </Page>
  )
}

/* AN INNER PAGE SAYS WHERE IT IS, and there are two ways: an arrow for one step
 * up, a trail for more. They are alternatives and never both — a screen with a
 * back arrow AND a breadcrumb offers two ways out of the same corner, and the
 * header's leading slot holds one thing.
 *
 * `<Breadcrumb>` had nowhere to be rendered until 2026-08-30: no template put it
 * anywhere and no page slot took it, so the system carried a trail component and
 * no page that could show one. It sits above the title, because it says where
 * the reader IS and the title says what they are looking at.
 *
 * The last crumb is the current page and is not a link — the component enforces
 * that, and it is why a trail never needs the page title repeated after it. */
export function InnerPageExample() {
  return (
    <Page
      archetype="detail"
      title="Quarterly access review"
      breadcrumb={
        <Breadcrumb
          items={[
            { label: 'Library', href: '/library' },
            { label: 'Reviews', href: '/library/reviews' },
            { label: 'Quarterly access review' },
          ]}
        />
      }
    >
      <Card><CardTitle>Ada Meridian</CardTitle><p>Opened two days ago.</p></Card>
    </Page>
  )
}
