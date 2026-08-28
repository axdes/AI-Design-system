/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { Badge } from './Badge'
import { Row } from '../Layout'

/* TWO CHOICES, and they are about different things.
 *
 * `tone` is the MEANING and is never decorative: success is a state the reader
 * can stop worrying about, warning is one that needs them eventually, danger is
 * one that needs them now. A tone picked because it looks good on the card is a
 * badge that lies. `neutral` is the honest answer when a value has no state at
 * all — a category, a plan name, a count.
 *
 * `fill` is the VOLUME, and it belongs to the surface, not to the meaning. `soft`
 * is the default a row of records wants: a column of solid badges reads as a
 * column of alarms. Keep `solid` for the one badge that has to be seen from
 * across the page, and `plain` for a badge inside something already emphasised.
 */
export function Example() {
  return (
    <Row gap={2} align="center">
      <Badge tone="success" fill="soft">Published</Badge>
      <Badge tone="warning" fill="soft">In review</Badge>
      <Badge tone="danger">Failed</Badge>
      <Badge tone="neutral" fill="plain" size="sm">Draft</Badge>
    </Row>
  )
}
