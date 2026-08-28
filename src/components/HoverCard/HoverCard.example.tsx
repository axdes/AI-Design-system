/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { HoverCard } from './HoverCard'
import { Avatar } from '../Avatar'
import { Row, Stack } from '../Layout'

export function Example() {
  /* Rich card on hover OR focus. For a plain text hint use <Tooltip>; for a
   * click-opened panel use <Popover>. The trigger stays keyboard-reachable. */
  return (
    <HoverCard
      content={
        <Row gap={3}>
          <Avatar name="Ada Meridian" />
          <Stack gap={1}>
            <strong>Ada Meridian</strong>
            <span>Brand manager, joined 2023</span>
          </Stack>
        </Row>
      }
    >
      <button type="button">@sarah</button>
    </HoverCard>
  )
}
