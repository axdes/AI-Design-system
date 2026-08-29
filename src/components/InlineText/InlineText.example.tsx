/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { useState } from 'react'
import { InlineText } from './InlineText'
import { Stack } from '../Layout'

/* EDIT WHERE IT IS READ. The text renders as itself until somebody activates
 * it, then becomes an input in the same place at the same size, so nothing
 * moves and there is no form to open. It is for the one value a reader changes
 * in passing — a title, a name, a note. A record with four editable fields is a
 * form, and four inline editors is four different ways to be half-finished.
 *
 * `as` IS THE ELEMENT THE VALUE ALREADY IS, not a size. A document's title is
 * the page's `h2` whether or not it can be edited, so editing it must not turn
 * it into a `<span>` and take it out of the outline a screen reader walks. Pick
 * the tag the value would have if it were read-only.
 *
 * `label` is the accessible name of the input that appears — without it a
 * reader who activates the field is told nothing about what they are typing
 * into. It is not drawn: the value is its own label on the screen.
 */
export function Example() {
  const [title, setTitle] = useState('Untitled document')
  const [note, setNote] = useState('Ships in 2 to 4 business days.')

  return (
    <Stack gap={6}>
      {/* The page's heading, and it stays a heading while it is edited. */}
      <InlineText as="h2" value={title} label="Document title" onSave={setTitle} />

      {/* A line of body copy: a paragraph reading as a paragraph. */}
      <InlineText as="p" value={note} label="Delivery note" onSave={setNote} />
    </Stack>
  )
}
