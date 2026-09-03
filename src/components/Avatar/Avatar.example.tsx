/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { Avatar } from './Avatar'
import { Row } from '../Layout'

/* Photographs, shipped with the package (public/demo, licence noted there).
 * A letter cannot show what the disc does to a picture — that it crops it to a
 * circle and that the subject has to survive that crop. */
const FACES = [`${import.meta.env.BASE_URL}demo/avatar-ada.jpg`, `${import.meta.env.BASE_URL}demo/avatar-ben.jpg`]

/* `name` gives the initial and the label. A `src` that fails to load falls back
 * to that initial. `statusLabel` carries the presence meaning; colour alone
 * carries none. `shape="square"` stands for a team rather than a person. */
export function Example() {
  return (
    <Row gap={3}>
      <Avatar name="Ada Meridian" src={FACES[0]} />
      <Avatar name="Ben Calloway" src={FACES[1]} presence="online" statusLabel="Online" />
      <Avatar name="Cleo Nakamura" />
    </Row>
  )
}
