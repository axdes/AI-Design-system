/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { CountBadge } from './CountBadge'
import { IconButton } from '../IconButton'
import { Row } from '../Layout'
import { Tooltip } from '../Tooltip'

/* A COUNT PINNED TO A CONTROL, and that is the difference from <Badge>: a Badge
 * is a standalone pill that labels a thing, this one hangs off something the
 * reader can press. If it is not attached to a control it is a Badge.
 *
 * `label` is what a screen reader hears, and the bare number is not enough —
 * "5" beside an icon announces as "5" and means nothing. Say what the five are.
 *
 * `dot` is the version with NO number: use it when the reader only needs to
 * know that something is new, and a count would invite them to work out whether
 * seven is more urgent than three. It is quieter and it is usually the honest
 * one.
 *
 * `tone` is what the count MEANS, not how big it is. `primary` is "there is
 * something here", `danger` is "something is wrong", `success` is "something
 * finished". A count that turns red as it grows teaches the reader that the
 * number is the problem, when it is the contents that decide.
 *
 * Note the DEFAULT is `danger`, which is why the first one below says `primary`
 * out loud: left alone, every count in a product ships red, and a bell that is
 * always red is a bell nobody reads.
 */
export function Example() {
  return (
    <Row gap={6} align="center">
      <CountBadge count={5} tone="primary" label="5 unread messages">
        <Tooltip content="Messages">
          <IconButton icon="message" aria-label="Messages" />
        </Tooltip>
      </CountBadge>

      <CountBadge count={2} tone="danger" label="2 failed jobs">
        <Tooltip content="Jobs">
          <IconButton icon="progress_activity" aria-label="Jobs" />
        </Tooltip>
      </CountBadge>

      {/* No number: the reader only needs to know there is something new. */}
      <CountBadge dot label="New activity">
        <Tooltip content="Activity">
          <IconButton icon="history" aria-label="Activity" />
        </Tooltip>
      </CountBadge>
    </Row>
  )
}
