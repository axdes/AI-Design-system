/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { Descriptions } from './Descriptions'
import { Badge } from '../Badge'

export function Example() {
  /* Read-only field/value metadata (a real <dl>). Use a Table for rows of
   * records, a form for editing. Values can be any node, e.g. a Badge. */
  return (
    <Descriptions
      columns={2}
      items={[
        { term: 'Invoice', value: 'INV-1042' },
        { term: 'Status', value: <Badge tone="warning" fill="soft">Due</Badge> },
        { term: 'Client', value: 'Sabic' },
        { term: 'Amount', value: 'SAR 8,600.00' },
      ]}
    />
  )
}
