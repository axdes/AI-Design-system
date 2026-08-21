/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { Avatar } from './Avatar'
import { Row } from '../Layout'

/* `name` gives the initial and the label. A `src` that fails to load falls back
 * to that initial. `statusLabel` carries the presence meaning; colour alone
 * carries none. `shape="square"` stands for a team rather than a person. */
export function Example() {
  return (
    <Row gap={3}>
      <Avatar name="Sarah Al-Mansouri" />
      <Avatar name="Omar Haddad" status="online" statusLabel="Online" />
    </Row>
  )
}
