/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { Skeleton } from './Skeleton'
import { Row, Stack } from '../Layout'

export function Example() {
  /* The shape of a loading card: an avatar disc, a title line and a short
   * paragraph. Announce the loading state ONCE on the surrounding region
   * (aria-busy / a Spinner) — the skeletons themselves are decorative. */
  return (
    <Row gap={3} aria-busy="true">
      <Skeleton shape="circle" />
      <Stack gap={2} className="skeleton-lines">
        <Skeleton width="12rem" height="1rem" shape="block" />
        <Skeleton lines={3} />
      </Stack>
    </Row>
  )
}
