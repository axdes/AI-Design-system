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
          <Stat value={2} label="Waiting on you" tone="warning" size="lg" />
          <Stat value={14} label="Handled this week" size="lg" />
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
      <OverviewWidget title="Monthly budget">
        {/* A value on a fixed scale is a Meter, not a sentence. */}
        <Meter value={72} max={100} label="72% of the review budget used" />
      </OverviewWidget>
    </OverviewPageTemplate>
  )
}
