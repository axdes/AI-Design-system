/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { useState } from 'react'
import { Tag } from './Tag'
import { Row } from '../Layout'

export function Example() {
  const [recipients, setRecipients] = useState(['Sarah', 'Ahmed'])

  /* Tag is the read-only counterpart to Chip: a selection token, not a button.
   * Use Chip when the pill itself is the control. */
  return (
    <Row gap={2}>
      {recipients.map((name) => (
        <Tag key={name} onRemove={() => setRecipients((r) => r.filter((x) => x !== name))} removeLabel={`Remove ${name}`}>
          {name}
        </Tag>
      ))}
    </Row>
  )
}
