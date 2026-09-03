/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { HoverCard } from './HoverCard'
import { Avatar } from '../Avatar'
import { Button } from '../Button'
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
      {/* The trigger is a real control, not a bare <button>: a mention that opens
         a card is an action that looks like a link, which is what this variant is
         for. A raw <button> here would publish the browser's own grey chrome as
         the usage every agent copies. */}
      <Button variant="link">@sarah</Button>
    </HoverCard>
  )
}
