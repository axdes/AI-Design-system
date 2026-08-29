/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { useState } from 'react'
import { ExpandButton } from './ExpandButton'
import { Row, Stack } from '../Layout'
import { SectionLabel } from '../SectionLabel'

/* AT REST IT IS A CIRCLE; THE WORDS ARRIVE WITH THE POINTER. That is the whole
 * decision: it buys back the width a labelled button would take on every screen,
 * and it costs a reader who never hovers the words entirely. So it is for the
 * one action that is the same everywhere and already understood from its glyph
 * — add, new, ask — and never for an action a reader has to read to understand.
 *
 * `label` IS THE ACCESSIBLE NAME AT EVERY SIZE, not just when the label is
 * drawn. The collapsed circle is a control with no visible words, so without it
 * a screen reader announces a button and nothing else.
 *
 * `expanded` holds it open. It is for a control whose panel or menu is showing:
 * the button stays wide while the thing it opened is on screen, so the reader
 * can see what is open without hovering it again.
 *
 * `withChevron` adds a mark that appears WITH the label. It does not rotate and
 * it is not a disclosure caret — use it when pressing opens a list, and leave it
 * off when the glyph already says what happens.
 */
export function Example() {
  const [open, setOpen] = useState(false)

  return (
    <Stack gap={6}>
      <Stack gap={2}>
        <SectionLabel as="h3">At rest, and held open</SectionLabel>
        <Row gap={4} align="center">
          {/* The glyph says it: nothing has to be read. */}
          <ExpandButton icon="add" label="Add a participant" />

          {/* Held open, because what it opened is on screen. */}
          <ExpandButton
            icon="article"
            label="Show the transcript"
            withChevron
            expanded={open}
            onClick={() => { setOpen((v) => !v) }}
          />
        </Row>
      </Stack>

      {open && <p>Ada: let us start with what we learned from the pilot.</p>}
    </Stack>
  )
}
