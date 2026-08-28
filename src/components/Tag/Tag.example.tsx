/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { useState } from 'react'
import { Tag } from './Tag'
import { Row } from '../Layout'

export function Example() {
  const [recipients, setRecipients] = useState(['Sarah', 'Ahmed'])

  /* A TAG IS A LABEL; a Chip is a control. If pressing the pill does something,
   * it is the wrong part — that is the choice this example is about, and it is
   * the one that gets made wrong.
   *
   * `onRemove` does not contradict that: the tag stays a label and gains ONE
   * control inside it, which is why `removeLabel` is required and has to name
   * WHAT is being removed. A row of buttons all announced as "Remove" tells a
   * screen-reader user nothing about which one they are on.
   *
   * `size` follows what the tag sits in, not how important it is: `sm` in a
   * table cell or a dense row, `md` beside body text. */
  return (
    <Row gap={2}>
      {recipients.map((name) => (
        <Tag key={name} onRemove={() => setRecipients((r) => r.filter((x) => x !== name))} removeLabel={`Remove ${name}`}>
          {name}
        </Tag>
      ))}
      {/* The same part with nothing to remove: a plain label, at the smaller
          scale a table cell wants. */}
      <Tag size="sm">Internal</Tag>
    </Row>
  )
}
