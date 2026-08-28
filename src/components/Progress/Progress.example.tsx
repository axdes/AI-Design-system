/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { Progress } from './Progress'
import { Row, Stack } from '../Layout'

export function Example() {
  /* The same statement in both shapes: a bar takes the width it is given and
     suits a row of them, a ring is compact enough for a dashboard tile. Drop
     `value` and the bar slides for "working, duration unknown" — a ring has no
     such form, because a circle that never fills reads as broken. */
  return (
    <Stack gap={6}>
      <Progress value={64} label="Documents processed" showValue />
      <Row gap={6}>
        <Progress shape="ring" value={64} label="Documents processed" showValue />
        <Progress shape="ring" value={92} tone="success" size="lg" label="Coverage" showValue />
      </Row>
      <Progress label="Importing" />
    </Stack>
  )
}
