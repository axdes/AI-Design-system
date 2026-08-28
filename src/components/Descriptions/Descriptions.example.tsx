/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { Descriptions } from './Descriptions'
import { Badge } from '../Badge'
import { Stack } from '../Layout'

const RECORD = [
  { term: 'Invoice', value: 'INV-1042' },
  { term: 'Status', value: <Badge tone="warning" fill="soft">Due</Badge> },
  { term: 'Client', value: 'Northwind' },
  { term: 'Amount', value: 'SAR 8,600.00' },
]

/* ONE RECORD'S FIELDS, read and not edited — a real `<dl>`, so a screen reader
 * pairs each value with its own term. Rows of RECORDS are a <Table>; fields the
 * reader can change are a form. Reaching for this to lay out a form is the
 * mistake it invites, and it produces values nobody can focus.
 *
 * `layout` is the choice, and it is about how the reader uses the block, not how
 * much room there is. `stacked` gives every field its own line: right when the
 * reader looks things up one at a time, and the only layout that survives a long
 * value. `inline` puts term and value on one line, which reads as a summary
 * strip — fine for four short facts above the content, wrong for twelve.
 *
 * `columns` only means anything stacked, and two is usually the most a person
 * can scan without losing which column they were in.
 */
export function Example() {
  return (
    <Stack gap={6}>
      <Descriptions columns={2} items={RECORD} />
      <Descriptions layout="inline" items={RECORD.slice(0, 3)} />
    </Stack>
  )
}
