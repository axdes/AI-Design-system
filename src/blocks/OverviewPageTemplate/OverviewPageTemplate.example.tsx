/* Golden example. A real module: tsc compiles it, the test suite renders it,
 * the registry publishes the usage. The shape to copy: prime answers the
 * primaryQuestion, every widget ends in the way to the whole collection, and
 * notices render nothing when healthy. */
import { Alert } from '../../components/Alert'
import { Badge } from '../../components/Badge'
import { Button } from '../../components/Button'
import { Meter } from '../../components/Meter'
import { Row } from '../../components/Layout'
import { Stat } from '../../components/Stat'
import { OverviewPageTemplate, OverviewWidget } from './OverviewPageTemplate'

const QUEUE = [
  { id: 'EXP-2204', who: 'Yousef Anzi', waiting: '2 days' },
  { id: 'EXP-2201', who: 'Lina Haddad', waiting: '6 days' },
]

export function Example() {
  const setupGap = false /* the notices contract: nothing when healthy */
  return (
    <OverviewPageTemplate
      title="Operations overview"
      actions={<Button variant="secondary">Refresh</Button>}
      notices={setupGap && <Alert tone="warning">The export connector is signed out.</Alert>}
      prime={
        <>
          <Stat value={2} caption="Waiting on you" tone="warning" size="lg" />
          <Stat value={14} caption="Handled this week" size="lg" />
        </>
      }
    >
      <OverviewWidget
        title="Approvals queue"
        footer={<Button variant="link">View all 9</Button>}
      >
        {QUEUE.map((r) => (
          <Row key={r.id} gap={3}>
            <strong>{r.id}</strong>
            <span>{r.who}</span>
            <Badge tone="warning" fill="soft">waiting {r.waiting}</Badge>
          </Row>
        ))}
      </OverviewWidget>
      <OverviewWidget
        title="Monthly budget"
        footer={<Button variant="link">Budget breakdown</Button>}
      >
        {/* A value on a fixed scale is a Meter, not a sentence. But `label` on a
            Meter is SPOKEN AND NOT DRAWN, so a bar on its own is an anonymous
            bar: this widget showed a sighted reader a blue line at 72% of its
            track and no number anywhere (owner, read off the gallery,
            2026-08-29). Meter's own example says the reading comes from what
            the meter sits in, and here that is the Stat above it. */}
        <Stat value={72} unit="%" caption="of the review budget used" size="lg" />
        <Meter value={72} max={100} label="72% of the review budget used" />
      </OverviewWidget>
    </OverviewPageTemplate>
  )
}
