/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { ChatMessage } from './ChatMessage'
import { Stack } from '../Layout'

const QUESTION = 'Can I carry unused leave into next year?'
const ANSWER = 'Up to five days carry over, and they expire at the end of March.'

/* `role` IS NOT A COLOUR, IT IS WHO IS SPEAKING, and the two turns are built
 * differently because they are different things. A user turn is a record of
 * what somebody typed: nothing to copy, nothing to rate, no actions. An
 * assistant turn is an answer, so it carries the row that lets a reader copy
 * it, hear it read out, or say it was wrong.
 *
 * `text` IS THE PLAIN VERSION and `children` is what is drawn. They are two
 * props because the visible body may be a table, a list, a chart — and copy,
 * read-aloud and feedback all need words. Passing rich children with no `text`
 * gives the reader a copy button that copies nothing.
 *
 * `onDislike` is what opens the feedback affordance. Leave it off and the row
 * simply does not offer one, which is the honest thing when nothing is
 * listening; wiring it to a handler that drops the answer on the floor is
 * worse than not asking.
 */
export function Example() {
  /* A conversation is a COLUMN, and the column's measure belongs to what the
     thread sits in — `.chat-shell-thread` supplies it in a product, and both
     places this example is shown supply one too. It used to carry half of a
     twelve-column grid instead, which was a measure of its own on top of
     theirs: on the catalogue's 32rem stage that left the turns 250px wide and
     a five-word question broke over three lines (owner, 2026-08-29). */
  return (
    <Stack gap={4}>
      <ChatMessage role="user" text={QUESTION}>{QUESTION}</ChatMessage>

      <ChatMessage role="assistant" text={ANSWER} onDislike={() => undefined}>
        {ANSWER}
      </ChatMessage>
    </Stack>
  )
}
