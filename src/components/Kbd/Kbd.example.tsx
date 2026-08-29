/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { Kbd } from './Kbd'
import { Row, Stack } from '../Layout'

/* ONE KEY PER <Kbd>, and the "+" between them is plain text — the reader is
 * pressing two keys, not one key called "Ctrl+K". A shortcut written as a
 * single block also reads as one word to a screen reader.
 *
 * This is the hint beside a command palette trigger, in a menu item, or in a
 * shortcuts sheet. It is NOT for showing a value that happens to be short: a
 * key cap says "press this", and using it as decoration makes every real
 * shortcut on the page less believable.
 *
 * `size` follows the text it sits in: `sm` inside a line of body copy or a menu
 * row, where a full-size cap would push the line height around, and `md` when
 * the shortcut is the subject rather than an aside.
 */
export function Example() {
  return (
    <Stack gap={4}>
      <p>
        Press <Kbd size="sm">Ctrl</Kbd>+<Kbd size="sm">K</Kbd> to open the command palette.
      </p>

      {/* The shortcut IS the subject here, so the caps stand at full size. */}
      <Row gap={2} align="center">
        <Kbd>Cmd</Kbd>
        <span>+</span>
        <Kbd>Shift</Kbd>
        <span>+</span>
        <Kbd>P</Kbd>
      </Row>
    </Stack>
  )
}
