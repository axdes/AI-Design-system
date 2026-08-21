/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { Timeline } from './Timeline'

export function Example() {
  /* A vertical event history: audit trail, delivery status, changelog. Tone and
   * icon mark the important nodes; the caller orders and formats. */
  return (
    <Timeline
      items={[
        { id: '1', title: 'Order placed', time: '09:14', icon: 'check_circle', tone: 'success' },
        { id: '2', title: 'Packed', time: '11:02', content: 'Warehouse 3, Riyadh' },
        { id: '3', title: 'Out for delivery', time: '14:30', tone: 'primary' },
        { id: '4', title: 'Delivered', time: 'pending', tone: 'neutral' },
      ]}
    />
  )
}
